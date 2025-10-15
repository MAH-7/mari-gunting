import * as Location from 'expo-location';
import { supabase } from '@mari-gunting/shared/config/supabase';
import { calculateDistance } from '@mari-gunting/shared/utils/location';

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export type TrackingMode = 'idle' | 'on-the-way';

class LocationTrackingService {
  private trackingInterval: NodeJS.Timeout | null = null;
  private isTracking = false;
  private currentMode: TrackingMode = 'idle';
  private currentUserId: string | null = null;
  private updateIntervalMs = {
    idle: 5 * 60 * 1000, // 5 minutes when just online
    'on-the-way': 1.5 * 60 * 1000, // 1.5 minutes when actively traveling to customer
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

    // Check and request permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.error('❌ Location permission denied');
      throw new Error('Location permission not granted');
    }

    this.isTracking = true;

    // Update location immediately
    await this.updateLocation(userId);

    // Set up periodic updates with mode-based interval
    const intervalMs = this.updateIntervalMs[mode];
    this.trackingInterval = setInterval(async () => {
      try {
        await this.updateLocation(userId);
      } catch (error) {
        console.error('❌ Error updating location:', error);
      }
    }, intervalMs);

    console.log(`⏱️ Update interval: ${intervalMs / 1000} seconds (${intervalMs / 60000} minutes)`);

    console.log('✅ Location tracking started');
  }

  /**
   * Stop tracking location
   */
  stopTracking(): void {
    if (!this.isTracking) {
      console.log('⚠️ Location tracking not active');
      return;
    }

    console.log('🛑 Stopping location tracking');

    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    this.isTracking = false;
    this.currentMode = 'idle'; // Reset to idle mode
    this.currentUserId = null;
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
   * Update location once
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
