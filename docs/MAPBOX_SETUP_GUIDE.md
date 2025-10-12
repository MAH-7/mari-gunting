# 🗺️ Mapbox Setup Guide - Mari Gunting

## 📋 Prerequisites

You should have:
- ✅ Mapbox account created
- ✅ Mapbox access token (public token starting with `pk.`)
- ✅ `@rnmapbox/maps` installed (v10.1.45)

---

## 🚀 Step-by-Step Setup

### Step 1: Get Your Mapbox Token

1. Go to https://account.mapbox.com/
2. Navigate to **Tokens**
3. Copy your **Default Public Token** (starts with `pk.`)
4. Or create a new token with these scopes:
   - ✅ `styles:read`
   - ✅ `fonts:read`
   - ✅ `tiles:read`

---

### Step 2: Add Token to Environment Files

#### Customer App:

**File: `apps/customer/.env`**

Add this line (replace `YOUR_MAPBOX_TOKEN` with your actual token):

```env
# Mapbox
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.YOUR_ACTUAL_TOKEN_HERE
```

#### Partner App:

**File: `apps/partner/.env`**

Add the same line:

```env
# Mapbox
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.YOUR_ACTUAL_TOKEN_HERE
```

---

### Step 3: Verify Environment Setup

Both apps should already have this in their environment config:

**File: `apps/customer/services/env.ts`** (and partner equivalent)

```typescript
export const env = {
  // ... other vars
  MAPBOX_ACCESS_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '',
};
```

Check the console logs on app start - you should see:
```
🗺️  Mapbox Token: ✅ (if configured)
🗺️  Mapbox Token: ❌ (if missing)
```

---

### Step 4: Initialize Mapbox

Create a Mapbox initialization file:

**File: `apps/customer/utils/mapbox.ts`**

```typescript
import Mapbox from '@rnmapbox/maps';
import { env } from '@/services/env';

// Initialize Mapbox
export function initializeMapbox() {
  if (env.MAPBOX_ACCESS_TOKEN) {
    Mapbox.setAccessToken(env.MAPBOX_ACCESS_TOKEN);
    console.log('✅ Mapbox initialized');
  } else {
    console.warn('⚠️ Mapbox token not found');
  }
}

export { Mapbox };
```

---

### Step 5: Initialize on App Start

**File: `apps/customer/app/_layout.tsx`**

Add to the root layout:

```typescript
import { initializeMapbox } from '@/utils/mapbox';
import { useEffect } from 'react';

export default function RootLayout() {
  useEffect(() => {
    initializeMapbox();
  }, []);
  
  // ... rest of layout
}
```

---

## 🧪 Testing - Create Test Screens

### Customer App Test Screen

**File: `apps/customer/app/test-map.tsx`**

```typescript
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Mapbox } from '@/utils/mapbox';

export default function TestMapScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Mapbox Test</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Map */}
      <Mapbox.MapView
        style={styles.map}
        styleURL={Mapbox.StyleURL.Street}
        zoomEnabled={true}
        scrollEnabled={true}
      >
        <Mapbox.Camera
          zoomLevel={14}
          centerCoordinate={[101.6869, 3.1390]} // Kuala Lumpur
          animationMode="flyTo"
          animationDuration={2000}
        />

        {/* Example Marker */}
        <Mapbox.PointAnnotation
          id="marker1"
          coordinate={[101.6869, 3.1390]}
        >
          <View style={styles.marker}>
            <Ionicons name="location" size={32} color="#00B14F" />
          </View>
        </Mapbox.PointAnnotation>
      </Mapbox.MapView>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>✅ Mapbox Working!</Text>
        <Text style={styles.infoText}>
          You can now use maps in your app
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  map: {
    flex: 1,
  },
  marker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00B14F',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
```

---

## 🎯 Common Use Cases

### 1. Show Barber Locations

```typescript
import { Mapbox } from '@/utils/mapbox';

// In your component:
<Mapbox.MapView style={styles.map}>
  <Mapbox.Camera
    zoomLevel={12}
    centerCoordinate={[userLong, userLat]}
  />

  {/* Show barbers on map */}
  {barbers.map((barber) => (
    <Mapbox.PointAnnotation
      key={barber.id}
      id={barber.id}
      coordinate={[barber.longitude, barber.latitude]}
      onSelected={() => handleBarberSelect(barber)}
    >
      <View style={styles.barberMarker}>
        <Image source={{ uri: barber.avatar }} style={styles.avatar} />
      </View>
    </Mapbox.PointAnnotation>
  ))}
</Mapbox.MapView>
```

### 2. Select Location (Address Picker)

```typescript
import { useState } from 'react';
import { Mapbox } from '@/utils/mapbox';

export function LocationPicker({ onLocationSelect }) {
  const [selectedCoord, setSelectedCoord] = useState(null);

  return (
    <Mapbox.MapView
      style={styles.map}
      onPress={(feature) => {
        const coord = feature.geometry.coordinates;
        setSelectedCoord(coord);
        onLocationSelect(coord);
      }}
    >
      {selectedCoord && (
        <Mapbox.PointAnnotation
          id="selected"
          coordinate={selectedCoord}
        >
          <View style={styles.pin}>
            <Ionicons name="location-sharp" size={40} color="#00B14F" />
          </View>
        </Mapbox.PointAnnotation>
      )}
    </Mapbox.MapView>
  );
}
```

### 3. Track Barber Location (Real-time)

