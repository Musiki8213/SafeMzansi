import { useState, useEffect, useCallback, useRef } from 'react';
import { importLibrary } from '@googlemaps/js-api-loader';
import { MapPin, Navigation, Search, X, Info, Route, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import { reportsAPI } from '../utils/api';
import { initializeGoogleMaps, loadGoogleMapsLibrary, getPlacesServiceStatus } from '../utils/googleMaps';
import toast from 'react-hot-toast';

// Default coordinates for Johannesburg, South Africa
const DEFAULT_CENTER = { lat: -26.2041, lng: 28.0473 };
const DEFAULT_ZOOM = 13;

// Distance threshold for hotspot detection (in meters)
const HOTSPOT_DETECTION_RADIUS = 500; // 500 meters

/**
 * Format date for display
 */
const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString || 'Unknown date';
  }
};

function SafeMzansiMap() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [locationError, setLocationError] = useState(false);
  
  // Location search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const placesServiceStatus = useRef(null);
  
  // Routing state
  const [destinationQuery, setDestinationQuery] = useState('');
  const [destinationResults, setDestinationResults] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routing, setRouting] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [showRouteInfo, setShowRouteInfo] = useState(false);
  
  // Refs for markers and overlays
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const directionsService = useRef(null);
  const directionsRenderer = useRef(null);
  const unsafeRouteRenderer = useRef(null);
  const safeRouteRenderer = useRef(null);
  const userLocationMarker = useRef(null);
  const destinationMarker = useRef(null);

  /**
   * Initialize Google Maps - only called once
   * Ensures setOptions is only called once to prevent warnings
   */
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initMap = async () => {
      try {
        // Initialize Google Maps API globally (only once)
        await initializeGoogleMaps();

        // Import required libraries
        const { Map } = await loadGoogleMapsLibrary('maps');
        const { AdvancedMarkerElement } = await loadGoogleMapsLibrary('marker');
        const { AutocompleteService, PlacesService } = await loadGoogleMapsLibrary('places');
        const { InfoWindow } = await loadGoogleMapsLibrary('maps');

        // Store PlacesServiceStatus enum
        placesServiceStatus.current = getPlacesServiceStatus();

        // Initialize map centered on Johannesburg
        // Note: To remove "For development purposes only" watermark:
        // 1. Set up billing in Google Cloud Console (required even for free tier)
        // 2. Enable Maps JavaScript API
        // 3. Verify API key restrictions allow your domain
        // Map ID is required for Advanced Markers
        // Note: When mapId is present, styles must be set in Google Cloud Console, not here
        // Remove mapId if you want to use custom styles, or remove styles if using mapId
        const mapOptions = {
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          disableDefaultUI: false,
          zoomControl: true,
          scaleControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          mapTypeControl: false,
          mapId: 'DEMO_MAP_ID' // Default Map ID for Advanced Markers
          // Note: styles removed because mapId is present - styles must be configured in Google Cloud Console
        };

        map.current = new Map(mapContainer.current, mapOptions);
        console.log('Google Map initialized at Johannesburg');

        // Initialize services
        autocompleteService.current = new AutocompleteService();
        placesService.current = new PlacesService(map.current);

        // Initialize InfoWindow
        infoWindowRef.current = new InfoWindow();

        // Initialize Directions Service
        const { DirectionsService, DirectionsRenderer } = await loadGoogleMapsLibrary('routes');
        directionsService.current = new DirectionsService();
        directionsRenderer.current = new DirectionsRenderer({
          map: map.current,
          suppressMarkers: true, // We'll use custom markers
          polylineOptions: {
            strokeColor: '#10B981', // Green for safe route
            strokeWeight: 5,
            strokeOpacity: 0.8
          }
        });
        unsafeRouteRenderer.current = new DirectionsRenderer({
          map: map.current,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#DC2626', // Red for unsafe route
            strokeWeight: 5,
            strokeOpacity: 0.6
          }
        });
        safeRouteRenderer.current = new DirectionsRenderer({
          map: map.current,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#10B981', // Green for safe route
            strokeWeight: 5,
            strokeOpacity: 0.8
          }
        });

        setMapsLoaded(true);
        setLoading(false);
        
        // Get user's current location
        getUserCurrentLocation();
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        toast.error('Failed to load Google Maps');
        setLoading(false);
      }
    };

    initMap();

    // Cleanup function
    return () => {
      // Clean up markers
      markersRef.current.forEach(marker => {
        if (marker && marker.map) {
          marker.map = null;
        }
      });
      markersRef.current = [];
      
      // Close info window
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, []); // Empty dependency array - only run once

  /**
   * Fetch crime reports from API
   * Handles missing backend gracefully
   */
  useEffect(() => {
    const fetchReports = async (showToast = false) => {
      try {
        if (!showToast) setLoading(true);
        console.log('Fetching reports from API...');
        
        const response = await reportsAPI.getReports();
        
        // Handle different response formats
        const reportsData = response.reports || response.data || response || [];
        
        console.log('API Response:', response);
        console.log('Raw reports data:', reportsData);
        
        // Validate and process reports
        const validReports = reportsData
          .filter(report => {
            // Ensure report has valid coordinates
            const hasCoords = report.lat != null && report.lng != null;
            if (!hasCoords) {
              console.warn('Report missing coordinates:', report);
            }
            return hasCoords;
          })
          .map(report => ({
            id: report.id || report._id || `report_${Date.now()}_${Math.random()}`,
            title: report.title || 'Crime Report',
            description: report.description || '',
            createdAt: report.createdAt || report.date || new Date().toISOString(),
            lat: parseFloat(report.lat),
            lng: parseFloat(report.lng)
          }));
        
        console.log('Loaded reports:', validReports);
        console.log(`Total valid reports: ${validReports.length}`);
        
        setReports(validReports);
        
        if (validReports.length === 0 && !showToast) {
          console.log('No reports found in response');
        }
      } catch (error) {
        // Handle missing backend gracefully (404 is expected if backend isn't running)
        if (error.message.includes('Network error') || 
            error.message.includes('Failed to fetch') ||
            error.message.includes('404') ||
            error.message.includes('Route not found')) {
          // Silently handle 404 - backend may not be running
          if (!showToast) {
            console.log('Backend not available - showing empty map. This is normal if backend server is not running.');
            toast.info('Backend not connected. Map will show reports when backend is available.', {
              duration: 3000
            });
          }
          setReports([]);
        } else {
          if (!showToast) {
            console.error('Error fetching reports:', error);
            toast.error('Failed to load crime reports');
          }
          setReports([]);
        }
      } finally {
        if (!showToast) setLoading(false);
      }
    };

    // Initial fetch
    fetchReports();

    // Set up periodic polling every 30 seconds for real-time updates
    const pollInterval = setInterval(() => {
      fetchReports(true); // Don't show loading/toasts on polling
    }, 30000);

    return () => clearInterval(pollInterval);
  }, []);

  /**
   * Show InfoWindow with crime report details
   * Popup shows: title, description, createdAt
   */
  const showInfoWindow = useCallback((report, position) => {
    if (!map.current || !infoWindowRef.current) return;

    const content = `
        <div class="crime-popup-content">
          <div class="popup-header">
          <h3 style="margin: 0; color: #1D3557; font-size: 1.125rem; font-weight: 700;">
            ${report.title || 'Crime Report'}
          </h3>
        </div>
        ${report.description ? `
          <p style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(29, 53, 87, 0.1); color: #2B2D42; font-size: 0.875rem; line-height: 1.5;">
            ${report.description}
          </p>
        ` : ''}
        <p style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(29, 53, 87, 0.1); color: #666; font-size: 0.875rem; display: flex; align-items: center;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            ${formatDate(report.createdAt)}
          </p>
        </div>
      `;

    infoWindowRef.current.setContent(content);
    infoWindowRef.current.setPosition(position);
    infoWindowRef.current.open(map.current);
  }, []);

  /**
   * Add red markers for all crime reports (hotspots)
   * All markers are red as specified
   */
  useEffect(() => {
    if (!map.current || !mapsLoaded) return;

    const updateMarkers = async () => {
      try {
        const { AdvancedMarkerElement } = await loadGoogleMapsLibrary('marker');

        // Remove existing markers
        markersRef.current.forEach(marker => {
          if (marker && marker.map) {
            marker.map = null;
          }
        });
    markersRef.current = [];
    
        console.log(`Adding ${reports.length} markers to map`);

        // Add red markers for each report
        for (const report of reports) {
          // Create red pin element
      const el = document.createElement('div');
          el.className = 'hotspot-marker';
      
      el.innerHTML = `
            <svg width="32" height="48" viewBox="0 0 32 48" style="cursor: pointer; transition: all 0.3s ease; filter: drop-shadow(0 2px 8px rgba(220, 38, 38, 0.4));">
              <path fill="#DC2626" stroke="#B91C1C" stroke-width="3" d="M16 0C7.163 0 0 7.163 0 16c0 16 16 32 16 32s16-16 16-32C32 7.163 24.837 0 16 0z"/>
              <circle fill="white" cx="16" cy="16" r="6"/>
        </svg>
      `;
      el.style.cssText = 'cursor: pointer; transition: all 0.3s ease; animation: pin-appear 0.5s ease-out;';

          // Add hover effects
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.3) translateY(-4px)';
            el.style.filter = 'brightness(1.3) drop-shadow(0 6px 16px rgba(220, 38, 38, 0.6))';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1) translateY(0)';
            el.style.filter = 'drop-shadow(0 2px 8px rgba(220, 38, 38, 0.4))';
      });

      // Create marker
          const marker = new AdvancedMarkerElement({
            map: map.current,
            position: { lat: report.lat, lng: report.lng },
            content: el
          });

          // Add click handler to show popup
      el.addEventListener('click', () => {
            showInfoWindow(report, { lat: report.lat, lng: report.lng });
      });

      markersRef.current.push(marker);
        }

        console.log(`Successfully added ${markersRef.current.length} markers`);
      } catch (error) {
        console.error('Error updating markers:', error);
      }
    };

    updateMarkers();
  }, [reports, mapsLoaded, showInfoWindow]);

  /**
   * Handle location search with Google Places Autocomplete
   */
  useEffect(() => {
    if (!autocompleteService.current || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      autocompleteService.current.getPlacePredictions(
        {
          input: searchQuery,
          componentRestrictions: { country: 'za' },
          types: ['geocode']
        },
        (predictions, status) => {
          if (placesServiceStatus.current && status === placesServiceStatus.current.OK && predictions) {
            setSearchResults(predictions.map(prediction => ({
              placeId: prediction.place_id,
              name: prediction.description
            })));
          } else {
            setSearchResults([]);
          }
        }
      );
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  /**
   * Center map on selected location from search
   */
  const centerOnLocation = (placeId) => {
    if (!map.current || !placesService.current) return;

    placesService.current.getDetails(
      { placeId },
      (place, status) => {
        if (placesServiceStatus.current && status === placesServiceStatus.current.OK && place.geometry) {
          const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          };
          
          // Smooth transition to new location
          map.current.panTo(location);
          map.current.setZoom(15);
          
    setSearchQuery('');
    setSearchResults([]);
          toast.success('Location found');
        }
      }
    );
  };

  /**
   * Get user's current location and set it
   */
  const getUserCurrentLocation = useCallback(() => {
    if (!navigator.geolocation || !map.current) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setUserLocation(location);
        setLocationError(false);
        
        // Add user location marker
        if (userLocationMarker.current) {
          userLocationMarker.current.map = null;
        }
        
        try {
          const { AdvancedMarkerElement } = await loadGoogleMapsLibrary('marker');
          const el = document.createElement('div');
          el.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 32 32" style="filter: drop-shadow(0 2px 8px rgba(16, 185, 129, 0.4));">
              <circle fill="#10B981" stroke="#059669" stroke-width="3" cx="16" cy="16" r="12"/>
              <circle fill="white" cx="16" cy="16" r="6"/>
            </svg>
          `;
          
          userLocationMarker.current = new AdvancedMarkerElement({
            map: map.current,
            position: location,
            content: el
          });
        } catch (error) {
          console.error('Error creating user location marker:', error);
        }
      },
      (error) => {
        setLocationError(true);
        console.log('Unable to access location:', error);
      }
    );
  }, []);

  /**
   * Center on user's current location
   */
  const centerOnUser = () => {
    if (!userLocation) {
      getUserCurrentLocation();
      return;
    }
    
    map.current.panTo(userLocation);
    map.current.setZoom(15);
    toast.success('Centered on your location');
  };

  /**
   * Calculate distance between two points (Haversine formula)
   */
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  };

  /**
   * Check if route passes through any hotspots
   */
  const checkRouteForHotspots = (route) => {
    const hotspots = [];
    
    if (!route.legs || !route.legs.length) return hotspots;
    
    // Get all points along the route
    const routePoints = [];
    route.legs.forEach(leg => {
      leg.steps.forEach(step => {
        const path = step.path || [];
        path.forEach(point => {
          routePoints.push({
            lat: point.lat(),
            lng: point.lng()
          });
        });
      });
    });
    
    // Check each report against route points
    reports.forEach(report => {
      routePoints.forEach(point => {
        const distance = calculateDistance(
          point.lat, point.lng,
          report.lat, report.lng
        );
        
        if (distance <= HOTSPOT_DETECTION_RADIUS) {
          // Check if this hotspot is already in the list
          const exists = hotspots.find(h => h.id === report.id);
          if (!exists) {
            hotspots.push(report);
          }
        }
      });
    });
    
    return hotspots;
  };

  /**
   * Calculate route with waypoints to avoid hotspots
   */
  const calculateSafeRoute = async (origin, dest, hotspots) => {
    if (!directionsService.current) return null;
    
    // Try to create waypoints that avoid hotspots
    // Simple approach: create waypoints around hotspots
    const waypoints = [];
    const usedHotspots = new Set();
    
    hotspots.forEach(hotspot => {
      if (usedHotspots.has(hotspot.id)) return;
      
      // Create a waypoint offset from the hotspot
      // Offset by ~1km in a perpendicular direction
      const offset = 0.01; // ~1km
      const waypoint = {
        location: {
          lat: hotspot.lat + offset,
          lng: hotspot.lng + offset
        },
        stopover: false
      };
      
      waypoints.push(waypoint);
      usedHotspots.add(hotspot.id);
    });
    
    return new Promise((resolve) => {
      directionsService.current.route(
        {
          origin: origin,
          destination: dest,
          waypoints: waypoints.length > 0 ? waypoints : undefined,
          travelMode: window.google.maps.TravelMode.DRIVING,
          avoidHighways: false,
          avoidTolls: false,
          optimizeWaypoints: true
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            resolve(result);
          } else {
            resolve(null);
          }
        }
      );
    });
  };

  /**
   * Calculate route from user location to destination
   */
  const calculateRoute = async () => {
    if (!userLocation || !destination || !directionsService.current) {
      toast.error('Please set your location and destination');
      return;
    }
    
    setRouting(true);
    
    try {
      // First, get the standard route
      directionsService.current.route(
        {
          origin: userLocation,
          destination: destination.location,
          travelMode: window.google.maps.TravelMode.DRIVING
        },
        async (result, status) => {
          if (status !== window.google.maps.DirectionsStatus.OK) {
            toast.error('Unable to calculate route');
            setRouting(false);
            return;
          }
          
          // Check for hotspots along the route
          const hotspots = checkRouteForHotspots(result);
          
          if (hotspots.length > 0) {
            // Route passes through hotspots - show warning and calculate safe route
            setShowWarning(true);
            setRouteInfo({
              unsafeRoute: result,
              hotspots: hotspots,
              distance: result.routes[0].legs[0].distance.text,
              duration: result.routes[0].legs[0].duration.text
            });
            
            // Display unsafe route in red
            unsafeRouteRenderer.current.setDirections(result);
            
            // Try to calculate a safer route
            const safeRoute = await calculateSafeRoute(userLocation, destination.location, hotspots);
            
            if (safeRoute) {
              const safeHotspots = checkRouteForHotspots(safeRoute);
              setRouteInfo(prev => ({
                ...prev,
                safeRoute: safeRoute,
                safeHotspots: safeHotspots,
                safeDistance: safeRoute.routes[0].legs.reduce((sum, leg) => sum + leg.distance.value, 0) / 1000,
                safeDuration: safeRoute.routes[0].legs.reduce((sum, leg) => sum + leg.duration.value, 0)
              }));
              
              // Display safe route in green
              safeRouteRenderer.current.setDirections(safeRoute);
              
              // Fit bounds to show both routes
              const bounds = new window.google.maps.LatLngBounds();
              result.routes[0].bounds.forEach(bound => bounds.extend(bound));
              safeRoute.routes[0].bounds.forEach(bound => bounds.extend(bound));
              map.current.fitBounds(bounds);
            } else {
              // Couldn't find alternative route
              setRouteInfo(prev => ({
                ...prev,
                safeRoute: null
              }));
            }
          } else {
            // Route is safe - no hotspots
            directionsRenderer.current.setDirections(result);
            
            // Fit bounds to route
            map.current.fitBounds(result.routes[0].bounds);
            
            toast.success('Route calculated - No hotspots detected!');
            setRouteInfo({
              unsafeRoute: null,
              safeRoute: result,
              hotspots: [],
              distance: result.routes[0].legs[0].distance.text,
              duration: result.routes[0].legs[0].duration.text
            });
            setShowRouteInfo(true);
          }
          
          setRouting(false);
        }
      );
    } catch (error) {
      console.error('Error calculating route:', error);
      toast.error('Failed to calculate route');
      setRouting(false);
    }
  };

  /**
   * Clear routes
   */
  const clearRoutes = () => {
    if (directionsRenderer.current) {
      directionsRenderer.current.setDirections({ routes: [] });
    }
    if (unsafeRouteRenderer.current) {
      unsafeRouteRenderer.current.setDirections({ routes: [] });
    }
    if (safeRouteRenderer.current) {
      safeRouteRenderer.current.setDirections({ routes: [] });
    }
    if (destinationMarker.current) {
      destinationMarker.current.map = null;
      destinationMarker.current = null;
    }
    setDestination(null);
    setDestinationQuery('');
    setShowWarning(false);
    setShowRouteInfo(false);
    setRouteInfo(null);
  };

  /**
   * Handle destination search
   */
  useEffect(() => {
    if (!autocompleteService.current || !destinationQuery.trim()) {
      setDestinationResults([]);
      return;
    }

    const timer = setTimeout(() => {
      autocompleteService.current.getPlacePredictions(
        {
          input: destinationQuery,
          componentRestrictions: { country: 'za' },
          types: ['geocode', 'establishment']
        },
        (predictions, status) => {
          if (placesServiceStatus.current && status === placesServiceStatus.current.OK && predictions) {
            setDestinationResults(predictions.map(prediction => ({
              placeId: prediction.place_id,
              name: prediction.description
            })));
          } else {
            setDestinationResults([]);
          }
        }
      );
    }, 500);

    return () => clearTimeout(timer);
  }, [destinationQuery]);

  /**
   * Set destination from search
   */
  const setDestinationFromSearch = async (placeId) => {
    if (!placesService.current) return;
    
    placesService.current.getDetails(
      { placeId },
      async (place, status) => {
        if (placesServiceStatus.current && status === placesServiceStatus.current.OK && place.geometry) {
          const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          };
          
          setDestination({
            placeId: placeId,
            location: location,
            name: place.name || place.formatted_address
          });
          
          setDestinationQuery(place.name || place.formatted_address);
          setDestinationResults([]);
          
          // Add destination marker
          if (destinationMarker.current) {
            destinationMarker.current.map = null;
          }
          
          try {
            const { AdvancedMarkerElement } = await loadGoogleMapsLibrary('marker');
            const el = document.createElement('div');
            el.innerHTML = `
              <svg width="32" height="48" viewBox="0 0 32 48" style="filter: drop-shadow(0 2px 8px rgba(59, 130, 246, 0.4));">
                <path fill="#3B82F6" stroke="#2563EB" stroke-width="3" d="M16 0C7.163 0 0 7.163 0 16c0 16 16 32 16 32s16-16 16-32C32 7.163 24.837 0 16 0z"/>
                <circle fill="white" cx="16" cy="16" r="6"/>
              </svg>
            `;
            
            destinationMarker.current = new AdvancedMarkerElement({
              map: map.current,
              position: location,
              content: el
            });
            
            // Automatically calculate route if user location is available
            if (userLocation) {
              calculateRoute();
            } else {
              toast.info('Getting your location...');
              getUserCurrentLocation();
              // Route will be calculated once location is set
            }
          } catch (error) {
            console.error('Error creating destination marker:', error);
          }
        }
      }
    );
  };
  
  // Auto-calculate route when both user location and destination are set
  useEffect(() => {
    if (userLocation && destination && !routing) {
      calculateRoute();
    }
  }, [userLocation, destination]);

  return (
    <div className="map-page">
      <div className="map-container">
        <div ref={mapContainer} className="map-container-inner" />
        
        {/* Loading Spinner */}
        {loading && (
          <div className="map-loading">
            <div className="loading-spinner"></div>
            <p>Loading map and crime reports...</p>
          </div>
        )}

        {/* Location error message */}
        {locationError && (
          <div className="map-location-error">
            <p>Unable to access your location</p>
          </div>
        )}

        {/* Search Bar */}
        <div className="map-search-bar glassy-overlay">
          <div className="search-input-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location or address..."
              className="search-input"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="search-clear"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((result) => (
                <div
                  key={result.placeId}
                  className="search-result-item"
                  onClick={() => centerOnLocation(result.placeId)}
                >
                  <MapPin className="w-4 h-4" />
                  <span>{result.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Destination Search Bar */}
        <div className="destination-search-bar glassy-overlay" style={{ top: '80px', left: '20px', right: 'auto', width: '350px' }}>
          <div className="search-input-wrapper">
            <Route className="search-icon" style={{ color: '#3B82F6' }} />
            <input
              type="text"
              value={destinationQuery}
              onChange={(e) => setDestinationQuery(e.target.value)}
              placeholder="Enter destination..."
              className="search-input"
            />
            {destinationQuery && (
              <button
                onClick={clearRoutes}
                className="search-clear"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Destination Results */}
          {destinationResults.length > 0 && (
            <div className="search-results">
              {destinationResults.map((result) => (
                <div
                  key={result.placeId}
                  className="search-result-item"
                  onClick={() => setDestinationFromSearch(result.placeId)}
                >
                  <MapPin className="w-4 h-4" />
                  <span>{result.name}</span>
                </div>
              ))}
            </div>
          )}
          
          {routing && (
            <div className="routing-indicator" style={{ padding: '0.5rem', textAlign: 'center', color: '#666' }}>
              <Loader className="w-4 h-4 animate-spin inline mr-2" />
              Calculating route...
            </div>
          )}
        </div>

        {/* Map Controls */}
        <div className="map-controls glassy-overlay">
            <button
            onClick={centerOnUser}
            className="control-btn"
            title="Center on my location"
          >
            <Navigation className="w-5 h-5" />
            <span>My Location</span>
                </button>
        </div>

        {/* Legend */}
        <div className="map-legend glassy-overlay">
          <div className="legend-header">
            <Info className="legend-icon" />
            <h4>Hotspots</h4>
          </div>
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-pin verified-pin"></div>
              <span className="legend-label">Crime Report</span>
            </div>
            {routeInfo && (
              <>
                <div className="legend-item" style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '20px', height: '3px', backgroundColor: '#DC2626' }}></div>
                    <span className="legend-label" style={{ fontSize: '0.75rem' }}>Unsafe Route</span>
                  </div>
                </div>
                <div className="legend-item" style={{ marginTop: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '20px', height: '3px', backgroundColor: '#10B981' }}></div>
                    <span className="legend-label" style={{ fontSize: '0.75rem' }}>Safe Route</span>
                  </div>
                </div>
              </>
            )}
            <div className="legend-item" style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.3)' }}>
              <span className="legend-label" style={{ fontSize: '0.7rem', color: '#666' }}>
                {reports.length} report{reports.length !== 1 ? 's' : ''} loaded
              </span>
            </div>
          </div>
        </div>

        {/* Warning Modal */}
        {showWarning && routeInfo && (
          <div className="warning-modal-overlay" onClick={() => setShowWarning(false)}>
            <div className="warning-modal glassy-card" onClick={(e) => e.stopPropagation()}>
              <div className="warning-header">
                <AlertTriangle className="w-6 h-6" style={{ color: '#DC2626' }} />
                <h2>Route Safety Warning</h2>
              </div>
              <div className="warning-content">
                <p style={{ marginBottom: '1rem', color: '#666' }}>
                  Your route passes through <strong>{routeInfo.hotspots.length}</strong> crime hotspot{routeInfo.hotspots.length !== 1 ? 's' : ''} within 500 meters.
                </p>
                
                {routeInfo.safeRoute ? (
                  <div className="route-comparison">
                    <div className="route-option unsafe-route">
                      <div className="route-header">
                        <div style={{ width: '20px', height: '3px', backgroundColor: '#DC2626', marginRight: '0.5rem' }}></div>
                        <span><strong>Unsafe Route</strong></span>
                      </div>
                      <div className="route-details">
                        <span>{routeInfo.distance}</span>
                        <span>•</span>
                        <span>{routeInfo.duration}</span>
                      </div>
                    </div>
                    
                    <div className="route-option safe-route" style={{ marginTop: '1rem' }}>
                      <div className="route-header">
                        <div style={{ width: '20px', height: '3px', backgroundColor: '#10B981', marginRight: '0.5rem' }}></div>
                        <span><strong>Safer Alternative</strong></span>
                        <CheckCircle className="w-4 h-4" style={{ color: '#10B981', marginLeft: '0.5rem' }} />
                      </div>
                      <div className="route-details">
                        <span>{(routeInfo.safeDistance || 0).toFixed(1)} km</span>
                        <span>•</span>
                        <span>{Math.floor((routeInfo.safeDuration || 0) / 60)} min</span>
                      </div>
                      {routeInfo.safeHotspots && routeInfo.safeHotspots.length > 0 && (
                        <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                          Still passes {routeInfo.safeHotspots.length} hotspot{routeInfo.safeHotspots.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="no-alternative">
                    <p style={{ color: '#666' }}>
                      Unable to find a safer alternative route. Please exercise caution.
                    </p>
                  </div>
                )}
              </div>
              <div className="warning-actions">
                <button
                  onClick={() => setShowWarning(false)}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Route Info Panel */}
        {showRouteInfo && routeInfo && !showWarning && (
          <div className="route-info-panel glassy-overlay" style={{ bottom: '20px', left: '20px', right: 'auto', width: '300px' }}>
            <div className="route-info-header">
              <CheckCircle className="w-5 h-5" style={{ color: '#10B981' }} />
              <h4>Safe Route</h4>
              <button onClick={() => setShowRouteInfo(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="route-info-content">
              <div className="route-stat">
                <span>Distance:</span>
                <strong>{routeInfo.distance}</strong>
              </div>
              <div className="route-stat">
                <span>Duration:</span>
                <strong>{routeInfo.duration}</strong>
              </div>
              <div className="route-stat">
                <span>Hotspots:</span>
                <strong style={{ color: '#10B981' }}>0</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SafeMzansiMap;
