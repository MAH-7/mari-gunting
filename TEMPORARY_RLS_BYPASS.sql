-- ========================================
-- TEMPORARY RLS BYPASS FOR TESTING
-- ========================================
-- ⚠️ WARNING: This disables RLS security
-- Only use this temporarily to test if RLS is the issue
-- You MUST re-enable it after testing!

-- Step 1: Disable RLS on both tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE barbers DISABLE ROW LEVEL SECURITY;

-- Step 2: Verify RLS is disabled
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN 'ENABLED ✅'
        ELSE 'DISABLED ⚠️'
    END as rls_status
FROM pg_tables 
WHERE tablename IN ('profiles', 'barbers')
    AND schemaname = 'public';

-- ========================================
-- TEST YOUR UPDATE NOW IN THE APP
-- ========================================
-- After testing, come back and run the re-enable script below

-- ========================================
-- RE-ENABLE RLS (RUN THIS AFTER TESTING!)
-- ========================================
-- Uncomment these lines after your test:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
-- 
-- SELECT 
--     tablename,
--     CASE 
--         WHEN rowsecurity THEN 'ENABLED ✅'
--         ELSE 'DISABLED ⚠️'
--     END as rls_status
-- FROM pg_tables 
-- WHERE tablename IN ('profiles', 'barbers')
--     AND schemaname = 'public';
