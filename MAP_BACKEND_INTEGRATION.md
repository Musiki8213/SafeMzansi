# Map Component Backend Integration Guide

## Overview

This guide explains how to integrate the SafeMzansi interactive map component with your backend API to fetch real-time crime reports and update hotspots dynamically.

## Backend API Requirements

### 1. GET `/api/reports` - Fetch All Reports

**Request:**
```http
GET /api/reports
Authorization: Bearer <token>
```

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

**Alternative Response Formats Supported:**
- `{ "data": [...] }`
- `[...]` (direct array)

### 2. POST `/api/reports` - Submit New Report

**Request:**
```http
POST /api/reports
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Crime Title",
  "description": "Description of incident",
  "type": "Theft",
  "location": "Address or location name",
  "lat": -26.2041,
  "lng": 28.0473
}
```

**Response:**
```json
{
  "message": "Report submitted successfully",
  "report": {
    "id": "report_123",
    "title": "Crime Title",
    "type": "Theft",
    "description": "Description of incident",
    "location": "Address or location name",
    "lat": -26.2041,
    "lng": 28.0473,
    "createdAt": "2025-01-15T10:30:00Z",
    "verified": false
  }
}
```

## Frontend Integration

### Automatic Updates

The map component automatically:
1. Fetches reports on component mount
2. Calculates hotspots based on report proximity
3. Updates when `filteredReports` state changes
4. Recalculates hotspots when new reports are added

### Adding Reports Programmatically

#### Method 1: Via API (Recommended)

```javascript
import { reportsAPI } from '../utils/api';

// Submit a new report
const handleSubmitReport = async (reportData) => {
  try {
    const response = await reportsAPI.submitReport(
      reportData.title,
      reportData.description,
      reportData.type,
      reportData.location,
      reportData.lat,
      reportData.lng
    );
    
    // Refresh reports from API
    const updatedReports = await reportsAPI.getReports();
    setReports(updatedReports.reports || updatedReports.data || updatedReports);
    
    toast.success('Report submitted successfully!');
  } catch (error) {
    toast.error('Failed to submit report');
  }
};
```

#### Method 2: Direct State Update (For Real-time Updates)

```javascript
// In your Map component or parent component
const addReportToMap = (newReport) => {
  const report = {
    id: newReport.id || `report_${Date.now()}`,
    title: newReport.title,
    type: newReport.type,
    description: newReport.description,
    location: newReport.location,
    lat: parseFloat(newReport.lat),
    lng: parseFloat(newReport.lng),
    createdAt: newReport.createdAt || new Date().toISOString(),
    verified: newReport.verified || false
  };
  
  // Add to reports state - hotspots will auto-update
  setReports(prev => [...prev, report]);
};
```

### Real-time Updates with WebSockets (Optional)

For real-time updates when reports are added by other users:

```javascript
// Example: Using WebSocket or Socket.io
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
    
    toast.info('New crime report added nearby');
  });
  
  return () => socket.disconnect();
}, []);
```

## Hotspot Calculation

Hotspots are automatically calculated using the `calculateHotspots()` function:

### How It Works

1. **Groups nearby reports** within ~500 meters of each other
2. **Calculates center point** for each hotspot
3. **Assigns danger levels** based on report count:
   - **Low**: 1 report (Deep blue)
   - **Medium**: 2-4 reports (Orange)
   - **High**: 5-9 reports (Red)
   - **Critical**: 10+ reports (Dark red)

### Customizing Hotspot Radius

Edit the distance threshold in `calculateHotspots()`:

```javascript
if (distance < 0.5) { // Change 0.5 to adjust radius (in km)
  // 0.5 = ~500 meters
  // 1.0 = ~1 kilometer
  // 0.25 = ~250 meters
}
```

### Customizing Danger Levels

Modify `getDangerLevel()` function:

```javascript
const getDangerLevel = (count) => {
  if (count >= 15) return 'critical';  // Adjust thresholds
  if (count >= 8) return 'high';
  if (count >= 3) return 'medium';
  return 'low';
};
```

## Heatmap Visualization

