export interface DirectionsRoute {
  distance: number; // meters
  duration: number; // seconds
  geometry: {
    coordinates: [number, number][]; // [lng, lat] pairs
  };
}

export interface DirectionsResponse {
  routes: DirectionsRoute[];
  code: string;
}

export interface GetDirectionsParams {
  origin: {
    latitude: number;
    longitude: number;
  };
  destination: {
    latitude: number;
    longitude: number;
  };
  profile?: 'driving' | 'driving-traffic' | 'walking' | 'cycling';
  alternatives?: boolean; // Get multiple route options
  accessToken: string; // Mapbox access token
}

export interface RouteInfo {
  distanceKm: number;
  durationMinutes: number;
  geometry?: [number, number][];
}

/**
 * Get driving directions from Mapbox Directions API
 * 
 * @see https://docs.mapbox.com/api/navigation/directions/
 */
export async function getDirections(
  params: GetDirectionsParams
): Promise<RouteInfo | null> {
  try {
    const { origin, destination, profile = 'driving', alternatives = false, accessToken } = params;

    if (!accessToken) {
      console.error('❌ Mapbox access token is required');
      return null;
    }

    // Mapbox format: lng,lat (NOT lat,lng!)
    const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coords}`;
    
    const queryParams = new URLSearchParams({
      access_token: accessToken,
      geometries: 'geojson',
      overview: 'full',
      alternatives: alternatives ? 'true' : 'false',
    });

    const response = await fetch(`${url}?${queryParams.toString()}`);
    
    if (!response.ok) {
      console.error('❌ Mapbox Directions API error:', response.status, response.statusText);
      return null;
    }

    const data: DirectionsResponse = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      console.error('❌ No routes found:', data.code);
      return null;
    }

    // Get the first (fastest) route
    const route = data.routes[0];

    return {
      distanceKm: route.distance / 1000, // Convert meters to km
      durationMinutes: route.duration / 60, // Convert seconds to minutes
      geometry: route.geometry?.coordinates || undefined,
    };
  } catch (error) {
    console.error('❌ Error fetching directions:', error);
    return null;
  }
}

/**
 * Get multiple route alternatives
 */
export async function getRouteAlternatives(
  params: Omit<GetDirectionsParams, 'alternatives'>
): Promise<RouteInfo[]> {
  try {
    const { origin, destination, profile = 'driving', accessToken } = params;

    if (!accessToken) {
      console.error('❌ Mapbox access token is required');
      return [];
    }

    const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coords}`;
    
    const queryParams = new URLSearchParams({
      access_token: accessToken,
      geometries: 'geojson',
      overview: 'full',
      alternatives: 'true', // Request alternatives
    });

    const response = await fetch(`${url}?${queryParams.toString()}`);
    
    if (!response.ok) {
      console.error('❌ Mapbox Directions API error:', response.status);
      return [];
    }

    const data: DirectionsResponse = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return [];
    }

    // Return all routes
    return data.routes.map(route => ({
      distanceKm: route.distance / 1000,
      durationMinutes: route.duration / 60,
      geometry: route.geometry?.coordinates || undefined,
    }));
  } catch (error) {
    console.error('❌ Error fetching route alternatives:', error);
    return [];
  }
}

/**
 * Batch calculate driving distances for multiple destinations
 * Useful for calculating distances to multiple barbers at once
 * 
 * Uses route caching to reduce Mapbox API calls:
 * 1. Check cache first
 * 2. Only call Mapbox for non-cached routes
 * 3. Store new routes in cache
 */
