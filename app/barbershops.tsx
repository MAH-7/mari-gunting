import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { formatCurrency, formatDistance } from '@/utils/format';
import { Barbershop } from '@/types';
import FilterModal, { FilterOptions } from '@/components/FilterModal';

export default function BarbershopsScreen() {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    distance: 20,
    priceRange: 'all',
    openNow: false,
    verifiedOnly: false,
    sortBy: 'recommended',
  });

  const { data: barbershopsResponse, isLoading } = useQuery({
    queryKey: ['barbershops'],
    queryFn: () => api.getBarbershops({}),
  });

  const barbershops = barbershopsResponse?.data?.data || [];

  // Apply filters
  let filteredBarbershops = barbershops;

  // Filter by distance
  if (filters.distance < 20) {
    filteredBarbershops = filteredBarbershops.filter(shop => 
      (shop.distance || 0) <= filters.distance
    );
  }

  // Filter by price range - using minimum price (starting price)
  if (filters.priceRange !== 'all') {
    filteredBarbershops = filteredBarbershops.filter(shop => {
      const minPrice = Math.min(...shop.services.map((s: any) => s.price));
      
      switch (filters.priceRange) {
        case 'budget':
          return minPrice >= 10 && minPrice <= 20;
        case 'mid':
          return minPrice > 20 && minPrice <= 40;
        case 'premium':
          return minPrice > 40;
        default:
          return true;
      }
    });
  }

  // Filter by open now
  if (filters.openNow) {
    filteredBarbershops = filteredBarbershops.filter(shop => shop.isOpen);
  }

  // Filter by verified only
  if (filters.verifiedOnly) {
    filteredBarbershops = filteredBarbershops.filter(shop => shop.isVerified);
  }

  // Check if any filters are active
  const hasActiveFilters = 
    filters.distance < 20 ||
    filters.priceRange !== 'all' ||
    filters.openNow ||
    filters.verifiedOnly;

  // Sort barbershops based on selected sort option
  const sortedBarbershops = [...filteredBarbershops].sort((a, b) => {
    switch (filters.sortBy) {
      case 'distance':
        return (a.distance || 999) - (b.distance || 999);
      case 'rating':
        return b.rating - a.rating;
      case 'price_low':
        const minPriceA = Math.min(...a.services.map((s: any) => s.price));
        const minPriceB = Math.min(...b.services.map((s: any) => s.price));
        return minPriceA - minPriceB;
      case 'price_high':
        const maxPriceA = Math.max(...a.services.map((s: any) => s.price));
        const maxPriceB = Math.max(...b.services.map((s: any) => s.price));
        return maxPriceB - maxPriceA;
      case 'recommended':
      default:
        // Recommended: balance of rating, distance, and bookings
        const scoreA = (a.rating * 0.4) + ((20 - (a.distance || 0)) * 0.3) + ((a.bookingsCount || 0) / 100 * 0.3);
        const scoreB = (b.rating * 0.4) + ((20 - (b.distance || 0)) * 0.3) + ((b.bookingsCount || 0) / 100 * 0.3);
        return scoreB - scoreA;
    }
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Barbershops</Text>
        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons 
            name="options-outline" 
            size={24} 
            color={hasActiveFilters ? '#00B14F' : '#111827'} 
          />
          {hasActiveFilters && <View style={styles.filterBadge} />}
        </TouchableOpacity>
      </View>


      {/* Shop Count */}
      <View style={styles.countSection}>
        <View style={styles.countBadge}>
          <Ionicons name="storefront" size={16} color="#00B14F" />
          <Text style={styles.resultCount}>
            {sortedBarbershops.length} {sortedBarbershops.length === 1 ? 'shop' : 'shops'} available
          </Text>
        </View>
        {hasActiveFilters && (
          <TouchableOpacity 
            style={styles.clearFiltersButton}
            onPress={() => setFilters({
              distance: 20,
              priceRange: 'all',
              openNow: false,
              verifiedOnly: false,
              sortBy: 'recommended',
            })}
          >
            <Text style={styles.clearFiltersText}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Barbershops List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#00B14F" />
            <Text style={styles.loadingText}>Finding barbershops...</Text>
          </View>
        ) : sortedBarbershops.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No barbershops found</Text>
            <Text style={styles.emptyText}>Try adjusting your filters</Text>
          </View>
        ) : (
          sortedBarbershops.map((shop) => (
            <BarbershopCard key={shop.id} shop={shop} />
          ))
        )}
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={(newFilters) => {
          setFilters(newFilters);
        }}
        currentFilters={filters}
      />
    </SafeAreaView>
  );
}

