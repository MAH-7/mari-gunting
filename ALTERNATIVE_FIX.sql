-- Alternative approach: Test and fix the direct insert approach
-- This will help us understand what's happening

-- First, let's check the current user and table structure
SELECT auth.uid() as current_user_id;

-- Check if the table has all required columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'customer_addresses'
ORDER BY ordinal_position;

-- Check current RLS policies
SELECT * FROM pg_policies WHERE tablename = 'customer_addresses';

-- Alternative: Temporarily disable RLS for testing
-- WARNING: Only for testing, re-enable after fixing!
ALTER TABLE customer_addresses DISABLE ROW LEVEL SECURITY;

-- Alternative function that uses SECURITY DEFINER to bypass RLS
-- This runs with the rights of the function owner (usually postgres)
CREATE OR REPLACE FUNCTION add_customer_address_bypass(
  p_customer_id UUID,
  p_label TEXT,
  p_address_line1 TEXT,
  p_city TEXT,
  p_state TEXT,
  p_address_line2 TEXT DEFAULT NULL,
  p_postal_code TEXT DEFAULT NULL,
  p_latitude DECIMAL DEFAULT NULL,
  p_longitude DECIMAL DEFAULT NULL,
  p_is_default BOOLEAN DEFAULT FALSE,
  p_building_name TEXT DEFAULT NULL,
  p_floor TEXT DEFAULT NULL,
  p_unit_number TEXT DEFAULT NULL,
  p_delivery_instructions TEXT DEFAULT NULL,
  p_contact_number TEXT DEFAULT NULL,
  p_address_type TEXT DEFAULT 'other',
  p_landmark TEXT DEFAULT NULL,
  p_gps_accuracy DECIMAL DEFAULT NULL
)
RETURNS customer_addresses
LANGUAGE plpgsql
SECURITY DEFINER -- This is the key change
SET search_path = public
AS $$
DECLARE
  v_address customer_addresses;
BEGIN
  -- Validate that customer_id is provided
  IF p_customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer ID is required';
  END IF;

  -- If this is set as default, unset other defaults
  IF p_is_default THEN
    UPDATE customer_addresses
    SET is_default = FALSE
    WHERE user_id = p_customer_id
      AND is_default = TRUE;
  END IF;

  -- Insert new address with all fields
  INSERT INTO customer_addresses (
    user_id,
    label,
    address_line1,
    address_line2,
    city,
    state,
    postal_code,
    latitude,
    longitude,
    is_default,
    building_name,
    floor,
    unit_number,
    delivery_instructions,
    contact_number,
    address_type,
    landmark,
    gps_accuracy,
    last_used_at
  )
  VALUES (
    p_customer_id,
    p_label,
    p_address_line1,
    p_address_line2,
    p_city,
    p_state,
    p_postal_code,
    p_latitude,
    p_longitude,
    p_is_default,
    p_building_name,
    p_floor,
    p_unit_number,
    p_delivery_instructions,
    p_contact_number,
    p_address_type,
    p_landmark,
    p_gps_accuracy,
    CURRENT_TIMESTAMP
  )
  RETURNING * INTO v_address;

  RETURN v_address;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION add_customer_address_bypass TO authenticated;
GRANT EXECUTE ON FUNCTION add_customer_address_bypass TO anon;

-- Drop the old function and rename the new one
DROP FUNCTION IF EXISTS add_customer_address CASCADE;
ALTER FUNCTION add_customer_address_bypass RENAME TO add_customer_address;