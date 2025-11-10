import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { reverseGeocode } from '../../utils/mapbox';
import AddressFormBottomSheet, { AddressFormMode } from '@/components/AddressFormBottomSheet';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { CustomerAddress } from '@mari-gunting/shared/services/addressService';
import { useBookingIfActive } from '@/contexts/BookingContext';
import { Colors, theme } from '@mari-gunting/shared/theme';

export default function MapPickerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    latitude?: string;
    longitude?: string;
    mode?: string;
    addressId?: string;
    addressData?: string; // JSON string of address for edit mode
  }>();
  
  const currentUser = useStore((state) => state.currentUser);
  const booking = useBookingIfActive();
  
  // Determine mode: 'add' or 'edit'
  const mode: AddressFormMode = params.addressId ? 'edit' : 'add';
  const addressToEdit: CustomerAddress | undefined = params.addressData 
    ? JSON.parse(params.addressData as string) 
    : undefined;
  
  // Initial location from params or default to KL
  const initialLat = params.latitude ? parseFloat(params.latitude as string) : 3.139;
  const initialLng = params.longitude ? parseFloat(params.longitude as string) : 101.6869;
  
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: initialLat,
    longitude: initialLng,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [mapReady, setMapReady] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [mapCenter, setMapCenter] = useState({
    latitude: initialLat,
    longitude: initialLng,
  });
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const mapViewRef = useRef<MapboxGL.MapView>(null);

  useEffect(() => {
    // Get user's current location after map is ready
    if (mapReady) {
      getCurrentLocation();
    }
  }, [mapReady]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to detect your current location.'
        );
        return;
      }

      setIsLoading(true);
      setIsGeocodingLoading(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setSelectedLocation(newLocation);
      setMapCenter(newLocation);
      
      // Animate camera to current location
      cameraRef.current?.setCamera({
        centerCoordinate: [newLocation.longitude, newLocation.latitude],
        zoomLevel: 15,
        animationDuration: 1000,
      });

      // Get address for current location
      await getAddressForLocation(newLocation.latitude, newLocation.longitude);
    } catch (error) {
      Alert.alert('Error', 'Failed to get your current location.');
    } finally {
      setIsLoading(false);
      setIsGeocodingLoading(false);
    }
  };

  const getAddressForLocation = async (latitude: number, longitude: number) => {
    try {
      // Try Mapbox first (v6)
      const mapboxAddress = await reverseGeocode(latitude, longitude);
      
      if (mapboxAddress) {
        setAddress(mapboxAddress);
        return;
      }

      // Fallback to Expo Location (less detailed)
      const expoResult = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (expoResult && expoResult.length > 0) {
        const location = expoResult[0];
        const addressParts = [
          location.street,
          location.city,
          location.region,
          location.postalCode,
          location.country,
        ].filter(Boolean);
        
        const address = addressParts.join(', ');
        setAddress(address);
      }
    } catch (error) {
      // Silent fail - address will remain empty
    }
  };

  // Handle map moving (real-time coordinate update)
  const handleMapMoving = async () => {
    // Mark as loading immediately when map starts moving
    setIsGeocodingLoading(true);
    try {
      const center = await mapViewRef.current?.getCenter();
      if (center && Array.isArray(center) && center.length === 2) {
        const newLocation = {
          latitude: center[1],
          longitude: center[0],
        };
        // Update coordinates immediately (no delay)
        setMapCenter(newLocation);
        setSelectedLocation(newLocation);
      }
    } catch (error) {
      // Ignore errors during movement
    }
  };

  // Handle map idle (stopped moving)
  const handleMapIdle = async () => {
    // Clear existing debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Get map center from camera
    try {
      const center = await mapViewRef.current?.getCenter();
      if (center && Array.isArray(center) && center.length === 2) {
        const newLocation = {
          latitude: center[1],
          longitude: center[0],
        };

        setMapCenter(newLocation);
        setSelectedLocation(newLocation);

        // Debounce address lookup (only expensive operation)
        debounceTimer.current = setTimeout(async () => {
          setIsLoading(true);
          setIsGeocodingLoading(true);
          try {
            await getAddressForLocation(newLocation.latitude, newLocation.longitude);
          } finally {
            setIsLoading(false);
            setIsGeocodingLoading(false);
          }
        }, 300); // Reduced from 500ms to 300ms
      }
    } catch (error) {
      // Silent fail
    }
  };

  const handleConfirmLocation = () => {
    if (selectedLocation && address) {
      // Option C: Show bottom sheet modal on the map!
      setShowBottomSheet(true);
    } else {
      Alert.alert('No Location Selected', 'Please select a location on the map.');
    }
  };

  const handleBottomSheetSuccess = (savedAddress: CustomerAddress) => {
    // Address saved successfully!
    setShowBottomSheet(false);
    
    // If in booking flow, only auto-select if no address was previously selected
    // This respects the default address auto-selection
    if (booking) {
      // Only auto-select the new address if user had no address selected
      if (!booking.selectedAddress) {
        const fullAddress = [
          savedAddress.address_line1,
          savedAddress.address_line2,
          savedAddress.city,
          savedAddress.state,
          savedAddress.postal_code
        ].filter(Boolean).join(', ');
        
        booking.setSelectedAddress({
          id: savedAddress.id,
          label: savedAddress.label,
          fullAddress: fullAddress,
          latitude: savedAddress.latitude,
          longitude: savedAddress.longitude,
        });
      }
      
      // Return to booking - user can manually select the new address if they want
      booking.returnToBooking();
    } else {
      // Normal flow: go back to addresses screen
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pick Location</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Loading overlay while map initializes */}
      {!mapReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingOverlayText}>Loading map...</Text>
        </View>
      )}

      <MapboxGL.MapView
        ref={mapViewRef}
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Street}
        onDidFinishLoadingMap={() => setMapReady(true)}
        onCameraChanged={() => {
          // Map is moving - update coordinates immediately
          handleMapMoving();
          // Clear any pending address lookups
          if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
          }
        }}
        onMapIdle={handleMapIdle}
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [mapCenter.longitude, mapCenter.latitude],
            zoomLevel: 15,
          }}
        />
      </MapboxGL.MapView>

      {/* Fixed center pin - stays in center while map moves underneath */}
      <View style={styles.centerPinContainer} pointerEvents="none">
        <Ionicons name="location" size={48} color="#FF6B6B" />
        {/* Pin shadow/point indicator */}
        <View style={styles.pinShadow} />
      </View>

      {/* Current location button */}
      <TouchableOpacity
        style={styles.currentLocationButton}
        onPress={getCurrentLocation}
        disabled={isLoading}
      >
        <Ionicons name="locate" size={24} color="#007AFF" />
      </TouchableOpacity>

      {/* Address info panel */}
      <View style={styles.addressPanel}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>Getting address...</Text>
          </View>
        ) : (
          <>
            <View style={styles.addressHeader}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <Text style={styles.addressLabel}>Selected Location</Text>
            </View>
            <Text style={styles.addressText}>
              {address || 'Move the map to select a location'}
            </Text>
            <Text style={styles.coordinatesText}>
              {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
            </Text>
          </>
        )}
      </View>

      {/* Confirm button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.confirmButton, (!address || isGeocodingLoading) && styles.confirmButtonDisabled]}
          onPress={handleConfirmLocation}
          disabled={!address || isGeocodingLoading}
        >
          <Text style={styles.confirmButtonText}>Confirm Location</Text>
        </TouchableOpacity>
      </View>

      {/* Option C: Bottom Sheet for Address Form */}
      <AddressFormBottomSheet
        visible={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        onSuccess={handleBottomSheetSuccess}
        mode={mode}
        userId={currentUser?.id!}
        latitude={selectedLocation.latitude}
        longitude={selectedLocation.longitude}
        initialAddressString={address}
        addressToEdit={addressToEdit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.4,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -24, // Half of icon width (48/2)
    marginTop: -48, // Full icon height to anchor at bottom point
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  pinShadow: {
    width: 20,
    height: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginTop: -8,
  },
  currentLocationButton: {
    position: 'absolute',
    top: 80,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addressPanel: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  addressLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  addressText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#999',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    gap: 12,
  },
  loadingOverlayText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
});
