# GPS & Location Service Setup

## 🎯 Overview
Production-ready GPS and location service implementation for Mari Gunting app. This ensures users have location access enabled before using location-dependent features.

## 📦 Components

### 1. **LocationService** (`services/locationService.ts`)
Singleton service that handles all location operations.

**Features:**
- ✅ Check if GPS is enabled
- ✅ Request location permissions
- ✅ Get current location
- ✅ Reverse geocoding (get address from coordinates)
- ✅ Watch location changes in real-time
- ✅ Calculate distance between coordinates
- ✅ Smart alerts (GPS disabled, permission denied)
- ✅ Auto-open device settings

**Methods:**
```typescript
// Check if GPS is enabled
await locationService.isLocationEnabled();

// Check permission status
await locationService.checkPermission();

// Request permission
await locationService.requestPermission();

// Get current location
await locationService.getCurrentLocation();

// Get location with address
await locationService.getCurrentLocationWithAddress();

// Calculate distance (in km)
const distance = locationService.calculateDistance(lat1, lon1, lat2, lon2);

// Watch location changes
await locationService.startWatchingLocation((location) => {
  console.log('Location updated:', location);
});

// Stop watching
locationService.stopWatchingLocation();
```

### 2. **useLocation Hook** (`hooks/useLocation.ts`)
React hook for easy location access in components.

**Usage:**
```typescript
import { useLocation } from '@/hooks/useLocation';

function MyComponent() {
  const {
    location,           // Current location
    permission,         // Permission status
    isLoading,         // Loading state
    error,             // Error message
    hasPermission,     // Boolean: permission granted
    getCurrentLocation,
    requestPermission,
    checkPermission,
  } = useLocation();

  // Get location with address
  const handleGetLocation = async () => {
    const loc = await getCurrentLocation(true); // true = with address
    if (loc) {
      console.log('Lat:', loc.latitude);
      console.log('Lng:', loc.longitude);
      console.log('Address:', loc.address);
    }
  };

  return (
    <Button onPress={handleGetLocation} title="Get My Location" />
  );
}
```

### 3. **LocationGuard Component** (`components/LocationGuard.tsx`)
Wrapper component that enforces location permission.

**Usage:**
```typescript
import { LocationGuard } from '@/components/LocationGuard';

function HomeScreen() {
  return (
    <LocationGuard requireLocation={true}>
      {/* Your screen content */}
      <Text>This content requires location access</Text>
    </LocationGuard>
  );
}
```

**Features:**
- Shows beautiful permission request screen
- Lists why location is needed
- One-click permission request
- Auto-refresh when app resumes
- Privacy note to reassure users

## 🚀 Implementation Examples

### Example 1: Wrap Tab Layout (Recommended)
Require location for entire app:

```typescript
// app/(tabs)/_layout.tsx
import { LocationGuard } from '@/components/LocationGuard';

export default function TabLayout() {
  return (
    <LocationGuard requireLocation={true}>
      <Tabs>
        {/* Your tabs */}
      </Tabs>
    </LocationGuard>
  );
}
```

### Example 2: Specific Screen
Only require location for specific screens:

```typescript
// app/(tabs)/index.tsx
import { LocationGuard } from '@/components/LocationGuard';

export default function HomeScreen() {
  return (
    <LocationGuard requireLocation={true}>
      <SafeAreaView>
        {/* Home screen content */}
      </SafeAreaView>
    </LocationGuard>
  );
}
```

### Example 3: Optional Location
Screen works with or without location:

```typescript
import { useLocation } from '@/hooks/useLocation';

export default function ProfileScreen() {
  const { hasPermission, getCurrentLocation } = useLocation();

  const updateAddress = async () => {
    if (hasPermission) {
      const loc = await getCurrentLocation(true);
      // Use location
    } else {
      // Show manual address input
    }
  };

  return (
    <View>
      {/* Profile content */}
    </View>
  );
}
```

