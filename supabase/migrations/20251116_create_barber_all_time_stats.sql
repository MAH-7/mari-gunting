-- Migration: Create RPC function for barber all-time statistics
-- Purpose: Get accurate total completed jobs and acceptance rate from database
-- Date: 2025-11-16

-- =====================================================
-- Function: Get All-Time Stats
-- =====================================================
CREATE OR REPLACE FUNCTION get_barber_all_time_stats(
  p_barber_id UUID
)
RETURNS TABLE (
  total_completed INTEGER,
  total_accepted INTEGER,
  total_rejected INTEGER,
  total_expired INTEGER,
  acceptance_rate INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_completed INTEGER;
  v_total_accepted INTEGER;
  v_total_rejected INTEGER;
  v_total_expired INTEGER;
  v_total_requests INTEGER;
  v_acceptance_rate INTEGER;
BEGIN
  -- Count completed bookings
  SELECT COUNT(*)::INTEGER INTO v_total_completed
  FROM bookings
  WHERE barber_id = p_barber_id
    AND status = 'completed';
  
  -- Count accepted bookings (accepted + active + completed)
  SELECT COUNT(*)::INTEGER INTO v_total_accepted
  FROM bookings
  WHERE barber_id = p_barber_id
    AND status IN ('accepted', 'on_the_way', 'arrived', 'in_progress', 'completed');
  
  -- Count rejected bookings
  SELECT COUNT(*)::INTEGER INTO v_total_rejected
  FROM bookings
  WHERE barber_id = p_barber_id
    AND status = 'rejected';
  
  -- Count expired bookings
  SELECT COUNT(*)::INTEGER INTO v_total_expired
  FROM bookings
  WHERE barber_id = p_barber_id
    AND status = 'expired';
  
  -- Calculate acceptance rate
  v_total_requests := v_total_accepted + v_total_rejected + v_total_expired;
  
  IF v_total_requests > 0 THEN
    v_acceptance_rate := ROUND((v_total_accepted::NUMERIC / v_total_requests::NUMERIC) * 100)::INTEGER;
  ELSE
    v_acceptance_rate := 100; -- Default 100% if no requests yet
  END IF;
  
  -- Return single row with all stats
  RETURN QUERY
  SELECT 
    v_total_completed,
    v_total_accepted,
    v_total_rejected,
    v_total_expired,
    v_acceptance_rate;
END;
$$;

-- =====================================================
-- Grant Execute Permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION get_barber_all_time_stats(UUID) TO authenticated;

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON FUNCTION get_barber_all_time_stats IS 'Get barber all-time statistics including total completed jobs and acceptance rate';
