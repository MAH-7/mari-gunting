-- Fix route_cache table structure for proper caching

-- Drop existing table if it has wrong structure
DROP TABLE IF EXISTS public.route_cache;

-- Create proper route_cache table
CREATE TABLE public.route_cache (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key text NOT NULL UNIQUE, -- Unique key for fast lookups
    origin_lat numeric NOT NULL,
    origin_lng numeric NOT NULL,
    destination_lat numeric NOT NULL,
    destination_lng numeric NOT NULL,
    distance_km numeric NOT NULL,
    duration_minutes numeric NOT NULL,
    profile text NOT NULL DEFAULT 'driving',
    cached_at timestamptz NOT NULL DEFAULT now(),
    hit_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create index on cache_key for fast lookups
CREATE INDEX idx_route_cache_key ON public.route_cache(cache_key);

-- Create index on cached_at for TTL checks
CREATE INDEX idx_route_cache_cached_at ON public.route_cache(cached_at);

-- Create index on origin/destination for geospatial queries (optional)
CREATE INDEX idx_route_cache_coords ON public.route_cache(origin_lat, origin_lng, destination_lat, destination_lng);

-- Auto-delete expired cache entries (older than 7 days)
CREATE OR REPLACE FUNCTION delete_expired_route_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM public.route_cache 
    WHERE cached_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.route_cache IS 'Caches Mapbox route calculations to reduce API calls';
COMMENT ON COLUMN public.route_cache.cache_key IS 'Unique key: route_{origin_lat}_{origin_lng}_{dest_lat}_{dest_lng}';
COMMENT ON COLUMN public.route_cache.cached_at IS 'When this route was last cached (for TTL checks)';
