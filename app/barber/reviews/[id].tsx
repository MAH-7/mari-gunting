import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

type RatingFilter = 'all' | 1 | 2 | 3 | 4 | 5;

export default function BarberReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  
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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
          ) : filteredReviews.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbox-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                {ratingFilter === 'all' 
                  ? 'No reviews yet' 
                  : `No ${ratingFilter}-star reviews`}
              </Text>
            </View>
          ) : (
            filteredReviews.map((review: any) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Image 
                    source={{ uri: review.customerAvatar || 'https://via.placeholder.com/50' }} 
                    style={styles.reviewAvatar} 
                  />
                  <View style={styles.reviewInfo}>
                    <Text style={styles.reviewerName}>{review.customerName || 'Anonymous'}</Text>
                    <View style={styles.reviewRating}>
                      {[...Array(5)].map((_, i) => (
                        <Ionicons 
                          key={i} 
                          name={i < review.rating ? 'star' : 'star-outline'} 
                          size={16} 
                          color={i < review.rating ? '#FBBF24' : '#D1D5DB'} 
                        />
                      ))}
                      <Text style={styles.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString('en-MY', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </Text>
                    </View>
                  </View>
                </View>
                {review.comment && (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* Bottom Padding */}
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
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  reviewAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E5EA',
  },
  reviewInfo: {
    flex: 1,
    gap: 6,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewDate: {
    fontSize: 13,
    color: '#8E8E93',
    marginLeft: 4,
  },
  reviewComment: {
    fontSize: 15,
    lineHeight: 22,
    color: '#3C3C43',
    marginLeft: 62,
  },
});
