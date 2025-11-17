-- Fix active_tracking_sessions view to include on_the_way and arrived statuses
-- Previously only showed accepted, confirmed, in_progress
-- This caused Track Barber screen to not get real ETA from database

CREATE OR REPLACE VIEW active_tracking_sessions AS  
SELECT 
  b.id AS booking_id,
  b.customer_id,
  b.barber_id,
  b.status,
  b.tracking_started_at,
  b.tracking_last_updated_at,
  b.current_distance_km,
  b.current_eta_minutes,
  b.estimated_arrival_time,
  p.location AS barber_location,
  p.updated_at AS barber_profile_updated_at,
  (EXTRACT(epoch FROM (now() - b.tracking_last_updated_at)) / 60) AS minutes_since_last_update
FROM bookings b
JOIN barbers bar ON bar.id = b.barber_id
JOIN profiles p ON p.id = bar.user_id
WHERE b.status IN ('accepted', 'on_the_way', 'arrived', 'in_progress')
  AND b.tracking_started_at IS NOT NULL
ORDER BY b.tracking_started_at DESC;

COMMENT ON VIEW active_tracking_sessions IS 'Real-time tracking data for active bookings. Used by customer app Track Barber screen.';
