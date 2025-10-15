-- =====================================================
-- Fix Online/Offline Toggle RLS Policies
-- Run this to restore update permissions after adding
-- service radius cooldown functions
-- =====================================================

-- First, check if columns exist (if not, add them)
DO $$ 
BEGIN
    -- Add is_online to profiles if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'is_online'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_online BOOLEAN DEFAULT false;
    END IF;

    -- Add last_seen_at to profiles if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'last_seen_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN last_seen_at TIMESTAMPTZ;
    END IF;

    -- Add is_available to barbers if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'barbers' AND column_name = 'is_available'
    ) THEN
        ALTER TABLE barbers ADD COLUMN is_available BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON profiles(is_online);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_barbers_is_available ON barbers(is_available);

-- =====================================================
-- Fix RLS Policies for profiles table
-- =====================================================

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- Create comprehensive update policy for profiles
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- =====================================================
-- Fix RLS Policies for barbers table
-- =====================================================

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update own barber record" ON barbers;
DROP POLICY IF EXISTS "Users can update their own barber record" ON barbers;
DROP POLICY IF EXISTS "Enable update for authenticated users on their own record" ON barbers;
DROP POLICY IF EXISTS "barbers_update_policy" ON barbers;

-- Create comprehensive update policy for barbers
CREATE POLICY "Users can update own barber record"
ON barbers FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- Grant necessary permissions
-- =====================================================

-- Ensure authenticated users can update their records
GRANT UPDATE ON profiles TO authenticated;
GRANT UPDATE ON barbers TO authenticated;

-- =====================================================
-- Verification Query
-- =====================================================

-- Run this to verify everything is set up correctly:
DO $$
DECLARE
    profiles_online_exists BOOLEAN;
    profiles_last_seen_exists BOOLEAN;
    barbers_available_exists BOOLEAN;
    profiles_update_policy_exists BOOLEAN;
    barbers_update_policy_exists BOOLEAN;
BEGIN
    -- Check columns
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'is_online'
    ) INTO profiles_online_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'last_seen_at'
    ) INTO profiles_last_seen_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'barbers' AND column_name = 'is_available'
    ) INTO barbers_available_exists;
    
    -- Check policies
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can update own profile'
    ) INTO profiles_update_policy_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'barbers' 
        AND policyname = 'Users can update own barber record'
    ) INTO barbers_update_policy_exists;
    
    -- Output results
    RAISE NOTICE '=== Online/Offline Toggle Setup Verification ===';
    RAISE NOTICE 'profiles.is_online exists: %', profiles_online_exists;
    RAISE NOTICE 'profiles.last_seen_at exists: %', profiles_last_seen_exists;
    RAISE NOTICE 'barbers.is_available exists: %', barbers_available_exists;
    RAISE NOTICE 'profiles UPDATE policy exists: %', profiles_update_policy_exists;
    RAISE NOTICE 'barbers UPDATE policy exists: %', barbers_update_policy_exists;
    
    IF profiles_online_exists AND profiles_last_seen_exists AND barbers_available_exists 
       AND profiles_update_policy_exists AND barbers_update_policy_exists THEN
        RAISE NOTICE '✅ All checks passed! Online/Offline toggle should work now.';
    ELSE
        RAISE WARNING '❌ Some checks failed. Please review the output above.';
    END IF;
END $$;

-- Show final policy status
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename IN ('profiles', 'barbers')
AND policyname IN ('Users can update own profile', 'Users can update own barber record')
ORDER BY tablename, policyname;
