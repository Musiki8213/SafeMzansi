# Google Maps Integration Guide for SafeMzansi

## Overview

The SafeMzansi map component uses **Google Maps JavaScript API** with the provided API key to display interactive crime reports with heatmaps, pins, and real-time updates.

## API Key

The component uses the following API key:
```
AIzaSyBuBXs8a6a9so-1J37OQDjpASMHZpmhwU8
```

**Important**: This key is configured in the component. For production, consider:
- Moving the key to environment variables
- Restricting the key to specific domains/IPs in Google Cloud Console
- Setting up billing alerts

## Features Implemented

### 1. Hotspots & Heatmaps
- **Google Maps HeatmapLayer** for visual heatmap visualization
- **Hotspot markers** showing danger zones with colored circles
- **Automatic recalculation** when reports are added/removed

### 2. User Location & Input
- **Current location** via browser GPS (`navigator.geolocation`)
- **Google Places Autocomplete** for location search
- **Manual pin placement** - click "Place Pin" button, then click map

### 3. Map Controls
- **Zoom controls** (built-in Google Maps controls)
- **Scale bar** (built-in)
- **"Center on me" button** (custom)
- **"Place Pin" button** (for manual reporting)

### 4. Interactivity
- **Click hotspots/pins** to see InfoWindows with:
  - Crime type
  - Time/date
  - Verification status
  - Description
- **Hover effects**: Scale, opacity changes, color transitions
- **Smooth animations** (DROP animation for markers)

### 5. Design
- **Responsive** for web and mobile
- **Professional color palette**: Deep blue (#3B82F6), grays, reds for danger
- **Glassmorphism overlays** for all UI elements
- **Custom styled InfoWindows** with glassmorphism effects

## Installation

The component uses `@googlemaps/js-api-loader` which is already installed:

```bash
npm install @googlemaps/js-api-loader
```

## Google Maps API Libraries Used

The component loads these Google Maps libraries:
- **maps**: Core map functionality
- **marker**: Advanced marker features
- **places**: Autocomplete and Places services
- **visualization**: Heatmap layer

All are within the **free tier** of Google Maps Platform.

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
    
    // Markers and heatmap will automatically update
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

## Heatmap Visualization

The component uses Google Maps `HeatmapLayer` with:
- **Gradient colors**: Blue → Orange → Red → Dark Red
- **Dynamic radius**: Adjusts based on zoom level
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
}
```

## React Native Integration

For React Native, use `react-native-maps` with Google Maps provider:

### Installation

```bash
npm install react-native-maps
cd ios && pod install  # For iOS
```

### Basic Usage

```javascript
import MapView, { Marker, HeatMap, PROVIDER_GOOGLE } from 'react-native-maps';

function SafeMzansiMapNative() {
  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={{ flex: 1 }}
      initialRegion={{
        latitude: -26.2041,
        longitude: 28.0473,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
      googleMapsApiKey="AIzaSyBuBXs8a6a9so-1J37OQDjpASMHZpmhwU8"
    >
      {/* Heatmap */}
      <HeatMap
        points={filteredReports.map(report => ({
          latitude: report.lat,
          longitude: report.lng,
          weight: 1
        }))}
        radius={30}
        opacity={0.7}
        gradient={{
          colors: [
            'rgba(59, 130, 246, 0)',
            'rgba(59, 130, 246, 0.3)',
            'rgba(245, 158, 11, 0.5)',
            'rgba(220, 38, 38, 0.7)',
            'rgba(153, 27, 27, 0.9)'
          ],
          startPoints: [0, 0.2, 0.4, 0.6, 0.8]
        }}
      />
      
      {/* Markers */}
      {filteredReports.map((report) => (
        <Marker
          key={report.id}
          coordinate={{
            latitude: report.lat,
            longitude: report.lng
          }}
          title={report.title}
          description={report.description}
        />
      ))}
    </MapView>
  );
}
```

### Key Differences from Web

- **Coordinates**: `{ latitude, longitude }` object format
- **Events**: `onRegionChangeComplete` instead of `onMove`
- **Styling**: StyleSheet API instead of CSS
- **Components**: `Marker` component instead of `google.maps.Marker`

## Google Maps Free Tier Limits

The component uses only **free tier features**:

✅ **Maps JavaScript API**: Free up to 28,000 map loads/month  
✅ **Places API (Autocomplete)**: Free up to 1,000 requests/month  
✅ **Heatmap Layer**: Included in Maps JavaScript API  
✅ **Markers**: Included in Maps JavaScript API  

**Note**: After free tier, charges apply. Monitor usage in Google Cloud Console.

## Customization

### Change Map Style

Modify the `styles` array in map initialization:

```javascript
map.current = new Map(mapContainer.current, {
  center: DEFAULT_CENTER,
  zoom: DEFAULT_ZOOM,
  styles: [
    // Add custom map styles
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#A8DADC' }]
    }
  ]
});
```

### Adjust Heatmap Gradient

Edit the gradient array:

```javascript
gradient: [
  'rgba(59, 130, 246, 0)',
  'rgba(59, 130, 246, 0.3)',
  // Your custom colors
]
```

### Change Marker Icons

Modify the icon configuration:

```javascript
const icon = {
  path: google.maps.SymbolPath.CIRCLE, // or BACKWARD_CLOSED_ARROW
  scale: 8,
  fillColor: color,
  fillOpacity: 0.9,
  strokeColor: '#ffffff',
  strokeWeight: 2
};
```

## Performance Tips

1. **Limit report count**: Paginate or filter on backend
2. **Cluster markers**: Use marker clustering at low zoom levels
3. **Debounce updates**: Don't recalculate on every state change
4. **Lazy load**: Load reports as user zooms/pans

## Security Best Practices

1. **Restrict API Key**: 
   - Go to Google Cloud Console
   - Restrict key to your domain
   - Set HTTP referrer restrictions

2. **Environment Variables**:
   ```javascript
   const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
   ```

3. **Monitor Usage**: Set up billing alerts in Google Cloud Console

## Troubleshooting

### Map Not Loading
- Check API key is valid
- Verify key has Maps JavaScript API enabled
- Check browser console for errors
- Ensure billing is set up (even for free tier)

### Heatmap Not Visible
- Ensure `filteredReports.length > 0`
- Check HeatmapLayer is initialized
- Verify visualization library is loaded

### Markers Not Appearing
- Check `filteredReports` has data
- Verify coordinates are valid numbers
- Check browser console for errors

### Autocomplete Not Working
- Verify Places API is enabled for your key
- Check API key restrictions
- Ensure Places library is loaded

## Free Tier Usage

Monitor your usage at: https://console.cloud.google.com/google/maps-apis

**Free Tier Includes**:
- 28,000 map loads/month
- 1,000 Places Autocomplete requests/month
- Unlimited markers and heatmaps (within map loads)

## Next Steps

1. **Set up billing** in Google Cloud Console (required even for free tier)
2. **Restrict API key** to your domain
3. **Monitor usage** to stay within free tier
4. **Implement backend API** endpoints
5. **Add real-time updates** (WebSockets)
6. **Set up clustering** for better performance

## Resources

- [Google Maps JavaScript API Docs](https://developers.google.com/maps/documentation/javascript)
- [Google Maps Platform Pricing](https://mapsplatform.google.com/pricing/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)

