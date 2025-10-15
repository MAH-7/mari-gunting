-- ========================================
-- RLS DIAGNOSTICS AND FIX SCRIPT
-- ========================================
-- Run this in your Supabase SQL Editor to diagnose and fix RLS issues

-- STEP 1: Check current policies
-- ========================================
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
WHERE tablename IN ('profiles', 'barbers')
ORDER BY tablename, cmd, policyname;

-- STEP 2: Check if there are any conflicting policies
-- ========================================
-- This shows if you have multiple UPDATE policies on the same table
SELECT 
    tablename,
    cmd,
    COUNT(*) as policy_count,
    string_agg(policyname, ', ') as policy_names
FROM pg_policies 
WHERE tablename IN ('profiles', 'barbers')
GROUP BY tablename, cmd
HAVING COUNT(*) > 1;

-- STEP 3: Test UPDATE permissions for current user
-- ========================================
-- First, let's see the current user
SELECT 
    auth.uid() as current_user_id,
    current_user as db_role;

-- STEP 4: Check if profiles table has proper columns
-- ========================================
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
    AND column_name IN ('id', 'full_name', 'updated_at')
ORDER BY ordinal_position;

-- STEP 5: Check if barbers table has proper columns
-- ========================================
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'barbers' 
    AND column_name IN ('id', 'user_id', 'bio', 'specializations', 'updated_at')
ORDER BY ordinal_position;

-- ========================================
-- FIX: Drop ALL existing UPDATE policies
-- ========================================

-- Drop all UPDATE policies on profiles
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Drop all UPDATE policies on barbers
DROP POLICY IF EXISTS "Users can update own barber record" ON barbers;
DROP POLICY IF EXISTS "barbers_update_own" ON barbers;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON barbers;
DROP POLICY IF EXISTS "Barbers can update their own record" ON barbers;

-- ========================================
-- CREATE: Single clean UPDATE policy for each table
-- ========================================

-- Profiles UPDATE policy (using auth.uid() in both USING and WITH CHECK)
CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Barbers UPDATE policy (using auth.uid() in both USING and WITH CHECK)
CREATE POLICY "barbers_update_policy" ON barbers
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ========================================
-- Ensure RLS is enabled
-- ========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;

-- ========================================
-- VERIFICATION: Check new policies
-- ========================================
SELECT 
    tablename,
    policyname,
    cmd,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename IN ('profiles', 'barbers')
    AND cmd = 'UPDATE'
ORDER BY tablename;

-- ========================================
-- TEST: Try sample update (replace with your actual user_id)
-- ========================================
-- Uncomment and replace 'YOUR-USER-ID-HERE' with your actual auth user ID
-- 
-- UPDATE profiles 
-- SET full_name = 'Test Name', updated_at = NOW()
-- WHERE id = 'YOUR-USER-ID-HERE';
--
-- UPDATE barbers 
-- SET bio = 'Test Bio', updated_at = NOW()
-- WHERE user_id = 'YOUR-USER-ID-HERE';

-- ========================================
-- DIAGNOSTIC: Check for other potential issues
-- ========================================

-- Check if there are any BEFORE UPDATE triggers that might interfere
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table IN ('profiles', 'barbers')
    AND event_manipulation = 'UPDATE';

-- Check table ownership
SELECT 
    tablename,
    tableowner
FROM pg_tables
WHERE tablename IN ('profiles', 'barbers');

-- Final summary
SELECT 
    '✅ RLS policies cleaned and recreated' as status,
    'Run your profile update test now' as next_step;
