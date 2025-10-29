import { useState, useEffect } from 'react';
import { Filter, CheckCircle, MapPin, Clock } from 'lucide-react';

const REPORTS_STORAGE_KEY = 'safemzansi_reports';

// Default mock hotspots for demo
const defaultHotspots = [
  {
    id: 1,
    type: 'Theft',
    location: 'Johannesburg CBD',
    lat: -26.2041,
    lng: 28.0473,
    count: 12,
    lastReport: '2 hours ago',
    verified: true
  },
  {
    id: 2,
    type: 'Robbery',
    location: 'Cape Town Central',
    lat: -33.9249,
    lng: 18.4241,
    count: 8,
    lastReport: '5 hours ago',
    verified: true
  },
  {
    id: 3,
    type: 'Vandalism',
    location: 'Durban North',
    lat: -29.8386,
    lng: 31.0292,
    count: 5,
    lastReport: '1 day ago',
    verified: false
  },
  {
    id: 4,
    type: 'Suspicious Activity',
    location: 'Pretoria East',
    lat: -25.7479,
    lng: 28.2293,
    count: 3,
    lastReport: '2 days ago',
    verified: true
  }
];

const crimeTypeColors = {
  Theft: '#FF6B6B',
  Robbery: '#DC2626',
  Assault: '#EA580C',
  Vandalism: '#F59E0B',
  'Drug Activity': '#8B5CF6',
  'Suspicious Activity': '#6366F1',
  'Domestic Violence': '#EC4899',
  Other: '#6B7280'
};

function Map() {
  const [selectedType, setSelectedType] = useState('');
  const [showVerified, setShowVerified] = useState(true);
  const [hotspots, setHotspots] = useState(defaultHotspots);

  useEffect(() => {
    // Load reports from localStorage and convert to hotspots
    const allReports = JSON.parse(localStorage.getItem(REPORTS_STORAGE_KEY) || '[]');
    
    if (allReports.length > 0) {
      // Group reports by location/area and create hotspots
      const locationGroups = {};
      allReports.forEach(report => {
        const locationKey = `${report.lat?.toFixed(1)}_${report.lng?.toFixed(1)}`;
        if (!locationGroups[locationKey]) {
          locationGroups[locationKey] = {
            location: `Area ${Object.keys(locationGroups).length + 1}`,
            lat: report.lat,
            lng: report.lng,
            type: report.type,
            reports: []
          };
        }
        locationGroups[locationKey].reports.push(report);
      });

      const newHotspots = Object.values(locationGroups).map((group, idx) => ({
        id: `hotspot_${idx}`,
        type: group.type,
        location: group.location,
        lat: group.lat,
        lng: group.lng,
        count: group.reports.length,
        lastReport: getTimeAgo(group.reports[0]?.createdAt),
        verified: group.reports.some(r => r.verified)
      }));

      setHotspots([...defaultHotspots, ...newHotspots]);
    }
  }, []);

  function getTimeAgo(dateString) {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  }

  const filteredHotspots = hotspots.filter(hotspot => {
    if (selectedType && hotspot.type !== selectedType) return false;
    if (showVerified && !hotspot.verified) return false;
    return true;
  });

  const uniqueTypes = [...new Set(hotspots.map(h => h.type))];

  return (
    <div className="map-page">
      {/* Map Container */}
      <div className="map-container">
        {/* Static Map Image/Placeholder */}
        <div className="map-placeholder">
          <div className="map-overlay-content">
            <MapPin className="w-16 h-16" style={{ color: 'var(--primary-blue)' }} />
            <h2>Interactive Crime Map</h2>
            <p className="text-gray-600">South Africa Crime Hotspots</p>
          </div>
          {/* Mock map markers */}
          <div className="map-markers">
            {filteredHotspots.map((hotspot, index) => {
              // Convert lat/lng to approximate pixel positions for South Africa map
              // South Africa approximate bounds: lat -35 to -22, lng 16 to 33
              const latPercent = ((hotspot.lat + 35) / 13) * 100; // Normalize to 0-100
              const lngPercent = ((hotspot.lng - 16) / 17) * 100; // Normalize to 0-100
              
              return (
                <div
                  key={hotspot.id}
                  className="map-marker"
                  style={{
                    left: `${Math.max(5, Math.min(95, lngPercent))}%`,
                    top: `${Math.max(5, Math.min(95, 100 - latPercent))}%`, // Invert Y axis
                    backgroundColor: crimeTypeColors[hotspot.type] || '#6B7280'
                  }}
                  title={`${hotspot.location} - ${hotspot.type}`}
                />
              );
            })}
          </div>
        </div>

        {/* Glassy Overlay Panel */}
        <div className="map-overlay-panel glassy-overlay">
          <div className="overlay-header">
            <h2 className="mb-4">Crime Hotspots</h2>
            
            <div className="form-group mb-4">
              <label className="form-label">
                <Filter className="w-4 h-4" />
                Filter by Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="form-select"
              >
                <option value="">All Types</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-items-center flex-gap-sm mb-4">
              <input
                type="checkbox"
                id="verified"
                checked={showVerified}
                onChange={(e) => setShowVerified(e.target.checked)}
              />
              <label htmlFor="verified" className="form-label" style={{ margin: 0 }}>
                Show verified only
              </label>
            </div>

            <div className="hotspot-count mb-4">
              <p className="text-sm text-gray-600">
                <strong>{filteredHotspots.length}</strong> hotspots showing
              </p>
            </div>
          </div>

          {/* Hotspots List */}
          <div className="hotspots-list">
            {filteredHotspots.map((hotspot) => (
              <div key={hotspot.id} className="hotspot-card">
                <div className="flex flex-items-center flex-between mb-2">
                  <div className="flex flex-items-center flex-gap-sm">
                    <div
                      className="hotspot-indicator"
                      style={{ backgroundColor: crimeTypeColors[hotspot.type] || '#6B7280' }}
                    />
                    <span className="font-medium">{hotspot.type}</span>
                    {hotspot.verified && (
                      <CheckCircle className="w-4 h-4" style={{ color: '#10B981' }} />
                    )}
                  </div>
                  <span className="badge badge-primary">{hotspot.count}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  {hotspot.location}
                </p>
                <p className="text-xs text-gray-500">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Last report: {hotspot.lastReport}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Map;
