# Quick Start: Map-Based Address Picker

## Overview
Your app now has a map-based address picker that allows customers to visually select their location instead of manually typing it.

## What Was Added

### 1. New Screen: `app/profile/map-picker.tsx`
A full-screen interactive map where users can:
- See their current location automatically
- Tap anywhere on the map to select a location
- See the address for the selected location in real-time
- Confirm their selection to auto-fill the address form

### 2. Updated Screen: `app/profile/addresses.tsx`
The address form now has:
- **"Pick Location on Map"** button (replaces "Detect My Location")
- Automatic navigation to the map picker
- Address auto-fill when returning from the map picker
- Smart address parsing for Malaysian addresses

## How Customers Use It

```
Profile → My Addresses → Add Address → Pick Location on Map
```

### Step-by-Step Flow:
1. Customer taps "Add Address" in My Addresses screen
2. Modal opens with address form
3. Customer taps "Pick Location on Map" button (green button with map icon)
4. Full-screen map opens, centered on current location
5. Customer can:
   - Tap anywhere on the map to select a new location
   - Tap the GPS button (top-right) to recenter on current location
   - See the address update in the bottom panel as they select locations
6. Customer reviews the address in the bottom panel
7. Customer taps "Confirm Location" button
8. Returns to address form with all fields auto-filled
9. Customer can edit any field if needed
10. Customer taps "Save" to save the address

## Technical Implementation

### Map Picker Features
- **Auto-detection**: Gets current location on mount
- **Interactive map**: Tap to select any location
- **Reverse geocoding**: Converts coordinates to addresses
- **Dual API support**: Mapbox (primary), Expo Location (fallback)
- **Real-time address preview**: Shows address as you select
- **GPS recenter button**: Return to current location anytime

### Navigation Pattern
Uses Expo Router's URL parameters to pass data:
```typescript
// Map picker sends data back via params:
router.setParams({
  selectedLatitude: '3.1390',
  selectedLongitude: '101.6869',
  selectedAddress: 'Jalan Ampang, Kuala Lumpur, ...'
})

// Address form listens for these params with useEffect
```

### Address Parsing
Automatically extracts:
- **Address Line 1**: Street address
- **City**: City name
- **State**: State/region
- **Postal Code**: 5-6 digit postal code

## Files Modified/Created

### Created:
- `/apps/customer/app/profile/map-picker.tsx` - Map picker screen
- `/docs/MAP_ADDRESS_PICKER.md` - Detailed documentation
- `/docs/QUICK_START_MAP_PICKER.md` - This file

### Modified:
- `/apps/customer/app/profile/addresses.tsx` - Added map picker integration

## Testing

### To Test in Development:
1. Run the app: `npx expo start`
2. Navigate to Profile → My Addresses
3. Tap "Add Address"
4. Tap "Pick Location on Map"
5. Grant location permissions when prompted
6. Map should load with your current location
7. Tap somewhere else on the map
8. See address update in bottom panel
9. Tap "Confirm Location"
10. Verify address form is filled correctly

### Test Cases:
✅ Current location detection works
✅ Tapping map updates marker and address
✅ GPS button recenters map
✅ Confirm button fills address form
✅ Address parsing extracts correct components
✅ Can edit address before saving
✅ Save button stores address correctly

## Permissions Required

### iOS: Add to `app.config.ts`
Already configured in your Expo config:
```typescript
{
  NSLocationWhenInUseUsageDescription: "We need your location to help you find barbers nearby"
}
```

### Android: Add to `app.config.ts`
Already configured in your Expo config:
```typescript
{
  android: {
    permissions: ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"]
  }
}
```

## Known Limitations

### Expo Go
- Mapbox reverse geocoding may not work in Expo Go
- Fallback to Expo Location geocoding is automatic
- For full Mapbox features, need development build

### Address Parsing
- Best suited for Malaysian addresses
- Can handle various formats but may need manual adjustment
- Users can always edit parsed fields

## Next Steps

### Recommended Enhancements:
1. **Search Bar**: Add address search to find locations by name
2. **Recent Locations**: Save and show recently used addresses
3. **Nearby Barbers**: Show barber locations on the map
4. **Distance Display**: Show distance from selected location
5. **Custom Map Styles**: Add dark mode or branded map styles

### For Production:
1. Create development build to test full Mapbox features:
   ```bash
   npx expo run:ios
   # or
   npx expo run:android
   ```
2. Test on real devices with GPS
3. Test in areas with poor GPS signal
4. Test with various address formats

## Troubleshooting

### Map doesn't load
- Check Mapbox token in `.env`
- Verify Mapbox initialization in `_layout.tsx`
- Check console for errors

### Location permission denied
- User can still select location manually on map
- Tap GPS button to retry permission request

### Address not detected
- Check internet connection (needed for reverse geocoding)
- Falls back to showing coordinates if geocoding fails
- User can still confirm and manually edit

### Address format wrong
- Parsing works best for Malaysian addresses
- Users can always edit individual fields
- Consider adding validation for specific formats

## Support

For issues or questions about the map picker:
1. Check `/docs/MAP_ADDRESS_PICKER.md` for detailed docs
2. Check `/docs/MAPBOX_SETUP_GUIDE.md` for Mapbox setup
3. Review the code in `app/profile/map-picker.tsx`
4. Check Mapbox documentation: https://docs.mapbox.com/
