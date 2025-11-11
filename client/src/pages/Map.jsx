import { useState, useEffect, useCallback, useRef } from 'react';
import { importLibrary } from '@googlemaps/js-api-loader';
import { MapPin, Navigation, Search, X, Info, Route, AlertTriangle, CheckCircle, Loader, Bell } from 'lucide-react';
import { reportsAPI } from '../utils/api';
import { initializeGoogleMaps, loadGoogleMapsLibrary, getPlacesServiceStatus } from '../utils/googleMaps';
import { requestNotificationPermission, notifyNewReport, isNotificationSupported } from '../utils/notifications';
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
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [startQuery, setStartQuery] = useState('');
  const [startResults, setStartResults] = useState([]);
  const [destinationQuery, setDestinationQuery] = useState('');
  const [destinationResults, setDestinationResults] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [startLocation, setStartLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routing, setRouting] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [showRouteInfo, setShowRouteInfo] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(false);
  const startLocationMarker = useRef(null);
  
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
   * Request notification permission on mount
   */
  useEffect(() => {
    if (isNotificationSupported()) {
      requestNotificationPermission().then(permitted => {
        setNotificationPermission(permitted);
        if (permitted) {
          console.log('Notification permission granted');
        } else {
          console.log('Notification permission denied or not requested');
        }
      });
    }
  }, []);

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

  const lastReportIdsRef = useRef(new Set()); // Track IDs of reports we've already seen

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
            title: report.title || `${report.type || 'Crime'} Report`,
            description: report.description || '',
            type: report.type || 'Crime',
            createdAt: report.createdAt || report.date || new Date().toISOString(),
            lat: parseFloat(report.lat),
            lng: parseFloat(report.lng)
          }));
        
        // Check for new reports (not in our last seen set)
        if (!showToast && lastReportIdsRef.current.size > 0) {
          const newReports = validReports.filter(report => 
            !lastReportIdsRef.current.has(report.id)
          );
          
          if (newReports.length > 0) {
            // Show notifications for new reports
            newReports.forEach(report => {
              // Toast notification (in-app)
              toast.success(
                `🚨 New ${report.type} report near ${report.title || 'your area'}`,
                {
                  duration: 5000,
                  icon: '🚨',
                  style: {
                    background: '#DC2626',
                    color: 'white',
                    fontWeight: '600'
                  }
                }
              );
              
              // Browser notification (system notification)
              notifyNewReport({
                id: report.id,
                type: report.type,
                location: report.title || 'Unknown Location',
                description: report.description || ''
              });
            });
          }
        }
        
        // Update last seen IDs
        lastReportIdsRef.current = new Set(validReports.map(report => report.id));
        
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

    // Set up periodic polling every 15 seconds for faster real-time updates
    const pollInterval = setInterval(() => {
      fetchReports(true); // Don't show loading/toasts on polling, but show new report notifications
    }, 15000);

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
  const checkRouteForHotspots = (directionsResult) => {
    const hotspots = [];
    
    if (!directionsResult || !directionsResult.routes || !directionsResult.routes.length) {
      return hotspots;
    }
    
    const route = directionsResult.routes[0];
    if (!route.legs || !route.legs.length) return hotspots;
    
    // Get all points along the route
    const routePoints = [];
    route.legs.forEach(leg => {
      if (leg.steps) {
        leg.steps.forEach(step => {
          // Get path from step
          if (step.path) {
            step.path.forEach(point => {
              routePoints.push({
                lat: point.lat(),
                lng: point.lng()
              });
            });
          } else if (step.start_location && step.end_location) {
            // Fallback: use start and end locations
            routePoints.push({
              lat: step.start_location.lat(),
              lng: step.start_location.lng()
            });
            routePoints.push({
              lat: step.end_location.lat(),
              lng: step.end_location.lng()
            });
          }
        });
      }
    });
    
    // Check each report against route points
    reports.forEach(report => {
      let found = false;
      for (const point of routePoints) {
        const distance = calculateDistance(
          point.lat, point.lng,
          report.lat, report.lng
        );
        
        if (distance <= HOTSPOT_DETECTION_RADIUS) {
          found = true;
          break;
        }
      }
      
      if (found) {
        // Check if this hotspot is already in the list
        const exists = hotspots.find(h => h.id === report.id);
        if (!exists) {
          hotspots.push(report);
        }
      }
    });
    
    return hotspots;
  };

  /**
   * Check if a location is far enough from all hotspots
   */
  const isLocationSafe = (location, hotspots, minDistance = 1000) => {
    for (const hotspot of hotspots) {
      const distance = calculateDistance(
        location.lat, location.lng,
        hotspot.lat, hotspot.lng
      );
      if (distance < minDistance) {
        return false;
      }
    }
    return true;
  };

  /**
   * Calculate route with waypoints to avoid hotspots
   * Tries multiple aggressive strategies to find a route that avoids all hotspots
   * Will accept longer routes as long as they avoid hotspots
   */
  const calculateSafeRoute = async (origin, dest, hotspots, originalHotspotCount = null) => {
    if (!directionsService.current || !hotspots.length) return null;
    
    console.log(`Attempting to find safe route avoiding ${hotspots.length} hotspots...`);
    let bestRoute = null;
    let bestHotspotCount = originalHotspotCount || Infinity;
    let bestRouteDistance = Infinity;
    let bestRouteDuration = Infinity;
    
    // Get original route distance and duration for comparison
    let originalRouteDistance = Infinity;
    let originalRouteDuration = Infinity;
    try {
      const originalRoute = await new Promise((resolve) => {
        directionsService.current.route(
          {
            origin: origin,
            destination: dest,
            travelMode: window.google.maps.TravelMode.DRIVING
          },
          (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK && result) {
              const totalDistance = result.routes[0].legs.reduce((sum, leg) => sum + leg.distance.value, 0);
              const totalDuration = result.routes[0].legs.reduce((sum, leg) => sum + leg.duration.value, 0);
              originalRouteDistance = totalDistance;
              originalRouteDuration = totalDuration;
              resolve(result);
            } else {
              resolve(null);
            }
          }
        );
      });
    } catch (error) {
      console.log('Could not get original route for comparison');
    }
    
    console.log(`Original route: ${(originalRouteDistance / 1000).toFixed(2)} km, ${Math.floor(originalRouteDuration / 60)} min`);
    
    // Set a timeout to ensure we return within seconds
    const startTime = Date.now();
    const MAX_SEARCH_TIME = 5000; // 5 seconds max
    
    // Create waypoints in multiple directions around each hotspot
    // Only use waypoints that are verified to be far enough from hotspots
    const createAvoidanceWaypoints = (hotspots, offsetDistance, directionIndex = 0, minSafeDistance = 1000, originPoint = null) => {
      const waypoints = [];
      const usedHotspots = new Set();
      const MAX_WAYPOINTS = 23; // Google Maps allows max 25 waypoints, but we'll use 23 to be safe
      
      // 8 directions: N, NE, E, SE, S, SW, W, NW
      const directions = [
        { lat: offsetDistance, lng: 0 },           // North
        { lat: offsetDistance, lng: offsetDistance }, // Northeast
        { lat: 0, lng: offsetDistance },            // East
        { lat: -offsetDistance, lng: offsetDistance }, // Southeast
        { lat: -offsetDistance, lng: 0 },           // South
        { lat: -offsetDistance, lng: -offsetDistance }, // Southwest
        { lat: 0, lng: -offsetDistance },           // West
        { lat: offsetDistance, lng: -offsetDistance }  // Northwest
      ];
      
      // Only process hotspots that are between origin and destination
      // This reduces the number of waypoints needed
      let sortedHotspots = [...hotspots];
      
      // Sort by distance from origin to prioritize closer hotspots (if origin is provided)
      if (originPoint) {
        sortedHotspots = sortedHotspots.sort((a, b) => {
          const distA = calculateDistance(originPoint.lat, originPoint.lng, a.lat, a.lng);
          const distB = calculateDistance(originPoint.lat, originPoint.lng, b.lat, b.lng);
          return distA - distB;
        });
      }
      
      for (const hotspot of sortedHotspots) {
        if (usedHotspots.has(hotspot.id) || waypoints.length >= MAX_WAYPOINTS) break;
        
        // Try all 8 directions to find a safe waypoint
        let foundSafe = false;
        for (let dirOffset = 0; dirOffset < 8; dirOffset++) {
          const dirIndex = (directionIndex + dirOffset) % directions.length;
          const direction = directions[dirIndex];
          
          const waypointLocation = {
            lat: hotspot.lat + direction.lat,
            lng: hotspot.lng + direction.lng
          };
          
          // Verify this waypoint is safe (far enough from all hotspots)
          if (isLocationSafe(waypointLocation, hotspots, minSafeDistance)) {
            waypoints.push({
              location: waypointLocation,
              stopover: false
            });
            usedHotspots.add(hotspot.id);
            foundSafe = true;
            break;
          }
        }
        
        // If no safe waypoint found in 8 directions, try with larger offset
        if (!foundSafe && waypoints.length < MAX_WAYPOINTS) {
          // Try with 2x the offset
          for (let dirOffset = 0; dirOffset < 8; dirOffset++) {
            const dirIndex = (directionIndex + dirOffset) % directions.length;
            const direction = directions[dirIndex];
            
            const waypointLocation = {
              lat: hotspot.lat + (direction.lat * 2),
              lng: hotspot.lng + (direction.lng * 2)
            };
            
            if (isLocationSafe(waypointLocation, hotspots, minSafeDistance)) {
              waypoints.push({
                location: waypointLocation,
                stopover: false
              });
              usedHotspots.add(hotspot.id);
              foundSafe = true;
              break;
            }
          }
        }
      }
      
      console.log(`Created ${waypoints.length} waypoints to avoid ${usedHotspots.size} hotspots`);
      return waypoints;
    };
    
    // Optimized strategy list - fewer strategies, focused on efficiency
    // Prioritize faster routes (time-saving) while avoiding hotspots
    const strategies = [
      // Phase 1: Small, efficient offsets (try fastest routes first)
      { offset: 0.015, avoidHighways: false, direction: 0, minSafe: 1000 },   // ~1.5km - small detour
      { offset: 0.02, avoidHighways: false, direction: 0, minSafe: 1000 },    // ~2km
      { offset: 0.02, avoidHighways: false, direction: 2, minSafe: 1000 },    // ~2km, different direction
      { offset: 0.02, avoidHighways: true, direction: 0, minSafe: 1000 },    // ~2km, avoid highways (may be faster in city)
      
      // Phase 2: Medium offsets (if small ones don't work)
      { offset: 0.03, avoidHighways: false, direction: 0, minSafe: 1500 },    // ~3km
      { offset: 0.03, avoidHighways: true, direction: 0, minSafe: 1500 },      // ~3km, avoid highways
      
      // Phase 3: Larger offsets (last resort - may be longer but safer)
      { offset: 0.05, avoidHighways: false, direction: 0, minSafe: 2000 },      // ~5km
      { offset: 0.05, avoidHighways: true, direction: 0, minSafe: 2000 },      // ~5km, avoid highways
    ];
    
    // Try each strategy with timeout check
    for (const strategy of strategies) {
      // Check if we've exceeded time limit
      if (Date.now() - startTime > MAX_SEARCH_TIME) {
        console.log('Time limit reached, returning best route found so far');
        break;
      }
      
      const waypoints = createAvoidanceWaypoints(hotspots, strategy.offset, strategy.direction, strategy.minSafe, origin);
      
      // Skip if we couldn't create safe waypoints
      if (waypoints.length === 0) {
        continue;
      }
      
      try {
        const route = await new Promise((resolve) => {
          const request = {
            origin: origin,
            destination: dest,
            travelMode: window.google.maps.TravelMode.DRIVING,
            avoidHighways: strategy.avoidHighways,
            avoidTolls: false,
            optimizeWaypoints: false
          };
          
          if (waypoints.length > 0) {
            request.waypoints = waypoints.slice(0, 23);
          }
          
          directionsService.current.route(request, (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
              resolve(result);
            } else {
              resolve(null);
            }
          });
        });
        
        if (route) {
          const routeHotspots = checkRouteForHotspots(route);
          const totalDistance = route.routes[0].legs.reduce((sum, leg) => sum + leg.distance.value, 0);
          const totalDuration = route.routes[0].legs.reduce((sum, leg) => sum + leg.duration.value, 0);
          const isFaster = totalDuration <= originalRouteDuration;
          const isShorter = totalDistance <= originalRouteDistance;
          const efficiencyScore = (originalRouteDuration / totalDuration) * (originalRouteDistance / totalDistance); // Higher is better
          
          console.log(`Strategy (offset: ${strategy.offset}) - ${routeHotspots.length} hotspots, ${(totalDistance / 1000).toFixed(2)} km, ${Math.floor(totalDuration / 60)} min (${isFaster ? 'FASTER' : 'slower'}, ${isShorter ? 'SHORTER' : 'longer'})`);
          
          // Perfect route (zero hotspots) - prioritize fast and short
          if (routeHotspots.length === 0) {
            // If it's faster AND shorter, return immediately
            if (isFaster && isShorter) {
              console.log(`✅ Found perfect route: faster AND shorter!`);
              return route;
            }
            // If it's faster OR not much longer (within 20%), return immediately
            if (isFaster || (totalDuration <= originalRouteDuration * 1.2 && totalDistance <= originalRouteDistance * 1.2)) {
              console.log(`✅ Found perfect route: efficient!`);
              return route;
            }
            // Otherwise save it but continue
            if (!bestRoute || routeHotspots.length < bestHotspotCount || 
                (routeHotspots.length === bestHotspotCount && totalDuration < bestRouteDuration)) {
              bestRoute = route;
              bestHotspotCount = routeHotspots.length;
              bestRouteDistance = totalDistance;
              bestRouteDuration = totalDuration;
            }
          } 
          // Better hotspot count - prefer faster routes
          else if (routeHotspots.length < bestHotspotCount) {
            bestRoute = route;
            bestHotspotCount = routeHotspots.length;
            bestRouteDistance = totalDistance;
            bestRouteDuration = totalDuration;
            // If it's significantly better (fewer hotspots) and efficient, return early
            if (routeHotspots.length === 0 || (routeHotspots.length < originalHotspotCount / 2 && isFaster)) {
              console.log(`✅ Found much better route, returning early`);
              return route;
            }
          } 
          // Same hotspot count - prefer faster and shorter
          else if (routeHotspots.length === bestHotspotCount) {
            const currentEfficiency = (originalRouteDuration / bestRouteDuration) * (originalRouteDistance / bestRouteDistance);
            if (totalDuration < bestRouteDuration || (totalDuration === bestRouteDuration && totalDistance < bestRouteDistance) ||
                efficiencyScore > currentEfficiency) {
              bestRoute = route;
              bestRouteDistance = totalDistance;
              bestRouteDuration = totalDuration;
            }
          }
        }
      } catch (error) {
        console.error('Error calculating route:', error);
        continue;
      }
    }
    
    // Skip bounding box and last resort strategies if we already have a good route and time is running out
    if (bestRoute && bestHotspotCount === 0 && Date.now() - startTime < MAX_SEARCH_TIME * 0.7) {
      console.log('Found perfect route early, skipping advanced strategies');
      return bestRoute;
    }
    
    // If standard waypoints don't work, try routing around the bounding box of hotspots (only if we have time)
    if (Date.now() - startTime < MAX_SEARCH_TIME * 0.8) {
      try {
        const hotspotBounds = new window.google.maps.LatLngBounds();
      hotspots.forEach(hotspot => {
        hotspotBounds.extend({ lat: hotspot.lat, lng: hotspot.lng });
      });
      
      const center = hotspotBounds.getCenter();
      const ne = hotspotBounds.getNorthEast();
      const sw = hotspotBounds.getSouthWest();
      const nw = { lat: ne.lat(), lng: sw.lng() };
      const se = { lat: sw.lat(), lng: ne.lng() };
      
      // Try multiple bounding box strategies with verified safe waypoints
      const boundingBoxOffsets = [0.03, 0.05, 0.08, 0.1, 0.15]; // Increasing distances
      
      for (const offset of boundingBoxOffsets) {
        const strategies = [
          // Go around the north side
          [
            { location: { lat: ne.lat() + offset, lng: center.lng() }, stopover: false },
            { location: { lat: ne.lat() + offset, lng: ne.lng() + offset }, stopover: false }
          ],
          // Go around the south side
          [
            { location: { lat: sw.lat() - offset, lng: center.lng() }, stopover: false },
            { location: { lat: sw.lat() - offset, lng: sw.lng() - offset }, stopover: false }
          ],
          // Go around the east side
          [
            { location: { lat: center.lat(), lng: ne.lng() + offset }, stopover: false },
            { location: { lat: ne.lat() + offset, lng: ne.lng() + offset }, stopover: false }
          ],
          // Go around the west side
          [
            { location: { lat: center.lat(), lng: sw.lng() - offset }, stopover: false },
            { location: { lat: sw.lat() - offset, lng: sw.lng() - offset }, stopover: false }
          ],
        ];
        
        for (const waypoints of strategies) {
          // Verify all waypoints are safe
          const allSafe = waypoints.every(wp => 
            isLocationSafe(wp.location, hotspots, 2000) // At least 2km from hotspots
          );
          
          if (!allSafe) continue;
          
          try {
            const route = await new Promise((resolve) => {
              directionsService.current.route(
                {
                  origin: origin,
                  destination: dest,
                  waypoints: waypoints,
                  travelMode: window.google.maps.TravelMode.DRIVING,
                  avoidHighways: false,
                  avoidTolls: false,
                  optimizeWaypoints: false // Don't optimize - follow waypoints
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
            
            if (route) {
              const routeHotspots = checkRouteForHotspots(route);
              const totalDistance = route.routes[0].legs.reduce((sum, leg) => sum + leg.distance.value, 0);
              const totalDuration = route.routes[0].legs.reduce((sum, leg) => sum + leg.duration.value, 0);
              const isFaster = totalDuration <= originalRouteDuration;
              
              console.log(`Bounding box strategy (offset: ${offset}) found route with ${routeHotspots.length} hotspots, ${(totalDistance / 1000).toFixed(2)} km, ${Math.floor(totalDuration / 60)} min`);
              
              if (routeHotspots.length === 0) {
                if (isFaster || totalDuration <= originalRouteDuration * 1.2) {
                  console.log('Found safe route using bounding box strategy!');
                  return route;
                } else {
                  if (!bestRoute || routeHotspots.length < bestHotspotCount || 
                      (routeHotspots.length === bestHotspotCount && totalDuration < bestRouteDuration)) {
                    bestRoute = route;
                    bestHotspotCount = routeHotspots.length;
                    bestRouteDistance = totalDistance;
                    bestRouteDuration = totalDuration;
                  }
                }
              } else if (routeHotspots.length < bestHotspotCount || 
                         (routeHotspots.length === bestHotspotCount && totalDuration < bestRouteDuration)) {
                bestRoute = route;
                bestHotspotCount = routeHotspots.length;
                bestRouteDistance = totalDistance;
                bestRouteDuration = totalDuration;
              }
            }
          } catch (error) {
            console.error('Error with bounding box strategy:', error);
            continue;
          }
        }
      }
      } catch (error) {
        console.error('Error creating bounding box:', error);
      }
    } else {
      console.log('Skipping bounding box strategy due to time limit');
    }
    
    // Last resort: Try with very large waypoints (only if we still have time and no good route found)
    if (Date.now() - startTime < MAX_SEARCH_TIME * 0.9 && (!bestRoute || bestHotspotCount >= originalHotspotCount / 2)) {
      console.log('Trying last resort: very large waypoints...');
      const lastResortOffsets = [0.15, 0.2]; // Reduced from 4 to 2 offsets
      const lastResortMinSafe = [4000]; // Reduced from 3 to 1
      
      for (const minSafe of lastResortMinSafe) {
        for (const offset of lastResortOffsets) {
          for (let dir = 0; dir < 4; dir += 2) { // Try only 4 directions instead of 8
            // Check time limit
            if (Date.now() - startTime > MAX_SEARCH_TIME) {
              break;
            }
            
            const waypoints = createAvoidanceWaypoints(hotspots, offset, dir, minSafe, origin);
            
            // Skip if no safe waypoints
            if (waypoints.length === 0) continue;
            
            try {
              const route = await new Promise((resolve) => {
                directionsService.current.route(
                {
                  origin: origin,
                  destination: dest,
                  waypoints: waypoints.length > 0 ? waypoints : undefined,
                  travelMode: window.google.maps.TravelMode.DRIVING,
                  avoidHighways: false,
                  avoidTolls: false,
                  optimizeWaypoints: false // Don't optimize - follow waypoints exactly
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
            
            if (route) {
              const routeHotspots = checkRouteForHotspots(route);
              const totalDistance = route.routes[0].legs.reduce((sum, leg) => sum + leg.distance.value, 0);
              const totalDuration = route.routes[0].legs.reduce((sum, leg) => sum + leg.duration.value, 0);
              const isFaster = totalDuration <= originalRouteDuration;
              
              if (routeHotspots.length === 0) {
                // Return if it's efficient (faster or not much slower)
                if (isFaster || totalDuration <= originalRouteDuration * 1.2) {
                  console.log('Found safe route using last resort strategy!');
                  return route;
                }
                // Save if better than current best
                if (!bestRoute || routeHotspots.length < bestHotspotCount || 
                    (routeHotspots.length === bestHotspotCount && totalDuration < bestRouteDuration)) {
                  bestRoute = route;
                  bestHotspotCount = routeHotspots.length;
                  bestRouteDistance = totalDistance;
                  bestRouteDuration = totalDuration;
                }
              } else if (routeHotspots.length < bestHotspotCount || 
                         (routeHotspots.length === bestHotspotCount && totalDuration < bestRouteDuration)) {
                bestRoute = route;
                bestHotspotCount = routeHotspots.length;
                bestRouteDistance = totalDistance;
                bestRouteDuration = totalDuration;
              }
              }
            } catch (error) {
              continue;
            }
          }
        }
      }
    } else {
      console.log('Skipping last resort strategies due to time limit or good route found');
    }
    
    // Return the best route found (even if not perfect) or null if nothing found
    if (bestRoute) {
      const isFaster = bestRouteDuration <= originalRouteDuration;
      const isShorter = bestRouteDistance <= originalRouteDistance;
      const timeSaved = Math.floor((originalRouteDuration - bestRouteDuration) / 60);
      console.log(`Returning best route: ${bestHotspotCount} hotspots, ${(bestRouteDistance / 1000).toFixed(2)} km, ${Math.floor(bestRouteDuration / 60)} min (${isFaster ? `FASTER by ${Math.abs(timeSaved)} min` : 'slower'}, ${isShorter ? 'SHORTER' : 'longer'})`);
      return bestRoute;
    }
    
    console.log('Could not find any route that avoids hotspots');
    return null;
  };

  /**
   * Get origin location (current location or start location)
   */
  const getOrigin = () => {
    if (useCurrentLocation && userLocation) {
      return userLocation;
    } else if (!useCurrentLocation && startLocation) {
      return startLocation.location;
    }
    return null;
  };

  /**
   * Calculate route from origin to destination
   */
  const calculateRoute = async () => {
    // If using current location but it's not available yet, get it first
    if (useCurrentLocation && !userLocation) {
      toast.info('Getting your current location...');
      getUserCurrentLocation();
      return;
    }
    
    const origin = getOrigin();
    
    if (!origin || !destination || !directionsService.current) {
      if (useCurrentLocation) {
        toast.error('Please wait for your location to be detected, or set a start location manually');
      } else {
        toast.error('Please set your start location and destination');
      }
      return;
    }

    setRouting(true);
    
    // Clear previous routes
    if (directionsRenderer.current) {
      directionsRenderer.current.setDirections({ routes: [] });
    }
    if (unsafeRouteRenderer.current) {
      unsafeRouteRenderer.current.setDirections({ routes: [] });
    }
    if (safeRouteRenderer.current) {
      safeRouteRenderer.current.setDirections({ routes: [] });
    }
    
    try {
      // First, get the standard route
      directionsService.current.route(
        {
          origin: origin,
          destination: destination.location,
          travelMode: window.google.maps.TravelMode.DRIVING
        },
        async (result, status) => {
          if (status !== window.google.maps.DirectionsStatus.OK) {
            toast.error('Unable to calculate route');
            setRouting(false);
            return;
          }
          
          console.log('Route calculated:', result);
          
          // Check for hotspots along the route
          const hotspots = checkRouteForHotspots(result);
          console.log('Hotspots found:', hotspots.length);
          
          if (hotspots.length > 0) {
            // Route passes through hotspots - show warning and calculate safe route
            console.log('Showing warning for hotspots');
            setShowWarning(true);
            setRouteInfo({
              unsafeRoute: result,
              hotspots: hotspots,
              distance: result.routes[0].legs[0].distance.text,
              duration: result.routes[0].legs[0].duration.text,
              distanceValue: result.routes[0].legs[0].distance.value,
              durationValue: result.routes[0].legs[0].duration.value
            });
            
            // Display unsafe route in red
            unsafeRouteRenderer.current.setDirections(result);
            
            // Fit bounds to unsafe route first
            map.current.fitBounds(result.routes[0].bounds);
            
            // Try to calculate a safer route that avoids ALL reports (not just hotspots along the route)
            // Use all reports to ensure we avoid all crime hotspots in the area
            const allReports = reports.map(r => ({
              id: r.id,
              lat: r.lat,
              lng: r.lng
            }));
            
            console.log(`Calculating safe route avoiding ${allReports.length} total reports...`);
            const originalHotspotCount = hotspots.length;
            const safeRoute = await calculateSafeRoute(origin, destination.location, allReports, originalHotspotCount);
            
            if (safeRoute) {
              console.log('Safe route found! Checking for hotspots...');
              const safeHotspots = checkRouteForHotspots(safeRoute);
              console.log(`Safe route has ${safeHotspots.length} hotspots (original had ${originalHotspotCount})`);
              
              // Show as "safe" if it has ZERO hotspots OR fewer than the original route
              if (safeHotspots.length === 0 || safeHotspots.length < originalHotspotCount) {
                const isPerfect = safeHotspots.length === 0;
                console.log(`Safe route confirmed! ${isPerfect ? 'Zero hotspots!' : `${safeHotspots.length} hotspots (better than original ${originalHotspotCount})`} Displaying...`);
                const totalDistance = safeRoute.routes[0].legs.reduce((sum, leg) => sum + leg.distance.value, 0);
                const totalDuration = safeRoute.routes[0].legs.reduce((sum, leg) => sum + leg.duration.value, 0);
                
                setRouteInfo(prev => ({
                  ...prev,
                  safeRoute: safeRoute,
                  safeHotspots: safeHotspots,
                  safeDistance: (totalDistance / 1000).toFixed(1),
                  safeDuration: Math.floor(totalDuration / 60),
                  safeDistanceText: `${(totalDistance / 1000).toFixed(1)} km`,
                  safeDurationText: `${Math.floor(totalDuration / 60)} min`
                }));
                
                // Display safe route in green
                try {
                  safeRouteRenderer.current.setDirections(safeRoute);
                  console.log('Safe route rendered on map');
                } catch (error) {
                  console.error('Error rendering safe route:', error);
                }
                
                // Fit bounds to show both routes
                try {
                  const bounds = new window.google.maps.LatLngBounds();
                  // Extend bounds with the unsafe route
                  if (result.routes[0].bounds) {
                    bounds.extend(result.routes[0].bounds.getSouthWest());
                    bounds.extend(result.routes[0].bounds.getNorthEast());
                  }
                  // Extend bounds with the safe route
                  if (safeRoute.routes[0].bounds) {
                    bounds.extend(safeRoute.routes[0].bounds.getSouthWest());
                    bounds.extend(safeRoute.routes[0].bounds.getNorthEast());
                  }
                  map.current.fitBounds(bounds);
                  console.log('Map bounds adjusted to show both routes');
                } catch (error) {
                  console.error('Error fitting bounds:', error);
                  // Fallback: just fit to safe route
                  if (safeRoute.routes[0].bounds) {
                    map.current.fitBounds(safeRoute.routes[0].bounds);
                  }
                }
                
                if (safeHotspots.length === 0) {
                  toast.success('Safe route found with zero hotspots!');
                } else {
                  toast.success(`Safer route found! (${safeHotspots.length} hotspots vs ${originalHotspotCount} in original)`);
                }
              } else {
                // Route has same or more hotspots - don't show it as "safe"
                console.log(`Alternative route has ${safeHotspots.length} hotspots (same or worse than original ${originalHotspotCount}), not showing as safe route`);
                setRouteInfo(prev => ({
                  ...prev,
                  safeRoute: null
                }));
              }
            } else {
              // Couldn't find alternative route that avoids hotspots
              console.log('Could not find a safe route that avoids all hotspots');
              toast.error('Unable to find a completely safe alternative route. Please exercise caution.', {
                duration: 5000,
                icon: '⚠️'
              });
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
            setShowWarning(false);
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
    if (startLocationMarker.current) {
      startLocationMarker.current.map = null;
      startLocationMarker.current = null;
    }
    setDestination(null);
    setDestinationQuery('');
    setStartLocation(null);
    setStartQuery('');
    setShowWarning(false);
    setShowRouteInfo(false);
    setRouteInfo(null);
  };

  /**
   * Handle start location search
   */
  useEffect(() => {
    // Don't show results if start location is already selected
    if (startLocation) {
      setStartResults([]);
      return;
    }
    
    if (!autocompleteService.current || !startQuery.trim() || useCurrentLocation) {
      setStartResults([]);
      return;
    }

    const timer = setTimeout(() => {
      autocompleteService.current.getPlacePredictions(
        {
          input: startQuery,
          componentRestrictions: { country: 'za' },
          types: ['geocode', 'establishment']
        },
        (predictions, status) => {
          if (placesServiceStatus.current && status === placesServiceStatus.current.OK && predictions) {
            setStartResults(predictions.map(prediction => ({
              placeId: prediction.place_id,
              name: prediction.description
            })));
          } else {
            setStartResults([]);
          }
        }
      );
    }, 500);

    return () => clearTimeout(timer);
  }, [startQuery, useCurrentLocation, startLocation]);

  /**
   * Handle destination search
   */
  useEffect(() => {
    // Don't show results if destination is already selected
    if (destination) {
      setDestinationResults([]);
      return;
    }
    
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
  }, [destinationQuery, destination]);

  /**
   * Set start location from search
   */
  const setStartFromSearch = async (placeId) => {
    if (!placesService.current) return;
    
    placesService.current.getDetails(
      { placeId },
      async (place, status) => {
        if (placesServiceStatus.current && status === placesServiceStatus.current.OK && place.geometry) {
          const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          };
          
          setStartLocation({
            placeId: placeId,
            location: location,
            name: place.name || place.formatted_address
          });
          
          // Finalize selection - close dropdown and set query
          setStartQuery(place.name || place.formatted_address);
          setStartResults([]);
          
          // Ensure dropdown is closed
          setTimeout(() => {
            setStartResults([]);
          }, 0);
          
          // Add start location marker
          if (startLocationMarker.current) {
            startLocationMarker.current.map = null;
          }
          
          try {
            const { AdvancedMarkerElement } = await loadGoogleMapsLibrary('marker');
            const el = document.createElement('div');
            el.innerHTML = `
              <svg width="32" height="48" viewBox="0 0 32 48" style="filter: drop-shadow(0 2px 8px rgba(16, 185, 129, 0.4));">
                <path fill="#10B981" stroke="#059669" stroke-width="3" d="M16 0C7.163 0 0 7.163 0 16c0 16 16 32 16 32s16-16 16-32C32 7.163 24.837 0 16 0z"/>
                <circle fill="white" cx="16" cy="16" r="6"/>
              </svg>
            `;
            
            startLocationMarker.current = new AdvancedMarkerElement({
              map: map.current,
              position: location,
              content: el
            });
            
            // Calculate route if destination is also set
            if (destination) {
              calculateRoute();
            }
          } catch (error) {
            console.error('Error creating start location marker:', error);
          }
        }
      }
    );
  };

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
          
          // Finalize selection - close dropdown and set query
          setDestinationQuery(place.name || place.formatted_address);
          setDestinationResults([]);
          
          // Ensure dropdown is closed by clearing query state immediately
          setTimeout(() => {
            setDestinationResults([]);
          }, 0);
          
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
            
            // Calculate route if origin is available
            const origin = getOrigin();
            if (origin) {
              calculateRoute();
            } else if (useCurrentLocation) {
              toast.info('Getting your location...');
              getUserCurrentLocation();
            }
          } catch (error) {
            console.error('Error creating destination marker:', error);
          }
        }
      }
    );
  };
  
  // Auto-calculate route when both origin and destination are set
  useEffect(() => {
    const origin = getOrigin();
    if (origin && destination && !routing && mapsLoaded) {
      calculateRoute();
    }
  }, [userLocation, startLocation, destination, useCurrentLocation, mapsLoaded]);

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

        {/* Search Bar - Centered, slightly to the right */}
        <div className="map-search-bar glassy-overlay" style={{ top: '20px', left: '50%', transform: 'translateX(-30%)', right: 'auto', width: '350px' }}>
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

        {/* Route Planning Panel */}
        <div className="route-planning-panel glassy-overlay" style={{ top: '20px', left: '20px', right: 'auto', width: '350px' }}>
          <div className="route-planning-header">
            <Route className="w-5 h-5" style={{ color: '#3B82F6' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Plan Route</h3>
            {(destination || startLocation || userLocation) && (
            <button
                onClick={clearRoutes}
                className="search-clear"
                style={{ marginLeft: 'auto' }}
                title="Clear route"
              >
                <X className="w-4 h-4" />
            </button>
            )}
          </div>

          {/* Start Location */}
          <div className="route-input-section" style={{ marginTop: '1rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', marginBottom: '0.5rem', display: 'block' }}>
              Start Location
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                type="checkbox"
                id="useCurrentLocation"
                checked={useCurrentLocation}
                onChange={(e) => {
                  setUseCurrentLocation(e.target.checked);
                  if (e.target.checked) {
                    setStartLocation(null);
                    setStartQuery('');
                    getUserCurrentLocation();
                  }
                }}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="useCurrentLocation" style={{ fontSize: '0.875rem', cursor: 'pointer', margin: 0 }}>
                Use my current location
              </label>
            </div>
            {!useCurrentLocation && (
              <>
                <div className="search-input-wrapper">
                  <Navigation className="search-icon" style={{ color: '#10B981' }} />
                  <input
                    type="text"
                    value={startQuery}
                    onChange={(e) => setStartQuery(e.target.value)}
                    placeholder="Enter start location..."
                    className="search-input"
                  />
                  {startQuery && (
                    <button
                      onClick={() => {
                        setStartQuery('');
                        setStartResults([]);
                      }}
                      className="search-clear"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
            {startResults.length > 0 && !startLocation && (
              <div className="search-results">
                {startResults.map((result) => (
                  <div
                    key={result.placeId}
                    className="search-result-item"
                    onClick={() => {
                      setStartFromSearch(result.placeId);
                      // Immediately close dropdown
                      setStartResults([]);
                    }}
                  >
                    <MapPin className="w-4 h-4" />
                    <span>{result.name}</span>
                  </div>
                ))}
              </div>
            )}
              </>
            )}
            {useCurrentLocation && userLocation && (
              <div style={{ fontSize: '0.75rem', color: '#10B981', padding: '0.25rem 0' }}>
                ✓ Using current location
              </div>
            )}
              </div>

          {/* Destination */}
          <div className="route-input-section" style={{ marginTop: '1rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', marginBottom: '0.5rem', display: 'block' }}>
              Destination
            </label>
            <div className="search-input-wrapper">
              <MapPin className="search-icon" style={{ color: '#3B82F6' }} />
              <input
                type="text"
                value={destinationQuery}
                onChange={(e) => setDestinationQuery(e.target.value)}
                placeholder="Enter destination..."
                className="search-input"
              />
              {destinationQuery && (
                <button
                  onClick={() => {
                    setDestinationQuery('');
                    setDestinationResults([]);
                  }}
                  className="search-clear"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {destinationResults.length > 0 && !destination && (
              <div className="search-results">
                {destinationResults.map((result) => (
                  <div
                    key={result.placeId}
                    className="search-result-item"
                    onClick={() => {
                      setDestinationFromSearch(result.placeId);
                      // Immediately close dropdown
                      setDestinationResults([]);
                    }}
                  >
                    <MapPin className="w-4 h-4" />
                    <span>{result.name}</span>
                  </div>
                ))}
              </div>
            )}
        </div>

          {routing && (
            <div className="routing-indicator" style={{ padding: '0.5rem', textAlign: 'center', color: '#666', marginTop: '1rem' }}>
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

        {/* Legend - Moved to right side, slightly to the left */}
        <div className="map-legend glassy-overlay" style={{ top: '20px', right: '100px', left: 'auto', bottom: 'auto' }}>
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
                      <div style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: '0.25rem' }}>
                        ⚠️ {routeInfo.hotspots.length} hotspot{routeInfo.hotspots.length !== 1 ? 's' : ''} detected
                      </div>
                    </div>
                    
                    <div className="route-option safe-route" style={{ marginTop: '1rem' }}>
                      <div className="route-header">
                        <div style={{ width: '20px', height: '3px', backgroundColor: '#10B981', marginRight: '0.5rem' }}></div>
                        <span><strong>Safer Alternative</strong></span>
                        <CheckCircle className="w-4 h-4" style={{ color: '#10B981', marginLeft: '0.5rem' }} />
                      </div>
                      <div className="route-details">
                        <span>{routeInfo.safeDistanceText || `${routeInfo.safeDistance || 0} km`}</span>
                        <span>•</span>
                        <span>{routeInfo.safeDurationText || `${routeInfo.safeDuration || 0} min`}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '0.25rem' }}>
                        {routeInfo.safeHotspots && routeInfo.safeHotspots.length > 0 ? (
                          <>✓ {routeInfo.safeHotspots.length} hotspot{routeInfo.safeHotspots.length !== 1 ? 's' : ''} (safer than original)</>
                        ) : (
                          <>✓ No hotspots detected - Safe route!</>
                        )}
                      </div>
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
