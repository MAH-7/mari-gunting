import { ExpoConfig, ConfigContext } from '@expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const isProduction = process.env.EXPO_PUBLIC_APP_ENV === 'production';
  const isStaging = process.env.EXPO_PUBLIC_APP_ENV === 'staging';

  return {
    ...config,
    name: isProduction ? 'Mari Gunting' : isStaging ? 'Mari Gunting (Staging)' : 'Mari Gunting (Dev)',
    slug: 'mari-gunting-customer',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: isProduction 
        ? 'com.marigunting.app' 
        : isStaging 
        ? 'com.marigunting.app.staging' 
        : 'com.marigunting.app.dev',
      infoPlist: {
        NSLocationWhenInUseUsageDescription: 'Mari Gunting needs your location to find nearby barbers and calculate accurate travel costs.',
        NSLocationAlwaysUsageDescription: 'Mari Gunting needs your location to provide real-time updates for your bookings.',
        NSCameraUsageDescription: 'Mari Gunting needs camera access to take photos for your profile and reviews.',
        NSPhotoLibraryUsageDescription: 'Mari Gunting needs photo library access to upload images.',
      },
      config: {
        // Note: Using Mapbox, but keeping legacy iOS config structure
        googleMapsApiKey: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN,
      }
    },

    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      package: isProduction 
        ? 'com.marigunting.app' 
        : isStaging 
        ? 'com.marigunting.app.staging' 
        : 'com.marigunting.app.dev',
      permissions: [
        'ACCESS_COARSE_LOCATION',
        'ACCESS_FINE_LOCATION',
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
      ],
      config: {
        // Note: Using Mapbox, but keeping legacy Android config structure
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN,
        }
      }
    },

    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro'
    },

    plugins: [
      'expo-router',
      'expo-font',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission: 'Mari Gunting needs your location to find nearby barbers and provide the best service experience.'
        }
      ],
      [
        '@rnmapbox/maps',
        {
          RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOADS_TOKEN || process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN,
          RNMapboxMapsVersion: '10.19.0'
        }
      ],
      [
        '@sentry/react-native/expo',
        {
          organization: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
        }
      ],
      [
        'expo-build-properties',
        {
          android: {
            compileSdkVersion: 34,
            targetSdkVersion: 34,
            buildToolsVersion: '34.0.0',
            minSdkVersion: 23
          },
          ios: {
            deploymentTarget: '15.1'
          }
        }
      ]
    ],

    scheme: process.env.EXPO_PUBLIC_APP_SCHEME || 'marigunting',

    experiments: {
      typedRoutes: true
    },

    extra: {
      // Environment
      appEnv: process.env.EXPO_PUBLIC_APP_ENV || 'development',
      
      // Supabase
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      
      // Mapbox
      mapboxAccessToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN,
      
      // Cloudinary
      cloudinaryCloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME,
      cloudinaryApiKey: process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY,
      cloudinaryAvatarPreset: process.env.EXPO_PUBLIC_CLOUDINARY_AVATAR_PRESET,
      cloudinaryPortfolioPreset: process.env.EXPO_PUBLIC_CLOUDINARY_PORTFOLIO_PRESET,
      cloudinaryBarbershopPreset: process.env.EXPO_PUBLIC_CLOUDINARY_BARBERSHOP_PRESET,
      
      // Sentry
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      
      // Payment
      stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      fpxMerchantId: process.env.EXPO_PUBLIC_FPX_MERCHANT_ID,
      
      // Notifications
      fcmApiKey: process.env.EXPO_PUBLIC_FCM_API_KEY,
      oneSignalAppId: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID,
      
      // Analytics
      gaTrackingId: process.env.EXPO_PUBLIC_GA_TRACKING_ID,
      mixpanelToken: process.env.EXPO_PUBLIC_MIXPANEL_TOKEN,
      
      // Feature Flags
      enableAnalytics: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
      enableErrorTracking: process.env.EXPO_PUBLIC_ENABLE_ERROR_TRACKING === 'true',
      enablePushNotifications: process.env.EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS === 'true',
      enableChat: process.env.EXPO_PUBLIC_ENABLE_CHAT === 'true',
      enableVideoCall: process.env.EXPO_PUBLIC_ENABLE_VIDEO_CALL === 'true',
      
      // App Config
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      webUrl: process.env.EXPO_PUBLIC_WEB_URL,
      appScheme: process.env.EXPO_PUBLIC_APP_SCHEME,
      
      // Business Config
      commissionRate: parseFloat(process.env.EXPO_PUBLIC_COMMISSION_RATE || '0.15'),
      cancellationWindow: parseInt(process.env.EXPO_PUBLIC_CANCELLATION_WINDOW || '24'),
      defaultSearchRadius: parseInt(process.env.EXPO_PUBLIC_DEFAULT_SEARCH_RADIUS || '10'),

      // EAS
      eas: {
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID
      }
    },

    hooks: {
      postPublish: [
        {
          file: 'sentry-expo/upload-sourcemaps',
          config: {
            organization: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN,
          }
        }
      ]
    }
  };
};
