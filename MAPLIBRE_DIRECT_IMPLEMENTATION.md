# MapLibre GL JS Direct Implementation Guide

## Overview

The SafeMzansi map component now uses **MapLibre GL JS directly** (no react-map-gl wrapper) with **OpenStreetMap tiles** for a fully interactive, free, and open-source mapping solution.

## What Changed

✅ **Removed**: `react-map-gl` dependency  
✅ **Using**: `maplibre-gl` directly  
✅ **Tiles**: OpenStreetMap (free)  
✅ **All features preserved**: Heatmaps, pins, search, filters, etc.

## Installation

The component only requires `maplibre-gl`:

```bash
npm install maplibre-gl
```

No other mapping dependencies needed!

## Features

### 1. Hotspots & Heatmaps
- **True heatmap layer** using MapLibre's built-in heatmap visualization
- **Hotspot markers** showing danger zones with colored circles
- **Automatic recalculation** when reports are added/removed

### 2. User Location & Input
- **Current location** via browser GPS (`navigator.geolocation`)
- **Location search** using Nominatim (free geocoding)
- **Manual pin placement** - click "Place Pin" button, then click map

### 3. Map Controls
- **Zoom controls** (top-right)
- **Scale bar** (bottom-left)
- **"Center on me" button** (bottom-right)
- **"Place Pin" button** (for manual reporting)

### 4. Interactivity
- **Click hotspots/pins** to see popups with:
  - Crime type
  - Time/date
  - Verification status
  - Description
- **Hover effects**: Scale, brightness, color fade
- **Smooth animations** and transitions

### 5. Design
- **Responsive** for web and mobile
- **Professional color palette**: Deep blue (#3B82F6), grays, reds for danger
- **Glassmorphism overlays** for all UI elements
- **Modern, clean interface**

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

```javascript
// Method 1: Via API (Recommended)
const newReport = await reportsAPI.submitReport(
  title, description, type, location, lat, lng
);

// Then refresh reports
const updated = await reportsAPI.getReports();
setReports(updated.reports || updated.data || updated);

// Method 2: Direct state update
setReports(prev => [...prev, {
  id: `report_${Date.now()}`,
  title, type, description, location,
  lat: parseFloat(lat),
  lng: parseFloat(lng),
  createdAt: new Date().toISOString(),
  verified: false
}]);
```

### Real-time Updates

For real-time updates when other users add reports:

```javascript
// Example with WebSocket
useEffect(() => {
  const socket = io('ws://your-backend-url');
  
  socket.on('new-report', (report) => {
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
  });
  
  return () => socket.disconnect();
}, []);
```

## Hotspot Calculation

Hotspots are automatically calculated:

1. **Groups nearby reports** within ~500 meters
2. **Calculates center point** for each hotspot
3. **Assigns danger levels**:
   - **Low** (1 report): Deep blue
   - **Medium** (2-4 reports): Orange
   - **High** (5-9 reports): Red
   - **Critical** (10+ reports): Dark red

### Customizing Hotspot Radius

Edit the distance threshold:

```javascript
if (distance < 0.5) { // Change 0.5 to adjust (in km)
  // 0.5 = ~500 meters
  // 1.0 = ~1 kilometer
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
  return (
    <MapLibreGL.MapView
      style={{ flex: 1 }}
      styleURL="https://demotiles.maplibre.org/style.json"
      zoomEnabled={true}
      scrollEnabled={true}
    >
      {/* Add markers */}
      {reports.map((report) => (
        <MapLibreGL.PointAnnotation
          key={report.id}
          coordinate={[report.lng, report.lat]}
        >
          <View style={styles.marker}>
            <Text>{report.type}</Text>
          </View>
        </MapLibreGL.PointAnnotation>
      ))}
      
      {/* Add user location */}
      <MapLibreGL.UserLocation />
    </MapLibreGL.MapView>
  );
}
```

### Key Differences

- **Coordinates**: `[lng, lat]` array format
- **Events**: `onRegionDidChange` instead of `onMove`
- **Styling**: StyleSheet API instead of CSS
- **Components**: `PointAnnotation` instead of `Marker`

See `REACT_NATIVE_MAPLIBRE_GUIDE.md` for complete React Native guide.

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
}
```

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

Edit the heatmap-color array in the heatmap layer:

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

### Markers Not Appearing
- Check `filteredReports` has data
- Verify coordinates are valid numbers
- Check browser console for errors

### Heatmap Not Visible
- Ensure `filteredReports.length > 0`
- Check zoom level (heatmap hidden at very low zoom)
- Verify heatmap layer is added correctly

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

1. Implement backend API endpoints
2. Add authentication for report submission
3. Set up real-time updates (WebSockets)
4. Add report verification workflow
5. Implement clustering for performance

