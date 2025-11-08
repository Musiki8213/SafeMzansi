# MapLibre GL JS Setup Guide for SafeMzansi

## Overview

The SafeMzansi map component uses **MapLibre GL JS** (free, open-source) with **OpenStreetMap tiles** (free) to display interactive crime reports with hotspot visualization.

## Features Implemented

✅ **Hotspot Visualization**
- Colored heatmaps showing danger zones
- Individual pins for crime reports
- Dynamic updates as reports are added

✅ **User Reporting**
- Current location (browser/mobile GPS)
- Search and type location manually
- Pin location on map when reporting

✅ **Interactivity**
- Click hotspots/pins to see details (crime type, time, status)
- Hover effects with blur and color fade
- Smooth transitions

✅ **Mobile + Web Support**
- Fully responsive layout
- Adapts to screen size
- Works with React for web

✅ **Extras**
- Zoom controls
- Scale bar
- Location button ("center on me")
- Legend explaining danger level colors
- Professional color palette (deep blue, gray, subtle reds)
- Glassmorphism effects for overlays

## Installation

```bash
cd client
npm install maplibre-gl react-map-gl
```

## Usage

The map component is already integrated into `client/src/pages/Map.jsx`. It automatically:
- Fetches reports from `/api/reports`
- Calculates hotspots based on report proximity
- Updates dynamically when new reports are added

## Adding New Crime Reports

### Method 1: Via API (Recommended)

```javascript
import { reportsAPI } from '../utils/api';

// Submit a new report
const newReport = await reportsAPI.submitReport(
  'Crime Title',
  'Description of the incident',
  'Theft',
  '123 Main Street, Johannesburg',
  -26.2041,  // latitude
  28.0473    // longitude
);

// The map will automatically refresh and show the new report
```

### Method 2: Direct State Update

```javascript
// In your component
const addReport = (reportData) => {
  const newReport = {
    id: `report_${Date.now()}`,
    title: reportData.title,
    type: reportData.type,
    description: reportData.description,
    location: reportData.location,
    lat: reportData.lat,
    lng: reportData.lng,
    createdAt: new Date().toISOString(),
    verified: false
  };
  
  // Add to reports state
  setReports(prev => [...prev, newReport]);
  
  // Hotspots will automatically recalculate
};
```

## Updating Hotspots Dynamically

Hotspots are automatically recalculated when:
- Reports are added/removed
- Filters are applied
- Component re-renders

The `calculateHotspots()` function:
- Groups reports within ~500m of each other
- Calculates center point for each hotspot
- Assigns danger levels based on report count:
  - **Low**: 1 report (blue)
  - **Medium**: 2-4 reports (orange)
  - **High**: 5-9 reports (red)
  - **Critical**: 10+ reports (dark red)

## Color Palette

### Crime Type Colors
- Theft: `#FF6B6B`
- Robbery: `#DC2626`
- Assault: `#EA580C`
- Vandalism: `#F59E0B`
- Drug Activity: `#8B5CF6`
- Suspicious Activity: `#6366F1`
- Domestic Violence: `#EC4899`
- Other: `#6B7280`

### Danger Level Colors
- Low: Deep Blue (`#3B82F6`) - 30% opacity
- Medium: Orange (`#F59E0B`) - 60% opacity
- High: Red (`#DC2626`) - 90% opacity
- Critical: Dark Red (`#991B1B`) - 100% opacity

## Customization

### Change Hotspot Radius

Edit the distance threshold in `calculateHotspots()`:

```javascript
if (distance < 0.5) { // Change 0.5 to adjust radius (in km)
  // ~500 meters default
}
```

### Adjust Danger Level Thresholds

Modify `getDangerLevel()` function:

```javascript
const getDangerLevel = (count) => {
  if (count >= 10) return 'critical';  // Adjust thresholds
  if (count >= 5) return 'high';
  if (count >= 2) return 'medium';
  return 'low';
};
```

### Change Map Style

Replace the `mapStyle` prop in the Map component:

```javascript
// Use a different OpenStreetMap style
mapStyle="https://your-custom-style.json"

// Or use a custom style object
mapStyle={{
  version: 8,
  sources: { /* ... */ },
  layers: [ /* ... */ ]
}}
```

## React Native Integration

See `REACT_NATIVE_MAPLIBRE_GUIDE.md` for complete React Native setup instructions using `react-native-maplibre-gl`.

## Troubleshooting

### Map not showing
- Ensure `maplibre-gl/dist/maplibre-gl.css` is imported
- Check browser console for errors
- Verify OpenStreetMap tiles are accessible

### Hotspots not updating
- Check that `filteredReports` state is updating
- Verify `calculateHotspots()` is being called
- Check browser console for errors

### Location search not working
- Nominatim API may have rate limits
- Check network tab for API responses
- Ensure proper User-Agent header is set

## Free Services Used

✅ **MapLibre GL JS** - Free, open-source map library
✅ **OpenStreetMap** - Free map tiles
✅ **Nominatim** - Free geocoding service (with rate limits)
✅ **No API keys required**
✅ **No paid services**

## Performance Tips

1. **Limit report count**: Filter or paginate reports for better performance
2. **Debounce search**: Location search is already debounced (500ms)
3. **Memoize calculations**: `calculateHotspots` uses `useCallback`
4. **Lazy load**: Consider lazy loading the map component

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 12+)
- Mobile browsers: ✅ Full support

## License

All libraries used are open-source and free:
- MapLibre GL JS: BSD 2-Clause
- OpenStreetMap: ODbL
- React Map GL: MIT

