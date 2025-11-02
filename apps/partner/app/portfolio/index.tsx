import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Image, 
  ActivityIndicator, 
  Modal,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Device from 'expo-device';
import * as Haptics from 'expo-haptics';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { portfolioService } from '@mari-gunting/shared';

const { width } = Dimensions.get('window');

interface PortfolioImage {
  id: string;
  uri: string;
  caption?: string;
  isCover?: boolean;
}

export default function PortfolioManagementScreen() {
  const router = useRouter();
  const currentUser = useStore((state) => state.currentUser);
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  // Load portfolio images on mount
  useEffect(() => {
    loadPortfolio();
  }, [currentUser]);

  const loadPortfolio = async (showRefreshing = false) => {
    if (!currentUser?.id) {
      setIsLoading(false);
      return;
    }

    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      const imageUrls = await portfolioService.getMyPortfolio(currentUser.id);
      
      const portfolioImages: PortfolioImage[] = imageUrls.map((url, index) => ({
        id: `${index}-${url}`,
        uri: url,
        isCover: index === 0,
      }));
      
      setImages(portfolioImages);
    } catch (error) {
      console.error('Error loading portfolio:', error);
      Alert.alert('Error', 'Failed to load portfolio');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    loadPortfolio(true);
  }, [currentUser]);

  const pickImage = async () => {
    console.log('📸 pickImage called');
    
    if (!currentUser?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    try {
      console.log('📸 Requesting media library permissions...');
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('📸 Permission result:', permissionResult);
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Allow access to your photos');
        return;
      }

      console.log('📸 Launching image library...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,  // Match onboarding - no cropping
        quality: 0.5,  // Match onboarding - 50% quality
        maxWidth: 1920,  // Match onboarding - optimize size
        maxHeight: 1920,
      });

      console.log('📸 Image picker result:', result);
      
      if (result.canceled) {
        console.log('📸 User cancelled image selection');
        return;
      }
      
      if (!result.assets || result.assets.length === 0) {
        console.log('📸 No assets in result');
        Alert.alert('Error', 'No image selected');
        return;
      }
      
      console.log('📸 Selected image URI:', result.assets[0].uri);
      await uploadImage(result.assets[0].uri);
    } catch (error) {
      console.error('❌ Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const takePhoto = async () => {
    console.log('📷 takePhoto called');
    
    try {
      const isSimulator = !Device.isDevice;
      console.log('📷 Is simulator:', isSimulator);
      
      if (isSimulator) {
        Alert.alert('Camera Not Available', 'Use library on simulator');
        return;
      }
      
      console.log('📷 Requesting camera permissions...');
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      console.log('📷 Permission result:', permissionResult);
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Allow camera access');
        return;
      }

      console.log('📷 Launching camera...');
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,  // Match onboarding - no cropping
        quality: 0.7,  // Match onboarding camera quality
        maxWidth: 1920,  // Match onboarding - optimize size
        maxHeight: 1920,
      });

      console.log('📷 Camera result:', result);
      
      if (result.canceled) {
        console.log('📷 User cancelled camera');
        return;
      }
      
      if (!result.assets || result.assets.length === 0) {
        console.log('📷 No assets in result');
        Alert.alert('Error', 'No photo taken');
        return;
      }
      
      console.log('📷 Captured image URI:', result.assets[0].uri);
      await uploadImage(result.assets[0].uri);
    } catch (error: any) {
      console.error('❌ Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const uploadImage = async (uri: string) => {
    if (!currentUser?.id || !uri || typeof uri !== 'string' || uri.trim() === '') {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const imageUrl = await portfolioService.addMyImage(currentUser.id, uri);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      const newImage: PortfolioImage = {
        id: `${Date.now()}-${imageUrl}`,
        uri: imageUrl,
        isCover: images.length === 0,
      };
      
      setImages([newImage, ...images]);
      
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
      
      Alert.alert('Success', 'Photo uploaded successfully!');

      setTimeout(() => {
        setUploadProgress(0);
      }, 500);
    } catch (uploadError) {
      console.error('Error uploading image:', uploadError);
      Alert.alert('Error', 'Upload failed. Please try again');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddPhoto = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Library',
          onPress: pickImage,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleDeleteImage = async (id: string, imageUrl: string) => {
    if (!currentUser?.id) {
      return;
    }

    try {
      await portfolioService.deleteMyImage(currentUser.id, imageUrl);
      setImages(images.filter(img => img.id !== id));
      
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
      
      Alert.alert('Success', 'Photo deleted');
    } catch (error) {
      console.error('Error deleting image:', error);
      Alert.alert('Error', 'Delete failed');
    }
  };

  const handleImagePress = (image: PortfolioImage) => {
    if (isSelectionMode) {
      toggleImageSelection(image.id);
    } else {
      setPreviewImage(image.uri);
    }
  };

  const handleImageLongPress = (image: PortfolioImage) => {
    if (!isSelectionMode) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}
      setIsSelectionMode(true);
      setSelectedImages(new Set([image.id]));
    }
  };

  const toggleImageSelection = (id: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    const newSelected = new Set(selectedImages);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedImages(newSelected);
  };

  const handleBatchDelete = () => {
    Alert.alert(
      'Delete Photos',
      `Delete ${selectedImages.size} selected photos?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const toDelete = images.filter(img => selectedImages.has(img.id));
            for (const img of toDelete) {
              await handleDeleteImage(img.id, img.uri);
            }
            setIsSelectionMode(false);
            setSelectedImages(new Set());
          },
        },
      ]
    );
  };

  const cancelSelectionMode = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    setIsSelectionMode(false);
    setSelectedImages(new Set());
  };

  const handleSetAsCover = async (image: PortfolioImage) => {
    if (!currentUser?.id) {
      return;
    }

    try {
      // Update in database (reorders array with selected image first)
      await portfolioService.setMyCoverPhoto(currentUser.id, image.uri);
      
      // Update local state
      const updatedImages = images.map(img => ({
        ...img,
        isCover: img.id === image.id,
      }));
      setImages(updatedImages);
      
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
      
      Alert.alert('Success', 'Cover photo updated');
    } catch (error) {
      console.error('Error setting cover photo:', error);
      Alert.alert('Error', 'Failed to update cover photo');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Portfolio</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading portfolio...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const coverPhoto = images.find(img => img.isCover);
  const recommendedCount = 6;
  const progress = Math.min(images.length / recommendedCount, 1);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with selection mode */}
      <View style={styles.header}>
        {isSelectionMode ? (
          <>
            <TouchableOpacity onPress={cancelSelectionMode} style={styles.backButton}>
              <Ionicons name="close" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{selectedImages.size} selected</Text>
            <TouchableOpacity
              onPress={handleBatchDelete}
              disabled={selectedImages.size === 0}
              style={styles.headerRight}
            >
              <Ionicons 
                name="trash-outline" 
                size={24} 
                color={selectedImages.size > 0 ? COLORS.error : COLORS.text.tertiary} 
              />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Portfolio</Text>
            <TouchableOpacity
              onPress={() => {
                if (images.length > 0) {
                  setIsSelectionMode(true);
                }
              }}
              style={styles.headerRight}
            >
              <Ionicons 
                name="checkmark-circle-outline" 
                size={24} 
                color={images.length > 0 ? COLORS.text.primary : COLORS.text.tertiary} 
              />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Upload Progress Overlay */}
      {isUploading && (
        <View style={styles.uploadingOverlay}>
          <View style={styles.uploadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.uploadingText}>Uploading...</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{uploadProgress}%</Text>
          </View>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Enhanced Stats Dashboard */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="images" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{images.length}</Text>
            <Text style={styles.statLabel}>Total Photos</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons 
                name="checkmark-circle" 
                size={24} 
                color={images.length >= recommendedCount ? COLORS.success : COLORS.warning} 
              />
            </View>
            <Text style={styles.statValue}>
              {images.length >= recommendedCount ? '100%' : `${Math.round(progress * 100)}%`}
            </Text>
            <Text style={styles.statLabel}>Complete</Text>
            <View style={styles.progressContainer}>
              <View style={[styles.progressIndicator, { width: `${progress * 100}%` }]} />
            </View>
          </View>
        </View>

        {/* Info Banner */}
        {images.length < recommendedCount && (
          <View style={styles.infoBanner}>
            <Ionicons name="bulb-outline" size={20} color={COLORS.warning} />
            <Text style={styles.infoBannerText}>
              Add {recommendedCount - images.length} more {images.length === recommendedCount - 1 ? 'photo' : 'photos'} to complete your portfolio
            </Text>
          </View>
        )}

        {/* Cover Photo Section */}
        {coverPhoto && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Cover Photo</Text>
              <View style={styles.coverBadge}>
                <Ionicons name="star" size={12} color={COLORS.warning} />
                <Text style={styles.coverBadgeText}>Featured</Text>
              </View>
            </View>
            <View style={styles.coverPhotoContainer}>
              <Image source={{ uri: coverPhoto.uri }} style={styles.coverPhoto} resizeMode="cover" />
            </View>
          </View>
        )}

        {/* Image Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Photos ({images.length})</Text>
            {images.length > 0 && !isSelectionMode && (
              <TouchableOpacity onPress={() => setIsSelectionMode(true)}>
                <Text style={styles.selectText}>Select</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {images.length === 0 ? (
            <View style={styles.enhancedEmptyState}>
              <View style={styles.emptyStateIconContainer}>
                <Ionicons name="images-outline" size={64} color={COLORS.text.tertiary} />
              </View>
              <Text style={styles.emptyStateTitle}>Build Your Portfolio</Text>
              <Text style={styles.emptyStateText}>
                Showcase your best work to attract more customers
              </Text>
              
              <View style={styles.quickActionsContainer}>
                <TouchableOpacity style={styles.quickActionButton} onPress={handleAddPhoto}>
                  <Ionicons name="camera" size={24} color={COLORS.primary} />
                  <Text style={styles.quickActionText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionButton} onPress={handleAddPhoto}>
                  <Ionicons name="images" size={24} color={COLORS.primary} />
                  <Text style={styles.quickActionText}>Choose Photos</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.tipsContainer}>
                <Text style={styles.tipsTitle}>💡 Quick Tips</Text>
                {[
                  'Use good lighting for clear photos',
                  'Show different haircut styles',
                  'Include before & after shots',
                ].map((tip, index) => (
                  <View key={index} style={styles.tipItem}>
                    <View style={styles.tipDot} />
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.imageGrid}>
              {images.map((image) => {
                const isSelected = selectedImages.has(image.id);
                return (
                  <TouchableOpacity
                    key={image.id}
                    style={[
                      styles.imageItem,
                      isSelected && styles.imageItemSelected,
                    ]}
                    onPress={() => handleImagePress(image)}
                    onLongPress={() => handleImageLongPress(image)}
                    activeOpacity={0.9}
                  >
                    <Image 
                      source={{ uri: image.uri }} 
                      style={styles.portfolioImage}
                      resizeMode="cover"
                      onError={(e) => console.log('❌ Image load error:', image.uri, e.nativeEvent.error)}
                      onLoad={() => console.log('✅ Image loaded:', image.uri)}
                    />
                    
                    {isSelectionMode && (
                      <View style={styles.selectionOverlay}>
                        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                          {isSelected && (
                            <Ionicons name="checkmark" size={16} color="#FFF" />
                          )}
                        </View>
                      </View>
                    )}
                    
                    {image.isCover && !isSelectionMode && (
                      <View style={styles.imageOverlayBadge}>
                        <Ionicons name="star" size={12} color={COLORS.warning} />
                        <Text style={styles.coverBadgeTextSmall}>Cover</Text>
                      </View>
                    )}
                    
                    {!isSelectionMode && (
                      <View style={styles.imageActions}>
                        {!image.isCover && (
                          <TouchableOpacity
                            style={styles.imageActionButton}
                            onPress={() => handleSetAsCover(image)}
                          >
                            <Ionicons name="star-outline" size={18} color="#FFF" />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={[styles.imageActionButton, styles.deleteActionButton]}
                          onPress={() => {
                            Alert.alert(
                              'Delete Photo',
                              'Remove this photo from your portfolio?',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Delete',
                                  style: 'destructive',
                                  onPress: () => handleDeleteImage(image.id, image.uri),
                                },
                              ]
                            );
                          }}
                        >
                          <Ionicons name="trash-outline" size={18} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* FAB */}
      {!isSelectionMode && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddPhoto}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* Fullscreen Preview Modal */}
      <Modal
        visible={previewImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <View style={styles.previewModalContainer}>
          <TouchableOpacity
            style={styles.previewCloseButton}
            onPress={() => setPreviewImage(null)}
          >
            <Ionicons name="close" size={32} color="#FFF" />
          </TouchableOpacity>
          {previewImage && (
            <Image
              source={{ uri: previewImage }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  headerTitle: {
    ...TYPOGRAPHY.heading.h2,
    color: COLORS.text.primary,
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
    marginTop: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    ...TYPOGRAPHY.heading.h1,
    color: COLORS.text.primary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressIndicator: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 2,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningLight,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  infoBannerText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.warning,
    flex: 1,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  selectText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.primary,
    fontWeight: '600',
  },
  coverPhotoContainer: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.background.tertiary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
  },
  coverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  coverBadgeText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.warning,
    fontSize: 11,
    fontWeight: '600',
  },
  coverBadgeTextSmall: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.warning,
    fontSize: 10,
    fontWeight: '600',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageItem: {
    width: (width - 52) / 2,
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.background.tertiary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageItemSelected: {
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  portfolioImage: {
    width: '100%',
    height: '100%',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFF',
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  imageOverlayBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  imageActions: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  imageActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteActionButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
  enhancedEmptyState: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    ...TYPOGRAPHY.heading.h2,
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  emptyStateText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.primary,
    fontWeight: '600',
  },
  tipsContainer: {
    width: '100%',
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    padding: 16,
  },
  tipsTitle: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  tipDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 6,
  },
  tipText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
    flex: 1,
  },
  bottomSpacer: {
    height: 100,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  uploadingCard: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    minWidth: 200,
  },
  uploadingText: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  progressBarContainer: {
    width: 200,
    height: 8,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  previewModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
});
