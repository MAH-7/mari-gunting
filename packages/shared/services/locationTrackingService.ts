import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { supabase } from '@mari-gunting/shared/config/supabase';
import { calculateDistance } from '@mari-gunting/shared/utils/location';

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export type TrackingMode = 'idle' | 'on-the-way';

const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';

class LocationTrackingService {
  private trackingInterval: NodeJS.Timeout | null = null;
  private foregroundWatcher: Location.LocationSubscription | null = null;
  private isTracking = false;
  private currentMode: TrackingMode = 'idle';
  private currentUserId: string | null = null;
  private backgroundTaskRegistered = false;
  private lastLocationUpdate: number = 0;
  // PRODUCTION SETTINGS (Grab/Foodpanda standard)
  private updateIntervalMs = {
    idle: 30 * 1000, // 30 seconds when idle (frequent for customer visibility)
    'on-the-way': 10 * 1000, // 10 seconds when traveling (near real-time)
  };

  /**
   * Start tracking location for a barber
   * @param userId - User ID of the barber
   * @param mode - Tracking mode: 'idle' (every 5 min) or 'on-the-way' (every 1.5 min)
   */
  async startTracking(userId: string, mode: TrackingMode = 'idle'): Promise<void> {
    if (this.isTracking) {
      console.log('⚠️ Location tracking already active');
      return;
    }

    this.currentMode = mode;
    this.currentUserId = userId;
    console.log(`📍 Starting location tracking for user: ${userId} (mode: ${mode})`);

    // Request background location permission ("Always Allow")
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.error('❌ Location permission denied');
      throw new Error('Location permission not granted');
    }

    // Request background permission
    const bgStatus = await Location.requestBackgroundPermissionsAsync();
    if (bgStatus.status !== 'granted') {
      console.warn('⚠️ Background location permission denied - will only track in foreground');
    } else {
      console.log('✅ Background location permission granted');
    }

    this.isTracking = true;

    // Update location immediately
    await this.updateLocation(userId);

