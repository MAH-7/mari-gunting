import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { mockBarbers } from '@/shared/services/mockData';

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
    // Clear error when user starts typing
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Photo */}
        <View style={styles.photoSection}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{formData.fullName.charAt(0)}</Text>
          </View>
          <TouchableOpacity style={styles.changePhotoButton} onPress={handlePhotoChange}>
            <Ionicons name="camera" size={16} color={COLORS.primary} />
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={[styles.input, errors.fullName && styles.inputError]}
                value={formData.fullName}
                onChangeText={(value) => handleChange('fullName', value)}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.text.secondary}
              />
              {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                value={formData.phone}
                onChangeText={(value) => handleChange('phone', value)}
                placeholder="+60 12-345 6789"
                placeholderTextColor={COLORS.text.secondary}
                keyboardType="phone-pad"
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email (optional)</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={formData.email}
                onChangeText={(value) => handleChange('email', value)}
                placeholder="your.email@example.com"
                placeholderTextColor={COLORS.text.secondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About You</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Bio</Text>
                <Text style={styles.charCount}>{formData.bio.length}/500</Text>
              </View>
              <TextInput
                style={[styles.textArea, errors.bio && styles.inputError]}
                value={formData.bio}
                onChangeText={(value) => handleChange('bio', value)}
                placeholder="Tell us about yourself and your expertise..."
                placeholderTextColor={COLORS.text.secondary}
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
              />
              {errors.bio && <Text style={styles.errorText}>{errors.bio}</Text>}
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Service Area *</Text>
              <TextInput
                style={[styles.input, errors.serviceArea && styles.inputError]}
                value={formData.serviceArea}
                onChangeText={(value) => handleChange('serviceArea', value)}
                placeholder="e.g., Kuala Lumpur"
                placeholderTextColor={COLORS.text.secondary}
              />
              {errors.serviceArea && <Text style={styles.errorText}>{errors.serviceArea}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address (optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.address}
                onChangeText={(value) => handleChange('address', value)}
                placeholder="Your address or base location"
                placeholderTextColor={COLORS.text.secondary}
              />
            </View>
          </View>
        </View>

        {/* Specializations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specializations *</Text>
          <View style={styles.card}>
            <View style={styles.specializationsGrid}>
              {SPECIALIZATIONS.map((spec) => (
                <TouchableOpacity
                  key={spec}
                  style={[
                    styles.specializationChip,
                    formData.specializations.includes(spec) && styles.specializationChipActive
                  ]}
                  onPress={() => toggleSpecialization(spec)}
                >
                  <Text style={[
                    styles.specializationText,
                    formData.specializations.includes(spec) && styles.specializationTextActive
                  ]}>
                    {spec}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.specializations && <Text style={styles.errorText}>{errors.specializations}</Text>}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  headerButton: {
    minWidth: 60,
  },
  headerTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
  },
  cancelText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
  },
  saveText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'right',
  },
  photoSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.background.primary,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    ...TYPOGRAPHY.heading.h1,
    color: COLORS.text.inverse,
    fontSize: 40,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
  },
  changePhotoText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.primary,
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.primary,
    marginBottom: 8,
    fontWeight: '600',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  charCount: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
  },
  input: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  textArea: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    minHeight: 100,
  },
  errorText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.error,
    marginTop: 4,
  },
  specializationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specializationChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border.medium,
  },
  specializationChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  specializationText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
  },
  specializationTextActive: {
    color: COLORS.text.inverse,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
});
