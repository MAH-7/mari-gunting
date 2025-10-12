# 🚀 Apply Migrations Manually (5 Minutes)

**Date**: January 9, 2025  
**Project**: Mari Gunting - Week 5-6 Customer Backend

---

## ⚡ Quick Steps

### 1. Open Supabase Dashboard
Go to: https://supabase.com/dashboard/project/uufiyurcsldecspakneg

### 2. Navigate to SQL Editor
Click: **SQL Editor** in the left sidebar

### 3. Apply Migration 1: Booking Functions

**Click**: "New query" button

**Copy and paste** the entire content from:
```
supabase/migrations/005_customer_booking_functions.sql
```

**Click**: "Run" button (or press `Cmd + Enter`)

**Expected output**: 
- ✅ "Success. No rows returned"
- Functions created: `create_booking`, `get_customer_bookings`, `update_booking_status`, `cancel_booking`, `add_customer_address`, `get_customer_addresses`
- Table created: `customer_addresses`

### 4. Apply Migration 2: Review System

**Click**: "New query" button again

**Copy and paste** the entire content from:
```
supabase/migrations/006_review_system.sql
```

**Click**: "Run" button

**Expected output**:
- ✅ "Success. No rows returned"
- Functions created: `submit_review`, `get_barber_reviews`, `get_barbershop_reviews`, `update_barber_rating`, `get_review_stats`, `respond_to_review`
- Trigger created: `trigger_update_barber_rating`

---

## ✅ Verify Installation

### Check Functions Exist

Run this query in SQL Editor:
```sql
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'create_booking',
    'get_customer_bookings',
    'submit_review',
    'get_barber_reviews'
  )
ORDER BY routine_name;
```

**Expected**: Should return 4 rows showing these functions

### Check Tables Exist

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'customer_addresses';
```

**Expected**: Should return 1 row

---

## 🧪 Test the Functions

### Test 1: Create a Booking

First, get a customer ID and barber ID:
```sql
-- Get a customer user
SELECT id, full_name, role FROM profiles WHERE role = 'customer' LIMIT 1;

-- Get a barber
SELECT b.id, p.full_name 
FROM barbers b 
JOIN profiles p ON b.user_id = p.id 
LIMIT 1;
```

Then create a test booking (replace UUIDs with actual ones):
```sql
SELECT * FROM create_booking(
  'YOUR-CUSTOMER-UUID'::UUID,  -- Replace with actual customer ID
  'YOUR-BARBER-UUID'::UUID,     -- Replace with actual barber ID
  NULL,                         -- barbershop_id (null for freelance)
  '[{"name":"Haircut","price":30,"duration":60}]'::JSONB,
  CURRENT_DATE + INTERVAL '3 days',  -- 3 days from now
  '14:00'::TIME,
  'home_service',
  '{"line1":"123 Test St","city":"Kuala Lumpur"}'::JSONB,
  'Test booking from migration'
);
```

**Expected output**: 
- booking_id (UUID)
- booking_number (e.g., MG20250109001)
- total_price (37.00 = 30 service + 2 fee + 5 travel)
- message: "Booking created successfully"

### Test 2: Get Customer Bookings

```sql
SELECT 
  booking_number,
  status,
  barber_name,
  total_price,
  scheduled_date
FROM get_customer_bookings(
  'YOUR-CUSTOMER-UUID'::UUID,  -- Same customer ID
  NULL,  -- All statuses
  10,    -- Limit
  0      -- Offset
);
```

**Expected**: Should show the booking you just created

### Test 3: Submit a Review (After completing a booking)

First, update a booking to completed:
```sql
UPDATE bookings 
SET status = 'completed', 
    completed_at = NOW()
WHERE booking_number = 'MG20250109001';  -- Your booking number
```

Then submit a review:
```sql
SELECT * FROM submit_review(
  (SELECT id FROM bookings WHERE booking_number = 'MG20250109001'),  -- booking_id
  'YOUR-CUSTOMER-UUID'::UUID,  -- customer_id
  5,                           -- rating (5 stars)
  'Excellent service! Very professional.',
  NULL                         -- no images
);
```

**Expected output**:
- review_id (UUID)
- success: true
- message: "Review submitted successfully"

### Test 4: Check Barber Rating Updated

```sql
SELECT 
  b.id,
  p.full_name,
  b.rating,
  b.total_reviews
FROM barbers b
JOIN profiles p ON b.user_id = p.id
WHERE b.id = 'YOUR-BARBER-UUID'::UUID;
```

**Expected**: 
- rating should now show (e.g., 5.00)
- total_reviews should be 1 or more

---

## 🎉 Success Criteria

Migrations are successfully applied when:

- [x] Both SQL files run without errors
- [x] 10 new functions appear in database
- [x] `customer_addresses` table exists
- [x] Test booking creation works
- [x] Test review submission works
- [x] Barber rating auto-updates

---

## 🐛 Troubleshooting

### Error: "function already exists"
**Solution**: That's okay! It means the function is already there. Just continue.

### Error: "relation does not exist"
**Solution**: Make sure you ran migration 005 before 006, as 006 depends on tables from 001 (initial schema).

### Error: "permission denied"
**Solution**: You need to be logged in as the project owner or have admin access.

### Connection timeout
**Solution**: Check your internet connection and try again. Supabase dashboard doesn't require special network setup.

---

## 📋 Checklist

- [ ] Opened Supabase Dashboard
- [ ] Navigated to SQL Editor
- [ ] Ran `005_customer_booking_functions.sql`
- [ ] Saw "Success" message
- [ ] Ran `006_review_system.sql`
- [ ] Saw "Success" message
- [ ] Verified functions exist (query)
- [ ] Tested booking creation
- [ ] Tested review submission
- [ ] Confirmed rating auto-update works

---

## ✅ Next Steps After Migration

Once migrations are applied:

1. **Update Customer app** to call these functions
2. **Set up Stripe** for payments
3. **Add real-time subscriptions** for booking updates
4. **Test end-to-end** booking flow

See: `WEEK_5-6_CUSTOMER_BACKEND.md` for implementation details

---

**Need Help?** 
- Supabase Docs: https://supabase.com/docs/guides/database/functions
- Check SQL Editor for any error messages
- Verify your project is not paused in Supabase Dashboard

**Estimated Time**: 5-10 minutes to apply + test
