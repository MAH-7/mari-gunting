import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { formatCurrency, formatDistance } from '@/utils/format';

const { width } = Dimensions.get('window');

export default function BarberProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  
  const { data: barberResponse, isLoading } = useQuery({
    queryKey: ['barber', id],
    queryFn: () => api.getBarberById(id),
  });

  const { data: reviewsResponse } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => api.getReviewsByBarberId(id),
    enabled: !!id,
  });

  const barber = barberResponse?.data;
  const reviews = reviewsResponse?.data || [];

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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00B14F" />
          <Text style={styles.loadingText}>Loading profile...</Text>
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
          <Ionicons name="alert-circle-outline" size={64} color="#D1D5DB" />
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
        <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="share-outline" size={22} color="#1C1C1E" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: barber.avatar }} style={styles.avatar} />
            {barber.isOnline && <View style={styles.onlineBadge} />}
          </View>
          
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{barber.name}</Text>
              {barber.isVerified && (
                <Ionicons name="checkmark-circle" size={22} color="#007AFF" />
              )}
            </View>
            
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={18} color="#FBBF24" />
              <Text style={styles.ratingText}>{barber.rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({barber.totalReviews} reviews)</Text>
            </View>

            {barber.distance && (
              <View style={styles.locationRow}>
                <Ionicons name="navigate" size={16} color="#00B14F" />
                <Text style={styles.distanceText}>{formatDistance(barber.distance)} away</Text>
              </View>
            )}

            {barber.isOnline && (
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Available Now</Text>
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
            <Text style={styles.sectionTitle}>Portfolio</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryContainer}
              pagingEnabled
            >
              {photos.map((photo: string, index: number) => (
                <Image 
                  key={index} 
                  source={{ uri: photo }} 
                  style={styles.galleryImage}
                />
              ))}
            </ScrollView>
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
                  <Text style={styles.serviceName}>{service.name}</Text>
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
            {reviews.slice(0, 5).map((review: any) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Image 
                    source={{ uri: review.customerAvatar || 'https://via.placeholder.com/40' }} 
                    style={styles.reviewAvatar} 
                  />
                  <View style={styles.reviewInfo}>
                    <Text style={styles.reviewerName}>{review.customerName || 'Anonymous'}</Text>
                    <View style={styles.reviewRating}>
                      {[...Array(5)].map((_, i) => (
                        <Ionicons 
                          key={i} 
                          name={i < review.rating ? 'star' : 'star-outline'} 
                          size={14} 
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
            ))}
            {reviews.length > 5 && (
              <TouchableOpacity 
                style={styles.viewAllReviews}
                onPress={() => router.push(`/barber/reviews/${id}` as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllReviewsText}>View all {reviews.length} reviews</Text>
                <Ionicons name="chevron-forward" size={16} color="#00B14F" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Location */}
        {barber.location && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Location</Text>
            <View style={styles.locationCard}>
              <Ionicons name="location" size={20} color="#00B14F" />
              <Text style={styles.locationAddress}>{barber.location.address}</Text>
            </View>
          </View>
        )}

        {/* Bottom padding for fixed button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom Book Button */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Starting from</Text>
          <Text style={styles.price}>{formatCurrency(lowestPrice)}</Text>
        </View>
        <TouchableOpacity 
          style={[
            styles.bookButton,
            !barber.isOnline && styles.bookButtonDisabled
          ]}
          onPress={() => {
            if (barber.isOnline) {
              router.push(`/booking/create?barberId=${barber.id}` as any);
            }
          }}
          activeOpacity={0.8}
          disabled={!barber.isOnline}
        >
          <Text style={styles.bookButtonText}>
            {!barber.isOnline ? 'Offline' : 'Book Now'}
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
    backgroundColor: '#FFFFFF',
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
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#00B14F',
    borderWidth: 3,
    borderColor: '#FFFFFF',
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#00B14F',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00B14F',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00B14F',
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#00B14F20',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00B14F',
  },
  galleryContainer: {
    gap: 12,
  },
  galleryImage: {
    width: width - 40,
    height: 240,
    borderRadius: 12,
    backgroundColor: '#E5E5EA',
  },
  photoIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
  indicatorActive: {
    backgroundColor: '#00B14F',
    width: 20,
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
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 16,
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00B14F',
  },
  serviceCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  serviceCardSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#00B14F',
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
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#00B14F',
    borderColor: '#00B14F',
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
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  servicePrice: {
    fontSize: 17,
    fontWeight: '700',
    color: '#00B14F',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6B7280',
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
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00B14F20',
  },
  locationAddress: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
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
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
  },
  reviewInfo: {
    flex: 1,
    gap: 4,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    color: '#3C3C43',
    marginLeft: 52,
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
    color: '#00B14F',
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
    backgroundColor: '#00B14F',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 24,
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
});
