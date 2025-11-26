import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Platform, NativeScrollEvent, NativeSyntheticEvent, Linking, Alert, Modal, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { formatCurrency, formatDistance, formatTimeRange } from '@mari-gunting/shared/utils/format';
import { SkeletonImage, SkeletonCircle, SkeletonText, SkeletonBase } from '@/components/Skeleton';
import { Colors, theme, getStatusBackground, getStatusColor } from '@mari-gunting/shared/theme';
import { useLocation } from '@/hooks/useLocation';

const { width, height } = Dimensions.get('window');

// Get current day in user's local timezone (Grab-style)
const getCurrentDay = () => {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const now = new Date();
  return days[now.getDay()]; // Use device's local timezone
};

// Check if shop is currently open based on user's local time (Grab-style)
const isShopOpenNow = (detailedHours: any) => {
  if (!detailedHours) return false;

  const now = new Date();
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const currentDay = days[now.getDay()]; // Use device's local timezone
  const dayInfo = detailedHours[currentDay];
  
  if (!dayInfo || !dayInfo.isOpen) return false;
  
  const currentHour = now.getHours(); // User's local time
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  
  // Parse opening time - database uses 'start' field
  const openTime = dayInfo.start || dayInfo.open;
  const [openHour, openMinute] = openTime.split(':').map(Number);
  const openTimeInMinutes = openHour * 60 + openMinute;
  
  // Parse closing time - database uses 'end' field
  const closeTime = dayInfo.end || dayInfo.close;
  const [closeHour, closeMinute] = closeTime.split(':').map(Number);
  const closeTimeInMinutes = closeHour * 60 + closeMinute;
  
  return currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes;
};

