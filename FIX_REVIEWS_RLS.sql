-- ========================================
-- FIX REVIEWS RLS - MOST LIKELY ISSUE
-- ========================================
-- The INNER JOIN in the reviews query is failing
-- This is usually because RLS on bookings/profiles blocks the JOIN

-- ========================================
-- FIX 1: Ensure bookings SELECT policy allows barbers to read their bookings
-- ========================================

-- Check current bookings policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'bookings' AND cmd = 'SELECT';

-- Drop any overly restrictive bookings SELECT policies
-- (Keep this commented until you verify what policies exist)
-- DROP POLICY IF EXISTS "restrictive_policy_name" ON bookings;

-- Create/Replace bookings SELECT policy that allows barbers to see their bookings
CREATE POLICY IF NOT EXISTS "bookings_select_by_barber" ON bookings
    FOR SELECT
    TO authenticated
    USING (
        -- Customer can see their own bookings
        customer_id = auth.uid()
        -- Barber can see bookings assigned to them
        OR barber_id IN (SELECT id FROM barbers WHERE user_id = auth.uid())
        -- Barbershop owner can see bookings at their shop
        OR barbershop_id IN (SELECT id FROM barbershops WHERE owner_id = auth.uid())
    );

-- ========================================
-- FIX 2: Ensure profiles SELECT policy allows reading customer profiles
-- ========================================

-- Check current profiles policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles' AND cmd = 'SELECT';

-- This should already exist, but let's ensure it
CREATE POLICY IF NOT EXISTS "profiles_select_all" ON profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- ========================================
-- FIX 3: Ensure reviews SELECT policy is permissive
-- ========================================

-- Check current reviews policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'reviews' AND cmd = 'SELECT';

-- Create simple review SELECT policy
CREATE POLICY IF NOT EXISTS "reviews_select_visible" ON reviews
    FOR SELECT
    TO authenticated
    USING (is_visible = true);

-- ========================================
-- VERIFICATION
-- ========================================

-- Test the exact query the app uses
SELECT 
    r.id,
    r.rating,
    r.comment,
    r.response,
    r.response_at,
    r.created_at,
    r.booking_id,
    r.barber_id,
    r.barbershop_id
FROM reviews r
INNER JOIN bookings b ON r.booking_id = b.id
INNER JOIN profiles p ON b.customer_id = p.id
WHERE r.is_visible = true
    AND r.barber_id = '3f2ec946-120e-4cc2-8b0e-0762397acfbb'
ORDER BY r.created_at DESC;

-- If the above returns results, the fix worked!
-- If not, run CHECK_SPECIFIC_BARBER_REVIEWS.sql to diagnose further

-- ========================================
-- ALTERNATIVE: If bookings are truly missing
-- ========================================
-- If Step 4 of CHECK_SPECIFIC_BARBER_REVIEWS.sql shows "Booking missing",
-- then the reviews are orphaned. In that case, you need to either:
-- 1. Create the missing booking records
-- 2. Delete the orphaned reviews
-- 3. Make the query use LEFT JOIN instead of INNER JOIN

-- Option to check for orphaned reviews:
SELECT 
    r.id as review_id,
    r.booking_id,
    r.barber_id,
    r.rating,
    r.comment,
    r.created_at,
    CASE 
        WHEN b.id IS NULL THEN 'ORPHANED - No booking exists'
        ELSE 'OK'
    END as status
FROM reviews r
LEFT JOIN bookings b ON r.booking_id = b.id
WHERE r.barber_id = '3f2ec946-120e-4cc2-8b0e-0762397acfbb';
