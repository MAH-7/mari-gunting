-- ============================================
-- Fix update_customer_address to accept location updates
-- ============================================
-- This migration updates the update_customer_address function
-- to accept latitude/longitude parameters and update the 
-- location geography column (which auto-generates lat/lng)
-- ============================================

CREATE OR REPLACE FUNCTION public.update_customer_address(
  p_address_id uuid, 
  p_label text DEFAULT NULL::text, 
  p_address_line1 text DEFAULT NULL::text, 
  p_address_line2 text DEFAULT NULL::text, 
  p_city text DEFAULT NULL::text, 
  p_state text DEFAULT NULL::text, 
  p_postal_code text DEFAULT NULL::text, 
  p_latitude numeric DEFAULT NULL::numeric, 
  p_longitude numeric DEFAULT NULL::numeric, 
  p_is_default boolean DEFAULT NULL::boolean, 
  p_building_name text DEFAULT NULL::text, 
  p_floor text DEFAULT NULL::text, 
  p_unit_number text DEFAULT NULL::text, 
  p_delivery_instructions text DEFAULT NULL::text, 
  p_contact_number text DEFAULT NULL::text, 
  p_address_type text DEFAULT NULL::text, 
  p_landmark text DEFAULT NULL::text
)
RETURNS customer_addresses
LANGUAGE plpgsql
AS $function$
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

  -- Update address
  -- ✅ Now updates the location geography column when lat/lng are provided
  UPDATE customer_addresses
  SET
    label = COALESCE(p_label, label),
    address_line1 = COALESCE(p_address_line1, address_line1),
    address_line2 = COALESCE(p_address_line2, address_line2),
    city = COALESCE(p_city, city),
    state = COALESCE(p_state, state),
    postal_code = COALESCE(p_postal_code, postal_code),
    -- ✅ Update location geography if lat/lng provided
    -- The latitude/longitude generated columns will auto-update
    location = CASE 
      WHEN p_latitude IS NOT NULL AND p_longitude IS NOT NULL 
      THEN ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
      ELSE location
    END,
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
$function$;

-- ============================================
-- Verify the function was updated
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ update_customer_address function updated to accept location changes';
  RAISE NOTICE '📍 Now updates the location geography column when latitude/longitude are provided';
  RAISE NOTICE '🔄 The latitude/longitude generated columns will auto-update from location';
END $$;
