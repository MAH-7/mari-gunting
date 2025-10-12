# Mapbox Integration Guide

Complete guide for using Mapbox maps and location services in Mari-Gunting.

## Table of Contents
- [Setup](#setup)
- [Configuration](#configuration)
- [Components](#components)
- [Location Services](#location-services)
- [Geocoding](#geocoding)
- [Usage Examples](#usage-examples)
- [Troubleshooting](#troubleshooting)

---

## Setup

### 1. Get Mapbox Access Token

1. Go to [Mapbox Account](https://account.mapbox.com/)
2. Sign in or create an account
3. Navigate to **Access Tokens**
4. Copy your **Default Public Token** or create a new one
5. Add to your `.env` file:

```bash
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your-mapbox-token-here
```

### 2. Install Dependencies

Already installed in the shared package:
- `@rnmapbox/maps` - Mapbox GL Native SDK
- `expo-location` - Location permissions and services

### 3. Rebuild Native Apps

After adding the Mapbox token, rebuild:

```bash
# Clear cache and rebuild
cd apps/customer
npx expo prebuild --clean
npx expo run:ios
# or
npx expo run:android
```

---

## Configuration

### Map Styles

Available map styles from `packages/shared/config/mapbox.ts`:

```typescript
import { MAP_STYLES } from '@shared';

// Available styles:
- MAP_STYLES.STREET          // Standard street map
- MAP_STYLES.LIGHT           // Light theme
- MAP_STYLES.DARK            // Dark theme
- MAP_STYLES.SATELLITE       // Satellite imagery
- MAP_STYLES.SATELLITE_STREETS  // Satellite + streets
- MAP_STYLES.OUTDOORS        // Outdoor/terrain
- MAP_STYLES.TRAFFIC_DAY     // Traffic (day)
- MAP_STYLES.TRAFFIC_NIGHT   // Traffic (night)
```

### Map Configuration

Default settings:

```typescript
import { MAP_CONFIG, ZOOM_LEVELS } from '@shared';

MAP_CONFIG.defaultCenter     // Kuala Lumpur center
MAP_CONFIG.defaultZoom       // City level zoom
MAP_CONFIG.searchRadius      // From ENV (default 10km)
ZOOM_LEVELS.CITY            // 10
ZOOM_LEVELS.NEIGHBORHOOD    // 12
ZOOM_LEVELS.STREET          // 15
```

---

## Components

### MapView Component

Reusable map component with common functionality.

**Important:** MapView must be imported from the dedicated map entrypoint to avoid loading native modules in Expo Go.

#### Basic Usage

```typescript
import { MapView } from '@mari-gunting/shared/map';

function MyMapScreen() {
  return (
    <MapView
      showUserLocation
      initialZoom={12}
    />
  );
}
```

#### With Markers

```typescript
import { MapView } from '@mari-gunting/shared/map';
import { useRef } from 'react';

function BarbershopMap() {
  const mapRef = useRef<MapViewHandle>(null);

  const barbershops = [
    {
      id: '1',
      coordinate: { latitude: 3.139, longitude: 101.6869 },
      title: 'Kedai Gunting A',
      color: '#FF6B6B'
    },
    {
      id: '2',
      coordinate: { latitude: 3.150, longitude: 101.700 },
      title: 'Kedai Gunting B',
      color: '#4ECDC4'
    }
  ];

  return (
    <MapView
      ref={mapRef}
      markers={barbershops}
      showUserLocation
      onMarkerPress={(id) => console.log('Tapped:', id)}
      onPress={(feature) => console.log('Map tapped')}
    />
  );
}
```

#### Programmatic Control

```typescript
import { MapView, MapViewHandle } from '@mari-gunting/shared/map';
import { useRef } from 'react';

function ControlledMap() {
  const mapRef = useRef<MapViewHandle>(null);

  // Fly to location
  const flyToLocation = (lat: number, lon: number) => {
    mapRef.current?.flyTo(
      { latitude: lat, longitude: lon },
      15, // zoom level
      1000 // duration in ms
    );
  };

  // Fit bounds to show all markers
  const fitToMarkers = (locations: Coordinates[]) => {
    mapRef.current?.fitBounds(
      locations,
      50, // padding
      1000 // duration
    );
  };

  return (
    <View>
      <MapView ref={mapRef} />
      <Button 
        title="Go to KL" 
        onPress={() => flyToLocation(3.139, 101.6869)} 
      />
    </View>
  );
}
```

---

## Location Services

### Request Permission

```typescript
import { requestLocationPermission } from '@shared';

async function setupLocation() {
  const granted = await requestLocationPermission();
  if (granted) {
    // Permission granted
  }
}
```

### Get Current Location

```typescript
import { getCurrentLocation } from '@shared';

async function findMyLocation() {
  const location = await getCurrentLocation();
  if (location) {
    console.log('Latitude:', location.latitude);
    console.log('Longitude:', location.longitude);
    console.log('Accuracy:', location.accuracy);
  }
}
```

### Watch Location (Continuous Updates)

```typescript
import { watchLocation } from '@shared';

async function trackLocation() {
  const subscription = await watchLocation(
    (location) => {
      console.log('Updated:', location.latitude, location.longitude);
    },
    {
      distanceInterval: 10, // Update every 10 meters
      timeInterval: 5000,   // Update every 5 seconds
    }
  );

  // Stop watching
  return () => subscription?.remove();
}
```

### Calculate Distance

```typescript
import { calculateDistance, formatDistance } from '@shared';

const from = { latitude: 3.139, longitude: 101.6869 };
const to = { latitude: 3.150, longitude: 101.700 };

const distanceKm = calculateDistance(from, to);
const formatted = formatDistance(distanceKm); // "1.5km"
```

### Sort by Distance

```typescript
import { sortByDistance } from '@shared';

const barbershops = [
  { id: '1', latitude: 3.139, longitude: 101.6869, name: 'Shop A' },
  { id: '2', latitude: 3.150, longitude: 101.700, name: 'Shop B' },
];

const userLocation = { latitude: 3.140, longitude: 101.690 };
const sorted = sortByDistance(barbershops, userLocation);

// Each item now has a 'distance' property
sorted.forEach(shop => {
  console.log(`${shop.name}: ${shop.distance}km away`);
});
```

---

## Geocoding

### Address Search (Autocomplete)

```typescript
import { searchPlaces, searchMalaysianAddresses } from '@shared';

// General search
const places = await searchPlaces('KLCC', {
  limit: 5,
  proximity: userLocation, // Bias toward user
  country: ['MY']
});

// Malaysia-specific search
const addresses = await searchMalaysianAddresses(
  'Jalan Ampang',
  userLocation
);

places.forEach(place => {
  console.log(place.name);
  console.log(place.fullAddress);
  console.log(place.coordinates);
});
```

### Reverse Geocode

```typescript
import { reverseGeocodePlace } from '@shared';

const place = await reverseGeocodePlace({
  latitude: 3.139,
  longitude: 101.6869
});

if (place) {
  console.log('Address:', place.fullAddress);
  console.log('City:', place.city);
  console.log('Postcode:', place.postcode);
}
```

### Calculate ETA

```typescript
import { calculateETA } from '@shared';

const from = { latitude: 3.139, longitude: 101.6869 };
const to = { latitude: 3.150, longitude: 101.700 };

const eta = await calculateETA(from, to, 'driving');
if (eta) {
  console.log('Duration:', eta.formattedDuration); // "15m"
  console.log('Distance:', eta.formattedDistance); // "5.2km"
}
```

### Get Directions URL

```typescript
import { getDirectionsURL } from '@shared';

const from = userLocation;
const to = barbershopLocation;

const url = getDirectionsURL(from, to, 'driving');
// Opens Google Maps with directions
Linking.openURL(url);
```

---

## Usage Examples

### Example 1: Find Nearby Barbershops

```typescript
import {
  getCurrentLocation,
  sortByDistance,
  calculateDistance,
  isWithinRadius
} from '@shared';
import { supabase } from '@shared';

async function findNearbyBarbershops(radiusKm: number = 10) {
  // Get user location
  const userLocation = await getCurrentLocation();
  if (!userLocation) return [];

  // Fetch all barbershops from database
  const { data: barbershops } = await supabase
    .from('barbershops')
    .select('*');

  if (!barbershops) return [];

  // Filter by radius
  const nearby = barbershops.filter(shop =>
    isWithinRadius(
      userLocation,
      { latitude: shop.latitude, longitude: shop.longitude },
      radiusKm
    )
  );

  // Sort by distance
  return sortByDistance(nearby, userLocation);
}
```

### Example 2: Address Search with Map

```typescript
import { useState } from 'react';
import { searchMalaysianAddresses, MapView } from '@shared';
import { TextInput, FlatList } from 'react-native';

function AddressSearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const mapRef = useRef(null);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length > 2) {
      const places = await searchMalaysianAddresses(text);
      setResults(places);
    }
  };

  const selectPlace = (place) => {
    setSelected(place);
    setResults([]);
    // Fly map to selected location
    mapRef.current?.flyTo(place.coordinates, 15);
  };

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={handleSearch}
        placeholder="Search address..."
      />
      
      <FlatList
        data={results}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => selectPlace(item)}>
            <Text>{item.name}</Text>
            <Text>{item.fullAddress}</Text>
          </TouchableOpacity>
        )}
      />

      <MapView
        ref={mapRef}
        markers={selected ? [{
          id: 'selected',
          coordinate: selected.coordinates,
          color: '#FF6B6B'
        }] : []}
      />
    </View>
  );
}
```

### Example 3: Live Location Tracking

```typescript
import { watchLocation, MapView } from '@shared';
import { useState, useEffect } from 'react';

function LiveTrackingScreen() {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [route, setRoute] = useState([]);

  useEffect(() => {
    const subscription = watchLocation(
      (location) => {
        setCurrentLocation(location);
        // Add to route history
        setRoute(prev => [...prev, location]);
      },
      {
        distanceInterval: 10,
        timeInterval: 3000,
      }
    );

    return () => subscription?.remove();
  }, []);

  return (
    <MapView
      initialCenter={currentLocation}
      followUserLocation
      showUserLocation
      markers={route.map((loc, i) => ({
        id: `point-${i}`,
        coordinate: loc,
        color: '#4ECDC4'
      }))}
    />
  );
}
```

---

## Troubleshooting

### Map Not Showing

**Issue:** Blank screen or map not rendering

**Solutions:**
1. Check Mapbox token is set:
   ```bash
   echo $EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN
   ```

2. Rebuild native apps:
   ```bash
   npx expo prebuild --clean
   ```

3. Check console for errors

### Location Permission Denied

**Issue:** Cannot get user location

**Solution:**
```typescript
import { requestLocationPermission } from '@shared';

const granted = await requestLocationPermission();
if (!granted) {
  // Show manual instructions to enable in Settings
}
```

### Geocoding Returns No Results

**Issue:** Search returns empty array

**Solutions:**
1. Check internet connection
2. Verify Mapbox token is valid
3. Try broader search terms
4. Check rate limits (600 requests/minute on free tier)

### Android Build Errors

**Issue:** Build fails with Mapbox errors

**Solution:**
Ensure `minSdkVersion` is at least 23:
```typescript
// app.config.ts
android: {
  minSdkVersion: 23
}
```

---

## Best Practices

1. **Cache Location Data** - Don't fetch location on every render
2. **Batch Geocoding** - Group multiple address lookups
3. **Debounce Search** - Wait for user to stop typing before searching
4. **Handle Offline** - Gracefully handle no internet connection
5. **Rate Limits** - Be aware of Mapbox API limits
6. **Battery Usage** - Use `balanced` accuracy when possible

---

## API Limits

**Free Tier:**
- 50,000 map loads/month
- 100,000 geocoding requests/month
- 600 requests/minute

**Monitor Usage:**
https://account.mapbox.com/

---

## Additional Resources

- [Mapbox GL Native Documentation](https://github.com/rnmapbox/maps/wiki)
- [Mapbox Geocoding API](https://docs.mapbox.com/api/search/geocoding/)
- [Mapbox Directions API](https://docs.mapbox.com/api/navigation/directions/)
- [Expo Location Documentation](https://docs.expo.dev/versions/latest/sdk/location/)

---

**Need Help?** Check the troubleshooting section or open an issue.
