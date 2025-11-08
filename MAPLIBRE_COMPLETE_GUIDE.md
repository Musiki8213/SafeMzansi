# MapLibre GL JS Complete Implementation Guide

## Overview

The SafeMzansi map component uses **MapLibre GL JS** (free, open-source) with **OpenStreetMap tiles** (free) to display interactive crime reports with heatmaps, pins, and real-time updates.

## Features Implemented

✅ **Hotspots & Heatmaps**
- True heatmap layer using MapLibre's built-in heatmap visualization
- Colored hotspot markers showing danger zones
- Individual pins for each crime report
- Automatic updates when reports are added

✅ **User Location & Input**
- Current location via browser GPS (`navigator.geolocation`)
- Location search using Nominatim (free geocoding)
- Manual pin placement - click "Place Pin" button, then click map

✅ **Map Controls & Interactivity**
- Zoom controls (built-in, top-right)
- Scale bar (built-in, bottom-left)
- "Center on me" button (custom, bottom-right)
- Click hotspots/pins to see popups with crime details
- Hover effects: scale, opacity, color transitions

✅ **Design**
- Responsive for web and mobile
- Professional color palette: Deep blue (#3B82F6), grays, reds for danger
- Glassmorphism overlays for all UI elements
- Custom styled popups

✅ **Free/Open-Source Only**
- MapLibre GL JS (free)
- OpenStreetMap tiles (free)
- Nominatim geocoding (free, with rate limits)
- No API keys required
- No paid services

## Installation

The component only requires `maplibre-gl`:

```bash
npm install maplibre-gl
```

## Backend Integration

### API Endpoints Required

#### GET `/api/reports`
Fetch all crime reports:

```javascript
// Response format
{
  "reports": [
    {
      "id": "report_123",
      "title": "Crime Title",
      "type": "Theft",
      "description": "Description",
      "location": "Address",
      "lat": -26.2041,
      "lng": 28.0473,
      "createdAt": "2025-01-15T10:30:00Z",
      "verified": false
    }
  ]
}
```

#### POST `/api/reports`
Submit new report:

```javascript
// Request body
{
  "title": "Crime Title",
  "description": "Description",
  "type": "Theft",
  "location": "Address",
  "lat": -26.2041,
  "lng": 28.0473
}
```

### Adding Reports Dynamically

#### Method 1: Via API (Recommended)

```javascript
import { reportsAPI } from '../utils/api';

const handleSubmitReport = async (reportData) => {
  try {
    // Submit to backend
    await reportsAPI.submitReport(
      reportData.title,
      reportData.description,
      reportData.type,
      reportData.location,
      reportData.lat,
      reportData.lng
    );
    
    // Refresh reports - map will auto-update
    const updated = await reportsAPI.getReports();
    setReports(updated.reports || updated.data || updated);
    
    toast.success('Report submitted successfully!');
  } catch (error) {
    toast.error('Failed to submit report');
  }
};
```

#### Method 2: Direct State Update (For Real-time)

```javascript
// Add report to state - hotspots will auto-update
const addReport = (newReport) => {
  setReports(prev => [...prev, {
    id: newReport.id || `report_${Date.now()}`,
    title: newReport.title,
    type: newReport.type,
    description: newReport.description,
    location: newReport.location,
    lat: parseFloat(newReport.lat),
    lng: parseFloat(newReport.lng),
    createdAt: newReport.createdAt || new Date().toISOString(),
    verified: newReport.verified || false
  }]);
};
```

### Real-time Updates with WebSockets

For real-time updates when other users add reports:

```javascript
useEffect(() => {
  const socket = io('ws://your-backend-url');
  
  socket.on('new-report', (report) => {
    // Add new report to map
    setReports(prev => [...prev, {
      id: report.id,
      title: report.title,
      type: report.type,
      description: report.description,
      location: report.location,
      lat: parseFloat(report.lat),
      lng: parseFloat(report.lng),
      createdAt: report.createdAt,
      verified: report.verified || false
    }]);
    
    // Heatmap and hotspots will automatically update
    toast.info('New crime report added nearby');
  });
  
  return () => socket.disconnect();
}, []);
```

## Hotspot Calculation

Hotspots are automatically calculated:

1. **Groups nearby reports** within ~500 meters
2. **Calculates center point** for each hotspot
3. **Assigns danger levels**:
   - **Low** (1 report): Deep blue (#3B82F6)
   - **Medium** (2-4 reports): Orange (#F59E0B)
   - **High** (5-9 reports): Red (#DC2626)
   - **Critical** (10+ reports): Dark red (#991B1B)

### Customizing Hotspot Radius

Edit the distance threshold:

```javascript
if (distance < 0.5) { // Change 0.5 to adjust (in km)
  // 0.5 = ~500 meters
  // 1.0 = ~1 kilometer
  // 0.25 = ~250 meters
}
```

## Heatmap Visualization

The component uses MapLibre's built-in heatmap layer with:
- **Gradient colors**: Blue → Orange → Red → Dark Red
- **Dynamic radius**: Adjusts based on zoom level (20-50px)
- **Opacity**: 0.7 for visibility
- **Automatic updates** when reports change

## Manual Pin Placement

Users can manually place pins:

1. Click **"Place Pin"** button (green + icon)
2. Click anywhere on the map
3. Pin appears with coordinates
4. Use coordinates to submit report

```javascript
// Access manual pin location
if (manualPinLocation) {
  const { lat, lng } = manualPinLocation;
  // Use for report submission
  submitReport({ lat, lng, ...otherData });
}
```

## React Native Integration

For React Native, use `@maplibre/maplibre-gl-react-native`:

### Installation

```bash
npm install @maplibre/maplibre-gl-react-native
cd ios && pod install  # For iOS
```

### Basic Usage

```javascript
import MapLibreGL from '@maplibre/maplibre-gl-react-native';

function SafeMzansiMapNative() {
  const [region, setRegion] = useState({
    latitude: -26.2041,
    longitude: 28.0473,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  return (
    <MapLibreGL.MapView
      style={{ flex: 1 }}
      styleURL="https://demotiles.maplibre.org/style.json"
      zoomEnabled={true}
      scrollEnabled={true}
      onRegionDidChange={(region) => {
        setRegion(region.properties);
      }}
    >
      {/* Heatmap using CircleLayer */}
      {hotspots.map((hotspot) => (
        <MapLibreGL.CircleLayer
          key={hotspot.id}
          id={hotspot.id}
          style={{
            circleRadius: Math.min(60, 20 + hotspot.count * 5),
            circleColor: dangerLevels[hotspot.dangerLevel].color,
            circleOpacity: dangerLevels[hotspot.dangerLevel].intensity,
            circleStrokeWidth: 2,
            circleStrokeColor: '#ffffff',
          }}
        >
          <MapLibreGL.ShapeSource
            id={`source-${hotspot.id}`}
            shape={{
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [hotspot.lng, hotspot.lat],
              },
            }}
          />
        </MapLibreGL.CircleLayer>
      ))}

      {/* Markers */}
      {reports.map((report) => (
        <MapLibreGL.PointAnnotation
          key={report.id}
          id={report.id}
          coordinate={[report.lng, report.lat]}
        >
          <View style={styles.marker}>
            <Text style={styles.markerText}>{report.type}</Text>
          </View>
        </MapLibreGL.PointAnnotation>
      ))}
    </MapLibreGL.MapView>
  );
}
```

### Key Differences from Web

- **Coordinates**: `[longitude, latitude]` array format
- **Events**: `onRegionDidChange` instead of `onMove`
- **Styling**: StyleSheet API instead of CSS
- **Components**: `PointAnnotation` instead of `Marker`

## Customization

### Change Map Style

Replace the style object in map initialization:

```javascript
map.current = new maplibregl.Map({
  container: mapContainer.current,
  style: 'https://your-custom-style.json', // Or custom style object
  center: DEFAULT_CENTER,
  zoom: DEFAULT_ZOOM
});
```

### Adjust Heatmap Colors

Edit the heatmap-color array:

```javascript
'heatmap-color': [
  'interpolate',
  ['linear'],
  ['heatmap-density'],
  0, 'rgba(59, 130, 246, 0)',    // Your colors
  0.2, 'rgba(59, 130, 246, 0.3)',
  // ... etc
]
```

### Change Danger Level Thresholds

Modify `getDangerLevel()`:

```javascript
const getDangerLevel = (count) => {
  if (count >= 15) return 'critical';
  if (count >= 8) return 'high';
  if (count >= 3) return 'medium';
  return 'low';
};
```

## Performance Tips

1. **Limit report count**: Paginate or filter on backend
2. **Cluster at low zoom**: Show clusters instead of individual pins
3. **Debounce updates**: Don't recalculate on every state change
4. **Lazy load**: Load reports as user zooms/pans

## Troubleshooting

### Map Not Showing
- Ensure `maplibre-gl/dist/maplibre-gl.css` is imported
- Check browser console for errors
- Verify OpenStreetMap tiles are accessible

### Heatmap Not Visible
- Ensure `filteredReports.length > 0`
- Check zoom level (heatmap hidden at very low zoom)
- Verify heatmap layer is added correctly

### Markers Not Appearing
- Check `filteredReports` has data
- Verify coordinates are valid numbers
- Check browser console for errors

### Popups Not Working
- Check `selectedReport` state is set
- Verify popup content is valid HTML
- Check for JavaScript errors

## Free Services Used

✅ **MapLibre GL JS** - Free, open-source  
✅ **OpenStreetMap** - Free map tiles  
✅ **Nominatim** - Free geocoding (with rate limits)  
✅ **No API keys required**  
✅ **No paid services**

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 12+)
- Mobile browsers: ✅ Full support

## License

All libraries are open-source and free:
- MapLibre GL JS: BSD 2-Clause
- OpenStreetMap: ODbL
- Nominatim: ODbL

## Next Steps

1. Implement backend API endpoints (`/api/reports` GET and POST)
2. Add authentication for report submission
3. Set up real-time updates (WebSockets/Socket.io)
4. Add report verification workflow
5. Implement clustering for better performance with many reports

