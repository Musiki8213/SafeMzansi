# SafeMzansi Interactive Map Component - Complete Documentation

## Overview

The SafeMzansi Map component is a fully interactive, real-time crime reporting map built with **MapLibre GL JS** and **OpenStreetMap tiles**. It provides comprehensive crime visualization, hotspot detection, and user interaction features.

## Features Implemented

### ✅ 1. Real-Time Crime Report Fetching
- **Endpoint**: `/api/reports` (via `reportsAPI.getReports()`)
- **Polling**: Automatically fetches new reports every 30 seconds
- **Real-time Updates**: Shows toast notifications when new reports are added
- **Data Format**: Supports multiple response formats:
  - `{ reports: [...] }`
  - `{ data: [...] }`
  - `[...]` (direct array)

### ✅ 2. Hotspot Visualization
- **Heatmap Layer**: Color-coded density visualization
  - **Green** (low density): 0-0.2
  - **Yellow** (medium density): 0.2-0.4
  - **Orange** (high density): 0.4-0.6
  - **Red** (very high density): 0.6-0.8
  - **Dark Red** (critical density): 0.8-1.0
- **Hotspot Markers**: Circular markers showing report counts
  - Size scales with number of reports
  - Color-coded by danger level (low/medium/high/critical)
  - Pulsing animation for visibility
  - Hover effects with scale and glow

### ✅ 3. Interactive Report Pins
- **Verified Reports**: Green border with checkmark icon
- **Unverified Reports**: Gray border with exclamation icon
- **Color Coding**: Each crime type has a unique color
- **Click Interaction**: Opens detailed popup with:
  - Crime type and title
  - Location and timestamp
  - Description (if available)
  - Verification status
- **Hover Effects**: Scale and brightness animations
- **Clustering**: Pins only show at zoom level 12+ for datasets > 100 reports

### ✅ 4. User Location Features
- **GPS Detection**: Browser geolocation API
- **"Center on Me" Button**: One-click centering on user location
- **Manual Location Search**: 
  - OpenStreetMap Nominatim integration
  - Autocomplete search results
  - Click to center on selected location
- **Manual Pin Placement**: 
  - Click map to place pin
  - Visual feedback with green marker
  - Coordinates displayed for reporting

### ✅ 5. Map Controls
- **Zoom Controls**: Standard MapLibre zoom buttons (top-right)
- **Scale Bar**: Metric scale display (bottom-left)
- **Navigation Controls**: Pan and zoom with mouse/touch
- **Responsive Design**: 
  - Desktop: Full-screen map with overlay controls
  - Mobile: Stacked layout with touch-optimized controls

### ✅ 6. Modern Design & UX
- **Color Palette**:
  - Deep blues: `#1D3557` (primary)
  - Subtle grays: `#666666`, `#999999`
  - Danger reds: `#DC2626`, `#B91C1C`
  - Success greens: `#10B981`
- **Glassmorphism Effects**:
  - Frosted glass overlays on all UI elements
  - Backdrop blur for modern aesthetic
  - Semi-transparent backgrounds
- **Smooth Animations**:
  - Pin appearance animations
  - Hotspot pulse effects
  - Hover transitions
  - Filter panel slide-down

### ✅ 7. Advanced Filtering
- **Crime Type Filter**: Dropdown with all available types
- **Date Range Filter**: Start and end date selection
- **Real-time Updates**: Map updates instantly when filters change
- **Filter Statistics**: Shows filtered vs total report counts
- **Clear Filters**: One-click reset

### ✅ 8. Bonus Features
- **Animated New Reports**: New pins/hotspots animate in
- **Toast Notifications**: Subtle notifications for new reports
- **Legend**: Visual guide for danger levels
- **Search Results**: Dropdown with location suggestions
- **Loading States**: Spinner during initial data fetch

## Technical Implementation

### Dependencies
```json
{
  "maplibre-gl": "^latest",
  "react": "^18.0.0",
  "react-hot-toast": "^latest",
  "lucide-react": "^latest"
}
```

### Component Structure
```jsx
<SafeMzansiMap />
  ├── Map Container (MapLibre GL JS)
  ├── Search Bar (Location search)
  ├── Filter Panel (Crime type & date filters)
  ├── Legend (Danger level guide)
  ├── Center User Button (GPS location)
  ├── Place Pin Button (Manual pin placement)
  ├── Hotspot Markers (Density visualization)
  ├── Report Pins (Individual crime reports)
  └── Popups (Report details)
```

### Key Functions

#### `fetchReports()`
- Fetches crime reports from backend
- Handles multiple response formats
- Detects new reports for animations
- Updates state and triggers re-renders

#### `calculateHotspots()`
- Groups reports by proximity (500m radius)
- Calculates center coordinates
- Determines danger levels based on count
- Returns hotspot array for rendering

#### `updateHeatmap()`
- Creates GeoJSON from filtered reports
- Updates MapLibre heatmap layer
- Adjusts intensity and radius by zoom level
- Color interpolation for density visualization

#### `showPopup(report, lng, lat)`
- Creates MapLibre popup with report details
- Handles both individual reports and hotspots
- Formats dates and displays verification status
- Styled with glassmorphism effects

## Backend API Integration

### Required Endpoints

#### GET `/api/reports`
```javascript
// Response format
{
  "reports": [
    {
      "id": "report_123",
      "title": "Theft at Main Street",
      "type": "Theft",
      "description": "Vehicle break-in reported",
      "location": "123 Main Street, Johannesburg",
      "lat": -26.2041,
      "lng": 28.0473,
      "createdAt": "2025-01-15T10:30:00Z",
      "verified": false
    }
  ]
}
```

