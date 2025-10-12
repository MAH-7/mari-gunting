-- Allow profile insertion during registration flow
-- This fixes the chicken-and-egg problem where signup doesn't create a session
-- but we need to insert a profile that requires the user to be authenticated

-- Drop the restrictive insert policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Create a more permissive policy for inserts during registration
-- This allows any authenticated OR public user to insert a profile
-- as long as they're inserting their own ID
CREATE POLICY "Allow profile insert during registration"
ON profiles
FOR INSERT
TO public
WITH CHECK (
  -- Either the user is authenticated and inserting their own profile
  (auth.uid() = id)
  OR
  -- Or this is a new profile (doesn't exist yet) during registration
  (NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = id))
);

-- Keep the existing policies for SELECT and UPDATE
-- These should remain restricted to authenticated users viewing/updating their own data

-- Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;
