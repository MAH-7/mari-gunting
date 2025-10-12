-- Fix Row Level Security (RLS) policies for customer_addresses table

-- First, check if RLS is enabled and temporarily disable to clean up
ALTER TABLE customer_addresses DISABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Users can insert own addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON customer_addresses;
DROP POLICY IF EXISTS "customer_addresses_policy" ON customer_addresses;

-- Re-enable RLS
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for authenticated users
-- Policy 1: Users can view their own addresses
CREATE POLICY "Users can view own addresses" ON customer_addresses
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own addresses
CREATE POLICY "Users can insert own addresses" ON customer_addresses
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own addresses  
CREATE POLICY "Users can update own addresses" ON customer_addresses
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own addresses
CREATE POLICY "Users can delete own addresses" ON customer_addresses
    FOR DELETE
    USING (auth.uid() = user_id);

-- Also ensure the function has proper permissions
-- Grant usage on the schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on the table
GRANT ALL ON customer_addresses TO authenticated;
GRANT SELECT ON customer_addresses TO anon;

-- Grant permissions on sequences (for auto-incrementing IDs if any)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Verify RLS is properly configured
DO $$ 
BEGIN
    RAISE NOTICE 'RLS Status for customer_addresses: %', 
        (SELECT relrowsecurity FROM pg_class WHERE relname = 'customer_addresses');
    
    RAISE NOTICE 'Policies created: %', 
        (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'customer_addresses');
END $$;