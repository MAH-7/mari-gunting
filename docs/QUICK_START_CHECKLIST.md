# 🚀 Quick Start Checklist - Database Setup

**Time Required:** 30 minutes  
**Difficulty:** Easy  
**Goal:** Get your database ready for testing

---

## ✅ Pre-Flight Check

Before you start, make sure:
- [ ] You have a Supabase account
- [ ] Your Mari-Gunting project is created in Supabase
- [ ] You're logged into [Supabase Dashboard](https://supabase.com/dashboard)

---

## 📋 Step-by-Step Checklist

### **Phase 1: Apply Migrations** (15 mins)

Open Supabase Dashboard → SQL Editor, then run these files **IN ORDER**:

- [ ] **Migration 1:** `001_initial_schema.sql` (⏱️ 2 mins)
  - Creates all tables, enums, indexes, triggers
  - Should see: "Success. No rows returned"

- [ ] **Migration 2:** `002_rls_policies.sql` (⏱️ 2 mins)
  - Enables Row Level Security
  - Creates security policies

- [ ] **Migration 3:** `003_storage_buckets.sql` OR `003_storage_policies_only.sql` (⏱️ 1 min)
  - Choose the full version if no buckets exist yet
  - Choose policies-only if you've created buckets manually

- [ ] **Migration 4:** `004_database_functions.sql` (⏱️ 1 min)
  - Utility functions

- [ ] **Migration 5:** `005_customer_booking_functions.sql` (⏱️ 2 mins) 🔥 **CRITICAL**
  - Booking creation/management functions
  - Customer address management
  - **Your app won't work without this!**

- [ ] **Migration 6:** `006_review_system.sql` (⏱️ 1 min)
  - Review features

**How to apply each migration:**
1. Copy entire file content
2. Paste into SQL Editor
3. Click "Run"
4. Wait for "Success"
5. ✅ Check it off

---

### **Phase 2: Add Test Data** (5 mins)

- [ ] Run `999_test_data.sql` in SQL Editor
  - Creates 11 test profiles
  - Creates 5 barbers with services
  - Creates 7 bookings
  - Creates addresses, reviews, etc.

---

### **Phase 3: Verify Setup** (5 mins)

Run these verification queries:

#### ✅ **Check if tables exist:**
```sql
SELECT 'Profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'Barbers', COUNT(*) FROM barbers
UNION ALL
SELECT 'Bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'Customer Addresses', COUNT(*) FROM customer_addresses;
```

**Expected:** 11, 5, 7, 4 rows respectively

- [ ] Table counts match expected numbers

---

#### ✅ **Check if functions work:**
```sql
SELECT * FROM get_customer_bookings(
  '00000000-0000-0000-0000-000000000001'::UUID,
  NULL, 20, 0
);
```

**Expected:** Returns 5 bookings

- [ ] Function returns booking data

---

#### ✅ **Check test barbers:**
```sql
SELECT p.full_name, b.business_name, b.rating, b.is_available
FROM barbers b
JOIN profiles p ON b.user_id = p.id
ORDER BY b.rating DESC;
```

**Expected:** 5 barbers listed with ratings

- [ ] Barbers data looks good

---

### **Phase 4: Test in App** (5 mins)

- [ ] Open your Customer app (`npm start` in `apps/customer`)
- [ ] Use mock login (phone: +60123456789, any OTP)
- [ ] Navigate to Bookings tab
- [ ] **You should see bookings appear!** 🎉

---

## 🎯 Success Criteria

**You're ready to proceed if:**

✅ All 6 migrations applied without errors  
✅ Test data inserted (11 profiles, 5 barbers, 7 bookings)  
✅ Verification queries return expected data  
✅ Functions work (`get_customer_bookings`, etc.)  
✅ App shows booking data when you login

---

## 🚨 Common Issues

### Issue: "relation already exists"
**Fix:** Skip that migration or drop the table first, then re-run

### Issue: "function already exists"  
**Fix:** Drop function first: `DROP FUNCTION IF EXISTS function_name CASCADE;`

### Issue: No data showing in app
**Fix:**
1. Check Supabase project URL/keys in `.env`
2. Verify test data ran successfully (run count queries)
3. Check app is using mock auth correctly

### Issue: RLS policy errors
**Fix:** Make sure migration 002 (RLS policies) ran successfully

---

## 📂 File Locations

All migrations are in: `supabase/migrations/`

```
supabase/migrations/
├── 001_initial_schema.sql          ⭐ Tables & structure
├── 002_rls_policies.sql            🔐 Security
├── 003_storage_buckets.sql         📦 File storage
├── 004_database_functions.sql      ⚙️  Utilities
├── 005_customer_booking_functions.sql  🔥 Critical!
├── 006_review_system.sql           ⭐ Reviews
└── 999_test_data.sql               🎉 Test data
```

---

## 🎬 What to Do After Setup

**Immediately after:**
1. Run the app and verify bookings display
2. Test address management screen
3. Explore the test data

**Next (Phase 1, Day 1 Afternoon):**
1. Wire home screen to real barber data
2. Wire barbers list to database
3. Start implementing booking creation

**See full roadmap:** `docs/FULL_ASSESSMENT_AND_ROADMAP.md`

---

## 📞 Quick Links

- **Supabase Dashboard:** https://supabase.com/dashboard
- **Full Setup Guide:** `docs/DATABASE_SETUP_GUIDE.md`
- **Roadmap:** `docs/FULL_ASSESSMENT_AND_ROADMAP.md`

---

## ⏱️ Time Breakdown

| Task | Time | Status |
|------|------|--------|
| Apply 6 migrations | 15 mins | ⬜ |
| Add test data | 5 mins | ⬜ |
| Verify setup | 5 mins | ⬜ |
| Test in app | 5 mins | ⬜ |
| **TOTAL** | **30 mins** | ⬜ |

---

## 🏁 Ready to Start?

1. **Open Supabase Dashboard now**
2. **Go to SQL Editor**
3. **Start with migration 001**
4. **Check off items as you go**

**Let's do this!** 💪

---

**👉 Next Steps After Completion:**

Once database setup is done, you'll move to:
- **Phase 1, Day 1 Afternoon:** Wire screens to real data (4 hours)
- **Phase 1, Day 2:** Implement booking creation (8 hours)
- **Phase 1, Day 3:** Testing and polish (6 hours)

You're on your way to a working app! 🚀