The map uses MapLibre's built-in heatmap layer that:
- Visualizes crime density with color gradients
- Updates automatically when reports change
- Uses professional color palette (blue → orange → red)

### Heatmap Colors

- **Transparent/Blue** (0-0.2 density): Low danger areas
- **Orange** (0.4 density): Medium danger
- **Red** (0.6 density): High danger
- **Dark Red** (0.8-1.0 density): Critical danger zones

## Manual Pin Placement

Users can manually place pins on the map:

1. Click the **"Place Pin"** button (green + icon)
2. Click anywhere on the map
3. Pin appears with coordinates
4. Use coordinates to submit a report

```javascript
// Access manual pin location
const handleReportWithManualPin = () => {
  if (manualPinLocation) {
    // Use manualPinLocation.lat and manualPinLocation.lng
    submitReport({
      lat: manualPinLocation.lat,
      lng: manualPinLocation.lng,
      // ... other report data
    });
  }
};
```

## Filtering Reports

Reports can be filtered by:
- **Crime Type**: Dropdown selection
- **Date Range**: Start and end dates

Filters automatically update:
- `filteredReports` state
- Hotspot calculations
- Heatmap visualization
- Pin display

## Performance Optimization

### For Large Datasets

1. **Limit initial fetch:**
```javascript
// Backend: Add pagination
GET /api/reports?limit=100&offset=0

// Frontend: Load more on scroll/zoom
```

2. **Cluster nearby reports:**
```javascript
// Only show individual pins at high zoom levels
{viewport.zoom > 14 && filteredReports.map(...)}
```

3. **Debounce hotspot calculation:**
```javascript
const debouncedHotspots = useMemo(() => {
  return calculateHotspots();
}, [filteredReports]);
```

## Example: Complete Integration

```javascript
import { useState, useEffect } from 'react';
import { reportsAPI } from '../utils/api';
import SafeMzansiMap from './pages/Map';

function App() {
  const [reports, setReports] = useState([]);
  
  // Fetch reports on mount
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await reportsAPI.getReports();
        setReports(response.reports || response.data || response);
      } catch (error) {
        console.error('Error fetching reports:', error);
      }
    };
    
    fetchReports();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchReports, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // Handle new report submission
  const handleNewReport = async (reportData) => {
    try {
      await reportsAPI.submitReport(
        reportData.title,
        reportData.description,
        reportData.type,
        reportData.location,
        reportData.lat,
        reportData.lng
      );
      
      // Refresh reports
      const updated = await reportsAPI.getReports();
      setReports(updated.reports || updated.data || updated);
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  };
  
  return (
    <SafeMzansiMap 
      reports={reports}
      onReportSubmit={handleNewReport}
    />
  );
}
```

## Testing

### Test Adding Reports

```javascript
// In browser console or test file
const testReport = {
  title: 'Test Crime',
  description: 'This is a test report',
  type: 'Theft',
  location: 'Test Location',
  lat: -26.2041,
  lng: 28.0473
};

// Add to map
setReports(prev => [...prev, {
  ...testReport,
  id: `test_${Date.now()}`,
  createdAt: new Date().toISOString(),
  verified: false
}]);
```

### Verify Hotspot Updates

1. Add multiple reports in the same area (within 500m)
2. Watch for hotspot formation
3. Check danger level colors match report count
4. Verify heatmap intensity increases

## Troubleshooting

### Reports Not Showing

- Check API response format matches expected structure
- Verify `lat` and `lng` are valid numbers
- Check browser console for errors
- Ensure reports have valid coordinates

### Hotspots Not Updating

- Verify `filteredReports` state is updating
- Check `calculateHotspots()` is being called
- Ensure reports are within proximity threshold
- Check for JavaScript errors in console

### Heatmap Not Visible

- Ensure `filteredReports.length > 0`
- Check MapLibre GL JS is loaded correctly
- Verify heatmap layer is added to map
- Check zoom level (heatmap may be hidden at low zoom)

## Next Steps

1. **Implement backend API endpoints** (`/api/reports` GET and POST)
2. **Add authentication** to protect report submission
3. **Set up real-time updates** (WebSockets/Socket.io)
4. **Add report verification** workflow
5. **Implement clustering** for better performance with many reports

