import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { useStore } from '@/store/useStore';

const MALAYSIAN_STATES = [
  'Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur', 'Labuan', 'Malacca', 'Negeri Sembilan',
  'Pahang', 'Penang', 'Perak', 'Perlis', 'Putrajaya', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu'
];

const BUSINESS_TYPES = [
  { value: 'sole_proprietor', label: 'Sole Proprietor' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'sdn_bhd', label: 'Sdn Bhd' },
  { value: 'other', label: 'Other' },
];

export default function BusinessScreen() {
  const [formData, setFormData] = useState({
    ssmNumber: '',
    businessName: '',
    businessType: 'sole_proprietor' as const,
    street: '',
    city: '',
    state: 'Kuala Lumpur',
    postcode: '',
  });
  const [documents, setDocuments] = useState({
    registrationCert: null as string | null,
    businessLicense: null as string | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const updateOnboardingProgress = useStore((state) => state.updateOnboardingProgress);
  const completeOnboardingStep = useStore((state) => state.completeOnboardingStep);
  const onboardingData = useStore((state) => state.onboardingData);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.ssmNumber.trim()) {
      newErrors.ssmNumber = 'SSM number is required';
    }

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    } else if (formData.businessName.trim().length < 3) {
      newErrors.businessName = 'Business name must be at least 3 characters';
    }

    if (!formData.street.trim()) {
      newErrors.street = 'Street address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.postcode.trim()) {
      newErrors.postcode = 'Postcode is required';
    } else if (!/^\d{5}$/.test(formData.postcode)) {
      newErrors.postcode = 'Invalid postcode (5 digits)';
    }

    if (!documents.registrationCert) {
      newErrors.registrationCert = 'SSM registration certificate is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePickImage = async (type: 'registrationCert' | 'businessLicense') => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setDocuments(prev => ({
          ...prev,
          [type]: result.assets[0].uri,
        }));
        if (errors[type]) {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[type];
            return newErrors;
          });
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please complete all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const currentData = onboardingData || {
        progress: {
          status: 'ekyc_passed',
          currentStep: 3,
          totalSteps: 8,
          completedSteps: ['account_type', 'ekyc'],
          lastUpdatedAt: new Date().toISOString(),
        },
        consents: {},
      };

      const updatedData = {
        ...currentData,
        business: {
          ssmNumber: formData.ssmNumber,
          businessName: formData.businessName,
          businessType: formData.businessType,
          registrationCertUrl: documents.registrationCert!,
          businessLicenseUrl: documents.businessLicense,
          address: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            postcode: formData.postcode,
            country: 'Malaysia',
          },
          verificationStatus: 'pending' as const,
        },
      };

      useStore.setState({ onboardingData: updatedData });

      updateOnboardingProgress({
        status: 'business_submitted',
        currentStep: 4,
      });

      completeOnboardingStep('business');

      router.push('/onboarding/business-pending');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit business details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Business Details</Text>
          <Text style={styles.subtitle}>
            Register your barbershop for verification
          </Text>
        </View>

        <View style={styles.form}>
          {/* SSM Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>SSM Registration Number *</Text>
            <TextInput
              style={[styles.input, errors.ssmNumber && styles.inputError]}
              value={formData.ssmNumber}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, ssmNumber: text.toUpperCase() }));
                if (errors.ssmNumber) setErrors(prev => ({ ...prev, ssmNumber: '' }));
              }}
              placeholder="e.g., 001234567-A"
              placeholderTextColor={COLORS.text.tertiary}
              autoCapitalize="characters"
            />
            {errors.ssmNumber && <Text style={styles.errorText}>{errors.ssmNumber}</Text>}
          </View>

          {/* Business Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Name *</Text>
            <TextInput
              style={[styles.input, errors.businessName && styles.inputError]}
              value={formData.businessName}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, businessName: text }));
                if (errors.businessName) setErrors(prev => ({ ...prev, businessName: '' }));
              }}
              placeholder="Enter registered business name"
              placeholderTextColor={COLORS.text.tertiary}
            />
            {errors.businessName && <Text style={styles.errorText}>{errors.businessName}</Text>}
          </View>

          {/* Business Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Type *</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowTypeDropdown(!showTypeDropdown)}
            >
              <Text style={styles.dropdownText}>
                {BUSINESS_TYPES.find(t => t.value === formData.businessType)?.label}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.text.secondary} />
            </TouchableOpacity>
            {showTypeDropdown && (
              <View style={styles.dropdownMenu}>
                {BUSINESS_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, businessType: type.value as any }));
                      setShowTypeDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{type.label}</Text>
                    {formData.businessType === type.value && (
                      <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Address Section */}
          <Text style={styles.sectionTitle}>Shop Address</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street Address *</Text>
            <TextInput
              style={[styles.input, errors.street && styles.inputError]}
              value={formData.street}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, street: text }));
                if (errors.street) setErrors(prev => ({ ...prev, street: '' }));
              }}
              placeholder="e.g., 123 Jalan Sultan Ismail"
              placeholderTextColor={COLORS.text.tertiary}
            />
            {errors.street && <Text style={styles.errorText}>{errors.street}</Text>}
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={[styles.input, errors.city && styles.inputError]}
                value={formData.city}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, city: text }));
                  if (errors.city) setErrors(prev => ({ ...prev, city: '' }));
                }}
                placeholder="City"
                placeholderTextColor={COLORS.text.tertiary}
              />
              {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Postcode *</Text>
              <TextInput
                style={[styles.input, errors.postcode && styles.inputError]}
                value={formData.postcode}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, postcode: text }));
                  if (errors.postcode) setErrors(prev => ({ ...prev, postcode: '' }));
                }}
                placeholder="50000"
                placeholderTextColor={COLORS.text.tertiary}
                keyboardType="number-pad"
                maxLength={5}
              />
              {errors.postcode && <Text style={styles.errorText}>{errors.postcode}</Text>}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>State *</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowStateDropdown(!showStateDropdown)}
            >
              <Text style={styles.dropdownText}>{formData.state}</Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.text.secondary} />
            </TouchableOpacity>
            {showStateDropdown && (
              <View style={styles.dropdownMenu}>
                {MALAYSIAN_STATES.map((state) => (
                  <TouchableOpacity
                    key={state}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, state }));
                      setShowStateDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{state}</Text>
                    {formData.state === state && (
                      <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Documents */}
          <Text style={styles.sectionTitle}>Documents</Text>

          <View style={styles.uploadGroup}>
            <Text style={styles.label}>SSM Registration Certificate *</Text>
            {documents.registrationCert ? (
              <View style={styles.uploadedCard}>
                <View style={styles.uploadedInfo}>
                  <Ionicons name="document" size={24} color={COLORS.success} />
                  <Text style={styles.uploadedText}>Certificate uploaded</Text>
                </View>
                <TouchableOpacity onPress={() => handlePickImage('registrationCert')}>
                  <Text style={styles.changeText}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.uploadButton, errors.registrationCert && styles.uploadButtonError]}
                onPress={() => handlePickImage('registrationCert')}
              >
                <Ionicons name="cloud-upload" size={32} color={COLORS.primary} />
                <Text style={styles.uploadButtonText}>Upload Certificate</Text>
              </TouchableOpacity>
            )}
            {errors.registrationCert && <Text style={styles.errorText}>{errors.registrationCert}</Text>}
          </View>

          <View style={styles.uploadGroup}>
            <Text style={styles.label}>Business License (Optional)</Text>
            {documents.businessLicense ? (
              <View style={styles.uploadedCard}>
                <View style={styles.uploadedInfo}>
                  <Ionicons name="document" size={24} color={COLORS.success} />
                  <Text style={styles.uploadedText}>License uploaded</Text>
                </View>
                <TouchableOpacity onPress={() => handlePickImage('businessLicense')}>
                  <Text style={styles.changeText}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => handlePickImage('businessLicense')}
              >
                <Ionicons name="cloud-upload" size={32} color={COLORS.primary} />
                <Text style={styles.uploadButtonText}>Upload License</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>
              Business verification typically takes 2-3 business days. We'll verify your SSM registration and business address.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Submit for Verification</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    ...TYPOGRAPHY.heading.h2,
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
  },
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    ...TYPOGRAPHY.body.medium,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.error,
    marginTop: 4,
  },
  sectionTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
    marginTop: 8,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  dropdown: {
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  dropdownMenu: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  dropdownItemText: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  uploadGroup: {
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: COLORS.background.primary,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderStyle: 'dashed',
  },
  uploadButtonError: {
    borderColor: COLORS.error,
  },
  uploadButtonText: {
    ...TYPOGRAPHY.body.medium,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  uploadedCard: {
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: COLORS.success,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  uploadedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  uploadedText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.primary,
  },
  changeText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.primary,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: COLORS.primaryLight,
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
    flex: 1,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.background.tertiary,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    ...TYPOGRAPHY.body.large,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
