# Rewards System Testing Guide

## Overview
This guide covers end-to-end testing of the complete rewards system including:
1. **Points Earning**: Automatic points awarded on booking completion
2. **Voucher Redemption**: Redeeming vouchers with points
3. **Voucher Usage**: Applying vouchers to bookings for discounts

---

## Prerequisites

### 1. Apply Database Migrations
```bash
# Navigate to project root
cd /Users/bos/Desktop/ProjectSideIncome/mari-gunting

# Apply the rewards system migrations (if not done already)
# You can apply these via Supabase Dashboard or CLI:
# - 010_rewards_system.sql
# - 011_rewards_seed_data.sql
# - 012_booking_vouchers_and_auto_points.sql
```

### 2. Verify Database Setup
Check in Supabase Dashboard that these tables exist:
- ✅ `vouchers`
- ✅ `user_vouchers`
- ✅ `points_transactions`
- ✅ `booking_vouchers`
- ✅ `profiles` (with `points_balance` column)
- ✅ `bookings` (with `discount_amount` column)

### 3. Verify Functions/Triggers
Check that these exist in Supabase:
- ✅ Function: `award_points()`
- ✅ Function: `redeem_voucher()`
- ✅ Function: `use_voucher()`
- ✅ Function: `apply_voucher_to_booking()`
- ✅ Function: `award_points_on_completion()`
- ✅ Trigger: `trigger_award_points_on_completion` on `bookings` table

---

## Test Scenario 1: Points Earning on Booking Completion

### Objective
Verify that points are automatically awarded when a booking is marked as completed.

### Steps

#### 1. Note Starting Points
1. Open the customer app
2. Go to **Rewards** tab
3. Note your current points balance (e.g., 0 pts)
4. Take a screenshot

#### 2. Create a Booking
1. Go to **Home** tab
2. Select any barber
3. Select a service (e.g., "Classic Haircut - RM 30")
4. Complete the booking flow:
   - Select address
   - Choose payment method (Cash is easiest for testing)
   - Confirm booking
5. Note the **service price** (subtotal) - this is what earns points
   - Example: RM 30 service = 300 points (10 points per RM)

#### 3. Verify No Points Yet
1. Go to **Rewards** tab
2. Points should still be **unchanged** (0 pts)
3. Go to **Activity** tab in Rewards
4. Should see **no new entry** for this booking yet

✅ **Expected**: No points awarded at payment time

#### 4. Complete the Booking

**Option A: Via Supabase Dashboard (Recommended for Testing)**
1. Open Supabase Dashboard
2. Go to **Table Editor** → `bookings`
3. Find your booking (sort by `created_at` desc)
4. Edit the row
5. Change `status` from `pending` to `completed`
6. Save

**Option B: Via SQL**
```sql
-- Replace with your booking ID
UPDATE bookings 
SET status = 'completed', completed_at = NOW() 
WHERE id = 'YOUR_BOOKING_ID';
```

#### 5. Verify Points Awarded
1. Go back to customer app
2. Go to **Rewards** tab
3. Pull to refresh
4. **Points should increase!** (0 → 300 for RM 30 booking)
5. Tap **Activity** tab
6. Should see new entry:
   ```
   +300 pts
   Earned from booking completion
   [Today's date]
   ```

✅ **Expected Results:**
- Points balance increased by (service_price × 10)
- Activity log shows new transaction
- Transaction type: `earn`
- Description mentions booking completion

#### 6. Verify Database Records
Check in Supabase Dashboard:

**profiles table:**
```sql
SELECT id, full_name, points_balance 
FROM profiles 
WHERE id = 'YOUR_USER_ID';
```
- `points_balance` should match app display

**points_transactions table:**
```sql
SELECT * 
FROM points_transactions 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC 
LIMIT 5;
```
Should show:
- `type`: `earn`
- `amount`: 300 (for RM 30 booking)
- `description`: Something about booking completion
- `booking_id`: Matches your booking
- `balance_after`: Your new balance

---

## Test Scenario 2: Voucher Redemption

### Objective
Redeem a voucher using points from the Rewards screen.

### Steps

#### 1. Check Available Vouchers
1. Open customer app
2. Go to **Rewards** tab
3. Scroll to "Available Vouchers" section
4. Should see vouchers from seed data:
   - RM 5 OFF (100 pts)
   - RM 10 OFF (180 pts)
   - 20% OFF (250 pts)
   - RM 30 OFF (500 pts)

#### 2. Select a Voucher to Redeem
1. Choose a voucher you have enough points for
   - If you have 300 pts from Test 1, choose RM 5 OFF (100 pts)
2. Tap "Redeem" button
3. Confirm in the modal

#### 3. Verify Redemption
1. **Points should decrease** (300 → 200)
2. Voucher should move to "My Vouchers" section
3. Tap "My Vouchers" tab
4. Should see your redeemed voucher:
   - Status: Available
   - Shows expiry date
   - "Use Now" button active

