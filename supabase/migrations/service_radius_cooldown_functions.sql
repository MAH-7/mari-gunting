-- =====================================================
-- Service Radius Cooldown Functions
-- These functions run on the server side to prevent 
-- client-side clock manipulation bypassing the cooldown
-- =====================================================

-- Function: Check if barber can change service radius
-- Returns: can_change (boolean), hours_remaining (integer), last_changed_at (timestamp)
CREATE OR REPLACE FUNCTION check_radius_cooldown(barber_id UUID)
RETURNS TABLE(
  can_change BOOLEAN,
  hours_remaining INTEGER,
  last_changed_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_changed TIMESTAMPTZ;
  v_hours_since_change NUMERIC;
BEGIN
  -- Fetch last radius change timestamp
  SELECT last_radius_change_at 
  INTO v_last_changed
  FROM barbers 
  WHERE id = barber_id;
  
  -- If barber not found, return cannot change
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  -- If never changed (NULL), can change anytime
  IF v_last_changed IS NULL THEN
    RETURN QUERY SELECT true, 0, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  -- Calculate hours since last change using server time (NOW())
  v_hours_since_change := EXTRACT(EPOCH FROM (NOW() - v_last_changed)) / 3600;
  
  -- Check if 24 hours have passed
  IF v_hours_since_change >= 24 THEN
    RETURN QUERY SELECT true, 0, v_last_changed;
  ELSE
    -- Calculate remaining hours (rounded up)
    RETURN QUERY SELECT 
      false, 
      CEIL(24 - v_hours_since_change)::INTEGER, 
      v_last_changed;
  END IF;
END;
$$;

-- Function: Update service radius with server-side timestamp
-- This ensures the timestamp is set using the server's clock, not the client's
CREATE OR REPLACE FUNCTION update_service_radius(
  barber_id UUID,
  new_radius INTEGER
)
RETURNS TABLE(
  success BOOLEAN,
  service_radius_km INTEGER,
  last_radius_change_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_can_change BOOLEAN;
  v_hours_remaining INTEGER;
  v_last_changed TIMESTAMPTZ;
BEGIN
  -- Check cooldown using server-side function
  SELECT cc.can_change, cc.hours_remaining, cc.last_changed_at
  INTO v_can_change, v_hours_remaining, v_last_changed
  FROM check_radius_cooldown(barber_id) cc;
  
  -- If cooldown is still active, return failure
  IF NOT v_can_change THEN
    RETURN QUERY SELECT false, NULL::INTEGER, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  -- Validate radius range (1-20 km)
  IF new_radius < 1 OR new_radius > 20 THEN
    RETURN QUERY SELECT false, NULL::INTEGER, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  -- Update with server-side NOW() timestamp
  UPDATE barbers
  SET 
    service_radius_km = new_radius,
    last_radius_change_at = NOW(),  -- Server time, not client time!
    updated_at = NOW()
  WHERE id = barber_id;
  
  -- Return success with updated values
  RETURN QUERY 
    SELECT 
      true,
      new_radius,
      NOW()
    FROM barbers 
    WHERE id = barber_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_radius_cooldown(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_service_radius(UUID, INTEGER) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION check_radius_cooldown IS 
'Checks if a barber can change their service radius based on 24-hour cooldown. 
Uses server-side time (NOW()) to prevent client-side clock manipulation.';

COMMENT ON FUNCTION update_service_radius IS 
'Updates barber service radius with server-side timestamp (NOW()).
Validates cooldown and radius range before updating.
Prevents client-side clock manipulation.';
