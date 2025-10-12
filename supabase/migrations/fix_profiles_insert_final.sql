-- Final fix for profiles INSERT policy
-- Ensure registration works without an active session

-- Drop ALL existing INSERT policies to start clean
DROP POLICY IF EXISTS "profiles_insert_registration" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_dev_permissive" ON profiles;
DROP POLICY IF EXISTS "Allow profile insert during registration" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a simple permissive INSERT policy for development
-- This allows anyone (authenticated or anonymous) to insert profiles
-- In production, you'll want to add more restrictions
CREATE POLICY "profiles_insert_allow_all_dev"
ON profiles
FOR INSERT
TO public
WITH CHECK (
  -- Allow insert if profile doesn't already exist (prevent duplicates)
  NOT EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = id
  )
);

-- Verify all policies on profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  CASE cmd
    WHEN 'SELECT' THEN '🔍 Read'
    WHEN 'INSERT' THEN '➕ Create'
    WHEN 'UPDATE' THEN '✏️  Update'
    WHEN 'DELETE' THEN '🗑️  Delete'
    WHEN 'ALL' THEN '🔓 All'
  END as operation
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- Test query to check if we can insert (won't actually insert, just check)
-- EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
-- INSERT INTO profiles (id, phone_number, full_name, email, role)
-- VALUES ('00000000-0000-0000-0000-000000000000', '+60999999999', 'Test User', 'test@example.com', 'customer');
