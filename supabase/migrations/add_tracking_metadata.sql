-- Migration: Add Tracking Metadata to Bookings Table
-- Description: Adds columns to track real-time barber location and ETA data
-- Created: 2025-01-09

-- Add tracking metadata columns to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS tracking_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tracking_last_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS estimated_arrival_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS current_distance_km NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS current_eta_minutes INTEGER,
ADD COLUMN IF NOT EXISTS barber_arrived_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_tracking_started 
ON bookings(tracking_started_at) 
WHERE tracking_started_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_status_tracking 
ON bookings(status, tracking_started_at) 
WHERE status IN ('accepted', 'on-the-way', 'in-progress');

-- Add comments
COMMENT ON COLUMN bookings.tracking_started_at IS 'Timestamp when barber started traveling (status changed to on-the-way)';
COMMENT ON COLUMN bookings.tracking_last_updated_at IS 'Last time tracking data was updated';
COMMENT ON COLUMN bookings.estimated_arrival_time IS 'Calculated ETA timestamp based on current location';
COMMENT ON COLUMN bookings.current_distance_km IS 'Current distance between barber and customer in kilometers';
COMMENT ON COLUMN bookings.current_eta_minutes IS 'Current estimated minutes until arrival';
COMMENT ON COLUMN bookings.barber_arrived_at IS 'Timestamp when barber arrived at customer location';

-- Function to auto-update tracking_started_at when status changes to 'on-the-way'
CREATE OR REPLACE FUNCTION set_tracking_started_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Set tracking_started_at when status changes to 'on-the-way'
  IF NEW.status = 'on-the-way' AND OLD.status != 'on-the-way' THEN
    NEW.tracking_started_at = NOW();
  END IF;
  
  -- Set barber_arrived_at when status changes to 'in-progress'
  IF NEW.status = 'in-progress' AND OLD.status != 'in-progress' THEN
    NEW.barber_arrived_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_tracking_started_at ON bookings;
CREATE TRIGGER trigger_set_tracking_started_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_tracking_started_at();

-- Function to calculate and update tracking metrics
-- This can be called periodically or on location updates
CREATE OR REPLACE FUNCTION update_tracking_metrics(
  p_booking_id UUID,
  p_distance_km NUMERIC,
  p_eta_minutes INTEGER
)
RETURNS void AS $$
BEGIN
  UPDATE bookings
  SET
    tracking_last_updated_at = NOW(),
    current_distance_km = p_distance_km,
    current_eta_minutes = p_eta_minutes,
    estimated_arrival_time = NOW() + (p_eta_minutes || ' minutes')::INTERVAL
  WHERE id = p_booking_id
    AND status IN ('accepted', 'on-the-way', 'in-progress');
END;
$$ LANGUAGE plpgsql;

-- Optional: View for active tracking sessions
CREATE OR REPLACE VIEW active_tracking_sessions AS
SELECT 
  b.id as booking_id,
  b.customer_id,
  b.barber_id,
  b.status,
  b.tracking_started_at,
  b.tracking_last_updated_at,
  b.current_distance_km,
  b.current_eta_minutes,
  b.estimated_arrival_time,
  p.location as barber_location,
  p.location_updated_at as barber_location_updated_at,
  EXTRACT(EPOCH FROM (NOW() - b.tracking_last_updated_at)) / 60 as minutes_since_last_update
FROM bookings b
JOIN profiles p ON p.id = b.barber_id
WHERE b.status IN ('accepted', 'on-the-way', 'in-progress')
  AND b.tracking_started_at IS NOT NULL
ORDER BY b.tracking_started_at DESC;

COMMENT ON VIEW active_tracking_sessions IS 'Shows all currently active tracking sessions with real-time data';

-- Grant permissions (adjust based on your RLS policies)
GRANT SELECT ON active_tracking_sessions TO authenticated;

-- Example usage:
-- To manually update tracking metrics (normally done by app):
-- SELECT update_tracking_metrics('booking-uuid-here', 2.5, 8);

-- To view active tracking sessions:
-- SELECT * FROM active_tracking_sessions;
