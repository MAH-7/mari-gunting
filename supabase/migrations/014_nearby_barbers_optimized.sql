-- =====================================================
-- NEARBY BARBERS SEARCH - OPTIMIZED WITH POSTGIS
-- =====================================================
-- This function filters barbers by geospatial distance
-- to reduce unnecessary Mapbox API calls
-- 
-- Usage:
--   SELECT * FROM get_nearby_barbers(
--     3.1390,    -- customer_lat
--     101.6869,  -- customer_lng
--     5,         -- radius_km
--     1.5        -- buffer_multiplier (optional, default 1.5)
--   );
-- =====================================================

CREATE OR REPLACE FUNCTION get_nearby_barbers(
  customer_lat DOUBLE PRECISION,
  customer_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION,
  buffer_multiplier DOUBLE PRECISION DEFAULT 1.5
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  phone_number TEXT,
  bio TEXT,
  experience_years INTEGER,
  specializations TEXT[],
  service_radius_km INTEGER,
  base_price DECIMAL(10,2),
  portfolio_urls TEXT[],
  average_rating DECIMAL(3,2),
  total_reviews INTEGER,
  is_online BOOLEAN,
  is_available BOOLEAN,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  straight_line_distance_km DECIMAL(10,3),
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.user_id,
    p.full_name AS name,
    p.email,
    p.avatar_url,
    p.phone_number,
    b.bio,
    b.experience_years,
    b.specializations,
    b.service_radius_km,
    b.base_price,
    b.portfolio_images AS portfolio_urls,
    COALESCE(b.rating, 0::DECIMAL)::DECIMAL(3,2) AS average_rating,
    COALESCE(b.total_reviews, 0) AS total_reviews,
    COALESCE(p.is_online, false) AS is_online,
    COALESCE(b.is_available, false) AS is_available,
    -- Extract lat/lng from PostGIS location
    ST_Y(p.location::geometry)::DOUBLE PRECISION AS location_lat,
    ST_X(p.location::geometry)::DOUBLE PRECISION AS location_lng,
    -- Calculate straight-line distance in km
    ROUND(
      (ST_Distance(
        ST_MakePoint(customer_lng, customer_lat)::geography,
        p.location
      ) / 1000)::numeric, 3
    )::DECIMAL(10,3) AS straight_line_distance_km,
    b.created_at
  FROM barbers b
  INNER JOIN profiles p ON b.user_id = p.id
  WHERE 
    -- Only verified barbers
    b.is_verified = true
    -- Only online and available
    AND p.is_online = true
    AND b.is_available = true
    -- Filter by straight-line distance with buffer
    AND ST_DWithin(
      ST_MakePoint(customer_lng, customer_lat)::geography,
      p.location,
      (radius_km * buffer_multiplier * 1000)::integer  -- Convert km to meters
    )
    -- Barber must have valid location
    AND p.location IS NOT NULL
  ORDER BY straight_line_distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- CREATE INDEX FOR GEOSPATIAL QUERIES
-- =====================================================
-- This dramatically speeds up ST_DWithin queries

-- First, ensure PostGIS extension is enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create geospatial index on profiles location
-- This uses GIST (Generalized Search Tree) index which is optimized for geospatial queries
-- The location column is already GEOGRAPHY type, so we can index it directly
CREATE INDEX IF NOT EXISTS idx_profiles_location_gist 
ON profiles 
USING GIST (location);

-- Additional indexes for filtering
CREATE INDEX IF NOT EXISTS idx_barbers_verified_availability 
ON barbers(is_verified, is_available) 
WHERE is_verified = true AND is_available = true;

CREATE INDEX IF NOT EXISTS idx_profiles_online_status 
ON profiles(is_online) 
WHERE is_online = true;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
-- Allow authenticated users to call this function
GRANT EXECUTE ON FUNCTION get_nearby_barbers(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) 
TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION get_nearby_barbers IS 
'Optimized geospatial search for nearby barbers. 
Returns barbers within (radius_km × buffer_multiplier) straight-line distance.
The buffer_multiplier (default 1.5) accounts for road distance being longer than straight-line.
Results are sorted by distance and include straight_line_distance_km for reference.';
