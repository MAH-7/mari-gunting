-- ============================================
-- Fix add_customer_address Function
-- Add all Grab-style parameters
-- ============================================

CREATE OR REPLACE FUNCTION public.add_customer_address(
  p_user_id uuid,
  p_label text,
  p_address_line1 text,
  p_city text,
  p_state text,
  p_address_line2 text DEFAULT NULL,
  p_postal_code text DEFAULT NULL,
  p_latitude double precision DEFAULT NULL,
  p_longitude double precision DEFAULT NULL,
  p_is_default boolean DEFAULT false,
  -- Grab-style enhanced fields
  p_building_name text DEFAULT NULL,
  p_floor text DEFAULT NULL,
  p_unit_number text DEFAULT NULL,
  p_delivery_instructions text DEFAULT NULL,
  p_contact_number text DEFAULT NULL,
  p_address_type text DEFAULT 'other',
  p_landmark text DEFAULT NULL,
  p_gps_accuracy double precision DEFAULT NULL
)
RETURNS TABLE(address_id uuid, message text)
LANGUAGE plpgsql
AS $$
DECLARE
  v_address_id UUID;
  v_location GEOGRAPHY;
BEGIN
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
  
  -- Insert address with all fields
  INSERT INTO customer_addresses (
    user_id,
    label,
    address_line1,
    address_line2,
    city,
    state,
    postal_code,
    location,
    is_default,
    building_name,
    floor,
    unit_number,
    delivery_instructions,
    contact_number,
    address_type,
    landmark,
    gps_accuracy
  ) VALUES (
    p_user_id,
    p_label,
    p_address_line1,
    p_address_line2,
    p_city,
    p_state,
    p_postal_code,
    v_location,
    p_is_default,
    p_building_name,
    p_floor,
    p_unit_number,
    p_delivery_instructions,
    p_contact_number,
    p_address_type,
    p_landmark,
    p_gps_accuracy
  )
  RETURNING id INTO v_address_id;
  
  RETURN QUERY SELECT v_address_id, 'Address added successfully'::TEXT;
END;
$$;
