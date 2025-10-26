# Background Location Implementation - Final Solution

**Date:** 2025-01-25  
**Status:** ✅ Ready to Rebuild & Test

## Problem Solved

**Requirement:**
- Minimize app → Barber stays online ✅
- Force close app → Barber goes offline after 3 min ✅

**Previous attempts:**
- ❌ Background Fetch (unreliable, iOS controlled)
- ✅ **Background Location** (reliable, industry standard)

## Solution: Continuous Background Location

We're using the same approach as Grab/Gojek: **Background location updates keep the app alive and update heartbeat**.

### How It Works

**1. Foreground (App active):**
- Heartbeat: Every 60 seconds
- Location: Every 5 minutes (idle) or 1.5 min (on-the-way)
- Barber visible: ✅ Yes

**2. Background (App minimized):**
- Location updates: Every 2 minutes OR when moved 50 meters
- Heartbeat: Updated with each location update
- Barber visible: ✅ Yes (stays online)

**3. Force Close:**
- Location stops immediately
- No more heartbeat updates
- After 3 minutes → Auto-offline
- Barber visible: ❌ No (goes offline)

## Files Modified

### 1. Location Tracking Service
**File:** `apps/partner/services/locationTrackingService.ts`

**Changes:**
- ✅ Added `TaskManager` import
- ✅ Request "Always Allow" location permission
- ✅ Implement `startBackgroundLocationTracking()`
- ✅ Implement `stopBackgroundLocationTracking()`
- ✅ Background task updates **both location AND heartbeat**
- ✅ Updates every 2 minutes or 50 meters moved

**Key code:**
```typescript
// Background task updates location + heartbeat together
await supabase
  .from('profiles')
  .update({
    location: `POINT(${lng} ${lat})`,
    last_heartbeat: new Date().toISOString(), // Heartbeat!
    updated_at: new Date().toISOString(),
  })
  .eq('id', userId);
```

### 2. Heartbeat Service
**File:** `apps/partner/services/heartbeatService.ts`

**Changes:**
- ✅ Removed unreliable BackgroundFetch code
- ✅ Simplified to foreground-only heartbeat
- ✅ Background heartbeat now handled by location service

### 3. App Configuration
**File:** `apps/partner/app.json`

**Changes:**
- ✅ Updated permission descriptions (clear explanation for "Always Allow")
- ✅ Added Android background location permissions
- ✅ Enabled background location in expo-location plugin

## What Barbers Will See

### Permission Flow

**Step 1: First time going online**
```
📍 "Mari Gunting" Would Like to Access Your Location
- While Using the App
- Allow Once
```

**Step 2: Prompt for "Always Allow"**
```
📍 "Mari Gunting" Would Like to Access Your Location Even When Not Using the App

"Mari Gunting needs continuous location access to keep you 
visible to customers even when the app is minimized. This 
helps you receive booking requests and provides real-time 
location updates to customers."

- Change to Always Allow
- Keep "While Using"
```

### While Online (Background)

**iOS:**
- Blue status bar indicator: "Mari Gunting is using your location"
- Or blue pill in Dynamic Island (iPhone 14 Pro+)

**Android:**
- Persistent notification: "Mari Gunting - Tracking your location to show availability to customers"

## Trade-offs

### ✅ Benefits
- Barbers stay visible when minimized
- Force close detection works (3 min offline)
- Reliable (location always works unlike BackgroundFetch)
- Industry standard approach (Grab, Uber, Gojek)
- No map API costs (just GPS + database)

### ⚠️ Concerns
- Battery drain (GPS running continuously when online)
- Permission friction ("Always Allow" is more intrusive)
- Blue bar/notification visible to user
- Apple review scrutiny (need good justification)

### 💡 Mitigations
- Clear explanation in permission prompt
- Barbers are professionals earning money (worth the trade-off)
- Only runs when barber toggles "online"
- Optimized settings: `Accuracy.Balanced`, `ActivityType.Other`

## API Cost Analysis

**Location updates (every 2 min when online):**
- Per barber: ~30 updates/hour = ~720 updates/day
- Each update: ~1KB (location + heartbeat)
- Monthly per barber: ~20MB bandwidth

**Cost:**
- 100 barbers: ~2GB/month (FREE tier)
- 1,000 barbers: ~20GB/month ($0 on Pro plan, includes 250GB)

**Verdict:** Negligible cost ✅

## Next Steps

### 1. Rebuild App (REQUIRED)

Background location requires native build:

```bash
cd apps/partner

# Clean previous build
rm -rf ios/build

# Rebuild with new permissions
SENTRY_DISABLE_AUTO_UPLOAD=true npx expo run:ios --device
```

### 2. Test on Real Device

**Test 1: Minimize (Should stay online)**
```
1. Open partner app
2. Toggle online
3. Check permission prompt → Grant "Always Allow"
4. Minimize app (home button)
5. Wait 5 minutes
6. Check customer app → Barber should still be visible ✅
7. Resume partner app → Check logs for "Background location + heartbeat updated"
```

