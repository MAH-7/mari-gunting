/**
 * useLocationPermission Hook
 * 
 * Production-ready location permission management
 * Inspired by Grab's UX patterns
 * 
 * Features:
 * - Smart permission timing
 * - Permission state persistence
 * - Denial tracking
 * - Fallback strategies
 * - Settings deep-linking
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform, Linking, Alert } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  PERMISSION_ASKED: '@location_permission_asked',
  PERMISSION_DENIED_COUNT: '@location_permission_denied_count',
  LAST_ASKED_TIMESTAMP: '@location_last_asked_timestamp',
  USER_MANUALLY_DENIED: '@location_user_manually_denied',
};

export interface LocationPermissionState {
  status: 'granted' | 'denied' | 'not-asked' | 'blocked';
  canAskAgain: boolean;
  deniedCount: number;
  isLoading: boolean;
}

export interface UseLocationPermissionReturn extends LocationPermissionState {
  requestPermission: () => Promise<boolean>;
  openSettings: () => Promise<void>;
  shouldShowPermissionPrompt: () => Promise<boolean>;
  resetPermissionState: () => Promise<void>;
}

export function useLocationPermission(): UseLocationPermissionReturn {
  const [state, setState] = useState<LocationPermissionState>({
    status: 'not-asked',
    canAskAgain: true,
    deniedCount: 0,
    isLoading: true,
  });

  // Check current permission status
  const checkPermissionStatus = useCallback(async () => {
    try {
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      
      // Get denial count
      const deniedCountStr = await AsyncStorage.getItem(STORAGE_KEYS.PERMISSION_DENIED_COUNT);
      const deniedCount = deniedCountStr ? parseInt(deniedCountStr, 10) : 0;

      // Get manual denial flag
      const manuallyDenied = await AsyncStorage.getItem(STORAGE_KEYS.USER_MANUALLY_DENIED);

      let permissionStatus: 'granted' | 'denied' | 'not-asked' | 'blocked' = 'not-asked';

      if (status === 'granted') {
        permissionStatus = 'granted';
      } else if (!canAskAgain || deniedCount >= 3 || manuallyDenied === 'true') {
        permissionStatus = 'blocked';
      } else if (status === 'denied') {
        permissionStatus = 'denied';
      }

      setState({
        status: permissionStatus,
        canAskAgain,
        deniedCount,
        isLoading: false,
      });

      return permissionStatus;
    } catch (error) {
      console.error('[LocationPermission] Check status error:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
      return 'not-asked';
    }
  }, []);

  // Initialize permission check
  useEffect(() => {
    checkPermissionStatus();
  }, [checkPermissionStatus]);

  // Request location permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      // Check if we can ask
      const { canAskAgain } = await Location.getForegroundPermissionsAsync();
      
      if (!canAskAgain) {
        // Can't ask system again, show settings prompt
        showSettingsPrompt();
        setState((prev) => ({ ...prev, isLoading: false, status: 'blocked' }));
        return false;
      }

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();

      // Update asked timestamp
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_ASKED_TIMESTAMP,
        Date.now().toString()
      );

      if (status === 'granted') {
        // Reset denial count on success
        await AsyncStorage.setItem(STORAGE_KEYS.PERMISSION_DENIED_COUNT, '0');
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_MANUALLY_DENIED);
        
        setState({
          status: 'granted',
          canAskAgain: true,
          deniedCount: 0,
          isLoading: false,
        });

        console.log('✅ Location permission granted');
        return true;
      } else {
        // Increment denial count
        const currentCount = state.deniedCount + 1;
        await AsyncStorage.setItem(
          STORAGE_KEYS.PERMISSION_DENIED_COUNT,
          currentCount.toString()
        );

        const permissionStatus = currentCount >= 3 ? 'blocked' : 'denied';
        
        setState({
          status: permissionStatus,
          canAskAgain: currentCount < 3,
          deniedCount: currentCount,
          isLoading: false,
        });

        console.log(`❌ Location permission denied (count: ${currentCount})`);
        
        // Show settings prompt if blocked
        if (permissionStatus === 'blocked') {
          showSettingsPrompt();
        }
        
        return false;
      }
    } catch (error) {
      console.error('[LocationPermission] Request error:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [state.deniedCount]);

  // Show prompt to open settings
  const showSettingsPrompt = useCallback(() => {
    Alert.alert(
      'Location Permission Required',
      'Mari Gunting needs location access to find nearby barbers. Please enable location in your device settings.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: async () => {
            await AsyncStorage.setItem(STORAGE_KEYS.USER_MANUALLY_DENIED, 'true');
          },
        },
        {
          text: 'Open Settings',
          onPress: openSettings,
        },
      ]
    );
  }, []);

  // Open device settings
  const openSettings = useCallback(async () => {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('[LocationPermission] Open settings error:', error);
      Alert.alert('Error', 'Unable to open settings. Please open Settings app manually.');
    }
  }, []);

  // Determine if we should show permission prompt
  const shouldShowPermissionPrompt = useCallback(async (): Promise<boolean> => {
    try {
      // Don't show if already granted
      if (state.status === 'granted') {
        return false;
      }

      // Don't show if blocked
      if (state.status === 'blocked') {
        return false;
      }

      // Check last asked time (don't ask too frequently)
      const lastAskedStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ASKED_TIMESTAMP);
      if (lastAskedStr) {
        const lastAsked = parseInt(lastAskedStr, 10);
        const hoursSinceLastAsk = (Date.now() - lastAsked) / (1000 * 60 * 60);
        
        // Wait at least 24 hours before asking again
        if (hoursSinceLastAsk < 24) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('[LocationPermission] Should show prompt error:', error);
      return false;
    }
  }, [state.status]);

  // Reset permission state (for testing)
  const resetPermissionState = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.PERMISSION_ASKED,
        STORAGE_KEYS.PERMISSION_DENIED_COUNT,
        STORAGE_KEYS.LAST_ASKED_TIMESTAMP,
        STORAGE_KEYS.USER_MANUALLY_DENIED,
      ]);
      
      await checkPermissionStatus();
      
      console.log('🔄 Permission state reset');
    } catch (error) {
      console.error('[LocationPermission] Reset error:', error);
    }
  }, [checkPermissionStatus]);

  return {
    ...state,
    requestPermission,
    openSettings,
    shouldShowPermissionPrompt,
    resetPermissionState,
  };
}
