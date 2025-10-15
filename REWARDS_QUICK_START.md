# 🎉 Rewards System - Quick Start Guide

## What Was Implemented

✅ **Automatic Points Earning**: Customers earn 10 points per RM spent when bookings are completed  
✅ **Voucher Usage at Checkout**: Apply redeemed vouchers to bookings for instant discounts  
✅ **Full Backend Integration**: All operations secured via Supabase database functions

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Apply Database Migrations

```bash
# Navigate to your Supabase project
# Apply these 3 migrations in order:

1. supabase/migrations/010_rewards_system.sql
2. supabase/migrations/011_rewards_seed_data.sql
3. supabase/migrations/012_booking_vouchers_and_auto_points.sql
```

**Via Supabase Dashboard:**
1. Open your project: https://supabase.com/dashboard
2. Go to **SQL Editor**
3. Copy & paste each migration file
4. Click **Run** for each one

### Step 2: Verify Setup

Check these tables exist:
- ✅ `vouchers` (should have 4 seed vouchers)
- ✅ `user_vouchers`
- ✅ `points_transactions`
- ✅ `booking_vouchers`
- ✅ `profiles.points_balance` column

Check these functions exist:
- ✅ `award_points()`
- ✅ `redeem_voucher()`
- ✅ `apply_voucher_to_booking()`
- ✅ `award_points_on_completion()`

### Step 3: Test It!

Follow the testing guide: `docs/testing/REWARDS_SYSTEM_TESTING.md`

---

## 📱 User Flow

### 1. Earning Points
```
Customer books service (RM 30)
    ↓
Service completed
    ↓
🎉 +300 points automatically awarded!
```

### 2. Redeeming Vouchers
```
Customer has 300 points
    ↓
Redeems "RM 5 OFF" voucher (100 pts)
    ↓
Points: 300 → 200
    ↓
Voucher appears in "My Vouchers"
```

### 3. Using Vouchers
```
Customer books service (RM 20)
    ↓
Selects voucher at payment
    ↓
Discount: RM 20 → RM 15
    ↓
Voucher marked as used
```

---

## 🧪 Quick Test

### Test 1: Award Points Manually (Optional)
```sql
-- Give yourself 500 test points
SELECT award_points(
  'YOUR_USER_ID'::uuid,
  500,
  'admin_adjustment',
  '{"reason": "testing"}'::jsonb
);
```

### Test 2: Check Points Balance
```sql
SELECT id, full_name, points_balance 
FROM profiles 
WHERE id = 'YOUR_USER_ID';
```

### Test 3: Redeem a Voucher
1. Open customer app
2. Go to **Rewards** tab
3. Tap **Redeem** on any voucher
4. Verify points decrease
5. Check "My Vouchers" tab

### Test 4: Use Voucher on Booking
1. Create a new booking
2. At payment screen, tap "Select Voucher"
3. Choose your voucher
4. Verify discount applied
5. Complete booking
6. Check voucher status changed to "Used"

---

## 📂 Files Changed

### Backend
- ✅ `supabase/migrations/012_booking_vouchers_and_auto_points.sql` (NEW)

### Frontend
- ✅ `apps/customer/services/rewardsService.ts` (UPDATED)
- ✅ `apps/customer/app/payment-method.tsx` (UPDATED)

### Documentation
- ✅ `docs/testing/REWARDS_SYSTEM_TESTING.md` (NEW)
- ✅ `docs/implementation/REWARDS_SYSTEM_COMPLETE.md` (NEW)

---

## 🔍 How It Works

### Points Earning (Automatic)
When a booking status changes to `completed`, a database trigger fires:
```sql
trigger_award_points_on_completion
    ↓
award_points_on_completion() function
    ↓
award_points() function
    ↓
Points added to profile + transaction logged
```

### Voucher Usage (Manual)
When user applies voucher at checkout:
```typescript
rewardsService.applyVoucherToBooking()
    ↓
apply_voucher_to_booking() RPC call
    ↓
1. Mark voucher as used
2. Create booking_voucher record
3. Update booking discount_amount
```

---

## 🐛 Troubleshooting

### Points not awarded?
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger 
WHERE tgname = 'trigger_award_points_on_completion';

-- Check Supabase logs
-- Go to Dashboard → Logs → Database
```

### Vouchers not showing?
1. Check user is authenticated
2. Verify user has redeemed vouchers
3. Check voucher status is 'active'
4. Check voucher not expired

### Database errors?
1. Verify all 3 migrations applied
2. Check function permissions granted
3. Review RLS policies
4. Check Supabase logs for details

---

## 📊 Monitoring

### SQL Queries to Check System Health

```sql
-- Total points awarded
SELECT SUM(amount) 
FROM points_transactions 
WHERE type = 'earn';

-- Vouchers redeemed today
SELECT COUNT(*) 
FROM user_vouchers 
WHERE DATE(redeemed_at) = CURRENT_DATE;

-- Active vouchers per user
SELECT 
  user_id,
  COUNT(*) as active_vouchers
FROM user_vouchers
WHERE status = 'active'
GROUP BY user_id;

-- Total discounts given
SELECT SUM(discount_applied) 
FROM booking_vouchers;
```

---

## ✅ Success Criteria

Your system is working when:

- [x] Completing a booking automatically awards points
- [x] Points calculation is correct (10 pts per RM)
- [x] Vouchers can be redeemed with points
- [x] Vouchers appear in payment screen
- [x] Discounts apply correctly
- [x] Vouchers marked as used after application
- [x] All database records are consistent
- [x] No errors in Supabase logs

---

## 📖 Full Documentation

- **Implementation Details**: `docs/implementation/REWARDS_SYSTEM_COMPLETE.md`
- **Comprehensive Testing Guide**: `docs/testing/REWARDS_SYSTEM_TESTING.md`
- **Previous Features**: `docs/features/POINTS_ON_COMPLETION.md`

---

## 🎯 What's Next?

After successful testing:

1. **Deploy to Production**
   - Apply migrations on production database
   - Monitor Supabase logs
   - Test with real users

2. **Monitor Metrics**
   - Track points awarded
   - Monitor voucher redemption rates
   - Calculate discount ROI

3. **Gather Feedback**
   - User satisfaction
   - Feature requests
   - Bug reports

4. **Future Enhancements**
   - Voucher stacking
   - Referral rewards
   - Tiered membership
   - Push notifications

---

## 🆘 Need Help?

1. **Check logs**: Supabase Dashboard → Logs
2. **Review docs**: See full documentation files
3. **Test SQL**: Use queries from testing guide
4. **Debug**: Check RLS policies and function permissions

---

## 🎊 Summary

You now have a complete, production-ready rewards system:

✅ **Backend**: Secure database functions and triggers  
✅ **Frontend**: Real-time voucher selection and discounts  
✅ **Testing**: Comprehensive testing guide included  
✅ **Documentation**: Full implementation details documented  

**Ready to launch! 🚀**
