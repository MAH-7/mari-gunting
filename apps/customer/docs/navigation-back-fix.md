# Navigation Fix: `router.back()` vs `router.replace()`

## The Bug: Duplicate Booking Screen 🐛

### What Was Happening:
```
Initial Stack:
[Barber Profile] → [Confirm Booking]

User clicks "Add Address":
[Barber Profile] → [Confirm Booking] → [Select Address]

User selects address (using router.replace):
[Barber Profile] → [Confirm Booking] → [Confirm Booking] ← DUPLICATE!
                                        ↑ Replaces "Select Address" with new "Confirm Booking"

Result:
- Press back once → Still on Confirm Booking
- Press back again → Still on Confirm Booking
- Stuck in a loop! ❌
```

### Why It Happened:
When we used `router.replace()`, it replaced the **Select Address** screen with a **new Confirm Booking** screen, creating a duplicate in the stack.

## The Fix: Use `router.back()` ✅

### Correct Approach:
```
Initial Stack:
[Barber Profile] → [Confirm Booking]

User clicks "Add Address":
[Barber Profile] → [Confirm Booking] → [Select Address]

User selects address (using router.back()):
[Barber Profile] → [Confirm Booking] ← Back to EXISTING screen
                   ↑ No duplicate!

Result:
- Press back once → Barber Profile
- Clean navigation! ✅
```

## Technical Explanation

### ❌ Wrong Approach (Creates Duplicate):
```typescript
// From address screen, after user selects
router.replace({
  pathname: '/booking/create',
  params: { 
    returnFromAddresses: 'true',
    selectedAddressId: address.id,
  }
});

// Result: Creates NEW booking screen
// Stack: [Profile] → [Booking OLD] → [Booking NEW]
```

### ✅ Correct Approach (Returns to Existing):
```typescript
// From address screen, after user selects
router.setParams({
  returnFromAddresses: 'true',
  selectedAddressId: address.id,
});
router.back();

// Result: Returns to EXISTING booking screen with new params
// Stack: [Profile] → [Booking]
```

## Key Insight: `router.setParams()` + `router.back()`

### How It Works:

1. **Set params** for the **existing** booking screen:
   ```typescript
   router.setParams({
     returnFromAddresses: 'true',
     selectedAddressId: address.id,
   });
   ```
   This updates the params of the booking screen that's already in the stack.

2. **Go back** to that screen:
   ```typescript
   router.back();
   ```
   This pops the address screen and returns to the booking screen.

3. **Booking screen's `useEffect` detects the params**:
   ```typescript
   useEffect(() => {
     if (returnFromAddresses === 'true' && selectedAddressId) {
       setSelectedAddress(selectedAddressId);
       // Address is now selected!
     }
   }, [returnFromAddresses, selectedAddressId]);
   ```

## Navigation Pattern Comparison

### Pattern 1: `router.push()` (Adds to Stack)
```
Use when: Creating a new screen
Before: [A] → [B]
After:  [A] → [B] → [C]
```

### Pattern 2: `router.replace()` (Replaces Current)
```
Use when: Replacing current screen with different one
Before: [A] → [B]
After:  [A] → [C] (B removed)
```

### Pattern 3: `router.back()` (Returns to Previous)
```
Use when: Returning to existing screen in stack
Before: [A] → [B] → [C]
After:  [A] → [B] (C removed)
```

### Pattern 4: `router.setParams()` + `router.back()` (Our Solution!)
```
Use when: Returning to existing screen WITH new data
Before: [A] → [B] → [C]
Step 1: setParams updates B's params
Step 2: back() removes C
After:  [A] → [B (with new params)]
```

## Complete Flow Diagram

### Scenario: Add New Address

```
1. Initial State
   Stack: [Profile] → [Booking]

2. User taps "Add New Address"
   router.push('/profile/addresses')
   Stack: [Profile] → [Booking] → [Addresses]

3. User adds address and saves
   router.setParams({ returnFromAddresses: 'true', selectedAddressId: 'xyz' })
   router.back()
   Stack: [Profile] → [Booking] ← Params updated!

4. Booking screen's useEffect fires
   Detects returnFromAddresses=true
   Sets selectedAddress='xyz'
   Address is selected! ✅
```

### Scenario: Select Existing Address

```
1. Initial State
   Stack: [Profile] → [Booking]

2. User taps "Add New Address"
   Stack: [Profile] → [Booking] → [Addresses]

3. User taps "Use This Address"
   router.setParams({ returnFromAddresses: 'true', selectedAddressId: 'abc' })
   router.back()
   Stack: [Profile] → [Booking] ← Params updated!

4. Booking screen's useEffect fires
   Sets selectedAddress='abc'
   Address is selected! ✅
```

### Scenario: User Presses Back Button

```
1. User on Address Screen
   Stack: [Profile] → [Booking] → [Addresses]

2. User presses back button
   router.back()
   Stack: [Profile] → [Booking]

3. No params set, so no address selected
   Clean return! ✅
```

## Before vs After

### Before (with router.replace - Buggy):
```
[Profile] → [Booking] → [Addresses]
                ↓ router.replace()
[Profile] → [Booking] → [Booking] ← Duplicate!
                ↓ Press back
[Profile] → [Booking] ← Still here!
                ↓ Press back again
[Profile] → [Booking] ← STILL here! Bug!
```

### After (with router.back() - Fixed):
```
[Profile] → [Booking] → [Addresses]
                ↓ router.back()
[Profile] → [Booking] ← Clean!
                ↓ Press back
[Profile] ← Back to profile, as expected!
```

## Testing Checklist

- [x] Select existing address → Back to booking with address selected
- [x] Add new address → Back to booking with address selected
- [x] Press back on address screen → Back to booking with no selection
- [x] Press back on booking → Back to barber profile (not stuck!)
- [x] No duplicate screens in navigation stack
- [x] Navigation stack is clean

## Key Takeaway

**When returning to an existing screen with new data:**
```typescript
✅ Use: router.setParams() + router.back()
❌ Not: router.replace() (creates duplicate)
❌ Not: router.push() (adds to stack)
```

This is the **proper pattern** for passing data back to a previous screen in Expo Router!
