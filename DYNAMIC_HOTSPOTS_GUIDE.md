# Dynamic Hotspots Enhancement Guide

## Overview

The SafeMzansi map component has been enhanced with dynamic hotspots that automatically update from the backend, periodic polling, verified/unverified pin differentiation, and smooth animations.

## Key Features

### 1. Periodic Polling (30 seconds)
- Automatically fetches new reports every 30 seconds
- Shows toast notifications when new reports are added
- Seamless updates without page refresh
- Hotspots and heatmap automatically recalculate

### 2. Enhanced Heatmap Colors
- **Green** (low density): `rgba(16, 185, 129, ...)` - Safe areas
- **Yellow** (medium density): `rgba(251, 191, 36, ...)` - Moderate activity
- **Orange** (high density): `rgba(249, 115, 22, ...)` - High activity
- **Red** (critical density): `rgba(220, 38, 38, ...)` - Critical danger zones

### 3. Verified vs Unverified Pins
- **Verified pins**:
  - Green border (`#10B981`)
  - Checkmark icon
  - Enhanced glow effect
  - Thicker border (3px)
  
- **Unverified pins**:
  - Gray border (`#9CA3AF`)
  - Exclamation icon
  - Standard shadow
  - Thinner border (2px)

### 4. Smooth Animations
- **Pin appear**: Scale and fade-in animation when pins are added
- **Hotspot pulse**: Continuous pulsing animation for hotspots
- **Hotspot appear**: Scale animation when hotspots are created
- **Hover effects**: Smooth scale and translate on hover
- **Filter panel**: Slide-down animation when opened

### 5. Clustering Support
- For datasets with > 100 reports:
  - Individual pins only shown at zoom level 12+
  - Hotspots always visible at all zoom levels
  - Improves performance with large datasets

## Backend Integration

### API Endpoint: GET `/api/reports`

**Response Format:**
```json
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

### Polling Behavior

The component:
1. Fetches reports on initial mount
2. Polls every 30 seconds for updates
3. Compares report IDs to detect new reports
4. Shows toast notification for new reports
5. Automatically updates hotspots and heatmap

### Adding Reports Programmatically

```javascript
import { reportsAPI } from '../utils/api';

// Submit new report
const newReport = await reportsAPI.submitReport(
  title, description, type, location, lat, lng
);

// Reports will automatically update on next poll (30s)
// Or manually refresh:
const updated = await reportsAPI.getReports();
setReports(updated.reports || updated.data || updated);
```

## Hotspot Calculation

Hotspots are automatically calculated based on:
- **Proximity**: Reports within ~500 meters are grouped
- **Danger levels**:
  - **Low** (1 report): Green
  - **Medium** (2-4 reports): Yellow
  - **High** (5-9 reports): Orange
  - **Critical** (10+ reports): Red

### Customizing Hotspot Radius

Edit the distance threshold in `calculateHotspots()`:

```javascript
if (distance < 0.5) { // Change 0.5 to adjust (in km)
  // 0.5 = ~500 meters
  // 1.0 = ~1 kilometer
  // 0.25 = ~250 meters
}
```

## Performance Optimization

### Clustering

For large datasets (> 100 reports):
- Individual pins hidden at zoom < 12
- Hotspots always visible
- Heatmap always visible
- Improves rendering performance

### Customizing Clustering Threshold

```javascript
const shouldShowPins = filteredReports.length <= 100 || currentZoom >= 12;
// Change 100 to adjust report count threshold
// Change 12 to adjust zoom level threshold
```

## Filtering

The component supports filtering by:
- **Crime type**: Dropdown with all unique types
- **Date range**: Start and end date inputs
- **Real-time updates**: Filters apply immediately with smooth transitions

## Animations

### Pin Animations
- `pin-appear`: 0.5s ease-out
  - Scale from 0 to 1.1 to 1
  - Fade in from opacity 0 to 1
  - Translate Y from 20px to 0

### Hotspot Animations
- `hotspot-appear`: 0.6s ease-out
  - Scale from 0 to 1.2 to 1
  - Fade in from opacity 0 to 1
  
- `hotspot-pulse`: 2s ease-in-out infinite
  - Pulsing box-shadow effect
  - Continuous animation

### Hover Effects
- Smooth scale and translate
- Enhanced shadows
- Color transitions
- Uses `cubic-bezier(0.4, 0, 0.2, 1)` for smooth easing

## Real-time Updates

### Option 1: Periodic Polling (Current)
- Polls every 30 seconds
- Simple, no backend changes needed
- Works with any backend

### Option 2: WebSocket (Recommended for Production)

```javascript
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
    
    toast.success('New crime report added nearby', {
      icon: '📍'
    });
  });
  
  return () => socket.disconnect();
}, []);
```

## Customization

### Change Polling Interval

```javascript
const pollInterval = setInterval(() => {
  fetchReports(true);
}, 30000); // Change 30000 to adjust (milliseconds)
```

### Disable Polling

Remove or comment out the `setInterval` block in the `fetchReports` useEffect.

### Customize Toast Duration

```javascript
toast.success(`${newReports.length} new report${newReports.length > 1 ? 's' : ''} added`, {
  duration: 2000, // Change duration (milliseconds)
  icon: '📍'
});
```

## Troubleshooting

### Reports Not Updating
- Check browser console for API errors
- Verify `/api/reports` endpoint returns correct format
- Check network tab for failed requests
- Ensure polling interval is running (check console logs)

### Animations Not Working
- Verify CSS animations are loaded
- Check browser supports CSS animations
- Ensure no conflicting styles

### Performance Issues
- Enable clustering for large datasets
- Reduce polling frequency
- Limit number of reports fetched
- Use backend pagination

## Best Practices

1. **Backend Optimization**:
   - Implement pagination for large datasets
   - Cache reports on backend
   - Use database indexes on lat/lng

2. **Frontend Optimization**:
   - Use clustering for > 100 reports
   - Debounce filter changes
   - Lazy load reports on zoom

3. **Real-time Updates**:
   - Use WebSockets for production
   - Fallback to polling if WebSocket fails
   - Show connection status to users

4. **User Experience**:
   - Show loading states
   - Display update notifications
   - Smooth transitions
   - Clear visual feedback

## Next Steps

1. Implement WebSocket support for true real-time updates
2. Add backend pagination for large datasets
3. Implement report caching
4. Add user preferences for polling frequency
5. Add export functionality for filtered reports

