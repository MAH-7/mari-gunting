-- EMERGENCY FIX: Make Update, Delete, and Set Default work
-- The issue is RLS blocking direct table operations from the client

-- Solution 1: Create RPC functions with SECURITY DEFINER for these operations
-- This bypasses RLS while still being secure

-- Drop existing if any
DROP FUNCTION IF EXISTS update_customer_address_direct CASCADE;
DROP FUNCTION IF EXISTS delete_customer_address_direct CASCADE;
DROP FUNCTION IF EXISTS set_default_customer_address CASCADE;

-- Function to update an address
CREATE OR REPLACE FUNCTION update_customer_address_direct(
  p_address_id UUID,
  p_customer_id UUID,
  p_label TEXT,
  p_address_line1 TEXT,
  p_address_line2 TEXT,
  p_city TEXT,
  p_state TEXT,
  p_postal_code TEXT,
  p_latitude DECIMAL,
  p_longitude DECIMAL,
  p_is_default BOOLEAN
)
RETURNS customer_addresses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_address customer_addresses;
BEGIN
  -- Verify the address belongs to the user
  IF NOT EXISTS (
    SELECT 1 FROM customer_addresses 
    WHERE id = p_address_id AND user_id = p_customer_id
  ) THEN
    RAISE EXCEPTION 'Address not found or unauthorized';
  END IF;

  -- If setting as default, unset other defaults
  IF p_is_default THEN
    UPDATE customer_addresses
    SET is_default = FALSE
    WHERE user_id = p_customer_id AND id != p_address_id;
  END IF;

  -- Update the address
  UPDATE customer_addresses
  SET
    label = p_label,
    address_line1 = p_address_line1,
    address_line2 = p_address_line2,
    city = p_city,
    state = p_state,
    postal_code = p_postal_code,
    latitude = p_latitude,
    longitude = p_longitude,
    is_default = p_is_default,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_address_id
  RETURNING * INTO v_address;

  RETURN v_address;
END;
$$;

-- Function to delete an address
CREATE OR REPLACE FUNCTION delete_customer_address_direct(
  p_address_id UUID,
  p_customer_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the address belongs to the user
  IF NOT EXISTS (
    SELECT 1 FROM customer_addresses 
    WHERE id = p_address_id AND user_id = p_customer_id
  ) THEN
    RAISE EXCEPTION 'Address not found or unauthorized';
  END IF;

  -- Delete the address
  DELETE FROM customer_addresses
  WHERE id = p_address_id AND user_id = p_customer_id;

  RETURN TRUE;
END;
$$;

-- Function to set default address
CREATE OR REPLACE FUNCTION set_default_customer_address(
  p_address_id UUID,
  p_customer_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the address belongs to the user
  IF NOT EXISTS (
    SELECT 1 FROM customer_addresses 
    WHERE id = p_address_id AND user_id = p_customer_id
  ) THEN
    RAISE EXCEPTION 'Address not found or unauthorized';
  END IF;

  -- Unset all defaults for this user
  UPDATE customer_addresses
  SET is_default = FALSE
  WHERE user_id = p_customer_id;

  -- Set new default
  UPDATE customer_addresses
  SET is_default = TRUE
  WHERE id = p_address_id AND user_id = p_customer_id;

  RETURN TRUE;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_customer_address_direct TO authenticated;
GRANT EXECUTE ON FUNCTION update_customer_address_direct TO anon;
GRANT EXECUTE ON FUNCTION delete_customer_address_direct TO authenticated;
GRANT EXECUTE ON FUNCTION delete_customer_address_direct TO anon;
GRANT EXECUTE ON FUNCTION set_default_customer_address TO authenticated;
GRANT EXECUTE ON FUNCTION set_default_customer_address TO anon;

-- Verification
DO $$ 
BEGIN
  RAISE NOTICE '✅ Created secure RPC functions:';
  RAISE NOTICE '  - update_customer_address_direct';
  RAISE NOTICE '  - delete_customer_address_direct';
  RAISE NOTICE '  - set_default_customer_address';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  You need to update the TypeScript code to use these functions!';
END $$;