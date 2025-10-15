-- ========================================
-- FIX REVIEWS RLS - CORRECTED VERSION
-- ========================================

-- The issue: Your bookings policies exist but are for {public} role
-- They should be for {authenticated} role to work with auth.uid()

-- ========================================
-- Step 1: Check existing bookings policies
-- ========================================
SELECT 
    policyname, 
    cmd, 
    permissive, 
    roles,
    qual as using_clause
FROM pg_policies 
WHERE tablename = 'bookings' AND cmd = 'SELECT';

-- ========================================
-- Step 2: Drop existing bookings SELECT policies
-- ========================================
DROP POLICY IF EXISTS "Customers can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Barbers can view their bookings" ON bookings;
DROP POLICY IF EXISTS "Barbershop owners can view bookings" ON bookings;

-- ========================================
-- Step 3: Create new policies for authenticated users
-- ========================================

-- Policy 1: Customers can view their own bookings
CREATE POLICY "bookings_select_customer" ON bookings
    FOR SELECT
    TO authenticated
    USING (customer_id = auth.uid());

-- Policy 2: Barbers can view bookings assigned to them
CREATE POLICY "bookings_select_barber" ON bookings
    FOR SELECT
    TO authenticated
    USING (barber_id IN (SELECT id FROM barbers WHERE user_id = auth.uid()));

-- Policy 3: Barbershop owners can view bookings at their shop
CREATE POLICY "bookings_select_barbershop" ON bookings
    FOR SELECT
    TO authenticated
    USING (barbershop_id IN (SELECT id FROM barbershops WHERE owner_id = auth.uid()));

-- ========================================
-- Step 4: Ensure reviews and profiles policies are correct
-- ========================================

-- Check reviews policies
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'reviews' AND cmd = 'SELECT';

-- Drop old reviews policies if needed
DROP POLICY IF EXISTS "reviews_select_all" ON reviews;
DROP POLICY IF EXISTS "Enable read access for all users" ON reviews;

-- Create reviews SELECT policy
CREATE POLICY "reviews_select_visible" ON reviews
    FOR SELECT
    TO authenticated
    USING (is_visible = true);

-- Check profiles policies (should allow reading all profiles)
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'profiles' AND cmd = 'SELECT';

-- If profiles don't have a SELECT policy for authenticated users, add it:
-- (Uncomment if needed)
-- CREATE POLICY "profiles_select_authenticated" ON profiles
--     FOR SELECT
--     TO authenticated
--     USING (true);

-- ========================================
-- Step 5: Verify new policies
-- ========================================
SELECT 
    tablename,
    policyname, 
    cmd, 
    permissive, 
    roles
FROM pg_policies 
WHERE tablename IN ('bookings', 'reviews', 'profiles') AND cmd = 'SELECT'
ORDER BY tablename, policyname;

-- ========================================
-- Step 6: Test the query that the app uses
-- ========================================
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

-- If this returns rows, SUCCESS! ✅
-- If not, check Step 4 of CHECK_SPECIFIC_BARBER_REVIEWS.sql for orphaned reviews
