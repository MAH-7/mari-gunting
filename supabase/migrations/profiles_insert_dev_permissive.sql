-- DEV-ONLY: Make profile inserts permissive for anon & authenticated roles
-- This is to unblock registration in development where no session is established yet.
-- Remove or tighten before production.

-- Drop existing INSERT policies that might conflict
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile insert during registration" ON profiles;

-- Create permissive policy for anon and authenticated to insert
CREATE POLICY "profiles_insert_dev_permissive"
ON profiles
FOR INSERT
TO anon, authenticated
WITH CHECK (
  true
);

-- Verification query
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'profiles' AND cmd = 'INSERT';
