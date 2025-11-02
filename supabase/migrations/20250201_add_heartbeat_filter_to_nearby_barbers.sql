-- Add heartbeat timeout filter to get_nearby_barbers function
-- This provides instant offline detection without waiting for cronjob
-- Matches the 90-second threshold from heartbeat_auto_offline cronjob

CREATE OR REPLACE FUNCTION public.get_nearby_barbers(
  customer_lat double precision, 
  customer_lng double precision, 
  radius_km double precision, 
  buffer_multiplier double precision DEFAULT 1.5
)
RETURNS TABLE(
  id uuid, 
  user_id uuid, 
  name text, 
  email text, 
  avatar_url text, 
  phone_number text, 
  bio text, 
  experience_years integer, 
  specializations text[], 
  service_radius_km integer, 
  base_price numeric, 
  portfolio_urls text[], 
  average_rating numeric, 
  total_reviews integer, 
  completed_bookings integer, 
  total_bookings integer, 
  is_online boolean, 
  is_available boolean, 
  location_lat double precision, 
  location_lng double precision, 
  straight_line_distance_km numeric, 
  created_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
AS $function$
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
    COALESCE(b.completed_bookings, 0) AS completed_bookings,
    COALESCE(b.total_bookings, 0) AS total_bookings,
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
  -- Check for active bookings
  LEFT JOIN bookings bk ON b.id = bk.barber_id 
    AND bk.status IN ('accepted', 'on_the_way', 'arrived', 'in_progress')
  WHERE 
    -- Only verified barbers
    b.is_verified = true
    -- Only online and available
    AND p.is_online = true
    AND b.is_available = true
    -- 🆕 HEARTBEAT FILTER: Only show barbers with recent heartbeat (within 90 seconds)
    -- This provides instant offline detection without waiting for cronjob cleanup
    -- Handles edge cases: battery death, force close, network failure, frozen app
    AND (
      p.last_heartbeat IS NULL  -- Allow new barbers without heartbeat history
      OR p.last_heartbeat > NOW() - INTERVAL '90 seconds'
    )
    -- Exclude barbers with active bookings (busy with current job)
    AND bk.id IS NULL
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
$function$;

-- Add comment explaining the heartbeat filter
COMMENT ON FUNCTION public.get_nearby_barbers IS 
'Get nearby barbers within radius. 
Filters by verification, online status, availability, and recent heartbeat (90s).
Heartbeat filter provides instant offline detection for force-closed apps.';