    // PRODUCTION: Continuous foreground tracking (Grab/Foodpanda standard)
    // Use watchPositionAsync for real-time updates when app is active
    console.log('🎯 Starting continuous foreground tracking...');
    this.foregroundWatcher = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: mode === 'on-the-way' ? 5000 : 15000, // 5s when traveling, 15s when idle
        distanceInterval: mode === 'on-the-way' ? 10 : 50, // 10m when traveling, 50m when idle
      },
      async (location) => {
        try {
          const now = Date.now();
          // Throttle updates to avoid overwhelming the server
          if (now - this.lastLocationUpdate < this.updateIntervalMs[mode]) {
            return;
          }
          this.lastLocationUpdate = now;

          console.log('📍 [FOREGROUND WATCH] Location update:', {
            lat: location.coords.latitude.toFixed(6),
            lng: location.coords.longitude.toFixed(6),
            mode: mode,
          });

          await this.updateLocationFromCoords(userId, location.coords, mode);
        } catch (error) {
          console.error('❌ Error in foreground watcher:', error);
        }
      }
    );
    console.log('✅ Continuous foreground tracking started');

    // Start background location tracking (for when app is minimized)
    await this.startBackgroundLocationTracking(userId, mode);

    console.log('✅ Location tracking started (foreground + background)');
  }

  /**
   * Stop tracking location
   */
  async stopTracking(): Promise<void> {
    if (!this.isTracking) {
      console.log('⚠️ Location tracking not active');
      return;
    }

    console.log('🛑 Stopping location tracking');

    // Stop foreground watcher
    if (this.foregroundWatcher) {
      this.foregroundWatcher.remove();
      this.foregroundWatcher = null;
      console.log('🛑 Foreground watcher stopped');
    }

    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    // Stop background location tracking
    await this.stopBackgroundLocationTracking();

    this.isTracking = false;
    this.currentMode = 'idle'; // Reset to idle mode
    this.currentUserId = null;
    this.lastLocationUpdate = 0;
    console.log('✅ Location tracking stopped');
  }

  /**
   * Switch tracking mode (changes update frequency)
   * @param userId - User ID of the barber
   * @param newMode - New tracking mode to switch to
   */
  async switchMode(userId: string, newMode: TrackingMode): Promise<void> {
    if (!this.isTracking) {
      console.log('⚠️ Cannot switch mode - tracking not active');
      return;
    }

    if (this.currentMode === newMode) {
      console.log(`ℹ️ Already in ${newMode} mode`);
      return;
    }

    console.log(`🔄 Switching tracking mode: ${this.currentMode} → ${newMode}`);

    // Stop current tracking
    this.stopTracking();

    // Start with new mode
    await this.startTracking(userId, newMode);

    console.log('✅ Mode switched successfully');
  }

  /**
   * Update location from coordinates (used by foreground watcher and background task)
   */
  private async updateLocationFromCoords(
    userId: string,
    coords: { latitude: number; longitude: number; accuracy?: number | null },
    mode: TrackingMode
  ): Promise<void> {
    try {
      const locationData: LocationUpdate = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy || undefined,
        timestamp: Date.now(),
      };

      // Update in Supabase - PostGIS format + heartbeat
      const { error } = await supabase
        .from('profiles')
        .update({
          location: `POINT(${locationData.longitude} ${locationData.latitude})`,
          last_heartbeat: new Date().toISOString(), // Update heartbeat with every location
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Error updating location in Supabase:', error);
        throw error;
      }

      console.log('✅ Location + heartbeat updated in database');

      // If in on-the-way mode, update booking metrics
      if (mode === 'on-the-way') {
        await this.updateActiveBookingMetrics(userId, locationData);
      }
    } catch (error) {
      console.error('❌ Error in updateLocationFromCoords:', error);
      throw error;
    }
  }

  /**
   * Update location once (legacy method, now uses updateLocationFromCoords)
   */
  async updateLocation(userId: string): Promise<LocationUpdate | null> {
    try {
      console.log('📍 Getting current location...');

      // Check and request permission first
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('❌ Location permission denied');
        throw new Error('Location permission not granted');
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const locationData: LocationUpdate = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        timestamp: location.timestamp,
      };

      console.log('📍 Location obtained:', {
        lat: locationData.latitude.toFixed(6),
        lng: locationData.longitude.toFixed(6),
        accuracy: locationData.accuracy?.toFixed(2),
      });

      // Update in Supabase - PostGIS format
      const { error } = await supabase
        .from('profiles')
        .update({
          location: `POINT(${locationData.longitude} ${locationData.latitude})`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Error updating location in Supabase:', error);
        throw error;
      }

      console.log('✅ Location updated in database');

      // If in on-the-way mode, update booking metrics
      if (this.currentMode === 'on-the-way' && this.currentUserId) {
        await this.updateActiveBookingMetrics(userId, locationData);
      }

      return locationData;
    } catch (error) {
      console.error('❌ Error in updateLocation:', error);
      throw error;
    }
  }

  /**
   * Update booking metrics for active bookings
   * Calculates distance and ETA, then updates the database
   */
  private async updateActiveBookingMetrics(
    userId: string,
    currentLocation: LocationUpdate
  ): Promise<void> {
    try {
      // Find active bookings for this barber
      const { data: bookings, error: fetchError } = await supabase
        .from('bookings')
        .select('id, customer_location_lat, customer_location_lng')
        .eq('barber_id', userId)
        .in('status', ['accepted', 'confirmed', 'in_progress'])
        .limit(1);

      if (fetchError) {
        console.warn('⚠️ Error fetching active bookings:', fetchError);
        return;
      }

      if (!bookings || bookings.length === 0) {
        console.log('ℹ️ No active bookings to update');
        return;
      }

      // Update metrics for each active booking
      for (const booking of bookings) {
        if (!booking.customer_location_lat || !booking.customer_location_lng) {
          console.warn('⚠️ Booking missing customer location:', booking.id);
          continue;
        }

        // Calculate distance
        const distanceKm = calculateDistance(
          { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
          { 
            latitude: parseFloat(booking.customer_location_lat), 
            longitude: parseFloat(booking.customer_location_lng) 
          }
        );

        // Calculate ETA (simple: 30 km/h average speed in city)
        const averageSpeedKmH = 30;
        const etaMinutes = Math.ceil((distanceKm / averageSpeedKmH) * 60);

        // Update database
        const { error: updateError } = await supabase.rpc('update_tracking_metrics', {
          p_booking_id: booking.id,
          p_distance_km: distanceKm,
          p_eta_minutes: etaMinutes,
        });

        if (updateError) {
          console.error('❌ Error updating tracking metrics:', updateError);
        } else {
          console.log(`✅ Booking metrics updated: ${distanceKm.toFixed(1)}km, ${etaMinutes} min`);
        }
      }
    } catch (err) {
      console.error('❌ Error in updateActiveBookingMetrics:', err);
    }
  }

  /**
   * Get current tracking status
   */
  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  /**
   * Get current tracking mode
   */
  getCurrentMode(): TrackingMode {
    return this.currentMode;
  }

  /**
   * Get update interval for a specific mode (in milliseconds)
   */
  getUpdateInterval(mode?: TrackingMode): number {
    return mode ? this.updateIntervalMs[mode] : this.updateIntervalMs[this.currentMode];
  }

  /**
   * Start background location tracking
   * PRODUCTION: Dual-mode tracking for maximum reliability (Grab/Foodpanda standard)
   * - Mode 1: High-frequency updates when moving (real-time)
   * - Mode 2: Significant location changes when stationary (survives force close)
   */
  private async startBackgroundLocationTracking(userId: string, mode: TrackingMode): Promise<void> {
    try {
      // Force stop any existing location updates first (clean slate)
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      
      if (hasStarted) {
        console.log('🔄 Background location was running, restarting...');
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      }

      // Task is defined in app/_layout.tsx at startup
      console.log('🚀 Starting PRODUCTION background location updates...');

      // PRODUCTION SETTINGS (Grab/Foodpanda standard)
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        // Accuracy: Balanced for battery vs precision trade-off
        accuracy: mode === 'on-the-way' ? Location.Accuracy.High : Location.Accuracy.Balanced,
        
        // Distance: Update every 20m when moving (catches all significant movement)
        distanceInterval: mode === 'on-the-way' ? 20 : 50,
        
        // Time: Real-time updates (10-15s)
        timeInterval: mode === 'on-the-way' ? 10000 : 15000, // 10s traveling, 15s idle
        
        // iOS: Never pause (critical for production)
        pausesUpdatesAutomatically: false,
        
        // iOS: Navigation mode gets highest priority from iOS
        activityType: Location.ActivityType.OtherNavigation,
        
        // iOS: Show blue bar (user knows we're tracking)
        showsBackgroundLocationIndicator: true,
        
        // iOS: Defer updates when possible to save battery (iOS optimizes this)
        deferredUpdatesInterval: 30000, // Batch updates every 30s when idle
        deferredUpdatesDistance: 100, // Or every 100m
        
        // Android: Foreground service with notification (required)
        foregroundService: {
          notificationTitle: 'Mari Gunting - You\'re Online',
          notificationBody: mode === 'on-the-way' 
            ? 'Tracking your route to customer' 
            : 'Customers can see you',
          notificationColor: '#00B87C',
        },
      });

      this.backgroundTaskRegistered = true;
      console.log('✅ PRODUCTION background tracking started:', {
        mode,
        timeInterval: mode === 'on-the-way' ? '10s' : '15s',
        distanceInterval: mode === 'on-the-way' ? '20m' : '50m',
      });
    } catch (error) {
      console.error('❌ Failed to start background location tracking:', error);
    }
  }

  /**
   * Stop background location tracking
   */
  private async stopBackgroundLocationTracking(): Promise<void> {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
      
      if (isRegistered) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        console.log('🛑 Background location tracking stopped');
      }
      
      this.backgroundTaskRegistered = false;
    } catch (error) {
      console.error('❌ Failed to stop background location tracking:', error);
    }
  }

  /**
   * @deprecated Use switchMode() instead to dynamically change tracking frequency
   * Set update interval (in minutes) - for manual override
   */
  setUpdateInterval(minutes: number, mode: TrackingMode = 'idle'): void {
    this.updateIntervalMs[mode] = minutes * 60 * 1000;
    console.log(`⏱️ Update interval for ${mode} mode set to ${minutes} minutes`);

    // Restart tracking if active and in this mode
    if (this.isTracking && this.currentMode === mode && this.trackingInterval) {
      console.log('ℹ️ Restart tracking to apply new interval');
    }
  }
}

// Export singleton instance
export const locationTrackingService = new LocationTrackingService();
