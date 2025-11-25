import { Stack } from 'expo-router';
import { LogBox } from 'react-native';
import { useEffect } from 'react';
import { initializeMapbox } from '../utils/mapbox';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
// import * as Notifications from 'expo-notifications'; // Disabled - requires paid Apple Developer account
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@mari-gunting/shared/config/supabase';
import { pushService } from '../services/pushService';

// Ignore LogBox errors during development
LogBox.ignoreAllLogs(true);

const queryClient = new QueryClient();

// Define background location task at app startup (before it's used)
const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';
const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';

// Handle background data-only notifications (silent push)
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error, executionInfo }: any) => {
  try {
    const { notification } = data || {};
    const payload = notification?.request?.content?.data || {};
    const userId = (await AsyncStorage.getItem('currentUserId')) || (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    // Update heartbeat on silent push
    await supabase
      .from('profiles')
      .update({ last_heartbeat: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', userId);
    console.log('📡 [SILENT PUSH] Heartbeat updated');
  } catch (e) {
    console.log('⚠️ Background notification error', e);
  }
});

// Existing background location handler
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error('❌ Background location error:', error);
    return;
  }

  if (data) {
    const { locations } = data;
    if (locations && locations.length > 0) {
      const location = locations[0];
      const malaysiaTime = new Date().toLocaleString('en-MY', { 
        timeZone: 'Asia/Kuala_Lumpur',
        hour12: false 
      });
      console.log(`📍 [BACKGROUND TASK] ${malaysiaTime} Location update:`, {
        lat: location.coords.latitude.toFixed(6),
        lng: location.coords.longitude.toFixed(6),
        source: 'BACKGROUND_TASK',
      });

      try {
        // Get current user ID from auth
        console.log('🔍 Getting user for background update...');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.warn('⚠️ No user found for background location update');
          // Stop location tracking if no user
          await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
          console.log('🛑 Stopped location tracking (no user)');
          return;
        }
        console.log('✅ User found:', user.id);
        
        // CRITICAL: Check if task should even be running (handles iOS auto-restart)
        const shouldStop = await AsyncStorage.getItem('shouldStopLocationTask');
        if (shouldStop === 'true') {
          console.warn('🚫 Background task marked for stop - stopping now');
          await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
          await AsyncStorage.removeItem('shouldStopLocationTask');
          console.log('🛑 Stopped location tracking (marked for stop)');
          return;
        }
        
        // CRITICAL: Check if app was force closed (Android native detection)
        const forceCloseDetected = await AsyncStorage.getItem('forceCloseDetected');
        console.log(`🔍 [BACKGROUND] Checking forceCloseDetected flag: ${forceCloseDetected}`);
        if (forceCloseDetected === 'true') {
          console.warn('⚠️ Force close detected - setting offline and stopping ALL tracking');
          
          // Set user offline in database
          await supabase
            .from('profiles')
            .update({ is_online: false, updated_at: new Date().toISOString() })
            .eq('id', user.id);
          
          // Stop background location tracking
          await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
          
          // Clear flag
          await AsyncStorage.removeItem('forceCloseDetected');
          
          console.log('✅ User set offline and all location tracking stopped (force close)');
          return;
        }

        // CHECK IF USER IS STILL ONLINE - Critical for battery!
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_online')
          .eq('id', user.id)
          .single();

        if (profileError || !profile?.is_online) {
          console.warn('⚠️ User is offline or error checking status - stopping location tracking');
          // User went offline (force close) - stop tracking immediately!
          await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
          console.log('🛑 Stopped location tracking (user offline/force close)');
          return;
        }

        // User is online - update location in database
        const { error: locationError } = await supabase
          .from('profiles')
          .update({
            location: `POINT(${location.coords.longitude} ${location.coords.latitude})`,
            last_heartbeat: new Date().toISOString(), // Update heartbeat!
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (locationError) {
          console.error('❌ Failed to update location in background:', locationError);
        } else {
          console.log('✅ Background location + heartbeat updated');
        }
      } catch (err) {
        console.error('❌ Exception in background location update:', err);
        // On exception, stop tracking to prevent battery drain
        try {
          await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
          console.log('🛑 Stopped location tracking (exception)');
        } catch (stopErr) {
          console.error('❌ Failed to stop location tracking:', stopErr);
        }
      }
    }
  }
});

export default function PartnerRootLayout() {
  // Initialize Mapbox on app start
  useEffect(() => {
    initializeMapbox();

    // Register background notification task
    // Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch(() => {}); // Disabled - requires paid Apple Developer account

    // Reduce notification display (data-only)
    // Notifications.setNotificationHandler({
    //   handleNotification: async () => ({ shouldShowAlert: false, shouldPlaySound: false, shouldSetBadge: false }),
    // });

    // Store userId for background handlers and register push
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        await AsyncStorage.setItem('currentUserId', user.id);
        await pushService.registerForPush(user.id);
      }
    })();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="verify-otp" />
        <Stack.Screen name="complete-profile" />
        <Stack.Screen name="select-account-type" />
        <Stack.Screen name="pending-approval" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </QueryClientProvider>
  );
}
