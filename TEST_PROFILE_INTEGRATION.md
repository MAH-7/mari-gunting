# Testing Profile Screen Real Data Integration

## Prerequisites
1. Supabase project is running and accessible
2. User is logged in as a barber
3. User has a profile in the `profiles` table
4. User has a barber record in the `barbers` table

## Test Cases

### Test 1: Profile Loading
**Steps:**
1. Open the partner app
2. Log in as a barber user
3. Navigate to the Profile tab

**Expected:**
- Loading spinner appears briefly
- Profile data loads from Supabase
- Name, rating, reviews, and other data display correctly
- Avatar shows (or shows initial letter if no avatar)
- Online/Offline status displays correctly

**Verify:**
- Console logs show: `[Profile] Fetching profile for user: {userId}`
- Console logs show: `[barberService] Successfully fetched barber profile`
- No error alerts appear

---

### Test 2: Online Status Toggle
**Steps:**
1. From the Profile screen, toggle the Online/Offline switch
2. Wait for the confirmation alert
3. Check the database

**Expected:**
- Switch changes immediately (optimistic update)
- Alert shows "Going Online" or "Going Offline"
- Database `profiles` table updates:
  - `is_online` changes to true/false
  - `last_seen_at` updates to current timestamp

**Verify:**
- Console logs show: `[barberService] Error updating online status:` should NOT appear
- If toggle fails, switch reverts to previous state
- Error alert shows only if update fails

---

### Test 3: Error Handling - No User
**Steps:**
1. Clear the user session (logout)
2. Try to access the Profile tab

**Expected:**
- Loading spinner appears
- Error state displays with warning icon
- Error message: "Failed to load profile"
- Retry button is visible

**Verify:**
- Console logs show: `[Profile] No current user found`
- No crash occurs

---

### Test 4: Error Handling - No Barber Record
**Steps:**
1. Log in as a user who doesn't have a barber record
2. Navigate to the Profile tab

**Expected:**
- Loading spinner appears
- Error state displays
- Alert shows: "Failed to load profile data"
- Retry button is visible

**Verify:**
- Console logs show: `[barberService] Barber record not found`
- User can tap Retry to attempt loading again

---

### Test 5: Menu Navigation
**Steps:**
1. From the Profile screen, tap on various menu items
2. Try:
   - Edit Profile
   - Manage Services & Pricing
   - Portfolio Management
   - Other menu items

**Expected:**
- Navigation works correctly
- No crashes occur
- Profile data persists when returning to Profile tab

---

### Test 6: Stats Display
**Steps:**
1. Load the Profile screen
2. Check the "This Week" stats card

**Expected:**
- Earnings display (currently mock: "RM 1,240")
- Jobs count display (currently mock: 12)
- Rating display (currently mock: 4.9)

**Note:** Stats are currently mock data. Once implemented, verify real stats load from database.

---

### Test 7: Profile Badges
**Steps:**
1. Check the menu items for badges
2. Verify:
   - Verification badge shows "Verified" or "Pending"
   - Portfolio badge shows photo count
   - Rating badge shows rating value

**Expected:**
- Verification badge color:
  - Green (#4CAF50) if verified
  - Orange (#FF9800) if pending
- Portfolio badge shows correct photo count (or 0 if none)
- Rating badge shows rating with 1 decimal place

---

### Test 8: Logout
**Steps:**
1. Scroll to bottom of Profile screen
2. Tap "Logout" button
3. Confirm logout in the alert

**Expected:**
- Alert appears asking for confirmation
- On confirm:
  - User state clears
  - Local storage clears
  - Navigation redirects to login screen

**Verify:**
- Console logs show no errors
- User can log back in successfully

---

## Database Verification Queries

### Check Profile Data
```sql
SELECT 
  id,
  full_name,
  phone_number,
  avatar_url,
  is_online,
  last_seen_at
FROM profiles
WHERE id = '{userId}';
```

### Check Barber Data
```sql
SELECT 
  id,
  user_id,
  bio,
  rating,
  total_reviews,
  completed_bookings,
  experience_years,
  specializations,
  portfolio_images,
  is_verified,
  is_available,
  verification_status
FROM barbers
WHERE user_id = '{userId}';
```

### Check Online Status Update
```sql
-- Run before toggle
SELECT is_online, last_seen_at FROM profiles WHERE id = '{userId}';

-- Toggle online status in app

-- Run after toggle
SELECT is_online, last_seen_at FROM profiles WHERE id = '{userId}';
-- Verify is_online changed and last_seen_at is recent
```

---

## Console Log Monitoring

### Successful Load
```
[Profile] Fetching profile for user: abc123...
[barberService] Fetching barber profile for user: abc123...
[barberService] Successfully fetched barber profile
```

### Failed Load (No User)
```
[Profile] No current user found
```

### Failed Load (No Barber Record)
```
[Profile] Fetching profile for user: abc123...
[barberService] Fetching barber profile for user: abc123...
[barberService] Barber record not found
[Profile] Failed to fetch barber profile
```

### Online Status Toggle Success
```
[Profile] Error toggling online status: [should NOT appear]
```

### Online Status Toggle Failure
```
[barberService] Error updating online status: [error details]
[Profile] Error toggling online status: [error details]
```

---

## Known Issues to Watch For

1. **Email Display:** Email field shows user ID instead of actual email
   - Email is in auth system, not in profiles table
   - To fix: Fetch from `supabase.auth.getUser()`

2. **Stats are Mock:** Weekly stats are hardcoded
   - Need to implement real stats from bookings/payments tables

3. **No Real-time Updates:** Profile doesn't update automatically
   - Consider adding Supabase subscriptions

4. **Network Errors:** Poor connectivity might cause loading failures
   - Test with slow/offline network

---

## Success Criteria

✅ Profile loads without errors
✅ All fields display correctly
✅ Online toggle works and persists
✅ Error states work correctly
✅ Navigation works
✅ Logout works
✅ No TypeScript errors
✅ No console errors
✅ Database updates correctly

---

## Rollback Plan

If issues occur, revert to mock data:
1. Restore `profile = mockBarbers[0]` on line 38
2. Remove `useEffect` and `loadBarberProfile()`
3. Make `isOnline` and `weekStats` static
4. Remove loading and error states
5. Restore original `handleToggleOnline` (without database call)
