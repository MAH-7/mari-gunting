import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Dimensions, ActivityIndicator, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { formatCurrency, formatDistance, formatTimeRange } from '@mari-gunting/shared/utils/format';
import { SkeletonImage, SkeletonCircle, SkeletonText, SkeletonBase } from '@/components/Skeleton';

const { width, height } = Dimensions.get('window');

// Get current day in user's local timezone (Grab-style)
const getCurrentDay = () => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const now = new Date();
  return days[now.getDay()]; // Use device's local timezone
};

// Check if shop is currently open based on user's local time (Grab-style)
const isShopOpenNow = (detailedHours: any) => {
  if (!detailedHours) return false;

  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = days[now.getDay()]; // Use device's local timezone
  const dayInfo = detailedHours[currentDay];
  
  if (!dayInfo || !dayInfo.isOpen) return false;
  
  const currentHour = now.getHours(); // User's local time
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  
  // Parse opening time
  const [openHour, openMinute] = dayInfo.open.split(':').map(Number);
  const openTimeInMinutes = openHour * 60 + openMinute;
  
  // Parse closing time
  const [closeHour, closeMinute] = dayInfo.close.split(':').map(Number);
  const closeTimeInMinutes = closeHour * 60 + closeMinute;
  
  return currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes;
};

