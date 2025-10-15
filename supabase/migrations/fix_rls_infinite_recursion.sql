-- EMERGENCY FIX: Remove infinite recursion in profiles RLS policies
-- The previous migration caused infinite recursion - this fixes it

-- First, drop ALL policies on profiles table to stop the recursion
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Barber profiles viewable by all for discovery" ON profiles;
DROP POLICY IF EXISTS "Own profile viewable by user" ON profiles;

-- Now create simple, non-recursive policies

-- 1. Users can view their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- 2. Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 3. Users can insert their own profile
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. Allow viewing profiles for barbers (non-recursive approach)
-- This uses a direct check against the barbers table without joining back to profiles
CREATE POLICY "profiles_select_barbers_public"
  ON profiles FOR SELECT
  USING (
    is_active = TRUE 
    AND id IN (
      SELECT user_id FROM barbers
    )
  );

-- 5. Allow viewing profiles for barbershop owners (non-recursive approach)
CREATE POLICY "profiles_select_barbershop_owners_public"
  ON profiles FOR SELECT
  USING (
    is_active = TRUE 
    AND id IN (
      SELECT owner_id FROM barbershops
    )
  );

-- Verify the policies are applied
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
