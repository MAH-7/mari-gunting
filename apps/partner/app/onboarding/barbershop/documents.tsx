import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { barbershopOnboardingService, uploadOnboardingImage } from '@mari-gunting/shared/services/onboardingService';
import { useAuth } from '@mari-gunting/shared/hooks/useAuth';

export default function DocumentsScreen() {
  const logout = useStore((state) => state.logout);
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [coverImageUris, setCoverImageUris] = useState<string[]>([]);
  const [ssmDocUri, setSsmDocUri] = useState<string | null>(null);
  const [businessLicenseUri, setBusinessLicenseUri] = useState<string | null>(null);
  const [isLoadedFromProgress, setIsLoadedFromProgress] = useState(false);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const progress = await barbershopOnboardingService.getProgress();
      if (progress.documents) {
        // Load saved URLs as display URIs
        if (progress.documents.logoUrl) setLogoUri(progress.documents.logoUrl);
        if (progress.documents.coverImageUrls?.length) setCoverImageUris(progress.documents.coverImageUrls);
        if (progress.documents.ssmDocUrl) setSsmDocUri(progress.documents.ssmDocUrl);
        if (progress.documents.businessLicenseUrl) setBusinessLicenseUri(progress.documents.businessLicenseUrl);
        setIsLoadedFromProgress(true);
        console.log('✅ Progress loaded - documents already uploaded');
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const pickImage = async (type: 'logo' | 'cover' | 'ssm' | 'license') => {
    if (type === 'cover' && coverImageUris.length >= 5) {
      Alert.alert('Maximum Reached', 'You can upload up to 5 cover images.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: type === 'logo' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        
        if (!uri || typeof uri !== 'string' || uri.trim() === '') {
          Alert.alert('Error', 'Failed to get image. Please try again.');
          return;
        }
        
        // Store locally only (staged upload)
        switch (type) {
          case 'logo':
            setLogoUri(uri);
            break;
          case 'cover':
            setCoverImageUris([...coverImageUris, uri]);
            break;
          case 'ssm':
            setSsmDocUri(uri);
            break;
          case 'license':
            setBusinessLicenseUri(uri);
            break;
        }
        console.log(`✅ ${type} stored locally - will upload on submit`);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image.');
    }
  };

  const removeCoverImage = (index: number) => {
    setCoverImageUris(coverImageUris.filter((_, i) => i !== index));
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
    if (coverImageUris.length < 1) {
      Alert.alert('Cover Images Required', 'Please add at least 1 cover image of your barbershop.');
      return false;
    }

    return true;
  };

  const isUrl = (uri: string) => uri.startsWith('http');

  const uploadAllDocuments = async () => {
    try {
      console.log('📤 Starting batch upload...');
      setUploading(true);

      const tasks: Promise<string | null>[] = [];
      
      // Logo
      if (logoUri && !isUrl(logoUri)) {
        tasks.push(uploadOnboardingImage(logoUri, 'barbershop-media', user?.id || 'temp', `logo_${Date.now()}.jpg`));
      }
      
      // Cover images
      const coverTasks = coverImageUris.map((uri, idx) => {
        if (isUrl(uri)) return Promise.resolve(uri);
        return uploadOnboardingImage(uri, 'barbershop-media', user?.id || 'temp', `cover_${idx}_${Date.now()}.jpg`);
      });
      
      // SSM Document
      if (ssmDocUri && !isUrl(ssmDocUri)) {
        tasks.push(uploadOnboardingImage(ssmDocUri, 'barbershop-documents', user?.id || 'temp', `ssm_${Date.now()}.jpg`));
      }
      
      // Business License
      if (businessLicenseUri && !isUrl(businessLicenseUri)) {
        tasks.push(uploadOnboardingImage(businessLicenseUri, 'barbershop-documents', user?.id || 'temp', `license_${Date.now()}.jpg`));
      }

      // Upload all in parallel
      const results = await Promise.all([...tasks, ...coverTasks]);
      
      // Parse results
      let resultIndex = 0;
      const logoUrl = (logoUri && !isUrl(logoUri)) ? results[resultIndex++] : (logoUri || undefined);
      const coverUrls = await Promise.all(coverTasks);
      const ssmUrl = (ssmDocUri && !isUrl(ssmDocUri)) ? results[resultIndex++] : (ssmDocUri || undefined);
      const licenseUrl = (businessLicenseUri && !isUrl(businessLicenseUri)) ? results[resultIndex++] : (businessLicenseUri || undefined);

      console.log('✅ All documents uploaded successfully!');
      return {
        logoUrl,
        coverImageUrls: coverUrls.filter((url): url is string => url !== null),
        ssmDocUrl: ssmUrl,
        businessLicenseUrl: licenseUrl,
      };
    } catch (error) {
      console.error('❌ Batch upload error:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleContinue = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      let finalData;

      // If loaded from progress, skip upload
      if (isLoadedFromProgress && coverImageUris.every(uri => isUrl(uri))) {
        console.log('✅ Using previously uploaded data');
        finalData = {
          logoUrl: logoUri || undefined,
          coverImageUrls: coverImageUris,
          ssmDocUrl: ssmDocUri || undefined,
          businessLicenseUrl: businessLicenseUri || undefined,
        };
      } else {
        // Upload all documents
        console.log('🚀 Uploading all documents...');
        const uploadedData = await uploadAllDocuments();

        if (!uploadedData) {
          Alert.alert('Upload Failed', 'Failed to upload documents. Please check your connection and try again.');
          return;
        }

        finalData = uploadedData;
      }

      await barbershopOnboardingService.saveProgress('documents', finalData);
      router.push('/onboarding/barbershop/operating-hours');
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
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressDotCompleted} />
          <View style={styles.progressDotCompleted} />
          <View style={[styles.progressDot, styles.progressActive]} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Photos & Documents</Text>
        <Text style={styles.subtitle}>
          Upload images of your barbershop and business documents.
        </Text>

        {/* Logo */}
        <View style={styles.section}>
          <Text style={styles.label}>Logo (Optional)</Text>
          <Text style={styles.hint}>Square image of your barbershop logo</Text>
          {logoUri ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: logoUri }} style={styles.logoImage} />
              <TouchableOpacity
                style={styles.changePhotoButton}
                onPress={() => pickImage('logo')}
              >
                <Text style={styles.changePhotoText}>Change Logo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => pickImage('logo')}
              disabled={uploading}
            >
              <Ionicons name="images" size={24} color="#4CAF50" />
              <Text style={styles.uploadButtonText}>Upload Logo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Cover Images */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Cover Images <Text style={styles.required}>*</Text>
          </Text>
          <Text style={styles.hint}>
            Upload 1-5 photos of your barbershop interior and exterior ({coverImageUris.length}/5)
          </Text>
          <View style={styles.coverGrid}>
            {coverImageUris.map((uri, index) => (
              <View key={index} style={styles.coverItem}>
                <Image source={{ uri }} style={styles.coverImage} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeCoverImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#f44336" />
                </TouchableOpacity>
              </View>
            ))}
            {coverImageUris.length < 5 && (
              <TouchableOpacity
                style={styles.addCoverButton}
                onPress={() => pickImage('cover')}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#4CAF50" />
                ) : (
                  <>
                    <Ionicons name="add-circle" size={32} color="#4CAF50" />
                    <Text style={styles.addCoverText}>Add Photo</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* SSM Document */}
        <View style={styles.section}>
          <Text style={styles.label}>SSM Registration Document (Optional)</Text>
          <Text style={styles.hint}>If you have SSM registration</Text>
          {ssmDocUri ? (
            <View style={styles.documentCard}>
              <Ionicons name="document-text" size={32} color="#4CAF50" />
              <View style={styles.documentInfo}>
                <Text style={styles.documentName}>SSM Document</Text>
                <Text style={styles.documentStatus}>✓ Uploaded</Text>
              </View>
              <TouchableOpacity onPress={() => pickImage('ssm')}>
                <Ionicons name="create-outline" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => pickImage('ssm')}
              disabled={uploading}
            >
              <Ionicons name="document-attach" size={24} color="#4CAF50" />
              <Text style={styles.uploadButtonText}>Upload SSM Document</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Business License */}
        <View style={styles.section}>
          <Text style={styles.label}>Business License (Optional)</Text>
          <Text style={styles.hint}>Any other business permits or licenses</Text>
          {businessLicenseUri ? (
            <View style={styles.documentCard}>
              <Ionicons name="document-text" size={32} color="#4CAF50" />
              <View style={styles.documentInfo}>
                <Text style={styles.documentName}>Business License</Text>
                <Text style={styles.documentStatus}>✓ Uploaded</Text>
              </View>
              <TouchableOpacity onPress={() => pickImage('license')}>
                <Ionicons name="create-outline" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => pickImage('license')}
              disabled={uploading}
            >
              <Ionicons name="document-attach" size={24} color="#4CAF50" />
              <Text style={styles.uploadButtonText}>Upload License</Text>
            </TouchableOpacity>
          )}
        </View>

        {uploading && (
          <View style={styles.uploadingIndicator}>
            <ActivityIndicator size="small" color="#4CAF50" />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
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

    backgroundColor: '#FEE2E2',
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
    backgroundColor: '#4CAF50',
  },
  progressActive: {
    backgroundColor: '#4CAF50',
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
    fontSize: 13,
    color: '#999',
    marginBottom: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    backgroundColor: '#f0f9f4',
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  imagePreview: {
    position: 'relative',
  },
  logoImage: {
    width: 150,
    height: 150,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignSelf: 'center',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 12,
    right: '35%',
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
    color: '#4CAF50',
  },
  coverGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  coverItem: {
    position: 'relative',
    width: '48%',
    aspectRatio: 16 / 9,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addCoverButton: {
    width: '48%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    backgroundColor: '#f0f9f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCoverText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 4,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f0f9f4',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  documentStatus: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 2,
  },
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  uploadingText: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
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
