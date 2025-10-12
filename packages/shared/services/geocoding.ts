import { ENV } from '../config/env';
import type { Coordinates } from '../utils/location';

/**
 * Mapbox Geocoding Service
 * 
 * Provides address search, autocomplete, and place details
 * Uses Mapbox Geocoding API
 */

const MAPBOX_GEOCODING_BASE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

export interface GeocodingResult {
  id: string;
  place_name: string;
  place_type: string[];
  center: [number, number]; // [longitude, latitude]
  address?: string;
  text?: string;
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
  properties?: {
    address?: string;
    category?: string;
  };
}

export interface PlaceResult {
  id: string;
  name: string;
  fullAddress: string;
  coordinates: Coordinates;
  type: string;
  address?: string;
  city?: string;
  region?: string; // State
  postcode?: string;
  country?: string;
}

/**
 * Search for places (address autocomplete)
 */
export async function searchPlaces(
  query: string,
  options?: {
    limit?: number;
    proximity?: Coordinates; // Bias results toward this location
    bbox?: [number, number, number, number]; // Bounding box [minLon, minLat, maxLon, maxLat]
    country?: string[]; // e.g., ['MY'] for Malaysia
    types?: string[]; // e.g., ['address', 'poi']
  }
): Promise<PlaceResult[]> {
  try {
    if (!ENV.MAPBOX_ACCESS_TOKEN) {
      console.warn('Mapbox access token not configured');
      return [];
    }

    if (!query || query.trim().length === 0) {
      return [];
    }

    const params = new URLSearchParams({
      access_token: ENV.MAPBOX_ACCESS_TOKEN,
      limit: (options?.limit || 5).toString(),
      language: 'en',
      ...(options?.country && { country: options.country.join(',') }),
      ...(options?.types && { types: options.types.join(',') }),
      ...(options?.proximity && {
        proximity: `${options.proximity.longitude},${options.proximity.latitude}`,
      }),
      ...(options?.bbox && { bbox: options.bbox.join(',') }),
    });

    const encodedQuery = encodeURIComponent(query.trim());
    const url = `${MAPBOX_GEOCODING_BASE_URL}/${encodedQuery}.json?${params}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.features.map((feature: GeocodingResult) => 
      mapGeocodingResultToPlace(feature)
    );
  } catch (error) {
    console.error('Error searching places:', error);
    return [];
  }
}

/**
 * Reverse geocode: Get place from coordinates
 */
export async function reverseGeocodePlace(
  coords: Coordinates,
  options?: {
    types?: string[];
    limit?: number;
  }
): Promise<PlaceResult | null> {
  try {
    if (!ENV.MAPBOX_ACCESS_TOKEN) {
      console.warn('Mapbox access token not configured');
      return null;
    }

    const params = new URLSearchParams({
      access_token: ENV.MAPBOX_ACCESS_TOKEN,
      limit: (options?.limit || 1).toString(),
      language: 'en',
      ...(options?.types && { types: options.types.join(',') }),
    });

    const url = `${MAPBOX_GEOCODING_BASE_URL}/${coords.longitude},${coords.latitude}.json?${params}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.features.length === 0) {
      return null;
    }

    return mapGeocodingResultToPlace(data.features[0]);
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}

/**
 * Get place details by ID
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
  try {
    if (!ENV.MAPBOX_ACCESS_TOKEN) {
      console.warn('Mapbox access token not configured');
      return null;
    }

    const params = new URLSearchParams({
      access_token: ENV.MAPBOX_ACCESS_TOKEN,
      language: 'en',
    });

    const url = `${MAPBOX_GEOCODING_BASE_URL}/${placeId}.json?${params}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Place details error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.features.length === 0) {
      return null;
    }

    return mapGeocodingResultToPlace(data.features[0]);
  } catch (error) {
    console.error('Error getting place details:', error);
    return null;
  }
}

/**
 * Search for addresses in Malaysia
 */
export async function searchMalaysianAddresses(
  query: string,
  proximity?: Coordinates
): Promise<PlaceResult[]> {
  return searchPlaces(query, {
    country: ['MY'],
    types: ['address', 'place', 'poi'],
    limit: 10,
    proximity,
  });
}

/**
 * Search for POIs (Points of Interest) like barbershops
 */
export async function searchPOI(
  query: string,
  category?: string,
  proximity?: Coordinates
): Promise<PlaceResult[]> {
  return searchPlaces(query, {
    types: ['poi'],
    limit: 20,
    proximity,
    country: ['MY'],
  });
}

/**
 * Map Mapbox geocoding result to PlaceResult
 */
function mapGeocodingResultToPlace(feature: GeocodingResult): PlaceResult {
  // Extract context information
  const context = feature.context || [];
  const place = context.find((c) => c.id.startsWith('place'));
  const region = context.find((c) => c.id.startsWith('region'));
  const postcode = context.find((c) => c.id.startsWith('postcode'));
  const country = context.find((c) => c.id.startsWith('country'));

  return {
    id: feature.id,
    name: feature.text || feature.place_name,
    fullAddress: feature.place_name,
    coordinates: {
      latitude: feature.center[1],
      longitude: feature.center[0],
    },
    type: feature.place_type[0] || 'place',
    address: feature.properties?.address || feature.address,
    city: place?.text,
    region: region?.text,
    postcode: postcode?.text,
    country: country?.text,
  };
}

/**
 * Get directions between two points
 * Returns URL to open in navigation app
 */
export function getDirectionsURL(
  from: Coordinates,
  to: Coordinates,
  mode: 'driving' | 'walking' | 'cycling' = 'driving'
): string {
  // For iOS, use Apple Maps
  // For Android, use Google Maps
  const origin = `${from.latitude},${from.longitude}`;
  const destination = `${to.latitude},${to.longitude}`;

  // Google Maps URL (works on both platforms)
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=${mode}`;
}

/**
 * Calculate ETA using Mapbox Directions API
 */
export async function calculateETA(
  from: Coordinates,
  to: Coordinates,
  profile: 'driving' | 'walking' | 'cycling' = 'driving'
): Promise<{
  duration: number; // in seconds
  distance: number; // in meters
  formattedDuration: string;
  formattedDistance: string;
} | null> {
  try {
    if (!ENV.MAPBOX_ACCESS_TOKEN) {
      console.warn('Mapbox access token not configured');
      return null;
    }

    const coordinates = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}?access_token=${ENV.MAPBOX_ACCESS_TOKEN}&geometries=geojson`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Directions API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
      return null;
    }

    const route = data.routes[0];
    const duration = route.duration; // seconds
    const distance = route.distance; // meters

    return {
      duration,
      distance,
      formattedDuration: formatDuration(duration),
      formattedDistance: formatDistance(distance),
    };
  } catch (error) {
    console.error('Error calculating ETA:', error);
    return null;
  }
}

/**
 * Format duration in seconds to human-readable string
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Format distance in meters to human-readable string
 */
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}
