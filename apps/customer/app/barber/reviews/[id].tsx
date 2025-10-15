import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

type RatingFilter = 'all' | 1 | 2 | 3 | 4 | 5;

const REVIEWS_PER_PAGE = 10;

export default function BarberReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [displayCount, setDisplayCount] = useState(REVIEWS_PER_PAGE);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const backToTopOpacity = useRef(new Animated.Value(0)).current;
  
  const { data: barberResponse } = useQuery({
    queryKey: ['barber', id],
    queryFn: () => api.getBarberById(id),
  });

  const { data: reviewsResponse, isLoading } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => api.getReviewsByBarberId(id),
    enabled: !!id,
  });

  const barber = barberResponse?.data;
  const allReviews = reviewsResponse?.data || [];

  // Filter reviews by rating
  const filteredReviews = ratingFilter === 'all' 
    ? allReviews 
    : allReviews.filter((review: any) => review.rating === ratingFilter);
  
  // Get displayed reviews based on current display count
  const displayedReviews = filteredReviews.slice(0, displayCount);
  const hasMore = displayCount < filteredReviews.length;
  
  // Reset display count when filter changes
  React.useEffect(() => {
    setDisplayCount(REVIEWS_PER_PAGE);
  }, [ratingFilter]);
  
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
  const ratingCounts = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: allReviews.filter((r: any) => r.rating === rating).length,
    percentage: allReviews.length > 0 
      ? (allReviews.filter((r: any) => r.rating === rating).length / allReviews.length) * 100 
      : 0,
  }));

  const averageRating = barber?.rating || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
        {/* Rating Summary */}
        <View style={styles.summarySection}>
          <View style={styles.averageRating}>
            <Text style={styles.ratingNumber}>{averageRating.toFixed(1)}</Text>
            <View style={styles.starsRow}>
              {[...Array(5)].map((_, i) => (
                <Ionicons 
                  key={i} 
                  name={i < Math.floor(averageRating) ? 'star' : 'star-outline'} 
                  size={20} 
                  color="#FBBF24" 
                />
              ))}
            </View>
            <Text style={styles.totalReviews}>Based on {allReviews.length} reviews</Text>
          </View>

          {/* Rating Distribution */}
          <View style={styles.distributionContainer}>
            {ratingCounts.map(({ rating, count, percentage }) => (
              <TouchableOpacity 
                key={rating}
                style={styles.distributionRow}
                onPress={() => setRatingFilter(ratingFilter === rating ? 'all' : rating as RatingFilter)}
                activeOpacity={0.7}
              >
                <Text style={styles.distributionLabel}>{rating}</Text>
                <Ionicons name="star" size={14} color="#FBBF24" />
                <View style={styles.distributionBar}>
                  <View 
                    style={[
                      styles.distributionFill, 
                      { 
                        width: `${percentage}%`,
                        backgroundColor: ratingFilter === rating ? '#00B14F' : '#FBBF24'
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.distributionCount}>{count}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterSection}>
          <TouchableOpacity
            style={[styles.filterChip, ratingFilter === 'all' && styles.filterChipActive]}
            onPress={() => setRatingFilter('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, ratingFilter === 'all' && styles.filterChipTextActive]}>
              All ({allReviews.length})
            </Text>
          </TouchableOpacity>
          {[5, 4, 3, 2, 1].map(rating => {
            const count = allReviews.filter((r: any) => r.rating === rating).length;
            if (count === 0) return null;
            return (
              <TouchableOpacity
                key={rating}
                style={[styles.filterChip, ratingFilter === rating && styles.filterChipActive]}
                onPress={() => setRatingFilter(rating as RatingFilter)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="star" 
                  size={14} 
                  color={ratingFilter === rating ? '#FFFFFF' : '#FBBF24'} 
                />
                <Text style={[styles.filterChipText, ratingFilter === rating && styles.filterChipTextActive]}>
                  {rating} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Reviews List */}
        <View style={styles.reviewsSection}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00B14F" />
              <Text style={styles.loadingText}>Loading reviews...</Text>
            </View>
          ) : displayedReviews.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbox-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                {ratingFilter === 'all' 
                  ? 'No reviews yet' 
                  : `No ${ratingFilter}-star reviews`}
              </Text>
            </View>
          ) : (
            <>
              {displayedReviews.map((review: any) => (
              <View key={review.id} style={styles.reviewCard}>
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
                      <Text style={styles.reviewerName}>{review.customerName || 'Anonymous'}</Text>
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
                {review.response && barber && (
                  <View style={styles.responseContainer}>
                    <View style={styles.responseBadge}>
                      <View style={styles.responseBadgeLeft}>
                        <Ionicons name="checkmark-circle" size={12} color="#00C853" />
                        <Text style={styles.responseBadgeText}>{barber.name.toUpperCase()} REPLIED</Text>
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
                  <Ionicons name="chevron-down" size={18} color="#00B14F" />
                </TouchableOpacity>
              )}
              
              {/* End of Reviews */}
              {!hasMore && filteredReviews.length > 0 && (
                <View style={styles.endOfReviews}>
                  <Text style={styles.endOfReviewsText}>You've reached the end</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Bottom Padding */}
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
            <Ionicons name="arrow-up" size={24} color="#FFFFFF" />
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
  scrollView: {
    flex: 1,
  },
  summarySection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 8,
  },
  averageRating: {
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    marginBottom: 20,
  },
  ratingNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  totalReviews: {
    fontSize: 14,
    color: '#8E8E93',
  },
  distributionContainer: {
    gap: 12,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distributionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    width: 12,
  },
  distributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  distributionFill: {
    height: '100%',
    borderRadius: 4,
  },
  distributionCount: {
    fontSize: 13,
    color: '#8E8E93',
    width: 30,
    textAlign: 'right',
  },
  filterSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  filterChipActive: {
    backgroundColor: '#00B14F',
    borderColor: '#00B14F',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  reviewsSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  reviewCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
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
    color: '#00B14F',
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
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#00B14F20',
  },
  loadMoreText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00B14F',
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
    backgroundColor: '#00B14F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
