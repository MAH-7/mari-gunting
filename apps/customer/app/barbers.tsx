import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { formatCurrency, formatDistance } from '@/utils/format';
import { Barber } from '@/types';
import { SkeletonCircle, SkeletonText, SkeletonBase } from '@/components/Skeleton';
import { supabase } from '@mari-gunting/shared/config/supabase';
import { useLocation } from '@/hooks/useLocation';
import { batchCalculateDistances, formatDuration } from '@mari-gunting/shared/utils/directions';
import { ENV } from '@mari-gunting/shared/config/env';
import { useFocusEffect } from '@react-navigation/native';

export default function BarbersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [radius, setRadius] = useState(5);
  const [showRadiusModal, setShowRadiusModal] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'price-low' | 'price-high'>('distance');
  const [showSortModal, setShowSortModal] = useState(false);
  const [calculatingDistances, setCalculatingDistances] = useState(false);
  const queryClient = useQueryClient();
  const { location, getCurrentLocation, hasPermission } = useLocation();
  
  // Get user location on mount
  useEffect(() => {
    if (hasPermission) {
      getCurrentLocation();
    }
  }, [hasPermission, getCurrentLocation]);

  const { data: barbersResponse, isLoading, refetch } = useQuery({
    queryKey: ['barbers', radius, location?.latitude, location?.longitude],
    queryFn: () => api.getBarbers({
      isOnline: true,
      isAvailable: true,
      location: location ? {
        lat: location.latitude,
        lng: location.longitude,
        radius: radius,
      } : undefined,
    }),
    enabled: !!location, // Only fetch when location is available
    refetchOnMount: 'always', // Always refetch on mount
    refetchOnWindowFocus: false, // Disable auto-refetch, use real-time updates instead
    staleTime: 0, // No cache
    cacheTime: 0, // Don't keep in cache
  });

  // Refetch when screen comes into focus (after viewing barber profile)
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Available Barbers screen focused - refreshing list');
      // AGGRESSIVE: Remove all cached barber data
      queryClient.removeQueries({ queryKey: ['barbers'] });
      queryClient.invalidateQueries({ queryKey: ['barbers'] });
      refetch();
    }, [refetch, queryClient])
  );

  // Local state for real-time updates (Grab's pattern)
  const [realtimeBarbers, setRealtimeBarbers] = useState<typeof rawBarbers>([]);

  // Sync realtime state with query data
  useEffect(() => {
    if (barbersResponse?.data?.data) {
      setRealtimeBarbers(barbersResponse.data.data);
    }
  }, [barbersResponse]);

  // Real-time subscription for barber availability changes (Grab's pattern)
  useEffect(() => {
    console.log('🔌 Setting up real-time subscriptions (Grab pattern)...');
    
    // Subscribe to profiles table changes (is_online)
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          const affectedUserId = payload.new?.id;
          const newOnline = payload.new?.is_online;
          
          console.log(`⚡ Real-time: Barber ${affectedUserId} online: ${newOnline}`);
          
          // Update state directly (instant UI update!)
          setRealtimeBarbers(prev => {
            if (!newOnline) {
              // Barber went offline - remove immediately
              const filtered = prev.filter(b => b.id !== affectedUserId);
              console.log(`👋 Removed offline barber (${prev.length} → ${filtered.length})`);
              return filtered;
            } else {
              // Barber came online - need to refetch to add them
              console.log('✅ Barber came online - refetching to add...');
              queryClient.invalidateQueries({ queryKey: ['barbers'] });
            }
            return prev;
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 Profiles channel status:', status);
      });

    // Subscribe to barbers table changes (is_available)
    const barbersChannel = supabase
      .channel('barbers-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'barbers',
        },
        (payload) => {
          const affectedBarberId = payload.new?.id;
          const newAvailable = payload.new?.is_available;
          
          console.log(`⚡ Real-time: Barber ${affectedBarberId} available: ${newAvailable}`);
          
          // Update state directly (instant UI update!)
          setRealtimeBarbers(prev => {
            if (!newAvailable) {
              // Barber became unavailable - remove immediately
              const filtered = prev.filter(b => b.id !== affectedBarberId);
              console.log(`🚫 Removed unavailable barber (${prev.length} → ${filtered.length})`);
              return filtered;
            } else {
              // Barber became available - need to refetch to add them
              console.log('✅ Barber became available - refetching to add...');
              queryClient.invalidateQueries({ queryKey: ['barbers'] });
            }
            return prev;
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 Barbers channel status:', status);
      });

    // Subscribe to bookings table changes (active booking status changes)
    const bookingsChannel = supabase
      .channel('bookings-changes-barbers')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'bookings',
        },
        (payload) => {
          const newStatus = payload.new?.status;
          const oldStatus = (payload.old as any)?.status;
          const barberId = payload.new?.barber_id || (payload.old as any)?.barber_id;
          
          // Active booking statuses that make a barber busy
          const activeStatuses = ['accepted', 'on_the_way', 'arrived', 'in_progress'];
          const wasActive = oldStatus && activeStatuses.includes(oldStatus);
          const isActive = newStatus && activeStatuses.includes(newStatus);
          
          // Refetch if booking status changed to/from active
          if (wasActive !== isActive) {
            console.log(`⚡ Booking status changed for barber ${barberId}: ${oldStatus} → ${newStatus}`);
            console.log('🔄 Refetching barbers list...');
            queryClient.invalidateQueries({ queryKey: ['barbers'] });
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Bookings channel status:', status);
      });

    // Cleanup subscriptions on unmount
    return () => {
      console.log('🔌 Cleaning up subscriptions...');
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(barbersChannel);
      supabase.removeChannel(bookingsChannel);
    };
  }, []); // No dependencies - set up once!

  // Use realtime barbers instead of query data directly
  const rawBarbers = realtimeBarbers;
  
  // State to store calculated driving distances and durations
  const [barberRoutesInfo, setBarberRoutesInfo] = useState<Map<string, { distanceKm: number; durationMinutes: number }>>(new Map());
  
  // Calculate DRIVING distances for nearby barbers (already pre-filtered by PostGIS)
  useEffect(() => {
    if (!location || rawBarbers.length === 0) return;
    
    const calculateDrivingDistances = async () => {
      setCalculatingDistances(true);
      
      try {
        console.log(`🗺️ Calculating driving distances for ${rawBarbers.length} nearby barbers (pre-filtered by PostGIS)`);
        
        // Calculate actual driving distances for all barbers returned by PostGIS
        const destinations = rawBarbers.map(b => ({
          id: b.id,
          latitude: b.location.latitude,
          longitude: b.location.longitude,
        }));
        
        const routesMap = await batchCalculateDistances(
          location, 
          destinations, 
          ENV.MAPBOX_ACCESS_TOKEN || '',
          { 
            useCache: true, // Enable route caching
            supabase: supabase // Pass supabase client for cache access
          }
        );
        
        console.log(`✅ Calculated driving distances for ${routesMap.size} barbers`);
        setBarberRoutesInfo(routesMap);
      } catch (error) {
        console.error('❌ Error calculating driving distances:', error);
      } finally {
        setCalculatingDistances(false);
      }
    };
    
    calculateDrivingDistances();
  }, [rawBarbers, location, radius]);
  
  // Combine barbers with their driving distance info
  const barbers = useMemo(() => {
    return rawBarbers.map(barber => {
      const routeInfo = barberRoutesInfo.get(barber.id);
      return {
        ...barber,
        distance: routeInfo?.distanceKm, // DRIVING distance!
        durationMinutes: routeInfo?.durationMinutes,
      };
    });
  }, [rawBarbers, barberRoutesInfo]);

  const filteredBarbers = barbers.filter(barber => {
    const matchesSearch = !searchQuery || 
      barber.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      barber.specializations.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Solution A: Filter by DRIVING distance (matches what customer selected!)
    // Customer's search radius: barber must be within customer's chosen DRIVING radius
    const withinCustomerRadius = barber.distance !== undefined && barber.distance <= radius;
    
    // Barber's service radius: customer must be within barber's service area (also driving distance)
    const withinBarberServiceArea = barber.distance !== undefined && barber.distance <= barber.serviceRadiusKm;
    
    return matchesSearch && withinCustomerRadius && withinBarberServiceArea && barber.isOnline && barber.isAvailable;
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
        {calculatingDistances && (
          <View style={styles.calculatingBanner}>
            <ActivityIndicator size="small" color="#00B14F" />
            <Text style={styles.calculatingText}>Calculating driving distances...</Text>
          </View>
        )}
        
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
      onPress={() => router.push(`/barber/${barber.id}${barber.distance ? `?distance=${barber.distance}` : ''}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.cardInner}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: barber.avatar }} style={styles.avatar} />
          <View style={styles.onlineDot} />
        </View>
        
        <View style={styles.info}>
          {/* Section 1: Identity */}
          <View style={styles.identitySection}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {barber.name}
              </Text>
              {barber.isVerified && (
                <Ionicons name="checkmark-circle" size={18} color="#007AFF" />
              )}
            </View>
          </View>

          {/* Section Divider */}
          <View style={styles.sectionDivider} />

          {/* Section 2: Stats & Distance */}
          <View style={styles.statsSection}>
            <View style={styles.metaRow}>
              <Ionicons name="star" size={14} color="#FBBF24" />
              <Text style={styles.rating}>{barber.rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({barber.totalReviews} reviews)</Text>
              <Text style={styles.meta}>• {barber.completedJobs} jobs</Text>
            </View>

            {barber.distance && (
              <View style={styles.distanceRow}>
                <Ionicons name="navigate" size={14} color="#00B14F" />
                <Text style={styles.distanceText}>
                  {formatDistance(barber.distance)}
                  {barber.durationMinutes && ` • ~${formatDuration(barber.durationMinutes)}`}
                </Text>
              </View>
            )}
          </View>

          {/* Section Divider */}
          <View style={styles.sectionDivider} />

          {/* Section 3: Price */}
          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Starting from</Text>
            <Text style={styles.price}>
              {formatCurrency(lowestPrice)}
            </Text>
          </View>
        </View>
        
        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" style={styles.chevron} />
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
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardInner: {
    flexDirection: 'row',
    padding: 16,
    gap: 14,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00B14F',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  info: {
    flex: 1,
  },
  // Section 1: Identity
  identitySection: {
    paddingBottom: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  // Section Divider
  sectionDivider: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginVertical: 10,
  },
  // Section 2: Stats
  statsSection: {
    paddingBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  rating: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
    marginLeft: 2,
  },
  reviewCount: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
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
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#00B14F',
  },
  // Section 3: Price
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  priceLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00B14F',
    letterSpacing: -0.4,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chevron: {
    marginLeft: 8,
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
  calculatingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#00B14F30',
  },
  calculatingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#00B14F',
  },
});
