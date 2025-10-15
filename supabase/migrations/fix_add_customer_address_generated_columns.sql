-- Fix add_customer_address to not insert into generated columns (latitude/longitude)
-- Instead, use the location geometry column

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
  v_location GEOMETRY;
BEGIN
  -- If this is set as default, unset other defaults
  IF p_is_default THEN
    UPDATE customer_addresses
    SET is_default = FALSE
    WHERE user_id = p_customer_id
      AND is_default = TRUE;
  END IF;

  -- Create geometry point from lat/lng if provided
  IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
    v_location := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326);
  END IF;

  -- Insert new address (exclude latitude/longitude as they are generated columns)
  INSERT INTO customer_addresses (
    user_id,
    label,
    address_line1,
    address_line2,
    city,
    state,
    postal_code,
    location,  -- Use location geography instead of lat/lng
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
    v_location,  -- Pass geography point
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

COMMENT ON FUNCTION add_customer_address IS 'Adds a new customer address using location geometry (lat/lng are auto-generated)';
