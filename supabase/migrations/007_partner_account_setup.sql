-- =====================================================
-- PARTNER ACCOUNT SETUP FUNCTIONS
-- Handles finalizing partner account type after selection
-- =====================================================

-- Function to setup freelance barber account
CREATE OR REPLACE FUNCTION setup_freelance_barber(
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_barber_id UUID;
  v_result JSONB;
BEGIN
  -- Verify user exists and has barber role
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_user_id 
    AND role = 'barber'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found or not a barber'
    );
  END IF;

  -- Check if barber record already exists
  IF EXISTS (SELECT 1 FROM barbers WHERE user_id = p_user_id) THEN
    -- Return existing barber
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
$$;

-- Function to setup barbershop owner account
CREATE OR REPLACE FUNCTION setup_barbershop_owner(
  p_user_id UUID,
  p_shop_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_barbershop_id UUID;
  v_result JSONB;
BEGIN
  -- Verify user exists
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_user_id 
    AND role IN ('barber', 'barbershop_owner')
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found or invalid role'
    );
  END IF;

  -- Update user role to barbershop_owner if not already
  UPDATE profiles
  SET 
    role = 'barbershop_owner',
    updated_at = NOW()
  WHERE id = p_user_id
  AND role != 'barbershop_owner';

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
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION setup_freelance_barber(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION setup_barbershop_owner(UUID, TEXT) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION setup_freelance_barber IS 'Creates barber record for freelance barber account type';
COMMENT ON FUNCTION setup_barbershop_owner IS 'Updates role to barbershop_owner and creates barbershop record';
