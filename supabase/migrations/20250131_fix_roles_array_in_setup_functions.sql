-- Migration: Fix setup functions to properly handle roles array
-- Date: 2025-01-31
-- Description: Update setup_freelance_barber and setup_barbershop_owner to add roles to array

-- 1. Fix setup_freelance_barber to add 'barber' to roles array
CREATE OR REPLACE FUNCTION public.setup_freelance_barber(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_barber_id UUID;
  v_current_roles TEXT[];
BEGIN
  -- Verify user exists
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Get current roles array
  SELECT roles INTO v_current_roles FROM profiles WHERE id = p_user_id;
  
  -- Add 'barber' to roles array if not already present
  IF NOT ('barber' = ANY(v_current_roles)) THEN
    UPDATE profiles
    SET 
      roles = array_append(roles, 'barber'),
      role = 'barber', -- Update primary role for backward compatibility
      updated_at = NOW()
    WHERE id = p_user_id;
  ELSE
    -- Already has barber role, just update primary role
    UPDATE profiles
    SET 
      role = 'barber',
      updated_at = NOW()
    WHERE id = p_user_id;
  END IF;

  -- Check if barber record already exists
  IF EXISTS (SELECT 1 FROM barbers WHERE user_id = p_user_id) THEN
    SELECT id INTO v_barber_id FROM barbers WHERE user_id = p_user_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'barber_id', v_barber_id,
      'message', 'Barber account already exists'
    );
  END IF;

  -- Create barber record with defaults
  INSERT INTO barbers (
    user_id,
    verification_status,
    is_available,
    service_radius_km,
    rating,
    total_reviews,
    total_bookings,
    completed_bookings
  ) VALUES (
    p_user_id,
    'unverified',
    false, -- Not available until onboarding complete
    10,
    0.00,
    0,
    0,
    0
  )
  RETURNING id INTO v_barber_id;

  RETURN jsonb_build_object(
    'success', true,
    'barber_id', v_barber_id,
    'message', 'Freelance barber account created'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;

-- 2. Fix setup_barbershop_owner to add 'barbershop_owner' to roles array
CREATE OR REPLACE FUNCTION public.setup_barbershop_owner(p_user_id uuid, p_shop_name text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_barbershop_id UUID;
  v_current_roles TEXT[];
BEGIN
  -- Verify user exists
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Get current roles array
  SELECT roles INTO v_current_roles FROM profiles WHERE id = p_user_id;
  
  -- Add 'barbershop_owner' to roles array if not already present
  -- Also ensure 'barber' role is NOT in the array (business logic: barbershop owners don't also freelance)
  UPDATE profiles
  SET 
    roles = CASE 
      WHEN 'barbershop_owner' = ANY(roles) THEN roles
      ELSE array_append(array_remove(roles, 'barber'), 'barbershop_owner')
    END,
    role = 'barbershop_owner', -- Update primary role for backward compatibility
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Check if barbershop already exists
  IF EXISTS (SELECT 1 FROM barbershops WHERE owner_id = p_user_id) THEN
    SELECT id INTO v_barbershop_id FROM barbershops WHERE owner_id = p_user_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'barbershop_id', v_barbershop_id,
      'message', 'Barbershop account already exists'
    );
  END IF;

  -- Create placeholder barbershop record
  -- Will be completed during onboarding
  INSERT INTO barbershops (
    owner_id,
    name,
    address_line1,
    city,
    state,
    location,
    verification_status
  ) VALUES (
    p_user_id,
    COALESCE(p_shop_name, 'My Barbershop'), -- Placeholder name
    'To be updated', -- Placeholder address
    'To be updated',
    'To be updated',
    ST_SetSRID(ST_MakePoint(101.6869, 3.1390), 4326), -- Default to KL
    'unverified'
  )
  RETURNING id INTO v_barbershop_id;

  RETURN jsonb_build_object(
    'success', true,
    'barbershop_id', v_barbershop_id,
    'message', 'Barbershop owner account created'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;

-- Comment: These functions now properly handle the roles array
-- - setup_freelance_barber: Adds 'barber' to roles array (keeps 'customer' if exists)
-- - setup_barbershop_owner: Adds 'barbershop_owner' and removes 'barber' (business rule: no dual freelance + shop owner)