export default function BarbershopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewerImageIndex, setViewerImageIndex] = useState(0);
  const portfolioScrollRef = useRef<ScrollView>(null);
  const fullscreenFlatListRef = useRef<FlatList>(null);
  const { location, getCurrentLocation, hasPermission } = useLocation();

  // Get user location on mount
  useEffect(() => {
    if (hasPermission) {
      getCurrentLocation();
    }
  }, [hasPermission, getCurrentLocation]);
  
  const { data: shopResponse, isLoading } = useQuery({
    queryKey: ['barbershop', id, location?.latitude, location?.longitude],
    queryFn: () => api.getBarbershopById(id, location ? {
      lat: location.latitude,
      lng: location.longitude,
    } : undefined),
  });

  const { data: reviewsResponse } = useQuery({
    queryKey: ['barbershop-reviews', id],
    queryFn: () => api.getReviewsByBarbershopId(id),
    enabled: !!id,
  });

  const shop = shopResponse?.data;
  const reviews = reviewsResponse?.data || [];
  const currentDay = getCurrentDay();
  const isOpen = shop?.detailedHours ? isShopOpenNow(shop.detailedHours) : false;
  
  // Debug: Check if photos exist (supports multiple field names)
  const portfolioPhotos = shop?.photos || shop?.cover_images || shop?.coverImages || [];
  console.log('🖼️ Portfolio photos:', portfolioPhotos);
  console.log('🖼️ Photos length:', portfolioPhotos.length);
  console.log('🕐 Current day:', currentDay);
  console.log('🕐 Detailed hours:', shop?.detailedHours);
  console.log('🕐 Is open:', isOpen);
  if (shop?.detailedHours) {
    console.log('🕐 Today info:', shop.detailedHours[currentDay]);
  }
  
  // Handle portfolio gallery scroll
  const handlePortfolioScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const imageWidth = width - 40;
    const index = Math.round(scrollPosition / imageWidth);
    setActivePhotoIndex(index);
  };

  // Open fullscreen gallery
  const openFullscreen = (index: number) => {
    setViewerImageIndex(index);
    setShowImageViewer(true);
    // Scroll to the correct image after modal opens
    setTimeout(() => {
      fullscreenFlatListRef.current?.scrollToIndex({
        index: index,
        animated: false,
      });
    }, 100);
  };

  // Handle fullscreen viewable items change
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setViewerImageIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Barbershop</Text>
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
            <SkeletonText width="60%" height={20} style={{ marginBottom: 16 }} />
            <SkeletonBase width="100%" height={100} borderRadius={12} />
          </View>

          <View style={styles.section}>
            <SkeletonText width="60%" height={20} style={{ marginBottom: 16 }} />
            <SkeletonBase width="100%" height={100} borderRadius={12} />
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Skeleton Bottom Bar */}
        <View style={[styles.bottomBar, { paddingBottom: Platform.OS === 'android' ? insets.bottom + 16 : 32 }]}>
          <View style={styles.priceContainer}>
            <SkeletonText width={80} height={14} style={{ marginBottom: 4 }} />
            <SkeletonText width={100} height={24} />
          </View>
          <SkeletonBase width={140} height={52} borderRadius={26} />
        </View>
      </SafeAreaView>
    );
  }

  if (!shop) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Barbershop</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.gray[300]} />
          <Text style={styles.emptyText}>Barbershop not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const lowestPrice = shop.services && shop.services.length > 0 
    ? Math.min(...shop.services.map(s => s.price))
    : 0;
  
  const joinedYear = shop.createdAt ? new Date(shop.createdAt).getFullYear() : new Date().getFullYear();

  // Operating hours data
  const daysOfWeek = [
    { key: 'mon', label: 'Monday' },
    { key: 'tue', label: 'Tuesday' },
    { key: 'wed', label: 'Wednesday' },
    { key: 'thu', label: 'Thursday' },
    { key: 'fri', label: 'Friday' },
    { key: 'sat', label: 'Saturday' },
    { key: 'sun', label: 'Sunday' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Barbershop</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: shop.logo }} 
              style={styles.avatar}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
            {shop.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={22} color="#007AFF" />
              </View>
            )}
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.name} numberOfLines={2}>{shop.name}</Text>
            
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={18} color="#FBBF24" />
              <Text style={styles.ratingText}>{shop.rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({shop.reviewsCount || 0} reviews)</Text>
              <Text style={styles.bookingsCount}>• {shop.bookingsCount || 0} bookings</Text>
            </View>

            {shop.distance && (
              <View style={styles.locationRow}>
                <Ionicons name="navigate" size={16} color={Colors.primary} />
                <Text style={styles.distanceText}>{formatDistance(shop.distance)} away</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{shop.bookingsCount || 0}</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{shop.reviewsCount || 0}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{joinedYear}</Text>
            <Text style={styles.statLabel}>Joined</Text>
          </View>
        </View>

        {/* Location Section */}
        {shop.address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <Text style={styles.addressText}>
              {typeof shop.address === 'string' 
                ? shop.address 
                : `${shop.address.line1 || ''}${shop.address.line2 ? ', ' + shop.address.line2 : ''}${shop.address.city ? ', ' + shop.address.city : ''}${shop.address.state ? ', ' + shop.address.state : ''}${shop.address.postalCode ? ' ' + shop.address.postalCode : ''}`
              }
            </Text>
            <TouchableOpacity
              style={styles.directionsButton}
              onPress={async () => {
                const addressStr = typeof shop.address === 'string' 
                  ? shop.address
                  : `${shop.address.line1}, ${shop.address.city}, ${shop.address.state} ${shop.address.postalCode}`;
                
                // Use coordinates from shop.location object
                const latitude = shop.location?.latitude;
                const longitude = shop.location?.longitude;
                const hasCoords = !!(latitude && longitude);
                const coords = hasCoords ? `${latitude},${longitude}` : encodeURIComponent(addressStr);
                
                // iOS: Show choice of navigation apps
                if (Platform.OS === 'ios') {
                  const options: string[] = ['Apple Maps'];
                  const urls: string[] = [
                    hasCoords 
                      ? `maps://app?daddr=${coords}`
                      : `maps://app?daddr=${encodeURIComponent(addressStr)}`
                  ];
                  
                  // Check if Google Maps is installed
                  const googleMapsUrl = hasCoords
                    ? `comgooglemaps://?daddr=${coords}`
                    : `comgooglemaps://?daddr=${encodeURIComponent(addressStr)}`;
                  
                  try {
                    const hasGoogleMaps = await Linking.canOpenURL(googleMapsUrl);
                    if (hasGoogleMaps) {
                      options.push('Google Maps');
                      urls.push(googleMapsUrl);
                    }
                  } catch (e) {
                    console.log('Google Maps check failed:', e);
                  }
                  
                  // Check if Waze is installed
                  const wazeUrl = hasCoords
                    ? `waze://?ll=${coords}&navigate=yes`
                    : `waze://?q=${encodeURIComponent(addressStr)}&navigate=yes`;
                  
                  try {
                    const hasWaze = await Linking.canOpenURL(wazeUrl);
                    if (hasWaze) {
                      options.push('Waze');
                      urls.push(wazeUrl);
                    }
                  } catch (e) {
                    console.log('Waze check failed:', e);
                  }
                  
                  options.push('Cancel');
                  
                  // Show action sheet
                  Alert.alert(
                    'Open in Navigation App',
                    'Choose your preferred navigation app:',
                    [
                      ...options.slice(0, -1).map((option, index) => ({
                        text: option,
                        onPress: () => Linking.openURL(urls[index])
                      })),
                      { text: 'Cancel', style: 'cancel' }
                    ]
                  );
                } else {
                  // Android: Use coordinates if available
                  const candidates: string[] = [];
                  if (hasCoords) {
                    candidates.push(`google.navigation:q=${latitude},${longitude}&mode=d`);
                    candidates.push(`geo:${latitude},${longitude}`);
                    candidates.push(`geo:0,0?q=${latitude},${longitude}`);
                  } else {
                    candidates.push(`geo:0,0?q=${encodeURIComponent(addressStr)}`);
                  }

                  try {
                    let opened = false;
                    for (const candidate of candidates) {
                      const supported = await Linking.canOpenURL(candidate);
                      if (supported) {
                        await Linking.openURL(candidate);
                        opened = true;
                        break;
                      }
                    }
                    if (!opened) {
                      // Final fallback: Google Maps via browser
                      const googleMapsUrl = hasCoords
                        ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`
                        : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addressStr)}&travelmode=driving`;
                      await Linking.openURL(googleMapsUrl);
                    }
                  } catch (error) {
                    Alert.alert('Error', 'Unable to open maps application');
                  }
                }
              }}
            >
              <Ionicons name="navigate" size={18} color={Colors.primary} />
              <Text style={styles.directionsButtonText}>Get Directions</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Our Work Section - Portfolio */}
        {portfolioPhotos.length > 0 && (
          <View style={styles.section}>
            <View style={styles.portfolioHeader}>
              <Text style={styles.sectionTitle}>Our Work</Text>
              <Text style={styles.photoCount}>{portfolioPhotos.length} photo{portfolioPhotos.length !== 1 ? 's' : ''}</Text>
            </View>
            
            <ScrollView 
              ref={portfolioScrollRef}
              horizontal 
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              onScroll={handlePortfolioScroll}
              scrollEventThrottle={16}
              snapToInterval={width - 40}
              decelerationRate="fast"
            >
              {portfolioPhotos.map((photo: string, index: number) => (
                <TouchableOpacity 
                  key={index}
                  activeOpacity={0.9}
                  style={{ marginRight: 0 }}
                  onPress={() => openFullscreen(index)}
                >
                  <Image 
                    source={{ uri: photo }} 
                    style={styles.portfolioImage}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                  <View style={styles.zoomHint}>
                    <Ionicons name="expand-outline" size={20} color={Colors.white} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.photoIndicatorsContainer}>
              <View style={styles.photoIndicators}>
                {portfolioPhotos.map((_: string, index: number) => (
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
                {activePhotoIndex + 1} / {portfolioPhotos.length}
              </Text>
            </View>
          </View>
        )}

        {/* About Section */}
        {shop.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{shop.description}</Text>
          </View>
        )}

        {/* Operating Hours Section */}
        {shop.detailedHours && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Operating Hours</Text>
            <View style={styles.hoursContainer}>
              {daysOfWeek.map((day) => {
                const dayInfo = shop.detailedHours?.[day.key];
                const isToday = currentDay === day.key;
                const isDayOpen = dayInfo?.isOpen; // Does this day have operating hours?
                
                // For today's row: Check if shop is currently open RIGHT NOW (based on actual time)
                // For other days: Just check if they have operating hours
                const shouldShowGreen = isToday ? isOpen : false;
                const shouldShowRed = isToday ? !isOpen : false;

                return (
                  <View
                    key={day.key}
                    style={[
                      styles.hourRow,
                      shouldShowGreen && styles.hourRowTodayOpen,
                      shouldShowRed && styles.hourRowTodayClosed,
                    ]}
                  >
                    <View style={styles.hourDayWrapper}>
                      <Text style={[styles.hourDay, isToday && styles.hourDayToday]}>
                        {day.label}
                      </Text>
                    </View>
                    <View style={styles.hourTimeWrapper}>
                      {isDayOpen ? (
                        <Text style={[styles.hourTime, isToday && styles.hourTimeToday]}>
                          {formatTimeRange(dayInfo.start || dayInfo.open, dayInfo.end || dayInfo.close)}
                        </Text>
                      ) : (
                        <Text style={[styles.closedText, isToday && styles.closedTextToday]}>
                          Closed
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Services */}
        <View style={styles.section}>
          <View style={styles.servicesHeader}>
            <Text style={styles.sectionTitle}>Services & Pricing</Text>
            <Text style={styles.servicesSubtitle}>Select on next screen</Text>
          </View>
          {shop.services && shop.services.length > 0 ? (
            shop.services.map((service: any) => (
              <View key={service.id} style={styles.serviceInfoCard}>
                <View style={styles.serviceContent}>
                  <View style={styles.serviceHeader}>
                    <View style={styles.serviceNameContainer}>
                      <Text style={styles.serviceName}>{service.name}</Text>
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
            ))
          ) : (
            <View style={styles.emptyServicesCard}>
              <Ionicons name="cut-outline" size={32} color={Colors.gray[300]} />
              <Text style={styles.emptyServicesText}>No services available</Text>
            </View>
          )}
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
                          {shop.name.toUpperCase()} REPLIED
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
                onPress={() => router.push(`/barbershop/reviews/${id}` as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllReviewsText}>View all {reviews.length} reviews</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={[styles.bottomBar, { paddingBottom: Platform.OS === 'android' ? insets.bottom + 16 : 32 }]}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Starting from</Text>
          <Text style={styles.price}>{formatCurrency(lowestPrice)}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.bookButton,
            !isOpen && styles.bookButtonDisabled,
          ]}
          disabled={!isOpen}
          onPress={() => router.push(`/barbershop/barbers/${shop.id}` as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.bookButtonText}>
            {isOpen ? 'Book Now' : 'Closed'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Image Viewer Modal */}
      <Modal
        visible={showImageViewer}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageViewer(false)}
      >
        <View style={styles.imageViewerContainer}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowImageViewer(false)}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={32} color={Colors.white} />
          </TouchableOpacity>

          {/* Image Counter */}
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {viewerImageIndex + 1} / {portfolioPhotos.length}
            </Text>
          </View>

          {/* Scrollable Images */}
          <FlatList
            ref={fullscreenFlatListRef}
            data={portfolioPhotos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(data, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            renderItem={({ item }) => (
              <View style={styles.imageViewerSlide}>
                <Image
                  source={{ uri: item }}
                  style={styles.fullScreenImage}
                  contentFit="contain"
                  transition={200}
                  cachePolicy="memory-disk"
                />
              </View>
            )}
            initialScrollIndex={viewerImageIndex}
          />

          {/* Navigation Hint */}
          <Text style={styles.swipeHint}>Swipe to see more photos</Text>
        </View>
      </Modal>
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
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
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
  bookingsCount: {
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
    paddingHorizontal: 16,
    gap: 20,
    marginTop: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.gray[200],
  },
  section: {
    backgroundColor: Colors.white,
    padding: 20,
    marginTop: 12,
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
  portfolioImage: {
    width: width - 40,
    height: 280,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
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
  emptyServicesCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 14,
    gap: 8,
  },
  emptyServicesText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[500],
  },
  hoursContainer: {
    gap: 0,
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  hourRowTodayOpen: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: 14,
    borderRadius: 12,
    borderBottomWidth: 0,
    borderWidth: 1.5,
    borderColor: getStatusBackground("ready"),
  },
  hourRowTodayClosed: {
    backgroundColor: '#FEF2F2',
    paddingVertical: 14,
    borderRadius: 12,
    borderBottomWidth: 0,
    borderWidth: 1.5,
    borderColor: Colors.errorLight,
  },
  hourDayWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  hourDay: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.gray[700],
  },
  hourDayToday: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  hourTimeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  hourTime: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  hourTimeToday: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  closedText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#DC2626',
  },
  closedTextToday: {
    fontSize: 14,
    fontWeight: '500',
    color: '#DC2626',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
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
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  addressText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#3C3C43',
    marginBottom: 8,
  },
  distanceInfo: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 16,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  directionsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
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
    fontWeight: '600',
    color: '#8E8E93',
  },
  price: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  bookButton: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 26,
    backgroundColor: Colors.primary,
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
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  closeButton: {
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
  imageCounter: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    zIndex: 10,
  },
  imageCounterText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  imageViewerSlide: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
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
});
