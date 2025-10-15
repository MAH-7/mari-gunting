# Track Barber - Quick Start Guide

Get the Track Barber feature up and running in **3 simple steps**!

---

## Step 1: Enable Supabase Realtime (30 seconds)

Open your Supabase SQL Editor and run:

```sql
-- Enable realtime for profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
```

**Verify it worked:**
```sql
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
-- Look for 'profiles' in the results
```

✅ Done!

---

## Step 2: Add Track Button to Booking Screen (5 minutes)

Open your booking details screen and add a "Track Barber" button:

```tsx
// File: apps/customer/app/booking/[id].tsx

import { useRouter } from 'expo-router';

// Inside your component:
const router = useRouter();

// Add this button (customize styling as needed)
{booking.status === 'on_the_way' && (
  <TouchableOpacity 
    onPress={() => router.push(`/booking/track-barber?bookingId=${booking.id}`)}
    style={{
      backgroundColor: '#10B981',
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 16,
    }}
  >
    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
      📍 Track Barber
    </Text>
  </TouchableOpacity>
)}
```

**When to show the button:**
- Booking status is `on_the_way`, `in_progress`, or `accepted`
- Barber has started traveling to customer

✅ Done!

---

## Step 3: Test It! (10 minutes)

### Setup
1. Have two devices ready:
   - **Device A:** Partner/Barber app
   - **Device B:** Customer app

2. Create a test booking:
   - Use customer app to book a service
   - Use partner app to accept the booking

### Testing
1. **On Device A (Partner):**
   - Accept the booking
   - Start the service (or change status to "on_the_way")
   - The partner app should be updating location in real-time

2. **On Device B (Customer):**
   - Open the booking details
   - Tap "Track Barber" button
   - You should see:
     - ✅ Map with two pins (customer = blue home, barber = green scissors)
     - ✅ "Live Tracking" badge at the top
     - ✅ Barber name and info at the bottom
     - ✅ Distance and ETA displayed

3. **Move Device A:**
   - Walk around with the partner device
   - Watch Device B's map update in real-time
   - ETA should recalculate automatically

4. **Test Arrival Notification:**
   - Bring devices within 100 meters of each other
   - You should see/hear:
     - 🔊 Notification sound
     - 📳 Vibration
     - 📱 Push notification
     - 🚨 Alert dialog

✅ All working? Awesome!

---

## Optional: Add Arrival Sound (5 minutes)

For a custom arrival sound:

1. **Download a sound:**
   - Visit: https://mixkit.co/free-sound-effects/ or https://freesound.org/
   - Search for: "notification", "chime", "ding", or "bell"
   - Download as MP3 (1-3 seconds, pleasant sound)

2. **Add to project:**
   ```bash
   # Place the file here:
   apps/customer/assets/sounds/arrival.mp3
   ```

3. **Test it:**
   - Restart the app
   - Test arrival notification
   - You should hear your custom sound!

**Skip this?** No problem! The feature falls back to system notification sound.

---

## Troubleshooting

### Map not loading?
- Check Mapbox access token in `.env`
- Verify `@rnmapbox/maps` is installed

### Location not updating?
- Verify Step 1 (Supabase Realtime) was completed
- Check partner app is updating location
- Look for "Live Tracking" badge (should be green)

### No arrival notification?
- Grant notification permissions
- Test on physical device (not simulator)
- Check you're within 100 meters

### Can't find booking?
- Ensure booking ID is correct
- Check booking exists in database
- Review console logs for errors

---

## What's Next?

Your Track Barber feature is now live! 🎉

### Enhance It Further:
- Add route line on map (Mapbox Directions API)
- Implement traffic-aware ETA
- Add progressive notifications (10 min, 5 min, arrived)
- Implement phone dialer for "Call Barber" button

### Read More:
- **Full Documentation:** `docs/TRACK_BARBER_FEATURE.md`
- **Implementation Details:** `docs/TRACK_BARBER_IMPLEMENTATION_SUMMARY.md`

---

## Quick Reference

**Files Created:**
```
apps/customer/
├── app/booking/track-barber.tsx         # Main screen
└── hooks/useRealtimeBarberLocation.ts   # Real-time hook

docs/
├── TRACK_BARBER_FEATURE.md              # Full docs
├── TRACK_BARBER_IMPLEMENTATION_SUMMARY.md
└── TRACK_BARBER_QUICKSTART.md           # This file
```

**Key Functions:**
- `useRealtimeBarberLocation(barberId, enabled)` - Subscribe to location updates
- `parseLocation(locationData)` - Parse PostGIS WKB to lat/lng
- `calculateETA(from, to)` - Calculate distance and time

**Navigation:**
```tsx
router.push(`/booking/track-barber?bookingId=${booking.id}`);
```

---

**Ready to track? Let's go! 🚀**
