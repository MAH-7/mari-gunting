import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '@/shared/constants';
import { mockBarbers } from '@/shared/services/mockData';

const { width } = Dimensions.get('window');

const SPECIALIZATIONS = [
  'Classic Cuts',
  'Modern Cuts',
  'Fade',
  'Pompadour',
  'Traditional Shave',
  'Beard Art',
  'Hair Coloring',
  'Trendy Styling',
  'Kids Cuts',
  'Creative Designs',
];

export default function ProfileEditScreen() {
  const router = useRouter();
  const profile = mockBarbers[0];

  const [formData, setFormData] = useState({
    fullName: profile.name,
    phone: profile.phone,
    email: profile.email,
    bio: profile.bio,
    serviceArea: 'Kuala Lumpur',
    address: 'Jalan Sultan Ismail No. 123',
    specializations: profile.specializations,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleSpecialization = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }));
    setHasChanges(true);
  };

  const handlePhotoChange = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      Alert.alert('Photo Updated', 'Profile photo has been updated!');
      setHasChanges(true);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Name must be at least 3 characters';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+60\s?\d{2,3}-?\d{3,4}-?\d{4}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone format (e.g., +60 12-345 6789)';
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    if (!formData.serviceArea.trim()) {
      newErrors.serviceArea = 'Service area is required';
    }

    if (formData.specializations.length === 0) {
      newErrors.specializations = 'Please select at least one specialization';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving');
      return;
    }

    Alert.alert(
      'Profile Updated',
      'Your profile has been updated successfully!',
      [
        {
          text: 'OK',
          onPress: () => {
            setHasChanges(false);
            router.back();
          }
        }
      ]
    );
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to leave?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Leave', style: 'destructive', onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleCancel} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section with Photo */}
        <View style={styles.heroSection}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={handlePhotoChange}
            activeOpacity={0.8}
          >
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarText}>{formData.fullName.charAt(0)}</Text>
            </View>
            <View style={styles.cameraIconBadge}>
              <Ionicons name="camera" size={20} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.photoHint}>Tap to change photo</Text>
        </View>

        {/* Form Fields - Each in separate cards */}
        
        {/* Personal Info Card */}
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconCircle}>
              <Ionicons name="person-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>Personal Information</Text>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={[styles.textInput, errors.fullName && styles.inputError]}
              value={formData.fullName}
              onChangeText={(value) => handleChange('fullName', value)}
              placeholder="Enter your full name"
              placeholderTextColor="#999"
            />
            {errors.fullName && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={14} color={COLORS.error} />
                <Text style={styles.errorText}>{errors.fullName}</Text>
              </View>
            )}
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={[styles.textInput, errors.phone && styles.inputError]}
              value={formData.phone}
              onChangeText={(value) => handleChange('phone', value)}
              placeholder="+60 12-345 6789"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
            {errors.phone && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={14} color={COLORS.error} />
                <Text style={styles.errorText}>{errors.phone}</Text>
              </View>
            )}
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Email (Optional)</Text>
            <TextInput
              style={[styles.textInput, errors.email && styles.inputError]}
              value={formData.email}
              onChangeText={(value) => handleChange('email', value)}
              placeholder="your.email@example.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={14} color={COLORS.error} />
                <Text style={styles.errorText}>{errors.email}</Text>
              </View>
            )}
          </View>
        </View>

        {/* About Card */}
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconCircle}>
              <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>About You</Text>
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Bio</Text>
              <Text style={styles.charCount}>{formData.bio.length}/500</Text>
            </View>
            <TextInput
              style={[styles.textInput, styles.textArea, errors.bio && styles.inputError]}
              value={formData.bio}
              onChangeText={(value) => handleChange('bio', value)}
              placeholder="Tell customers about yourself and your expertise..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            {errors.bio && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={14} color={COLORS.error} />
                <Text style={styles.errorText}>{errors.bio}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Location Card */}
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconCircle}>
              <Ionicons name="location-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>Location</Text>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Service Area</Text>
            <TextInput
              style={[styles.textInput, errors.serviceArea && styles.inputError]}
              value={formData.serviceArea}
              onChangeText={(value) => handleChange('serviceArea', value)}
              placeholder="e.g., Kuala Lumpur"
              placeholderTextColor="#999"
            />
            {errors.serviceArea && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={14} color={COLORS.error} />
                <Text style={styles.errorText}>{errors.serviceArea}</Text>
              </View>
            )}
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Address (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={formData.address}
              onChangeText={(value) => handleChange('address', value)}
              placeholder="Your base location"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Specializations Card */}
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconCircle}>
              <Ionicons name="cut-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>Specializations</Text>
          </View>

          <Text style={styles.helperText}>Select your areas of expertise</Text>
          
          <View style={styles.chipsContainer}>
            {SPECIALIZATIONS.map((spec) => {
              const isSelected = formData.specializations.includes(spec);
              return (
                <TouchableOpacity
                  key={spec}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => toggleSpecialization(spec)}
                  activeOpacity={0.7}
                >
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} style={styles.chipIcon} />
                  )}
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {spec}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {errors.specializations && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={14} color={COLORS.error} />
              <Text style={styles.errorText}>{errors.specializations}</Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Save Button */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>Save Changes</Text>
          <Ionicons name="checkmark-circle" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Hero Photo Section
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFF',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: '#E8F5E9',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFF',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  photoHint: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
  },

  // Form Cards
  formCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  cardIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  helperText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },

  // Inputs
  inputWrapper: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  inputError: {
    borderColor: COLORS.error,
    backgroundColor: '#FEF2F2',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    fontWeight: '600',
  },

  // Chips
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  chipSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: COLORS.primary,
  },
  chipIcon: {
    marginLeft: -4,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  chipTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // Floating Button
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFF',
  },
});
