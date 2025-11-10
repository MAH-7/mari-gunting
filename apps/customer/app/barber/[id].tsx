import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Platform, Modal, NativeScrollEvent, NativeSyntheticEvent, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { formatCurrency, formatDistance } from '@mari-gunting/shared/utils/format';
import { SkeletonCircle, SkeletonText, SkeletonBase, SkeletonImage } from '@/components/Skeleton';
import { supabase } from '@mari-gunting/shared/config/supabase';
import { useBarberOffline } from '@/contexts/BarberOfflineContext';
import { Colors, theme } from '@mari-gunting/shared/theme';

const { width } = Dimensions.get('window');

export default function BarberProfileScreen() {
  const { id, distance } = useLocalSearchParams<{ id: string; distance?: string }>();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({});
  const galleryScrollRef = useRef<ScrollView>(null);
  const fullscreenFlatListRef = useRef<FlatList>(null);
  const [previousBarberState, setPreviousBarberState] = useState<{
    isOnline: boolean;
    isAvailable: boolean;
  } | null>(null);
  const { showBarberOfflineModal } = useBarberOffline();
  
  const { data: barberResponse, isLoading, refetch } = useQuery({
    queryKey: ['barber', id],
    queryFn: () => api.getBarberById(id),
  });

  // Real-time subscription to monitor if this specific barber goes offline
  useEffect(() => {
    if (!id || !barberResponse?.data) return;

    const barber = barberResponse.data;
    const barberId = id; // This is the barber's ID (from barbers table)
    
    console.log('🔌 Setting up barber real-time subscriptions');
    console.log('Barber ID:', barberId);
    console.log('Barber name:', barber.name);
    console.log('Current isOnline:', barber.isOnline);
    console.log('Current isAvailable:', barber.isAvailable);

    // Create a single channel for both subscriptions
    const channel = supabase
      .channel(`barber-status-${barberId}`);

    // Subscribe to barbers table changes (is_available)
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'barbers',
        filter: `id=eq.${barberId}`,
      },
      (payload) => {
        console.log('🔔 Barber table UPDATE received:', payload);
        const newData = payload.new as any;
        
        console.log('New is_available:', newData?.is_available);
        
        // Refetch to update UI with latest data
        console.log('🔄 Refetching barber profile...');
        refetch();
      }
    );

    // Also subscribe to profiles table changes (is_online)
    // We need to get updates when the profile's online status changes
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${barberId}`,
      },
      (payload) => {
        console.log('🔔 Profile table UPDATE received:', payload);
        const newData = payload.new as any;
        
        console.log('Profile updated - is_online:', newData?.is_online);
        
        // Refetch to get latest barber data (which includes profile)
        console.log('🔄 Refetching barber profile...');
        refetch();
      }
    );

    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log('📡 Barber status channel:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to barber status updates');
      }
    });

    return () => {
      console.log('🔌 Cleaning up barber status subscriptions');
      supabase.removeChannel(channel);
    };
  }, [id, barberResponse?.data, refetch]);

  const { data: reviewsResponse } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => api.getReviewsByBarberId(id),
    enabled: !!id,
  });

  const barber = barberResponse?.data;
  const reviews = reviewsResponse?.data || [];
  
  // Preload images for better performance
  useEffect(() => {
    if (barber?.photos && barber.photos.length > 0) {
      // Preload portfolio images
      Image.prefetch(barber.photos);
    }
    if (barber?.avatar) {
      // Preload avatar
      Image.prefetch(barber.avatar);
    }
  }, [barber?.photos, barber?.avatar]);
  
  // Handle gallery scroll
  const handleGalleryScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const imageWidth = width - 40; // Account for section padding (20px each side)
    const index = Math.round(scrollPosition / imageWidth);
    setActivePhotoIndex(index);
  };
  
  // Open fullscreen gallery
  const openFullscreen = (index: number) => {
    setFullscreenIndex(index);
    setFullscreenImage(photos[index]);
    // Scroll to the correct image after modal opens
    setTimeout(() => {
      fullscreenFlatListRef.current?.scrollToIndex({
        index: index,
        animated: false,
      });
    }, 100);
  };
  
  // Close fullscreen
  const closeFullscreen = () => {
    setFullscreenImage(null);
  };
  
  // Handle fullscreen viewable items change
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setFullscreenIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // Track when barber goes offline and show alert
  useEffect(() => {
    if (!barber) return;

    const currentState = {
      isOnline: barber.isOnline,
      isAvailable: barber.isAvailable,
    };

    // Check if barber went offline (was available, now not)
    if (previousBarberState) {
      const wasAvailable = previousBarberState.isOnline && previousBarberState.isAvailable;
      const isNowAvailable = currentState.isOnline && currentState.isAvailable;

      if (wasAvailable && !isNowAvailable) {
        console.log('⚠️ Barber became unavailable!');
        showBarberOfflineModal(barber.name);
      }
    }

    // Update previous state
    setPreviousBarberState(currentState);
  }, [barber?.isOnline, barber?.isAvailable, barber?.name]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Barber Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Skeleton Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <SkeletonCircle size={100} />
            </View>
            <View style={styles.profileInfo}>
              <SkeletonText width="60%" height={24} style={{ marginBottom: 8 }} />
              <SkeletonText width="40%" height={16} style={{ marginBottom: 6 }} />
              <SkeletonText width="35%" height={14} />
            </View>
          </View>

          {/* Skeleton Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <SkeletonText width={60} height={28} style={{ marginBottom: 6 }} />
              <SkeletonText width={70} height={14} />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <SkeletonText width={60} height={28} style={{ marginBottom: 6 }} />
              <SkeletonText width={70} height={14} />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <SkeletonText width={60} height={28} style={{ marginBottom: 6 }} />
              <SkeletonText width={70} height={14} />
            </View>
          </View>

          {/* Skeleton Sections */}
          <View style={styles.section}>
            <SkeletonText width="30%" height={20} style={{ marginBottom: 12 }} />
            <SkeletonText width="100%" height={16} lines={3} spacing={8} />
          </View>

          <View style={styles.section}>
            <SkeletonText width="40%" height={20} style={{ marginBottom: 12 }} />
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <SkeletonBase width={100} height={32} borderRadius={16} />
              <SkeletonBase width={90} height={32} borderRadius={16} />
              <SkeletonBase width={110} height={32} borderRadius={16} />
            </View>
          </View>

          <View style={styles.section}>
            <SkeletonText width="30%" height={20} style={{ marginBottom: 12 }} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <SkeletonImage width={200} height={150} borderRadius={12} />
              <SkeletonImage width={200} height={150} borderRadius={12} />
            </View>
          </View>

          <View style={styles.section}>
            <SkeletonText width="50%" height={20} style={{ marginBottom: 16 }} />
            <View style={{ gap: 12 }}>
              <SkeletonBase width="100%" height={80} borderRadius={12} />
              <SkeletonBase width="100%" height={80} borderRadius={12} />
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Skeleton Bottom Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarContent}>
            <View style={styles.priceInfo}>
              <SkeletonText width={80} height={14} style={{ marginBottom: 4 }} />
              <SkeletonText width={100} height={24} />
            </View>
            <SkeletonBase width={140} height={52} borderRadius={26} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!barber) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Barber Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.gray[300]} />
          <Text style={styles.emptyText}>Barber not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const photos = barber.photos || [];
  const joinedYear = new Date(barber.joinedDate).getFullYear();
  
  // Calculate the lowest price from all services
  const lowestPrice = barber.services.length > 0 
    ? Math.min(...barber.services.map(s => s.price))
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Barber Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: barber.avatar }} 
              style={styles.avatar}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
            {barber.isOnline && <View style={styles.onlineBadge} />}
          </View>
          
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={2}>{barber.name}</Text>
              {barber.isVerified && (
                <Ionicons name="checkmark-circle" size={22} color="#007AFF" />
              )}
            </View>
            
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={18} color="#FBBF24" />
              <Text style={styles.ratingText}>{barber.rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({barber.totalReviews} reviews)</Text>
              <Text style={styles.jobsCount}>• {barber.completedJobs} jobs</Text>
            </View>

            {(barber.distance || distance) && (
              <View style={styles.locationRow}>
                <Ionicons name="navigate" size={16} color={Colors.primary} />
                <Text style={styles.distanceText}>{formatDistance(barber.distance || parseFloat(distance || '0'))} away</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{barber.completedJobs}</Text>
            <Text style={styles.statLabel}>Jobs Done</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{barber.totalReviews}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{joinedYear}</Text>
            <Text style={styles.statLabel}>Member Since</Text>
          </View>
        </View>

        {/* About */}
        {barber.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{barber.bio}</Text>
          </View>
        )}

        {/* Specializations */}
        {barber.specializations && barber.specializations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specializations</Text>
            <View style={styles.tagsContainer}>
              {barber.specializations.map((spec: string, index: number) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{spec}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Photo Gallery */}
        {photos.length > 0 && (
          <View style={styles.section}>
            <View style={styles.portfolioHeader}>
              <Text style={styles.sectionTitle}>Portfolio</Text>
              <Text style={styles.photoCount}>{photos.length} photo{photos.length !== 1 ? 's' : ''}</Text>
            </View>
            <ScrollView 
              ref={galleryScrollRef}
              horizontal 
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              onScroll={handleGalleryScroll}
              scrollEventThrottle={16}
              snapToInterval={width - 40}
              decelerationRate="fast"
              contentContainerStyle={{ paddingRight: 0 }}
            >
              {photos.map((photo: string, index: number) => (
                <TouchableOpacity 
                  key={index}
                  activeOpacity={0.9}
                  onPress={() => openFullscreen(index)}
                  style={{ marginRight: index < photos.length - 1 ? 0 : 0 }}
                >
                  <Image 
                    source={{ uri: photo }} 
                    style={styles.galleryImage}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                    onLoadStart={() => setImageLoading(prev => ({ ...prev, [index]: true }))}
                    onLoad={() => setImageLoading(prev => ({ ...prev, [index]: false }))}
                  />
                  {imageLoading[index] && (
                    <View style={styles.imageLoadingOverlay}>
                      <ActivityIndicator size="small" color={Colors.primary} />
                    </View>
                  )}
                  <View style={styles.zoomHint}>
                    <Ionicons name="expand-outline" size={20} color={Colors.white} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.photoIndicatorsContainer}>
              <View style={styles.photoIndicators}>
                {photos.map((_: string, index: number) => (
                  <View 
                    key={index} 
                    style={[
                      styles.indicator,
                      activePhotoIndex === index && styles.indicatorActive
                    ]} 
                  />
                ))}
              </View>
              <Text style={styles.photoCounter}>
                {activePhotoIndex + 1} / {photos.length}
              </Text>
            </View>
          </View>
        )}

        {/* Services */}
        <View style={styles.section}>
          <View style={styles.servicesHeader}>
            <Text style={styles.sectionTitle}>Services & Pricing</Text>
            <Text style={styles.servicesSubtitle}>Select on next screen</Text>
          </View>
          {barber.services.map((service: any) => (
            <View key={service.id} style={styles.serviceInfoCard}>
              <View style={styles.serviceContent}>
                <View style={styles.serviceHeader}>
                  <View style={styles.serviceNameContainer}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    {service.is_popular && (
                      <View style={styles.popularBadge}>
                        <Ionicons name="flame" size={12} color="#FF6B35" />
                        <Text style={styles.popularBadgeText}>Popular</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.servicePrice}>{formatCurrency(service.price)}</Text>
                </View>
                {service.description && (
                  <Text style={styles.serviceDescription}>{service.description}</Text>
                )}
                <View style={styles.serviceMeta}>
                  <Ionicons name="time-outline" size={14} color="#8E8E93" />
                  <Text style={styles.serviceTime}>{service.duration} min</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Reviews */}
        {reviews.length > 0 && (
          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Customer Reviews</Text>
              <Text style={styles.reviewsCount}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</Text>
            </View>
            {reviews.slice(0, 3).map((review: any) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewCardHeader}>
                  <View style={styles.customerInfo}>
                    <View style={styles.reviewAvatar}>
                      {review.customerAvatar ? (
                        <Image 
                          source={{ uri: review.customerAvatar }} 
                          style={styles.reviewAvatarImage}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                        />
                      ) : (
                        <Text style={styles.reviewAvatarText}>
                          {(review.customerName || 'A').substring(0, 2).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={styles.reviewCustomerDetails}>
                      <Text style={styles.reviewerName} numberOfLines={1} ellipsizeMode="tail">
                        {review.customerName || 'Anonymous'}
                      </Text>
                      {review.services && review.services.length > 0 && (
                        <View style={styles.reviewServices}>
                          <Ionicons name="cut" size={12} color={Colors.primary} />
                          <Text style={styles.reviewServicesText}>
                            {review.services.map((s: any) => s.name).join(', ')}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString('en-MY', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.reviewRatingBadge,
                    review.rating >= 4 && styles.ratingGood,
                    review.rating === 3 && styles.ratingNeutral,
                    review.rating <= 2 && styles.ratingPoor,
                  ]}>
                    <Ionicons 
                      name="star" 
                      size={12} 
                      color={review.rating >= 4 ? '#00C853' : review.rating === 3 ? '#FFB800' : '#FF3B30'} 
                    />
                    <Text style={styles.reviewRatingText}>{review.rating.toFixed(1)}</Text>
                  </View>
                </View>
                {review.comment && (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                )}
                {review.response && (
                  <View style={styles.responseContainer}>
                    <View style={styles.responseBadge}>
                      <View style={styles.responseBadgeLeft}>
                        <Ionicons name="checkmark-circle" size={12} color="#00C853" />
                        <Text style={styles.responseBadgeText} numberOfLines={1} ellipsizeMode="tail">
                          {barber.name.toUpperCase()} REPLIED
                        </Text>
                      </View>
                      <Text style={styles.responseDate}>
                        {new Date(review.response.date).toLocaleDateString('en-MY', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </Text>
                    </View>
                    <Text style={styles.responseContent}>{review.response.text}</Text>
                  </View>
                )}
              </View>
            ))}
            {reviews.length > 3 && (
              <TouchableOpacity 
                style={styles.viewAllReviews}
                onPress={() => router.push(`/barber/reviews/${id}` as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllReviewsText}>View all {reviews.length} reviews</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}


        {/* Bottom padding for fixed button */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Fullscreen Gallery Modal */}
      <Modal
        visible={fullscreenImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={closeFullscreen}
      >
        <View style={styles.fullscreenContainer}>
          {/* Close Button */}
          <TouchableOpacity 
            style={styles.fullscreenCloseButton}
            onPress={closeFullscreen}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={32} color={Colors.white} />
          </TouchableOpacity>
          
          {/* Photo Counter */}
          <View style={styles.fullscreenCounter}>
            <Text style={styles.fullscreenCounterText}>
              {fullscreenIndex + 1} / {photos.length}
            </Text>
          </View>
          
          {/* Image Gallery */}
          <FlatList
            ref={fullscreenFlatListRef}
            data={photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.fullscreenImageContainer}>
                <Image
                  source={{ uri: item }}
                  style={styles.fullscreenImage}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                  transition={200}
                />
              </View>
            )}
            getItemLayout={(data, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            initialScrollIndex={fullscreenIndex}
          />
          
          {/* Navigation Hint */}
          <Text style={styles.swipeHint}>Swipe to see more photos</Text>
        </View>
      </Modal>

      {/* Fixed Bottom Book Button */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Starting from</Text>
          <Text style={styles.price}>{formatCurrency(lowestPrice)}</Text>
        </View>
        <TouchableOpacity 
          style={[
            styles.bookButton,
            (!barber.isOnline || !barber.isAvailable) && styles.bookButtonDisabled
          ]}
          onPress={() => {
            const isAvailable = barber.isOnline && barber.isAvailable;
            if (isAvailable) {
              router.push(`/booking/create?barberId=${barber.id}` as any);
            }
          }}
          activeOpacity={0.8}
          disabled={!barber.isOnline || !barber.isAvailable}
        >
          <Text style={styles.bookButtonText}>
            {!barber.isOnline || !barber.isAvailable ? 'Offline' : 'Book Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.4,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  profileHeader: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: Colors.white,
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E5EA',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.5,
    flexShrink: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  reviewCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  jobsCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingVertical: 20,
    marginTop: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
  },
  section: {
    backgroundColor: Colors.white,
    padding: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
    letterSpacing: -0.4,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#3C3C43',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F9731620',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  portfolioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  photoCount: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  galleryImage: {
    width: width - 40,
    height: 280,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 16,
  },
  zoomHint: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoIndicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 8,
  },
  photoIndicators: {
    flexDirection: 'row',
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gray[300],
  },
  indicatorActive: {
    backgroundColor: Colors.primary,
    width: 20,
  },
  photoCounter: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  // Fullscreen Gallery
  fullscreenContainer: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  fullscreenCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  fullscreenCounter: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    zIndex: 10,
  },
  fullscreenCounterText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  fullscreenImageContainer: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: width,
    height: '100%',
  },
  swipeHint: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 60 : 40,
    alignSelf: 'center',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  servicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  servicesSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
  },
  serviceInfoCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 16,
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  serviceCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  serviceCardSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  serviceCardInner: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  serviceContent: {
    flex: 1,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceNameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#FFF4ED',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B3520',
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6B35',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  servicePrice: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primary,
  },
  serviceDescription: {
    fontSize: 14,
    color: Colors.gray[500],
    marginBottom: 8,
    lineHeight: 20,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceTime: {
    fontSize: 13,
    color: '#8E8E93',
  },
  serviceAreaCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
  },
  serviceAreaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  serviceAreaInfo: {
    flex: 1,
  },
  serviceAreaLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 4,
  },
  serviceAreaValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  serviceAreaDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 16,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
  },
  privacyNoteText: {
    flex: 1,
    fontSize: 12,
    color: Colors.gray[500],
    lineHeight: 16,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewsCount: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  reviewCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  reviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  reviewAvatarImage: {
    width: 40,
    height: 40,
  },
  reviewAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  reviewCustomerDetails: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  reviewServices: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    marginBottom: 2,
  },
  reviewServicesText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  reviewRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingGood: {
    backgroundColor: '#E8F5E9',
  },
  ratingNeutral: {
    backgroundColor: '#FFF8E1',
  },
  ratingPoor: {
    backgroundColor: '#FFEBEE',
  },
  reviewRatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  reviewComment: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  responseContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  responseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  responseBadgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginRight: 8,
  },
  responseBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00C853',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  responseDate: {
    fontSize: 11,
    color: '#999',
  },
  responseContent: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  viewAllReviews: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
  },
  viewAllReviewsText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    height: Platform.OS === 'ios' ? 95 : 75,
    backgroundColor: Colors.white,
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  priceContainer: {
    gap: 2,
  },
  priceLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  bookButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bookButtonDisabled: {
    backgroundColor: Colors.gray[300],
    shadowOpacity: 0,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.2,
  },
});
