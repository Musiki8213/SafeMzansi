# React Native Google Maps Integration Guide

This guide explains how to use Google Maps in React Native for the SafeMzansi mobile app.

## Installation

```bash
npm install react-native-maps
cd ios && pod install  # For iOS
```

For Android, add to `android/app/build.gradle`:
```gradle
dependencies {
    implementation 'com.google.android.gms:play-services-maps:18.1.0'
}
```

## Basic Setup

### 1. Import React Native Maps

```javascript
import MapView, { Marker, HeatMap, PROVIDER_GOOGLE } from 'react-native-maps';
```

### 2. Create Map Component

```javascript
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, HeatMap, PROVIDER_GOOGLE } from 'react-native-maps';

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
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        googleMapsApiKey="AIzaSyBuBXs8a6a9so-1J37OQDjpASMHZpmhwU8"
      >
        {/* Heatmap */}
        <HeatMap
          points={reports.map(report => ({
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
        {reports.map((report) => (
          <Marker
            key={report.id}
            coordinate={{
              latitude: report.lat,
              longitude: report.lng
            }}
            title={report.title}
            description={report.description}
            pinColor={getColorForType(report.type)}
          />
        ))}
      </MapView>
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
});
```

## Key Differences from Web

### 1. Coordinate Format
- **Web**: `{ lat, lng }` object
- **React Native**: `{ latitude, longitude }` object

### 2. Map Component
- **Web**: `new google.maps.Map()`
- **React Native**: `<MapView provider={PROVIDER_GOOGLE}>`

### 3. Markers
- **Web**: `new google.maps.Marker()`
- **React Native**: `<Marker coordinate={...} />`

### 4. Heatmap
- **Web**: `new google.maps.visualization.HeatmapLayer()`
- **React Native**: `<HeatMap points={...} />`

## Adding Hotspots

For hotspot visualization, use custom markers with circles:

```javascript
{hotspots.map((hotspot) => (
  <Marker
    key={hotspot.id}
    coordinate={{
      latitude: hotspot.lat,
      longitude: hotspot.lng
    }}
  >
    <View style={[
      styles.hotspotMarker,
      {
        width: Math.min(60, 20 + hotspot.count * 5),
        height: Math.min(60, 20 + hotspot.count * 5),
        backgroundColor: dangerLevels[hotspot.dangerLevel].color,
        opacity: dangerLevels[hotspot.dangerLevel].intensity
      }
    ]}>
      <Text style={styles.hotspotCount}>{hotspot.count}</Text>
    </View>
  </Marker>
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
  <Marker
    coordinate={userLocation}
    title="Your Location"
    pinColor="#3B82F6"
  />
)}
```

## Location Search

Use Google Places API for React Native:

```bash
npm install react-native-google-places-autocomplete
```

```javascript
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

<GooglePlacesAutocomplete
  placeholder="Search location..."
  onPress={(data, details = null) => {
    if (details) {
      setRegion({
        latitude: details.geometry.location.lat,
        longitude: details.geometry.location.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }}
  query={{
    key: 'AIzaSyBuBXs8a6a9so-1J37OQDjpASMHZpmhwU8',
    language: 'en',
    components: 'country:za',
  }}
/>
```

## Manual Pin Placement

```javascript
const [isPlacingPin, setIsPlacingPin] = useState(false);
const [manualPin, setManualPin] = useState(null);

<MapView
  onPress={(e) => {
    if (isPlacingPin) {
      const coordinate = e.nativeEvent.coordinate;
      setManualPin(coordinate);
      setIsPlacingPin(false);
    }
  }}
>
  {manualPin && (
    <Marker
      coordinate={manualPin}
      pinColor="#10B981"
    />
  )}
</MapView>
```

## Info Windows (Callouts)

```javascript
<Marker
  coordinate={coordinate}
  title={report.title}
  description={report.description}
>
  <Callout>
    <View style={styles.callout}>
      <Text style={styles.calloutTitle}>{report.title}</Text>
      <Text style={styles.calloutType}>{report.type}</Text>
      <Text style={styles.calloutTime}>{formatDate(report.createdAt)}</Text>
    </View>
  </Callout>
</Marker>
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
  <meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="AIzaSyBuBXs8a6a9so-1J37OQDjpASMHZpmhwU8"/>
</application>
```

## iOS Configuration

Add to `ios/YourApp/Info.plist`:

```xml
<key>GMSApiKey</key>
<string>AIzaSyBuBXs8a6a9so-1J37OQDjpASMHZpmhwU8</string>
```

## Resources

- [React Native Maps Docs](https://github.com/react-native-maps/react-native-maps)
- [Google Maps Platform](https://mapsplatform.google.com/)
- [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)

