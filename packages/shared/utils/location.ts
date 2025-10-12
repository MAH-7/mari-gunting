import * as Location from 'expo-location';
import { Alert, Platform } from 'react-native';

/**
 * Location Services Utility
 * 
 * Handles location permissions, geolocation, and location-based features
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationData extends Coordinates {
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
}

export interface Address {
  street?: string;
  city?: string;
  region?: string; // State
  country?: string;
  postalCode?: string;
  name?: string; // Landmark name
  formattedAddress?: string;
}

/**
 * Request location permissions
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Location Permission Required',
        'Mari Gunting needs location access to find nearby barbers and show them on the map.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: () => {
              if (Platform.OS === 'ios') {
                Location.requestForegroundPermissionsAsync();
              }
            }
          },
        ]
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
}

/**
 * Request background location permissions (for tracking)
 */
export async function requestBackgroundLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Background Location Required',
        'To track your barber\'s arrival, we need background location access.',
        [{ text: 'OK' }]
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting background location permission:', error);
    return false;
  }
}

/**
 * Check if location services are enabled
 */
export async function isLocationEnabled(): Promise<boolean> {
  try {
    return await Location.hasServicesEnabledAsync();
  } catch (error) {
    console.error('Error checking location services:', error);
    return false;
  }
}

/**
 * Get current user location
 */
export async function getCurrentLocation(): Promise<LocationData | null> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      altitude: location.coords.altitude,
      altitudeAccuracy: location.coords.altitudeAccuracy,
      heading: location.coords.heading,
      speed: location.coords.speed,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
}

/**
 * Get high-accuracy location (for precise positioning)
 */
export async function getHighAccuracyLocation(): Promise<LocationData | null> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      altitude: location.coords.altitude,
      altitudeAccuracy: location.coords.altitudeAccuracy,
      heading: location.coords.heading,
      speed: location.coords.speed,
    };
  } catch (error) {
    console.error('Error getting high accuracy location:', error);
    return null;
  }
}

/**
 * Watch user location (continuous updates)
 */
export async function watchLocation(
  callback: (location: LocationData) => void,
  options?: {
    accuracy?: Location.Accuracy;
    distanceInterval?: number; // meters
    timeInterval?: number; // milliseconds
  }
): Promise<{ remove: () => void } | null> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      return null;
    }

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: options?.accuracy || Location.Accuracy.Balanced,
        distanceInterval: options?.distanceInterval || 10, // Update every 10 meters
        timeInterval: options?.timeInterval || 5000, // Update every 5 seconds
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          altitude: location.coords.altitude,
          altitudeAccuracy: location.coords.altitudeAccuracy,
          heading: location.coords.heading,
          speed: location.coords.speed,
        });
      }
    );

    return subscription;
  } catch (error) {
    console.error('Error watching location:', error);
    return null;
  }
}

/**
 * Reverse geocode: Get address from coordinates
 */
export async function reverseGeocode(
  coords: Coordinates
): Promise<Address | null> {
  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude: coords.latitude,
      longitude: coords.longitude,
    });

    if (addresses.length === 0) {
      return null;
    }

    const address = addresses[0];
    return {
      street: address.street || undefined,
      city: address.city || undefined,
      region: address.region || undefined,
      country: address.country || undefined,
      postalCode: address.postalCode || undefined,
      name: address.name || undefined,
      formattedAddress: formatAddress(address),
    };
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}

/**
 * Forward geocode: Get coordinates from address
 */
export async function forwardGeocode(
  address: string
): Promise<Coordinates | null> {
  try {
    const locations = await Location.geocodeAsync(address);

    if (locations.length === 0) {
      return null;
    }

    return {
      latitude: locations[0].latitude,
      longitude: locations[0].longitude,
    };
  } catch (error) {
    console.error('Error forward geocoding:', error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates (in kilometers)
 * Uses Haversine formula
 */
export function calculateDistance(
  from: Coordinates,
  to: Coordinates
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.latitude)) *
      Math.cos(toRad(to.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate bearing between two coordinates (in degrees)
 */
export function calculateBearing(
  from: Coordinates,
  to: Coordinates
): number {
  const dLon = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  const bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360; // Normalize to 0-360
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}

/**
 * Format address for display
 */
function formatAddress(address: Location.LocationGeocodedAddress): string {
  const parts = [];

  if (address.name) parts.push(address.name);
  if (address.street) parts.push(address.street);
  if (address.city) parts.push(address.city);
  if (address.region) parts.push(address.region);
  if (address.postalCode) parts.push(address.postalCode);

  return parts.filter(Boolean).join(', ');
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
function toDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Check if location is within radius
 */
export function isWithinRadius(
  center: Coordinates,
  point: Coordinates,
  radiusKm: number
): boolean {
  const distance = calculateDistance(center, point);
  return distance <= radiusKm;
}

/**
 * Get bounding box for a center point and radius
 */
export function getBoundingBox(
  center: Coordinates,
  radiusKm: number
): {
  northeast: Coordinates;
  southwest: Coordinates;
} {
  const R = 6371; // Earth's radius in kilometers
  const lat = toRad(center.latitude);
  const lon = toRad(center.longitude);

  // Angular distance
  const angular = radiusKm / R;

  const minLat = lat - angular;
  const maxLat = lat + angular;

  const deltaLon = Math.asin(Math.sin(angular) / Math.cos(lat));
  const minLon = lon - deltaLon;
  const maxLon = lon + deltaLon;

  return {
    northeast: {
      latitude: toDeg(maxLat),
      longitude: toDeg(maxLon),
    },
    southwest: {
      latitude: toDeg(minLat),
      longitude: toDeg(minLon),
    },
  };
}

/**
 * Sort locations by distance from a point
 */
export function sortByDistance<T extends { latitude: number; longitude: number }>(
  locations: T[],
  from: Coordinates
): (T & { distance: number })[] {
  return locations
    .map((location) => ({
      ...location,
      distance: calculateDistance(from, location),
    }))
    .sort((a, b) => a.distance - b.distance);
}
