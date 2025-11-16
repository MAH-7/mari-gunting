import AsyncStorage from '@react-native-async-storage/async-storage';

const BLACKLIST_KEY = '@quick_book_blacklist';
const BLACKLIST_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

export interface BlacklistedBarber {
  barberId: string;
  barberName: string;
  rejectedAt: number; // timestamp
  expiresAt: number; // timestamp
}

/**
 * Get all blacklisted barbers (excluding expired ones)
 */
export const getBlacklistedBarbers = async (): Promise<BlacklistedBarber[]> => {
  try {
    const data = await AsyncStorage.getItem(BLACKLIST_KEY);
    if (!data) return [];
    
    const blacklist: BlacklistedBarber[] = JSON.parse(data);
    const now = Date.now();
    
    // Filter out expired entries
    const activeBlacklist = blacklist.filter(entry => entry.expiresAt > now);
    
    // If we filtered any expired entries, update storage
    if (activeBlacklist.length !== blacklist.length) {
      await AsyncStorage.setItem(BLACKLIST_KEY, JSON.stringify(activeBlacklist));
    }
    
    return activeBlacklist;
  } catch (error) {
    console.error('[QuickBook] Error getting blacklist:', error);
    return [];
  }
};

/**
 * Add a barber to the blacklist (30-min duration)
 */
export const addToBlacklist = async (barberId: string, barberName: string): Promise<void> => {
  try {
    const blacklist = await getBlacklistedBarbers();
    const now = Date.now();
    
    // Check if barber is already blacklisted
    const existingIndex = blacklist.findIndex(entry => entry.barberId === barberId);
    
    if (existingIndex >= 0) {
      // Update existing entry (reset expiry)
      blacklist[existingIndex] = {
        barberId,
        barberName,
        rejectedAt: now,
        expiresAt: now + BLACKLIST_TTL,
      };
    } else {
      // Add new entry
      blacklist.push({
        barberId,
        barberName,
        rejectedAt: now,
        expiresAt: now + BLACKLIST_TTL,
      });
    }
    
    await AsyncStorage.setItem(BLACKLIST_KEY, JSON.stringify(blacklist));
    console.log(`[QuickBook] Added ${barberName} to blacklist (expires in 30 min)`);
  } catch (error) {
    console.error('[QuickBook] Error adding to blacklist:', error);
  }
};

/**
 * Check if a barber is blacklisted
 */
export const isBarberBlacklisted = async (barberId: string): Promise<boolean> => {
  const blacklist = await getBlacklistedBarbers();
  return blacklist.some(entry => entry.barberId === barberId);
};

/**
 * Clear all blacklist entries (useful for testing/debugging)
 */
export const clearBlacklist = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(BLACKLIST_KEY);
    console.log('[QuickBook] Blacklist cleared');
  } catch (error) {
    console.error('[QuickBook] Error clearing blacklist:', error);
  }
};

/**
 * Get blacklisted barber IDs only (for filtering)
 */
export const getBlacklistedBarberIds = async (): Promise<string[]> => {
  const blacklist = await getBlacklistedBarbers();
  return blacklist.map(entry => entry.barberId);
};
