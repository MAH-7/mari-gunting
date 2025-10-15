-- Migration: Add location tracking to bookings
-- Store both customer and barber locations at time of booking

-- Step 1: Add customer location columns
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS customer_location GEOMETRY(Point, 4326),
  ADD COLUMN IF NOT EXISTS customer_address_text TEXT,
  ADD COLUMN IF NOT EXISTS customer_location_accuracy DECIMAL(10, 2);

-- Step 2: Add barber location columns
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS barber_location_at_accept GEOMETRY(Point, 4326),
  ADD COLUMN IF NOT EXISTS barber_location_at_start GEOMETRY(Point, 4326),
  ADD COLUMN IF NOT EXISTS barber_location_at_complete GEOMETRY(Point, 4326);

-- Step 3: Add distance calculation column
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10, 2);

-- Step 4: Add travel time estimate
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS estimated_travel_time_minutes INTEGER;

-- Step 5: Create spatial indexes
CREATE INDEX IF NOT EXISTS idx_bookings_customer_location 
  ON bookings USING GIST (customer_location);

CREATE INDEX IF NOT EXISTS idx_bookings_barber_location_at_accept 
  ON bookings USING GIST (barber_location_at_accept);

-- Step 6: Create function to calculate distance when booking is created/updated
CREATE OR REPLACE FUNCTION calculate_booking_distance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_location IS NOT NULL AND NEW.barber_location_at_accept IS NOT NULL THEN
    NEW.distance_km = ST_Distance(
      NEW.customer_location::geography,
      NEW.barber_location_at_accept::geography
    ) / 1000.0; -- Convert meters to kilometers
    
    -- Estimate travel time: assume 30 km/h average speed in city
    NEW.estimated_travel_time_minutes = CEIL((NEW.distance_km / 30.0) * 60);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bookings_calculate_distance ON bookings;

CREATE TRIGGER bookings_calculate_distance
  BEFORE INSERT OR UPDATE OF customer_location, barber_location_at_accept
  ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_booking_distance();

-- Step 7: Add comments for documentation
COMMENT ON COLUMN bookings.customer_location IS 
  'Customer location where service will be performed (captured at booking time)';

COMMENT ON COLUMN bookings.customer_address_text IS 
  'Human-readable address text for customer location';

COMMENT ON COLUMN bookings.barber_location_at_accept IS 
  'Barber GPS location when they accepted the booking';

COMMENT ON COLUMN bookings.barber_location_at_start IS 
  'Barber GPS location when they started traveling to customer';

COMMENT ON COLUMN bookings.barber_location_at_complete IS 
  'Barber GPS location when service was completed';

COMMENT ON COLUMN bookings.distance_km IS 
  'Calculated distance between customer and barber at booking time (in kilometers)';

COMMENT ON COLUMN bookings.estimated_travel_time_minutes IS 
  'Estimated travel time for barber to reach customer (in minutes)';
