import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { useStore } from '@/store/useStore';

type DocumentType = 'nricFront' | 'nricBack' | 'selfie';

export default function EKYCScreen() {
  const [fullName, setFullName] = useState('');
  const [nricNumber, setNricNumber] = useState('');
  const [documents, setDocuments] = useState({
    nricFront: null as string | null,
    nricBack: null as string | null,
    selfie: null as string | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateOnboardingProgress = useStore((state) => state.updateOnboardingProgress);
  const completeOnboardingStep = useStore((state) => state.completeOnboardingStep);
  const onboardingData = useStore((state) => state.onboardingData);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 3) {
      newErrors.fullName = 'Name must be at least 3 characters';
    }

    if (!nricNumber.trim()) {
      newErrors.nricNumber = 'NRIC/Passport number is required';
    } else if (nricNumber.replace(/[-\s]/g, '').length < 8) {
      newErrors.nricNumber = 'Invalid NRIC/Passport number';
    }

    if (!documents.nricFront) {
      newErrors.nricFront = 'NRIC/Passport front photo is required';
    }

    if (!documents.nricBack) {
      newErrors.nricBack = 'NRIC/Passport back photo is required';
    }

    if (!documents.selfie) {
      newErrors.selfie = 'Selfie is required for verification';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePickImage = async (type: DocumentType) => {
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
        // Clear error for this field
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[type];
          return newErrors;
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleTakePhoto = async (type: DocumentType) => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permission.granted) {
        Alert.alert(
          'Camera Permission Required', 
          'Please allow camera access in your device settings to take photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => ImagePicker.requestCameraPermissionsAsync() }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: type === 'selfie' ? [1, 1] : [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setDocuments(prev => ({
          ...prev,
          [type]: result.assets[0].uri,
        }));
        // Clear error for this field
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[type];
          return newErrors;
        });
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      Alert.alert(
        'Camera Error', 
        error?.message || 'Failed to take photo. Please try choosing from gallery instead.'
      );
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please complete all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update store with eKYC data
      const currentData = onboardingData || {
        progress: {
          status: 'account_type_selected',
          currentStep: 1,
          totalSteps: 7,
          completedSteps: ['account_type'],
          lastUpdatedAt: new Date().toISOString(),
        },
        consents: {},
      };

      const updatedData = {
        ...currentData,
        ekyc: {
          fullName,
          nricNumber: `****${nricNumber.slice(-4)}`, // Store only last 4 digits
          nricFrontUrl: documents.nricFront!,
          nricBackUrl: documents.nricBack!,
          selfieUrl: documents.selfie!,
          verificationStatus: 'pending' as const,
        },
      };

      useStore.setState({ onboardingData: updatedData });

      updateOnboardingProgress({
        status: 'ekyc_submitted',
        currentStep: 2,
      });

      completeOnboardingStep('ekyc');

      // Navigate to pending screen
      router.push('/onboarding/ekyc-pending');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit verification. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Identity Verification</Text>
          <Text style={styles.subtitle}>
            We need to verify your identity for security purposes
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name (as per NRIC/Passport) *</Text>
            <TextInput
              style={[styles.input, errors.fullName && styles.inputError]}
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (errors.fullName) {
                  setErrors(prev => ({ ...prev, fullName: '' }));
                }
              }}
              placeholder="Enter your full name"
              placeholderTextColor={COLORS.text.tertiary}
              autoCapitalize="words"
            />
            {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
          </View>

          {/* NRIC/Passport Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>NRIC/Passport Number *</Text>
            <TextInput
              style={[styles.input, errors.nricNumber && styles.inputError]}
              value={nricNumber}
              onChangeText={(text) => {
                setNricNumber(text.toUpperCase());
                if (errors.nricNumber) {
                  setErrors(prev => ({ ...prev, nricNumber: '' }));
                }
              }}
              placeholder="e.g., 123456-78-9012"
              placeholderTextColor={COLORS.text.tertiary}
              autoCapitalize="characters"
            />
            {errors.nricNumber && <Text style={styles.errorText}>{errors.nricNumber}</Text>}
            <Text style={styles.helperText}>Format: XXXXXX-XX-XXXX or passport number</Text>
          </View>

          {/* Document Uploads */}
          <View style={styles.documentsSection}>
            <Text style={styles.sectionTitle}>Upload Documents</Text>

            {/* NRIC Front */}
            <View style={styles.uploadGroup}>
              <Text style={styles.label}>NRIC/Passport Front *</Text>
              {documents.nricFront ? (
                <View style={styles.uploadedCard}>
                  <View style={styles.uploadedInfo}>
                    <Ionicons name="document" size={24} color={COLORS.success} />
                    <Text style={styles.uploadedText}>Photo uploaded</Text>
                  </View>
                  <TouchableOpacity onPress={() => handlePickImage('nricFront')}>
                    <Text style={styles.changeText}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadButtons}>
                  <TouchableOpacity 
                    style={[styles.uploadButton, errors.nricFront && styles.uploadButtonError]}
                    onPress={() => handleTakePhoto('nricFront')}
                  >
                    <Ionicons name="camera" size={24} color={COLORS.primary} />
                    <Text style={styles.uploadButtonText}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.uploadButton, errors.nricFront && styles.uploadButtonError]}
                    onPress={() => handlePickImage('nricFront')}
                  >
                    <Ionicons name="images" size={24} color={COLORS.primary} />
                    <Text style={styles.uploadButtonText}>Choose from Gallery</Text>
                  </TouchableOpacity>
                </View>
              )}
              {errors.nricFront && <Text style={styles.errorText}>{errors.nricFront}</Text>}
            </View>

            {/* NRIC Back */}
            <View style={styles.uploadGroup}>
              <Text style={styles.label}>NRIC/Passport Back *</Text>
              {documents.nricBack ? (
                <View style={styles.uploadedCard}>
                  <View style={styles.uploadedInfo}>
                    <Ionicons name="document" size={24} color={COLORS.success} />
                    <Text style={styles.uploadedText}>Photo uploaded</Text>
                  </View>
                  <TouchableOpacity onPress={() => handlePickImage('nricBack')}>
                    <Text style={styles.changeText}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadButtons}>
                  <TouchableOpacity 
                    style={[styles.uploadButton, errors.nricBack && styles.uploadButtonError]}
                    onPress={() => handleTakePhoto('nricBack')}
                  >
                    <Ionicons name="camera" size={24} color={COLORS.primary} />
                    <Text style={styles.uploadButtonText}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.uploadButton, errors.nricBack && styles.uploadButtonError]}
                    onPress={() => handlePickImage('nricBack')}
                  >
                    <Ionicons name="images" size={24} color={COLORS.primary} />
                    <Text style={styles.uploadButtonText}>Choose from Gallery</Text>
                  </TouchableOpacity>
                </View>
              )}
              {errors.nricBack && <Text style={styles.errorText}>{errors.nricBack}</Text>}
            </View>

            {/* Selfie */}
            <View style={styles.uploadGroup}>
              <Text style={styles.label}>Selfie for Verification *</Text>
              {documents.selfie ? (
                <View style={styles.uploadedCard}>
                  <View style={styles.uploadedInfo}>
                    <Ionicons name="person-circle" size={24} color={COLORS.success} />
                    <Text style={styles.uploadedText}>Selfie uploaded</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleTakePhoto('selfie')}>
                    <Text style={styles.changeText}>Retake</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadButtons}>
                  <TouchableOpacity 
                    style={[styles.uploadButton, errors.selfie && styles.uploadButtonError]}
                    onPress={() => handleTakePhoto('selfie')}
                  >
                    <Ionicons name="camera" size={24} color={COLORS.primary} />
                    <Text style={styles.uploadButtonText}>Take Selfie</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.uploadButton, errors.selfie && styles.uploadButtonError]}
                    onPress={() => handlePickImage('selfie')}
                  >
                    <Ionicons name="images" size={24} color={COLORS.primary} />
                    <Text style={styles.uploadButtonText}>Choose Photo</Text>
                  </TouchableOpacity>
                </View>
              )}
              {errors.selfie && <Text style={styles.errorText}>{errors.selfie}</Text>}
              <Text style={styles.helperText}>Face should be clearly visible</Text>
            </View>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>
              Your documents are encrypted and securely stored. Verification typically takes 1-2 business days.
            </Text>
          </View>
        </View>

        {/* Submit Button */}
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
  helperText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.tertiary,
    marginTop: 4,
  },
  documentsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  uploadGroup: {
    marginBottom: 24,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderStyle: 'dashed',
  },
  uploadButtonError: {
    borderColor: COLORS.error,
  },
  uploadButtonText: {
    ...TYPOGRAPHY.body.small,
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
  selfieButton: {
    backgroundColor: COLORS.background.primary,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderStyle: 'dashed',
  },
  selfieButtonText: {
    ...TYPOGRAPHY.body.medium,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  selfieButtonSubtext: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
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
