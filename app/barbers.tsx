import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { formatCurrency, formatDistance } from '@/utils/format';
import { Barber } from '@/types';
import { SkeletonCircle, SkeletonText, SkeletonBase } from '@/components/Skeleton';

export default function BarbersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [radius, setRadius] = useState(5);
  const [showRadiusModal, setShowRadiusModal] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'price-low' | 'price-high'>('distance');
  const [showSortModal, setShowSortModal] = useState(false);

  const { data: barbersResponse, isLoading } = useQuery({
    queryKey: ['barbers', radius],
    queryFn: () => api.getBarbers({
      radius: radius * 1000,
    }),
  });

  const barbers = barbersResponse?.data?.data || [];

  const filteredBarbers = barbers.filter(barber => {
    const matchesSearch = !searchQuery || 
      barber.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      barber.specializations.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const withinRadius = !barber.distance || barber.distance <= radius;
    
    return matchesSearch && withinRadius && barber.isOnline;
  });

  const sortedBarbers = [...filteredBarbers].sort((a, b) => {
    if (sortBy === 'distance') {
      return (a.distance || 999) - (b.distance || 999);
    } else if (sortBy === 'price-low') {
      const priceA = a.services[0]?.price || 999999;
      const priceB = b.services[0]?.price || 999999;
      return priceA - priceB;
    } else if (sortBy === 'price-high') {
      const priceA = a.services[0]?.price || 0;
      const priceB = b.services[0]?.price || 0;
      return priceB - priceA;
    }
    return 0;
  });

  const getSortLabel = () => {
    switch (sortBy) {
      case 'distance': return 'Nearest first';
      case 'price-low': return 'Price: Low to High';
      case 'price-high': return 'Price: High to Low';
      default: return 'Nearest first';
    }
  };

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
        <Text style={styles.headerTitle}>Available Barbers</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Location & Radius */}
      <View style={styles.locationSection}>
        <View style={styles.locationInfo}>
          <Ionicons name="location" size={16} color="#00B14F" />
          <Text style={styles.locationText}>Within {radius}km from you</Text>
        </View>
        <TouchableOpacity 
          style={styles.radiusButton}
          onPress={() => setShowRadiusModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.radiusButtonText}>Change</Text>
        </TouchableOpacity>
      </View>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultCount}>
          {sortedBarbers.length} available {sortedBarbers.length === 1 ? 'barber' : 'barbers'}
        </Text>
        <TouchableOpacity 
          style={styles.sortButton}
          onPress={() => setShowSortModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="swap-vertical" size={14} color="#00B14F" />
          <Text style={styles.sortButtonText}>{getSortLabel()}</Text>
        </TouchableOpacity>
      </View>

      {/* Barbers List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          // Skeleton Loading Cards
          <>
            {[1, 2, 3, 4].map((item) => (
              <View key={item} style={styles.card}>
                <View style={styles.cardInner}>
                  <SkeletonCircle size={72} />
                  <View style={styles.info}>
                    <View style={styles.topRow}>
                      <SkeletonText width="60%" height={15} />
                    </View>
                    <View style={styles.metaRow}>
                      <SkeletonBase width={50} height={13} borderRadius={6} style={{ marginTop: 6 }} />
                    </View>
                    <View style={styles.distanceRow}>
                      <SkeletonBase width={80} height={13} borderRadius={6} style={{ marginTop: 6 }} />
                    </View>
                    <View style={styles.bottom}>
                      <View>
                        <SkeletonText width={40} height={10} style={{ marginBottom: 4 }} />
                        <SkeletonText width={60} height={17} />
                      </View>
                      <SkeletonBase width={80} height={24} borderRadius={12} />
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </>
        ) : sortedBarbers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cut-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No barbers found</Text>
            <Text style={styles.emptyText}>Try adjusting your filters</Text>
          </View>
        ) : (
          sortedBarbers.map((barber) => (
            <BarberCard key={barber.id} barber={barber} />
          ))
        )}
      </ScrollView>

      {/* Sort Modal */}
      {showSortModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort By</Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <Ionicons name="close" size={24} color="#1C1C1E" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.sortOptions}>
              <TouchableOpacity
                style={[
                  styles.sortOption,
                  sortBy === 'distance' && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSortBy('distance');
                  setShowSortModal(false);
                }}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.radioCircle,
                  sortBy === 'distance' && styles.radioCircleActive,
                ]}>
                  {sortBy === 'distance' && <View style={styles.radioInner} />}
                </View>
                <View style={styles.sortOptionContent}>
                  <Ionicons name="navigate" size={20} color="#00B14F" />
                  <Text style={[
                    styles.sortOptionText,
                    sortBy === 'distance' && styles.sortOptionTextActive,
                  ]}>
                    Nearest first
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sortOption,
                  sortBy === 'price-low' && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSortBy('price-low');
                  setShowSortModal(false);
                }}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.radioCircle,
                  sortBy === 'price-low' && styles.radioCircleActive,
                ]}>
                  {sortBy === 'price-low' && <View style={styles.radioInner} />}
                </View>
                <View style={styles.sortOptionContent}>
                  <Ionicons name="arrow-down" size={20} color="#00B14F" />
                  <Text style={[
                    styles.sortOptionText,
                    sortBy === 'price-low' && styles.sortOptionTextActive,
                  ]}>
                    Price: Low to High
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sortOption,
                  sortBy === 'price-high' && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSortBy('price-high');
                  setShowSortModal(false);
                }}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.radioCircle,
                  sortBy === 'price-high' && styles.radioCircleActive,
                ]}>
                  {sortBy === 'price-high' && <View style={styles.radioInner} />}
                </View>
                <View style={styles.sortOptionContent}>
                  <Ionicons name="arrow-up" size={20} color="#00B14F" />
                  <Text style={[
                    styles.sortOptionText,
                    sortBy === 'price-high' && styles.sortOptionTextActive,
                  ]}>
                    Price: High to Low
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Radius Selection Modal */}
      {showRadiusModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Search Radius</Text>
              <TouchableOpacity onPress={() => setShowRadiusModal(false)}>
                <Ionicons name="close" size={24} color="#1C1C1E" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.radiusOptions}>
              {[5, 10, 15, 20].map((km) => (
                <TouchableOpacity
                  key={km}
                  style={[
                    styles.radiusOption,
                    radius === km && styles.radiusOptionActive,
                  ]}
                  onPress={() => {
                    setRadius(km);
                    setShowRadiusModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.radioCircle,
                    radius === km && styles.radioCircleActive,
                  ]}>
                    {radius === km && <View style={styles.radioInner} />}
                  </View>
                  <Text style={[
                    styles.radiusOptionText,
                    radius === km && styles.radiusOptionTextActive,
                  ]}>
                    {km} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalNote}>
              Showing available barbers within selected radius from your location
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function BarberCard({ barber }: { barber: Barber }) {
  // Calculate the lowest price from all services
  const lowestPrice = barber.services.length > 0 
    ? Math.min(...barber.services.map(s => s.price))
    : 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/barber/${barber.id}` as any)}
      activeOpacity={0.6}
    >
      <View style={styles.cardInner}>
        <Image source={{ uri: barber.avatar }} style={styles.avatar} />
        
        <View style={styles.info}>
          <View style={styles.topRow}>
            <Text style={styles.name} numberOfLines={1}>
              {barber.name}
            </Text>
            {barber.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
            )}
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="star" size={12} color="#FBBF24" />
            <Text style={styles.rating}>{barber.rating.toFixed(1)}</Text>
            <Text style={styles.meta}>• {barber.completedJobs} jobs</Text>
          </View>

          {barber.distance && (
            <View style={styles.distanceRow}>
              <Ionicons name="navigate" size={14} color="#00B14F" />
              <Text style={styles.distanceText}>{formatDistance(barber.distance)} away</Text>
            </View>
          )}

          <View style={styles.bottom}>
            <View>
              <Text style={styles.priceLabel}>From</Text>
              <Text style={styles.price}>
                {formatCurrency(lowestPrice)}
              </Text>
            </View>
            {barber.isOnline && (
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Available</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.4,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F0FDF4',
    borderBottomWidth: 0.5,
    borderBottomColor: '#00B14F30',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#00B14F',
  },
  radiusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#00B14F',
    borderRadius: 12,
  },
  radiusButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
  },
  resultCount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#00B14F30',
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#00B14F',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 4,
  },
  loadingState: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '400',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardInner: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  rating: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 2,
  },
  meta: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '400',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#00B14F',
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '400',
    marginBottom: 2,
  },
  price: {
    fontSize: 17,
    fontWeight: '700',
    color: '#00B14F',
    letterSpacing: -0.3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    gap: 3,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#00B14F',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#00B14F',
  },
  // Sort Modal styles
  sortOptions: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    gap: 12,
  },
  sortOptionActive: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#00B14F',
  },
  sortOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sortOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  sortOptionTextActive: {
    fontWeight: '600',
    color: '#00B14F',
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  radiusOptions: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  radiusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    gap: 12,
  },
  radiusOptionActive: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#00B14F',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#00B14F',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00B14F',
  },
  radiusOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  radiusOptionTextActive: {
    fontWeight: '600',
    color: '#00B14F',
  },
  modalNote: {
    fontSize: 13,
    color: '#8E8E93',
    paddingHorizontal: 20,
    paddingTop: 16,
    lineHeight: 18,
  },
});
