# Testing Booking Integration - Quick Guide

**Status:** ✅ Ready to Test  
**Date:** January 2025

## 🎯 What We're Testing

The new **real Supabase backend integration** for:
1. Booking list with real data
2. Pull-to-refresh functionality
3. Booking details screen
4. Address management screen

---

## ✅ App is Now Running

The app should now be running successfully on your iPhone simulator with:
- ✅ Supabase connected
- ✅ Cloudinary gracefully handled (not configured)
- ✅ Mapbox temporarily disabled for Expo Go
- ⚠️ Some warnings about .new files (can be ignored)

---

## 🧪 Testing Checklist

### 1. **Bookings Screen** (`(tabs)/bookings`)

#### Navigate to Bookings Tab:
1. Open the app on your simulator
2. Tap on the **Bookings** tab (second icon from left)

#### What to Test:
- [ ] **Loading State:** Should show skeleton loading cards initially
- [ ] **Empty State:** If no bookings, should show "No active bookings" message
- [ ] **Active/History Tabs:** Switch between tabs
- [ ] **Pull-to-Refresh:** Pull down to refresh the list
- [ ] **Filter Button:** Tap filter icon (top-right) to open filter modal
- [ ] **Sort Options:** Try sorting by date, price, status
- [ ] **Status Filter:** Filter by specific status (on Active tab)

#### Expected Behavior:
- Fast loading with skeleton UI
- Smooth tab switching
- Pull-to-refresh shows loading indicator
- Filters apply immediately
- No mock data - should show real Supabase data or empty state

---

### 2. **Booking Details Screen** (`booking/[id]`)

#### How to Access:
1. Tap on any booking card from the list

#### What to Test:
- [ ] **Booking Info:** All details display correctly
- [ ] **Status Banner:** Shows current booking status with color
- [ ] **Barber Info:** Name, avatar, rating display
- [ ] **Services List:** All booked services with prices
- [ ] **Schedule:** Date and time display
- [ ] **Location:** Address or barbershop location
- [ ] **Total Price:** Calculated correctly
- [ ] **Action Buttons:** Cancel button (for pending bookings)

#### Expected Behavior:
- Details load quickly
- All data comes from Supabase
- Auto-refreshes every 30 seconds
- Cancel button works with confirmation

---

### 3. **Address Management** (`profile/addresses`)

#### How to Access:
1. From Home screen, tap **Profile** icon (far right tab)
2. Navigate to **My Addresses** (if available in profile)
3. OR directly navigate to `/profile/addresses`

#### What to Test:
- [ ] **Address List:** Shows all saved addresses
- [ ] **Empty State:** Shows "No Addresses" if none exist
- [ ] **Add Button:** Tap "+" icon (top-right)
- [ ] **Add Form:**
  - Fill in address details
  - Set as default checkbox
  - Save button
- [ ] **Edit Address:** Tap "Edit" on existing address
- [ ] **Delete Address:** Tap "Delete" with confirmation
- [ ] **Set Default:** Mark address as default

#### Expected Behavior:
- Addresses load from Supabase
- Add/edit forms validate required fields
- Default badge appears on default address
- Changes save immediately
- Confirmation before delete

---

## 🔍 What to Look For

### ✅ Good Signs:
- Skeleton loading states appear first
- Data loads from Supabase (check console logs)
- Pull-to-refresh works smoothly
- Filters apply immediately
- Empty states show helpful messages
- No crashes or errors

### ⚠️ Expected Warnings (Safe to Ignore):
- Routes with `.new` suffix warnings
- Cloudinary not configured warning
- Mapbox temporarily disabled warning
- Missing welcome/forgot-password routes

### 🚨 Issues to Report:
- App crashes
- Data doesn't load from Supabase
- Errors in console (red ERROR messages)
- UI elements not responding
- Forms don't save
- Pull-to-refresh doesn't work

---

## 📊 Console Logs to Check

Look for these in your terminal:

### Successful Connection:
```
LOG  🌍 Environment: development
LOG  🔑 Supabase URL: https://uufiyurcsldecspakneg.supabase.co
LOG  ✅ Fetched X bookings for customer
```

### Booking Fetch:
```
LOG  ✅ Fetched 3 bookings for customer
```

### Address Operations:
```
LOG  ✅ Address added successfully
LOG  ✅ Fetched 2 addresses
```

---

## 🐛 If You See Errors

### No Bookings Display:
1. **Check Database:** Make sure the migration `005_customer_booking_functions.sql` is applied
2. **Check User:** Ensure you're logged in with a valid user ID
3. **Console:** Look for error messages in terminal

### Data Not Loading:
1. **Check Supabase:** Verify Supabase URL and key in `.env`
2. **Check Network:** Ensure internet connection
3. **Check Console:** Look for API error messages

### App Crashes:
1. **Clear Cache:** Press `Shift + R` to reload
2. **Restart:** Stop and restart the dev server
3. **Check Logs:** Look for specific error messages

---

## 📝 Testing Scenarios

### Scenario 1: New User (No Data)
1. Login with new account
2. Go to Bookings tab
3. **Expected:** Empty state with "Book a barber" button
4. Go to Addresses
5. **Expected:** Empty state with "Add Address" button

### Scenario 2: User with Bookings
1. Login with account that has bookings
2. **Expected:** See list of bookings
3. Pull to refresh
4. **Expected:** Loading indicator, then updated list
5. Tap a booking
6. **Expected:** Detailed view loads

### Scenario 3: Adding Address
1. Go to Addresses screen
2. Tap "Add" button
3. Fill in form:
   - Label: "Home"
   - Address Line 1: "123 Main St"
   - City: "Kuala Lumpur"
   - State: "WP"
4. Tap "Save"
5. **Expected:** Address appears in list

### Scenario 4: Pull-to-Refresh
1. Go to Bookings screen
2. Pull down the list
3. **Expected:** Green loading spinner
4. **Expected:** List refreshes with latest data

---

## 🎉 Success Criteria

The integration is successful if:

✅ App runs without crashes  
✅ Bookings load from Supabase  
✅ Skeleton loading states appear  
✅ Pull-to-refresh works  
✅ Filters apply correctly  
✅ Booking details load  
✅ Address management works  
✅ All CRUD operations succeed  
✅ No red ERROR messages (warnings OK)  

---

## 📸 Screenshots to Take

If reporting issues, please capture:

1. **Bookings List** - Full screen
2. **Booking Details** - Scrolled to show all info
3. **Address Management** - List and add form
4. **Console Logs** - Terminal output with errors
5. **Empty States** - No data screens

---

## 🚀 Next Steps After Testing

Once testing is complete:

1. ✅ **Fix any bugs found**
2. ⚠️ **Apply database migration** (if not done)
3. 🎨 **Test with real data** (seed database)
4. 🔧 **Wire up booking creation** (next feature)
5. 📝 **Create test user accounts**

---

## 💡 Pro Tips

- **Use iOS Simulator:** Easier to test than physical device
- **Check Console:** Keep terminal visible for logs
- **Reload Often:** Press `R` to reload app if needed
- **Clear Metro Cache:** If weird issues, restart with `npm run customer`
- **Check Supabase Dashboard:** Verify data in database tables

---

## 📞 Need Help?

If you encounter issues:

1. Check the console logs for specific errors
2. Verify Supabase connection in `.env`
3. Ensure migration is applied
4. Check network connectivity
5. Try restarting the dev server

---

**Happy Testing! 🎉**

The real backend integration is now live and ready for your testing!
