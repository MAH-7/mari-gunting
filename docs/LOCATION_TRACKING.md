# Automatic Location Tracking for Freelance Barbers

## Overview
Implemented automatic real-time location tracking for freelance barbers to show accurate distances to customers.

## How It Works

### For Freelance Barbers (Partner App)

#### Automatic Tracking
- **Starts when**: Barber toggles "Online" status
- **Updates**: Every 5 minutes while online
- **Stops when**: Barber toggles "Offline" or logs out
- **Permission**: Uses foreground location (when app is open)

#### Manual Update
- Menu: Profile → Business Settings → "Update My Location"
- Instantly updates location in database
- Useful if barber moved locations

### For Customers (Customer App)
- Distance is calculated in real-time using Haversine formula
- Shows "X km away" on each barber card
- Filters barbers based on:
  1. Customer's search radius (5, 10, 15, or 20 km)
  2. Barber's service radius (how far they're willing to travel)

## Implementation Details

### Location Tracking Service
**File**: `apps/partner/services/locationTrackingService.ts`

**Features**:
- Singleton service for managing location tracking
- Updates location in PostGIS format: `POINT(longitude latitude)`
- Configurable update interval (default: 5 minutes)
- Automatic error handling and logging

**Methods**:
```typescript
// Start tracking
await locationTrackingService.startTracking(userId);

// Stop tracking
locationTrackingService.stopTracking();

// Manual update
await locationTrackingService.updateLocation(userId);

// Check status
locationTrackingService.isCurrentlyTracking();
```

### Integration Points

#### Partner App - Dashboard
**File**: `apps/partner/app/(tabs)/dashboard.tsx`

When barber toggles online/offline:
- **Going Online** → Starts location tracking (freelance only)
- **Going Offline** → Stops location tracking
- Updates `profiles.location` in Supabase

#### Partner App - Profile
**File**: `apps/partner/app/(tabs)/profile.tsx`

New menu item for freelance barbers:
- "Update My Location" button
- Manually triggers location update
- Shows success/error alerts

#### Customer App - Available Barbers
**File**: `apps/customer/app/barbers.tsx`

Calculates distance in real-time:
- Gets customer location on mount
- Calculates distance to each barber using Haversine
- Filters by both radiuses (customer search + barber service)
- Sorts by distance (default)

## Database Schema

### Profiles Table
```sql
location: geometry(Point, 4326)  -- PostGIS point (lng, lat)
```

**Update Format**:
```typescript
location: `POINT(${longitude} ${latitude})`
```

**Example**:
```
POINT(101.7123 3.1569)  // Kuala Lumpur coordinates
```

## User Experience

### Freelance Barber Flow
1. Opens partner app
2. Toggles "Online"
3. App requests location permission (if not granted)
4. Location tracked automatically every 5 minutes
5. Customers see updated distance
6. Can manually update via Profile menu
7. Location stops tracking when going "Offline"

### Customer Flow
1. Opens "Available Barbers"
2. App gets their current location
3. Sees barbers with accurate distances
4. Can filter by search radius (5-20km)
5. Barbers shown if:
   - Within customer's search radius AND
   - Customer within barber's service radius

## Configuration

### Update Interval
Default: 5 minutes

To change:
```typescript
locationTrackingService.setUpdateInterval(10); // 10 minutes
```

### Location Accuracy
```typescript
Location.Accuracy.Balanced  // Good balance of accuracy and battery
```

Other options:
- `Location.Accuracy.Lowest` - Least accurate, best battery
- `Location.Accuracy.Low` - City-level accuracy
- `Location.Accuracy.Balanced` - Default
- `Location.Accuracy.High` - Street-level accuracy
- `Location.Accuracy.Highest` - Most accurate, worst battery

## Privacy & Permissions

### iOS
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Mari Gunting Partner needs your location to provide location-based services to customers.</string>
```

### Android
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

### What We Track
- ✅ Only when barber is **online** (freelance only)
- ✅ Only **foreground** tracking (when app is open)
- ❌ No background tracking when app is closed
- ❌ No tracking for barbershop staff (fixed location)

## Testing

### Test Scenarios

1. **Freelance Barber Goes Online**
   - Toggle online → Location tracking starts
   - Check database: `profiles.location` updated
   - Check logs: "✅ Location tracking started"

2. **Freelance Barber Goes Offline**
   - Toggle offline → Location tracking stops
   - Check logs: "🛑 Location tracking stopped"

3. **Manual Location Update**
   - Profile → Update My Location
   - Should show success alert
   - Check database: `profiles.location` updated

4. **Customer Sees Distance**
   - Open Available Barbers screen
   - Should see "X km away" on each card
   - Distance should update if barber moves

5. **Barbershop Staff**
   - Toggle online → No location tracking
   - Location stays fixed (barbershop address)

## Troubleshooting

### Location Permission Denied
**Error**: "Location permission not granted"
**Fix**: 
- iOS: Settings → Mari Gunting Partner → Location → While Using the App
- Android: Settings → Apps → Mari Gunting Partner → Permissions → Location → Allow

### Location Not Updating
**Check**:
1. Is barber online?
2. Is account type "freelance"?
3. Is location permission granted?
4. Check logs for errors

### Distance Not Showing
**Check**:
1. Does barber have valid location in database?
2. Is customer location permission granted?
3. Check `barber.location.latitude` and `barber.location.longitude`

## Future Enhancements

- [ ] Background location tracking (requires "Always" permission)
- [ ] Location history tracking
- [ ] Route optimization for multiple bookings
- [ ] Geofencing for service areas
- [ ] Battery optimization
- [ ] Location accuracy indicator

## Related Files

### Partner App
- `apps/partner/services/locationTrackingService.ts` - Core tracking service
- `apps/partner/app/(tabs)/dashboard.tsx` - Online/offline toggle integration
- `apps/partner/app/(tabs)/profile.tsx` - Manual update button

### Customer App
- `apps/customer/app/barbers.tsx` - Distance calculation and filtering
- `apps/customer/hooks/useLocation.ts` - Customer location hook

### Shared
- `packages/shared/config/supabase.ts` - Supabase client
- `packages/shared/services/supabaseApi.ts` - Location field mapping

## Support

For issues or questions:
- Check console logs for detailed error messages
- Verify location permissions are granted
- Test with simulator location (Xcode/Android Studio)