**Test 2: Force Close (Should go offline)**
```
1. Open partner app
2. Toggle online
3. Force close (swipe up in app switcher)
4. Wait 3 minutes
5. Check customer app → Barber should disappear ✅
```

**Test 3: Monitor logs**
```
Expected logs when minimized:
📍 Background location update: {lat: x.xxx, lng: y.yyy}
✅ Background location + heartbeat updated
```

### 3. Verify Database

Check Supabase `profiles` table:
```sql
SELECT 
  id, 
  full_name, 
  is_online, 
  last_heartbeat,
  EXTRACT(EPOCH FROM (NOW() - last_heartbeat)) / 60 as minutes_ago
FROM profiles
WHERE role = 'barber' AND is_online = true;
```

**Expected:**
- Foreground: `minutes_ago` < 1
- Background: `minutes_ago` < 2-3
- Force close: `minutes_ago` keeps increasing → offline after 3 min

## Expected Console Logs

### Going Online
```
📍 Starting location tracking for user: [userId] (mode: idle)
✅ Background location permission granted
📍 Location obtained: {lat: x.xxx, lng: y.yyy}
✅ Location updated in database
⏱️ Update interval: 300 seconds (5 minutes)
✅ Background location tracking started
✅ Location tracking started
```

### Minimizing App
```
📱 AppState changed: active → background
⏸️  App backgrounded at: [timestamp]
(2 minutes later...)
📍 Background location update: {lat: x.xxx, lng: y.yyy}
✅ Background location + heartbeat updated
```

### Force Closing
```
(No logs - app is dead)
(3 minutes later on server...)
Cron job runs: check_and_offline_stale_users()
→ Sets is_online = false
```

### Resuming App
```
📱 AppState changed: background → active
▶️  App resumed at: [timestamp]
⏱️  Was idle for 15.2 minutes
```

## Troubleshooting

### Background location not working?
- Check permission: Settings → Privacy → Location Services → Mari Gunting → "Always"
- Check Background App Refresh: Settings → General → Background App Refresh → ON
- Rebuild app (simulator doesn't support background location)

### Still going offline after 3 minutes when minimized?
- Check logs: Should see "Background location + heartbeat updated"
- Query database: `last_heartbeat` should update every 2-3 min
- Check iOS Settings: Location → Mari Gunting → "Always Allow"

### Battery draining too fast?
- Expected behavior (GPS running continuously)
- Can adjust `timeInterval` in `startBackgroundLocationTracking()` (currently 2 min)
- Trade-off: Longer interval = better battery, but riskier offline detection

### Permission denied by user?
- App falls back to foreground-only tracking
- Warning: "Background location permission denied - will only track in foreground"
- Barber will go offline after 3 min if minimized

## Apple App Store Review

**What Apple will ask:**
- Why do you need "Always Allow" location?
- How does this benefit users?
- Is this core functionality?

**Your answer:**
```
Mari Gunting is an on-demand barber booking platform (similar to Grab/Uber 
for barbers). Our partner app serves professional barbers who provide mobile 
haircut services.

We require "Always Allow" location permission to:

1. Keep barbers visible to customers even when the app is minimized
2. Provide real-time location tracking to customers for safety and ETA
3. Enable barbers to receive booking requests while multitasking
4. Ensure accurate location-based matching with nearby customers

This is core functionality - without background location, barbers would 
disappear from customer searches when minimizing the app, preventing 
bookings and impacting their livelihood.

Similar to Grab, Uber, and Gojek driver apps.
```

## What Changed from Previous Approach

### Before (Background Fetch)
- Unreliable (iOS decides when to run)
- Minimum 15 min interval
- Doesn't work immediately (needs 2-3 days)
- Often doesn't run at all in development

### After (Background Location)
- Reliable (location always works)
- 2 minute interval (configurable)
- Works immediately after permission granted
- Industry standard for on-demand apps

## Files Summary

**Modified:**
1. ✅ `apps/partner/services/locationTrackingService.ts` - Background location + heartbeat
2. ✅ `apps/partner/services/heartbeatService.ts` - Simplified (removed BackgroundFetch)
3. ✅ `apps/partner/app.json` - Updated permissions and descriptions
4. ✅ `BACKGROUND_LOCATION_IMPLEMENTATION.md` - This document (NEW)

**No changes needed:**
- ✅ `supabase/migrations/20250124_heartbeat_auto_offline.sql` - Already at 3 min (correct)
- ✅ Database function - Already correct

## Timeline

- **2025-01-24:** Initial heartbeat (foreground only, 3 min auto-offline)
- **2025-01-25 AM:** Tried BackgroundFetch (unreliable)
- **2025-01-25 PM:** Implemented background location (reliable solution)

## Last Updated

2025-01-25 16:08 MYT (08:08 UTC)
