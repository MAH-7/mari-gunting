# Address Selection Flow in Booking

## Overview
This document explains how the address selection flow works when creating a booking in the Mari Gunting customer app.

## User Flow

### 1. **Starting from Booking Confirmation Screen**
When a user is on the booking confirmation screen (`/booking/create`):
- If they have saved addresses → They can select from the list
- If they have NO saved addresses → They see an "Add Address" button

### 2. **Adding an Address from Booking**
When the user clicks "Add Address":
1. They're navigated to `/profile/addresses` with special params:
   - `fromBooking: 'true'`
   - `barberId: [current barber ID]`

2. The address screen changes:
   - Header title changes from "My Addresses" to "Select Address"
   - Each address card shows a green "Use This Address" button instead of Edit/Delete actions
   - User can still add a new address via the "+" button in the header

### 3. **Selecting an Existing Address**
When the user clicks "Use This Address" on any saved address:
1. They're navigated back to `/booking/create` with params:
   - `returnFromAddresses: 'true'`
   - `selectedAddressId: [address ID]`

2. The booking screen automatically:
   - Selects that address
   - Clears the navigation params
   - Shows the address as selected with a radio button

### 4. **Adding a New Address from Booking Flow**
When the user adds a new address while in the booking flow:
1. They tap the "+" button in the address screen header
2. Fill in the address form (with optional map picker)
3. When they save:
   - The address is created in the database
   - They're automatically navigated back to booking screen
   - The newly created address is automatically selected

## Technical Implementation

### Key Files Modified

#### `/apps/customer/app/booking/create.tsx`
- Added `useEffect` to listen for address selection
- Modified "Add Address" button to pass booking context params
- Handles auto-selection when returning from address management

#### `/apps/customer/app/profile/addresses.tsx`
- Added `isFromBooking` detection from route params
- Changed UI conditionally based on booking context
- Modified address card to show "Use This Address" button
- Updated `addMutation` to auto-navigate back with new address

### Parameter Flow

```typescript
// Going TO address management FROM booking:
{
  pathname: '/profile/addresses',
  params: {
    fromBooking: 'true',
    barberId: '123',
  }
}

// Returning TO booking FROM address management:
{
  pathname: '/booking/create',
  params: {
    barberId: '123',
    returnFromAddresses: 'true',
    selectedAddressId: '456',
  }
}
```

## Benefits

✅ **Seamless UX** - Users can add/select addresses without losing booking context
✅ **Auto-selection** - Newly added addresses are automatically selected
✅ **Context-aware UI** - Address screen adapts based on where user came from
✅ **No data loss** - All booking selections (services, notes) are preserved

## Future Enhancements

1. **Quick Add Mode** - Show a simplified address form inline on booking screen
2. **Recently Used** - Sort addresses by most recently used in bookings
3. **Smart Suggestions** - Suggest addresses based on barber location
4. **Address Validation** - Verify address is within service area before allowing selection
