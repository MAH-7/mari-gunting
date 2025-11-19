-- Function to set user offline on force close (bypasses RLS)
-- Called by native Android service when app is swiped away
CREATE OR REPLACE FUNCTION force_close_set_offline(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with function owner's permissions (bypasses RLS)
AS $$
BEGIN
  -- Set user offline in profiles table
  UPDATE profiles
  SET 
    is_online = false,
    last_seen_at = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Also set unavailable in barbers table (for freelance barbers)
  UPDATE barbers
  SET 
    is_available = false,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Return true if profile was updated
  RETURN FOUND;
END;
$$;

-- Grant execute to anon (so native code can call it)
GRANT EXECUTE ON FUNCTION force_close_set_offline(UUID) TO anon;
GRANT EXECUTE ON FUNCTION force_close_set_offline(UUID) TO authenticated;

COMMENT ON FUNCTION force_close_set_offline IS 
'Sets user offline when app is force closed. Called by native Android service. Bypasses RLS with SECURITY DEFINER.';