#### 4. Check Activity Log
1. Tap "Activity" tab
2. Should see new entry:
   ```
   -100 pts
   Redeemed: RM 5 OFF voucher
   [Today's date]
   ```

✅ **Expected Results:**
- Points deducted correctly
- Voucher appears in "My Vouchers"
- Activity log updated
- Voucher status is "active"

#### 5. Verify Database
**user_vouchers table:**
```sql
SELECT * 
FROM user_vouchers 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY redeemed_at DESC;
```
Should show:
- `voucher_id`: Links to vouchers table
- `status`: `active`
- `redeemed_at`: Current timestamp
- `points_spent`: 100

**points_transactions table:**
```sql
SELECT * 
FROM points_transactions 
WHERE user_id = 'YOUR_USER_ID' 
AND type = 'redeem'
ORDER BY created_at DESC;
```
Should show:
- `type`: `redeem`
- `amount`: -100
- `user_voucher_id`: Links to user_vouchers record

---

## Test Scenario 3: Voucher Usage on Booking

### Objective
Apply a redeemed voucher to a booking to get a discount.

### Steps

#### 1. Start a New Booking
1. Go to **Home** tab
2. Select any barber
3. Select a service (e.g., "Beard Trim - RM 20")
4. Continue to payment screen

#### 2. Select Voucher
1. On payment screen, look for voucher section
2. Should see button: "Select Voucher" with badge showing "1" available
3. Tap "Select Voucher"
4. Modal opens showing your redeemed vouchers
5. Select the voucher (e.g., "RM 5 OFF")
6. Modal closes

#### 3. Verify Discount Applied
Payment breakdown should update:
```
Subtotal:          RM 20.00
Travel Cost:       RM  5.00
Platform Fee:      RM  2.00
━━━━━━━━━━━━━━━━━━━━━━━━━
Voucher Discount: -RM  5.00
━━━━━━━━━━━━━━━━━━━━━━━━━
Total:             RM 22.00
```

You save RM 5.00! 🎉

#### 4. Complete the Booking
1. Select payment method (Cash)
2. Tap "Continue"
3. Confirm
4. Booking created successfully

#### 5. Verify Voucher Marked as Used
1. Go to **Rewards** tab
2. Tap "My Vouchers"
3. Voucher should now show:
   - Status: Used
   - Gray appearance
   - Shows booking it was used for

#### 6. Verify Database Records

**user_vouchers table:**
```sql
SELECT * 
FROM user_vouchers 
WHERE id = 'YOUR_USER_VOUCHER_ID';
```
Should show:
- `status`: `used`
- `used_at`: Current timestamp
- `booking_id`: Your booking ID

**booking_vouchers table:**
```sql
SELECT * 
FROM booking_vouchers 
WHERE booking_id = 'YOUR_BOOKING_ID';
```
Should show:
- `user_voucher_id`: Links to user_vouchers
- `voucher_code`: The voucher code
- `original_total`: 27.00
- `discount_applied`: 5.00
- `final_total`: 22.00

**bookings table:**
```sql
SELECT id, subtotal, discount_amount, total_price 
FROM bookings 
WHERE id = 'YOUR_BOOKING_ID';
```
Should show:
- `discount_amount`: 5.00
- `total_price`: Should reflect the discount

✅ **Expected Results:**
- Discount applied correctly
- Voucher marked as used
- booking_vouchers record created
- Can't reuse the same voucher

---

## Test Scenario 4: Complete Rewards Loop

### Objective
Test the full rewards lifecycle: earn → redeem → use → earn again.

### Steps

1. **Complete the booking from Scenario 3**
   - Update booking status to `completed` in Supabase
   - Service was RM 20 → Earns 200 points

2. **Verify Points Awarded**
   - Points increase (e.g., 200 → 400)
   - Activity log shows "+200 pts" from booking

3. **Redeem Another Voucher**
   - Use the 400 points to redeem another voucher
   - Points decrease (e.g., 400 → 220 after redeeming 180pt voucher)

4. **Use New Voucher on Next Booking**
   - Create another booking
   - Apply the newly redeemed voucher
   - Complete booking
   - Earn points again

5. **Check Total Points History**
   - Should see full transaction history:
     - +300 (first booking)
     - -100 (voucher redemption)
     - +200 (second booking)
     - -180 (second voucher redemption)
   - Final balance should match calculations

---

## Edge Cases to Test

### 1. Expired Voucher
```sql
-- Manually expire a voucher for testing
UPDATE vouchers 
SET valid_until = NOW() - INTERVAL '1 day' 
WHERE code = 'SAVE5';
```
- Try to redeem → Should fail with error
- Check app shows voucher as expired

### 2. Insufficient Points
- Try to redeem a voucher that costs more points than you have
- Should see error: "You don't have enough points"

### 3. Minimum Spend Not Met
- Try to apply RM 30 OFF voucher to a RM 20 booking
- Voucher should be grayed out or not show as option
- Check minimum spend requirement is enforced

