-- Migration: Enhance customer_addresses table with Grab-style fields
-- CORRECTED VERSION - Uses user_id instead of customer_id

-- Add new columns to customer_addresses table
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

-- Create index for quick Home/Work lookup (most commonly used)
CREATE INDEX IF NOT EXISTS idx_customer_addresses_type 
ON customer_addresses(user_id, address_type) 
WHERE address_type IN ('home', 'work');

-- Create index for recent addresses
CREATE INDEX IF NOT EXISTS idx_customer_addresses_last_used 
ON customer_addresses(user_id, last_used_at DESC NULLS LAST);

-- Drop existing function first (there may be multiple overloaded versions)
DROP FUNCTION IF EXISTS add_customer_address CASCADE;

-- Update RPC function to include new fields
-- Note: Required parameters must come before optional ones
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

  -- Insert new address
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
GRANT EXECUTE ON FUNCTION add_customer_address TO authenticated;
GRANT EXECUTE ON FUNCTION add_customer_address TO anon;
