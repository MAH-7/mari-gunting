-- =====================================================
-- FIX: Allow Profile Registration in Dev/Production
-- Issue: RLS blocking profile creation during registration
-- Solution: Add permissive INSERT policy
-- =====================================================

-- Drop existing INSERT policies that might conflict
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile insert during registration" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_dev_permissive" ON profiles;

-- Create permissive policy for registration
-- This allows new users to create their profile during registration
CREATE POLICY "Allow registration inserts"
ON profiles
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Allow insert if:
  -- 1. ID matches the authenticated user (if authenticated), OR
  -- 2. No session exists yet (anon role during registration)
  auth.uid() = id OR auth.uid() IS NULL
);

-- Verification: Check current INSERT policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles' AND cmd = 'INSERT';

-- Test query (should work after policy is applied)
-- This simulates what happens during registration
-- INSERT INTO profiles (id, role, full_name, phone_number, phone_verified, country)
-- VALUES (
--   '60111111-1115-0000-0000-000000000000',
--   'barber',
--   'Test User',
--   '+601111111115',
--   true,
--   'Malaysia'
-- );
