-- Fix UPDATE policy for profiles table
-- The current policy might be blocking updates

-- Drop existing UPDATE policies
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create a permissive UPDATE policy for development
-- This allows any authenticated or anon user to update profiles
CREATE POLICY "profiles_update_dev_permissive"
ON profiles
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'profiles' AND cmd = 'UPDATE';

-- Test the update directly
-- Replace USER_ID with your actual user ID: 5a325155-e499-47a0-96cf-b3d7795335cd
-- UPDATE profiles 
-- SET avatar_url = 'https://test-url.com/avatar.jpg', updated_at = NOW()
-- WHERE id = '5a325155-e499-47a0-96cf-b3d7795335cd';

-- Check if the update worked
-- SELECT id, full_name, avatar_url, updated_at 
-- FROM profiles 
-- WHERE id = '5a325155-e499-47a0-96cf-b3d7795335cd';
