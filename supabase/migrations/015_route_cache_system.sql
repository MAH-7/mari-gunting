-- =====================================================
-- ROUTE CACHE SYSTEM
-- =====================================================
-- Cache frequently calculated routes to reduce Mapbox API calls
-- Routes are cached with expiration to account for traffic changes
-- 
-- Expected reduction: 50-70% additional savings on top of PostGIS filtering
-- =====================================================

-- =====================================================
-- ROUTE CACHE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS route_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Origin and destination (rounded to 3 decimals ~100m accuracy)
  origin_lat DECIMAL(8,5) NOT NULL,
  origin_lng DECIMAL(8,5) NOT NULL,
  destination_lat DECIMAL(8,5) NOT NULL,
  destination_lng DECIMAL(8,5) NOT NULL,
  
  -- Route information from Mapbox
  distance_km DECIMAL(10,3) NOT NULL,
  duration_minutes DECIMAL(10,2) NOT NULL,
  
  -- Metadata
  profile VARCHAR(20) DEFAULT 'driving', -- driving, walking, cycling
  traffic_profile VARCHAR(20) DEFAULT 'normal', -- normal, peak, off-peak
  
  -- Cache management
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  hit_count INTEGER DEFAULT 1,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- Composite unique constraint (same route = same cache entry)
  UNIQUE(origin_lat, origin_lng, destination_lat, destination_lng, profile)
);

-- =====================================================
-- INDEXES
-- =====================================================
-- Index for fast lookups by origin+destination
CREATE INDEX IF NOT EXISTS idx_route_cache_lookup 
ON route_cache(origin_lat, origin_lng, destination_lat, destination_lng, profile);

-- Index for cache expiration cleanup
CREATE INDEX IF NOT EXISTS idx_route_cache_expires 
ON route_cache(expires_at);

-- Index for popular routes (for analytics)
CREATE INDEX IF NOT EXISTS idx_route_cache_hit_count 
ON route_cache(hit_count DESC);

-- =====================================================
-- HELPER FUNCTION: ROUND COORDINATES
-- =====================================================
-- Rounds coordinates to 3 decimal places (~100m accuracy)
-- This allows cache hits for nearby coordinates
CREATE OR REPLACE FUNCTION round_coordinate(coord DOUBLE PRECISION, decimals INTEGER DEFAULT 3)
RETURNS DECIMAL AS $$
BEGIN
  RETURN ROUND(coord::numeric, decimals)::DECIMAL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- FUNCTION: GET CACHED ROUTE
-- =====================================================
CREATE OR REPLACE FUNCTION get_cached_route(
  p_origin_lat DOUBLE PRECISION,
  p_origin_lng DOUBLE PRECISION,
  p_destination_lat DOUBLE PRECISION,
  p_destination_lng DOUBLE PRECISION,
  p_profile VARCHAR(20) DEFAULT 'driving'
)
RETURNS TABLE (
  distance_km DECIMAL(10,3),
  duration_minutes DECIMAL(10,2),
  is_cached BOOLEAN,
  cache_age_hours INTEGER
) AS $$
DECLARE
  v_rounded_origin_lat DECIMAL(8,5);
  v_rounded_origin_lng DECIMAL(8,5);
  v_rounded_dest_lat DECIMAL(8,5);
  v_rounded_dest_lng DECIMAL(8,5);
BEGIN
  -- Round coordinates for cache lookup
  v_rounded_origin_lat := round_coordinate(p_origin_lat);
  v_rounded_origin_lng := round_coordinate(p_origin_lng);
  v_rounded_dest_lat := round_coordinate(p_destination_lat);
  v_rounded_dest_lng := round_coordinate(p_destination_lng);
  
  -- Try to find cached route
  RETURN QUERY
  SELECT 
    rc.distance_km,
    rc.duration_minutes,
    true AS is_cached,
    EXTRACT(EPOCH FROM (NOW() - rc.created_at))::INTEGER / 3600 AS cache_age_hours
  FROM route_cache rc
  WHERE 
    rc.origin_lat = v_rounded_origin_lat
    AND rc.origin_lng = v_rounded_origin_lng
    AND rc.destination_lat = v_rounded_dest_lat
    AND rc.destination_lng = v_rounded_dest_lng
    AND rc.profile = p_profile
    AND rc.expires_at > NOW(); -- Not expired
  
  -- If found, update last_used_at and hit_count
  IF FOUND THEN
    UPDATE route_cache
    SET 
      last_used_at = NOW(),
      hit_count = hit_count + 1
    WHERE 
      origin_lat = v_rounded_origin_lat
      AND origin_lng = v_rounded_origin_lng
      AND destination_lat = v_rounded_dest_lat
      AND destination_lng = v_rounded_dest_lng
      AND profile = p_profile;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: CACHE ROUTE