### Example 4: Find Nearby Barbers
```typescript
import { useLocation } from '@/hooks/useLocation';
import { locationService } from '@/services/locationService';

function FindBarbersScreen() {
  const { location, hasPermission, getCurrentLocation } = useLocation();
  const [barbers, setBarbers] = useState([]);

  useEffect(() => {
    if (hasPermission && !location) {
      getCurrentLocation();
    }
  }, [hasPermission]);

  useEffect(() => {
    if (location) {
      loadNearbyBarbers();
    }
  }, [location]);

  const loadNearbyBarbers = async () => {
    // Fetch barbers from API
    const response = await api.getBarbers({
      location: {
        lat: location.latitude,
        lng: location.longitude,
        radius: 10, // 10 km radius
      },
    });

    // Calculate distance for each barber
    const barbersWithDistance = response.data.map((barber) => ({
      ...barber,
      distance: locationService.calculateDistance(
        location.latitude,
        location.longitude,
        barber.location.latitude,
        barber.location.longitude
      ),
    }));

    // Sort by distance
    barbersWithDistance.sort((a, b) => a.distance - b.distance);
    setBarbers(barbersWithDistance);
  };

  return (
    <View>
      {barbers.map((barber) => (
        <BarberCard
          key={barber.id}
          barber={barber}
          distance={barber.distance}
        />
      ))}
    </View>
  );
}
```

## 🔧 Configuration

### app.json
Already configured with:
- iOS location permissions (Info.plist)
- Android location permissions
- expo-location plugin with custom message

### Permission Messages
Currently set to:
> "Mari Gunting needs your location to find nearby barbers, calculate accurate travel costs, and provide the best service experience."

To customize, edit `app.json`:
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Your custom message"
      }
    },
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Your custom message"
        }
      ]
    ]
  }
}
```

## 📱 User Experience Flow

1. **App Launch** → Check location permission
2. **Permission Not Granted** → Show LocationGuard screen with:
   - Clear explanation of why location is needed
   - List of features requiring location
   - "Enable Location" button
   - Privacy reassurance note
3. **User Taps Button** → Native permission dialog
4. **Permission Granted** → Get current location automatically
5. **GPS Disabled** → Alert with "Open Settings" button
6. **Permission Denied (Permanently)** → Alert directing to Settings

## 🛠️ Testing

### Test Scenarios:
1. ✅ Fresh install (first permission request)
2. ✅ Permission denied
3. ✅ Permission denied permanently ("Don't ask again")
4. ✅ GPS disabled in device settings
5. ✅ App backgrounded and resumed
6. ✅ Location accuracy (low/high)
7. ✅ No internet connection (GPS still works)

### Testing Commands:
```bash
# iOS Simulator - Reset location permissions
xcrun simctl privacy booted reset location

# Android Emulator - Grant permission via ADB
adb shell pm grant com.marigunting.app android.permission.ACCESS_FINE_LOCATION
```

## 🔐 Privacy & Best Practices

### What We Do:
✅ Only request location when needed
✅ Clear explanation before requesting
✅ "While using app" permission (not "Always")
✅ Location cached to minimize battery usage
✅ Stop watching location when not needed

### What We Don't Do:
❌ Request location on app launch without context
❌ Track location when app is in background
❌ Share location with third parties
❌ Store location history permanently

## 🚨 Important Notes

1. **Rebuild After Changes**
   After modifying `app.json`, rebuild the app:
   ```bash
   npx expo prebuild --clean
   ```

2. **Production Build**
   Ensure location permissions are in:
   - iOS: Info.plist (auto-generated from app.json)
   - Android: AndroidManifest.xml (auto-generated)

3. **App Store Requirements**
   - iOS: Must explain why location is needed (we do this)
   - Android: Must request at runtime (we do this)
   - Both: Privacy policy should mention location use

## 📊 Analytics (Recommended)

Track permission status for insights:
```typescript
// When user grants permission
analytics.logEvent('location_permission_granted');

// When user denies permission
analytics.logEvent('location_permission_denied');

// When user opens settings
analytics.logEvent('location_settings_opened');
```

## 🔄 Future Enhancements

- [ ] Background location tracking (for barber-on-the-way feature)
- [ ] Location history for frequent addresses
- [ ] Smart caching based on movement detection
- [ ] Offline map caching
- [ ] Live location sharing between customer and barber

---

## Quick Start Checklist

For new developers:

1. ✅ Install expo-location: `npx expo install expo-location`
2. ✅ Configure app.json with location permissions
3. ✅ Wrap app with LocationGuard or use useLocation hook
4. ✅ Test permission flow on device
5. ✅ Test GPS disabled scenario
6. ✅ Test permission permanently denied
7. ✅ Add to app store privacy policy
8. ✅ Submit for review with location justification

**Ready for production! 🚀**
