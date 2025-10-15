import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  AppState,
  Vibration,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapboxGL from '@rnmapbox/maps';
// import * as Notifications from 'expo-notifications';
// import { Audio } from 'expo-av';

import { useRealtimeBarberLocation } from '../../hooks/useRealtimeBarberLocation';
import { useLocation } from '../../hooks/useLocation';
import { calculateETA } from '../../utils/eta';
import { supabase } from '@mari-gunting/shared/config/supabase';

// Configure notification handler
// TODO: Re-enable when switching to development build with native modules
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: false,
//   }),
// });

interface BookingDetails {
  id: string;
  barberId: string;
  barberName: string;
  barberPhone: string;
  barberAvatar?: string;
  customerLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  scheduledTime: Date;
  status: string;
}

export default function TrackBarberScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ bookingId: string }>();
  const { bookingId } = params;

  // State
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNotifiedArrival, setHasNotifiedArrival] = useState(false);
  const [trackingSession, setTrackingSession] = useState<any>(null);
  
  // Refs
  const mapRef = useRef<MapboxGL.Camera>(null);
  // const soundRef = useRef<Audio.Sound | null>(null);
  const appState = useRef(AppState.currentState);

  // Hooks
  const { location: customerLocation } = useLocation();
  const {
    location: barberLocation,
    isConnected,
    error: locationError,
    lastUpdated,
  } = useRealtimeBarberLocation(booking?.barberId || null, !!booking);

  // Calculate ETA
  const eta = barberLocation && booking
    ? calculateETA(
        { lat: barberLocation.latitude, lng: barberLocation.longitude },
        { lat: booking.customerLocation.latitude, lng: booking.customerLocation.longitude }
      )
    : null;

  // Fetch booking details
  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) {
        setError('No booking ID provided');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('bookings')
          .select(`
            id,
            barber_id,
            customer_location_lat,
            customer_location_lng,
            customer_address,
            scheduled_time,
            status,
            barber:barbers!bookings_barber_id_fkey(
              profile:profiles!barbers_user_id_fkey(
                full_name,
                phone_number,
                avatar_url
              )
            )
          `)
          .eq('id', bookingId)
          .single();

        if (fetchError) throw fetchError;

        if (!data) {
          setError('Booking not found');
          setLoading(false);
          return;
        }

        const bookingData: BookingDetails = {
          id: data.id,
          barberId: data.barber_id,
          barberName: data.barber?.profile?.full_name || 'Unknown',
          barberPhone: data.barber?.profile?.phone_number || '',
          barberAvatar: data.barber?.profile?.avatar_url,
          customerLocation: {
            latitude: parseFloat(data.customer_location_lat || '0'),
            longitude: parseFloat(data.customer_location_lng || '0'),
            address: data.customer_address || '',
          },
          scheduledTime: new Date(data.scheduled_time),
          status: data.status,
        };

        setBooking(bookingData);
        setLoading(false);

        console.log('✅ Booking loaded:', bookingData);
      } catch (err) {
        console.error('❌ Failed to fetch booking:', err);
        setError(err instanceof Error ? err.message : 'Failed to load booking');
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  // Fetch real-time tracking session data
  useEffect(() => {
    if (!bookingId) return;

    const fetchTrackingSession = async () => {
      try {
        const { data, error: trackingError } = await supabase
          .from('active_tracking_sessions')
          .select('*')
          .eq('booking_id', bookingId)
          .single();

        if (trackingError && trackingError.code !== 'PGRST116') {
          // PGRST116 = no rows found, which is okay
          console.warn('⚠️ Tracking session error:', trackingError);
        }

        if (data) {
          setTrackingSession(data);
          console.log('📍 Tracking session updated:', data);
        }
      } catch (err) {
        console.error('❌ Failed to fetch tracking session:', err);
      }
    };

    // Initial fetch
    fetchTrackingSession();

    // Poll every 30 seconds for updates
    const interval = setInterval(fetchTrackingSession, 30000);

    return () => clearInterval(interval);
  }, [bookingId]);

  // Handle arrival notification with sound and vibration
  useEffect(() => {
    if (!eta || !barberLocation || !booking || hasNotifiedArrival) return;

    // Trigger arrival notification when barber is within 100 meters
    if (eta.distanceKm < 0.1) {
      setHasNotifiedArrival(true);
      handleArrivalNotification();
    }
  }, [eta, barberLocation, booking, hasNotifiedArrival]);

  // Handle arrival notification
  const handleArrivalNotification = async () => {
    try {
      // Vibrate device
      if (Platform.OS === 'ios') {
        // iOS double vibration pattern
        Vibration.vibrate([0, 400, 200, 400]);
      } else {
        // Android vibration pattern
        Vibration.vibrate([0, 500, 200, 500, 200, 500]);
      }

      // Show alert (notifications disabled for Expo Go)
      Alert.alert(
        '🎉 Barber Arrived!',
        `${booking?.barberName} has arrived at your location.`,
        [{ text: 'OK', style: 'default' }]
      );
      
      console.log('📍 Barber arrived notification triggered');
    } catch (err) {
      console.error('❌ Failed to send arrival notification:', err);
    }
  };

  // Cleanup sound on unmount
  // useEffect(() => {
  //   return () => {
  //     if (soundRef.current) {
  //       soundRef.current.unloadAsync();
  //     }
  //   };
  // }, []);

  // Handle app state changes for background tracking
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('📱 App has come to foreground - refreshing location');
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Auto-center map on barber location
  const centerMapOnBarber = () => {
    if (barberLocation && mapRef.current) {
      mapRef.current.setCamera({
        centerCoordinate: [barberLocation.longitude, barberLocation.latitude],
        zoomLevel: 15,
        animationDuration: 1000,
      });
    }
  };

  // Auto-fit both locations
  const fitBothLocations = () => {
    if (barberLocation && booking && mapRef.current) {
      mapRef.current.fitBounds(
        [barberLocation.longitude, barberLocation.latitude],
        [booking.customerLocation.longitude, booking.customerLocation.latitude],
        [50, 100, 50, 300], // padding: top, right, bottom, left
        1000 // animation duration
      );
    }
  };

  // Handle call barber
  const handleCallBarber = () => {
    if (booking?.barberPhone) {
      // Open phone dialer
      Alert.alert(
        'Call Barber',
        `Call ${booking.barberName} at ${booking.barberPhone}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Call',
            onPress: () => {
              // TODO: Implement phone call using Linking
              console.log('Calling:', booking.barberPhone);
            },
          },
        ]
      );
    }
  };

  // Render loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      </View>
    );
  }

  // Render error state
  if (error || !booking) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text style={styles.errorText}>{error || 'Booking not found'}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapboxGL.MapView style={styles.map}>
        <MapboxGL.Camera
          ref={mapRef}
          zoomLevel={14}
          centerCoordinate={
            barberLocation
              ? [barberLocation.longitude, barberLocation.latitude]
              : [booking.customerLocation.longitude, booking.customerLocation.latitude]
          }
        />

        {/* Customer Location Pin */}
        <MapboxGL.PointAnnotation
          id="customer-location"
          coordinate={[booking.customerLocation.longitude, booking.customerLocation.latitude]}
        >
          <View style={styles.customerPin}>
            <Ionicons name="home" size={24} color="#fff" />
          </View>
        </MapboxGL.PointAnnotation>

        {/* Barber Location Pin */}
        {barberLocation && (
          <MapboxGL.PointAnnotation
            id="barber-location"
            coordinate={[barberLocation.longitude, barberLocation.latitude]}
          >
            <View style={styles.barberPin}>
              <Ionicons name="scissors" size={24} color="#fff" />
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {/* Route Line (optional - can be added with directions API) */}
      </MapboxGL.MapView>

      {/* Connection Status Badge */}
      <View style={[styles.statusBadge, isConnected ? styles.connected : styles.disconnected]}>
        <View style={[styles.statusDot, isConnected ? styles.connectedDot : styles.disconnectedDot]} />
        <Text style={styles.statusText}>
          {isConnected ? 'Live Tracking' : 'Connecting...'}
        </Text>
      </View>

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.mapButton} onPress={centerMapOnBarber}>
          <Ionicons name="locate" size={24} color="#1F2937" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.mapButton} onPress={fitBothLocations}>
          <Ionicons name="resize" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {/* Bottom Info Panel */}
      <View style={styles.bottomPanel}>
        {/* Barber Info */}
        <View style={styles.barberInfo}>
          <View style={styles.barberAvatar}>
            {booking.barberAvatar ? (
              <Text>TODO: Image</Text>
            ) : (
              <Ionicons name="person" size={32} color="#6B7280" />
            )}
          </View>
          <View style={styles.barberDetails}>
            <Text style={styles.barberName}>{booking.barberName}</Text>
            <Text style={styles.barberStatus}>
              {trackingSession?.current_eta_minutes 
                ? `${trackingSession.current_eta_minutes} min away` 
                : eta 
                ? `${eta.durationMinutes} min away` 
                : 'Calculating...'}
            </Text>
          </View>
          <TouchableOpacity style={styles.callButton} onPress={handleCallBarber}>
            <Ionicons name="call" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ETA Info */}
        {(eta || trackingSession) && (
          <View style={styles.etaInfo}>
            <View style={styles.etaItem}>
              <Text style={styles.etaLabel}>Distance</Text>
              <Text style={styles.etaValue}>
                {trackingSession?.current_distance_km 
                  ? `${trackingSession.current_distance_km.toFixed(1)} km`
                  : eta 
                  ? `${eta.distanceKm.toFixed(1)} km`
                  : '--'}
              </Text>
            </View>
            <View style={styles.etaDivider} />
            <View style={styles.etaItem}>
              <Text style={styles.etaLabel}>ETA</Text>
              <Text style={styles.etaValue}>
                {trackingSession?.current_eta_minutes 
                  ? `${trackingSession.current_eta_minutes} min`
                  : eta 
                  ? `${eta.durationMinutes} min`
                  : '--'}
              </Text>
            </View>
            <View style={styles.etaDivider} />
            <View style={styles.etaItem}>
              <Text style={styles.etaLabel}>Updated</Text>
              <Text style={styles.etaValue}>
                {trackingSession?.minutes_since_last_update !== undefined
                  ? `${Math.floor(trackingSession.minutes_since_last_update)}m ago`
                  : lastUpdated 
                  ? `${Math.floor((Date.now() - lastUpdated.getTime()) / 1000)}s ago` 
                  : 'Never'}
              </Text>
            </View>
          </View>
        )}

        {/* Address */}
        <View style={styles.addressContainer}>
          <Ionicons name="location" size={20} color="#6B7280" />
          <Text style={styles.addressText}>{booking.customerLocation.address}</Text>
        </View>

        {/* Error Message */}
        {locationError && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning" size={16} color="#DC2626" />
            <Text style={styles.errorBannerText}>{locationError}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    position: 'absolute',
    top: 60,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  connected: {
    borderWidth: 1,
    borderColor: '#10B981',
  },
  disconnected: {
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectedDot: {
    backgroundColor: '#10B981',
  },
  disconnectedDot: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  mapControls: {
    position: 'absolute',
    top: 60,
    right: 16,
    gap: 8,
  },
  mapButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  barberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  barberAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  barberDetails: {
    flex: 1,
  },
  barberName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  barberStatus: {
    fontSize: 14,
    color: '#6B7280',
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  etaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 16,
  },
  etaItem: {
    alignItems: 'center',
  },
  etaLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  etaValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  etaDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  addressText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#4B5563',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  errorBannerText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#DC2626',
  },
  customerPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  barberPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
});
