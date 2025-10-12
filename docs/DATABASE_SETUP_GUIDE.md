# Database Setup Guide - Mari-Gunting

## 🎯 Quick Start (30 Minutes)

This guide will help you apply all database migrations and populate test data in your Supabase project.

---

## 📋 Prerequisites

- ✅ Supabase account created
- ✅ Mari-Gunting project created in Supabase
- ✅ Access to Supabase Dashboard

---

## 🚀 Step-by-Step Instructions

### **Step 1: Open Supabase Dashboard** (1 min)

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your **Mari-Gunting** project

### **Step 2: Navigate to SQL Editor** (30 sec)

1. In the left sidebar, click on **"SQL Editor"**
2. You'll see an empty SQL editor

---

### **Step 3: Apply Migrations** (15 mins)

You need to run **6 migration files** in order. Copy and paste each file's content into the SQL Editor and click "Run".

#### **Migration 1: Initial Schema** ⭐

**File:** `supabase/migrations/001_initial_schema.sql`

**What it does:**
- Creates all main tables (profiles, barbers, barbershops, services, bookings, etc.)
- Sets up ENUMS for status types
- Creates indexes for performance
- Adds triggers for auto-updates

**How to apply:**
1. Open the file in your code editor
2. Copy **ALL** the content (lines 1-679)
3. Paste into Supabase SQL Editor
4. Click **"Run"** (bottom right)
5. Wait for "Success" message (should take 5-10 seconds)

**Expected result:**
```
Success. No rows returned
```

---

#### **Migration 2: RLS Policies** 🔐

**File:** `supabase/migrations/002_rls_policies.sql`

**What it does:**
- Enables Row Level Security on all tables
- Creates security policies for data access
- Ensures customers can only see their own bookings

**How to apply:**
1. Copy content from `002_rls_policies.sql`
2. Paste into SQL Editor
3. Click **"Run"**

**Expected result:**
```
Success. No rows returned
```

---

#### **Migration 3: Storage Buckets** 📦

**File:** Choose ONE of these:
- `supabase/migrations/003_storage_buckets.sql` (full version)
- `supabase/migrations/003_storage_policies_only.sql` (policies only)

**What it does:**
- Creates storage buckets for images (avatars, portfolios, etc.)
- Sets up storage security policies

**How to apply:**
1. Use `003_storage_buckets.sql` if you haven't created buckets manually
2. Or use `003_storage_policies_only.sql` if buckets exist
3. Copy, paste, and **"Run"**

**Expected result:**
```
Success. No rows returned
```

---

#### **Migration 4: Database Functions** ⚙️

**File:** `supabase/migrations/004_database_functions.sql`

**What it does:**
- Creates utility functions for the database
- Helper functions for queries

**How to apply:**
1. Copy content from `004_database_functions.sql`
2. Paste into SQL Editor
3. Click **"Run"**

**Expected result:**
```
Success. No rows returned
```

---

#### **Migration 5: Customer Booking Functions** 🔥 **CRITICAL**

**File:** `supabase/migrations/005_customer_booking_functions.sql`

**What it does:**
- Creates `create_booking()` function
- Creates `get_customer_bookings()` function
- Creates `cancel_booking()` function
- Creates `customer_addresses` table
- Sets up address management functions

**This is THE MOST IMPORTANT migration** - your app won't work without it!

**How to apply:**
1. Copy content from `005_customer_booking_functions.sql`
2. Paste into SQL Editor
3. Click **"Run"**

**Expected result:**
```
Success. No rows returned
```

**Verify it worked:**
Run this query to check if functions exist:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('create_booking', 'get_customer_bookings', 'cancel_booking')
ORDER BY routine_name;
```

You should see all 3 functions listed.

---

#### **Migration 6: Review System** ⭐

**File:** `supabase/migrations/006_review_system.sql`

**What it does:**
- Enhances review system
- Adds review moderation features

**How to apply:**
1. Copy content from `006_review_system.sql`
2. Paste into SQL Editor
3. Click **"Run"**

**Expected result:**
```
Success. No rows returned
```

---

### **Step 4: Populate Test Data** (5 mins) 🎉

**File:** `supabase/migrations/999_test_data.sql`

**What it does:**
- Creates 4 test customers
- Creates 5 test barbers
- Creates 2 test barbershops
- Creates 25+ test services
- Creates 7 test bookings (past, upcoming, cancelled)
- Creates 3 test reviews
- Creates customer addresses
- Creates promo codes
- Creates sample notifications

**IMPORTANT:** This creates test users with predefined UUIDs. In production, you'll use real auth users.

**How to apply:**
1. Copy **ALL** content from `999_test_data.sql`
2. Paste into SQL Editor
3. Click **"Run"**
4. Wait 10-15 seconds

**Expected result:**
```
Success. No rows returned
```

---

### **Step 5: Verify Everything Works** (5 mins) ✅

Run these verification queries to make sure data was inserted correctly:

#### **Check Table Counts:**

```sql
SELECT 'Profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'Barbers', COUNT(*) FROM barbers
UNION ALL
SELECT 'Barbershops', COUNT(*) FROM barbershops
UNION ALL
SELECT 'Services', COUNT(*) FROM services
UNION ALL
SELECT 'Bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'Customer Addresses', COUNT(*) FROM customer_addresses
UNION ALL
SELECT 'Reviews', COUNT(*) FROM reviews
UNION ALL
SELECT 'Favorites', COUNT(*) FROM favorites
UNION ALL
SELECT 'Promo Codes', COUNT(*) FROM promo_codes
UNION ALL
SELECT 'Notifications', COUNT(*) FROM notifications;
```

**Expected output:**
```
Profiles           → 11 rows
Barbers            → 5 rows
Barbershops        → 2 rows
Services           → 20+ rows
Bookings           → 7 rows
Customer Addresses → 4 rows
Reviews            → 3 rows
Favorites          → 4 rows
Promo Codes        → 3 rows
Notifications      → 3 rows
```

---

#### **Test Booking Function:**

```sql
SELECT * FROM get_customer_bookings(
  '00000000-0000-0000-0000-000000000001'::UUID,
  NULL,
  20,
  0
);
```

**Expected:** Should return 5 bookings for Ahmad Fauzi (completed, upcoming, cancelled)

---

#### **Test Address Function:**

```sql
SELECT * FROM get_customer_addresses(
  '00000000-0000-0000-0000-000000000001'::UUID
);
```

**Expected:** Should return 2 addresses (Home and Office)

---

#### **View All Barbers:**

```sql
SELECT 
  b.id,
  p.full_name,
  b.business_name,
  b.rating,
  b.total_reviews,
  b.is_available,
  b.base_price
