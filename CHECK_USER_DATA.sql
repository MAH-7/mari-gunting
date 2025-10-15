-- ========================================
-- CHECK USER DATA DIAGNOSTIC
-- ========================================
-- User ID: a8467a5b-b92c-471c-a932-c9619fbc4829

-- 1. Check if the user exists in profiles table
SELECT 
    id,
    full_name,
    email,
    phone,
    role,
    is_active,
    created_at,
    updated_at
FROM profiles 
WHERE id = 'a8467a5b-b92c-471c-a932-c9619fbc4829';

-- 2. Check if the user exists in barbers table
SELECT 
    id,
    user_id,
    bio,
    specializations,
    created_at,
    updated_at
FROM barbers 
WHERE user_id = 'a8467a5b-b92c-471c-a932-c9619fbc4829';

-- 3. Check what auth.uid() returns (should match your user ID)
SELECT auth.uid() as current_auth_uid;

-- 4. Simulate the exact update the app is trying
-- This will show if RLS is blocking it or if it's a different issue
UPDATE profiles 
SET 
    full_name = 'Test Seven',
    updated_at = NOW()
WHERE id = 'a8467a5b-b92c-471c-a932-c9619fbc4829'
RETURNING *;

-- 5. If the above fails, try with RLS disabled temporarily
-- (DO NOT DO THIS IN PRODUCTION - only for testing)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

UPDATE profiles 
SET 
    full_name = 'Test Seven RLS Disabled',
    updated_at = NOW()
WHERE id = 'a8467a5b-b92c-471c-a932-c9619fbc4829'
RETURNING *;

-- Re-enable RLS immediately
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 6. Check the policy again to see EXACTLY what it's checking
SELECT 
    pg_get_expr(pol.polqual, pol.polrelid) as using_expression_raw,
    pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression_raw
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
WHERE pc.relname = 'profiles' 
    AND pol.polname = 'profiles_update_policy';
