import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Button,
  Badge,
  Rating,
  Avatar,
  LoadingSpinner,
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '@mari-gunting/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Mock data - Replace with actual API call
const mockBarbershop = {
  id: '1',
  name: 'Classic Cuts Barbershop',
  description: 'Premium barbershop offering traditional and modern haircut services',
  images: [
    'https://images.unsplash.com/photo-1585747860715-2ba37e788b70',
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1',
    'https://images.unsplash.com/photo-1621605815971-fbc98d665033',
  ],
  rating: 4.8,
  totalReviews: 127,
  address: '123 Main Street, Kuala Lumpur, 50000',
  phone: '+60 12-345 6789',
  distance: 2.5,
  isOpen: true,
  openingHours: {
    monday: '09:00 - 21:00',
    tuesday: '09:00 - 21:00',
    wednesday: '09:00 - 21:00',
    thursday: '09:00 - 21:00',
    friday: '09:00 - 21:00',
    saturday: '10:00 - 22:00',
    sunday: '10:00 - 20:00',
  },
  services: [
    { id: '1', name: 'Haircut', price: 25, duration: 30 },
    { id: '2', name: 'Beard Trim', price: 15, duration: 15 },
    { id: '3', name: 'Hot Shave', price: 20, duration: 20 },
    { id: '4', name: 'Hair Coloring', price: 80, duration: 90 },
  ],
  barbers: [
    { id: '1', name: 'Ahmad Hassan', avatar: 'https://i.pravatar.cc/150?img=1', rating: 4.9, experience: '5 years' },
    { id: '2', name: 'Lee Wei', avatar: 'https://i.pravatar.cc/150?img=2', rating: 4.8, experience: '3 years' },
    { id: '3', name: 'Kumar', avatar: 'https://i.pravatar.cc/150?img=3', rating: 4.7, experience: '4 years' },
  ],
  reviews: [
    { id: '1', userName: 'John Doe', avatar: 'https://i.pravatar.cc/150?img=10', rating: 5, comment: 'Excellent service!', date: '2024-01-15' },
    { id: '2', userName: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?img=11', rating: 4, comment: 'Good haircut', date: '2024-01-14' },
  ],
};

export default function BarbershopDetailScreen() {
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<'services' | 'barbers' | 'reviews'>('services');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleBookNow = () => {
    router.push(`/barbershop/booking/${id}`);
  };

  const handleCall = () => {
    Linking.openURL(`tel:${mockBarbershop.phone}`);
  };

  const handleDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${mockBarbershop.address}`;
    Linking.openURL(url);
  };

  const renderImageGallery = () => (
    <View style={styles.imageGallery}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentImageIndex(index);
        }}
      >
        {mockBarbershop.images.map((image, index) => (
          <Image
            key={index}
            source={{ uri: image }}
            style={styles.galleryImage}
          />
        ))}
      </ScrollView>
      
      <View style={styles.imageIndicators}>
        {mockBarbershop.images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              index === currentImageIndex && styles.activeIndicator,
            ]}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.headerLeft}>
          <Text style={styles.shopName}>{mockBarbershop.name}</Text>
          <View style={styles.ratingRow}>
            <Rating
              rating={mockBarbershop.rating}
              reviewCount={mockBarbershop.totalReviews}
              size="small"
            />
            <View style={styles.distanceBadge}>
              <Ionicons name="location" size={14} color={Colors.primary} />
              <Text style={styles.distanceText}>{mockBarbershop.distance} km</Text>
            </View>
          </View>
        </View>
        <Badge
          label={mockBarbershop.isOpen ? 'Open' : 'Closed'}
          variant={mockBarbershop.isOpen ? 'success' : 'error'}
        />
      </View>

      <Text style={styles.description}>{mockBarbershop.description}</Text>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
          <Ionicons name="call" size={20} color={Colors.primary} />
          <Text style={styles.actionButtonText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleDirections}>
          <Ionicons name="navigate" size={20} color={Colors.primary} />
          <Text style={styles.actionButtonText}>Directions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-social" size={20} color={Colors.primary} />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabs}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'services' && styles.activeTab]}
        onPress={() => setActiveTab('services')}
      >
        <Text style={[styles.tabText, activeTab === 'services' && styles.activeTabText]}>
          Services
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'barbers' && styles.activeTab]}
        onPress={() => setActiveTab('barbers')}
      >
        <Text style={[styles.tabText, activeTab === 'barbers' && styles.activeTabText]}>
          Barbers
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
        onPress={() => setActiveTab('reviews')}
      >
        <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
          Reviews
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderServices = () => (
    <View style={styles.content}>
      {mockBarbershop.services.map((service) => (
        <TouchableOpacity key={service.id} style={styles.serviceCard}>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.serviceDuration}>{service.duration} min</Text>
          </View>
          <Text style={styles.servicePrice}>RM {service.price}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderBarbers = () => (
    <View style={styles.content}>
      {mockBarbershop.barbers.map((barber) => (
        <View key={barber.id} style={styles.barberCard}>
          <Avatar imageUri={barber.avatar} name={barber.name} size="large" />
          <View style={styles.barberInfo}>
            <Text style={styles.barberName}>{barber.name}</Text>
            <Text style={styles.barberExperience}>{barber.experience}</Text>
            <Rating rating={barber.rating} showNumber={false} size="small" />
          </View>
        </View>
      ))}
    </View>
  );

  const renderReviews = () => (
    <View style={styles.content}>
      {mockBarbershop.reviews.map((review) => (
        <View key={review.id} style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <Avatar imageUri={review.avatar} name={review.userName} size="small" />
            <View style={styles.reviewHeaderInfo}>
              <Text style={styles.reviewUserName}>{review.userName}</Text>
              <Text style={styles.reviewDate}>{review.date}</Text>
            </View>
            <Rating rating={review.rating} showNumber={false} size="small" />
          </View>
          <Text style={styles.reviewComment}>{review.comment}</Text>
        </View>
      ))}
      
      <TouchableOpacity style={styles.seeAllButton}>
        <Text style={styles.seeAllText}>See All Reviews</Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderImageGallery()}
        {renderHeader()}
        {renderTabs()}
        {activeTab === 'services' && renderServices()}
        {activeTab === 'barbers' && renderBarbers()}
        {activeTab === 'reviews' && renderReviews()}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Book Now"
          onPress={handleBookNow}
          fullWidth
          size="large"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
  },

  // Image Gallery
  imageGallery: {
    height: 300,
    position: 'relative',
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    height: 300,
    backgroundColor: Colors.gray[200],
  },
  imageIndicators: {
    position: 'absolute',
    bottom: Spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white + '50',
  },
  activeIndicator: {
    backgroundColor: Colors.white,
    width: 24,
  },
  backButton: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[900] + '50',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Header
  header: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  shopName: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  distanceText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
  description: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    gap: Spacing.xs,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold,
  },

  // Content
  content: {
    padding: Spacing.lg,
  },

  // Services
  serviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  serviceDuration: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  servicePrice: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },

  // Barbers
  barberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  barberInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  barberName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  barberExperience: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },

  // Reviews
  reviewCard: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  reviewHeaderInfo: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  reviewUserName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  reviewDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
  reviewComment: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    lineHeight: 22,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  seeAllText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
  },

  // Footer
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    backgroundColor: Colors.white,
    ...Shadows.lg,
  },
});
