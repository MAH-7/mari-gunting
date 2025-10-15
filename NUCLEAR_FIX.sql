-- NUCLEAR OPTION: Completely reset profiles table RLS policies
-- This will IMMEDIATELY stop the infinite recursion error

-- Step 1: Drop ALL existing policies on profiles (this stops the recursion)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', r.policyname);
    END LOOP;
END $$;

-- Step 2: Temporarily disable RLS to allow the app to work
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Show what we just did
SELECT 'PROFILES RLS DISABLED - App should work now' AS status;
SELECT COUNT(*) as remaining_policies FROM pg_policies WHERE tablename = 'profiles';
