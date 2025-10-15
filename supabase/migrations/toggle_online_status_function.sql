-- =====================================================
-- Server-Side Function: Toggle Online/Offline Status
-- Uses server time (NOW()) to prevent client-side issues
-- =====================================================

-- Function to toggle online status for a user
CREATE OR REPLACE FUNCTION toggle_online_status(
  p_user_id UUID,
  new_status BOOLEAN,
  account_type TEXT DEFAULT 'freelance'
)
RETURNS TABLE(
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
    last_seen_at = NOW(),  -- Server time!
    updated_at = NOW()
  WHERE profiles.id = p_user_id;
  
  -- Check if profile was updated
  GET DIAGNOSTICS v_profile_updated = ROW_COUNT;
  
  -- If freelance, also update barbers table
  IF account_type = 'freelance' THEN
    UPDATE barbers
    SET 
      is_available = new_status,
      updated_at = NOW()
    WHERE barbers.user_id = p_user_id;
    
    -- Check if barber was updated
    GET DIAGNOSTICS v_barber_updated = ROW_COUNT;
  END IF;
  
  -- Return success with updated values
  IF v_profile_updated THEN
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION toggle_online_status(UUID, BOOLEAN, TEXT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION toggle_online_status IS 
'Toggles user online/offline status using server-side time (NOW()). 
Updates both profiles.is_online and barbers.is_available (for freelance accounts).
Prevents client-side clock manipulation.';

-- =====================================================
-- Test the function
-- =====================================================

-- Example usage (replace with your actual user_id):
-- SELECT * FROM toggle_online_status('your-user-id-here', true, 'freelance');
