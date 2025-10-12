# Map-Based Address Picker

This feature allows customers to select their address by pinpointing a location on a map, providing a more accurate and user-friendly way to set up addresses.

## How It Works

### 1. Address Form Modal (`addresses.tsx`)
- When adding a new address, customers see a "Pick Location on Map" button
- Clicking the button navigates to the map picker screen
- After selecting a location on the map, the address form is automatically populated

### 2. Map Picker Screen (`map-picker.tsx`)
- Opens a full-screen interactive map
- Automatically detects and centers on user's current location
- Displays a draggable marker that users can reposition
- Shows address information for the selected location
- Includes a "current location" button to re-center the map

## Features

### Interactive Map
- **Tap anywhere** on the map to select a location
- **Marker** shows the currently selected position
- **Address panel** displays the detected address and coordinates

### Current Location Button
- Floating button in the top-right corner
- Re-centers map on user's current GPS location
- Requires location permissions

### Reverse Geocoding
- Converts GPS coordinates to human-readable addresses
- Uses Mapbox geocoding API (primary)
- Falls back to Expo Location geocoding if Mapbox fails

### Address Preview Panel
- Shows selected address in real-time
- Displays GPS coordinates
- Loading indicator while fetching address

### Confirm Button
- Saves the selected location
- Returns to address form with auto-filled fields
- Disabled until a valid address is detected

## User Flow

```
1. Customer opens "Add Address" form
   ↓
2. Taps "Pick Location on Map"
   ↓
3. Map opens, showing current location
   ↓
4. Customer can:
   - Tap anywhere on map to select location
   - Use current location button to re-center
   - Review address in bottom panel
   ↓
5. Customer taps "Confirm Location"
   ↓
6. Returns to address form with pre-filled fields
   ↓
7. Customer reviews/edits and saves
```

## Technical Details

### Dependencies
- `@rnmapbox/maps` - Map rendering and interaction
- `expo-location` - GPS and geocoding
- Custom `mapbox.ts` utility - Reverse geocoding helper

### Navigation
Uses Expo Router's URL params to pass data between screens:
- `selectedLatitude` - GPS latitude
- `selectedLongitude` - GPS longitude  
- `selectedAddress` - Full address string

### Address Parsing
The selected address is parsed into components:
- Address Line 1 (street)
- City
- State
- Postal Code (5-6 digits)

### Permissions
Requires `Location.Accuracy.High` permission for:
- Getting current location
- Reverse geocoding

## UI Components

### Map View
- Full-screen Mapbox map
- Street style by default
- Interactive pan and zoom

### Marker
- Red location pin icon
- Positioned at selected coordinates
- Updates when tapping the map

### Address Panel
- Floating card at bottom
- Rounded corners with shadow
- Shows address and coordinates
- Loading state during geocoding

### Buttons
- **Current Location**: White circle, top-right, locate icon
- **Confirm Location**: Blue button, bottom, full-width

## Error Handling

### Location Permission Denied
- Shows alert explaining permission is required
- User can still manually select location on map

### Geocoding Failures
- Falls back to Expo Location API
- Shows coordinates if both APIs fail
- User can still confirm and manually edit address

### No Location Selected
- Confirm button is disabled
- Alert shown if user tries to confirm without selection

## Styling

### Theme
- Primary color: `#007AFF` (iOS blue)
- Success color: `#00B14F` (brand green)
- Marker color: `#FF6B6B` (red)

### Layout
- Full-screen map for maximum visibility
- Floating controls don't obstruct map view
- Bottom panel positioned above confirm button

## Next Steps

Potential enhancements:
- Search bar to find addresses by name
- Save favorite locations
- Map markers for nearby barbers
- Distance calculation from current location
- Dark mode support
- Custom map styles
