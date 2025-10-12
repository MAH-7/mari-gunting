-- Complete Migration: Add ALL missing columns to customer_addresses table
-- This includes latitude/longitude and all the new enhancement fields

-- First, let's add the core geolocation columns if they don't exist
ALTER TABLE customer_addresses
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Then add all the enhancement columns
ALTER TABLE customer_addresses
ADD COLUMN IF NOT EXISTS building_name TEXT,
ADD COLUMN IF NOT EXISTS floor TEXT,
ADD COLUMN IF NOT EXISTS unit_number TEXT,
ADD COLUMN IF NOT EXISTS delivery_instructions TEXT,
ADD COLUMN IF NOT EXISTS contact_number TEXT,
ADD COLUMN IF NOT EXISTS address_type TEXT DEFAULT 'other',
ADD COLUMN IF NOT EXISTS landmark TEXT,
ADD COLUMN IF NOT EXISTS gps_accuracy DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP;

-- Add the is_default column if missing
ALTER TABLE customer_addresses
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- Add constraint for address_type
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'customer_addresses_address_type_check'
  ) THEN
    ALTER TABLE customer_addresses 
    ADD CONSTRAINT customer_addresses_address_type_check 
    CHECK (address_type IN ('home', 'work', 'apartment', 'office', 'other'));
  END IF;
END $$;

-- Create index for quick Home/Work lookup
CREATE INDEX IF NOT EXISTS idx_customer_addresses_type 
ON customer_addresses(user_id, address_type) 
WHERE address_type IN ('home', 'work');

-- Create index for recent addresses
CREATE INDEX IF NOT EXISTS idx_customer_addresses_last_used 
ON customer_addresses(user_id, last_used_at DESC NULLS LAST);

-- Create geospatial index for latitude/longitude queries
CREATE INDEX IF NOT EXISTS idx_customer_addresses_geo 
ON customer_addresses(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Drop any existing versions of the function
DROP FUNCTION IF EXISTS add_customer_address CASCADE;

-- Create the complete RPC function with ALL parameters
CREATE OR REPLACE FUNCTION add_customer_address(
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
SECURITY INVOKER
AS $$
DECLARE
  v_address customer_addresses;
BEGIN
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION add_customer_address TO authenticated;
GRANT EXECUTE ON FUNCTION add_customer_address TO anon;

-- Let's also check/add an update function for existing addresses
CREATE OR REPLACE FUNCTION update_customer_address(
  p_address_id UUID,
  p_customer_id UUID,
  p_label TEXT DEFAULT NULL,
  p_address_line1 TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_address_line2 TEXT DEFAULT NULL,
  p_postal_code TEXT DEFAULT NULL,
  p_latitude DECIMAL DEFAULT NULL,
  p_longitude DECIMAL DEFAULT NULL,
  p_is_default BOOLEAN DEFAULT NULL,
  p_building_name TEXT DEFAULT NULL,
  p_floor TEXT DEFAULT NULL,
  p_unit_number TEXT DEFAULT NULL,
  p_delivery_instructions TEXT DEFAULT NULL,
  p_contact_number TEXT DEFAULT NULL,
  p_address_type TEXT DEFAULT NULL,
  p_landmark TEXT DEFAULT NULL,
  p_gps_accuracy DECIMAL DEFAULT NULL
)
RETURNS customer_addresses
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_address customer_addresses;
BEGIN
  -- If setting as default, unset other defaults first
  IF p_is_default = TRUE THEN
    UPDATE customer_addresses
    SET is_default = FALSE
    WHERE user_id = p_customer_id
      AND is_default = TRUE
      AND id != p_address_id;
  END IF;

  -- Update the address with provided values (only non-null values)
  UPDATE customer_addresses
  SET
    label = COALESCE(p_label, label),
    address_line1 = COALESCE(p_address_line1, address_line1),
    address_line2 = COALESCE(p_address_line2, address_line2),
    city = COALESCE(p_city, city),
    state = COALESCE(p_state, state),
    postal_code = COALESCE(p_postal_code, postal_code),
    latitude = COALESCE(p_latitude, latitude),
    longitude = COALESCE(p_longitude, longitude),
    is_default = COALESCE(p_is_default, is_default),
    building_name = COALESCE(p_building_name, building_name),
    floor = COALESCE(p_floor, floor),
    unit_number = COALESCE(p_unit_number, unit_number),
    delivery_instructions = COALESCE(p_delivery_instructions, delivery_instructions),
    contact_number = COALESCE(p_contact_number, contact_number),
    address_type = COALESCE(p_address_type, address_type),
    landmark = COALESCE(p_landmark, landmark),
    gps_accuracy = COALESCE(p_gps_accuracy, gps_accuracy),
    last_used_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_address_id AND user_id = p_customer_id
  RETURNING * INTO v_address;

  RETURN v_address;
END;
$$;

-- Grant permissions for update function
GRANT EXECUTE ON FUNCTION update_customer_address TO authenticated;
GRANT EXECUTE ON FUNCTION update_customer_address TO anon;