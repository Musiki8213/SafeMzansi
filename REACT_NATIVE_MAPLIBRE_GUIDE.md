# React Native MapLibre Integration Guide

This guide explains how to use MapLibre GL JS in React Native for the SafeMzansi mobile app.

## Installation

```bash
npm install @maplibre/maplibre-gl-react-native
cd ios && pod install  # For iOS
```

For Android, add to `android/app/build.gradle`:
```gradle
dependencies {
    implementation 'org.maplibre.gl:android-sdk:10.0.0'
}
```

## Basic Setup

### 1. Import MapLibre

```javascript
import MapLibreGL from '@maplibre/maplibre-gl-react-native';
```

### 2. Create Map Component

```javascript
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-gl-react-native';

function SafeMzansiMapNative() {
  const [reports, setReports] = useState([]);
  const [region, setRegion] = useState({
    latitude: -26.2041,
    longitude: 28.0473,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        styleURL="https://demotiles.maplibre.org/style.json"
        zoomEnabled={true}
        scrollEnabled={true}
        onRegionDidChange={(region) => {
          setRegion(region.properties);
        }}
      >
        {/* Heatmap using CircleLayer for hotspots */}
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

        {/* Individual report markers */}
        {reports.map((report) => (
          <MapLibreGL.PointAnnotation
            key={report.id}
            id={report.id}
            coordinate={[report.lng, report.lat]}
            onSelected={() => {
              // Show popup with report details
              showReportDetails(report);
            }}
          >
            <View style={styles.marker}>
              <View style={[
                styles.markerPin,
                { backgroundColor: crimeTypeColors[report.type] || '#6B7280' }
              ]}>
                <Text style={styles.markerText}>!</Text>
              </View>
            </View>
          </MapLibreGL.PointAnnotation>
        ))}
      </MapLibreGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  marker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  markerText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
```

## Key Differences from Web

### 1. Coordinate Format
- **Web**: `[lng, lat]` array
- **React Native**: `[lng, lat]` array (same, but use `coordinate` prop)

### 2. Map Component
- **Web**: `new maplibregl.Map()`
- **React Native**: `<MapLibreGL.MapView>`

### 3. Markers
- **Web**: `new maplibregl.Marker()`
- **React Native**: `<MapLibreGL.PointAnnotation>`

### 4. Heatmap
- **Web**: Built-in `heatmap` layer type
- **React Native**: Use `CircleLayer` with multiple circles (or custom heatmap library)

## Adding Hotspots

For hotspot visualization, use CircleLayer:

```javascript
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
```

## User Location

```javascript
import * as Location from 'expo-location';

const [userLocation, setUserLocation] = useState(null);

useEffect(() => {
  (async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
    }
  })();
}, []);

// Add user location marker
{userLocation && (
  <MapLibreGL.PointAnnotation
    coordinate={[userLocation.longitude, userLocation.latitude]}
  >
    <View style={styles.userLocationMarker}>
      <View style={styles.userLocationDot} />
    </View>
  </MapLibreGL.PointAnnotation>
)}
```

## Location Search

Use Nominatim API (same as web):

```javascript
const searchLocation = async (query) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
      {
        headers: {
          'User-Agent': 'SafeMzansi/1.0'
        }
      }
    );
    const data = await response.json();
    return data.map(item => ({
      name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon)
    }));
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
};
```

## Manual Pin Placement

```javascript
const [isPlacingPin, setIsPlacingPin] = useState(false);
const [manualPin, setManualPin] = useState(null);

<MapLibreGL.MapView
  onPress={(e) => {
    if (isPlacingPin) {
      const { latitude, longitude } = e.geometry.coordinates;
      setManualPin({ lat: latitude, lng: longitude });
      setIsPlacingPin(false);
    }
  }}
>
  {manualPin && (
    <MapLibreGL.PointAnnotation
      coordinate={[manualPin.lng, manualPin.lat]}
    >
      <View style={styles.manualPin}>
        <Text style={styles.manualPinText}>📍</Text>
      </View>
    </MapLibreGL.PointAnnotation>
  )}
</MapLibreGL.MapView>
```

## Info Windows (Callouts)

```javascript
<MapLibreGL.PointAnnotation
  coordinate={[report.lng, report.lat]}
  onSelected={() => {
    // Show callout
  }}
>
  <View style={styles.marker}>
    <Text>{report.type}</Text>
  </View>
  <MapLibreGL.Callout title={report.title}>
    <View style={styles.callout}>
      <Text style={styles.calloutTitle}>{report.title}</Text>
      <Text style={styles.calloutType}>{report.type}</Text>
      <Text style={styles.calloutTime}>{formatDate(report.createdAt)}</Text>
    </View>
  </MapLibreGL.Callout>
</MapLibreGL.PointAnnotation>
```

## Performance Tips

1. **Use clustering** for many markers:
```bash
npm install react-native-map-clustering
```

2. **Limit markers** at low zoom levels
3. **Lazy load** reports as user zooms
4. **Memoize** marker components

## Android Configuration

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<application>
  <!-- MapLibre doesn't require special permissions, but location does -->
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
  <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
</application>
```

## iOS Configuration

Add to `ios/YourApp/Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to show nearby crime reports</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>We need your location to show nearby crime reports</string>
```

## Resources

- [MapLibre React Native Docs](https://github.com/maplibre/maplibre-gl-react-native)
- [MapLibre GL JS Docs](https://maplibre.org/maplibre-gl-js-docs/)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [Nominatim API](https://nominatim.org/release-docs/develop/api/Overview/)