#### POST `/api/reports`
```javascript
// Request body
{
  "title": "Crime Title",
  "description": "Description of incident",
  "type": "Theft",
  "location": "Address or location name",
  "lat": -26.2041,
  "lng": 28.0473
}
```

### Adding Reports Programmatically

```javascript
import { reportsAPI } from '../utils/api';

// Method 1: Via API (Recommended)
const newReport = await reportsAPI.submitReport(
  title, description, type, location, lat, lng
);

// Then refresh reports
const updated = await reportsAPI.getReports();
setReports(updated.reports || updated.data || updated);

// Method 2: Direct state update (for testing)
setReports(prev => [...prev, {
  id: `report_${Date.now()}`,
  title, type, description, location,
  lat: parseFloat(lat),
  lng: parseFloat(lng),
  createdAt: new Date().toISOString(),
  verified: false
}]);
```

## React Native Mobile Integration

### Recommended Approach

For React Native, you'll need to replace MapLibre GL JS with a React Native-compatible mapping library:

#### Option 1: React Native Maps (Recommended)
```bash
npm install react-native-maps
```

**Key Changes Needed:**
1. Replace `maplibre-gl` with `react-native-maps`
2. Use `MapView` component instead of MapLibre
3. Replace heatmap layer with custom clustering solution
4. Use `react-native-geolocation-service` for GPS
5. Implement custom markers with `Marker` component

**Example Structure:**
```jsx
import MapView, { Marker, HeatMap } from 'react-native-maps';

<MapView
  style={{ flex: 1 }}
  initialRegion={{
    latitude: -26.2041,
    longitude: 28.0473,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  }}
>
  {reports.map(report => (
    <Marker
      key={report.id}
      coordinate={{ lat: report.lat, lng: report.lng }}
      pinColor={report.verified ? 'green' : 'gray'}
    />
  ))}
</MapView>
```

#### Option 2: Mapbox React Native
```bash
npm install @rnmapbox/maps
```

**Advantages:**
- Similar API to MapLibre GL JS
- Better heatmap support
- More features out of the box

### Mobile-Specific Considerations

1. **Permissions**: Request location permissions on mount
2. **Performance**: Use clustering for > 100 markers
3. **Offline Maps**: Consider caching map tiles
4. **Touch Interactions**: Larger touch targets (48px minimum)
5. **Battery Optimization**: Reduce polling frequency on mobile

### Code Adaptation Example

```javascript
// Web version (current)
import maplibregl from 'maplibre-gl';

// React Native version
import MapView from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';

// GPS location (React Native)
const getCurrentLocation = () => {
  Geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      mapRef.current.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    },
    (error) => console.error(error),
    { enableHighAccuracy: true, timeout: 15000 }
  );
};
```

## Styling & Customization

### CSS Variables
```css
:root {
  --primary-blue: #1D3557;
  --accent-cyan: #A8DADC;
  --text-dark: #2B2D42;
  --text-gray: #666666;
}
```

### Crime Type Colors
```javascript
const crimeTypeColors = {
  Theft: '#FF6B6B',
  Robbery: '#DC2626',
  Assault: '#EA580C',
  Vandalism: '#F59E0B',
  'Drug Activity': '#8B5CF6',
  'Suspicious Activity': '#6366F1',
  'Domestic Violence': '#EC4899',
  Hijacking: '#B91C1C',
  Burglary: '#F97316',
  Other: '#6B7280'
};
```

### Customization Points
1. **Colors**: Modify `crimeTypeColors` object
2. **Hotspot Radius**: Change `0.5` km in `calculateHotspots()`
3. **Polling Interval**: Modify `30000` ms in `useEffect`
4. **Zoom Levels**: Adjust clustering threshold (currently 12)
5. **Heatmap Intensity**: Modify `heatmap-intensity` in layer config

## Performance Optimization

### Current Optimizations
- ✅ Clustering for large datasets (> 100 reports)
- ✅ Conditional pin rendering based on zoom level
- ✅ Debounced search (500ms)
- ✅ Memoized hotspot calculations
- ✅ Efficient marker cleanup on updates

### Additional Recommendations
1. **Virtual Scrolling**: For very large datasets (> 1000 reports)
2. **Web Workers**: Move hotspot calculations off main thread
3. **IndexedDB**: Cache reports for offline viewing
4. **Lazy Loading**: Load reports by viewport bounds
5. **Request Batching**: Combine multiple API calls

## Troubleshooting

### Common Issues

**1. Map not loading**
- Check OpenStreetMap tile server availability
- Verify MapLibre GL JS is installed
- Check browser console for CORS errors

**2. Reports not showing**
- Verify API endpoint is correct (`/api/reports`)
- Check response format matches expected structure
- Ensure reports have valid `lat` and `lng` values

**3. Heatmap not visible**
- Check zoom level (heatmap fades at high zoom)
- Verify reports have valid coordinates
- Check browser console for MapLibre errors

**4. Location not working**
- Request location permissions in browser
- Check HTTPS (required for geolocation)
- Verify GPS is enabled on device

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ⚠️ IE11 (not supported - MapLibre requires modern browser)

## License & Attribution

- **MapLibre GL JS**: BSD 3-Clause License
- **OpenStreetMap**: ODbL License
- **Map Tiles**: © OpenStreetMap contributors

## Support & Contributing

For issues, feature requests, or contributions, please refer to the main SafeMzansi repository documentation.

---

**Last Updated**: January 2025
**Component Version**: 1.0.0
**MapLibre GL JS Version**: Latest

