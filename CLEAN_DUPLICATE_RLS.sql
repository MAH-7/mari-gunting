-- Clean up duplicate RLS policies for profile edit
-- This fixes the issue where multiple policies conflict

-- =====================================================
-- STEP 1: Check current policies
-- =====================================================

-- Check profiles UPDATE policies
SELECT 'PROFILES - BEFORE CLEANUP' as step;
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'UPDATE';

-- Check barbers UPDATE policies  
SELECT 'BARBERS - BEFORE CLEANUP' as step;
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'barbers' AND cmd = 'UPDATE';

-- =====================================================
-- STEP 2: Drop ALL UPDATE policies (clean slate)
-- =====================================================

-- Drop all profiles UPDATE policies
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "Users can update profile" ON profiles;

-- Drop all barbers UPDATE policies
DROP POLICY IF EXISTS "Barbers can update own profile" ON barbers;
DROP POLICY IF EXISTS "barbers_update_own" ON barbers;
DROP POLICY IF EXISTS "Users can update own barber record" ON barbers;
DROP POLICY IF EXISTS "Barbers can update own barber" ON barbers;

-- =====================================================
-- STEP 3: Create ONE clean policy for each table
-- =====================================================

-- Profiles UPDATE policy - ONE policy only
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Barbers UPDATE policy - ONE policy only
CREATE POLICY "barbers_update_own"
  ON barbers FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- STEP 4: Verify cleanup
-- =====================================================

-- Check profiles UPDATE policies (should show ONLY 1)
SELECT 'PROFILES - AFTER CLEANUP (Should show 1 policy)' as step;
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'UPDATE';

-- Check barbers UPDATE policies (should show ONLY 1)
SELECT 'BARBERS - AFTER CLEANUP (Should show 1 policy)' as step;
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'barbers' AND cmd = 'UPDATE';

-- =====================================================
-- STEP 5: Confirm RLS is enabled
-- =====================================================

-- Ensure RLS is enabled on both tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;

-- Verify RLS status
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('profiles', 'barbers');
