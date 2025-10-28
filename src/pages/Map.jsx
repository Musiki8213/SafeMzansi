import { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Loader } from '@googlemaps/js-api-loader';
import { Filter, CheckCircle, AlertTriangle } from 'lucide-react';

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
  const mapRef = useRef(null);
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [showVerified, setShowVerified] = useState(true);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    // Load Google Maps
    const loader = new Loader({
      apiKey: 'YOUR_GOOGLE_MAPS_API_KEY', // Replace with your actual API key
      version: 'weekly',
      libraries: ['maps', 'marker']
    });

    loader.load().then(() => {
      // Initialize map centered on South Africa
      if (mapRef.current) {
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: -25.7, lng: 28.2 },
          zoom: 6,
          mapTypeControl: false,
          streetViewControl: false
        });
        mapInstanceRef.current = map;
      }
    });
  }, []);

  useEffect(() => {
    // Listen to reports
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReports(reportsData);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Filter reports
    let filtered = reports;
    
    if (selectedType) {
      filtered = filtered.filter(r => r.type === selectedType);
    }
    
    if (showVerified) {
      filtered = filtered.filter(r => r.verified === true);
    }

    setFilteredReports(filtered);
  }, [reports, selectedType, showVerified]);

  useEffect(() => {
    // Update markers on map
    if (!mapInstanceRef.current || filteredReports.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    filteredReports.forEach((report) => {
      const marker = new google.maps.Marker({
        position: { lat: report.lat, lng: report.lng },
        map: mapInstanceRef.current,
        title: report.type,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: crimeTypeColors[report.type] || '#6B7280',
          fillOpacity: 1,
          strokeColor: '#FFF',
          strokeWeight: 2,
          scale: 8
        }
      });

      // Info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold;">${report.type}</h3>
            <p style="margin: 0 0 8px 0;">${report.description}</p>
            ${report.verified ? '<p style="color: green; margin: 0;"><strong>✓ Verified</strong></p>' : ''}
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">
              ${new Date(report.createdAt).toLocaleDateString()}
            </p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
      });

      markersRef.current.push(marker);
    });
  }, [filteredReports]);

  const uniqueTypes = [...new Set(reports.map(r => r.type))];

  return (
    <div className="h-screen flex">
      {/* Filters Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Crime Map</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-2" />
                Filter by Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Types</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="verified"
                checked={showVerified}
                onChange={(e) => setShowVerified(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="verified" className="text-sm text-gray-700">
                Show verified only
              </label>
            </div>

            <div className="mt-4">
              <h4 className="font-medium mb-2">Legend</h4>
              <div className="space-y-2">
                {Object.entries(crimeTypeColors).map(([type, color]) => (
                  <div key={type} className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm">{type}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600">
                <strong>{filteredReports.length}</strong> reports showing
              </p>
            </div>
          </div>
        </div>

        {/* Report List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                const marker = markersRef.current.find(m => 
                  m.position.lat() === report.lat && m.position.lng() === report.lng
                );
                if (marker) {
                  new google.maps.InfoWindow({
                    content: `
                      <div style="padding: 8px;">
                        <h3 style="margin: 0 0 8px 0; font-weight: bold;">${report.type}</h3>
                        <p style="margin: 0 0 8px 0;">${report.description}</p>
                      </div>
                    `
                  }).open(mapInstanceRef.current, marker);
                }
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{report.type}</span>
                    {report.verified && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {report.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />
      </div>
    </div>
  );
}

export default Map;

