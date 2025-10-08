import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';

interface PortfolioImage {
  id: string;
  uri: string;
  caption?: string;
}

export default function PortfolioManagementScreen() {
  const router = useRouter();
  const [images, setImages] = useState<PortfolioImage[]>([
    { id: '1', uri: 'https://placehold.co/400x400/png', caption: 'Classic Haircut' },
    { id: '2', uri: 'https://placehold.co/400x400/png', caption: 'Fade Cut' },
    { id: '3', uri: 'https://placehold.co/400x400/png', caption: 'Beard Trim' },
    { id: '4', uri: 'https://placehold.co/400x400/png', caption: 'Hair Coloring' },
    { id: '5', uri: 'https://placehold.co/400x400/png', caption: 'Modern Style' },
    { id: '6', uri: 'https://placehold.co/400x400/png', caption: 'Kids Haircut' },
  ]);

  const pickImage = async () => {
    // Request permissions
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'You need to allow access to your photos to add portfolio images.');
      return;
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newImage: PortfolioImage = {
        id: Date.now().toString(),
        uri: result.assets[0].uri,
      };
      setImages([newImage, ...images]);
    }
  };

  const takePhoto = async () => {
    // Request permissions
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'You need to allow camera access to take photos.');
      return;
    }

    // Take photo
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newImage: PortfolioImage = {
        id: Date.now().toString(),
        uri: result.assets[0].uri,
      };
      setImages([newImage, ...images]);
    }
  };

  const handleAddPhoto = () => {
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

  const handleDeleteImage = (id: string) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to remove this photo from your portfolio?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setImages(images.filter(img => img.id !== id));
          },
        },
      ]
    );
  };

  const handleImagePress = (image: PortfolioImage) => {
    Alert.alert(
      image.caption || 'Portfolio Image',
      'What would you like to do?',
      [
        {
          text: 'Edit Caption',
          onPress: () => {
            // In a real app, this would open a modal to edit caption
            Alert.alert('Edit Caption', 'Caption editing would open here');
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteImage(image.id),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Portfolio</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color={COLORS.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Showcase Your Best Work</Text>
            <Text style={styles.infoText}>
              Add high-quality photos of your best haircuts to attract more customers. We recommend at least 6-8 photos.
            </Text>
          </View>
        </View>

        {/* Add Photo Button */}
        <TouchableOpacity style={styles.addPhotoCard} onPress={handleAddPhoto}>
          <View style={styles.addIconContainer}>
            <Ionicons name="camera" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.addPhotoTitle}>Add New Photo</Text>
          <Text style={styles.addPhotoSubtitle}>Take a photo or choose from library</Text>
        </TouchableOpacity>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{images.length}</Text>
            <Text style={styles.statLabel}>Photos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {images.length >= 6 ? '✓' : `${6 - images.length} more`}
            </Text>
            <Text style={styles.statLabel}>Recommended</Text>
          </View>
        </View>

        {/* Image Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Portfolio ({images.length})</Text>
          
          {images.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="images-outline" size={64} color={COLORS.text.tertiary} />
              <Text style={styles.emptyStateTitle}>No Photos Yet</Text>
              <Text style={styles.emptyStateText}>
                Start building your portfolio by adding your best work
              </Text>
            </View>
          ) : (
            <View style={styles.imageGrid}>
              {images.map((image) => (
                <TouchableOpacity
                  key={image.id}
                  style={styles.imageItem}
                  onPress={() => handleImagePress(image)}
                  activeOpacity={0.7}
                >
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image" size={40} color={COLORS.text.secondary} />
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteImage(image.id)}
                  >
                    <Ionicons name="close-circle" size={24} color={COLORS.error} />
                  </TouchableOpacity>
                  {image.caption && (
                    <View style={styles.captionOverlay}>
                      <Text style={styles.captionText} numberOfLines={1}>
                        {image.caption}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Tips Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tips for Great Photos</Text>
          <View style={styles.card}>
            {[
              { icon: 'sunny-outline', text: 'Use good lighting - natural light works best' },
              { icon: 'camera-outline', text: 'Take clear, focused photos from different angles' },
              { icon: 'resize-outline', text: 'Show before and after transformations' },
              { icon: 'checkmark-circle-outline', text: 'Ensure customer consent before posting' },
            ].map((tip, index) => (
              <View key={index}>
                <View style={styles.tipRow}>
                  <Ionicons name={tip.icon as any} size={20} color={COLORS.primary} />
                  <Text style={styles.tipText}>{tip.text}</Text>
                </View>
                {index < 3 && <View style={styles.divider} />}
              </View>
            ))}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    ...TYPOGRAPHY.heading.h2,
    color: COLORS.text.primary,
  },
  headerRight: {
    width: 32,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 16,
    margin: 20,
    marginBottom: 16,
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  addPhotoCard: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  addIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  addPhotoTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  addPhotoSubtitle: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border.light,
  },
  statValue: {
    ...TYPOGRAPHY.heading.h2,
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageItem: {
    width: '31.5%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: COLORS.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 6,
  },
  captionText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.inverse,
    fontSize: 10,
  },
  emptyState: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    padding: 48,
    alignItems: 'center',
  },
  emptyStateTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    padding: 16,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  tipText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border.light,
  },
  bottomSpacer: {
    height: 40,
  },
});
