-- Fix toggle_online_status to update last_heartbeat when going online
-- This prevents the cron job from immediately setting barbers offline

CREATE OR REPLACE FUNCTION toggle_online_status(
  p_user_id UUID,
  new_status BOOLEAN,
  account_type TEXT DEFAULT 'freelance'
)
RETURNS TABLE (
  success BOOLEAN,
  is_online BOOLEAN,
  last_seen_at TIMESTAMPTZ,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_updated INTEGER;
  v_barber_updated INTEGER;
BEGIN
  -- Verify the user is updating their own record
  IF auth.uid() != p_user_id THEN
    RETURN QUERY SELECT 
      false, 
      NULL::BOOLEAN, 
      NULL::TIMESTAMPTZ,
      'Unauthorized: Cannot update another user''s status'::TEXT;
    RETURN;
  END IF;

  -- Update profiles table with server time
  UPDATE profiles
  SET 
    is_online = new_status,
    last_seen_at = NOW(),
    last_heartbeat = CASE WHEN new_status THEN NOW() ELSE last_heartbeat END, -- Update heartbeat only when going online
    updated_at = NOW()
  WHERE profiles.id = p_user_id;
  
  GET DIAGNOSTICS v_profile_updated = ROW_COUNT;
  
  -- If freelance, also update barbers table
  IF account_type = 'freelance' THEN
    UPDATE barbers
    SET 
      is_available = new_status,
      updated_at = NOW()
    WHERE barbers.user_id = p_user_id;
    
    GET DIAGNOSTICS v_barber_updated = ROW_COUNT;
  END IF;
  
  -- Return success
  IF v_profile_updated > 0 THEN
    RETURN QUERY 
      SELECT 
        true,
        new_status,
        NOW(),
        CASE 
          WHEN new_status THEN 'You''re online - customers can find you!'
          ELSE 'You''re offline - hidden from search'
        END::TEXT;
  ELSE
    RETURN QUERY SELECT 
      false,
      NULL::BOOLEAN,
      NULL::TIMESTAMPTZ,
      'Failed to update status'::TEXT;
  END IF;
END;
$$;

COMMENT ON FUNCTION toggle_online_status IS 'Toggle barber online/offline status and update heartbeat timestamp';
