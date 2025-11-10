import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { formatCurrency, formatDistance, formatTime } from '@mari-gunting/shared/utils/format';
import { Barbershop } from '@/types';
import FilterModal, { FilterOptions } from '@/components/FilterModal';
import { SkeletonCircle, SkeletonText, SkeletonBase } from '@/components/Skeleton';
import { Colors, theme, getStatusBackground, getStatusColor } from '@mari-gunting/shared/theme';

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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          // Skeleton Loading Cards
          <>
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
          </>
        ) : sortedBarbershops.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={64} color={Colors.gray[300]} />
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
  
  // Get current day's operating hours
  const getCurrentDayHours = () => {
    if (!shop.detailedHours) return shop.operatingHours;
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayShortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDay = getCurrentDay();
    const dayInfo = shop.detailedHours[currentDay];
    
    // If closed today, find next open day
    if (!dayInfo || !dayInfo.isOpen) {
      const currentDayIndex = days.indexOf(currentDay);
      
      // Check next 7 days for when shop opens
      for (let i = 1; i <= 7; i++) {
        const nextDayIndex = (currentDayIndex + i) % 7;
        const nextDay = days[nextDayIndex];
        const nextDayInfo = shop.detailedHours[nextDay];
        
        if (nextDayInfo && nextDayInfo.isOpen) {
          // Use shorter format to prevent overflow
          if (i === 1) {
            return `Tomorrow ${formatTime(nextDayInfo.open)}`;
          } else {
            return `${dayShortNames[nextDayIndex]} ${formatTime(nextDayInfo.open)}`;
          }
        }
      }
      
      return 'Closed';
    }
    
    return `${formatTime(dayInfo.open)} - ${formatTime(dayInfo.close)}`;
  };
  
  const todayHours = getCurrentDayHours();
  
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
                <Ionicons name="shield-checkmark" size={12} color={Colors.info} />
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
                  <Ionicons name="navigate" size={11} color={Colors.primary} />
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
          <Ionicons 
            name="time-outline" 
            size={14} 
            color={todayHours.startsWith('Tomorrow') || todayHours.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/) ? Colors.warning : Colors.gray[500]} 
          />
          <Text 
            style={[
              styles.quickInfoText,
              (todayHours.startsWith('Tomorrow') || todayHours.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/)) && styles.opensHoursText
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {todayHours}
          </Text>
        </View>
        <View style={styles.quickInfoDivider} />
        <View style={styles.quickInfoItem}>
          <Ionicons name="people-outline" size={14} color={Colors.gray[500]} />
          <Text style={styles.quickInfoText} numberOfLines={1}>{shop.bookingsCount}+ bookings</Text>
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
          <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
        </View>
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
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.gray[100],
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
    backgroundColor: Colors.backgroundSecondary,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
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
    color: Colors.text.primary,
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
    color: Colors.text.primary,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.gray[300],
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.gray[500],
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  openBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: getStatusBackground("ready"),
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.gray[100],
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
