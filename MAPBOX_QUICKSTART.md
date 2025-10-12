# 🗺️ Mapbox Quick Start

## ✅ Setup Complete!

Your Mapbox is now configured in both Customer and Partner apps.

---

## 🧪 How to Test

### Step 1: Restart Your App

```bash
# Stop current server (Ctrl+C in terminal)
# Then restart:
cd apps/customer
npx expo start --clear
```

### Step 2: Open App & Check Console

Look for this message in the terminal:
```
✅ Mapbox initialized
```

### Step 3: Test the Map

1. Open the app on your device
2. Login
3. Go to **Profile** tab
4. Scroll to **Developer** section
5. Tap **"🗺️ Test Mapbox"**
6. You should see a map of Kuala Lumpur with 2 markers!

---

## 📱 What's Configured

### ✅ Customer App:
- `/apps/customer/.env` - Token added
- `/apps/customer/app/_layout.tsx` - Initializes Mapbox
- `/apps/customer/app/test-map.tsx` - Test screen
- `/apps/customer/app/(tabs)/profile.tsx` - Test button added

### ✅ Partner App:
- `/apps/partner/.env` - Token added  
- `/apps/partner/app/_layout.tsx` - Initializes Mapbox

### ✅ Shared:
- `/packages/shared/utils/mapbox.ts` - Mapbox utilities
  - `initializeMapbox()` - Setup function
  - `geocodeAddress()` - Address → Coordinates
  - `reverseGeocode()` - Coordinates → Address
  - `Mapbox` - Main Mapbox component

---

## 🎯 Usage Examples

### Show a Basic Map

```typescript
import { Mapbox } from '@/utils/mapbox';

<Mapbox.MapView
  style={{ flex: 1 }}
  styleURL={Mapbox.StyleURL.Street}
>
  <Mapbox.Camera
    zoomLevel={14}
    centerCoordinate={[lng, lat]}
  />
</Mapbox.MapView>
```

### Add a Marker

```typescript
<Mapbox.PointAnnotation
  id="marker1"
  coordinate={[longitude, latitude]}
>
  <View style={styles.marker}>
    <Ionicons name="location" size={40} color="#00B14F" />
  </View>
</Mapbox.PointAnnotation>
```

### Convert Address to Coordinates

```typescript
import { geocodeAddress } from '@/utils/mapbox';

const coords = await geocodeAddress('KLCC, Kuala Lumpur');
// Returns: { latitude: 3.1569, longitude: 101.7115 }
```

### Convert Coordinates to Address

```typescript
import { reverseGeocode } from '@/utils/mapbox';

const address = await reverseGeocode(3.1569, 101.7115);
// Returns: "Petronas Twin Tower, Kuala Lumpur, Malaysia"
```

---

## 🚀 Next Steps

Now you can:

1. **Show barbers on map** in home screen
2. **Add address picker** in address form
3. **Track barber location** in real-time
4. **Calculate distances** for pricing

See `/docs/MAPBOX_SETUP_GUIDE.md` for complete examples!

---

## 🐛 Troubleshooting

### Map not showing?
- Check console for "✅ Mapbox initialized"
- Verify token in `.env` files
- Restart app with `npx expo start --clear`

### Build errors?
- Run `npx expo prebuild --clean`
- Then `npx expo run:ios` or `npx expo run:android`

### Token issues?
- Check token at https://account.mapbox.com/
- Ensure it starts with `pk.`
- Make sure it's not expired

---

**Your Mapbox is ready to use!** 🎉
