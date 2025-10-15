-- Fix Profile Edit RLS Policies
-- Ensures barbers can update both profiles and barbers tables

-- =====================================================
-- PROFILES TABLE - Ensure UPDATE policy exists
-- =====================================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Create clean UPDATE policy for profiles
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- BARBERS TABLE - Ensure UPDATE policy exists
-- =====================================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Barbers can update own profile" ON barbers;
DROP POLICY IF EXISTS "barbers_update_own" ON barbers;

-- Create clean UPDATE policy for barbers
CREATE POLICY "barbers_update_own"
  ON barbers FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check profiles policies
SELECT 
  'profiles' as table_name,
  policyname, 
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'UPDATE';

-- Check barbers policies
SELECT 
  'barbers' as table_name,
  policyname, 
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'barbers' AND cmd = 'UPDATE';
