import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { formatCurrency, formatDistance, formatTime } from '@/utils/format';
import { Barbershop } from '@/types';
import FilterModal, { FilterOptions } from '@/components/FilterModal';

// Get current day for checking operating hours (using Malaysia time)
const getCurrentDay = () => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  // Get Malaysia time (GMT+8) by converting UTC to Malaysia timezone
  const now = new Date();
  const malaysiaTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // Add 8 hours
  return days[malaysiaTime.getUTCDay()]; // Use UTC methods since we adjusted the time
};

// Check if shop is currently open based on Malaysia time (GMT+8)
const isShopOpenNow = (detailedHours: any) => {
  if (!detailedHours) return false;

  // Get current Malaysia time (GMT+8) - React Native doesn't support timeZone in toLocaleString
  const now = new Date();
  const malaysiaTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // Add 8 hours to UTC
  
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = days[malaysiaTime.getUTCDay()]; // Use UTC methods since we adjusted the time
  const dayInfo = detailedHours[currentDay];
  
  if (!dayInfo || !dayInfo.isOpen) return false;
  
  const currentHour = malaysiaTime.getUTCHours();
  const currentMinute = malaysiaTime.getUTCMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  
  // Parse opening time
  const [openHour, openMinute] = dayInfo.open.split(':').map(Number);
  const openTimeInMinutes = openHour * 60 + openMinute;
  
  // Parse closing time
  const [closeHour, closeMinute] = dayInfo.close.split(':').map(Number);
  const closeTimeInMinutes = closeHour * 60 + closeMinute;
  
  return currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes;
};

export default function BarbershopsScreen() {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    distance: 20,
    priceRange: 'all',
    openNow: false,
    verifiedOnly: false,
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
          return minPrice <= 20; // RM 0-20
        case 'mid':
          return minPrice > 20 && minPrice <= 40; // RM 20-40
        case 'premium':
          return minPrice > 40; // RM 40+
        default:
          return true;
      }
    });
  }

  // Filter by open now - use dynamic calculation
  if (filters.openNow) {
    filteredBarbershops = filteredBarbershops.filter(shop => 
      shop.detailedHours ? isShopOpenNow(shop.detailedHours) : shop.isOpen
    );
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

  // Sort logic: When filtering by price range, sort by price (lowest first)
  // Otherwise, use Recommended algorithm (rating 40%, proximity 30%, popularity 30%)
  const sortedBarbershops = [...filteredBarbershops].sort((a, b) => {
    if (filters.priceRange !== 'all') {
      // Price-based sorting: show cheapest options first when filtering by budget/mid/premium
      const minPriceA = Math.min(...a.services.map((s: any) => s.price));
      const minPriceB = Math.min(...b.services.map((s: any) => s.price));
      return minPriceA - minPriceB; // Ascending (lowest price first)
    } else {
      // Recommended algorithm - Grab-style
      // Balances rating (40%), proximity (30%), and popularity (30%)
      const scoreA = (a.rating * 0.4) + ((20 - (a.distance || 0)) * 0.3) + ((a.bookingsCount || 0) / 100 * 0.3);
      const scoreB = (b.rating * 0.4) + ((20 - (b.distance || 0)) * 0.3) + ((b.bookingsCount || 0) / 100 * 0.3);
      return scoreB - scoreA; // Higher score = better recommendation
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
  // Get the lowest price from all services
  const lowestPrice = Math.min(...shop.services.map((s: any) => s.price));
  
  // Calculate if shop is currently open dynamically
  const isOpen = shop.detailedHours ? isShopOpenNow(shop.detailedHours) : shop.isOpen;
  
  return (
    <TouchableOpacity
      style={styles.shopCard}
      onPress={() => router.push(`/barbershop/${shop.id}` as any)}
      activeOpacity={0.7}
    >
      {/* Header with Logo, Name & Status */}
      <View style={styles.cardHeader}>
        <View style={styles.logoContainer}>
          <Image source={{ uri: shop.logo }} style={styles.shopLogo} />
        </View>
        
        <View style={styles.headerInfo}>
          <View style={styles.nameBadgeRow}>
            <Text style={styles.shopName} numberOfLines={1}>
              {shop.name}
            </Text>
            {shop.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#3B82F6" />
              </View>
            )}
          </View>
          
          <View style={styles.metaRow}>
            {/* Rating */}
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#FBBF24" />
              <Text style={styles.ratingText}>{shop.rating.toFixed(1)}</Text>
            </View>
            
            <View style={styles.metaDot} />
            
            {/* Reviews */}
            <Text style={styles.metaText}>{shop.reviewsCount} reviews</Text>
            
            {shop.distance && (
              <>
                <View style={styles.metaDot} />
                <View style={styles.distanceContainer}>
                  <Ionicons name="navigate" size={11} color="#00B14F" />
                  <Text style={styles.distanceText}>{formatDistance(shop.distance)}</Text>
                </View>
              </>
            )}
          </View>
        </View>
        
        {/* Status Badge */}
        {isOpen ? (
          <View style={styles.openBadge}>
            <View style={styles.openDot} />
          </View>
        ) : (
          <View style={styles.closedBadge}>
            <Text style={styles.closedText}>Closed</Text>
          </View>
        )}
      </View>

      {/* Quick Info */}
      <View style={styles.quickInfo}>
        <View style={styles.quickInfoItem}>
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text style={styles.quickInfoText}>
            {shop.operatingHours.includes('-') 
              ? shop.operatingHours.split(' - ').map(time => formatTime(time.trim())).join(' - ')
              : shop.operatingHours
            }
          </Text>
        </View>
        <View style={styles.quickInfoDivider} />
        <View style={styles.quickInfoItem}>
          <Ionicons name="people-outline" size={14} color="#6B7280" />
          <Text style={styles.quickInfoText}>{shop.bookingsCount}+ bookings</Text>
        </View>
      </View>

      {/* Services Preview */}
      <View style={styles.servicesPreview}>
        {shop.services.slice(0, 4).map((service, idx) => (
          <View key={idx} style={styles.serviceTag}>
            <Text style={styles.serviceTagText}>{service.name}</Text>
            <Text style={styles.serviceTagPrice}>{formatCurrency(service.price)}</Text>
          </View>
        ))}
        {shop.services.length > 4 && (
          <View style={styles.moreServicesTag}>
            <Text style={styles.moreServicesText}>+{shop.services.length - 4}</Text>
          </View>
        )}
      </View>

      {/* Footer with Price & Action */}
      <View style={styles.cardFooter}>
        <View style={styles.priceSection}>
          <Text style={styles.fromLabel}>From</Text>
          <Text style={styles.priceValue}>{formatCurrency(lowestPrice)}</Text>
        </View>
        <View style={styles.actionButton}>
          <Text style={styles.actionButtonText}>View Shop</Text>
          <Ionicons name="chevron-forward" size={16} color="#00B14F" />
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
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  shopLogo: {
    width: '100%',
    height: '100%',
  },
  headerInfo: {
    flex: 1,
    gap: 6,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
    flex: 1,
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
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
  openBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00B14F',
    borderWidth: 2,
    borderColor: '#D1FAE5',
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00B14F',
  },
  closedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  closedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    letterSpacing: 0.3,
  },
  quickInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  quickInfoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickInfoText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  quickInfoDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  servicesPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  serviceTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  serviceTagPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B14F',
  },
  moreServicesTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreServicesText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  priceSection: {
    gap: 2,
  },
  fromLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    gap: 4,
    borderWidth: 1.5,
    borderColor: '#00B14F',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00B14F',
    letterSpacing: 0.2,
  },
});
