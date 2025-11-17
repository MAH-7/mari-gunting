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
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Device from 'expo-device';
import { barberOnboardingService, uploadOnboardingImage } from '@mari-gunting/shared/services/onboardingService';
import { supabase } from '@mari-gunting/shared/config/supabase';
import { useAuth } from '@mari-gunting/shared/hooks/useAuth';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { Colors, theme } from '@mari-gunting/shared/theme';

export default function EKYCScreen() {
  const insets = useSafeAreaInsets();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { user } = useAuth();
  const logout = useStore((state) => state.logout);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form data - Store local URIs only (no uploads until submit)
  const [icNumber, setIcNumber] = useState('');
  const [icFrontUri, setIcFrontUri] = useState<string | null>(null);
  const [icBackUri, setIcBackUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [certificateUris, setCertificateUris] = useState<string[]>([]);

  // Track if data was loaded from saved progress (already uploaded)
  const [isLoadedFromProgress, setIsLoadedFromProgress] = useState(false);

  useEffect(() => {
    loadProgress();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
    }
  };

  const loadProgress = async () => {
    try {
      const progress = await barberOnboardingService.getProgress();
      if (progress.ekyc) {
        console.log('📥 Loading saved progress...');
        setIcNumber(progress.ekyc.icNumber);
        // Load already-uploaded URLs as display URIs
        setIcFrontUri(progress.ekyc.icFrontUrl);
        setIcBackUri(progress.ekyc.icBackUrl);
        setSelfieUri(progress.ekyc.selfieUrl);
        setCertificateUris(progress.ekyc.certificateUrls);
        setIsLoadedFromProgress(true);
        console.log('✅ Progress loaded - photos already uploaded');
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const pickImage = async (type: 'ic_front' | 'ic_back' | 'selfie' | 'certificate') => {
    try {
      // Different quality settings for different photo types
      const quality = type === 'certificate' ? 0.5 : 0.7;
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: quality,
        // Resize to max dimensions to reduce file size
        maxWidth: 1920,
        maxHeight: 1920,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        
        console.log('📸 Image selected (stored locally):', { type, uri });

        // Validate URI
        if (!uri || typeof uri !== 'string' || uri.trim() === '') {
          console.error('❌ Invalid URI from image picker:', uri);
          Alert.alert('Error', 'Failed to get image. Please try again.');
          return;
        }

        // Store locally only - NO upload yet
        switch (type) {
          case 'ic_front':
            setIcFrontUri(uri);
            break;
          case 'ic_back':
            setIcBackUri(uri);
            break;
          case 'selfie':
            setSelfieUri(uri);
            break;
          case 'certificate':
            setCertificateUris([...certificateUris, uri]);
            break;
        }
        
        // User selected new photo - need to upload on submit
        setIsLoadedFromProgress(false);
        console.log('✅ Photo stored locally - will upload on submit');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image.');
    }
  };

  const takePhoto = async (type: 'ic_front' | 'ic_back' | 'selfie') => {
    try {
      // Check if running on simulator
      const isSimulator = !Device.isDevice;
      
      if (isSimulator) {
        Alert.alert(
          'Camera Not Available',
          'Camera is not available on simulator. Please use "Choose from Gallery" instead, or test on a physical device.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.7,
        // Resize to max dimensions to reduce file size
        maxWidth: 1920,
        maxHeight: 1920,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        
        console.log('📸 Photo taken (stored locally):', { type, uri });

        // Validate URI
        if (!uri || typeof uri !== 'string' || uri.trim() === '') {
          console.error('❌ Invalid URI from camera:', uri);
          Alert.alert('Error', 'Failed to capture photo. Please try again.');
          return;
        }

        // Store locally only - NO upload yet
        switch (type) {
          case 'ic_front':
            setIcFrontUri(uri);
            break;
          case 'ic_back':
            setIcBackUri(uri);
            break;
          case 'selfie':
            setSelfieUri(uri);
            break;
        }
        
        // User took new photo - need to upload on submit
        setIsLoadedFromProgress(false);
        console.log('✅ Photo stored locally - will upload on submit');
      }
    } catch (error: any) {
      console.error('Error taking photo:', error);
      
      // Better error message for camera issues
      if (error.message && error.message.includes('Camera not available')) {
        Alert.alert(
          'Camera Not Available',
          'Camera is not available on this device. Please use "Choose from Gallery" instead.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to take photo. Please try again.');
      }
    }
  };

  const formatICNumber = (text: string) => {
    // Format: 123456-12-1234
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length <= 6) return cleaned;
    if (cleaned.length <= 8) return `${cleaned.slice(0, 6)}-${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8, 12)}`;
  };

  const handleRemoveCertificate = (index: number) => {
    // For staged upload, just remove from local state (no Supabase deletion needed)
    const newUris = certificateUris.filter((_, i) => i !== index);
    setCertificateUris(newUris);
    console.log('✅ Certificate removed from list');
  };

  /**
   * Helper: Check if URI is already an uploaded URL
   */
  const isAlreadyUploaded = (uri: string): boolean => {
    return uri.startsWith('http://') || uri.startsWith('https://');
  };

  /**
   * Helper: Upload if needed, otherwise return existing URL
   */
  const uploadIfNeeded = async (
    uri: string,
    bucket: string,
    folder: string,
    filename: string
  ): Promise<string | null> => {
    if (isAlreadyUploaded(uri)) {
      console.log('✅ Already uploaded, reusing URL:', uri.substring(0, 50) + '...');
      return uri;
    }
    console.log('📤 Uploading new photo:', filename);
    return await uploadOnboardingImage(uri, bucket, folder, filename);
  };

  /**
   * Upload all photos in parallel (batch upload on submit)
   */
  const uploadAllPhotos = async (): Promise<{
    icFrontUrl: string;
    icBackUrl: string;
    selfieUrl: string;
    certificateUrls: string[];
  } | null> => {
    try {
      console.log('📤 Starting batch upload...');
      setUploading(true);

      // Prepare upload tasks
      const uploadTasks: Promise<string | null>[] = [];
      
      // IC Front (upload with consistent filename to overwrite old file)
      uploadTasks.push(
        uploadIfNeeded(
          icFrontUri!,
          'barber-documents',
          user?.id || 'temp',
          `${user?.id}_ic_front.jpg`
        )
      );

      // IC Back
      uploadTasks.push(
        uploadIfNeeded(
          icBackUri!,
          'barber-documents',
          user?.id || 'temp',
          `${user?.id}_ic_back.jpg`
        )
      );

      // Selfie
      uploadTasks.push(
        uploadIfNeeded(
          selfieUri!,
          'barber-documents',
          user?.id || 'temp',
          `${user?.id}_selfie.jpg`
        )
      );

      // Upload IC, selfie in parallel
      const [icFrontUrl, icBackUrl, selfieUrl] = await Promise.all(uploadTasks);

      // Upload certificates in parallel (if any)
      const certUrls: string[] = [];
      if (certificateUris.length > 0) {
        console.log(`📝 Processing ${certificateUris.length} certificates...`);
        const certTasks = certificateUris.map((uri, index) =>
          uploadIfNeeded(
            uri,
            'barber-documents',
            user?.id || 'temp',
            `${user?.id}_certificate_${index}.jpg`
          )
        );
        const certResults = await Promise.all(certTasks);
        certUrls.push(...certResults.filter((url): url is string => url !== null));
      }

      // Validate all uploads succeeded
      if (!icFrontUrl || !icBackUrl || !selfieUrl) {
        console.error('❌ Some uploads failed');
        return null;
      }

      console.log('✅ All photos uploaded successfully!');
      return {
        icFrontUrl,
        icBackUrl,
        selfieUrl,
        certificateUrls: certUrls,
      };
    } catch (error) {
      console.error('❌ Batch upload error:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const validateForm = (): boolean => {
    if (icNumber.length !== 14) {
      Alert.alert('IC Number Required', 'Please enter a valid Malaysian IC number.');
      return false;
    }

    if (!icFrontUri) {
      Alert.alert('IC Front Photo Required', 'Please upload front of your IC.');
      return false;
    }

    if (!icBackUri) {
      Alert.alert('IC Back Photo Required', 'Please upload back of your IC.');
      return false;
    }

    if (!selfieUri) {
      Alert.alert('Selfie Required', 'Please take a selfie for verification.');
      return false;
    }

    return true;
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

  const handleContinue = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Upload all photos (smart upload: only uploads new local files, reuses existing URLs)
      console.log('🚀 Processing photos...');
      const uploadedUrls = await uploadAllPhotos();

      if (!uploadedUrls) {
        Alert.alert('Upload Failed', 'Failed to upload photos. Please check your connection and try again.');
        return;
      }

      // Save progress with uploaded URLs
      const data = {
        icNumber,
        ...uploadedUrls,
      };

      await barberOnboardingService.saveProgress('ekyc', data);
      console.log('🎉 Progress saved successfully!');
      
      // Navigate to next step or back to review
      if (returnTo === 'review') {
        router.back();
      } else {
        router.push('/onboarding/barber/service-details');
      }
    } catch (error) {
      console.error('Error in handleContinue:', error);
      Alert.alert('Error', 'Failed to save progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <View style={styles.progressContainer}>
          <View style={styles.progressDotCompleted} />
          <View style={[styles.progressDot, styles.progressActive]} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={22} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Identity Verification</Text>
        <Text style={styles.subtitle}>
          We need to verify your identity for safety and security purposes.
        </Text>

        {/* IC Number */}
        <View style={styles.section}>
          <Text style={styles.label}>
            MyKad/IC Number <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="123456-12-1234"
            placeholderTextColor="#999"
            value={icNumber}
            onChangeText={(text) => setIcNumber(formatICNumber(text))}
            keyboardType="number-pad"
            maxLength={14}
          />
        </View>

        {/* IC Front */}
        <View style={styles.section}>
          <Text style={styles.label}>
            IC Front Photo <Text style={styles.required}>*</Text>
          </Text>
          <Text style={styles.hint}>Clear photo of the front side of your MyKad/IC</Text>
          {icFrontUri ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: icFrontUri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.changePhotoButton}
                onPress={() => takePhoto('ic_front')}
              >
                <Text style={styles.changePhotoText}>Retake Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => takePhoto('ic_front')}
              disabled={uploading}
            >
              <Ionicons name="camera" size={32} color={Colors.primary} />
              <Text style={styles.cameraButtonText}>Take Photo</Text>
              <Text style={styles.cameraButtonHint}>Camera only for security</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* IC Back */}
        <View style={styles.section}>
          <Text style={styles.label}>
            IC Back Photo <Text style={styles.required}>*</Text>
          </Text>
          {icBackUri ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: icBackUri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.changePhotoButton}
                onPress={() => takePhoto('ic_back')}
              >
                <Text style={styles.changePhotoText}>Retake Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => takePhoto('ic_back')}
              disabled={uploading}
            >
              <Ionicons name="camera" size={32} color={Colors.primary} />
              <Text style={styles.cameraButtonText}>Take Photo</Text>
              <Text style={styles.cameraButtonHint}>Camera only for security</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Selfie */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Selfie Photo <Text style={styles.required}>*</Text>
          </Text>
          <Text style={styles.hint}>Take a clear selfie holding your IC next to your face</Text>
          {selfieUri ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: selfieUri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.changePhotoButton}
                onPress={() => takePhoto('selfie')}
              >
                <Text style={styles.changePhotoText}>Retake Selfie</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.selfieButton}
              onPress={() => takePhoto('selfie')}
              disabled={uploading}
            >
              <Ionicons name="camera" size={32} color={Colors.primary} />
              <Text style={styles.selfieButtonText}>Take Selfie</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Certificates (Optional) */}
        <View style={styles.section}>
          <Text style={styles.label}>Certificates (Optional)</Text>
          <Text style={styles.hint}>Upload any barbering certificates or training documents</Text>
          
          {/* Display uploaded certificates */}
          {certificateUris.length > 0 && (
            <View style={styles.certificatesContainer}>
              {certificateUris.map((uri, index) => (
                <View key={index} style={styles.certificateItem}>
                  <Image source={{ uri }} style={styles.certificateImage} />
                  <View style={styles.certificateInfo}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                    <Text style={styles.certificateText}>Certificate {index + 1}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveCertificate(index)}>
                    <Ionicons name="close-circle" size={20} color="#f44336" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickImage('certificate')}
            disabled={uploading}
          >
            <Ionicons name="add-circle" size={24} color={Colors.primary} />
            <Text style={styles.uploadButtonText}>
              {certificateUris.length > 0 ? 'Add Another Certificate' : 'Add Certificate'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info: Photos stored locally */}
        {!isLoadedFromProgress && (icFrontUri || icBackUri || selfieUri || certificateUris.length > 0) && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={Colors.primary} />
            <Text style={styles.infoText}>
              Photos saved locally. They will be uploaded when you click Continue.
            </Text>
          </View>
        )}

        {uploading && (
          <View style={styles.uploadingIndicator}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.uploadingText}>Uploading all photos...</Text>
            <Text style={styles.uploadingSubtext}>This may take a moment</Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.footer, { paddingBottom: Platform.OS === 'android' ? insets.bottom + 16 : 32 }]}>
        <TouchableOpacity
          style={[styles.continueButton, (loading || uploading) && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={loading || uploading}
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
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  progressDotCompleted: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  progressActive: {
    backgroundColor: Colors.primary,
    width: 24,
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
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
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
  hint: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
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
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    backgroundColor: Colors.primaryLight,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  cameraButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    backgroundColor: Colors.primaryLight,
  },
  cameraButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 8,
  },
  cameraButtonHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  selfieButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    backgroundColor: Colors.primaryLight,
  },
  selfieButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 8,
  },
  imagePreview: {
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  uploadingIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    marginBottom: 16,
  },
  uploadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 12,
  },
  uploadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.primaryLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  certificatesContainer: {
    marginBottom: 12,
    gap: 12,
  },
  certificateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  certificateImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  certificateInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  certificateText: {
    fontSize: 14,
    fontWeight: '600',
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
