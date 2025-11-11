import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../firebase/authContext';
import { reportsAPI } from '../utils/api';
import { initializeGoogleMaps, loadGoogleMapsLibrary, getPlacesServiceStatus } from '../utils/googleMaps';
import toast from 'react-hot-toast';
import { AlertTriangle, MapPin, Navigation, Search, X, Pin } from 'lucide-react';

const crimeTypes = [
  'Theft',
  'Hijacking',
  'Assault',
  'Burglary',
  'Robbery',
  'Vandalism',
  'Drug Activity',
  'Suspicious Activity',
  'Domestic Violence',
  'Other'
];

function ReportCrime() {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    description: '',
    type: '',
    location: '',
    lat: null,
    lng: null
  });
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  // Map refs
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const geocoder = useRef(null);
  const placesServiceStatus = useRef(null);

  /**
   * Initialize Google Maps
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
        const { Geocoder } = await loadGoogleMapsLibrary('geocoding');

        // Store PlacesServiceStatus
        placesServiceStatus.current = getPlacesServiceStatus();

        // Initialize map - will center on user location or default to Johannesburg
        // Map ID is required for Advanced Markers
        map.current = new Map(mapContainer.current, {
          center: { lat: -26.2041, lng: 28.0473 }, // Johannesburg default
          zoom: 13,
          disableDefaultUI: false,
          zoomControl: true,
          scaleControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          mapTypeControl: false,
          mapId: 'DEMO_MAP_ID' // Default Map ID for Advanced Markers
        });

        // Initialize services
        autocompleteService.current = new AutocompleteService();
        placesService.current = new PlacesService(map.current);
        geocoder.current = new Geocoder();

        setMapsLoaded(true);

        // Get user's current location on load
        getCurrentLocation();

        // Handle map click to drop marker
        map.current.addListener('click', (e) => {
          const location = {
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
          };
          setMarkerPosition(location);
        });
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        toast.error('Failed to load Google Maps');
      }
    };

    initMap();
  }, []);

  /**
   * Get user's current location and center map
   */
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(true);
      toast.error('Geolocation not supported');
      return;
    }

      setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        // Center map on user location
        if (map.current) {
          map.current.setCenter(location);
          map.current.setZoom(15);
        }

        // Set marker at user location
        setMarkerPosition(location);
          setLocationError(false);
          setGettingLocation(false);
          
        // Get address from coordinates
        reverseGeocode(location.lat, location.lng);
        toast.success('Location captured!');
        },
        (error) => {
          console.error('Location access denied:', error);
          setLocationError(true);
          setGettingLocation(false);
        toast.info('Please select a location on the map');
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
  };

  /**
   * Set marker position on map
   */
  const setMarkerPosition = async (location) => {
    if (!map.current || !mapsLoaded) return;

    try {
        const { AdvancedMarkerElement } = await loadGoogleMapsLibrary('marker');

      // Remove existing marker
      if (marker.current) {
        marker.current.map = null;
      }

      // Create red pin marker
      const el = document.createElement('div');
      el.innerHTML = `
        <svg width="32" height="48" viewBox="0 0 32 48" style="filter: drop-shadow(0 2px 8px rgba(220, 38, 38, 0.4));">
          <path fill="#DC2626" stroke="#B91C1C" stroke-width="3" d="M16 0C7.163 0 0 7.163 0 16c0 16 16 32 16 32s16-16 16-32C32 7.163 24.837 0 16 0z"/>
          <circle fill="white" cx="16" cy="16" r="6"/>
        </svg>
      `;
      el.style.cssText = 'cursor: move; pointer-events: auto; animation: pin-appear 0.5s ease-out;';
      el.style.userSelect = 'none';

      // Create marker (make it draggable)
      // Try both draggable and gmpDraggable for compatibility
      marker.current = new AdvancedMarkerElement({
        map: map.current,
        position: location,
        content: el,
        draggable: true,
        gmpDraggable: true
      });

      // Add drag start listener for visual feedback
      marker.current.addListener('dragstart', () => {
        el.style.transform = 'scale(1.2)';
        el.style.filter = 'brightness(1.3) drop-shadow(0 6px 16px rgba(220, 38, 38, 0.8))';
      });

      // Add drag end listener to update location when marker is moved
      marker.current.addListener('dragend', () => {
        // Reset visual feedback
        el.style.transform = 'scale(1)';
        el.style.filter = 'drop-shadow(0 2px 8px rgba(220, 38, 38, 0.4))';
        
        // Get the new position from the marker
        const newPosition = marker.current.position;
        let newLocation;
        
        if (newPosition) {
          // Handle both LatLng object and plain object formats
          if (typeof newPosition.lat === 'function') {
            newLocation = {
              lat: newPosition.lat(),
              lng: newPosition.lng()
            };
          } else {
            newLocation = {
              lat: newPosition.lat,
              lng: newPosition.lng
            };
          }
        } else {
          // Fallback: use the location parameter
          newLocation = location;
        }
        
        setFormData(prev => ({
          ...prev,
          lat: newLocation.lat,
          lng: newLocation.lng
        }));
        reverseGeocode(newLocation.lat, newLocation.lng);
        toast.success('Location updated');
      });

      // Update form data
      setFormData(prev => ({
        ...prev,
        lat: location.lat,
        lng: location.lng
      }));

      // Get address from coordinates
      reverseGeocode(location.lat, location.lng);
    } catch (error) {
      console.error('Error creating marker:', error);
    }
  };

  /**
   * Reverse geocode coordinates to get address
   */
  const reverseGeocode = (lat, lng) => {
    if (!geocoder.current) return;

    geocoder.current.geocode(
      { location: { lat, lng } },
      (results, status) => {
        if (status === 'OK' && results[0]) {
    setFormData(prev => ({
      ...prev,
            location: results[0].formatted_address
          }));
        } else {
          // Fallback to coordinates
    setFormData(prev => ({
      ...prev,
            location: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
          }));
        }
      }
    );
  };

  /**
   * Handle Places Autocomplete search
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
   * Handle place selection from autocomplete
   */
  const handlePlaceSelect = (placeId) => {
    if (!placesService.current || !map.current) return;

    placesService.current.getDetails(
      { placeId },
      (place, status) => {
        if (placesServiceStatus.current && status === placesServiceStatus.current.OK && place.geometry) {
          const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          };

          // Center map on selected location
          map.current.setCenter(location);
          map.current.setZoom(15);

          // Set marker at selected location
          setMarkerPosition(location);

          // Update form data with place details
          setFormData(prev => ({
            ...prev,
            location: place.formatted_address || place.name
          }));

          setSearchQuery('');
          setSearchResults([]);
          toast.success('Location selected');
        }
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error('Please sign in to report crimes');
      return;
    }

    if (!formData.description || !formData.type) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.lat || !formData.lng) {
      toast.error('Please set a location on the map');
      return;
    }

    setLoading(true);
    
    try {
      await reportsAPI.submitReport(
        null, // No title - will be auto-generated from type
        formData.description,
        formData.type,
        formData.location || `${formData.lat}, ${formData.lng}`,
        formData.lat,
        formData.lng
      );

      toast.success('Report submitted successfully!');
      
      // Reset form
      setFormData({
        description: '',
        type: '',
        location: '',
        lat: null,
        lng: null
      });
      
      // Remove marker
      if (marker.current) {
        marker.current.map = null;
        marker.current = null;
      }

      // Reset map to default
      if (map.current) {
        map.current.setCenter({ lat: -26.2041, lng: 28.0473 });
        map.current.setZoom(13);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error(error.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="card glassy-card mb-6">
        <div className="flex flex-items-center mb-6">
          <div className="icon-wrapper icon-wrapper-cyan mr-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h1>Report Crime</h1>
            <p className="text-gray-600">Help keep your community safe</p>
          </div>
        </div>

          {locationError && !gettingLocation && (
            <div className="alert alert-info mb-4">
              <p>Unable to access your location. Please select a location on the map or search for an address.</p>
            </div>
          )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
              <label className="form-label">Crime Type *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="form-select"
              required
            >
              <option value="">Select a crime type</option>
              {crimeTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
              <label className="form-label">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="form-textarea"
              placeholder="Describe what you witnessed..."
              required
            />
          </div>

          <div className="form-group">
              <label className="form-label">Location *</label>
              
              {/* Places Autocomplete Search */}
              <div className="search-input-wrapper mb-3" style={{ position: 'relative' }}>
                <Search className="search-icon" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Search for a place or address..."
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#666'
                    }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="search-results" style={{ marginBottom: '1rem' }}>
                  {searchResults.map((result) => (
                    <div
                      key={result.placeId}
                      className="search-result-item"
                      onClick={() => handlePlaceSelect(result.placeId)}
                    >
                      <MapPin className="w-4 h-4" />
                      <span>{result.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Location Display and Action Buttons */}
              <div className="flex flex-items-center flex-gap mb-3">
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="Location will appear here or enter manually"
                  readOnly
                />
                <button
                  type="button"
                  onClick={() => {
                    if (map.current) {
                      const center = map.current.getCenter();
                      const location = {
                        lat: center.lat(),
                        lng: center.lng()
                      };
                      setMarkerPosition(location);
                      toast.success('Pin dropped at map center');
                    }
                  }}
                  className="btn btn-secondary"
                  title="Pin location at map center"
                  style={{ minWidth: 'auto', padding: '0.5rem' }}
                >
                  <Pin className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="btn btn-secondary"
                  title="Use my current location"
                  style={{ minWidth: 'auto', padding: '0.5rem' }}
                >
                  <Navigation className="w-5 h-5" />
                  {gettingLocation ? '...' : ''}
                </button>
              </div>

              {/* Coordinates Display */}
              {formData.lat && formData.lng && (
                <div className="mb-3" style={{ padding: '0.75rem', background: 'rgba(29, 53, 87, 0.05)', borderRadius: 'var(--radius-sm)' }}>
                  <p className="text-xs text-gray-600 mb-1">
                    <strong>Coordinates:</strong> {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
                  </p>
                  {formData.location && (
                    <p className="text-xs text-gray-600">
                      <strong>Address:</strong> {formData.location}
                    </p>
                  )}
                </div>
              )}
              
              {/* Google Maps Container */}
              <div className="report-map-container" style={{ marginTop: '0.5rem' }}>
                <div ref={mapContainer} style={{ height: '400px', width: '100%', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }} />
                <p className="text-xs text-gray-500 mt-2">
                  Click anywhere on the map to set the location, or use the pin button to drop a pin at the map center. You can drag the pin to adjust the location.
                </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-full-width"
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}

export default ReportCrime;