-- =====================================================
CREATE OR REPLACE FUNCTION cache_route(
  p_origin_lat DOUBLE PRECISION,
  p_origin_lng DOUBLE PRECISION,
  p_destination_lat DOUBLE PRECISION,
  p_destination_lng DOUBLE PRECISION,
  p_distance_km DECIMAL(10,3),
  p_duration_minutes DECIMAL(10,2),
  p_profile VARCHAR(20) DEFAULT 'driving',
  p_cache_duration_days INTEGER DEFAULT 7
)
RETURNS UUID AS $$
DECLARE
  v_rounded_origin_lat DECIMAL(8,5);
  v_rounded_origin_lng DECIMAL(8,5);
  v_rounded_dest_lat DECIMAL(8,5);
  v_rounded_dest_lng DECIMAL(8,5);
  v_cache_id UUID;
BEGIN
  -- Round coordinates
  v_rounded_origin_lat := round_coordinate(p_origin_lat);
  v_rounded_origin_lng := round_coordinate(p_origin_lng);
  v_rounded_dest_lat := round_coordinate(p_destination_lat);
  v_rounded_dest_lng := round_coordinate(p_destination_lng);
  
  -- Insert or update cache entry
  INSERT INTO route_cache (
    origin_lat,
    origin_lng,
    destination_lat,
    destination_lng,
    distance_km,
    duration_minutes,
    profile,
    expires_at
  ) VALUES (
    v_rounded_origin_lat,
    v_rounded_origin_lng,
    v_rounded_dest_lat,
    v_rounded_dest_lng,
    p_distance_km,
    p_duration_minutes,
    p_profile,
    NOW() + (p_cache_duration_days || ' days')::INTERVAL
  )
  ON CONFLICT (origin_lat, origin_lng, destination_lat, destination_lng, profile)
  DO UPDATE SET
    distance_km = EXCLUDED.distance_km,
    duration_minutes = EXCLUDED.duration_minutes,
    last_used_at = NOW(),
    hit_count = route_cache.hit_count + 1,
    expires_at = NOW() + (p_cache_duration_days || ' days')::INTERVAL
  RETURNING id INTO v_cache_id;
  
  RETURN v_cache_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: CLEANUP EXPIRED CACHE
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_expired_route_cache()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM route_cache
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SCHEDULED JOB: AUTO-CLEANUP (Optional - requires pg_cron extension)
-- =====================================================
-- Uncomment if you have pg_cron extension enabled
-- SELECT cron.schedule(
--   'cleanup-route-cache',
--   '0 2 * * *', -- Run daily at 2 AM
--   'SELECT cleanup_expired_route_cache();'
-- );

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT SELECT, INSERT, UPDATE ON route_cache TO authenticated;
GRANT EXECUTE ON FUNCTION get_cached_route(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION cache_route(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DECIMAL, DECIMAL, VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_route_cache() TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE route_cache IS 
'Caches Mapbox Directions API results to reduce API calls. 
Routes expire after 7 days by default to account for traffic pattern changes.
Coordinates are rounded to 3 decimals (~100m) for better cache hit rate.';

COMMENT ON FUNCTION get_cached_route IS 
'Retrieves cached route if available. Returns NULL if not cached.
Automatically updates last_used_at and hit_count when cache is hit.';

COMMENT ON FUNCTION cache_route IS 
'Stores a route in the cache. Uses UPSERT to update existing entries.
Returns the cache entry UUID.';

COMMENT ON FUNCTION cleanup_expired_route_cache IS 
'Removes expired cache entries. Should be run periodically (e.g., daily).
Returns the number of deleted entries.';
