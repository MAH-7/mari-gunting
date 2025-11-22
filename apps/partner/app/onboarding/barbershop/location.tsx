import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { barbershopOnboardingService } from '@mari-gunting/shared/services/onboardingService';
import { Colors, theme } from '@mari-gunting/shared/theme';

const MALAYSIAN_STATES = [
  'Johor',
  'Kedah',
  'Kelantan',
  'Kuala Lumpur',
  'Labuan',
  'Melaka',
  'Negeri Sembilan',
  'Pahang',
  'Penang',
  'Perak',
  'Perlis',
  'Putrajaya',
  'Sabah',
  'Sarawak',
  'Selangor',
  'Terengganu',
];

export default function LocationScreen() {
  const insets = useSafeAreaInsets();
  const logout = useStore((state) => state.logout);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const progress = await barbershopOnboardingService.getProgress();
      if (progress.location) {
        setAddressLine1(progress.location.addressLine1);
        setAddressLine2(progress.location.addressLine2 || '');
        setCity(progress.location.city);
        setState(progress.location.state);
        setPostalCode(progress.location.postalCode);
        setLatitude(progress.location.latitude);
        setLongitude(progress.location.longitude);
        setLocationVerified(true);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setGettingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use this feature.');
        setGettingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);
      setLocationVerified(true);

      // Reverse geocode to get address
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode.length > 0) {
        const address = geocode[0];
        if (address.street) setAddressLine1(address.street);
        if (address.city) setCity(address.city);
        if (address.region) setState(address.region);
        if (address.postalCode) setPostalCode(address.postalCode);
      }

      Alert.alert('Success', 'Location retrieved successfully! You can now edit the details if needed.');
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location. Please enter manually.');
    } finally {
      setGettingLocation(false);
    }
  };

  const validateCoordinates = async () => {
    if (!addressLine1 || !city || !state || !postalCode) {
      // Can't geocode without address
      return;
    }

    // Simple geocoding - you can enhance with Google Maps API
    // For now, use default coordinates if not set
    if (!latitude || !longitude) {
      // Default to Malaysia center if no coordinates
      setLatitude(3.139);
      setLongitude(101.6869);
    }
  };


  const handleLogout = () => {
    Alert.alert(
      'Exit Onboarding?',
      'Your progress will be saved. You can continue later by logging in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };


  const validateForm = (): boolean => {
    if (!locationVerified) {
      Alert.alert('Location Required', 'Please use your current location to verify your barbershop address.');
      return false;
    }

    if (addressLine1.trim().length < 5) {
      Alert.alert('Address Required', 'Please enter your street address (min 5 characters).');
      return false;
    }

    if (city.trim().length < 2) {
      Alert.alert('City Required', 'Please enter your city.');
      return false;
    }

    if (!state) {
      Alert.alert('State Required', 'Please select your state.');
      return false;
    }

    if (postalCode.length !== 5) {
      Alert.alert('Invalid Postal Code', 'Please enter a valid 5-digit postal code.');
      return false;
    }

    return true;
  };

  const handleContinue = async () => {
    if (!validateForm()) return;

    await validateCoordinates();

    try {
      setLoading(true);

      const data = {
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim() || undefined,
        city: city.trim(),
        state,
        postalCode,
        latitude: latitude || 3.139,
        longitude: longitude || 101.6869,
      };

      await barbershopOnboardingService.saveProgress('location', data);
      router.push('/onboarding/barbershop/documents');
    } catch (error) {
      console.error('Error saving progress:', error);
      Alert.alert('Error', 'Failed to save progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={22} color={Colors.error} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressDotCompleted} />
          <View style={[styles.progressDot, styles.progressActive]} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Location</Text>
        <Text style={styles.subtitle}>
          Tell us where customers can find your barbershop. You must verify your location using GPS.
        </Text>

        {/* Current Location Button */}
        <TouchableOpacity
          style={[styles.locationButton, locationVerified && styles.locationButtonVerified]}
          onPress={getCurrentLocation}
          disabled={gettingLocation}
        >
        {gettingLocation ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons 
              name={locationVerified ? "checkmark-circle" : "location"} 
              size={20} 
              color={locationVerified ? "#10b981" : Colors.primary} 
            />
          )}
          <Text style={[styles.locationButtonText, locationVerified && styles.locationButtonTextVerified]}>
            {gettingLocation ? 'Getting location...' : locationVerified ? 'Location Verified ✓' : 'Use Current Location (Required)'}
          </Text>
        </TouchableOpacity>

        {/* Address Line 1 */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Street Address <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 123 Jalan Bukit Bintang"
            placeholderTextColor="#999"
            value={addressLine1}
            onChangeText={setAddressLine1}
            maxLength={200}
          />
        </View>

        {/* Address Line 2 */}
        <View style={styles.section}>
          <Text style={styles.label}>Unit/Floor (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Unit 5, 2nd Floor"
            placeholderTextColor="#999"
            value={addressLine2}
            onChangeText={setAddressLine2}
            maxLength={200}
          />
        </View>

        {/* City */}
        <View style={styles.section}>
          <Text style={styles.label}>
            City <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Kuala Lumpur"
            placeholderTextColor="#999"
            value={city}
            onChangeText={setCity}
            maxLength={100}
          />
        </View>

        {/* State */}
        <View style={styles.section}>
          <Text style={styles.label}>
            State <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowStatePicker(!showStatePicker)}
          >
            <Text style={[styles.pickerButtonText, !state && styles.pickerPlaceholder]}>
              {state || 'Select state'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
          
          {showStatePicker && (
            <View style={styles.pickerList}>
              <ScrollView style={styles.pickerScroll} nestedScrollEnabled={true}>
                {MALAYSIAN_STATES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={styles.pickerItem}
                    onPress={() => {
                      setState(s);
                      setShowStatePicker(false);
                    }}
                  >
                    <Text style={styles.pickerItemText}>{s}</Text>
                    {state === s && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Postal Code */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Postal Code <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="50000"
            placeholderTextColor="#999"
            value={postalCode}
            onChangeText={(text) => setPostalCode(text.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            maxLength={5}
          />
        </View>

        {/* Coordinates Display */}
        {latitude && longitude && (
          <View style={styles.infoBox}>
            <Ionicons name="location-outline" size={16} color={Colors.primary} />
            <Text style={styles.infoText}>
              Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.footer, { paddingBottom: Platform.OS === 'android' ? insets.bottom + 16 : 32 }]}>
        <TouchableOpacity
          style={[styles.continueButton, (loading || gettingLocation || !locationVerified) && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={loading || gettingLocation || !locationVerified}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.continueButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logoutButton: {
    width: 40,

    borderRadius: 20,

    backgroundColor: Colors.errorLight,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e0e0e0',
  },
  progressDotCompleted: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  progressActive: {
    backgroundColor: Colors.primary,
    width: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: '#f0f9f4',
    marginBottom: 32,
  },
  locationButtonVerified: {
    borderColor: '#10b981',
    backgroundColor: '#d1fae5',
  },
  locationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  locationButtonTextVerified: {
    color: '#10b981',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  required: {
    color: '#f44336',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#fafafa',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  pickerPlaceholder: {
    color: '#999',
  },
  pickerList: {
    marginTop: 8,
    maxHeight: 250,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pickerScroll: {
    maxHeight: 250,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0f9f4',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.primary,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    // paddingBottom handled inline with insets
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