function BarbershopCard({ shop }: { shop: Barbershop }) {
  return (
    <TouchableOpacity
      style={styles.shopCard}
      onPress={() => router.push(`/barbershop/${shop.id}` as any)}
      activeOpacity={0.9}
    >
      {/* Image with Status Overlay */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: shop.image }} style={styles.shopImage} />
        
        {/* Status Badge - Top Left */}
        {shop.isOpen ? (
          <View style={styles.statusBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.statusText}>OPEN</Text>
          </View>
        ) : (
          <View style={[styles.statusBadge, styles.statusBadgeClosed]}>
            <Text style={styles.statusTextClosed}>CLOSED</Text>
          </View>
        )}

        {/* Verified Badge - Top Right */}
        {shop.isVerified && (
          <View style={styles.verifiedImageBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
          </View>
        )}

        {/* Distance Badge - Bottom Right */}
        {shop.distance && (
          <View style={styles.distanceBadge}>
            <Ionicons name="navigate" size={12} color="#FFFFFF" />
            <Text style={styles.distanceBadgeText}>{formatDistance(shop.distance)}</Text>
          </View>
        )}
      </View>

      {/* Shop Info */}
      <View style={styles.cardContent}>
        {/* Shop Name & Rating Row */}
        <View style={styles.headerRow}>
          <Text style={styles.shopName} numberOfLines={1}>
            {shop.name}
          </Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#FFFFFF" />
            <Text style={styles.ratingBadgeText}>{shop.rating.toFixed(1)}</Text>
          </View>
        </View>

        {/* Reviews & Bookings Count */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble" size={12} color="#6B7280" />
            <Text style={styles.statText}>{shop.reviewsCount} reviews</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="people" size={12} color="#6B7280" />
            <Text style={styles.statText}>{shop.bookingsCount}+ bookings</Text>
          </View>
        </View>

        {/* Address */}
        <View style={styles.infoRow}>
          <Ionicons name="location" size={14} color="#00B14F" />
          <Text style={styles.infoText} numberOfLines={1}>
            {shop.address}
          </Text>
        </View>

        {/* Operating Hours */}
        {shop.operatingHours && (
          <View style={styles.infoRow}>
            <Ionicons name="time" size={14} color="#00B14F" />
            <Text style={styles.infoText}>{shop.operatingHours}</Text>
          </View>
        )}

        {/* Services Pills */}
        <View style={styles.servicesContainer}>
          {shop.services.slice(0, 3).map((service, idx) => (
            <View key={idx} style={styles.servicePill}>
              <Text style={styles.servicePillText}>{service.name}</Text>
            </View>
          ))}
          {shop.services.length > 3 && (
            <View style={styles.morePill}>
              <Text style={styles.morePillText}>+{shop.services.length - 3} more</Text>
            </View>
          )}
        </View>

        {/* Price & Book Button */}
        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Starting from</Text>
            <Text style={styles.priceValue}>
              {formatCurrency(shop.services[0]?.price || 0)}
            </Text>
          </View>
          <View style={styles.bookButton}>
            <Text style={styles.bookButtonText}>Book Now</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#D1FAE5',
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00B14F',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  countSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearFiltersText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00B14F',
    textDecorationLine: 'underline',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingState: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyState: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  shopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  shopImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 177, 79, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  statusTextClosed: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  verifiedImageBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  distanceBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  distanceBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  shopName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBBF24',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  ratingBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    fontWeight: '500',
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 16,
  },
  servicePill: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00B14F',
  },
  servicePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B14F',
  },
  morePill: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  morePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#00B14F',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00B14F',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
