-- Fix update_tracking_metrics to include on_the_way and arrived statuses
-- Previously only worked for accepted, confirmed, in_progress
-- This caused tracking to not update distance/ETA when barber is on_the_way or arrived

CREATE OR REPLACE FUNCTION update_tracking_metrics(
  p_booking_id UUID,
  p_distance_km NUMERIC,
  p_eta_minutes INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE bookings
  SET
    tracking_last_updated_at = NOW(),
    current_distance_km = p_distance_km,
    current_eta_minutes = p_eta_minutes,
    estimated_arrival_time = NOW() + (p_eta_minutes || ' minutes')::INTERVAL
  WHERE id = p_booking_id
    AND status IN ('accepted', 'on_the_way', 'arrived', 'in_progress');
END;
$$;

COMMENT ON FUNCTION update_tracking_metrics IS 'Updates real-time tracking metrics (distance, ETA) for active bookings. Called by partner app location service.';
