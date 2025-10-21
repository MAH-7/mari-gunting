import Constants from 'expo-constants';

/**
 * Environment Configuration
 * 
 * This file provides type-safe access to environment variables.
 * All configuration is loaded from app.config.ts extra field.
 */

export type AppEnvironment = 'development' | 'staging' | 'production';

interface EnvConfig {
  // Environment
  APP_ENV: AppEnvironment;
  
  // Supabase
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  
  // Mapbox
  MAPBOX_ACCESS_TOKEN?: string;
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_AVATAR_PRESET?: string;
  CLOUDINARY_PORTFOLIO_PRESET?: string;
  CLOUDINARY_BARBERSHOP_PRESET?: string;
  
  // Sentry
  SENTRY_DSN?: string;
  
  // Payment
  STRIPE_PUBLISHABLE_KEY?: string;
  FPX_MERCHANT_ID?: string;
  BILLPLZ_API_KEY?: string;
  BILLPLZ_COLLECTION_ID?: string;
  
  // Notifications
  FCM_API_KEY?: string;
  ONESIGNAL_APP_ID?: string;
  
  // Analytics
  GA_TRACKING_ID?: string;
  MIXPANEL_TOKEN?: string;
  
  // Feature Flags
  ENABLE_ANALYTICS: boolean;
  ENABLE_ERROR_TRACKING: boolean;
  ENABLE_PUSH_NOTIFICATIONS: boolean;
  ENABLE_CHAT: boolean;
  ENABLE_VIDEO_CALL: boolean;
  
  // App Config
  API_URL: string;
  WEB_URL?: string;
  APP_SCHEME: string;
  
  // Business Config
  COMMISSION_RATE: number;
  CANCELLATION_WINDOW: number;
  DEFAULT_SEARCH_RADIUS: number;
}

/**
 * Get environment configuration from Expo Constants
 */
function getEnvConfig(): EnvConfig {
  const extra = Constants.expoConfig?.extra || {};
  
  return {
    // Environment
    APP_ENV: extra.appEnv || 'development',
    
    // Supabase
    SUPABASE_URL: extra.supabaseUrl || '',
    SUPABASE_ANON_KEY: extra.supabaseAnonKey || '',
    
    // Mapbox
    MAPBOX_ACCESS_TOKEN: extra.mapboxAccessToken,
    
    // Cloudinary
    CLOUDINARY_CLOUD_NAME: extra.cloudinaryCloudName,
    CLOUDINARY_API_KEY: extra.cloudinaryApiKey,
    CLOUDINARY_AVATAR_PRESET: extra.cloudinaryAvatarPreset,
    CLOUDINARY_PORTFOLIO_PRESET: extra.cloudinaryPortfolioPreset,
    CLOUDINARY_BARBERSHOP_PRESET: extra.cloudinaryBarbershopPreset,
    
    // Sentry
    SENTRY_DSN: extra.sentryDsn,
    
    // Payment
    STRIPE_PUBLISHABLE_KEY: extra.stripePublishableKey,
    FPX_MERCHANT_ID: extra.fpxMerchantId,
    BILLPLZ_API_KEY: extra.billplzApiKey,
    BILLPLZ_COLLECTION_ID: extra.billplzCollectionId,
    
    // Notifications
    FCM_API_KEY: extra.fcmApiKey,
    ONESIGNAL_APP_ID: extra.oneSignalAppId,
    
    // Analytics
    GA_TRACKING_ID: extra.gaTrackingId,
    MIXPANEL_TOKEN: extra.mixpanelToken,
    
    // Feature Flags
    ENABLE_ANALYTICS: extra.enableAnalytics || false,
    ENABLE_ERROR_TRACKING: extra.enableErrorTracking || false,
    ENABLE_PUSH_NOTIFICATIONS: extra.enablePushNotifications || false,
    ENABLE_CHAT: extra.enableChat || false,
    ENABLE_VIDEO_CALL: extra.enableVideoCall || false,
    
    // App Config
    API_URL: extra.apiUrl || extra.supabaseUrl || '',
    WEB_URL: extra.webUrl,
    APP_SCHEME: extra.appScheme || 'marigunting',
    
    // Business Config
    COMMISSION_RATE: extra.commissionRate || 0.15,
    CANCELLATION_WINDOW: extra.cancellationWindow || 24,
    DEFAULT_SEARCH_RADIUS: extra.defaultSearchRadius || 10,
  };
}

/**
 * Validate required environment variables
 */
function validateEnv(config: EnvConfig): void {
  const requiredVars: Array<keyof EnvConfig> = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
  ];

  const missingVars = requiredVars.filter(key => !config[key]);

  if (missingVars.length > 0) {
    const error = `Missing required environment variables: ${missingVars.join(', ')}`;
    
    if (config.APP_ENV === 'production') {
      throw new Error(error);
    } else {
      console.warn('⚠️', error);
    }
  }
}

// Export singleton config
export const ENV = getEnvConfig();

// Validate on load
validateEnv(ENV);

/**
 * Helper functions
 */
export const isDevelopment = ENV.APP_ENV === 'development';
export const isStaging = ENV.APP_ENV === 'staging';
export const isProduction = ENV.APP_ENV === 'production';

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof Pick<EnvConfig, 
  'ENABLE_ANALYTICS' | 
  'ENABLE_ERROR_TRACKING' | 
  'ENABLE_PUSH_NOTIFICATIONS' | 
  'ENABLE_CHAT' | 
  'ENABLE_VIDEO_CALL'
>): boolean {
  return ENV[feature] === true;
}

/**
 * Log environment info (only in development)
 */
if (isDevelopment) {
  console.log('🌍 Environment:', ENV.APP_ENV);
  console.log('🔑 Supabase URL:', ENV.SUPABASE_URL);
  console.log('🗺️  Mapbox Token:', ENV.MAPBOX_ACCESS_TOKEN ? '✅' : '❌');
  console.log('☁️  Cloudinary:', ENV.CLOUDINARY_CLOUD_NAME ? '✅' : '❌');
  console.log('🚨 Sentry:', ENV.SENTRY_DSN ? '✅' : '❌');
  console.log('💳 Stripe:', ENV.STRIPE_PUBLISHABLE_KEY ? '✅' : '❌');
  console.log('💰 Billplz:', ENV.BILLPLZ_API_KEY ? '✅' : '❌');
  console.log('📦 Collection:', ENV.BILLPLZ_COLLECTION_ID || 'Not set');
}
