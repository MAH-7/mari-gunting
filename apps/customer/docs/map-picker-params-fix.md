# Map Picker Params Fix - Preserving Booking Context

## The Bug 🐛

### What Was Happening:
```
Flow WITHOUT map picker:
User adds address → Saves → Back to booking ✅

Flow WITH map picker:
User adds address → Opens map → Confirms → Saves → Stays on addresses ❌
```

### Root Cause:
When navigating through the map picker, the booking context params (`fromBooking` and `barberId`) were getting lost:

```
1. Addresses Screen
   Params: { fromBooking: 'true', barberId: '123' }
   
2. Navigate to Map Picker
   Params: {} ← Lost booking context!
   
3. Return to Addresses
   Params: { selectedLatitude: '...', selectedLongitude: '...', selectedAddress: '...' }
   ← Still missing booking context!
   
4. Save Address
   isFromBooking = false ← Bug!
   barberId = undefined ← Bug!
   → Doesn't go back to booking ❌
```

## The Fix ✅

### Pass Params Through Each Navigation Step:

```
1. Addresses Screen
   Params: { fromBooking: 'true', barberId: '123' }
   
2. Navigate to Map Picker (WITH params!)
   Params: { fromBooking: 'true', barberId: '123' }
   ✅ Preserved!
   
3. Return to Addresses (WITH params!)
   Params: {
     selectedLatitude: '...',
     selectedLongitude: '...',
     selectedAddress: '...',
     fromBooking: 'true', ← Preserved!
     barberId: '123'      ← Preserved!
   }
   
4. Save Address
   isFromBooking = true ✅
   barberId = '123' ✅
   → Goes back to booking! ✅
```

## Code Changes

### 1. Pass Params When Opening Map Picker

**File**: `apps/customer/app/profile/addresses.tsx`

**Before**:
```typescript
// Opens map without params
router.replace('/profile/map-picker');
```

**After**:
```typescript
// Passes booking context through
router.replace({
  pathname: '/profile/map-picker',
  params: {
    fromBooking: isFromBooking ? 'true' : undefined,
    barberId: barberId,
  },
});
```

### 2. Receive and Return Params in Map Picker

**File**: `apps/customer/app/profile/map-picker.tsx`

**Before**:
```typescript
// Only returns location params
router.replace({
  pathname: '/profile/addresses',
  params: {
    selectedLatitude: selectedLocation.latitude.toString(),
    selectedLongitude: selectedLocation.longitude.toString(),
    selectedAddress: address,
  },
});
```

**After**:
```typescript
// Preserves booking context params
const params = useLocalSearchParams<{
  latitude?: string;
  longitude?: string;
  fromBooking?: string;  // ← Receive
  barberId?: string;     // ← Receive
}>();

router.replace({
  pathname: '/profile/addresses',
  params: {
    selectedLatitude: selectedLocation.latitude.toString(),
    selectedLongitude: selectedLocation.longitude.toString(),
    selectedAddress: address,
    // Preserve booking context if exists
    ...(params.fromBooking && { fromBooking: params.fromBooking }),
    ...(params.barberId && { barberId: params.barberId }),
  },
});
```

## Param Flow Diagram

### Complete Flow with Map Picker:

```
┌──────────────────────────────────────────────────────────┐
│ 1. Booking Screen                                         │
│    barberId = '123'                                       │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│ 2. Addresses Screen (from booking)                       │
│    Params: { fromBooking: 'true', barberId: '123' }     │
│    ✅ isFromBooking = true                               │
└──────────────────────────────────────────────────────────┘
                         │
                         │ User opens map picker
                         ▼
┌──────────────────────────────────────────────────────────┐
│ 3. Map Picker Screen                                     │
│    Params: { fromBooking: 'true', barberId: '123' }     │
│    ✅ Context preserved                                  │
└──────────────────────────────────────────────────────────┘
                         │
                         │ User confirms location
                         ▼
┌──────────────────────────────────────────────────────────┐
│ 4. Addresses Screen (returns)                            │
│    Params: {                                             │
│      selectedAddress: 'Street, City',                    │
│      selectedLatitude: '3.139',                          │
│      selectedLongitude: '101.686',                       │
│      fromBooking: 'true',  ← Still here!                 │
│      barberId: '123'       ← Still here!                 │
│    }                                                     │
│    ✅ isFromBooking = true                               │
│    ✅ Modal reopens with location filled                 │
└──────────────────────────────────────────────────────────┘
                         │
                         │ User saves address
                         ▼
┌──────────────────────────────────────────────────────────┐
│ 5. Booking Screen (auto-return)                          │
│    ✅ Address auto-selected                              │
│    ✅ Ready to complete booking                          │
└──────────────────────────────────────────────────────────┘
```

## Why Spread Syntax?

```typescript
...(params.fromBooking && { fromBooking: params.fromBooking }),
...(params.barberId && { barberId: params.barberId }),
```

This conditional spread ensures:
- If `fromBooking` exists → Include it in params
- If `fromBooking` is undefined → Don't include it (keeps params clean)
- Same for `barberId`

**Why not just always include them?**
```typescript
// ❌ Bad: Would include undefined values
params: {
  fromBooking: undefined,  // Pollutes params
  barberId: undefined,
}

// ✅ Good: Only includes if they exist
params: {
  // Only included if they have values
}
```

## Testing Checklist

- [x] Add address WITHOUT map → Returns to booking ✅
- [x] Add address WITH map → Returns to booking ✅
- [x] Select existing address → Returns to booking ✅
- [x] Add address from profile (not booking) → Stays on addresses ✅
- [x] Map picker preserves all params ✅
- [x] No undefined params in URL ✅

## Key Takeaway

**When navigating through intermediate screens, always preserve context params:**

```typescript
✅ Pass params: fromScreen → intermediateScreen
✅ Return params: intermediateScreen → backToScreen

❌ Lose params: Breaks the flow
```

This pattern applies to any multi-step flow where context needs to be preserved!
