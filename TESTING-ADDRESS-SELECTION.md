# Testing Address Selection Flow

## Steps to Test

1. **Open your dev console** to see logs (in Expo Go or in terminal where Metro bundler is running)

2. **Navigate to booking screen**:
   - Go to barber profile
   - Click "Book Now"
   - You should be on the booking confirmation screen

3. **Click "Add Address"** button (if you have no addresses)

4. **Check the console logs**:
   You should see logs like:
   ```
   isFromBooking: true
   barberId: [some UUID]
   ```

5. **Click "Use This Address"** on any address

6. **Check the console logs again**:
   You should see:
   ```
   handleSelectAddress called
   Address: { id: "...", label: "...", ... }
   isFromBooking: true
   barberId: [some UUID]
   Navigating back to booking with address ID: [UUID]
   ```

7. **After navigation back to booking**:
   You should see:
   ```
   Address selection useEffect triggered
   returnFromAddresses: true
   selectedAddressId: [UUID]
   Setting selected address to: [UUID]
   Selected address ID: [UUID]
   Available addresses: [array of addresses]
   Found address: { id: "...", label: "...", ... }
   ```

## Expected Result

- The address should be selected (radio button filled)
- The address card should have green background
- You should be able to proceed with booking

## Troubleshooting

### If logs show "Not navigating - conditions not met"
- Check that `fromBooking` param is being passed correctly
- Verify `barberId` is present in the URL params

### If "Setting selected address" shows but address not selected
- Check if address IDs match between navigation and fetched addresses
- Verify addresses are being fetched from database (not mock data)

### If no logs appear at all
- Make sure Metro bundler is running
- Check that console.log is enabled in your environment
- Try adding `Alert.alert()` instead of `console.log()` for debugging

## Files Modified

All debug logging added to:
- `/apps/customer/app/booking/create.tsx` - Lines 28-42, 73-79
- `/apps/customer/app/profile/addresses.tsx` - Lines 98-117