FROM barbers b
JOIN profiles p ON b.user_id = p.id
WHERE b.is_available = TRUE
ORDER BY b.rating DESC;
```

**Expected:** Should show 5 barbers with ratings from 4.5 to 4.9

---

## 🎉 Success Checklist

After completing all steps, verify:

- [ ] All 6 migrations applied successfully
- [ ] Test data inserted (11 profiles, 5 barbers, 7 bookings)
- [ ] Functions work (ran test queries)
- [ ] No error messages

---

## 🔧 Troubleshooting

### **Error: "relation already exists"**
**Solution:** This means you've run a migration before. Either:
- Skip that migration, or
- Drop the table first: `DROP TABLE table_name CASCADE;` then re-run

### **Error: "function already exists"**
**Solution:** Drop the function first:
```sql
DROP FUNCTION IF EXISTS function_name CASCADE;
```
Then re-run the migration.

### **Error: "permission denied"**
**Solution:** Make sure you're using the SQL Editor in Supabase Dashboard (not the Table Editor). The SQL Editor runs with elevated privileges.

### **No rows returned from test queries**
**Solution:** 
1. Make sure test data script (999_test_data.sql) ran successfully
2. Check for any errors in the output
3. Re-run the test data script (it has `ON CONFLICT DO NOTHING` so it's safe)

### **Test user login fails in app**
**Solution:** Test data creates profiles but NOT auth users. To login:
1. Either use mock auth (already implemented in your app)
2. Or create real auth users via Supabase Auth dashboard
3. Or enable Supabase Phone Auth (see AUTHENTICATION_SETUP_GUIDE.md)

---

## 📝 Test User Credentials

For your app testing, use this test customer:

**User ID:** `00000000-0000-0000-0000-000000000001`  
**Name:** Ahmad Fauzi  
**Phone:** +60123456789  
**Role:** customer  

**Has:**
- 5 bookings (3 completed, 2 upcoming, 1 cancelled)
- 2 saved addresses
- 2 favorite barbers
- 3 reviews written

---

## 🚀 Next Steps

After database setup is complete:

1. **Update your app's Supabase config** (if needed)
   - Check `packages/shared/src/lib/supabase/client.ts`
   - Ensure SUPABASE_URL and SUPABASE_ANON_KEY are correct

2. **Run your Customer app:**
   ```bash
   cd apps/customer
   npm start
   ```

3. **Test with mock login:**
   - Use mock auth to login as Ahmad Fauzi
   - Navigate to Bookings tab
   - You should see 5 bookings!

4. **Test creating a booking:**
   - Follow the roadmap (Phase 1, Day 2)
   - Implement booking creation flow
   - Test with real data

---

## 📚 Related Docs

- **Full Assessment & Roadmap:** `docs/FULL_ASSESSMENT_AND_ROADMAP.md`
- **Authentication Setup:** `docs/AUTHENTICATION_SETUP_GUIDE.md` (when ready for real auth)
- **Booking Service Implementation:** `docs/BOOKING_SERVICES_IMPLEMENTATION.md`

---

## 💡 Pro Tips

1. **Bookmark the SQL Editor** - You'll use it often for debugging
2. **Save useful queries** - Supabase lets you save SQL snippets
3. **Use Table View** - After running migrations, check tables in "Table Editor" tab
4. **Monitor logs** - Check "Logs" tab if queries fail
5. **Test incrementally** - Run verification queries after each migration

---

## 🆘 Need Help?

If you get stuck:

1. Check the error message carefully
2. Look in Supabase Dashboard → Logs for details
3. Verify previous migrations succeeded
4. Try re-running failed migrations (most have safeguards)
5. Check the troubleshooting section above

---

**🎯 Estimated Time:** 30 minutes total
- Migrations: 15 minutes
- Test data: 5 minutes  
- Verification: 5 minutes
- Reading this guide: 5 minutes

**Let's get your database set up!** 🚀
