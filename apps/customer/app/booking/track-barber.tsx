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
  Image,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapboxGL from '@rnmapbox/maps';
// import * as Notifications from 'expo-notifications';
// import { Audio } from 'expo-av';

import { useRealtimeBarberLocation } from '../../hooks/useRealtimeBarberLocation';
import { useLocation } from '../../hooks/useLocation';
import { calculateETAFromCoords } from '../../utils/eta';
import { supabase } from '@mari-gunting/shared/config/supabase';
import { Colors, theme } from '@mari-gunting/shared/theme';

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
  const insets = useSafeAreaInsets();

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
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Hooks
  const { location: customerLocation } = useLocation();
  const {
    location: barberLocation,
    isConnected,
    error: locationError,
    lastUpdated,
  } = useRealtimeBarberLocation(booking?.barberId || null, !!booking);

  // Pulsing animation for live tracking dot
  useEffect(() => {
    if (isConnected) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isConnected, pulseAnim]);

  // Calculate ETA
  const eta = barberLocation && booking
    ? calculateETAFromCoords(
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
            customer_address,
            scheduled_time,
            status,
            barber:barbers!bookings_barber_id_fkey(
              user_id,
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

        // Extract lat/lng from customer_address JSONB
        const address = data.customer_address || {};
        const fullAddress = [
          address.line1,
          address.line2,
          address.city,
          address.state,
          address.postalCode
        ].filter(Boolean).join(', ');

        const bookingData: BookingDetails = {
          id: data.id,
          barberId: data.barber?.user_id || data.barber_id, // Use user_id for profiles query
          barberName: data.barber?.profile?.full_name || 'Unknown',
          barberPhone: data.barber?.profile?.phone_number || '',
          barberAvatar: data.barber?.profile?.avatar_url,
          customerLocation: {
            latitude: parseFloat(address.lat || '0'),
            longitude: parseFloat(address.lng || '0'),
            address: fullAddress || 'Location not available',
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
          <Ionicons name="alert-circle" size={64} color={Colors.error} />
          <Text style={styles.errorText}>{error || 'Booking not found'}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Calculate arrival time - prioritize database ETA over client calculation
  const etaMinutes = trackingSession?.current_eta_minutes || eta?.durationMinutes;
  const arrivalTime = etaMinutes
    ? new Date(Date.now() + etaMinutes * 60000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    : null;

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={[styles.header, { height: 60 + insets.top, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButtonHeader} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Barber</Text>
        <View style={styles.headerRight} />
      </View>

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

        {/* Customer Location Marker - Grab style */}
        <MapboxGL.MarkerView
          id="customer-marker"
          coordinate={[booking.customerLocation.longitude, booking.customerLocation.latitude]}
        >
          <View style={styles.customerMarker}>
            <View style={styles.markerInner}>
              <Ionicons name="home" size={20} color="#fff" />
            </View>
            <View style={styles.markerArrow} />
          </View>
        </MapboxGL.MarkerView>

        {/* Route Line - Straight line from barber to customer */}
        {barberLocation && (
          <MapboxGL.ShapeSource
            id="route-line-source"
            shape={{
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: [
                  [barberLocation.longitude, barberLocation.latitude],
                  [booking.customerLocation.longitude, booking.customerLocation.latitude],
                ],
              },
            }}
          >
            <MapboxGL.LineLayer
              id="route-line"
              style={{
                lineColor: '#10B981',
                lineWidth: 3,
                lineCap: 'round',
                lineOpacity: 0.7,
                lineDasharray: [2, 2],
              }}
            />
          </MapboxGL.ShapeSource>
        )}

        {/* Barber Location Marker - Grab style */}
        {barberLocation && (
          <MapboxGL.MarkerView
            id="barber-marker"
            coordinate={[barberLocation.longitude, barberLocation.latitude]}
          >
            <View style={styles.barberMarker}>
              <View style={[styles.markerInner, { backgroundColor: '#10B981' }]}>
                <Ionicons name="person" size={20} color="#fff" />
              </View>
              <View style={[styles.markerArrow, { borderTopColor: '#10B981' }]} />
            </View>
          </MapboxGL.MarkerView>
        )}
      </MapboxGL.MapView>

      {/* Connection Status Badge */}
      <View style={[styles.statusBadge, isConnected ? styles.connected : styles.disconnected, { top: 70 + insets.top }]}>
        <Animated.View style={[styles.statusDot, isConnected ? styles.connectedDot : styles.disconnectedDot, { opacity: isConnected ? pulseAnim : 1 }]} />
        <Text style={styles.statusText}>
          {isConnected ? 'Live Tracking' : 'Connecting...'}
        </Text>
      </View>

      {/* Map Controls */}
      <View style={[styles.mapControls, { top: 70 + insets.top }]}>
        <TouchableOpacity style={styles.mapButton} onPress={centerMapOnBarber}>
          <Ionicons name="locate" size={24} color={Colors.gray[800]} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.mapButton} onPress={fitBothLocations}>
          <Ionicons name="resize" size={24} color={Colors.gray[800]} />
        </TouchableOpacity>
      </View>

      {/* Bottom Info Panel */}
      <View style={[styles.bottomPanel, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        {/* Barber Info */}
        <View style={styles.barberInfo}>
          <Image
            source={{ uri: booking.barberAvatar || 'https://via.placeholder.com/48' }}
            style={styles.barberAvatar}
          />
          <View style={styles.barberDetails}>
            <Text style={styles.barberName}>{booking.barberName}</Text>
            <Text style={styles.barberStatus}>
              {arrivalTime ? `Arriving at ${arrivalTime}` : 'Calculating arrival time...'}
            </Text>
          </View>
        </View>

        {/* ETA Info */}
        {(eta || trackingSession) && (
          <View style={styles.etaInfo}>
            <View style={styles.etaItem}>
              <Text style={styles.etaLabel}>Arriving in</Text>
              <Text style={styles.etaValue}>
                {trackingSession?.current_eta_minutes 
                  ? `${trackingSession.current_eta_minutes} min`
                  : eta?.durationMinutes 
                  ? `${eta.durationMinutes} min`
                  : 'Calculating...'}
              </Text>
            </View>
            <View style={styles.etaDivider} />
            <View style={styles.etaItem}>
              <Text style={styles.etaLabel}>Last Updated</Text>
              <Text style={styles.etaValue}>
                {trackingSession?.minutes_since_last_update !== undefined
                  ? `${Math.floor(trackingSession.minutes_since_last_update)}m ago`
                  : lastUpdated 
                  ? `${Math.floor((Date.now() - lastUpdated.getTime()) / 1000)}s ago` 
                  : 'Just now'}
              </Text>
            </View>
          </View>
        )}

        {/* Address */}
        <View style={styles.addressContainer}>
          <Ionicons name="location" size={20} color={Colors.gray[500]} />
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
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  backButtonHeader: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  headerRight: {
    width: 40,
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
    color: Colors.gray[500],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: Colors.gray[500],
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: Colors.success,
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
    borderColor: Colors.success,
  },
  disconnected: {
    borderWidth: 1,
    borderColor: Colors.error,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectedDot: {
    backgroundColor: Colors.success,
  },
  disconnectedDot: {
    backgroundColor: Colors.error,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray[800],
  },
  mapControls: {
    position: 'absolute',
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    maxHeight: '35%',
  },
  barberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  barberDetails: {
    flex: 1,
  },
  barberName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gray[800],
    marginBottom: 4,
  },
  barberStatus: {
    fontSize: 14,
    color: Colors.gray[500],
  },
  etaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    marginBottom: 12,
  },
  etaItem: {
    alignItems: 'center',
  },
  etaLabel: {
    fontSize: 12,
    color: Colors.gray[500],
    marginBottom: 4,
  },
  etaValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gray[800],
  },
  etaDivider: {
    width: 1,
    backgroundColor: Colors.gray[200],
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
  },
  addressText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: Colors.gray[600],
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.errorLight,
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
    backgroundColor: Colors.info,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  barberPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  // Grab-style markers
  customerMarker: {
    alignItems: 'center',
  },
  barberMarker: {
    alignItems: 'center',
  },
  markerInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#0EA5E9',
    marginTop: -3,
  },
});
