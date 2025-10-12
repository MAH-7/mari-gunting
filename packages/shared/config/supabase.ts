import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper function to check connection
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('_health_check').select('*').limit(1);
    
    if (error && error.message.includes('relation "_health_check" does not exist')) {
      // This is expected - table doesn't exist but connection is working
      console.log('✅ Supabase connection successful');
      return true;
    }
    
    if (error) {
      console.error('❌ Supabase connection error:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
};

// Export configuration for debugging
export const supabaseConfig = {
  url: SUPABASE_URL,
  hasAnonKey: !!SUPABASE_ANON_KEY,
  isConfigured: !!(SUPABASE_URL && SUPABASE_ANON_KEY),
};