### 4. Already Used Voucher
- Try to use a voucher that's already marked as used
- Should not appear in "Select Voucher" modal
- Only show active vouchers

### 5. Cancelled Booking (No Points)
1. Create a booking
2. Cancel it before completion
3. Verify NO points awarded
4. Only completed bookings earn points

---

## Verification Checklist

### Points System
- [ ] Points awarded on booking completion
- [ ] Correct calculation (10 pts per RM)
- [ ] Only subtotal counts (not fees)
- [ ] No points for cancelled bookings
- [ ] Points persist after app restart
- [ ] Activity log correct
- [ ] Database transactions recorded

### Voucher Redemption
- [ ] Can redeem with sufficient points
- [ ] Points deducted correctly
- [ ] Voucher appears in My Vouchers
- [ ] Status changes to 'active'
- [ ] Activity log updated
- [ ] Cannot redeem twice
- [ ] Cannot redeem with insufficient points

### Voucher Usage
- [ ] Vouchers load in payment screen
- [ ] Only active vouchers shown
- [ ] Discount calculates correctly
- [ ] Minimum spend enforced
- [ ] Voucher applied to booking
- [ ] Status changes to 'used'
- [ ] booking_vouchers record created
- [ ] Cannot reuse voucher

### Database Integrity
- [ ] All tables have correct records
- [ ] Foreign keys maintained
- [ ] RLS policies working
- [ ] Triggers firing correctly
- [ ] No orphaned records

---

## Common Issues & Solutions

### Issue: Points not awarded on completion
**Check:**
1. Booking status actually changed to 'completed'?
2. Trigger exists and is enabled?
3. Check Supabase logs for errors
4. Verify `award_points()` function exists

### Issue: Vouchers not showing in payment screen
**Check:**
1. User is authenticated?
2. Vouchers have status 'active'?
3. Vouchers not expired?
4. RLS policies allow user to read own vouchers?

### Issue: Discount not applied
**Check:**
1. Subtotal meets minimum spend?
2. Voucher status is 'active'?
3. Voucher not already used?
4. Check `apply_voucher_to_booking` function

### Issue: Database errors
**Check:**
1. All migrations applied in order?
2. Function permissions granted?
3. RLS policies not too restrictive?
4. Check Supabase logs for detailed error

---

## SQL Queries for Testing

### Check User's Points and Vouchers
```sql
-- User profile with points
SELECT 
  id,
  full_name,
  points_balance
FROM profiles 
WHERE id = 'YOUR_USER_ID';

-- User's vouchers
SELECT 
  uv.*,
  v.title,
  v.code,
  v.type,
  v.value
FROM user_vouchers uv
JOIN vouchers v ON uv.voucher_id = v.id
WHERE uv.user_id = 'YOUR_USER_ID'
ORDER BY uv.redeemed_at DESC;

-- Points transactions
SELECT 
  type,
  amount,
  balance_after,
  description,
  created_at
FROM points_transactions
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 10;
```

### Check Booking with Voucher
```sql
-- Booking details
SELECT 
  b.id,
  b.booking_number,
  b.status,
  b.subtotal,
  b.discount_amount,
  b.total_price,
  bv.voucher_code,
  bv.discount_applied,
  uv.status as voucher_status
FROM bookings b
LEFT JOIN booking_vouchers bv ON b.id = bv.booking_id
LEFT JOIN user_vouchers uv ON bv.user_voucher_id = uv.id
WHERE b.id = 'YOUR_BOOKING_ID';
```

### Manually Award Points (for testing)
```sql
-- Award 500 test points
SELECT award_points(
  'YOUR_USER_ID'::uuid,
  500,
  'admin_adjustment',
  '{"reason": "testing"}'::jsonb
);
```

---

## Success Criteria

All tests pass when:

✅ **Points Earning:**
- Automatic on completion
- Correct calculations
- Proper logging

✅ **Voucher System:**
- Redemption works
- Usage tracked correctly
- Discounts applied properly

✅ **User Experience:**
- Smooth flow
- Clear feedback
- No errors

✅ **Data Integrity:**
- All database records correct
- No orphaned data
- RLS secure

---

## Next Steps After Testing

1. **Remove Test Data**
   ```sql
   -- Clean up test transactions if needed
   DELETE FROM points_transactions WHERE description LIKE '%testing%';
   DELETE FROM booking_vouchers WHERE customer_id = 'TEST_USER_ID';
   ```

2. **Production Deployment**
   - Ensure all migrations run on production
   - Test with real user accounts
   - Monitor Supabase logs
   - Set up error alerting

3. **Analytics**
   - Track voucher redemption rates
   - Monitor points earning patterns
   - Measure discount usage
   - Calculate ROI of rewards program

---

## Support

If you encounter issues during testing:
1. Check Supabase logs for detailed errors
2. Verify all migrations applied successfully
3. Review RLS policies for permission issues
4. Check function execution permissions
5. Ensure all related tables exist

Happy Testing! 🎉
