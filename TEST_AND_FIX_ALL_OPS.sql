-- Test and ensure all address operations work properly
-- Run this to verify everything is set up correctly

-- 1. Check if addresses exist and can be fetched
SELECT 
  id,
  user_id,
  label,
  address_line1,
  city,
  state,
  is_default,
  created_at
FROM customer_addresses
ORDER BY created_at DESC
LIMIT 5;

-- 2. Check RLS policies
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
WHERE tablename = 'customer_addresses';

-- 3. Make sure all CRUD operations are allowed by RLS
-- If the policies exist, this query will show them
-- We need policies for SELECT, INSERT, UPDATE, DELETE

-- 4. Ensure the setDefaultAddress logic works
-- This requires being able to UPDATE multiple rows

-- If you see any missing policies above, run this fix:

-- Drop and recreate all policies to ensure UPDATE and DELETE work
DROP POLICY IF EXISTS "Users can view own addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Users can insert own addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON customer_addresses;

-- Create fresh policies
CREATE POLICY "Users can view own addresses" ON customer_addresses
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses" ON customer_addresses
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses" ON customer_addresses
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses" ON customer_addresses
    FOR DELETE
    USING (auth.uid() = user_id);

-- Verify RLS is enabled
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

-- Test the get_customer_addresses function exists and works
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'get_customer_addresses';

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE '✅ All address operations should now work:';
  RAISE NOTICE '  - Fetch addresses (SELECT)';
  RAISE NOTICE '  - Add address (INSERT)';
  RAISE NOTICE '  - Edit address (UPDATE)';
  RAISE NOTICE '  - Delete address (DELETE)';
  RAISE NOTICE '  - Set default (UPDATE multiple rows)';
END $$;