import * as Location from 'expo-location';
import { Platform, Alert, Linking } from 'react-native';

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: Location.PermissionStatus;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  address?: string;
}

class LocationService {
  private static instance: LocationService;
  private currentLocation: UserLocation | null = null;
  private locationSubscription: Location.LocationSubscription | null = null;

  private constructor() {}

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Check if location services are enabled on the device
   */
  async isLocationEnabled(): Promise<boolean> {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      return enabled;
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  }

  /**
   * Check current permission status
   */
  async checkPermission(): Promise<LocationPermissionStatus> {
    try {
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      return {
        granted: status === Location.PermissionStatus.GRANTED,
        canAskAgain,
        status,
      };
    } catch (error) {
      console.error('Error checking location permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: Location.PermissionStatus.UNDETERMINED,
      };
    }
  }

  /**
   * Request location permission from user
   */
  async requestPermission(): Promise<LocationPermissionStatus> {
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      return {
        granted: status === Location.PermissionStatus.GRANTED,
        canAskAgain,
        status,
      };
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: Location.PermissionStatus.UNDETERMINED,
      };
    }
  }

  /**
   * Show alert to guide user to enable GPS
   */
  showEnableGPSAlert(): void {
    Alert.alert(
      'GPS Required',
      'This app needs GPS to find barbers near you and calculate travel costs. Please enable location services in your device settings.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Open Settings',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          },
        },
      ]
    );
  }

  /**
   * Show alert when permission is denied
   */
  showPermissionDeniedAlert(): void {
    Alert.alert(
      'Location Permission Required',
      'Mari Gunting needs location access to:\n\n• Find nearby barbers\n• Calculate travel costs\n• Show your current location\n\nPlease grant location permission in Settings.',
      [
        {
          text: 'Not Now',
          style: 'cancel',
        },
        {
          text: 'Open Settings',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          },
        },
      ]
    );
  }

  /**
   * Get current location
   */
  async getCurrentLocation(): Promise<UserLocation | null> {
    try {
      // Check if services are enabled
      const isEnabled = await this.isLocationEnabled();
      if (!isEnabled) {
        this.showEnableGPSAlert();
        return null;
      }

      // Check permission
      const permission = await this.checkPermission();
      if (!permission.granted) {
        const newPermission = await this.requestPermission();
        if (!newPermission.granted) {
          if (!newPermission.canAskAgain) {
            this.showPermissionDeniedAlert();
          }
          return null;
        }
      }

      // Get location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      };

      return this.currentLocation;
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your location. Please ensure GPS is enabled and try again.'
      );
      return null;
    }
  }

  /**
   * Get location with address (reverse geocoding)
   */
  async getCurrentLocationWithAddress(): Promise<UserLocation | null> {
    try {
      const location = await this.getCurrentLocation();
      if (!location) return null;

      // Reverse geocode to get address
      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.latitude,
        longitude: location.longitude,
      });

      if (addresses.length > 0) {
        const addr = addresses[0];
        const addressString = [
          addr.street,
          addr.district,
          addr.city,
          addr.region,
          addr.postalCode,
        ]
          .filter(Boolean)
          .join(', ');

        location.address = addressString;
      }

      return location;
    } catch (error) {
      console.error('Error getting address:', error);
      return this.currentLocation;
    }
  }

  /**
   * Start watching location changes
   */
  async startWatchingLocation(
    callback: (location: UserLocation) => void
  ): Promise<boolean> {
    try {
      // Check permission first
      const permission = await this.checkPermission();
      if (!permission.granted) {
        return false;
      }

      // Start watching
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 50, // Or when user moves 50 meters
        },
        (location) => {
          const userLocation: UserLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
          };
          this.currentLocation = userLocation;
          callback(userLocation);
        }
      );

      return true;
    } catch (error) {
      console.error('Error watching location:', error);
      return false;
    }
  }

  /**
   * Stop watching location changes
   */
  stopWatchingLocation(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
  }

  /**
   * Calculate distance between two coordinates (in km)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of Earth in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get cached location (last known)
   */
  getCachedLocation(): UserLocation | null {
    return this.currentLocation;
  }

  /**
   * Clear cached location
   */
  clearCache(): void {
    this.currentLocation = null;
  }
}

export const locationService = LocationService.getInstance();
