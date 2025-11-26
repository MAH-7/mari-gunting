import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  StatusBar,
  Switch,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { supabase } from '@mari-gunting/shared/config/supabase';
import { Colors } from '@mari-gunting/shared/theme';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { uploadOnboardingImage } from '@mari-gunting/shared/services/onboardingService';
import DateTimePicker from '@react-native-community/datetimepicker';


interface OperatingHours {
  [day: string]: {
    start: string;
    end: string;
    isOpen: boolean;
  };
}

export default function ShopSettingsScreen() {
  const currentUser = useStore((state) => state.currentUser);
  const tempShopLocation = useStore((state) => state.tempShopLocation);
  const setTempShopLocation = useStore((state) => state.setTempShopLocation);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [barbershopId, setBarbershopId] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>('');

  // Form data
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    description: '',
    phoneNumber: '',
    email: '',
  });

  const [address, setAddress] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
  });

  const [operatingHours, setOperatingHours] = useState<OperatingHours>({
    mon: { start: '09:00', end: '18:00', isOpen: true },
    tue: { start: '09:00', end: '18:00', isOpen: true },
    wed: { start: '09:00', end: '18:00', isOpen: true },
    thu: { start: '09:00', end: '18:00', isOpen: true },
    fri: { start: '09:00', end: '18:00', isOpen: true },
    sat: { start: '09:00', end: '18:00', isOpen: true },
    sun: { start: '09:00', end: '18:00', isOpen: false },
  });
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  
  // Time picker state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<'start' | 'end'>('start');
  const [pickerDate, setPickerDate] = useState(new Date());

  const dayNames = {
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday',
    sun: 'Sunday',
  };

  useEffect(() => {
    loadShopData();
  }, []);

  // Handle location data returned from map picker
  useEffect(() => {
    if (tempShopLocation) {
      // Update state with location data from map picker
      setLatitude(tempShopLocation.latitude);
      setLongitude(tempShopLocation.longitude);
      
      try {
        const addressData = JSON.parse(tempShopLocation.address);
        setAddress((prev) => ({
          ...prev,
          addressLine1: addressData.addressLine1 || prev.addressLine1,
          city: addressData.city || prev.city,
          state: addressData.state || prev.state,
          postalCode: addressData.postalCode || prev.postalCode,
        }));
      } catch (error) {
        console.error('Error parsing address:', error);
      }
      
      // Clear the temp location to avoid re-triggering
      setTempShopLocation(null);
    }
  }, [tempShopLocation]);

  const loadShopData = async () => {
    try {
      setLoading(true);

      if (!currentUser?.id) {
        Alert.alert('Error', 'User not found');
        return;
      }

      // Fetch barbershop data
      const { data: barbershop, error } = await supabase
        .from('barbershops')
        .select('*')
        .eq('owner_id', currentUser.id)
        .single();

      if (error || !barbershop) {
        Alert.alert('Error', 'Barbershop not found');
        return;
      }

      setBarbershopId(barbershop.id);
      setLogoUrl(barbershop.logo_url || '');
      setLatitude(barbershop.latitude || null);
      setLongitude(barbershop.longitude || null);

      // Load business info
      setBusinessInfo({
        name: barbershop.name || '',
        description: barbershop.description || '',
        phoneNumber: barbershop.phone_number || '',
        email: barbershop.email || '',
      });

      // Load address
      setAddress({
        addressLine1: barbershop.address_line1 || '',
        addressLine2: barbershop.address_line2 || '',
        city: barbershop.city || '',
        state: barbershop.state || '',
        postalCode: barbershop.postal_code || '',
      });

      // Load operating hours
      if (barbershop.opening_hours) {
        setOperatingHours(barbershop.opening_hours);
      }
    } catch (error) {
      console.error('Error loading shop data:', error);
      Alert.alert('Error', 'Failed to load shop data');
    } finally {
      setLoading(false);
    }
  };

  const handlePickLogo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
      });

      if (result.canceled || !result.assets || !result.assets[0]) {
        return;
      }

      const uri = result.assets[0].uri;
      if (!uri || typeof uri !== 'string' || uri.trim() === '') {
        Alert.alert('Error', 'Failed to get image. Please try again.');
        return;
      }

      setUploading(true);

      // Upload to Supabase Storage
      const uploadedUrl = await uploadOnboardingImage(
        uri,
        'barbershop-media',
        currentUser?.id || 'temp',
        `logo_${Date.now()}.jpg`
      );

      if (!uploadedUrl) {
        Alert.alert('Error', 'Failed to upload logo');
        return;
      }

      // Update logo URL in state and database
      setLogoUrl(uploadedUrl);

      const { error } = await supabase
        .from('barbershops')
        .update({
          logo_url: uploadedUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', barbershopId);

      if (error) {
        console.error('Error updating logo:', error);
        Alert.alert('Error', 'Failed to save logo');
        return;
      }

      Alert.alert('Success', 'Logo updated successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      Alert.alert('Error', 'Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!businessInfo.name.trim()) {
      Alert.alert('Name Required', 'Please enter your shop name');
      return;
    }
    if (!businessInfo.phoneNumber.trim()) {
      Alert.alert('Phone Required', 'Please enter your phone number');
      return;
    }
    if (!address.addressLine1.trim()) {
      Alert.alert('Address Required', 'Please enter your address');
      return;
    }
    if (!address.city.trim() || !address.state.trim() || !address.postalCode.trim()) {
      Alert.alert('Address Incomplete', 'Please fill in city, state, and postal code');
      return;
    }

    try {
      setSaving(true);

      // Build update object
      const updateData: any = {
        name: businessInfo.name.trim(),
        description: businessInfo.description.trim(),
        phone_number: businessInfo.phoneNumber.trim(),
        email: businessInfo.email.trim(),
        address_line1: address.addressLine1.trim(),
        address_line2: address.addressLine2.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        postal_code: address.postalCode.trim(),
        opening_hours: operatingHours,
        updated_at: new Date().toISOString(),
      };

      // Only update location if we have valid coordinates
      if (latitude && longitude) {
        updateData.location = `POINT(${longitude} ${latitude})`;
      }

      const { error } = await supabase
        .from('barbershops')
        .update(updateData)
        .eq('id', barbershopId);

      if (error) {
        console.error('Error saving:', error);
        Alert.alert('Error', 'Failed to save changes');
        return;
      }

      Alert.alert('Success', 'Shop settings updated successfully');
      router.back();
    } catch (error) {
      console.error('Error saving shop data:', error);
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setSaving(false);
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

      // Reverse geocode to get address
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode.length > 0) {
        const addr = geocode[0];
        setAddress({
          ...address,
          addressLine1: addr.street || address.addressLine1,
          city: addr.city || address.city,
          state: addr.region || address.state,
          postalCode: addr.postalCode || address.postalCode,
        });
      }

      Alert.alert('Success', 'Location retrieved successfully! You can now edit the details if needed.');
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location. Please enter manually.');
    } finally {
      setGettingLocation(false);
    }
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const toggleDayOpen = (day: string) => {
    setOperatingHours({
      ...operatingHours,
      [day]: {
        ...operatingHours[day],
        isOpen: !operatingHours[day].isOpen,
      },
    });
  };

  const openTimePicker = (day: string, type: 'start' | 'end') => {
    const currentTime = operatingHours[day][type];
    const [hour, minute] = currentTime.split(':').map(Number);
    
    const date = new Date();
    date.setHours(hour);
    date.setMinutes(minute);
    
    setPickerDate(date);
    setEditingDay(day);
    setEditingType(type);
    setShowTimePicker(true);
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (selectedDate && editingDay) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const time24 = `${hours}:${minutes}`;
      
      setOperatingHours({
        ...operatingHours,
        [editingDay]: {
          ...operatingHours[editingDay],
          [editingType]: time24,
        },
      });
      
      setPickerDate(selectedDate);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading shop settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFF' }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shop Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Logo Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shop Logo</Text>
          <Text style={styles.sectionSubtitle}>Upload your barbershop logo</Text>

          <View style={styles.logoContainer}>
            <TouchableOpacity
              style={styles.logoUploadButton}
              onPress={handlePickLogo}
              disabled={uploading}
            >
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.logoImage} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Ionicons name="image-outline" size={40} color="#999" />
                  <Text style={styles.logoPlaceholderText}>Tap to upload</Text>
                </View>
              )}
              {uploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color="#FFF" size="large" />
                </View>
              )}
            </TouchableOpacity>
            {logoUrl && (
              <TouchableOpacity
                style={styles.changeLogoButton}
                onPress={handlePickLogo}
                disabled={uploading}
              >
                <Ionicons name="camera" size={16} color="#FFF" />
                <Text style={styles.changeLogoText}>Change Logo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Business Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Information</Text>
          
          <Text style={styles.label}>Shop Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter shop name"
            value={businessInfo.name}
            onChangeText={(text) => setBusinessInfo({ ...businessInfo, name: text })}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell customers about your shop"
            value={businessInfo.description}
            onChangeText={(text) => setBusinessInfo({ ...businessInfo, description: text })}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 0123456789"
            value={businessInfo.phoneNumber}
            onChangeText={(text) => setBusinessInfo({ ...businessInfo, phoneNumber: text })}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="shop@example.com"
            value={businessInfo.email}
            onChangeText={(text) => setBusinessInfo({ ...businessInfo, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address</Text>

          <TouchableOpacity
            style={styles.mapPickerButton}
            onPress={() => router.push({
              pathname: '/map-picker',
              params: {
                latitude: latitude?.toString() || '3.139',
                longitude: longitude?.toString() || '101.6869',
              },
            })}
          >
            <Ionicons name="map" size={20} color={Colors.primary} />
            <Text style={styles.mapPickerButtonText}>Pick Location on Map</Text>
          </TouchableOpacity>

          {latitude && longitude ? (
            <View style={styles.coordinatesInfo}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.coordinatesText}>
                Location set: {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </Text>
            </View>
          ) : (
            <View style={styles.locationWarning}>
              <Ionicons name="information-circle" size={20} color="#FF9800" />
              <Text style={styles.locationWarningText}>
                Please pick location on map first to enable address fields
              </Text>
            </View>
          )}

          <Text style={styles.label}>Address Line 1 *</Text>
          <TextInput
            style={[styles.input, (!latitude || !longitude) && styles.inputDisabled]}
            placeholder="Street address"
            value={address.addressLine1}
            onChangeText={(text) => setAddress({ ...address, addressLine1: text })}
            editable={!!(latitude && longitude)}
          />

          <Text style={styles.label}>Address Line 2</Text>
          <TextInput
            style={[styles.input, (!latitude || !longitude) && styles.inputDisabled]}
            placeholder="Apartment, suite, etc. (optional)"
            value={address.addressLine2}
            onChangeText={(text) => setAddress({ ...address, addressLine2: text })}
            editable={!!(latitude && longitude)}
          />

          <Text style={styles.label}>City *</Text>
          <TextInput
            style={[styles.input, (!latitude || !longitude) && styles.inputDisabled]}
            placeholder="City"
            value={address.city}
            onChangeText={(text) => setAddress({ ...address, city: text })}
            editable={!!(latitude && longitude)}
          />

          <Text style={styles.label}>State *</Text>
          <TextInput
            style={[styles.input, (!latitude || !longitude) && styles.inputDisabled]}
            placeholder="State"
            value={address.state}
            onChangeText={(text) => setAddress({ ...address, state: text })}
            editable={!!(latitude && longitude)}
          />

          <Text style={styles.label}>Postal Code *</Text>
          <TextInput
            style={[styles.input, (!latitude || !longitude) && styles.inputDisabled]}
            placeholder="Postal Code"
            value={address.postalCode}
            onChangeText={(text) => setAddress({ ...address, postalCode: text })}
            keyboardType="numeric"
            editable={!!(latitude && longitude)}
          />
        </View>

        {/* Operating Hours Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operating Hours</Text>
          
          {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
            <View key={day} style={styles.dayRow}>
              <View style={styles.dayInfo}>
                <Text style={styles.dayName}>{dayNames[day as keyof typeof dayNames]}</Text>
                {operatingHours[day].isOpen ? (
                  <View style={styles.timeButtons}>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => openTimePicker(day, 'start')}
                    >
                      <Text style={styles.timeButtonText}>
                        {formatTime(operatingHours[day].start)}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.timeSeparator}>-</Text>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => openTimePicker(day, 'end')}
                    >
                      <Text style={styles.timeButtonText}>
                        {formatTime(operatingHours[day].end)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={[styles.dayHours, { color: Colors.error }]}>Closed</Text>
                )}
              </View>
              <Switch
                value={operatingHours[day].isOpen}
                onValueChange={() => toggleDayOpen(day)}
                trackColor={{ false: '#E0E0E0', true: Colors.primaryLight }}
                thumbColor={operatingHours[day].isOpen ? Colors.primary : '#F5F5F5'}
              />
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Time Picker Modal */}
      {showTimePicker && (
        <>
          {Platform.OS === 'ios' ? (
            <View style={styles.iosPickerOverlay}>
              <View style={styles.iosPickerContainer}>
                <View style={styles.iosPickerHeader}>
                  <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                    <Text style={styles.iosPickerDone}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={pickerDate}
                  mode="time"
                  is24Hour={true}
                  display="spinner"
                  onChange={onTimeChange}
                />
              </View>
            </View>
          ) : (
            <DateTimePicker
              value={pickerDate}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={onTimeChange}
            />
          )}
        </>
      )}

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.saveButtonText}>Save Changes</Text>
              <Ionicons name="checkmark" size={20} color="#FFF" />
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
    backgroundColor: '#F2F4F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFF',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    color: '#999',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  dayHours: {
    fontSize: 14,
    color: '#666',
  },
  timeButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  timeSeparator: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  logoUploadButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    backgroundColor: '#FAFAFA',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoPlaceholderText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeLogoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  changeLogoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  mapPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
    marginBottom: 16,
  },
  mapPickerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  coordinatesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#d1fae5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  coordinatesText: {
    flex: 1,
    fontSize: 13,
    color: '#10b981',
    fontWeight: '500',
  },
  locationWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  locationWarningText: {
    flex: 1,
    fontSize: 13,
    color: '#F57C00',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  iosPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  iosPickerContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  iosPickerDone: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.primary,
  },
});