export default function BarbershopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [imageHeight] = useState(280);
  
  const { data: shopResponse, isLoading } = useQuery({
    queryKey: ['barbershop', id],
    queryFn: () => api.getBarbershopById(id),
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

  // Header opacity animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, imageHeight - 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Image scale animation
  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.3, 1],
    extrapolate: 'clamp',
  });

  const imageTranslateY = scrollY.interpolate({
    inputRange: [0, imageHeight],
    outputRange: [0, -imageHeight / 2],
    extrapolate: 'clamp',
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        {/* Skeleton Hero Image */}
        <View style={[styles.heroImageContainer, { height: imageHeight }]}>
          <SkeletonImage width="100%" height={imageHeight} borderRadius={0} />
          <View style={styles.heroImageOverlay} />
        </View>

        {/* Fixed Header Buttons */}
        <SafeAreaView edges={['top']} style={styles.fixedHeaderButtons}>
          <View style={styles.fixedHeaderContent}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <View style={styles.iconButton}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <View style={styles.iconButton}>
                <Ionicons name="share-outline" size={22} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={{ height: imageHeight - 40 }} />

          {/* Skeleton Shop Info Card */}
          <View style={styles.shopInfoCard}>
            <View style={styles.shopInfoHeader}>
              <SkeletonCircle size={64} />
              <View style={styles.shopInfoMain}>
                <SkeletonText width="70%" height={24} />
                <SkeletonText width="50%" height={16} style={{ marginTop: 8 }} />
              </View>
            </View>

            {/* Skeleton Quick Stats */}
            <View style={styles.quickStats}>
              <View style={styles.statItem}>
                <SkeletonCircle size={44} />
                <SkeletonText width={40} height={20} style={{ marginTop: 6 }} />
                <SkeletonText width={50} height={14} style={{ marginTop: 4 }} />
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <SkeletonCircle size={44} />
                <SkeletonText width={40} height={20} style={{ marginTop: 6 }} />
                <SkeletonText width={50} height={14} style={{ marginTop: 4 }} />
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <SkeletonCircle size={44} />
                <SkeletonText width={40} height={20} style={{ marginTop: 6 }} />
                <SkeletonText width={50} height={14} style={{ marginTop: 4 }} />
              </View>
            </View>

            {/* Skeleton Address */}
            <View style={styles.addressCard}>
              <SkeletonCircle size={40} />
              <View style={styles.addressContent}>
                <SkeletonText width={60} height={12} style={{ marginBottom: 6 }} />
                <SkeletonText width="100%" height={16} />
              </View>
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
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarContent}>
            <View style={styles.priceWrapper}>
              <SkeletonText width={80} height={14} style={{ marginBottom: 4 }} />
              <SkeletonText width={100} height={24} />
            </View>
            <SkeletonBase width={140} height={52} borderRadius={24} />
          </View>
        </View>
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.loadingHeaderButtons}>
          <View style={styles.fixedHeaderContent}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <View style={styles.iconButton}>
                <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
              </View>
            </TouchableOpacity>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>Barbershop not found</Text>
        </View>
      </View>
    );
  }

  const lowestPrice = shop.services.length > 0 
    ? Math.min(...shop.services.map(s => s.price))
    : 0;

  // Operating hours data
  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  return (
    <View style={styles.container}>
      {/* Hero Image Banner */}
      <Animated.View style={[styles.heroImageContainer, { height: imageHeight }]}>
        <Animated.Image
          source={{ uri: shop.image }}
          style={[
            styles.heroImage,
            {
              transform: [
                { scale: imageScale },
                { translateY: imageTranslateY },
              ],
            },
          ]}
        />
        <View style={styles.heroImageOverlay} />
      </Animated.View>

      {/* Animated Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <View style={styles.headerButton}>
              <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitleAnimated} numberOfLines={1}>{shop.name}</Text>
          <TouchableOpacity 
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <View style={styles.headerButton}>
              <Ionicons name="share-outline" size={22} color="#1C1C1E" />
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Fixed Header Buttons (Over Image) */}
      <SafeAreaView edges={['top']} style={styles.fixedHeaderButtons}>
        <View style={styles.fixedHeaderContent}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <View style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <View style={styles.iconButton}>
              <Ionicons name="share-outline" size={22} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        <View style={{ height: imageHeight - 40 }} />

        {/* Shop Info Card */}
        <View style={styles.shopInfoCard}>
          <View style={styles.shopInfoHeader}>
            <View style={styles.logoWrapper}>
              <Image source={{ uri: shop.logo }} style={styles.shopLogo} />
              {shop.isVerified && (
                <View style={styles.logoVerifiedBadge}>
                  <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
                </View>
              )}
            </View>
            <View style={styles.shopInfoMain}>
              <Text style={styles.shopName}>{shop.name}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color="#FBBF24" />
                <Text style={styles.ratingText}>{shop.rating.toFixed(1)}</Text>
                <Text style={styles.ratingCount}>({shop.reviewsCount} reviews)</Text>
                {shop.distance && (
                  <>
                    <View style={styles.ratingDot} />
                    <Ionicons name="navigate" size={14} color="#00B14F" />
                    <Text style={styles.distanceText}>{formatDistance(shop.distance)}</Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <View style={styles.statIconWrapper}>
                <Ionicons name="people" size={20} color="#00B14F" />
              </View>
              <Text style={styles.statValue}>{shop.bookingsCount}+</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIconWrapper}>
                <Ionicons name="star" size={20} color="#FBBF24" />
              </View>
              <Text style={styles.statValue}>{shop.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIconWrapper}>
                <Ionicons name="chatbox" size={20} color="#3B82F6" />
              </View>
              <Text style={styles.statValue}>{shop.reviewsCount}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>

          {/* Address */}
          <TouchableOpacity style={styles.addressCard} activeOpacity={0.7}>
            <View style={styles.addressIconWrapper}>
              <Ionicons name="location" size={20} color="#00B14F" />
            </View>
            <View style={styles.addressContent}>
              <Text style={styles.addressLabel}>Location</Text>
              <Text style={styles.addressText} numberOfLines={2}>{shop.address}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Operating Hours Section */}
        {shop.detailedHours && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="time-outline" size={22} color="#111827" />
                <Text style={styles.sectionTitle}>Operating Hours</Text>
              </View>
              {/* Dynamic Open/Closed Status Badge */}
              <View style={[styles.currentStatusBadge, isOpen ? styles.currentStatusBadgeOpen : styles.currentStatusBadgeClosed]}>
                {isOpen && <View style={styles.currentStatusDot} />}
                <Text style={[styles.currentStatusText, !isOpen && styles.currentStatusTextClosed]}>
                  {isOpen ? 'Open Now' : 'Closed'}
                </Text>
              </View>
            </View>
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
                      {isToday ? (
                        <View style={[styles.todayIndicator, shouldShowRed && styles.todayIndicatorClosed]} />
                      ) : (
                        <View style={styles.todayIndicatorPlaceholder} />
                      )}
                      <Text style={[styles.hourDay, isToday && styles.hourDayToday]}>
                        {day.label}
                      </Text>
                    </View>
                    <View style={styles.hourTimeWrapper}>
                      {isDayOpen ? (
                        <Text style={[styles.hourTime, isToday && styles.hourTimeToday]}>
                          {formatTimeRange(dayInfo.open, dayInfo.close)}
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

        {/* Services Section - View Only */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="cut-outline" size={22} color="#111827" />
              <Text style={styles.sectionTitle}>Services Available</Text>
            </View>
            <View style={styles.servicesBadge}>
              <Text style={styles.servicesBadgeText}>{shop.services.length}</Text>
            </View>
          </View>
          
          <View style={styles.servicesNote}>
            <View style={styles.servicesNoteIcon}>
              <Ionicons name="information-circle" size={16} color="#00B14F" />
            </View>
            <Text style={styles.servicesNoteText}>
              Choose your preferred service when booking
            </Text>
          </View>

          <View style={styles.servicesGrid}>
            {shop.services.map((service: any, index: number) => (
              <View
                key={service.id}
                style={[
                  styles.serviceCard,
                  index === shop.services.length - 1 && styles.serviceCardLast,
                ]}
              >
                <View style={styles.serviceIconBg}>
                  <Ionicons name="cut" size={20} color="#00B14F" />
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <View style={styles.serviceDetails}>
                    <View style={styles.servicePrice}>
                      <Text style={styles.servicePriceText}>{formatCurrency(service.price)}</Text>
                    </View>
                    <View style={styles.serviceDuration}>
                      <Ionicons name="time-outline" size={12} color="#6B7280" />
                      <Text style={styles.serviceDurationText}>{service.duration} min</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Reviews Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="star" size={22} color="#FBBF24" />
              <Text style={styles.sectionTitle}>Customer Reviews</Text>
            </View>
            {reviews.length > 0 && (
              <TouchableOpacity 
                style={styles.seeAllButton}
                activeOpacity={0.6}
                onPress={() => router.push(`/barbershop/reviews/${id}` as any)}
              >
                <Text style={styles.seeAllText}>See all</Text>
                <Ionicons name="chevron-forward" size={16} color="#00B14F" />
              </TouchableOpacity>
            )}
          </View>

          {/* Rating Overview */}
          <View style={styles.ratingOverview}>
            <View style={styles.ratingOverviewLeft}>
              <View style={styles.ratingScoreWrapper}>
                <Text style={styles.ratingScore}>{shop.rating.toFixed(1)}</Text>
                <Ionicons name="star" size={28} color="#FBBF24" />
              </View>
              <View style={styles.ratingStars}>
                {[...Array(5)].map((_, i) => (
                  <Ionicons
                    key={i}
                    name={i < Math.floor(shop.rating) ? 'star' : 'star-outline'}
                    size={18}
                    color="#FBBF24"
                  />
                ))}
              </View>
              <Text style={styles.ratingOverviewCount}>Based on {shop.reviewsCount} reviews</Text>
            </View>
            <View style={styles.ratingOverviewBars}>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter((r: any) => r.rating === star).length;
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <View key={star} style={styles.ratingBarRow}>
                    <Text style={styles.ratingBarStar}>{star}</Text>
                    <Ionicons name="star" size={10} color="#FBBF24" />
                    <View style={styles.ratingBarTrack}>
                      <View style={[styles.ratingBarFill, { width: `${percentage}%` }]} />
                    </View>
                    <Text style={styles.ratingBarCount}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Recent Reviews */}
          {reviews.length > 0 ? (
            <View style={styles.reviewsList}>
              {reviews.slice(0, 3).map((review: any, index: number) => (
                <View
                  key={review.id}
                  style={[
                    styles.reviewCard,
                    index === Math.min(reviews.length, 3) - 1 && styles.reviewCardLast,
                  ]}
                >
                  <View style={styles.reviewHeader}>
                    <Image
                      source={{ uri: review.customerAvatar || 'https://via.placeholder.com/44' }}
                      style={styles.reviewAvatar}
                    />
                    <View style={styles.reviewInfo}>
                      <Text style={styles.reviewName}>{review.customerName || 'Anonymous'}</Text>
                      <View style={styles.reviewMeta}>
                        <View style={styles.reviewStars}>
                          {[...Array(5)].map((_, i) => (
                            <Ionicons
                              key={i}
                              name={i < review.rating ? 'star' : 'star-outline'}
                              size={12}
                              color={i < review.rating ? '#FBBF24' : '#E5E7EB'}
                            />
                          ))}
                        </View>
                        <View style={styles.reviewDot} />
                        <Text style={styles.reviewDate}>
                          {new Date(review.createdAt).toLocaleDateString('en-MY', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="checkmark-circle" size={18} color="#00B14F" />
                  </View>
                  {review.comment && (
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  )}
                </View>
              ))}

              {reviews.length > 3 && (
                <TouchableOpacity 
                  style={styles.viewAllReviewsButton}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/barbershop/reviews/${id}` as any)}
                >
                  <Text style={styles.viewAllReviewsText}>
                    View all {shop.reviewsCount} reviews
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="#00B14F" />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.noReviews}>
              <View style={styles.noReviewsIcon}>
                <Ionicons name="chatbubbles-outline" size={40} color="#D1D5DB" />
              </View>
              <Text style={styles.noReviewsText}>No reviews yet</Text>
              <Text style={styles.noReviewsSubtext}>
                Complete a booking to leave the first review
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
          <View style={styles.priceWrapper}>
            <Text style={styles.priceLabel}>Starting from</Text>
            <Text style={styles.priceValue}>{formatCurrency(lowestPrice)}</Text>
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
            {isOpen && <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  heroImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  currentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
  },
  currentStatusBadgeOpen: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  currentStatusBadgeClosed: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  currentStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00B14F',
  },
  currentStatusText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00B14F',
  },
  currentStatusTextClosed: {
    color: '#DC2626',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    paddingBottom: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleAnimated: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  fixedHeaderButtons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99,
  },
  loadingHeaderButtons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99,
    backgroundColor: 'transparent',
  },
  fixedHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  scrollView: {
    flex: 1,
  },
  shopInfoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  shopInfoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  logoWrapper: {
    position: 'relative',
  },
  shopLogo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  logoVerifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  shopInfoMain: {
    flex: 1,
    gap: 6,
  },
  shopName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  ratingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  ratingCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  ratingDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00B14F',
  },
  quickStats: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addressIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressContent: {
    flex: 1,
    gap: 2,
  },
  addressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  servicesBadge: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D1FAE5',
  },
  servicesBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#00B14F',
  },
  servicesNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  servicesNoteIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servicesNoteText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
    lineHeight: 18,
  },
  servicesGrid: {
    gap: 10,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  serviceCardLast: {
    marginBottom: 0,
  },
  serviceIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  serviceInfo: {
    flex: 1,
    gap: 6,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  servicePrice: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#00B14F',
  },
  servicePriceText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#00B14F',
  },
  serviceDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceDurationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
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
    borderBottomColor: '#F3F4F6',
  },
  hourRowTodayOpen: {
    backgroundColor: '#F0FDF4',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginTop: -1,
    marginBottom: -1,
    borderRadius: 12,
    borderBottomWidth: 0,
    borderWidth: 1.5,
    borderColor: '#D1FAE5',
  },
  hourRowTodayClosed: {
    backgroundColor: '#FEF2F2',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginTop: -1,
    marginBottom: -1,
    borderRadius: 12,
    borderBottomWidth: 0,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
  },
  hourDayWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  todayIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00B14F',
  },
  todayIndicatorClosed: {
    backgroundColor: '#DC2626',
  },
  todayIndicatorPlaceholder: {
    width: 4,
    height: 4,
  },
  hourDay: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  hourDayToday: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  hourTimeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  hourTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  hourTimeToday: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  closedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  closedTextToday: {
    fontSize: 15,
    fontWeight: '800',
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
    color: '#00B14F',
  },
  ratingOverview: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    marginBottom: 20,
    gap: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  ratingOverviewLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingRight: 20,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  ratingScoreWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingScore: {
    fontSize: 48,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -1,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 4,
  },
  ratingOverviewCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  ratingOverviewBars: {
    flex: 1,
    gap: 8,
    justifyContent: 'center',
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingBarStar: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    width: 10,
  },
  ratingBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: '#FBBF24',
    borderRadius: 3,
  },
  ratingBarCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    width: 24,
    textAlign: 'right',
  },
  reviewsList: {
    gap: 0,
  },
  reviewCard: {
    paddingTop: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  reviewCardLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  reviewHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  reviewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  reviewInfo: {
    flex: 1,
    gap: 6,
  },
  reviewName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D1D5DB',
  },
  reviewDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 21,
    color: '#374151',
  },
  viewAllReviewsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D1FAE5',
  },
  viewAllReviewsText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#00B14F',
  },
  noReviews: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  noReviewsIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  noReviewsText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#6B7280',
  },
  noReviewsSubtext: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  priceWrapper: {
    gap: 2,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00B14F',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bookButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
});
