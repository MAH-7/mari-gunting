-- =====================================================
-- MARI-GUNTING COMBINED MIGRATIONS
-- =====================================================
-- This file combines all migrations for easy setup
-- Copy and paste each section into Supabase SQL Editor
-- Run them IN ORDER (1-7)
-- =====================================================

-- =====================================================
-- MIGRATION 1: INITIAL SCHEMA
-- =====================================================
-- Copy from line 8 in 001_initial_schema.sql to end
-- This creates all tables, enums, indexes, and triggers
-- Expected result: Success. No rows returned
-- Time: ~10 seconds

-- =====================================================
-- MIGRATION 2: RLS POLICIES  
-- =====================================================
-- Copy entire 002_rls_policies.sql file
-- This enables Row Level Security on all tables
-- Expected result: Success. No rows returned
-- Time: ~5 seconds

-- =====================================================
-- MIGRATION 3: STORAGE BUCKETS
-- =====================================================
-- Copy 003_storage_buckets.sql OR 003_storage_policies_only.sql
-- Choose storage_buckets.sql if buckets don't exist
-- Choose storage_policies_only.sql if you created buckets manually
-- Expected result: Success. No rows returned
-- Time: ~3 seconds

-- =====================================================
-- MIGRATION 4: DATABASE FUNCTIONS
-- =====================================================
-- Copy entire 004_database_functions.sql file
-- This creates utility functions
-- Expected result: Success. No rows returned
-- Time: ~3 seconds

-- =====================================================
-- MIGRATION 5: CUSTOMER BOOKING FUNCTIONS (CRITICAL!)
-- =====================================================
-- Copy entire 005_customer_booking_functions.sql file
-- This creates:
-- - create_booking() function
-- - get_customer_bookings() function
-- - cancel_booking() function
-- - customer_addresses table
-- - Address management functions
-- YOUR APP WON'T WORK WITHOUT THIS!
-- Expected result: Success. No rows returned
-- Time: ~5 seconds

-- =====================================================
-- MIGRATION 6: REVIEW SYSTEM
-- =====================================================
-- Copy entire 006_review_system.sql file
-- This enhances the review system
-- Expected result: Success. No rows returned
-- Time: ~3 seconds

-- =====================================================
-- MIGRATION 7: TEST DATA (OPTIONAL)
-- =====================================================
-- Copy entire 999_test_data.sql file
-- This creates realistic test data:
-- - 11 profiles (4 customers, 5 barbers, 2 shop owners)
-- - 5 barbers with services
-- - 7 bookings (past, upcoming, cancelled)
-- - 4 addresses
-- - 3 reviews
-- - 3 promo codes
-- Expected result: Success. No rows returned
-- Time: ~10 seconds

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- After running all migrations, verify with these:

-- 1. Check table counts
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
SELECT 'Reviews', COUNT(*) FROM reviews;

-- Expected results (if test data was loaded):
-- Profiles: 11
-- Barbers: 5
-- Barbershops: 2
-- Services: 20+
-- Bookings: 7
-- Customer Addresses: 4
-- Reviews: 3

-- 2. Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'create_booking',
    'get_customer_bookings', 
    'cancel_booking',
    'add_customer_address',
    'get_customer_addresses'
  )
ORDER BY routine_name;

-- Expected: All 5 functions listed

-- 3. Test get_customer_bookings function
SELECT * FROM get_customer_bookings(
  '00000000-0000-0000-0000-000000000001'::UUID,
  NULL,
  20,
  0
);

-- Expected: 5 bookings for Ahmad Fauzi

-- 4. Test get_customer_addresses function
SELECT * FROM get_customer_addresses(
  '00000000-0000-0000-0000-000000000001'::UUID
);

-- Expected: 2 addresses (Home and Office)

-- =====================================================
-- TROUBLESHOOTING
-- =====================================================

-- If you get "relation already exists" error:
-- You already ran that migration. Skip it or drop the table first:
-- DROP TABLE table_name CASCADE;

-- If you get "function already exists" error:
-- DROP FUNCTION IF EXISTS function_name CASCADE;

-- If you get "permission denied" error:
-- Make sure you're using SQL Editor (not Table Editor)
-- SQL Editor has elevated privileges

-- =====================================================
-- READY TO PROCEED!
-- =====================================================
-- Once all migrations are applied and verified:
-- 1. Close this file
-- 2. Proceed to Phase 2: Authentication Setup
-- =====================================================
