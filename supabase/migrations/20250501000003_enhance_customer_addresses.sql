-- Migration: Enhance customer_addresses table with Grab-style fields
-- Created: 2025-05-01
-- Purpose: Add building details, delivery instructions, address types, and other critical fields

-- Add new columns to customer_addresses table
ALTER TABLE customer_addresses
ADD COLUMN IF NOT EXISTS building_name TEXT,
ADD COLUMN IF NOT EXISTS floor TEXT,
ADD COLUMN IF NOT EXISTS unit_number TEXT,
ADD COLUMN IF NOT EXISTS delivery_instructions TEXT,
ADD COLUMN IF NOT EXISTS contact_number TEXT,
ADD COLUMN IF NOT EXISTS address_type TEXT DEFAULT 'other' CHECK (address_type IN ('home', 'work', 'apartment', 'office', 'other')),
ADD COLUMN IF NOT EXISTS landmark TEXT,
ADD COLUMN IF NOT EXISTS gps_accuracy DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP;

-- Add comment to table
COMMENT ON COLUMN customer_addresses.building_name IS 'Building or complex name for apartments/offices';
COMMENT ON COLUMN customer_addresses.floor IS 'Floor number or level';
COMMENT ON COLUMN customer_addresses.unit_number IS 'Unit, suite, or apartment number';
COMMENT ON COLUMN customer_addresses.delivery_instructions IS 'Special instructions for delivery/barber';
COMMENT ON COLUMN customer_addresses.contact_number IS 'Contact phone number for this address';
COMMENT ON COLUMN customer_addresses.address_type IS 'Type of address: home, work, apartment, office, other';
COMMENT ON COLUMN customer_addresses.landmark IS 'Nearby landmark for easier location';
COMMENT ON COLUMN customer_addresses.gps_accuracy IS 'GPS accuracy in meters when address was selected';
COMMENT ON COLUMN customer_addresses.last_used_at IS 'Last time this address was used for a booking';

-- Create index for quick Home/Work lookup (most commonly used)
CREATE INDEX IF NOT EXISTS idx_customer_addresses_type 
ON customer_addresses(customer_id, address_type) 
WHERE address_type IN ('home', 'work');

-- Create index for recent addresses (for showing recent locations)
CREATE INDEX IF NOT EXISTS idx_customer_addresses_last_used 
ON customer_addresses(customer_id, last_used_at DESC NULLS LAST);

-- Create index for searching addresses
CREATE INDEX IF NOT EXISTS idx_customer_addresses_search 
ON customer_addresses USING gin(
  to_tsvector('english', 
    coalesce(label, '') || ' ' ||
    coalesce(address_line1, '') || ' ' ||
    coalesce(address_line2, '') || ' ' ||
    coalesce(city, '') || ' ' ||
    coalesce(building_name, '') || ' ' ||
    coalesce(landmark, '')
  )
);

-- Update RPC function to include new fields
CREATE OR REPLACE FUNCTION add_customer_address(
  p_customer_id UUID,
  p_label TEXT,
  p_address_line1 TEXT,
  p_address_line2 TEXT DEFAULT NULL,
  p_city TEXT,
  p_state TEXT,
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
    WHERE customer_id = p_customer_id
      AND is_default = TRUE;
  END IF;

  -- Insert new address
  INSERT INTO customer_addresses (
    customer_id,
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
GRANT EXECUTE ON FUNCTION add_customer_address TO authenticated;

-- Update existing update function to include new fields
CREATE OR REPLACE FUNCTION update_customer_address(
  p_address_id UUID,
  p_label TEXT DEFAULT NULL,
  p_address_line1 TEXT DEFAULT NULL,
  p_address_line2 TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
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
  p_landmark TEXT DEFAULT NULL
)
RETURNS customer_addresses
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_address customer_addresses;
  v_customer_id UUID;
BEGIN
  -- Get customer_id for this address
  SELECT customer_id INTO v_customer_id
  FROM customer_addresses
  WHERE id = p_address_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Address not found';
  END IF;

  -- If setting as default, unset other defaults
  IF p_is_default THEN
    UPDATE customer_addresses
    SET is_default = FALSE
    WHERE customer_id = v_customer_id
      AND is_default = TRUE
      AND id != p_address_id;
  END IF;

  -- Update address
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
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_address_id
  RETURNING * INTO v_address;

  RETURN v_address;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_customer_address TO authenticated;

-- Function to update last_used_at (call when address is used in a booking)
CREATE OR REPLACE FUNCTION mark_address_as_used(p_address_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  UPDATE customer_addresses
  SET last_used_at = CURRENT_TIMESTAMP
  WHERE id = p_address_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION mark_address_as_used TO authenticated;

-- Function to get recent addresses
CREATE OR REPLACE FUNCTION get_recent_addresses(p_customer_id UUID, p_limit INT DEFAULT 5)
RETURNS SETOF customer_addresses
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM customer_addresses
  WHERE customer_id = p_customer_id
    AND last_used_at IS NOT NULL
  ORDER BY last_used_at DESC
  LIMIT p_limit;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_recent_addresses TO authenticated;
