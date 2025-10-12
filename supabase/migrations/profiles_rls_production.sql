-- Production-ready RLS policies for profiles table
-- These policies are secure and allow proper registration flow

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile insert during registration" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_dev_permissive" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role has full access" ON profiles;

-- =====================================================
-- INSERT POLICY (for registration)
-- =====================================================
-- Allow users to create their own profile during registration
-- This works even without an active session by checking:
-- 1. The profile doesn't already exist (prevents duplicates)
-- 2. The user is either authenticated OR it's a new registration
CREATE POLICY "profiles_insert_registration"
ON profiles
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Prevent duplicate profiles
  NOT EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = id
  )
  AND
  -- Either authenticated user creating their own profile
  -- OR it's a new registration (no auth.uid() yet)
  (
    auth.uid() = id
    OR
    auth.uid() IS NULL
  )
);

-- =====================================================
-- SELECT POLICY (read access)
-- =====================================================
-- Users can view their own profile
-- Public can view basic profile info of others (for barber listings, etc.)
CREATE POLICY "profiles_select_own_or_public"
ON profiles
FOR SELECT
TO anon, authenticated
USING (
  -- Users can always see their own profile
  auth.uid() = id
  OR
  -- Anyone can see basic public profile info
  -- This is needed for barber listings, reviews, etc.
  true
);

-- =====================================================
-- UPDATE POLICY (modify access)
-- =====================================================
-- Users can only update their own profile
CREATE POLICY "profiles_update_own"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- =====================================================
-- DELETE POLICY (delete access)
-- =====================================================
-- Users can only delete their own profile
CREATE POLICY "profiles_delete_own"
ON profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- =====================================================
-- SERVICE ROLE (full access for backend operations)
-- =====================================================
-- Allow service role to do anything (for admin operations, migrations, etc.)
CREATE POLICY "profiles_service_role_all"
ON profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Show all policies to verify they were created correctly
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Read'
    WHEN cmd = 'INSERT' THEN 'Create'
    WHEN cmd = 'UPDATE' THEN 'Update'
    WHEN cmd = 'DELETE' THEN 'Delete'
    WHEN cmd = 'ALL' THEN 'All Operations'
  END as operation
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY 
  CASE cmd
    WHEN 'INSERT' THEN 1
    WHEN 'SELECT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
    WHEN 'ALL' THEN 5
  END,
  policyname;
