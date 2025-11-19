import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';

const { OnlineStatusModule } = NativeModules as any;

export const OnlineStatus = {
  async start(userId: string) {
    if (Platform.OS !== 'android') return;
    
    const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || '';
    const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || '';
    
    if (!OnlineStatusModule || !supabaseUrl || !supabaseAnonKey) {
      console.warn('OnlineStatusModule not available or missing config');
      return;
    }
    
    try {
      // Pass anon key (RPC function has SECURITY DEFINER to bypass RLS)
      await OnlineStatusModule.startService(userId, supabaseUrl, supabaseAnonKey);
      console.log('✅ Native online status service started');
    } catch (error) {
      console.error('Failed to start native online status service:', error);
    }
  },
  
  async stop() {
    if (Platform.OS !== 'android') return;
    
    if (!OnlineStatusModule) {
      console.warn('OnlineStatusModule not available');
      return;
    }
    
    try {
      await OnlineStatusModule.stopService();
      console.log('✅ Native online status service stopped');
    } catch (error) {
      console.error('Failed to stop native online status service:', error);
    }
  },
};
