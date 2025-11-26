-- Function to get nearby barbershops using PostGIS
-- This filters on the database side for better performance
-- Updated: Added pagination support (page_limit, page_offset)

-- Drop old function first (if exists) to avoid conflicts
DROP FUNCTION IF EXISTS public.get_nearby_barbershops(double precision, double precision, double precision);

-- Create new function with pagination
CREATE OR REPLACE FUNCTION public.get_nearby_barbershops(
  customer_lat double precision,
  customer_lng double precision,
  radius_km double precision,
  page_limit integer DEFAULT 30,
  page_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  owner_id uuid,
  name text,
  description text,
  logo_url text,
  cover_images text[],
  phone_number text,
  email text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  location_lat double precision,
  location_lng double precision,
  opening_hours jsonb,
  rating numeric,
  total_reviews integer,
  total_bookings integer,
  is_verified boolean,
  is_featured boolean,
  straight_line_distance_km numeric,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.owner_id,
    s.name,
    s.description,
    s.logo_url,
    COALESCE(s.cover_images, ARRAY[]::text[]) AS cover_images,
    s.phone_number,
    s.email,
    s.address_line1,
    s.address_line2,
    s.city,
    s.state,
    s.postal_code,
    -- Extract lat/lng from PostGIS location
    ST_Y(s.location::geometry)::DOUBLE PRECISION AS location_lat,
    ST_X(s.location::geometry)::DOUBLE PRECISION AS location_lng,
    s.opening_hours,
    COALESCE(s.rating::numeric, 0) AS rating,
    COALESCE(s.total_reviews, 0) AS total_reviews,
    COALESCE(s.total_bookings, 0) AS total_bookings,
    COALESCE(s.is_verified, false) AS is_verified,
    COALESCE(s.is_featured, false) AS is_featured,
    -- Calculate straight-line distance in km
    ROUND(
      (ST_Distance(
        ST_MakePoint(customer_lng, customer_lat)::geography,
        s.location
      ) / 1000)::numeric, 3
    )::DECIMAL(10,3) AS straight_line_distance_km,
    s.created_at
  FROM barbershops s
  WHERE 
    -- Only active barbershops
    s.is_active = true
    -- Filter by straight-line distance
    AND ST_DWithin(
      ST_MakePoint(customer_lng, customer_lat)::geography,
      s.location,
      (radius_km * 1000)::integer  -- Convert km to meters
    )
    -- Barbershop must have valid location
    AND s.location IS NOT NULL
  ORDER BY straight_line_distance_km ASC
  LIMIT page_limit
  OFFSET page_offset;
END;
$function$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_nearby_barbershops TO anon, authenticated;