```typescript
import { useEffect, useState } from 'react';
import { Mapbox } from '@/utils/mapbox';
import * as Location from 'expo-location';

export function BarberTracking({ barberId }) {
  const [barberLocation, setBarberLocation] = useState(null);

  useEffect(() => {
    // Subscribe to barber location updates
    const subscription = subscribeToBarberLocation(barberId, (location) => {
      setBarberLocation(location);
    });

    return () => subscription.unsubscribe();
  }, [barberId]);

  return (
    <Mapbox.MapView style={styles.map}>
      {/* User location */}
      <Mapbox.UserLocation />

      {/* Barber location */}
      {barberLocation && (
        <Mapbox.PointAnnotation
          id="barber"
          coordinate={[barberLocation.lng, barberLocation.lat]}
        >
          <View style={styles.barberPin}>
            <Ionicons name="bicycle" size={24} color="#FFFFFF" />
          </View>
        </Mapbox.PointAnnotation>
      )}

      {/* Route line */}
      <Mapbox.ShapeSource
        id="route"
        shape={{
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [userLng, userLat],
              [barberLocation.lng, barberLocation.lat]
            ]
          }
        }}
      >
        <Mapbox.LineLayer
          id="routeLine"
          style={{ lineColor: '#00B14F', lineWidth: 4 }}
        />
      </Mapbox.ShapeSource>
    </Mapbox.MapView>
  );
}
```

### 4. Geocoding (Address ↔ Coordinates)

```typescript
// Forward Geocoding (Address → Coordinates)
export async function geocodeAddress(address: string) {
  const token = env.MAPBOX_ACCESS_TOKEN;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${token}&country=MY&limit=1`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.features && data.features.length > 0) {
    const [lng, lat] = data.features[0].center;
    return { latitude: lat, longitude: lng };
  }
  
  throw new Error('Address not found');
}

// Reverse Geocoding (Coordinates → Address)
export async function reverseGeocode(latitude: number, longitude: number) {
  const token = env.MAPBOX_ACCESS_TOKEN;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.features && data.features.length > 0) {
    return data.features[0].place_name;
  }
  
  throw new Error('Location not found');
}
```

---

## 🎨 Custom Map Styles

### Available Styles:
```typescript
// Light mode (default)
Mapbox.StyleURL.Street

// Dark mode
Mapbox.StyleURL.Dark

// Satellite
Mapbox.StyleURL.Satellite

// Satellite with streets
Mapbox.StyleURL.SatelliteStreet

// Outdoors
Mapbox.StyleURL.Outdoors
```

### Usage:
```typescript
<Mapbox.MapView
  styleURL={Mapbox.StyleURL.Dark}
  style={styles.map}
/>
```

---

## 🚨 Common Issues

### Issue 1: "Unable to resolve module @rnmapbox/maps"

**Solution:**
```bash
cd apps/customer
npm install @rnmapbox/maps
npx expo prebuild --clean
```

### Issue 2: Map not showing (blank screen)

**Check:**
1. Token is correct in `.env`
2. App was restarted after adding token
3. Console for errors

### Issue 3: iOS build errors

**Solution:**
```bash
cd apps/customer/ios
pod install
cd ..
npx expo run:ios
```

### Issue 4: Android build errors

**Solution:**
```bash
cd apps/customer
npx expo prebuild --clean
npx expo run:android
```

---

## 📱 Platform-Specific Notes

### iOS:
- Requires location permissions (already configured)
- Works with Expo Go for testing
- Production requires custom dev build

### Android:
- Requires location permissions (already configured)
- Works with Expo Go for testing
- Production requires custom dev build

---

## 🎯 Testing Checklist

- [ ] Token added to `.env` files
- [ ] Environment loaded correctly (check console)
- [ ] Test screen created
- [ ] Map renders correctly
- [ ] Markers appear on map
- [ ] Map is interactive (zoom, pan)
- [ ] Location permission granted
- [ ] User location shows on map
- [ ] Tested on both iOS and Android

---

## 📊 Performance Tips

1. **Limit Markers** - Show only visible markers
   ```typescript
   const visibleBarbers = barbers.filter(b => 
     isInViewport(b.lat, b.lng, mapBounds)
   );
   ```

2. **Cluster Markers** - Group nearby markers
   ```typescript
   <Mapbox.ShapeSource
     id="barbers"
     cluster={true}
     clusterRadius={50}
     shape={barbersGeoJSON}
   />
   ```

3. **Optimize Images** - Use small marker images
   ```typescript
   <Image 
     source={{ uri: barber.avatar }} 
     style={{ width: 40, height: 40 }}
   />
   ```

---

## 🔐 Security

- ✅ Use **public token** (`pk.`) for client-side
- ❌ Never expose **secret token** (`sk.`) in the app
- ✅ Add URL restrictions in Mapbox dashboard
- ✅ Monitor token usage in Mapbox dashboard

---

## 💰 Pricing

**Free Tier:**
- 50,000 map loads/month
- 100,000 geocoding requests/month

**Typical Usage:**
- Customer app: ~5-10 map loads per session
- Partner app: ~20-30 map loads per session

**Estimate:**
- 1,000 users × 10 sessions/month = 10,000 map loads
- Well within free tier! ✅

---

## 📚 Documentation

- **Mapbox RN Docs**: https://github.com/rnmapbox/maps
- **Mapbox API Docs**: https://docs.mapbox.com/
- **Style Spec**: https://docs.mapbox.com/mapbox-gl-js/style-spec/

---

## ✅ Next Steps

After setup:

1. **Test the map** - Create test screen
2. **Barber locations** - Show on map in home screen
3. **Address picker** - Use in address form
4. **Real-time tracking** - Show barber en route
5. **Route directions** - Show path to barber

---

**Your Mapbox integration is ready!** 🗺️✨
