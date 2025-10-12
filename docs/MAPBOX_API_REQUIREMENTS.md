# 🗺️ Mapbox API Requirements - Mari Gunting

## 📋 Overview

This document outlines all Mapbox APIs needed for Customer and Partner apps.

---

## 🎯 Required Mapbox APIs

### ✅ Already Included in Your Token:

Your Mapbox public token (`pk.`) includes these APIs by default:

| API | Customer App | Partner App | Description |
|-----|--------------|-------------|-------------|
| **Maps SDK** | ✅ | ✅ | Display interactive maps |
| **Geocoding API** | ✅ | ✅ | Address ↔ Coordinates conversion |
| **Static Maps API** | ✅ | ✅ | Generate map thumbnails |
| **Directions API** | ✅ | ✅ | Get routes & ETAs |
| **Matrix API** | ✅ | Optional | Calculate distances between multiple points |

**All free up to the usage limits!** 🎉

---

## 📱 Customer App - Use Cases

### 1. **Browse Barbers on Map** 🗺️

**API Needed:** Maps SDK + Geocoding

**What it does:**
- Show all available barbers on map
- Display barber markers at their locations
- Show user's current location
- Calculate distance from user

**Code Example:**
```typescript
import { Mapbox, geocodeAddress } from '@/utils/mapbox';

// Show barbers on map
<Mapbox.MapView>
  {barbers.map(barber => (
    <Mapbox.PointAnnotation
      key={barber.id}
      coordinate={[barber.longitude, barber.latitude]}
    >
      <BarberMarker barber={barber} />
    </Mapbox.PointAnnotation>
  ))}
</Mapbox.MapView>
```

**API Usage:**
- **Map loads:** 1 per session
- **Free tier:** 50,000/month
- **Your usage:** ~5-10 per user = ~10,000/month for 1,000 users ✅

---

### 2. **Address Picker** 📍

**API Needed:** Geocoding API + Maps SDK

**What it does:**
- User picks location on map
- Get address from coordinates (reverse geocoding)
- Save address to profile

**Code Example:**
```typescript
import { reverseGeocode } from '@/utils/mapbox';

// When user taps on map
const handleMapPress = async (coordinates) => {
  const address = await reverseGeocode(lat, lng);
  // address = "123 Main St, Kuala Lumpur, Malaysia"
};
```

**API Usage:**
- **Geocoding requests:** 1 per address
- **Free tier:** 100,000/month
- **Your usage:** ~50 per user signup = ~50,000/month for 1,000 users ✅

---

### 3. **Show Route to Barber** 🚗

**API Needed:** Directions API

**What it does:**
- Show route from customer to barber
- Display estimated time of arrival (ETA)
- Show distance

**Code Example:**
```typescript
import { getRoute } from '@/utils/mapbox';

const route = await getRoute(
  [userLng, userLat],
  [barberLng, barberLat]
);

// route.distance = 2500 (meters)
// route.duration = 600 (seconds = 10 min)
```

**API Usage:**
- **Direction requests:** 1-2 per booking
- **Free tier:** 100,000/month
- **Your usage:** ~2,000/month for 1,000 bookings ✅

---

### 4. **Track Barber Location (Real-time)** 📲

**API Needed:** Maps SDK + Directions API

**What it does:**
- Show barber's live location
- Update route as barber moves
- Show ETA updates

**Code Example:**
```typescript
// Subscribe to barber location updates
const subscription = supabase
  .channel('barber-location')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'barber_locations',
    filter: `barber_id=eq.${barberId}`
  }, (payload) => {
    updateBarberMarker(payload.new);
    updateRoute(payload.new);
  })
  .subscribe();
```

**API Usage:**
- **Map updates:** Real-time (no extra cost)
- **Direction requests:** Every 30 seconds during trip
- **Free tier:** Sufficient for real-time tracking ✅

---

### 5. **Calculate Distance-Based Pricing** 💰

**API Needed:** Directions API or Matrix API

**What it does:**
- Calculate distance from customer to barber
- Compute travel cost
- Show total price before booking

**Code Example:**
```typescript
import { calculateDistance } from '@/utils/mapbox';

const distance = await calculateDistance(
  customerAddress,
  barberLocation
);

const travelCost = distance * RATE_PER_KM; // e.g. RM 2 per km
const totalPrice = servicePrice + travelCost;
```

**API Usage:**
- **Requests:** 1 per service view
- **Free tier:** 100,000/month
- **Your usage:** ~10,000/month for 1,000 views ✅

---

## 👔 Partner App (Barber) - Use Cases

### 1. **Set Service Area** 📍

**API Needed:** Maps SDK + Geocoding

**What it does:**
- Barber sets their operating location
- Define service radius (e.g., 10km)
- Save location to profile

**Code Example:**
```typescript
// Barber picks location on map
<Mapbox.MapView>
  <Mapbox.PointAnnotation coordinate={barberLocation}>
    <BarberPin />
  </Mapbox.PointAnnotation>
  
  {/* Service radius circle */}
  <Mapbox.ShapeSource
    shape={{
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat]
      }
    }}
  >
    <Mapbox.CircleLayer
      style={{ circleRadius: serviceRadius }}
    />
  </Mapbox.ShapeSource>
</Mapbox.MapView>
```

**API Usage:**
- **Map loads:** 1 per setup
- **Geocoding:** 1 per address change
- **Minimal usage** ✅

