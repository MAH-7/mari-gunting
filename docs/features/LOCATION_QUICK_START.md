# 🚀 GPS/Location - Quick Implementation Guide

## What We Built

A complete, production-ready GPS/location system for Mari Gunting app.

## 3 Ways to Use

### Option 1: Require Location for Entire App (Recommended)
```typescript
// app/(tabs)/_layout.tsx
import { LocationGuard } from '@/components/LocationGuard';

export default function TabLayout() {
  return (
    <LocationGuard requireLocation={true}>
      <Tabs>...</Tabs>
    </LocationGuard>
  );
}
```

### Option 2: Use in Any Component
```typescript
import { useLocation } from '@/hooks/useLocation';

export default function MyScreen() {
  const { location, hasPermission, getCurrentLocation } = useLocation();

  useEffect(() => {
    if (hasPermission) {
      getCurrentLocation(true); // true = with address
    }
  }, [hasPermission]);

  return <View>Lat: {location?.latitude}</View>;
}
```

### Option 3: Direct Service Access
```typescript
import { locationService } from '@/services/locationService';

// Get location
const location = await locationService.getCurrentLocation();

// Calculate distance
const distance = locationService.calculateDistance(
  lat1, lon1, lat2, lon2
);
```

## What Happens When User Opens App

1. ✅ App checks if location permission granted
2. ❌ If not → Shows beautiful permission screen
3. 👆 User taps "Enable Location"
4. 📱 Native permission dialog appears
5. ✅ Permission granted → Gets location automatically
6. 🚫 If GPS disabled → Alert with "Open Settings"

## Files Created

```
services/
  └── locationService.ts        # Core location service

hooks/
  └── useLocation.ts           # React hook for components

components/
  └── LocationGuard.tsx        # Permission guard component

app.json                        # ✅ Already configured!
```

## Next Steps

**Option A: Require for whole app**
```bash
# Edit app/(tabs)/_layout.tsx
# Wrap <Tabs> with <LocationGuard>
```

**Option B: Use in home screen only**
```bash
# Edit app/(tabs)/index.tsx
# Add useLocation hook
```

**Option C: Do nothing**
- Everything is ready
- Use when needed for specific features

## Test It

1. Run app: `npm start`
2. Open on device (not simulator for real GPS)
3. Permission screen should appear
4. Grant permission
5. Check console for location logs

## Important

⚠️ **After first run, you MUST rebuild:**
```bash
npx expo prebuild --clean
```

This ensures native permissions are properly configured!

---

**Full documentation:** `GPS_LOCATION_SETUP.md`
