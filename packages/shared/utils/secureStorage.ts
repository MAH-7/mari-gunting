import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Secure Storage Utility
 * 
 * Provides encrypted storage for sensitive data like tokens, keys, etc.
 * Uses Expo SecureStore on native platforms and fallback to AsyncStorage on web.
 */

export enum SecureStorageKey {
  // Auth
  ACCESS_TOKEN = 'access_token',
  REFRESH_TOKEN = 'refresh_token',
  USER_SESSION = 'user_session',
  
  // User Preferences (encrypted)
  BIOMETRIC_ENABLED = 'biometric_enabled',
  PIN_CODE = 'pin_code',
  
  // Payment
  SAVED_CARDS = 'saved_cards',
  
  // Device
  DEVICE_ID = 'device_id',
  FCM_TOKEN = 'fcm_token',
}

/**
 * Save a value securely
 */
export async function setSecureItem(
  key: SecureStorageKey | string,
  value: string
): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      // Web fallback - use localStorage with warning
      if (__DEV__) {
        console.warn('⚠️ SecureStore not available on web, using localStorage');
      }
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (error) {
    console.error('Error saving to secure storage:', error);
    throw error;
  }
}

/**
 * Get a value securely
 */
export async function getSecureItem(
  key: SecureStorageKey | string
): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  } catch (error) {
    console.error('Error reading from secure storage:', error);
    return null;
  }
}

/**
 * Delete a secure item
 */
export async function deleteSecureItem(
  key: SecureStorageKey | string
): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (error) {
    console.error('Error deleting from secure storage:', error);
    throw error;
  }
}

/**
 * Save a JSON object securely
 */
export async function setSecureJSON<T>(
  key: SecureStorageKey | string,
  value: T
): Promise<void> {
  const jsonString = JSON.stringify(value);
  await setSecureItem(key, jsonString);
}

/**
 * Get a JSON object securely
 */
export async function getSecureJSON<T>(
  key: SecureStorageKey | string
): Promise<T | null> {
  const jsonString = await getSecureItem(key);
  
  if (!jsonString) {
    return null;
  }

  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Error parsing JSON from secure storage:', error);
    return null;
  }
}

/**
 * Clear all secure storage (use with caution!)
 */
export async function clearSecureStorage(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.clear();
    } else {
      // Delete all known keys
      const keys = Object.values(SecureStorageKey);
      await Promise.all(keys.map(key => deleteSecureItem(key)));
    }
  } catch (error) {
    console.error('Error clearing secure storage:', error);
    throw error;
  }
}

/**
 * Check if a key exists
 */
export async function hasSecureItem(
  key: SecureStorageKey | string
): Promise<boolean> {
  const value = await getSecureItem(key);
  return value !== null;
}

/**
 * Token Management Helpers
 */
export const TokenStorage = {
  async saveAccessToken(token: string): Promise<void> {
    await setSecureItem(SecureStorageKey.ACCESS_TOKEN, token);
  },

  async getAccessToken(): Promise<string | null> {
    return await getSecureItem(SecureStorageKey.ACCESS_TOKEN);
  },

  async saveRefreshToken(token: string): Promise<void> {
    await setSecureItem(SecureStorageKey.REFRESH_TOKEN, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return await getSecureItem(SecureStorageKey.REFRESH_TOKEN);
  },

  async clearTokens(): Promise<void> {
    await deleteSecureItem(SecureStorageKey.ACCESS_TOKEN);
    await deleteSecureItem(SecureStorageKey.REFRESH_TOKEN);
  },

  async saveUserSession(session: any): Promise<void> {
    await setSecureJSON(SecureStorageKey.USER_SESSION, session);
  },

  async getUserSession<T>(): Promise<T | null> {
    return await getSecureJSON<T>(SecureStorageKey.USER_SESSION);
  },

  async clearUserSession(): Promise<void> {
    await deleteSecureItem(SecureStorageKey.USER_SESSION);
  },
};

/**
 * Device Storage Helpers
 */
export const DeviceStorage = {
  async saveDeviceId(deviceId: string): Promise<void> {
    await setSecureItem(SecureStorageKey.DEVICE_ID, deviceId);
  },

  async getDeviceId(): Promise<string | null> {
    return await getSecureItem(SecureStorageKey.DEVICE_ID);
  },

  async saveFCMToken(token: string): Promise<void> {
    await setSecureItem(SecureStorageKey.FCM_TOKEN, token);
  },

  async getFCMToken(): Promise<string | null> {
    return await getSecureItem(SecureStorageKey.FCM_TOKEN);
  },
};