export async function batchCalculateDistances(
  origin: { latitude: number; longitude: number },
  destinations: Array<{ id: string; latitude: number; longitude: number }>,
  accessToken: string,
  options?: { 
    useCache?: boolean; 
    supabase?: any;
    cacheTTL?: number; // Cache TTL in seconds (default: 1 hour)
    warmCache?: boolean; // Pre-warm cache for popular routes
  }
): Promise<Map<string, RouteInfo>> {
  const results = new Map<string, RouteInfo>();
  const useCache = options?.useCache !== false; // Default to true
  const cacheTTL = options?.cacheTTL || 3600; // Default 1 hour (in seconds)

  if (!accessToken) {
    console.error('❌ Mapbox access token is required');
    return results;
  }

  let cacheHits = 0;
  let cacheMisses = 0;
  let staleHits = 0;
  const uncachedDestinations: typeof destinations = [];

  // Step 1: Check cache for all destinations (if enabled and supabase available)
  if (useCache && options?.supabase) {
    // Batch cache lookup for better performance
    const cacheKeys = destinations.map(dest => 
      `route_${origin.latitude}_${origin.longitude}_${dest.latitude}_${dest.longitude}`
    );
    
    try {
      const { data: cachedRoutes } = await options.supabase
        .from('route_cache')
        .select('cache_key, distance_km, duration_minutes, cached_at')
        .in('cache_key', cacheKeys);
      
      const cacheMap = new Map(
        (cachedRoutes || []).map((r: any) => [r.cache_key, r])
      );
      
      for (const dest of destinations) {
        const cacheKey = `route_${origin.latitude}_${origin.longitude}_${dest.latitude}_${dest.longitude}`;
        const cachedRoute = cacheMap.get(cacheKey);
        
        if (cachedRoute) {
          // Check if cache is still fresh
          const cacheAge = (Date.now() - new Date(cachedRoute.cached_at).getTime()) / 1000; // in seconds
          
          if (cacheAge < cacheTTL) {
            // Fresh cache hit!
            results.set(dest.id, {
              distanceKm: cachedRoute.distance_km,
              durationMinutes: cachedRoute.duration_minutes,
            });
            cacheHits++;
          } else if (cacheAge < cacheTTL * 2) {
            // Stale but usable - use it but also refresh
            results.set(dest.id, {
              distanceKm: cachedRoute.distance_km,
              durationMinutes: cachedRoute.duration_minutes,
            });
            uncachedDestinations.push(dest); // Refresh in background
            staleHits++;
          } else {
            // Too stale - fetch fresh
            uncachedDestinations.push(dest);
            cacheMisses++;
          }
        } else {
          // Cache miss - need to fetch from Mapbox
          uncachedDestinations.push(dest);
          cacheMisses++;
        }
      }
    } catch (error) {
      // Cache lookup failed - fall back to Mapbox
      console.warn('⚠️ Cache lookup failed:', error);
      uncachedDestinations.push(...destinations);
      cacheMisses = destinations.length;
    }

    console.log(`💾 Cache: ${cacheHits} fresh, ${staleHits} stale, ${cacheMisses} misses (${Math.round(((cacheHits + staleHits) / destinations.length) * 100)}% hit rate)`);
  } else {
    // Cache disabled or supabase not available - fetch all from Mapbox
    uncachedDestinations.push(...destinations);
  }

  // Step 2: Fetch uncached routes from Mapbox
  if (uncachedDestinations.length > 0) {
    const batchSize = 5; // Mapbox rate limit consideration
    
    for (let i = 0; i < uncachedDestinations.length; i += batchSize) {
      const batch = uncachedDestinations.slice(i, i + batchSize);
      
      const promises = batch.map(async (dest) => {
        const route = await getDirections({
          origin,
          destination: { latitude: dest.latitude, longitude: dest.longitude },
          profile: 'driving',
          accessToken,
        });
        
        if (route) {
          results.set(dest.id, route);

          // Step 3: Store in cache (fire and forget)
          if (useCache && options?.supabase) {
            const cacheKey = `route_${origin.latitude}_${origin.longitude}_${dest.latitude}_${dest.longitude}`;
            
            // Use upsert for better performance and avoid duplicates
            options.supabase
              .from('route_cache')
              .upsert({
                cache_key: cacheKey,
                origin_lat: origin.latitude,
                origin_lng: origin.longitude,
                destination_lat: dest.latitude,
                destination_lng: dest.longitude,
                distance_km: route.distanceKm,
                duration_minutes: route.durationMinutes,
                profile: 'driving',
                cached_at: new Date().toISOString(),
              }, {
                onConflict: 'cache_key'
              })
              .then(() => console.log(`💾 Cached route for ${dest.id}`))
              .catch((err: Error) => console.warn('⚠️ Cache write failed:', err.message));
          }
        }
        
        return { id: dest.id, route };
      });

      await Promise.all(promises);
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < uncachedDestinations.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  return results;
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Format duration for display
 */
export function formatDuration(durationMinutes: number): string {
  if (durationMinutes < 1) {
    return '< 1 min';
  }
  
  const hours = Math.floor(durationMinutes / 60);
  const mins = Math.round(durationMinutes % 60);
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  
  return `${mins} min`;
}
