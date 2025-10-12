-- Fix customer_addresses RLS policies to work with RPC function calls
-- The issue: RPC functions run with definer privileges by default, 
-- so RLS policies using auth.uid() don't work properly

-- Drop existing RLS policies
DROP POLICY IF EXISTS customer_addresses_select ON customer_addresses;
DROP POLICY IF EXISTS customer_addresses_insert ON customer_addresses;
DROP POLICY IF EXISTS customer_addresses_update ON customer_addresses;
DROP POLICY IF EXISTS customer_addresses_delete ON customer_addresses;

-- Recreate the add_customer_address function with SECURITY INVOKER
-- This makes the function run with the caller's privileges, so RLS works correctly
CREATE OR REPLACE FUNCTION add_customer_address(
  p_user_id UUID,
  p_label TEXT,
  p_address_line1 TEXT,
  p_city TEXT,
  p_state TEXT,
  p_address_line2 TEXT DEFAULT NULL,
  p_postal_code TEXT DEFAULT NULL,
  p_latitude DOUBLE PRECISION DEFAULT NULL,
  p_longitude DOUBLE PRECISION DEFAULT NULL,
  p_is_default BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  address_id UUID,
  message TEXT
) 
SECURITY INVOKER  -- This is the key change!
AS $$
DECLARE
  v_address_id UUID;
  v_location GEOGRAPHY;
BEGIN
  -- Verify the user is authenticated and matches the user_id
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot add address for another user';
  END IF;
  
  -- If this is default, unset other defaults
  IF p_is_default THEN
    UPDATE customer_addresses
    SET is_default = FALSE
    WHERE user_id = p_user_id;
  END IF;
  
  -- Create location point if coordinates provided
  IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
    v_location := ST_MakePoint(p_longitude, p_latitude)::GEOGRAPHY;
  END IF;
  
  -- Insert address
  INSERT INTO customer_addresses (
    user_id, label, address_line1, address_line2,
    city, state, postal_code, location, is_default
  ) VALUES (
    p_user_id, p_label, p_address_line1, p_address_line2,
    p_city, p_state, p_postal_code, v_location, p_is_default
  )
  RETURNING id INTO v_address_id;
  
  RETURN QUERY SELECT v_address_id, 'Address added successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Recreate RLS policies with more permissive approach for authenticated users
-- Policy for SELECT: Users can view their own addresses
CREATE POLICY customer_addresses_select_policy ON customer_addresses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for INSERT: Users can insert their own addresses
CREATE POLICY customer_addresses_insert_policy ON customer_addresses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE: Users can update their own addresses
CREATE POLICY customer_addresses_update_policy ON customer_addresses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE: Users can delete their own addresses
CREATE POLICY customer_addresses_delete_policy ON customer_addresses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION add_customer_address TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_addresses TO authenticated;

-- Add comment
COMMENT ON FUNCTION add_customer_address IS 'Adds a new address for a customer (SECURITY INVOKER)';
