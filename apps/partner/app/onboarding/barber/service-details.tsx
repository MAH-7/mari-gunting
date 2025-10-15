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
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as ImagePicker from 'expo-image-picker';
import { barberOnboardingService, uploadOnboardingImage } from '@mari-gunting/shared/services/onboardingService';
import { useAuth } from '@mari-gunting/shared/hooks/useAuth';


export default function ServiceDetailsScreen() {
  const { user } = useAuth();
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
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        
        if (!uri || typeof uri !== 'string' || uri.trim() === '') {
          Alert.alert('Error', 'Failed to get image. Please try again.');
          return;
        }

        // Store locally only (staged upload)
        setPortfolioUris([...portfolioUris, uri]);
        console.log('✅ Portfolio image stored locally - will upload on submit');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image.');
    }
  };

  const removePortfolioImage = (index: number) => {
    setPortfolioUris(portfolioUris.filter((_, i) => i !== index));
  };



  const validateForm = (): boolean => {
    if (portfolioUris.length < 3) {
      Alert.alert('Portfolio Required', 'Please add at least 3 portfolio photos.');
      return false;
    }

    return true;
  };

  const isUrl = (uri: string) => uri.startsWith('http');

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
        // Upload local images in parallel
        console.log('📤 Uploading portfolio images...');
        const uploadTasks = portfolioUris.map((uri, idx) => {
          if (isUrl(uri)) {
            return Promise.resolve(uri); // Already uploaded
          }
          return uploadOnboardingImage(
            uri,
            'barber-portfolios',
            user?.id || 'temp',
            `portfolio_${idx}_${Date.now()}.jpg`
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
      router.push('/onboarding/barber/payout');
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressDotCompleted} />
          <View style={styles.progressDotCompleted} />
          <View style={[styles.progressDot, styles.progressActive]} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
        </View>
        <View style={{ width: 40 }} />
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
              minimumTrackTintColor="#4CAF50"
              maximumTrackTintColor="#e0e0e0"
              thumbTintColor="#4CAF50"
            />
            <View style={styles.radiusLabels}>
              <Text style={styles.radiusLabel}>5 km</Text>
              <Text style={styles.radiusLabel}>20 km</Text>
            </View>
          </View>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={16} color="#4CAF50" />
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
                  <ActivityIndicator size="small" color="#4CAF50" />
                ) : (
                  <>
                    <Ionicons name="add-circle" size={32} color="#4CAF50" />
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
  backButton: {
    width: 40,
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
    backgroundColor: '#4CAF50',
  },
  progressActive: {
    backgroundColor: '#4CAF50',
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
    color: '#4CAF50',
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
    backgroundColor: '#f0f9f4',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#4CAF50',
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
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
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
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    backgroundColor: '#f0f9f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 4,
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
