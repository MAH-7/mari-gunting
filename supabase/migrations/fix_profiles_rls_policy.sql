-- Fix RLS policies for profiles table to allow user registration
-- This allows users to insert their own profile during registration

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow users to INSERT their own profile during registration
-- This is crucial for the registration flow
CREATE POLICY "Users can insert their own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 2: Allow users to VIEW their own profile
CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 3: Allow users to UPDATE their own profile
CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 4: Allow service role to do anything (for backend operations)
CREATE POLICY "Service role has full access"
ON profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify policies
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
WHERE tablename = 'profiles';
