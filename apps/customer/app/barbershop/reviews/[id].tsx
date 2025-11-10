import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Colors, theme } from '@mari-gunting/shared/theme';

type FilterType = 'all' | '5' | '4' | '3' | '2' | '1';

const REVIEWS_PER_PAGE = 10;

export default function BarbershopReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [displayCount, setDisplayCount] = useState(REVIEWS_PER_PAGE);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const backToTopOpacity = useRef(new Animated.Value(0)).current;
  
  const { data: shopResponse, isLoading: shopLoading } = useQuery({
    queryKey: ['barbershop', id],
    queryFn: () => api.getBarbershopById(id),
  });

  const { data: reviewsResponse, isLoading: reviewsLoading } = useQuery({
    queryKey: ['barbershop-reviews', id],
    queryFn: () => api.getReviewsByBarbershopId(id),
    enabled: !!id,
  });

  const shop = shopResponse?.data;
  const allReviews = reviewsResponse?.data || [];
  
  // Filter reviews based on selected filter
  const filteredReviews = activeFilter === 'all' 
    ? allReviews 
    : allReviews.filter((r: any) => r.rating === parseInt(activeFilter));
  
  // Get displayed reviews based on current display count
  const displayedReviews = filteredReviews.slice(0, displayCount);
  const hasMore = displayCount < filteredReviews.length;
  
  // Reset display count when filter changes
  React.useEffect(() => {
    setDisplayCount(REVIEWS_PER_PAGE);
  }, [activeFilter]);
  
  // Load more reviews
  const loadMore = () => {
    setDisplayCount(prev => prev + REVIEWS_PER_PAGE);
  };
  
  // Handle scroll to show/hide back to top button
  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    // Only show button if we have 10+ reviews displayed AND scrolled past 300px
    const shouldShow = offsetY > 300 && displayedReviews.length >= 10;
    
    if (shouldShow !== showBackToTop) {
      setShowBackToTop(shouldShow);
      Animated.timing(backToTopOpacity, {
        toValue: shouldShow ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };
  
  // Scroll to top
  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => {
    const count = allReviews.filter((r: any) => r.rating === star).length;
    const percentage = allReviews.length > 0 ? (count / allReviews.length) * 100 : 0;
    return { star, count, percentage };
  });

  if (shopLoading || reviewsLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reviews</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading reviews...</Text>
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
          <Text style={styles.headerTitle}>Reviews</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.gray[300]} />
          <Text style={styles.emptyText}>Shop not found</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Customer Reviews</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Shop Info Header */}
        <View style={styles.shopHeader}>
          <Image source={{ uri: shop.logo }} style={styles.shopLogo} />
          <View style={styles.shopInfo}>
            <Text style={styles.shopName} numberOfLines={1}>{shop.name}</Text>
            <View style={styles.shopRating}>
              <Ionicons name="star" size={16} color="#FBBF24" />
              <Text style={styles.shopRatingText}>{shop.rating.toFixed(1)}</Text>
              <Text style={styles.shopRatingCount}>({shop.reviewsCount} reviews)</Text>
            </View>
          </View>
        </View>

        {/* Rating Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewLeft}>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>{shop.rating.toFixed(1)}</Text>
              <Ionicons name="star" size={28} color="#FBBF24" style={styles.scoreStar} />
            </View>
            <View style={styles.starsRow}>
              {[...Array(5)].map((_, i) => (
                <Ionicons 
                  key={i} 
                  name={i < Math.floor(shop.rating) ? 'star' : 'star-outline'} 
                  size={18} 
                  color="#FBBF24" 
                />
              ))}
            </View>
            <Text style={styles.overviewCount}>{shop.reviewsCount} total reviews</Text>
          </View>
          <View style={styles.overviewBars}>
            {ratingDistribution.map(({ star, count, percentage }) => (
              <View key={star} style={styles.barRow}>
                <Text style={styles.barStar}>{star}</Text>
                <Ionicons name="star" size={12} color="#FBBF24" />
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${percentage}%` }]} />
                </View>
                <Text style={styles.barCount}>{count}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Filter by rating</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterButton, activeFilter === 'all' && styles.filterButtonActive]}
              activeOpacity={0.7}
              onPress={() => setActiveFilter('all')}
            >
              <Text style={[styles.filterButtonText, activeFilter === 'all' && styles.filterButtonTextActive]}>
                All ({allReviews.length})
              </Text>
            </TouchableOpacity>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = allReviews.filter((r: any) => r.rating === star).length;
              if (count === 0) return null;
              return (
                <TouchableOpacity
                  key={star}
                  style={[styles.filterButton, activeFilter === star.toString() && styles.filterButtonActive]}
                  activeOpacity={0.7}
                  onPress={() => setActiveFilter(star.toString() as FilterType)}
                >
                  <Ionicons name="star" size={14} color={activeFilter === star.toString() ? Colors.white : '#FBBF24'} />
                  <Text style={[styles.filterButtonText, activeFilter === star.toString() && styles.filterButtonTextActive]}>
                    {star} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Reviews List */}
        <View style={styles.reviewsSection}>
          <Text style={styles.reviewsTitle}>
            {activeFilter === 'all' 
              ? `All Reviews (${filteredReviews.length})`
              : `${activeFilter} Star Reviews (${filteredReviews.length})`
            }
          </Text>
          
          {displayedReviews.length > 0 ? (
            <>
              {displayedReviews.map((review: any, index: number) => (
              <View 
                key={review.id} 
                style={[
                  styles.reviewCard,
                  index === filteredReviews.length - 1 && styles.reviewCardLast
                ]}
              >
                <View style={styles.reviewHeader}>
                  <View style={styles.customerInfo}>
                    <View style={styles.reviewAvatar}>
                      {review.customerAvatar ? (
                        <Image 
                          source={{ uri: review.customerAvatar }} 
                          style={styles.reviewAvatarImage} 
                        />
                      ) : (
                        <Text style={styles.reviewAvatarText}>
                          {(review.customerName || 'A').substring(0, 2).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={styles.reviewCustomerDetails}>
                      <Text style={styles.reviewName} numberOfLines={1} ellipsizeMode="tail">
                        {review.customerName || 'Anonymous'}
                      </Text>
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
                          {review.barberName ? review.barberName.toUpperCase() : 'BARBER'} REPLIED
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
              
              {/* Load More Button */}
              {hasMore && (
                <TouchableOpacity 
                  style={styles.loadMoreButton}
                  onPress={loadMore}
                  activeOpacity={0.7}
                >
                  <Text style={styles.loadMoreText}>Load More Reviews</Text>
                  <Ionicons name="chevron-down" size={18} color={Colors.primary} />
                </TouchableOpacity>
              )}
              
              {/* End of Reviews */}
              {!hasMore && filteredReviews.length > 0 && (
                <View style={styles.endOfReviews}>
                  <Text style={styles.endOfReviewsText}>You've reached the end</Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.noResultsContainer}>
              <Ionicons name="filter-outline" size={48} color={Colors.gray[300]} />
              <Text style={styles.noResultsText}>No {activeFilter} star reviews</Text>
              <Text style={styles.noResultsSubtext}>Try selecting a different filter</Text>
            </View>
          )}
        </View>

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
      
      {/* Back to Top Button */}
      {showBackToTop && (
        <Animated.View style={[styles.backToTopButton, { opacity: backToTopOpacity }]}>
          <TouchableOpacity
            style={styles.backToTopTouchable}
            onPress={scrollToTop}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-up" size={24} color={Colors.white} />
          </TouchableOpacity>
        </Animated.View>
      )}
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
    backgroundColor: Colors.white,
    padding: 16,
    marginBottom: 8,
    gap: 12,
    alignItems: 'center',
  },
  shopLogo: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
  },
  shopInfo: {
    flex: 1,
    gap: 6,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  shopRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shopRatingText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  shopRatingCount: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.gray[500],
  },
  overviewCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: 20,
    marginBottom: 8,
    gap: 24,
  },
  overviewLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingRight: 20,
    borderRightWidth: 1,
    borderRightColor: Colors.gray[200],
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: -1,
  },
  scoreStar: {
    marginTop: 6,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  overviewCount: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.gray[500],
    textAlign: 'center',
  },
  overviewBars: {
    flex: 1,
    gap: 8,
    justifyContent: 'center',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barStar: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray[500],
    width: 10,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#FBBF24',
    borderRadius: 3,
  },
  barCount: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gray[400],
    width: 24,
    textAlign: 'right',
  },
  filterSection: {
    backgroundColor: Colors.white,
    paddingVertical: 16,
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray[500],
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
  reviewsSection: {
    backgroundColor: Colors.white,
    padding: 20,
  },
  reviewsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  reviewCardLast: {
    marginBottom: 0,
  },
  reviewHeader: {
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
  reviewName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
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
  noResultsContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gray[500],
  },
  noResultsSubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray[400],
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#F9731620',
  },
  loadMoreText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  endOfReviews: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 8,
  },
  endOfReviewsText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  backToTopButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    zIndex: 999,
  },
  backToTopTouchable: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
