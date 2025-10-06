import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Dimensions, ActivityIndicator, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { formatCurrency, formatDistance } from '@/utils/format';

const { width } = Dimensions.get('window');

// Get current day for highlighting in operating hours
const getCurrentDay = () => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
};

export default function BarbershopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00B14F" />
          <Text style={styles.loadingText}>Loading barbershop...</Text>
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
          <Ionicons name="alert-circle-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>Barbershop not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate the lowest price from all services
  const lowestPrice = shop.services.length > 0 
    ? Math.min(...shop.services.map(s => s.price))
    : 0;

  // Group services by category (if you add category to services later)
  const groupedServices = shop.services;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Barbershop</Text>
        <TouchableOpacity 
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="share-outline" size={22} color="#1C1C1E" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Card with Shop Info */}
        <View style={styles.heroCard}>
          {/* Top Section with Logo */}
          <View style={styles.heroTop}>
            <View style={styles.heroLogoContainer}>
              <Image source={{ uri: shop.logo }} style={styles.heroLogo} />
              {shop.isVerified && (
                <View style={styles.heroVerifiedBadge}>
                  <Ionicons name="shield-checkmark" size={12} color="#FFFFFF" />
                </View>
              )}
            </View>
            
            {/* Status Chip */}
            {shop.isOpen ? (
              <View style={styles.heroStatusOpen}>
                <View style={styles.heroStatusDot} />
                <Text style={styles.heroStatusTextOpen}>Open</Text>
              </View>
            ) : (
              <View style={styles.heroStatusClosed}>
                <Text style={styles.heroStatusTextClosed}>Closed</Text>
              </View>
            )}
          </View>

          {/* Shop Name */}
          <Text style={styles.heroShopName}>{shop.name}</Text>

          {/* Rating Bar */}
          <View style={styles.heroRatingBar}>
            <View style={styles.heroRatingLeft}>
              <Ionicons name="star" size={16} color="#FBBF24" />
              <Text style={styles.heroRatingValue}>{shop.rating.toFixed(1)}</Text>
              <Text style={styles.heroRatingReviews}>({shop.reviewsCount})</Text>
            </View>
            {shop.distance && (
              <View style={styles.heroDistance}>
                <Ionicons name="navigate" size={14} color="#00B14F" />
                <Text style={styles.heroDistanceText}>{formatDistance(shop.distance)}</Text>
              </View>
            )}
          </View>

          {/* Stats Row */}
          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Ionicons name="people-outline" size={16} color="#6B7280" />
              <Text style={styles.heroStatText}>{shop.bookingsCount}+ bookings</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text style={styles.heroStatText}>{shop.operatingHours}</Text>
            </View>
          </View>

          {/* Address */}
          <TouchableOpacity style={styles.heroAddress} activeOpacity={0.7}>
            <Ionicons name="location-outline" size={18} color="#111827" />
            <Text style={styles.heroAddressText} numberOfLines={1}>{shop.address}</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Services Menu */}
        <View style={styles.servicesSection}>
          <View style={styles.servicesSectionHeader}>
            <View style={styles.servicesTitleRow}>
              <Ionicons name="cut-outline" size={20} color="#111827" />
              <Text style={styles.servicesSectionTitle}>Services</Text>
            </View>
            <View style={styles.servicesCount}>
              <Text style={styles.servicesCountText}>{shop.services.length}</Text>
            </View>
          </View>

          <View style={styles.servicesGrid}>
            {groupedServices.map((service: any, index: number) => (
              <TouchableOpacity 
                key={service.id} 
                style={[
                  styles.serviceItem,
                  index === groupedServices.length - 1 && styles.serviceItemLast
                ]}
                activeOpacity={0.6}
              >
                <View style={styles.serviceIconContainer}>
                  <Ionicons name="cut" size={18} color="#00B14F" />
                </View>
                <View style={styles.serviceContent}>
                  <View style={styles.serviceItemTop}>
                    <Text style={styles.serviceItemName} numberOfLines={1}>{service.name}</Text>
                    <View style={styles.serviceItemPriceTag}>
                      <Text style={styles.serviceItemPrice}>{formatCurrency(service.price)}</Text>
                    </View>
                  </View>
                  <View style={styles.serviceItemBottom}>
                    <View style={styles.serviceItemMeta}>
                      <View style={styles.serviceItemTime}>
                        <Ionicons name="time-outline" size={12} color="#9CA3AF" />
                        <Text style={styles.serviceItemTimeText}>{service.duration} min</Text>
                      </View>
                    </View>
                    <View style={styles.serviceItemAction}>
                      <Ionicons name="chevron-forward" size={16} color="#00B14F" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Service Info Footer */}
          <View style={styles.serviceFooter}>
            <View style={styles.serviceFooterIcon}>
              <Ionicons name="information-circle" size={16} color="#00B14F" />
            </View>
            <Text style={styles.serviceFooterText}>
              Tap any service to view details and book with your preferred barber
            </Text>
          </View>
        </View>

        {/* Reviews Section */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsSectionHeader}>
            <View style={styles.reviewsTitleRow}>
              <Ionicons name="star" size={20} color="#FBBF24" />
              <Text style={styles.reviewsSectionTitle}>Customer Reviews</Text>
            </View>
            {reviews.length > 0 && (
              <TouchableOpacity 
                style={styles.reviewsViewAll} 
                activeOpacity={0.6}
                onPress={() => router.push(`/barbershop/reviews/${id}` as any)}
              >
                <Text style={styles.reviewsViewAllText}>See all</Text>
                <Ionicons name="chevron-forward" size={16} color="#00B14F" />
              </TouchableOpacity>
            )}
          </View>

          {/* Rating Overview */}
          <View style={styles.reviewsOverview}>
            <View style={styles.reviewsOverviewLeft}>
              <View style={styles.reviewsScoreContainer}>
                <Text style={styles.reviewsOverviewScore}>{shop.rating.toFixed(1)}</Text>
                <Ionicons name="star" size={24} color="#FBBF24" style={styles.reviewsScoreStar} />
              </View>
              <View style={styles.reviewsOverviewStars}>
                {[...Array(5)].map((_, i) => (
                  <Ionicons 
                    key={i} 
                    name={i < Math.floor(shop.rating) ? 'star' : 'star-outline'} 
                    size={16} 
                    color="#FBBF24" 
                  />
                ))}
              </View>
              <Text style={styles.reviewsOverviewCount}>Based on {shop.reviewsCount} reviews</Text>
            </View>
            <View style={styles.reviewsOverviewBars}>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter((r: any) => r.rating === star).length;
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : (star <= Math.floor(shop.rating) ? 80 : 20);
                return (
                  <View key={star} style={styles.reviewsBarRow}>
                    <Text style={styles.reviewsBarStar}>{star}</Text>
                    <Ionicons name="star" size={10} color="#FBBF24" />
                    <View style={styles.reviewsBarTrack}>
                      <View style={[styles.reviewsBarFill, { width: `${percentage}%` }]} />
                    </View>
                    <Text style={styles.reviewsBarCount}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Recent Reviews */}
          {reviews.length > 0 ? (
            <View style={styles.reviewsList}>
              <Text style={styles.reviewsListTitle}>Recent Reviews</Text>
              {reviews.slice(0, 3).map((review: any, index: number) => (
                <View 
                  key={review.id} 
                  style={[
                    styles.reviewCard,
                    index === reviews.slice(0, 3).length - 1 && styles.reviewCardLast
                  ]}
                >
                  <View style={styles.reviewCardHeader}>
                    <Image 
                      source={{ uri: review.customerAvatar || 'https://via.placeholder.com/40' }} 
                      style={styles.reviewItemAvatar} 
                    />
                    <View style={styles.reviewItemInfo}>
                      <Text style={styles.reviewItemName}>{review.customerName || 'Anonymous'}</Text>
                      <View style={styles.reviewItemMeta}>
                        <View style={styles.reviewItemStars}>
                          {[...Array(5)].map((_, i) => (
                            <Ionicons 
                              key={i} 
                              name={i < review.rating ? 'star' : 'star-outline'} 
                              size={12} 
                              color={i < review.rating ? '#FBBF24' : '#E5E7EB'} 
                            />
                          ))}
                        </View>
                        <View style={styles.reviewItemDot} />
                        <Text style={styles.reviewItemDate}>
                          {new Date(review.createdAt).toLocaleDateString('en-MY', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.reviewVerifiedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#00B14F" />
                    </View>
                  </View>
                  {review.comment && (
                    <Text style={styles.reviewItemComment}>{review.comment}</Text>
                  )}
                </View>
              ))}

              {/* Show All Reviews Button */}
              {reviews.length > 3 && (
                <TouchableOpacity 
                  style={styles.showAllReviewsButton} 
                  activeOpacity={0.7}
                  onPress={() => router.push(`/barbershop/reviews/${id}` as any)}
                >
                  <Text style={styles.showAllReviewsText}>
                    View all {shop.reviewsCount} reviews
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="#00B14F" />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.noReviewsPlaceholder}>
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

        {/* Bottom padding for fixed button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom Book Button */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarLeft}>
          <Text style={styles.priceLabel}>Starting from</Text>
          <Text style={styles.price}>{formatCurrency(lowestPrice)}</Text>
        </View>
        <TouchableOpacity 
          style={[
            styles.bookButton,
            !shop.isOpen && styles.bookButtonDisabled
          ]}
          disabled={!shop.isOpen}
          onPress={() => router.push(`/barbershop/barbers/${shop.id}` as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.bookButtonText}>
            {shop.isOpen ? 'Book Now' : 'Closed'}
          </Text>
          {shop.isOpen && <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
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
  scrollView: {
    flex: 1,
  },
  shopHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 20,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  logoImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  shopHeaderInfo: {
    flex: 1,
    gap: 8,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D1D5DB',
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00B14F',
  },
  openStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    gap: 5,
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00B14F',
  },
  openText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B14F',
  },
  closedStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  closedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    marginTop: 8,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  quickStatIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  quickStatLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  quickInfoGrid: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 8,
    gap: 12,
  },
  quickInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickInfoContent: {
    flex: 1,
    gap: 2,
  },
  quickInfoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  quickInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  heroSection: {
    width: '100%',
    height: 280,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 177, 79, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadgeClosed: {
    backgroundColor: 'rgba(239, 68, 68, 0.95)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  statusTextClosed: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(59, 130, 246, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  infoHeader: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  nameSection: {
    gap: 8,
  },
  shopName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  reviewCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    marginTop: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
  quickInfoSection: {
    padding: 20,
    gap: 12,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCardContent: {
    flex: 1,
    gap: 4,
  },
  infoCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCardValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  infoCardDistance: {
    fontSize: 13,
    color: '#00B14F',
    fontWeight: '600',
    marginTop: 2,
  },
  infoCardAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 8,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  serviceContent: {
    flex: 1,
    gap: 8,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00B14F',
    marginLeft: 12,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceMetaText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  serviceAction: {
    marginLeft: 12,
  },
  addServiceButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  viewAllText: {
    fontSize: 14,
    color: '#00B14F',
    fontWeight: '600',
  },
  ratingSummary: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    marginBottom: 20,
    gap: 24,
  },
  ratingLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ratingLarge: {
    fontSize: 40,
    fontWeight: '800',
    color: '#111827',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  ratingCount: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  ratingBars: {
    flex: 1,
    gap: 8,
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingBarLabel: {
    fontSize: 12,
    fontWeight: '600',
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
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    width: 24,
    textAlign: 'right',
  },
  reviewCard: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  reviewHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  reviewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
  },
  reviewInfo: {
    flex: 1,
    gap: 4,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginLeft: 4,
  },
  reviewComment: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    height: Platform.OS === 'ios' ? 95 : 75,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomBarLeft: {
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00B14F',
    paddingHorizontal: 40,
    paddingVertical: 14,
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
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  // New Hero Card Styles
  heroCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heroLogoContainer: {
    position: 'relative',
  },
  heroLogo: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
  },
  heroVerifiedBadge: {
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
  heroStatusOpen: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    gap: 6,
  },
  heroStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00B14F',
  },
  heroStatusTextOpen: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B14F',
  },
  heroStatusClosed: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
  },
  heroStatusTextClosed: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  heroShopName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  heroRatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  heroRatingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroRatingValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  heroRatingReviews: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  heroDistance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
  },
  heroDistanceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00B14F',
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  heroStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroStatText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  heroStatDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#E5E7EB',
  },
  heroAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    gap: 10,
  },
  heroAddressText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  // New Services Section Styles
  servicesSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  servicesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  servicesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  servicesSectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  servicesCount: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D1FAE5',
  },
  servicesCountText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#00B14F',
  },
  servicesGrid: {
    gap: 10,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  serviceItemLast: {
    marginBottom: 0,
  },
  serviceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  serviceContent: {
    flex: 1,
    gap: 8,
  },
  serviceItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  serviceItemPriceTag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#00B14F',
  },
  serviceItemPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#00B14F',
  },
  serviceItemBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceItemTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceItemTimeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  serviceItemAction: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    gap: 8,
  },
  serviceFooterIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceFooterText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    color: '#059669',
  },
  // New Reviews Section Styles
  reviewsSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  reviewsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  reviewsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewsSectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  reviewsViewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  reviewsViewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00B14F',
  },
  reviewsOverview: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    marginBottom: 20,
    gap: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  reviewsOverviewLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingRight: 20,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  reviewsScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewsOverviewScore: {
    fontSize: 44,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -1,
  },
  reviewsScoreStar: {
    marginTop: 4,
  },
  reviewsOverviewStars: {
    flexDirection: 'row',
    gap: 4,
  },
  reviewsOverviewCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  reviewsOverviewBars: {
    flex: 1,
    gap: 8,
    justifyContent: 'center',
  },
  reviewsBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewsBarStar: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    width: 10,
  },
  reviewsBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  reviewsBarFill: {
    height: '100%',
    backgroundColor: '#FBBF24',
    borderRadius: 3,
  },
  reviewsBarCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    width: 20,
    textAlign: 'right',
  },
  reviewsList: {
    gap: 0,
  },
  reviewsListTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
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
  reviewCardHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  reviewItemAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  reviewItemInfo: {
    flex: 1,
    gap: 6,
  },
  reviewItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  reviewItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewItemStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewItemDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D1D5DB',
  },
  reviewItemDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  reviewVerifiedBadge: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewItemComment: {
    fontSize: 14,
    lineHeight: 21,
    color: '#374151',
  },
  showAllReviewsButton: {
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
  showAllReviewsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00B14F',
  },
  noReviewsPlaceholder: {
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
    fontWeight: '700',
    color: '#6B7280',
  },
  noReviewsSubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
