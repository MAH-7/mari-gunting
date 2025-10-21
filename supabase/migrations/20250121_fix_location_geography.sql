-- ============================================
-- PRODUCTION MIGRATION: Fix Location Columns
-- Convert text -> geography(Point, 4326)
-- ============================================
-- Run during low-traffic window
-- Estimated time: 1-5 minutes
-- IMPORTANT: Test on staging first!

BEGIN;

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- STEP 1: Check current data
-- ============================================
-- Uncomment to see what format your data is in:
-- SELECT 'profiles' as table_name, location FROM profiles WHERE location IS NOT NULL LIMIT 3
-- UNION ALL
-- SELECT 'barbershops', location FROM barbershops WHERE location IS NOT NULL LIMIT 3
-- UNION ALL
-- SELECT 'customer_addresses', location FROM customer_addresses WHERE location IS NOT NULL LIMIT 3;

-- ============================================
-- STEP 2: Backup current state (optional)
-- ============================================
-- CREATE TABLE profiles_location_backup AS 
-- SELECT id, location FROM profiles WHERE location IS NOT NULL;

-- ============================================
-- STEP 3: Drop dependent objects temporarily
-- ============================================
-- Views and triggers that reference location columns must be dropped before altering

-- Drop view
DROP VIEW IF EXISTS active_tracking_sessions;

-- Drop triggers that depend on location columns
DROP TRIGGER IF EXISTS bookings_calculate_distance ON bookings;
DROP TRIGGER IF EXISTS customer_addresses_location_updated ON customer_addresses;

-- ============================================
-- STEP 4: Add new geography columns
-- ============================================
-- Non-breaking change - keeps old columns intact

ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS location_new geography(Point, 4326);

ALTER TABLE barbershops 
  ADD COLUMN IF NOT EXISTS location_new geography(Point, 4326);

ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS customer_location_new geography(Point, 4326);

ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS barber_location_at_accept_new geography(Point, 4326);

ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS barber_location_at_start_new geography(Point, 4326);

ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS barber_location_at_complete_new geography(Point, 4326);

ALTER TABLE customer_addresses 
  ADD COLUMN IF NOT EXISTS location_new geography(Point, 4326);

-- ============================================
-- STEP 5: Migrate data from text to geography
-- ============================================

-- Option A: If stored as WKT format "POINT(lng lat)" or PostGIS text
UPDATE profiles 
SET location_new = location::geography 
WHERE location IS NOT NULL AND location != '';

UPDATE barbershops 
SET location_new = location::geography 
WHERE location IS NOT NULL AND location != '';

UPDATE bookings 
SET customer_location_new = customer_location::geography 
WHERE customer_location IS NOT NULL AND customer_location != '';

UPDATE bookings 
SET barber_location_at_accept_new = barber_location_at_accept::geography 
WHERE barber_location_at_accept IS NOT NULL AND barber_location_at_accept != '';

UPDATE bookings 
SET barber_location_at_start_new = barber_location_at_start::geography 
WHERE barber_location_at_start IS NOT NULL AND barber_location_at_start != '';

UPDATE bookings 
SET barber_location_at_complete_new = barber_location_at_complete::geography 
WHERE barber_location_at_complete IS NOT NULL AND barber_location_at_complete != '';

UPDATE customer_addresses 
SET location_new = location::geography 
WHERE location IS NOT NULL AND location != '';

-- ============================================
-- STEP 6: Drop generated columns that depend on location
-- ============================================
-- customer_addresses has latitude/longitude generated from location

ALTER TABLE customer_addresses DROP COLUMN IF EXISTS latitude CASCADE;
ALTER TABLE customer_addresses DROP COLUMN IF EXISTS longitude CASCADE;

-- ============================================
-- STEP 7: Drop old text columns
-- ============================================

ALTER TABLE profiles DROP COLUMN IF EXISTS location;
ALTER TABLE barbershops DROP COLUMN IF EXISTS location;
ALTER TABLE bookings DROP COLUMN IF EXISTS customer_location;
ALTER TABLE bookings DROP COLUMN IF EXISTS barber_location_at_accept;
ALTER TABLE bookings DROP COLUMN IF EXISTS barber_location_at_start;
ALTER TABLE bookings DROP COLUMN IF EXISTS barber_location_at_complete;
ALTER TABLE customer_addresses DROP COLUMN IF EXISTS location;

-- ============================================
-- STEP 8: Rename new columns to original names
-- ============================================

