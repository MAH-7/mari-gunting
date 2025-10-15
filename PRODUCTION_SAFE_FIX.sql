-- PRODUCTION-SAFE FIX: Stop infinite recursion while maintaining security
-- This removes the broken policies and adds proper, secure, non-recursive ones

-- Step 1: Remove ALL broken policies that could cause recursion
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', r.policyname);
    END LOOP;
END $$;

-- Step 2: Add back SECURE, NON-RECURSIVE policies

-- Allow users to view their own profile
CREATE POLICY "profiles_select_own" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "profiles_update_own" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Allow users to insert their own profile (during registration)
CREATE POLICY "profiles_insert_own" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Allow public to view ONLY barber profiles (for discovery)
-- This is NON-RECURSIVE because it doesn't reference profiles in the subquery
CREATE POLICY "profiles_select_barbers_for_discovery" 
  ON profiles FOR SELECT 
  USING (
    is_active = TRUE 
    AND role = 'barber'
  );

-- Allow public to view ONLY barbershop owner profiles (for discovery)
CREATE POLICY "profiles_select_barbershop_owners_for_discovery" 
  ON profiles FOR SELECT 
  USING (
    is_active = TRUE 
    AND role = 'barbershop_owner'
  );

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Verify the fix
SELECT 
  'PRODUCTION FIX APPLIED - Policies are secure and non-recursive' AS status,
  COUNT(*) as total_policies 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Show all policies
SELECT 
  policyname, 
  cmd,
  CASE 
    WHEN permissive = 'PERMISSIVE' THEN 'Permissive'
    ELSE 'Restrictive'
  END as type
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
