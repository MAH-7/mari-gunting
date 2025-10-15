-- Migration: Fix update_customer_address to not update generated columns
-- Created: 2025-01-15
-- Purpose: Remove latitude/longitude from UPDATE since they are generated columns

-- Drop all existing versions of the function first
DROP FUNCTION IF EXISTS update_customer_address(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DECIMAL, DECIMAL, BOOLEAN, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS update_customer_address(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DECIMAL, DECIMAL, BOOLEAN);
DROP FUNCTION IF EXISTS update_customer_address;

-- Create the new version
CREATE OR REPLACE FUNCTION update_customer_address(
  p_address_id UUID,
  p_label TEXT DEFAULT NULL,
  p_address_line1 TEXT DEFAULT NULL,
  p_address_line2 TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_postal_code TEXT DEFAULT NULL,
  p_latitude DECIMAL DEFAULT NULL,  -- Accept but ignore
  p_longitude DECIMAL DEFAULT NULL,  -- Accept but ignore
  p_is_default BOOLEAN DEFAULT NULL,
  p_building_name TEXT DEFAULT NULL,
  p_floor TEXT DEFAULT NULL,
  p_unit_number TEXT DEFAULT NULL,
  p_delivery_instructions TEXT DEFAULT NULL,
  p_contact_number TEXT DEFAULT NULL,
  p_address_type TEXT DEFAULT NULL,
  p_landmark TEXT DEFAULT NULL
)
RETURNS customer_addresses
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_address customer_addresses;
  v_user_id UUID;
BEGIN
  -- Get user_id for this address
  SELECT user_id INTO v_user_id
  FROM customer_addresses
  WHERE id = p_address_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Address not found';
  END IF;

  -- If setting as default, unset other defaults
  IF p_is_default THEN
    UPDATE customer_addresses
    SET is_default = FALSE
    WHERE user_id = v_user_id
      AND is_default = TRUE
      AND id != p_address_id;
  END IF;

  -- Update address (WITHOUT latitude/longitude since they're generated columns)
  UPDATE customer_addresses
  SET
    label = COALESCE(p_label, label),
    address_line1 = COALESCE(p_address_line1, address_line1),
    address_line2 = COALESCE(p_address_line2, address_line2),
    city = COALESCE(p_city, city),
    state = COALESCE(p_state, state),
    postal_code = COALESCE(p_postal_code, postal_code),
    -- ❌ Removed latitude/longitude updates - they are generated columns!
    is_default = COALESCE(p_is_default, is_default),
    building_name = COALESCE(p_building_name, building_name),
    floor = COALESCE(p_floor, floor),
    unit_number = COALESCE(p_unit_number, unit_number),
    delivery_instructions = COALESCE(p_delivery_instructions, delivery_instructions),
    contact_number = COALESCE(p_contact_number, contact_number),
    address_type = COALESCE(p_address_type, address_type),
    landmark = COALESCE(p_landmark, landmark),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_address_id
  RETURNING * INTO v_address;

  RETURN v_address;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_customer_address TO authenticated;

COMMENT ON FUNCTION update_customer_address IS 'Update customer address. Note: latitude/longitude are generated columns and cannot be updated directly - they are automatically computed from the location geography column.';
