import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { reverseGeocode } from '../../utils/mapbox';
import AddressFormBottomSheet, { AddressFormMode } from '@/components/AddressFormBottomSheet';
import { useStore } from '@/store/useStore';
import { CustomerAddress } from '@mari-gunting/shared/services/addressService';
import { useBookingIfActive } from '@/contexts/BookingContext';

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
  const cameraRef = useRef<MapboxGL.Camera>(null);

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
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setSelectedLocation(newLocation);
      
      // Animate camera to current location
      cameraRef.current?.setCamera({
        centerCoordinate: [newLocation.longitude, newLocation.latitude],
        zoomLevel: 15,
        animationDuration: 1000,
      });

      // Get address for current location
      await getAddressForLocation(newLocation.latitude, newLocation.longitude);
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Failed to get your current location.');
    } finally {
      setIsLoading(false);
    }
  };

  const getAddressForLocation = async (latitude: number, longitude: number) => {
    try {
      // Try Mapbox first
      const mapboxAddress = await reverseGeocode(latitude, longitude);
      
      if (mapboxAddress) {
        setAddress(mapboxAddress);
        return;
      }

      // Fallback to Expo Location
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
        
        setAddress(addressParts.join(', '));
      }
    } catch (error) {
      console.error('Error getting address:', error);
    }
  };

  const handleMapPress = async (feature: any) => {
    const coordinates = feature.geometry.coordinates;
    const newLocation = {
      latitude: coordinates[1],
      longitude: coordinates[0],
    };

    setSelectedLocation(newLocation);
    setIsLoading(true);
    
    try {
      await getAddressForLocation(newLocation.latitude, newLocation.longitude);
    } finally {
      setIsLoading(false);
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
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Pick Location',
          headerShown: true,
        }}
      />

      {/* Loading overlay while map initializes */}
      {!mapReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingOverlayText}>Loading map...</Text>
        </View>
      )}

      <MapboxGL.MapView
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Street}
        onPress={handleMapPress}
        onDidFinishLoadingMap={() => setMapReady(true)}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={15}
          centerCoordinate={[selectedLocation.longitude, selectedLocation.latitude]}
          animationMode="easeTo"
          animationDuration={0}
        />

        {/* Selected location marker */}
        <MapboxGL.PointAnnotation
          id="selected-location"
          coordinate={[selectedLocation.longitude, selectedLocation.latitude]}
        >
          <View style={styles.markerContainer}>
            <Ionicons name="location" size={40} color="#FF6B6B" />
          </View>
        </MapboxGL.PointAnnotation>
      </MapboxGL.MapView>

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
              {address || 'Tap on the map to select a location'}
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
          style={[styles.confirmButton, (!address || isLoading) && styles.confirmButtonDisabled]}
          onPress={handleConfirmLocation}
          disabled={!address || isLoading}
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
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationButton: {
    position: 'absolute',
    top: 20,
    right: 20,
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