ALTER TABLE profiles RENAME COLUMN location_new TO location;
ALTER TABLE barbershops RENAME COLUMN location_new TO location;
ALTER TABLE bookings RENAME COLUMN customer_location_new TO customer_location;
ALTER TABLE bookings RENAME COLUMN barber_location_at_accept_new TO barber_location_at_accept;
ALTER TABLE bookings RENAME COLUMN barber_location_at_start_new TO barber_location_at_start;
ALTER TABLE bookings RENAME COLUMN barber_location_at_complete_new TO barber_location_at_complete;
ALTER TABLE customer_addresses RENAME COLUMN location_new TO location;

-- ============================================
-- STEP 9: Recreate generated columns (latitude/longitude from geography)
-- ============================================

ALTER TABLE customer_addresses 
  ADD COLUMN latitude double precision 
  GENERATED ALWAYS AS (ST_Y(location::geometry)) STORED;

ALTER TABLE customer_addresses 
  ADD COLUMN longitude double precision 
  GENERATED ALWAYS AS (ST_X(location::geometry)) STORED;

-- ============================================
-- STEP 10: Add NOT NULL constraints
-- ============================================
-- Only for columns that were NOT NULL before

ALTER TABLE barbershops 
  ALTER COLUMN location SET NOT NULL;

-- ============================================
-- STEP 11: Drop old indexes (text-based)
-- ============================================

DROP INDEX IF EXISTS idx_profiles_location;
DROP INDEX IF EXISTS idx_profiles_location_gist;
DROP INDEX IF EXISTS idx_barbershops_location;
DROP INDEX IF EXISTS idx_bookings_customer_location;
DROP INDEX IF EXISTS idx_bookings_barber_location_at_accept;
DROP INDEX IF EXISTS idx_customer_addresses_location;

-- ============================================
-- STEP 12: Create new GIST indexes (now they'll work!)
-- ============================================

CREATE INDEX idx_profiles_location 
  ON profiles USING gist(location);

CREATE INDEX idx_barbershops_location 
  ON barbershops USING gist(location);

CREATE INDEX idx_bookings_customer_location 
  ON bookings USING gist(customer_location);

CREATE INDEX idx_bookings_barber_location_at_accept 
  ON bookings USING gist(barber_location_at_accept);

CREATE INDEX idx_customer_addresses_location 
  ON customer_addresses USING gist(location);

-- ============================================
-- STEP 13: Recreate dependent views
-- ============================================

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
JOIN profiles p ON p.id = b.barber_id
WHERE b.status IN ('accepted', 'confirmed', 'in_progress')
  AND b.tracking_started_at IS NOT NULL
ORDER BY b.tracking_started_at DESC;

-- Recreate triggers (they will use geography type now)
CREATE TRIGGER bookings_calculate_distance 
  BEFORE INSERT ON bookings 
  FOR EACH ROW 
  EXECUTE FUNCTION calculate_booking_distance();

CREATE TRIGGER customer_addresses_location_updated 
  BEFORE UPDATE ON customer_addresses 
  FOR EACH ROW 
  EXECUTE FUNCTION update_customer_address_location_timestamp();

-- ============================================
-- STEP 14: Verify migration
-- ============================================

DO $$
DECLARE
  v_profiles_count INTEGER;
  v_barbershops_count INTEGER;
  v_bookings_count INTEGER;
BEGIN
  -- Count migrated records
  SELECT COUNT(*) INTO v_profiles_count FROM profiles WHERE location IS NOT NULL;
  SELECT COUNT(*) INTO v_barbershops_count FROM barbershops WHERE location IS NOT NULL;
  SELECT COUNT(*) INTO v_bookings_count FROM bookings WHERE customer_location IS NOT NULL;
  
  RAISE NOTICE '✅ Migration complete!';
  RAISE NOTICE '  - Profiles with location: %', v_profiles_count;
  RAISE NOTICE '  - Barbershops with location: %', v_barbershops_count;
  RAISE NOTICE '  - Bookings with customer location: %', v_bookings_count;
  RAISE NOTICE ' ';
  RAISE NOTICE '🔍 Verify column types:';
  RAISE NOTICE '  SELECT column_name, data_type FROM information_schema.columns';
  RAISE NOTICE '  WHERE table_name IN (''profiles'', ''barbershops'', ''bookings'')';
  RAISE NOTICE '  AND column_name LIKE ''%%location%%'';';
END $$;

COMMIT;

-- ============================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================
-- If something goes wrong, run:
-- BEGIN;
-- -- Restore from backup
-- UPDATE profiles p SET location = b.location::text 
-- FROM profiles_location_backup b WHERE p.id = b.id;
-- COMMIT;
