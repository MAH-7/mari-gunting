# Navigation Stack Fix - Cleaner Flow

## Problem: Messy Navigation Stack ❌

### Before (Too Many Screens):
```
User Flow:
1. Barber Profile
2. → Confirm Booking
3. → Select Address (Add New)
4. → Add Address Modal
5. → Map Picker
6. → Add Address Modal (returns)
7. → My Addresses (after save)
8. → User manually presses back
9. → Confirm Booking

Navigation Stack:
[Barber Profile] → [Confirm Booking] → [Select Address] → [My Addresses]
                                                            ↑ Too deep!
```

**Issues**:
- ❌ User ends up on "My Addresses" screen after saving
- ❌ Must manually press back button
- ❌ Confusing - "Why am I on My Addresses?"
- ❌ Navigation stack too deep (4 screens)
- ❌ Poor UX, not like Grab at all

## Solution: Clean Navigation with `router.replace()` ✅

### After (Direct Return):
```
User Flow:
1. Barber Profile
2. → Confirm Booking
3. → Select Address (Add New)
4. → Add Address Modal
5. → Map Picker
6. → Add Address Modal (returns)
7. → Save
8. ✨ Automatically back to Confirm Booking (address selected)

Navigation Stack:
[Barber Profile] → [Confirm Booking]
                   ↑ Clean and simple!
```

**Improvements**:
- ✅ Automatically returns to booking after save
- ✅ Address automatically selected
- ✅ No manual back button needed
- ✅ Clean navigation stack (only 2 screens)
- ✅ Matches Grab UX exactly

## Technical Implementation

### Key Changes

#### 1. **After Saving Address** (Use `replace` not `push`)

**Before**:
```typescript
router.push({  // ❌ Adds to stack
  pathname: '/booking/create',
  params: { ... }
});
// Result: User on "My Addresses", must press back
```

**After**:
```typescript
router.replace({  // ✅ Replaces stack
  pathname: '/booking/create',
  params: { 
    barberId: barberId,
    returnFromAddresses: 'true',
    selectedAddressId: newAddressId,
  }
});
// Result: Directly back to booking with address selected!
```

#### 2. **After Selecting Existing Address** (Use `replace` not `push`)

**Before**:
```typescript
router.push({  // ❌ Keeps address screen in stack
  pathname: '/booking/create',
  params: { ... }
});
```

**After**:
```typescript
router.replace({  // ✅ Removes address screen from stack
  pathname: '/booking/create',
  params: { 
    barberId: params.barberId,
    returnFromAddresses: 'true',
    selectedAddressId: address.id,
  }
});
```

#### 3. **Back Button Handling**

**Before**:
```typescript
<TouchableOpacity onPress={() => router.back()}>
  <Ionicons name="arrow-back" />
</TouchableOpacity>
// Goes back one screen at a time
```

**After**:
```typescript
<TouchableOpacity 
  onPress={() => {
    if (isFromBooking && params.barberId) {
      // Replace back to booking directly
      router.replace({
        pathname: '/booking/create',
        params: { barberId: params.barberId }
      });
    } else {
      // Normal back navigation
      router.back();
    }
  }}
>
  <Ionicons name="arrow-back" />
</TouchableOpacity>
// Goes directly to booking if from booking flow
```

## Navigation Stack Comparison

### Before (Deep Stack):
```
┌─────────────────────┐
│  Barber Profile     │
├─────────────────────┤
│  Confirm Booking    │  ← Want to be here
├─────────────────────┤
│  Select Address     │  ← Unnecessary
├─────────────────────┤
│  My Addresses       │  ← User is here after save ❌
└─────────────────────┘

User must: Press back → Press back → Finally at booking
```

### After (Shallow Stack):
```
┌─────────────────────┐
│  Barber Profile     │
├─────────────────────┤
│  Confirm Booking    │  ← User is here after save ✅
└─────────────────────┘

Automatic: Save → Booking (with address selected)
```

## `router.push()` vs `router.replace()`

### `router.push()` - Adds to Stack
```
Before: [Screen A] → [Screen B]
After:  [Screen A] → [Screen B] → [Screen C]
        ↑ Screen A still in stack
```

### `router.replace()` - Replaces Current
```
Before: [Screen A] → [Screen B]
After:  [Screen A] → [Screen C]
                     ↑ Screen B removed from stack
```

## User Experience Impact

### Scenario: Add New Address

**Before** (6 taps):
1. Tap "Add New Address"
2. Tap "+" to add
3. Fill form
4. Tap "Save"
5. ❌ On "My Addresses" (confused)
6. Tap back button
7. Finally on booking

**After** (4 taps):
1. Tap "Add New Address"
2. Tap "+" to add
3. Fill form
4. Tap "Save"
5. ✅ Automatically on booking with address selected!

**33% fewer taps, 100% less confusion**

### Scenario: Select Existing Address

**Before** (3 taps):
1. Tap "Add New Address"
2. Tap "Use This Address"
3. Tap back button

**After** (2 taps):
1. Tap "Add New Address"
2. Tap "Use This Address"
3. ✅ Automatically back!

**33% fewer taps**

## Testing Checklist

- [ ] Add new address from booking → Returns to booking with address selected
- [ ] Select existing address → Returns to booking with address selected
- [ ] Press back on address screen → Returns to booking
- [ ] Add address from Profile → Works normally (no auto-return)
- [ ] Navigation stack is clean (only 2 screens max)
- [ ] No duplicate screens in stack

## References

- **Expo Router Documentation**: `router.replace()` vs `router.push()`
- **Grab UX Guidelines**: Clean navigation stacks
- **Material Design**: Navigation patterns
- **iOS HIG**: Navigation bar behavior
