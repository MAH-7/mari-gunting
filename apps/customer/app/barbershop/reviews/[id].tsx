import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

type FilterType = 'all' | '5' | '4' | '3' | '2' | '1';

export default function BarbershopReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  
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
          <ActivityIndicator size="large" color="#00B14F" />
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
          <Ionicons name="alert-circle-outline" size={64} color="#D1D5DB" />
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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
                  <Ionicons name="star" size={14} color={activeFilter === star.toString() ? '#FFFFFF' : '#FBBF24'} />
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
          
          {filteredReviews.length > 0 ? (
            filteredReviews.map((review: any, index: number) => (
              <View 
                key={review.id} 
                style={[
                  styles.reviewCard,
                  index === filteredReviews.length - 1 && styles.reviewCardLast
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
                          year: 'numeric'
                        })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={18} color="#00B14F" />
                  </View>
                </View>
                {review.comment && (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                )}
              </View>
            ))
          ) : (
            <View style={styles.noResultsContainer}>
              <Ionicons name="filter-outline" size={48} color="#D1D5DB" />
              <Text style={styles.noResultsText}>No {activeFilter} star reviews</Text>
              <Text style={styles.noResultsSubtext}>Try selecting a different filter</Text>
            </View>
          )}
        </View>

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
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
    padding: 16,
    marginBottom: 8,
    gap: 12,
    alignItems: 'center',
  },
  shopLogo: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  shopInfo: {
    flex: 1,
    gap: 6,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  shopRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shopRatingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  shopRatingCount: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  overviewCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
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
    borderRightColor: '#E5E7EB',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#111827',
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
    color: '#6B7280',
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
    color: '#6B7280',
    width: 10,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
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
    color: '#9CA3AF',
    width: 24,
    textAlign: 'right',
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
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
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#00B14F',
    borderColor: '#00B14F',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  reviewsSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  reviewsTitle: {
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
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  reviewInfo: {
    flex: 1,
    gap: 6,
  },
  reviewName: {
    fontSize: 15,
    fontWeight: '600',
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
    fontWeight: '500',
    color: '#9CA3AF',
  },
  verifiedBadge: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 21,
    color: '#374151',
  },
  noResultsContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  noResultsSubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
});
