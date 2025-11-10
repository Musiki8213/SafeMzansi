import { useState, useEffect, useCallback, useRef } from 'react';
import { importLibrary } from '@googlemaps/js-api-loader';
import { MapPin, Navigation, Search, X, Info } from 'lucide-react';
import { reportsAPI } from '../utils/api';
import { initializeGoogleMaps, loadGoogleMapsLibrary, getPlacesServiceStatus } from '../utils/googleMaps';
import toast from 'react-hot-toast';

// Default coordinates for Johannesburg, South Africa
const DEFAULT_CENTER = { lat: -26.2041, lng: 28.0473 };
const DEFAULT_ZOOM = 13;

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
  
  // Refs for markers and overlays
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);

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

        setMapsLoaded(true);
        setLoading(false);
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
   * Center on user's current location
   */
  const centerOnUser = () => {
    if (!navigator.geolocation || !map.current) {
      toast.error('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        map.current.panTo(location);
        map.current.setZoom(15);
        setLocationError(false);
        toast.success('Centered on your location');
      },
      (error) => {
        setLocationError(true);
        toast.error('Unable to access your location');
      }
    );
  };

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
            <div className="legend-item" style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.3)' }}>
              <span className="legend-label" style={{ fontSize: '0.7rem', color: '#666' }}>
                {reports.length} report{reports.length !== 1 ? 's' : ''} loaded
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SafeMzansiMap;
