-- ========================================
-- CHECK PROFILES RLS
-- ========================================

-- Check if profiles table has RLS enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles' AND schemaname = 'public';

-- Check profiles SELECT policies
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual as using_clause
FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'SELECT'
ORDER BY policyname;

-- Test if you can read customer profiles
SELECT 
    id,
    full_name,
    avatar_url,
    role
FROM profiles
WHERE role = 'customer'
LIMIT 5;

-- Check specific customer from your booking
SELECT 
    b.id as booking_id,
    b.customer_id,
    p.full_name as customer_name,
    p.avatar_url
FROM bookings b
LEFT JOIN profiles p ON b.customer_id = p.id
WHERE b.id = '8bdcd52b-fe16-483c-bcb6-70c8cdba8841'
LIMIT 1;

-- ========================================
-- FIX: If profiles don't have a SELECT policy
-- ========================================

-- Drop old policy if it exists
DROP POLICY IF EXISTS "profiles_select_authenticated" ON profiles;

-- This allows authenticated users to read all profiles
CREATE POLICY "profiles_select_authenticated" ON profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- Verify
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'profiles' AND cmd = 'SELECT';
