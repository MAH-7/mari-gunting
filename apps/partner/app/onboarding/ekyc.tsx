import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { useStore } from '@/store/useStore';
import VerificationStatusBanner from '@/components/VerificationStatusBanner';
import { supabase } from '@mari-gunting/shared/config/supabase';
import { VerificationStatus } from '@/types/onboarding';
import { uploadOnboardingImage } from '@mari-gunting/shared/services/onboardingService';
import { useAuth } from '@mari-gunting/shared/hooks/useAuth';

type DocumentType = 'nricFront' | 'nricBack' | 'selfie';

export default function EKYCScreen() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [nricNumber, setNricNumber] = useState('');
  const [documents, setDocuments] = useState({
    nricFront: null as string | null,
    nricBack: null as string | null,
    selfie: null as string | null,
  });
  const [isLoadedFromProgress, setIsLoadedFromProgress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('in_progress');

  const updateOnboardingProgress = useStore((state) => state.updateOnboardingProgress);
  const completeOnboardingStep = useStore((state) => state.completeOnboardingStep);
  const onboardingData = useStore((state) => state.onboardingData);

  // Check if eKYC was already submitted
  useEffect(() => {
    if (onboardingData?.ekyc?.verificationStatus) {
      setVerificationStatus(onboardingData.ekyc.verificationStatus);
      // Pre-fill if editing
      if (onboardingData.ekyc.fullName) setFullName(onboardingData.ekyc.fullName);
      if (onboardingData.ekyc.nricNumber) setNricNumber(onboardingData.ekyc.nricNumber);
      // Load previously uploaded document URLs as display URIs
      if (onboardingData.ekyc.nricFrontUrl || onboardingData.ekyc.nricBackUrl || onboardingData.ekyc.selfieUrl) {
        setDocuments({
          nricFront: onboardingData.ekyc.nricFrontUrl || null,
          nricBack: onboardingData.ekyc.nricBackUrl || null,
          selfie: onboardingData.ekyc.selfieUrl || null,
        });
        setIsLoadedFromProgress(true);
        console.log('✅ Progress loaded - documents already uploaded');
      }
    }
  }, [onboardingData]);

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
        const uri = result.assets[0].uri;
        
        // Validate URI
        if (!uri || typeof uri !== 'string' || uri.trim() === '') {
          Alert.alert('Error', 'Failed to get image. Please try again.');
          return;
        }

        // Store locally only (staged upload)
        setDocuments(prev => ({
          ...prev,
          [type]: uri,
        }));
        // Clear error for this field
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[type];
          return newErrors;
        });
        console.log(`✅ ${type} stored locally - will upload on submit`);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setIsUploading(false);
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
        const uri = result.assets[0].uri;
        
        // Validate URI
        if (!uri || typeof uri !== 'string' || uri.trim() === '') {
          Alert.alert('Error', 'Failed to capture photo. Please try again.');
          return;
        }

        // Store locally only (staged upload)
        setDocuments(prev => ({
          ...prev,
          [type]: uri,
        }));
        // Clear error for this field
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[type];
          return newErrors;
        });
        console.log(`✅ ${type} photo stored locally - will upload on submit`);
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      setIsUploading(false);
      Alert.alert(
        'Camera Error', 
        error?.message || 'Failed to take photo. Please try choosing from gallery instead.'
      );
    }
  };

  const uploadAllDocuments = async () => {
    try {
      console.log('📤 Starting batch upload...');
      setIsUploading(true);

      const [nricFrontUrl, nricBackUrl, selfieUrl] = await Promise.all([
        uploadOnboardingImage(documents.nricFront!, 'ekyc-documents', user?.id || 'temp', `nricFront_${Date.now()}.jpg`),
        uploadOnboardingImage(documents.nricBack!, 'ekyc-documents', user?.id || 'temp', `nricBack_${Date.now()}.jpg`),
        uploadOnboardingImage(documents.selfie!, 'ekyc-documents', user?.id || 'temp', `selfie_${Date.now()}.jpg`),
      ]);

      if (!nricFrontUrl || !nricBackUrl || !selfieUrl) {
        console.error('❌ Some uploads failed');
        return null;
      }

      console.log('✅ All documents uploaded successfully!');
      return { nricFrontUrl, nricBackUrl, selfieUrl };
    } catch (error) {
      console.error('❌ Batch upload error:', error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please complete all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalDocumentUrls;

      // If loaded from progress, skip upload
      if (isLoadedFromProgress) {
        console.log('✅ Using previously uploaded data');
        finalDocumentUrls = {
          nricFrontUrl: documents.nricFront!,
          nricBackUrl: documents.nricBack!,
          selfieUrl: documents.selfie!,
        };
      } else {
        // Upload all documents
        console.log('🚀 Uploading all documents...');
        const uploadedUrls = await uploadAllDocuments();

        if (!uploadedUrls) {
          Alert.alert('Upload Failed', 'Failed to upload documents. Please check your connection and try again.');
          return;
        }

        finalDocumentUrls = uploadedUrls;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

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
          ...finalDocumentUrls,
          verificationStatus: 'pending' as const,
        },
      };

      useStore.setState({ onboardingData: updatedData });

      updateOnboardingProgress({
        status: 'ekyc_submitted',
        currentStep: 2,
      });

      completeOnboardingStep('ekyc');

      // Update verification status in database to 'pending'
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const accountType = onboardingData?.progress.accountType;
          
          if (accountType === 'barbershop') {
            const { error } = await supabase
              .from('barbershops')
              .update({ verification_status: 'pending' })
              .eq('owner_id', user.id);
            
            if (error) {
              console.error('❌ Failed to update barbershop status:', error);
            } else {
              console.log('✅ Barbershop verification status updated to pending');
            }
          } else {
            const { error } = await supabase
              .from('barbers')
              .update({ verification_status: 'pending' })
              .eq('user_id', user.id);
            
            if (error) {
              console.error('❌ Failed to update barber status:', error);
            } else {
              console.log('✅ Barber verification status updated to pending');
            }
          }
        }
      } catch (error) {
        console.error('❌ Error updating verification status:', error);
      }

      // Navigate to next step based on account type
      const accountType = onboardingData?.progress.accountType;
      if (accountType === 'barbershop') {
        router.push('/onboarding/business');
      } else {
        router.push('/onboarding/payout');
      }
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

        {/* Verification Status Banner */}
        <VerificationStatusBanner 
          status={verificationStatus}
          message={
            verificationStatus === 'submitted' 
              ? 'Your documents are being reviewed. You can continue with the next steps.'
              : undefined
          }
        />

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

        {/* Uploading indicator */}
        {isUploading && (
          <View style={styles.uploadingIndicator}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, (isSubmitting || isUploading) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting || isUploading}
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
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  uploadingText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
  },
});
