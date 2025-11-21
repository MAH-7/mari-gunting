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
import Slider from '@react-native-community/slider';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { barberOnboardingService, uploadOnboardingImage } from '@mari-gunting/shared/services/onboardingService';
import { useAuth } from '@mari-gunting/shared/hooks/useAuth';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { supabase } from '@mari-gunting/shared/config/supabase';
import { Colors, theme } from '@mari-gunting/shared/theme';


export default function ServiceDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { user } = useAuth();
  const logout = useStore((state) => state.logout);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [radius, setRadius] = useState(10);
  const [portfolioUris, setPortfolioUris] = useState<string[]>([]);
  const [isLoadedFromProgress, setIsLoadedFromProgress] = useState(false);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const progress = await barberOnboardingService.getProgress();
      if (progress.serviceDetails) {
        setRadius(progress.serviceDetails.radius);
        if (progress.serviceDetails.portfolioUrls?.length) {
          setPortfolioUris(progress.serviceDetails.portfolioUrls);
          setIsLoadedFromProgress(true);
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const pickPortfolioImage = async () => {
    if (portfolioUris.length >= 10) {
      Alert.alert('Maximum Reached', 'You can upload up to 10 portfolio photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.5,  // 50% quality - good balance for portfolio showcase
        // Resize to Full HD resolution - better for portfolio display
        maxWidth: 1920,
        maxHeight: 1920,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        
        if (!uri || typeof uri !== 'string' || uri.trim() === '') {
          Alert.alert('Error', 'Failed to get image. Please try again.');
          return;
        }

        // Compress image
        const compressedImage = await ImageManipulator.manipulateAsync(
          uri,
          [
            { resize: { width: 1200 } },
          ],
          {
            compress: 0.7,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

        // Store locally only (staged upload)
        setPortfolioUris([...portfolioUris, compressedImage.uri]);
        console.log('✅ Portfolio image stored locally - will upload on submit');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image.');
    }
  };

  const removePortfolioImage = async (index: number) => {
    const imageUri = portfolioUris[index];
    
    // If it's an uploaded URL (from previous save), delete from storage
    if (isUrl(imageUri)) {
      Alert.alert(
        'Delete Photo',
        'Remove this photo from your portfolio?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                // Extract path from URL and delete from storage
                const urlObj = new URL(imageUri);
                const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/barber-portfolios\/(.+)/);
                if (pathMatch && pathMatch[1]) {
                  await supabase.storage.from('barber-portfolios').remove([pathMatch[1]]);
                  console.log('✅ Deleted from storage:', pathMatch[1]);
                }
              } catch (error) {
                console.warn('Could not delete from storage:', error);
                // Continue anyway - remove from UI even if storage deletion fails
              }
              
              // Remove from local state
              setPortfolioUris(portfolioUris.filter((_, i) => i !== index));
            },
          },
        ]
      );
    } else {
      // Local URI - just remove from state (not uploaded yet)
      setPortfolioUris(portfolioUris.filter((_, i) => i !== index));
    }
  };



  const validateForm = (): boolean => {
    if (portfolioUris.length < 3) {
      Alert.alert('Portfolio Required', 'Please add at least 3 portfolio photos.');
      return false;
    }

    return true;
  };

  const isUrl = (uri: string) => uri.startsWith('http');

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
      setUploading(true);

      // Check if we need to upload (has local URIs)
      const hasLocalImages = portfolioUris.some((u) => !isUrl(u));
      let finalPortfolioUrls: string[] = [];

      if (!hasLocalImages && isLoadedFromProgress) {
        // All are already URLs from previous save
        finalPortfolioUrls = portfolioUris;
      } else {
        // Upload portfolio images with timestamp-based filenames to avoid overwrites
        console.log('📤 Uploading portfolio images...');
        const uploadTasks = portfolioUris.map(async (uri) => {
          if (isUrl(uri)) {
            console.log('✅ Already uploaded, reusing URL');
            return uri; // Already uploaded
          }
          // Use timestamp-based filename for unique portfolio photos (no overwrites)
          const timestamp = Date.now();
          const filename = `${user?.id}_portfolio_${timestamp}.jpg`;
          console.log('📤 Uploading new portfolio photo:', filename);
          return uploadOnboardingImage(
            uri,
            'barber-portfolios',
            user?.id || 'temp',
            filename
          );
        });

        finalPortfolioUrls = (await Promise.all(uploadTasks)).filter((url): url is string => url !== null);
        
        if (finalPortfolioUrls.length < portfolioUris.length) {
          Alert.alert('Upload Failed', 'Some images failed to upload. Please try again.');
          return;
        }
        
        console.log(`✅ Uploaded ${finalPortfolioUrls.length} portfolio images`);
      }

      const data = {
        radius,
        portfolioUrls: finalPortfolioUrls,
      };

      await barberOnboardingService.saveProgress('serviceDetails', data);
      
      // Navigate to next step or back to review
      if (returnTo === 'review') {
        router.back();
      } else {
        router.push('/onboarding/barber/payout');
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      Alert.alert('Error', 'Failed to save progress. Please try again.');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <View style={styles.progressContainer}>
          <View style={styles.progressDotCompleted} />
          <View style={styles.progressDotCompleted} />
          <View style={[styles.progressDot, styles.progressActive]} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={22} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Service Details</Text>
        <Text style={styles.subtitle}>
          Tell us about your service area and showcase your work.
        </Text>

        {/* Service Radius */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Service Radius <Text style={styles.required}>*</Text>
          </Text>
          <Text style={styles.hint}>How far are you willing to travel for home service?</Text>
          <View style={styles.radiusContainer}>
            <Text style={styles.radiusValue}>{radius} km</Text>
            <Slider
              style={styles.slider}
              minimumValue={5}
              maximumValue={20}
              step={1}
              value={radius}
              onValueChange={setRadius}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor="#e0e0e0"
              thumbTintColor={Colors.primary}
            />
            <View style={styles.radiusLabels}>
              <Text style={styles.radiusLabel}>5 km</Text>
              <Text style={styles.radiusLabel}>20 km</Text>
            </View>
          </View>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={16} color={Colors.primary} />
            <Text style={styles.infoText}>
              Travel fees are set by the platform: RM 5 (0-4km) + RM 1/km after 4km. Max search radius: 20km.
            </Text>
          </View>
        </View>

        {/* Portfolio Photos */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Portfolio Photos <Text style={styles.required}>*</Text>
          </Text>
          <Text style={styles.hint}>
            Upload 3-10 photos of your best work ({portfolioUris.length}/10)
          </Text>
          <View style={styles.portfolioGrid}>
            {portfolioUris.map((uri, index) => (
              <View key={index} style={styles.portfolioItem}>
                <Image source={{ uri }} style={styles.portfolioImage} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => removePortfolioImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#f44336" />
                </TouchableOpacity>
              </View>
            ))}
            {portfolioUris.length < 10 && (
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={pickPortfolioImage}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <>
                    <Ionicons name="add-circle" size={32} color={Colors.primary} />
                    <Text style={styles.addPhotoText}>Add Photo</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

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
  radiusContainer: {
    paddingVertical: 16,
  },
  radiusValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  radiusLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  radiusLabel: {
    fontSize: 12,
    color: '#999',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primaryLight,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.primaryText,
    lineHeight: 18,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dayToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    width: 70,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    fontSize: 14,
    color: '#1a1a1a',
    textAlign: 'center',
    backgroundColor: '#fafafa',
  },
  timeSeparator: {
    fontSize: 16,
    color: '#999',
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  portfolioItem: {
    position: 'relative',
    width: '31%',
    aspectRatio: 1,
  },
  portfolioImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  removePhotoButton: {
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
  addPhotoButton: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 4,
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
