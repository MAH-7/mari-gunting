# Track Barber Feature - Real-Time Location Tracking

This document provides comprehensive information about the **Track Barber** feature, which allows customers to track their barber's real-time location en route to the appointment, similar to Uber/Grab.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Implementation Details](#implementation-details)
5. [Setup & Configuration](#setup--configuration)
6. [Usage](#usage)
7. [Testing Checklist](#testing-checklist)
8. [Known Limitations](#known-limitations)
9. [Future Enhancements](#future-enhancements)

---

## Overview

The Track Barber feature provides real-time tracking of barbers as they travel to customer locations for appointments. It includes:

- **Live map view** showing both customer and barber locations
- **Real-time location updates** via Supabase Realtime
- **ETA calculations** with distance and estimated arrival time
- **Push notifications** with sound and vibration when barber arrives
- **Call barber** functionality for direct communication
- **Background tracking** support during active bookings

---

## Features

### ✅ Implemented

1. **Real-Time Location Updates**
   - Subscribes to Supabase Realtime for barber profile location changes
   - Parses PostGIS WKB hex format location data
   - Updates map markers automatically

2. **Interactive Map**
   - Mapbox GL integration
   - Customer location pin (blue home icon)
   - Barber location pin (green scissors icon)
   - Auto-center and fit-bounds controls

3. **ETA Display**
   - Distance calculation using Haversine formula
   - Estimated time based on average urban speed (30 km/h)
   - Live updates as barber moves

4. **Arrival Notifications**
   - Triggered when barber is within 100 meters
   - Sound alert (custom MP3)
   - Vibration pattern (iOS and Android)
   - Push notification
   - In-app alert dialog

5. **Connection Status**
   - Live tracking badge
   - Real-time connection status indicator
   - Error handling with user feedback

6. **UI Components**
   - Bottom info panel with barber details
   - ETA metrics (distance, time, last update)
   - Call barber button
   - Address display

### 🚧 Planned

- Route line showing path between barber and customer
- Traffic-aware ETA adjustments
- Multiple notification distance thresholds
- Historical location tracking
- Analytics and metrics

---

## Architecture

### Components

```
apps/customer/
├── app/booking/track-barber.tsx          # Main screen component
├── hooks/
│   ├── useRealtimeBarberLocation.ts      # Real-time location subscription hook
│   └── useLocation.ts                     # Customer location hook (existing)
└── assets/sounds/
    └── arrival.mp3                        # Notification sound (to be added)

packages/shared/
├── services/
│   └── supabaseApi.ts                     # parseLocation() utility exported
└── utils/
    └── eta.ts                             # ETA calculation utilities
```

### Data Flow

```
1. Customer opens Track Barber screen for a booking
   └─> Fetch booking details from Supabase
   
2. Subscribe to barber's real-time location updates
   └─> Supabase Realtime: profiles table, filter by barber_id
   
3. On location update received:
   └─> Parse WKB hex format → { lat, lng }
   └─> Update state → Re-render map marker
   └─> Calculate ETA
   └─> Check arrival threshold → Trigger notification if met
   
4. User interactions:
   ├─> Center map on barber
   ├─> Fit both locations
   └─> Call barber
```

### Database Schema

**Profiles Table** (location tracking):
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  location GEOMETRY(Point, 4326),          -- PostGIS geometry
  location_updated_at TIMESTAMP,            -- Track staleness
  ...
);
```

**Bookings Table** (track barber metadata - optional future enhancement):
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  barber_id UUID REFERENCES barbers(id),
  customer_id UUID REFERENCES profiles(id),
  customer_location_lat NUMERIC,
  customer_location_lng NUMERIC,
  customer_address TEXT,
  barber_started_trip_at TIMESTAMP,
  barber_arrived_at TIMESTAMP,
  distance_km NUMERIC,
  ...
);
```

---

## Implementation Details

### 1. Real-Time Location Hook

**File:** `apps/customer/hooks/useRealtimeBarberLocation.ts`

**Purpose:** Subscribe to a specific barber's location updates in real-time.

**Key Features:**
- Supabase Realtime subscription to `profiles` table
- Filters by `barber_id`
- Parses PostGIS WKB hex format
- Fetches initial location on mount
- Auto-cleanup on unmount

**Usage:**
```tsx
const { location, isConnected, error, lastUpdated } = useRealtimeBarberLocation(
  barberId,
  enabled
);
```

**Returns:**
```typescript
{
  location: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  } | null;
  isConnected: boolean;
  error: string | null;
  lastUpdated: Date | null;
}
```

### 2. Location Parsing Utility

**File:** `packages/shared/services/supabaseApi.ts`

**Function:** `parseLocation(locationData: any)`

**Supports:**
- PostGIS WKB hex format (most common from DB)
- PostGIS POINT text format: `POINT(lng lat)`
- GeoJSON format: `{ coordinates: [lng, lat] }`

**Returns:**
```typescript
{ latitude: number; longitude: number } | null
```

### 3. ETA Calculation

**File:** `packages/shared/utils/eta.ts`

**Key Functions:**

**`calculateETA(from, to, averageSpeed?)`**
- Uses Haversine formula for distance
- Calculates duration based on average speed (default: 30 km/h urban)
- Returns: `{ distanceKm, distanceMeters, durationMinutes, durationSeconds }`

**Helper Functions:**
- `formatETA()` - Human-readable string
- `formatDistance()` - "150 m" or "2.3 km"
- `formatDuration()` - "5 min" or "1 hr 15 min"
- `isArrivingSoon()` - Within 5 min or 1 km
- `hasArrived()` - Within 100 meters

### 4. Push Notifications

**Library:** `expo-notifications`

**Setup:**
```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
```

**Arrival Notification:**
- Title: "🎉 Your Barber Has Arrived!"
- Body: "{barberName} is here. Please check your door."
- Sound: Custom MP3 + system sound fallback
- Vibration: Platform-specific patterns
- Priority: HIGH (Android)

### 5. Map Integration

**Library:** `@rnmapbox/maps` (Mapbox GL)

**Features Used:**
- `MapView` with camera controls
- `PointAnnotation` for location pins
- `Camera.setCamera()` for auto-centering
- `Camera.fitBounds()` for showing both locations

**Custom Pins:**
- Customer: Blue circle with home icon
- Barber: Green circle with scissors icon

---

## Setup & Configuration

### Prerequisites

1. **Supabase Realtime Enabled**
   ```sql
   -- Enable realtime for profiles table
   ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
   ```

2. **PostGIS Location Data**
   - Ensure barber locations are stored as PostGIS GEOMETRY(Point, 4326)
   - Use migration scripts from previous conversation if needed

3. **Mapbox Token**
   - Set `MAPBOX_ACCESS_TOKEN` in `.env`
   - Configure in app initialization

4. **Notification Permissions**
   - Request on app launch or before first use of tracking feature
   - Handle iOS and Android permission flows

### Installation

1. **Install Dependencies**
   ```bash
   npm install @rnmapbox/maps expo-notifications expo-av
   ```

2. **Configure Mapbox**
   ```typescript
   // App.tsx or equivalent
   import MapboxGL from '@rnmapbox/maps';
   
   MapboxGL.setAccessToken(process.env.MAPBOX_ACCESS_TOKEN);
   ```

3. **Add Sound File** (Optional)
   - Place `arrival.mp3` in `apps/customer/assets/sounds/`
   - See `apps/customer/assets/sounds/README.md` for specifications

4. **Request Permissions**
   ```typescript
   // Request notification permissions
   const { status } = await Notifications.requestPermissionsAsync();
   
   // Request location permissions (already handled in useLocation)
   ```

### Environment Variables

```env
# .env
MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token_here
```

---

## Usage

### For Customers

1. **During Active Booking:**
   - Navigate to booking details
   - Tap "Track Barber" button
   - View real-time map with barber's location

2. **Map Interactions:**
   - Pinch to zoom
   - Drag to pan
   - Tap locate button to center on barber
   - Tap fit button to show both locations

3. **Communication:**
   - Tap call button to contact barber directly

4. **Arrival Notification:**
   - Receive alert when barber is within 100 meters
   - Check door for barber arrival

### For Developers

**Navigate to Track Barber Screen:**
```typescript
import { useRouter } from 'expo-router';

const router = useRouter();

// Navigate with booking ID
router.push(`/booking/track-barber?bookingId=${booking.id}`);
```

**Integrating into Booking Flow:**
```typescript
// booking/[id].tsx
<TouchableOpacity onPress={() => router.push(`/booking/track-barber?bookingId=${id}`)}>
  <Text>Track Barber</Text>
</TouchableOpacity>
```

---

## Testing Checklist

### Functional Testing

- [ ] **Real-time location updates**
  - [ ] Initial location loads correctly
  - [ ] Location updates appear on map in real-time
  - [ ] Map markers move smoothly
  - [ ] Connection status badge shows correct state

- [ ] **ETA Calculations**
  - [ ] Distance displays correctly
  - [ ] Time estimate is reasonable
  - [ ] Updates dynamically as barber moves
  - [ ] Last update timestamp is accurate

- [ ] **Arrival Notifications**
  - [ ] Triggered at 100 meter threshold
  - [ ] Sound plays (if available)
  - [ ] Vibration works on both iOS and Android
  - [ ] Push notification appears
  - [ ] Alert dialog shows
  - [ ] Only triggers once per arrival

- [ ] **Map Interactions**
  - [ ] Auto-center on barber works
  - [ ] Fit bounds shows both locations
  - [ ] Manual pan and zoom work
  - [ ] Pins render correctly

- [ ] **Call Barber**
  - [ ] Button is visible
  - [ ] Confirmation dialog appears
  - [ ] Phone dialer opens (when implemented)

- [ ] **Error Handling**
  - [ ] Invalid booking ID shows error
  - [ ] Network errors display properly
  - [ ] Missing location data has fallback
  - [ ] Realtime disconnection is handled

### Edge Cases

- [ ] **App Backgrounding**
  - [ ] Location updates continue (with limitations)
  - [ ] Notification appears when app is in background
  - [ ] Reconnects when app returns to foreground

- [ ] **Network Issues**
  - [ ] Handles offline gracefully
  - [ ] Reconnects automatically when online
  - [ ] Shows appropriate error messages

- [ ] **GPS Accuracy**
  - [ ] Works with poor GPS signal
  - [ ] Handles stale location data
  - [ ] Validates location accuracy

- [ ] **Multiple Bookings**
  - [ ] Switching between bookings works
  - [ ] Previous subscriptions are cleaned up
  - [ ] No memory leaks

### Performance Testing

- [ ] **Memory Usage**
  - [ ] No memory leaks after long usage
  - [ ] Subscription cleanup on unmount
  - [ ] Sound resources released properly

- [ ] **Battery Usage**
  - [ ] Reasonable battery drain
  - [ ] Location updates not too frequent
  - [ ] Background usage optimized

- [ ] **Data Usage**
  - [ ] Realtime subscription bandwidth reasonable
  - [ ] Map tiles cached efficiently

---

## Known Limitations

1. **No Route Line**
   - Currently only shows pins, not the path between locations
   - Future: Integrate Mapbox Directions API

2. **Fixed Average Speed**
   - ETA uses constant 30 km/h average
   - Future: Integrate real-time traffic data

3. **Single Arrival Notification**
   - Only triggers once at 100 meters
   - Future: Add progressive notifications (e.g., 5 min, 2 min, arrived)

4. **Background Tracking Limitations**
   - iOS limits background location updates
   - Android may kill background tasks to save battery
   - Future: Implement proper background location services

5. **Sound File Not Included**
   - Custom sound file must be added manually
   - Falls back to system sound if missing

6. **No Offline Support**
   - Requires active internet connection
   - Future: Cache last known location

---

## Future Enhancements

### High Priority

1. **Route Line Visualization**
   - Show path between barber and customer
   - Display turn-by-turn directions
   - Integrate Mapbox Directions API

2. **Traffic-Aware ETA**
   - Use real-time traffic data for accurate estimates
   - Adjust ETA dynamically based on conditions

3. **Progressive Notifications**
   - 10 minutes away
   - 5 minutes away
   - 2 minutes away
   - Arrived

4. **Background Location Services**
   - Proper iOS background location handling
   - Android foreground service for tracking
   - Battery optimization

### Medium Priority

5. **Location History**
   - Store barber's route in database
   - Display path traveled
   - Analytics for route optimization

6. **Call Barber Integration**
   - Implement phone dialer using `Linking.openURL()`
   - In-app messaging option

7. **Estimated Arrival Time**
   - Display actual clock time of arrival
   - Account for current time and ETA

8. **Multiple Language Support**
   - Localize notifications
   - Translate UI text

### Low Priority

9. **Barber Status Updates**
   - "On the way", "5 minutes away", "Arrived"
   - Manual status updates by barber

10. **Customer Feedback**
    - Rate tracking experience
    - Report issues with ETA accuracy

11. **Analytics Dashboard**
    - Average ETA accuracy
    - Most common routes
    - Peak usage times

---

## Troubleshooting

### Location Not Updating

**Symptoms:** Map shows old location, no real-time updates

**Solutions:**
1. Check Supabase Realtime is enabled for `profiles` table
2. Verify barber app is updating location correctly
3. Check network connectivity
4. Review console logs for subscription errors

### ETA Calculations Incorrect

**Symptoms:** ETA shows unrealistic time or distance

**Solutions:**
1. Verify coordinates are valid (lat: -90 to 90, lng: -180 to 180)
2. Check if location is in correct SRID (4326)
3. Adjust average speed constant in `calculateETA()`

### Notifications Not Working

**Symptoms:** No sound, vibration, or alert on arrival

**Solutions:**
1. Verify notification permissions granted
2. Check if sound file exists at correct path
3. Test on physical device (not simulator for vibration/sound)
4. Review notification channel settings (Android)

### Map Not Loading

**Symptoms:** Blank map or error

**Solutions:**
1. Verify Mapbox access token is set correctly
2. Check internet connectivity
3. Ensure @rnmapbox/maps is installed properly
4. Review map view style and initial camera settings

---

## Resources

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Mapbox GL React Native](https://github.com/rnmapbox/maps)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [Haversine Formula](https://en.wikipedia.org/wiki/Haversine_formula)

---

## Support

For issues or questions:
1. Check console logs for errors
2. Review this documentation
3. Test on multiple devices and conditions
4. File a bug report with reproduction steps

---

**Last Updated:** 2024-01-09  
**Version:** 1.0.0  
**Status:** ✅ Initial Implementation Complete
