import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { locationService, UserLocation, LocationPermissionStatus } from '@/services/locationService';

export function useLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [permission, setPermission] = useState<LocationPermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check permission status
  const checkPermission = useCallback(async () => {
    const status = await locationService.checkPermission();
    setPermission(status);
    return status;
  }, []);

  // Request permission
  const requestPermission = useCallback(async () => {
    const status = await locationService.requestPermission();
    setPermission(status);
    return status;
  }, []);

  // Get current location
  const getCurrentLocation = useCallback(async (withAddress = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const loc = withAddress 
        ? await locationService.getCurrentLocationWithAddress()
        : await locationService.getCurrentLocation();
      
      if (loc) {
        setLocation(loc);
        return loc;
      } else {
        setError('Unable to get location');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Location error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh location on app resume
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkPermission();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkPermission]);

  // Initial permission check
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    location,
    permission,
    isLoading,
    error,
    getCurrentLocation,
    requestPermission,
    checkPermission,
    hasPermission: permission?.granted ?? false,
  };
}
