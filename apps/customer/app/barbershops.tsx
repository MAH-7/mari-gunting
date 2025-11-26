import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { formatCurrency, formatDistance } from '@mari-gunting/shared/utils/format';
import { Barbershop } from '@/types';
import FilterModal, { FilterOptions } from '@/components/FilterModal';
import { SkeletonCircle, SkeletonText, SkeletonBase } from '@/components/Skeleton';
import { Colors, theme, getStatusBackground, getStatusColor } from '@mari-gunting/shared/theme';
import { useLocation } from '@/hooks/useLocation';

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
  
  // Parse opening time (database uses 'start' and 'end', not 'open' and 'close')
  const [openHour, openMinute] = dayInfo.start.split(':').map(Number);
  const openTimeInMinutes = openHour * 60 + openMinute;
  
  // Parse closing time
  const [closeHour, closeMinute] = dayInfo.end.split(':').map(Number);
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
  
  const { location, getCurrentLocation, hasPermission } = useLocation();

  // Get user location on mount
  useEffect(() => {
    if (hasPermission) {
      getCurrentLocation();
    }
  }, [hasPermission, getCurrentLocation]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['barbershops', location?.latitude, location?.longitude, filters.distance],
    queryFn: ({ pageParam = 1 }) => api.getBarbershops({
      location: location
        ? {
            lat: location.latitude,
            lng: location.longitude,
            radius: filters.distance,
          }
        : undefined,
      page: pageParam,
      limit: 30,
    }),
    getNextPageParam: (lastPage) => {
      if (lastPage.data?.hasMore) {
        return (lastPage.data?.page || 0) + 1;
      }
      return undefined;
    },
    enabled: !!location,
  });

  // Flatten paginated data
  const barbershops = data?.pages.flatMap(page => page.data?.data || []) || [];

  // Apply filters
  let filteredBarbershops = barbershops;

  // Filter by distance (max 20km)
  filteredBarbershops = filteredBarbershops.filter(shop => 
    (shop.distance || 0) <= filters.distance
  );

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

  // Check if any filters are active (distance at 20km is default, not active)
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
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Barbershops</Text>
        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons 
            name="options-outline" 
            size={24} 
            color={hasActiveFilters ? Colors.primary : Colors.text.primary} 
          />
          {hasActiveFilters && <View style={styles.filterBadge} />}
        </TouchableOpacity>
      </View>


      {/* Shop Count */}
      <View style={styles.countSection}>
        <View style={styles.countBadge}>
          <Ionicons name="storefront" size={16} color={Colors.primary} />
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
      <FlatList
        data={sortedBarbershops}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BarbershopCard shop={item} />}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          isLoading ? (
            // Skeleton Loading Cards
            <View>
              {[1, 2, 3, 4].map((item) => (
                <View key={item} style={styles.shopCard}>
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.logoContainer}>
                      <SkeletonBase width={64} height={64} borderRadius={12} />
                    </View>
                    <View style={styles.headerInfo}>
                      <SkeletonText width="70%" height={16} style={{ marginBottom: 8 }} />
                      <SkeletonText width="50%" height={13} />
                    </View>
                    <SkeletonBase width={10} height={10} borderRadius={5} />
                  </View>
                  
                  {/* Quick Info */}
                  <View style={styles.quickInfo}>
                    <SkeletonBase width={100} height={32} borderRadius={8} />
                    <SkeletonBase width={100} height={32} borderRadius={8} />
                  </View>
                  
                  {/* Services Preview */}
                  <View style={styles.servicesPreview}>
                    <SkeletonBase width={80} height={28} borderRadius={14} style={{ marginRight: 8 }} />
                    <SkeletonBase width={90} height={28} borderRadius={14} style={{ marginRight: 8 }} />
                    <SkeletonBase width={85} height={28} borderRadius={14} />
                  </View>
                  
                  {/* Bottom Section */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    <View>
                      <SkeletonText width={60} height={12} style={{ marginBottom: 4 }} />
                      <SkeletonText width={80} height={20} />
                    </View>
                    <SkeletonBase width={120} height={36} borderRadius={12} />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="storefront-outline" size={64} color={Colors.gray[300]} />
              <Text style={styles.emptyTitle}>No barbershops found</Text>
              <Text style={styles.emptyText}>Try adjusting your filters</Text>
            </View>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.loadingFooter}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading more...</Text>
            </View>
          ) : null
        }
      />

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
  const lowestPrice = shop.services && shop.services.length > 0 
    ? Math.min(...shop.services.map((s: any) => s.price))
    : 0;
  
  // Check if shop is currently open
  const isOpen = shop.detailedHours ? isShopOpenNow(shop.detailedHours) : false;
  
  // Get today's hours for display
  const getCurrentDayHours = () => {
    if (!shop.detailedHours) return null;
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const currentDay = days[new Date().getDay()];
    const dayInfo = shop.detailedHours[currentDay];
    return dayInfo;
  };
  
  const todayHours = getCurrentDayHours();
  
  return (
    <TouchableOpacity
      style={styles.shopCard}
      onPress={() => router.push(`/barbershop/${shop.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        {/* Left: Logo */}
        <Image source={{ uri: shop.logo }} style={styles.shopLogo} />
        
        {/* Middle: Info */}
        <View style={styles.shopInfo}>
          {/* Name + Verified */}
          <View style={styles.nameRow}>
            <Text style={styles.shopName} numberOfLines={1}>
              {shop.name}
            </Text>
            {shop.isVerified && (
              <Ionicons name="shield-checkmark" size={16} color={Colors.info} style={{ marginLeft: 4 }} />
            )}
          </View>
          
          {/* Rating + Reviews + Bookings */}
          <View style={styles.metaRow}>
            <Ionicons name="star" size={14} color="#FBBF24" />
            <Text style={styles.ratingText}>{shop.rating.toFixed(1)}</Text>
            <Text style={styles.metaText}>({shop.reviewsCount || 0} reviews)</Text>
            <Text style={styles.metaDivider}>•</Text>
            <Text style={styles.metaText}>{shop.bookingsCount || 0} bookings</Text>
          </View>
          
          {/* Open/Closed Status + Distance */}
          <View style={styles.statusDistanceRow}>
            {/* Open/Closed Badge */}
            {todayHours && (
              <View style={[styles.statusBadge, isOpen ? styles.statusOpen : styles.statusClosed]}>
                <View style={[styles.statusDot, isOpen ? styles.statusDotOpen : styles.statusDotClosed]} />
                <Text style={[styles.statusText, isOpen ? styles.statusTextOpen : styles.statusTextClosed]}>
                  {isOpen ? 'Open' : 'Closed'}
                </Text>
              </View>
            )}
            
            {/* Distance */}
            {shop.distance && (
              <View style={styles.distanceRow}>
                <Ionicons name="navigate" size={14} color={Colors.primary} />
                <Text style={styles.distanceText}>~{formatDistance(shop.distance)}</Text>
              </View>
            )}
          </View>
          
          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.startingFromLabel}>Starting from</Text>
            <Text style={[styles.priceValue, { color: '#F97316' }]}>
              {lowestPrice > 0 ? formatCurrency(lowestPrice) : '—'}
            </Text>
          </View>
        </View>
        
        {/* Right: Chevron */}
        <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: getStatusBackground("ready"),
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  countSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  resultCount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearFiltersText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  scrollContent: {
    padding: 20,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.gray[500],
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
    color: Colors.text.primary,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.gray[500],
  },
  shopCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  shopLogo: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
  },
  shopInfo: {
    flex: 1,
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
    marginLeft: 2,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.gray[500],
  },
  metaDivider: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.gray[300],
    marginHorizontal: 4,
  },
  statusDistanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusOpen: {
    backgroundColor: '#ECFDF5',
  },
  statusClosed: {
    backgroundColor: '#FEF2F2',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotOpen: {
    backgroundColor: '#10B981',
  },
  statusDotClosed: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusTextOpen: {
    color: '#059669',
  },
  statusTextClosed: {
    color: '#DC2626',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  startingFromLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.4,
  },
  quickInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.gray[100],
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
    color: Colors.gray[500],
  },
  opensHoursText: {
    color: Colors.warning,
    fontWeight: '600',
  },
  quickInfoDivider: {
    width: 1,
    height: 14,
    backgroundColor: Colors.gray[200],
    marginHorizontal: 8,
  },
  servicesPreview: {
    marginTop: 12,
    marginBottom: 12,
    gap: 8,
  },
  servicesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  serviceTagPlaceholder: {
    flex: 1,
    height: 36,
  },
  serviceTag: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  serviceTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray[700],
  },
  serviceTagPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  moreServicesTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.gray[100],
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[200],
    minWidth: 44,
  },
  moreServicesText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.gray[500],
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  priceSection: {
    gap: 2,
  },
  fromLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gray[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.2,
  },
});
