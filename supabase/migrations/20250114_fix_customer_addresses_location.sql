-- Migration: Fix customer_addresses location format
-- Convert latitude/longitude strings to PostGIS GEOMETRY

-- Step 1: Add new location column as GEOMETRY
ALTER TABLE customer_addresses 
  ADD COLUMN IF NOT EXISTS location_new GEOMETRY(Point, 4326);

-- Step 2: Migrate existing data from latitude/longitude to GEOMETRY
-- Handle both TEXT and NUMERIC types
UPDATE customer_addresses
SET location_new = ST_SetSRID(
  ST_MakePoint(
    longitude::DOUBLE PRECISION,
    latitude::DOUBLE PRECISION
  ),
  4326
)
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL;

-- Step 3: Drop old location column if it exists
ALTER TABLE customer_addresses 
  DROP COLUMN IF EXISTS location;

-- Step 4: Rename new column to location
ALTER TABLE customer_addresses 
  RENAME COLUMN location_new TO location;

-- Step 5: Create spatial index for fast queries
CREATE INDEX IF NOT EXISTS idx_customer_addresses_location 
  ON customer_addresses USING GIST (location);

-- Step 6: Add computed columns for convenience (optional - for backward compatibility)
-- Check if columns exist and drop them
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'customer_addresses' AND column_name = 'latitude') THEN
    ALTER TABLE customer_addresses DROP COLUMN latitude CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'customer_addresses' AND column_name = 'longitude') THEN
    ALTER TABLE customer_addresses DROP COLUMN longitude CASCADE;
  END IF;
END $$;

-- Add computed columns
ALTER TABLE customer_addresses
  ADD COLUMN latitude TEXT 
    GENERATED ALWAYS AS (CAST(ST_Y(location) AS TEXT)) STORED,
  ADD COLUMN longitude TEXT 
    GENERATED ALWAYS AS (CAST(ST_X(location) AS TEXT)) STORED;

-- Step 7: Add location_updated_at column
ALTER TABLE customer_addresses
  ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 8: Add trigger to update location_updated_at
CREATE OR REPLACE FUNCTION update_customer_address_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.location IS DISTINCT FROM OLD.location THEN
    NEW.location_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS customer_addresses_location_updated 
  ON customer_addresses;

CREATE TRIGGER customer_addresses_location_updated
  BEFORE UPDATE ON customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_address_location_timestamp();

-- Step 9: Add comment for documentation
COMMENT ON COLUMN customer_addresses.location IS 
  'PostGIS Point geometry (SRID 4326) representing the address location. Use ST_X() for longitude, ST_Y() for latitude.';

COMMENT ON COLUMN customer_addresses.latitude IS 
  'Computed latitude from location geometry (read-only, for backward compatibility)';

COMMENT ON COLUMN customer_addresses.longitude IS 
  'Computed longitude from location geometry (read-only, for backward compatibility)';
