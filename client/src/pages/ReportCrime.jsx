import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import { useAuth } from '../firebase/authContext';
import { reportsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { AlertTriangle, MapPin, Navigation } from 'lucide-react';

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

// Default coordinates for Johannesburg, South Africa
const DEFAULT_CENTER = [-26.2041, 28.0473];
const DEFAULT_ZOOM = 15;

// Create custom marker icon
const createMarkerIcon = () => {
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="48" viewBox="0 0 32 48">
        <path fill="#DC2626" stroke="white" stroke-width="2" d="M16 0C7.163 0 0 7.163 0 16c0 16 16 32 16 32s16-16 16-32C32 7.163 24.837 0 16 0z"/>
        <circle fill="white" cx="16" cy="16" r="6"/>
      </svg>
    `)}`,
    iconSize: [32, 48],
    iconAnchor: [16, 48],
    popupAnchor: [0, -48]
  });
};

// Component to center map on location
function MapCenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

// Component to handle map clicks
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e);
    },
  });
  return null;
}

// Draggable marker component
function DraggableMarker({ position, setPosition }) {
  const markerRef = useRef(null);
  
  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const newPosition = marker.getLatLng();
        setPosition([newPosition.lat, newPosition.lng]);
      }
    },
  };

  return (
    <Marker
      draggable={true}
      position={position}
      icon={createMarkerIcon()}
      eventHandlers={eventHandlers}
      ref={markerRef}
    />
  );
}

function ReportCrime() {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    location: '',
    lat: null,
    lng: null
  });
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [markerPosition, setMarkerPosition] = useState(DEFAULT_CENTER);
  const [locationPermissionAsked, setLocationPermissionAsked] = useState(false);

  // Request geolocation on page load
  useEffect(() => {
    if (!locationPermissionAsked && navigator.geolocation) {
      setLocationPermissionAsked(true);
      setGettingLocation(true);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newPosition = [latitude, longitude];
          
          setFormData(prev => ({
            ...prev,
            lat: latitude,
            lng: longitude
          }));
          setMarkerPosition(newPosition);
          setMapCenter(newPosition);
          setMapZoom(15);
          setLocationError(false);
          setGettingLocation(false);
          
          // Try to get address from coordinates (reverse geocoding)
          fetchAddressFromCoordinates(latitude, longitude);
        },
        (error) => {
          console.error('Location access denied:', error);
          setLocationError(true);
          setGettingLocation(false);
          // Keep default center (Johannesburg)
          setMarkerPosition(DEFAULT_CENTER);
          setFormData(prev => ({
            ...prev,
            lat: DEFAULT_CENTER[0],
            lng: DEFAULT_CENTER[1]
          }));
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else if (!navigator.geolocation) {
      setLocationError(true);
      setGettingLocation(false);
    }
  }, [locationPermissionAsked]);

  // Update location text when marker moves
  useEffect(() => {
    if (formData.lat && formData.lng) {
      fetchAddressFromCoordinates(formData.lat, formData.lng);
    }
  }, [formData.lat, formData.lng]);

  // Fetch address from coordinates using reverse geocoding
  const fetchAddressFromCoordinates = async (lat, lng) => {
    try {
      // Using Nominatim (OpenStreetMap's geocoding service)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'SafeMzansi/1.0'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.display_name) {
          setFormData(prev => ({
            ...prev,
            location: data.display_name
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      // If reverse geocoding fails, just show coordinates
      setFormData(prev => ({
        ...prev,
        location: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      }));
    }
  };

  // Handle map click to set marker position
  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    const newPosition = [lat, lng];
    
    setMarkerPosition(newPosition);
    setFormData(prev => ({
      ...prev,
      lat,
      lng
    }));
    
    // Fetch address for new position
    fetchAddressFromCoordinates(lat, lng);
  };

  // Handle marker position change (when dragged)
  const handleMarkerPositionChange = (newPosition) => {
    setMarkerPosition(newPosition);
    setFormData(prev => ({
      ...prev,
      lat: newPosition[0],
      lng: newPosition[1]
    }));
  };

  // Handle location text input change - try to geocode address
  const handleLocationInputChange = async (address) => {
    setFormData(prev => ({ ...prev, location: address }));
    
    // If address is empty, don't geocode
    if (!address.trim()) return;
    
    try {
      // Using Nominatim for forward geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'SafeMzansi/1.0'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const { lat, lon } = data[0];
          const newPosition = [parseFloat(lat), parseFloat(lon)];
          
          setMarkerPosition(newPosition);
          setMapCenter(newPosition);
          setFormData(prev => ({
            ...prev,
            lat: parseFloat(lat),
            lng: parseFloat(lon)
          }));
        }
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
    }
  };

  // Get current location manually
  const getCurrentLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newPosition = [latitude, longitude];
          
          setFormData(prev => ({
            ...prev,
            lat: latitude,
            lng: longitude
          }));
          setMarkerPosition(newPosition);
          setMapCenter(newPosition);
          setMapZoom(15);
          setLocationError(false);
          setGettingLocation(false);
          
          fetchAddressFromCoordinates(latitude, longitude);
          toast.success('Location captured!');
        },
        (error) => {
          toast.error('Could not get location. Please select on map.');
          setGettingLocation(false);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      toast.error('Geolocation is not supported by your browser.');
      setGettingLocation(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error('Please sign in to report crimes');
      return;
    }

    if (!formData.title || !formData.description || !formData.type) {
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
        formData.title,
        formData.description,
        formData.type,
        formData.location || `${formData.lat}, ${formData.lng}`,
        formData.lat,
        formData.lng
      );

      toast.success('Report submitted successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        type: '',
        location: '',
        lat: null,
        lng: null
      });
      
      // Reset marker to default position
      setMarkerPosition(DEFAULT_CENTER);
      setMapCenter(DEFAULT_CENTER);
      setMapZoom(DEFAULT_ZOOM);
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
              <p>Unable to access your location. Please select a location on the map or enter an address.</p>
            </div>
          )}

        <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="form-input"
                placeholder="Brief title for the incident"
                required
              />
            </div>

          <div className="form-group">
            <label className="form-label">
              Crime Type *
            </label>
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
            <label className="form-label">
              Description *
            </label>
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
            <label className="form-label">
              Location *
            </label>
              <div className="flex flex-items-center flex-gap mb-3">
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleLocationInputChange(e.target.value)}
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="Enter address or click on map"
                />
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="btn btn-secondary"
                  title="Use my current location"
              >
                  <Navigation className="w-5 h-5" />
                  {gettingLocation ? '...' : ''}
              </button>
              </div>
              {formData.lat && formData.lng && (
                <p className="text-xs text-gray-500 mb-3">
                  Coordinates: {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
                </p>
              )}
              
              {/* Interactive Map */}
              <div className="report-map-container">
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ height: '400px', width: '100%', borderRadius: 'var(--radius-sm)', zIndex: 1 }}
                  scrollWheelZoom={true}
                >
                  <MapCenter center={mapCenter} zoom={mapZoom} />
                  <MapClickHandler onMapClick={handleMapClick} />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <DraggableMarker 
                    position={markerPosition} 
                    setPosition={handleMarkerPositionChange}
                  />
                </MapContainer>
                <p className="text-xs text-gray-500 mt-2">
                  Click on the map or drag the marker to set location
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