---

### 2. **Navigate to Customer** 🚗

**API Needed:** Directions API + Maps SDK

**What it does:**
- Show route to customer's location
- Turn-by-turn navigation
- Live ETA updates

**Code Example:**
```typescript
// Get directions to customer
const directions = await getDirections(
  barberCurrentLocation,
  customerLocation
);

// Show route on map
<Mapbox.ShapeSource
  shape={directions.route}
>
  <Mapbox.LineLayer
    style={{ lineColor: '#00B14F', lineWidth: 4 }}
  />
</Mapbox.ShapeSource>
```

**API Usage:**
- **Direction requests:** 1-2 per job
- **Free tier:** 100,000/month
- **Your usage:** ~2,000/month for 1,000 jobs ✅

---

### 3. **Share Live Location** 📲

**API Needed:** Maps SDK (no extra API needed)

**What it does:**
- Barber's location updates in real-time
- Customer sees barber approaching
- Uses device GPS + your Supabase DB

**Code Example:**
```typescript
import * as Location from 'expo-location';
import { supabase } from '@/services/supabase';

// Update location every 10 seconds
const watchLocation = await Location.watchPositionAsync(
  { accuracy: Location.Accuracy.High, timeInterval: 10000 },
  async (location) => {
    await supabase
      .from('barber_locations')
      .upsert({
        barber_id: barberId,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        updated_at: new Date()
      });
  }
);
```

**API Usage:**
- **No Mapbox API calls** (using GPS + your DB)
- **Free** ✅

---

### 4. **View Job Locations on Map** 🗓️

**API Needed:** Maps SDK + Geocoding

**What it does:**
- See all today's bookings on map
- Plan route between multiple customers
- Optimize travel time

**Code Example:**
```typescript
// Show multiple bookings
<Mapbox.MapView>
  {bookings.map((booking, index) => (
    <Mapbox.PointAnnotation
      key={booking.id}
      coordinate={[booking.lng, booking.lat]}
    >
      <JobMarker number={index + 1} />
    </Mapbox.PointAnnotation>
  ))}
</Mapbox.MapView>
```

**API Usage:**
- **Map loads:** Few per day
- **Minimal usage** ✅

---

## 💰 Cost Estimation

### Your Expected Usage (1,000 active users):

| API | Monthly Usage | Free Tier | Cost |
|-----|---------------|-----------|------|
| **Map Loads** | ~15,000 | 50,000 | Free ✅ |
| **Geocoding** | ~60,000 | 100,000 | Free ✅ |
| **Directions** | ~5,000 | 100,000 | Free ✅ |
| **Matrix** | ~2,000 | 100,000 | Free ✅ |

**Total Monthly Cost:** **$0** (Free tier) ✅

---

## 📊 API Limits (Free Tier)

| API | Free Limit | Overage Cost |
|-----|-----------|--------------|
| **Maps SDK** | 50,000 loads/month | $5 per 1,000 |
| **Geocoding** | 100,000 requests/month | $0.50 per 1,000 |
| **Directions** | 100,000 requests/month | $5 per 1,000 |
| **Matrix** | 100,000 requests/month | $10 per 1,000 |
| **Static Maps** | 50,000 images/month | $2 per 1,000 |

**Note:** You'll stay in free tier for a long time! 🎉

---

## 🛠️ Implementation Helper Functions

I'll create these for you in the mapbox utility:

### 1. **Get Directions**
```typescript
export async function getDirections(
  origin: [number, number],
  destination: [number, number]
): Promise<Route>
```

### 2. **Calculate Distance**
```typescript
export async function calculateDistance(
  from: string | [number, number],
  to: string | [number, number]
): Promise<number> // in meters
```

### 3. **Get Multiple Routes** (for route optimization)
```typescript
export async function getMatrix(
  locations: [number, number][]
): Promise<Matrix>
```

---

## ✅ What You Need to Do

### Step 1: No Additional Setup Needed!
Your current Mapbox token includes all these APIs ✅

### Step 2: When Ready to Use (After Custom Build):

#### Customer App:
1. ✅ Browse barbers on map
2. ✅ Address picker
3. ✅ Show route to barber
4. ✅ Track barber location
5. ✅ Distance-based pricing

#### Partner App:
1. ✅ Set service area
2. ✅ Navigate to customer
3. ✅ Share live location
4. ✅ View jobs on map

---

## 📚 API Documentation Links

- **Maps SDK:** https://docs.mapbox.com/ios/maps/api/
- **Geocoding:** https://docs.mapbox.com/api/search/geocoding/
- **Directions:** https://docs.mapbox.com/api/navigation/directions/
- **Matrix:** https://docs.mapbox.com/api/navigation/matrix/
- **Static Maps:** https://docs.mapbox.com/api/maps/static-images/

---

## 🎯 Summary

### What APIs You Need:
1. ✅ **Maps SDK** - Already have
2. ✅ **Geocoding API** - Already have
3. ✅ **Directions API** - Already have
4. ✅ **Matrix API** (optional) - Already have

### Cost:
- **Free for your scale** (1,000-10,000 users)
- All included in your public token
- No additional setup needed

### Next Steps:
1. Build custom development build
2. Start implementing map features
3. Use the utility functions I'll create

**You're all set!** 🗺️✨
