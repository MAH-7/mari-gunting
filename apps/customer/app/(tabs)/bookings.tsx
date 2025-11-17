import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, StyleSheet, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { formatPrice, formatShortDate, formatTime, formatLocalDate, formatLocalTime } from '@mari-gunting/shared/utils/format';
import { Booking, BookingStatus } from '@/types';
import BookingFilterModal, { BookingFilterOptions } from '@/components/BookingFilterModal';
import { SkeletonCircle, SkeletonText, SkeletonBase } from '@/components/Skeleton';
import { bookingService } from '@mari-gunting/shared/services/bookingService';
import { supabase } from '@mari-gunting/shared/config/supabase';
import { curlecService } from '@mari-gunting/shared/services/curlecService';
import RazorpayCheckout from 'react-native-razorpay';
import { Colors, theme, getStatusBackground, getStatusColor } from '@mari-gunting/shared/theme';

export default function BookingsScreen() {
  const currentUser = useStore((state) => state.currentUser);
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed'>('active');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Applied filters
  const [filters, setFilters] = useState<BookingFilterOptions>({
    sortBy: 'date',
    filterStatus: 'all',
  });

  // Fetch bookings with infinite query (Grab standard: 20 per page)
  const { data, isLoading, error, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } = useInfiniteQuery({
    queryKey: ['customer-bookings', currentUser?.id, selectedTab],
    enabled: !!currentUser?.id,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      if (!currentUser?.id) return { success: false, data: [], offset: 0 };
      
      // Map tab to database statuses
      const statusFilter = selectedTab === 'active' 
        ? 'pending,accepted,confirmed,ready,on_the_way,arrived,in_progress'
        : 'completed,cancelled,rejected,expired';
      
      // Load 20 at a time
      const result = await bookingService.getCustomerBookings(
        currentUser.id,
        statusFilter,
        20,
        pageParam
      );
      return { ...result, offset: pageParam };
    },
    getNextPageParam: (lastPage) => {
      if (lastPage?.success && Array.isArray(lastPage.data) && lastPage.data.length === 20) {
        return (lastPage.offset || 0) + 20;
      }
      return undefined;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  });
  
  // Flatten and dedupe pages
  const bookings = useMemo(() => {
    const pages = data?.pages ?? [];
    const merged: any[] = [];
    const seen = new Set<string>();
    for (const page of pages) {
      for (const booking of page?.data ?? []) {
        if (!seen.has(booking.id)) {
          seen.add(booking.id);
          merged.push(booking);
        }
      }
    }
    return merged;
  }, [data]);

  // Helper to check if status belongs to active tab
  const isActiveStatus = (status: string) => {
    const activeStatuses = ['pending', 'accepted', 'confirmed', 'ready', 'on_the_way', 'arrived', 'in_progress'];
    return activeStatuses.includes(status);
  };

  // Real-time subscription for customer's bookings (SMART: only resets when needed)
  useEffect(() => {
    if (!currentUser?.id) return;

    console.log('🔌 Setting up real-time subscription for customer bookings');

    const channel = supabase
      .channel(`customer-bookings-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'bookings',
          filter: `customer_id=eq.${currentUser.id}`,
        },
        (payload) => {
          console.log('🔔 Customer booking change:', payload);
          
          // Check if booking moved between tabs
          const oldData = payload.old as any;
          const newData = payload.new as any;
          
          let needsReset = false;
          
          if (payload.eventType === 'INSERT') {
            console.log('✨ New booking created');
            // New booking: only reset if it belongs to current tab
            needsReset = (selectedTab === 'active' && isActiveStatus(newData?.status)) ||
                        (selectedTab === 'completed' && !isActiveStatus(newData?.status));
          } else if (payload.eventType === 'UPDATE' && oldData?.status !== newData?.status) {
            console.log(`🔄 Booking status changed: ${oldData?.status} → ${newData?.status}`);
            
            // Status changed: check if it crossed tab boundaries
            const wasActive = isActiveStatus(oldData?.status);
            const isActive = isActiveStatus(newData?.status);
            
            if (wasActive !== isActive) {
              // Booking moved between tabs - reset both tabs
              console.log('⚠️ Booking crossed tab boundary - resetting');
              needsReset = true;
            } else {
              // Stayed in same tab - just invalidate cache
              console.log('✅ Booking updated within same tab - invalidating cache');
            }
          }
          
          if (needsReset) {
            // Reset pagination for affected tab
            queryClient.resetQueries({ queryKey: ['customer-bookings', currentUser.id, selectedTab] });
          } else {
            // Just invalidate to refetch current pages
            queryClient.invalidateQueries({ queryKey: ['customer-bookings', currentUser.id, selectedTab] });
          }
          
          // Always invalidate counts
          queryClient.invalidateQueries({ queryKey: ['customer-booking-counts'] });
        }
      )
      .subscribe((status) => {
        console.log('📡 Customer bookings subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to customer bookings');
        }
      });

    return () => {
      console.log('🔌 Cleaning up customer bookings subscription');
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, selectedTab, queryClient]);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.resetQueries({ queryKey: ['customer-bookings', currentUser?.id, selectedTab] });
    } catch (error) {
      console.error('❌ Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // INFINITE SCROLL: Load more when scrolling to bottom
  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      console.log('📄 Loading more bookings...');
      fetchNextPage();
    }
  };

  // GRAB STANDARD: Fetch counts for both tabs (lightweight, always accurate)
  const { data: countsData } = useQuery({
    queryKey: ['customer-booking-counts', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return { active: 0, completed: 0 };
      const result = await bookingService.getCustomerBookingCounts(currentUser.id);
      return result.success ? result.data : { active: 0, completed: 0 };
    },
    enabled: !!currentUser?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnMount: true,
  });

  const activeCount = countsData?.active || 0;
  const completedCount = countsData?.completed || 0;

  // Apply additional filters (status, sort) - MEMOIZED for performance
  const displayBookings = useMemo(() => {
    let filteredBookings = bookings; // Already filtered by database!
    
    // Filter by status
    if (filters.filterStatus !== 'all') {
      filteredBookings = filteredBookings.filter((b: any) => b.status === filters.filterStatus);
    }
    
    // Sort bookings
    const sortedBookings = [...filteredBookings].sort((a: any, b: any) => {
      if (filters.sortBy === 'date') {
        // Sort by scheduled date/time
        const aDate = new Date(`${a.scheduled_date}T${a.scheduled_time || '00:00'}`);
        const bDate = new Date(`${b.scheduled_date}T${b.scheduled_time || '00:00'}`);
        return bDate.getTime() - aDate.getTime();
      } else if (filters.sortBy === 'price') {
        return (b.total_price || 0) - (a.total_price || 0);
      } else {
        // Sort by status - logical progression order
        const statusOrder: Record<BookingStatus, number> = {
          'in-progress': 1,
          'on-the-way': 2,
          'ready': 3,
          'confirmed': 4,
          'accepted': 5,
          'pending': 6,
          'completed': 7,
          'cancelled': 8,
        };
        return (statusOrder[a.status as BookingStatus] || 99) - (statusOrder[b.status as BookingStatus] || 99);
      }
    });
    
    return sortedBookings;
  }, [bookings, filters.filterStatus, filters.sortBy]);
  
  const hasActiveFilters = filters.sortBy !== 'date' || filters.filterStatus !== 'all';

  // Memoized callbacks for FlatList optimization
  const renderItem = useCallback(({ item }: { item: any }) => (
    <BookingCard booking={item} />
  ), []);

  const keyExtractor = useCallback((item: any) => item.id, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
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

      {/* Filter Modal - Consistent with Barbershop screen */}
      <BookingFilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={(newFilters) => setFilters(newFilters)}
        currentFilters={filters}
        showStatusFilter={true}
        isHistoryTab={selectedTab === 'completed'}
      />

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'active' && styles.tabActive]}
          onPress={() => {
            setSelectedTab('active');
            // Reset status filter when switching tabs
            if (filters.filterStatus !== 'all') {
              setFilters({ ...filters, filterStatus: 'all' });
            }
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, selectedTab === 'active' && styles.tabTextActive]}>
            Active
          </Text>
          {selectedTab === 'active' && activeCount > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{activeCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'completed' && styles.tabActive]}
          onPress={() => {
            setSelectedTab('completed');
            // Reset status filter when switching tabs
            if (filters.filterStatus !== 'all') {
              setFilters({ ...filters, filterStatus: 'all' });
            }
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, selectedTab === 'completed' && styles.tabTextActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List - FlatList for virtualization */}
      <FlatList
        data={displayBookings}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            // Skeleton Loading Cards
            <View>
              {[1, 2, 3].map((item) => (
              <View key={item} style={styles.bookingCard}>
                {/* Status Bar Skeleton */}
                <View style={[styles.statusBar, { backgroundColor: Colors.gray[100] }]}>
                  <SkeletonBase width={100} height={20} borderRadius={10} />
                  <SkeletonBase width={50} height={16} borderRadius={8} />
                </View>
                
                {/* Progress Bar Skeleton */}
                <View style={styles.progressContainer}>
                  <SkeletonBase width="100%" height={4} borderRadius={2} />
                </View>
                
                {/* Card Content */}
                <View style={styles.cardContent}>
                  {/* Barber Row Skeleton */}
                  <View style={styles.barberRow}>
                    <SkeletonCircle size={56} />
                    <View style={styles.barberInfo}>
                      <SkeletonText width="60%" height={18} style={{ marginBottom: 6 }} />
                      <SkeletonText width="40%" height={14} />
                    </View>
                  </View>
                  
                  {/* Services Section Skeleton */}
                  <View style={styles.servicesSection}>
                    <SkeletonText width={60} height={12} style={{ marginBottom: 10 }} />
                    <View style={styles.serviceRow}>
                      <SkeletonText width="50%" height={14} />
                      <SkeletonText width={60} height={14} />
                    </View>
                    <View style={styles.serviceRow}>
                      <SkeletonText width="45%" height={14} />
                      <SkeletonText width={60} height={14} />
                    </View>
                  </View>
                  
                  {/* Details Section Skeleton */}
                  <View style={styles.detailsSection}>
                    <View style={styles.detailRow}>
                      <SkeletonBase width={32} height={32} borderRadius={8} />
                      <SkeletonText width="70%" height={14} style={{ marginLeft: 8 }} />
                    </View>
                    <View style={styles.detailRow}>
                      <SkeletonBase width={32} height={32} borderRadius={8} />
                      <SkeletonText width="65%" height={14} style={{ marginLeft: 8 }} />
                    </View>
                  </View>
                  
                  {/* Footer Skeleton */}
                  <View style={styles.footer}>
                    <View style={styles.totalSection}>
                      <SkeletonText width={40} height={12} style={{ marginBottom: 4 }} />
                      <SkeletonText width={80} height={20} />
                    </View>
                    <SkeletonBase width={80} height={36} borderRadius={12} />
                  </View>
                </View>
              </View>
              ))}
            </View>
          ) : error ? (
            <View style={styles.emptyState}>
              <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
              <Text style={styles.emptyTitle}>Failed to load bookings</Text>
              <Text style={styles.emptySubtext}>
                Please check your connection and try again
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons 
                name={selectedTab === 'active' ? 'clipboard-outline' : 'checkmark-done-circle'} 
                size={64} 
                color={Colors.gray[300]}
              />
              <Text style={styles.emptyTitle}>
                {selectedTab === 'active' ? 'No active bookings' : 'No booking history'}
              </Text>
              <Text style={styles.emptySubtext}>
                {selectedTab === 'active' 
                  ? 'Book a barber to get started' 
                  : 'Completed bookings will appear here'}
              </Text>
              {selectedTab === 'active' && (
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => router.push('/(tabs)' as any)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyButtonText}>Find Barber</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
        ListFooterComponent={
          isFetchingNextPage && hasNextPage ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingMoreText}>Loading more...</Text>
            </View>
          ) : !hasNextPage && displayBookings.length > 0 ? (
            <View style={styles.endOfList}>
              <Text style={styles.endOfListText}>No more bookings</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const BookingCard = React.memo(function BookingCard({ booking }: { booking: any }) {
  const currentUser = useStore((state) => state.currentUser);
  const queryClient = useQueryClient();
  const [isCancelling, setIsCancelling] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Helper to display user-friendly payment method names
  const getPaymentMethodDisplay = (method: string) => {
    const methods: Record<string, string> = {
      'curlec_card': 'Card',
      'curlec_fpx': 'FPX',
      'cash': 'Cash',
      'ewallet': 'E-Wallet',
      'curlec': 'Card', // Fallback for old data
    };
    return methods[method] || method;
  };
  
  
  // Map database booking to UI format
  const mappedBooking: Booking = {
    id: booking.id,
    status: booking.status,
    totalPrice: booking.total_price,
    scheduledDate: booking.scheduled_date,
    scheduledTime: booking.scheduled_time,
    createdAt: booking.created_at,
    bookingNumber: booking.booking_number,
    paymentMethod: booking.payment_method,
    barber: booking.barber_name ? {
      id: booking.barber_id,
      name: booking.barber_name,
      avatar: booking.barber_avatar || 'https://via.placeholder.com/150',
      rating: booking.barber_rating || 0,
      totalReviews: booking.barber_total_reviews || 0,
      completedJobs: booking.barber_completed_jobs || 0,
      isVerified: booking.barber_is_verified || false,
    } : undefined,
    services: booking.services || [],
    address: booking.customer_address ? {
      fullAddress: `${booking.customer_address.line1}, ${booking.customer_address.city}`,
      ...booking.customer_address,
    } : undefined,
    review: booking.review_id ? { id: booking.review_id } : undefined,
  };

  const getStatusConfig = (status: BookingStatus) => {
    const configs = {
      pending: { 
        color: Colors.gray[500], 
        bg: Colors.gray[100], 
        label: 'Pending',
        iconName: 'time-outline' as const,
        progress: 25
      },
      accepted: { 
        color: Colors.info, 
        bg: Colors.infoLight, 
        label: 'Accepted',
        iconName: 'checkmark-circle' as const,
        progress: 40
      },
      confirmed: { 
        color: '#06B6D4', 
        bg: '#CFFAFE', 
        label: 'Confirmed',
        iconName: 'checkmark-done-circle' as const,
        progress: 50
      },
      ready: { 
        color: '#14B8A6', 
        bg: '#CCFBF1', 
        label: 'Ready',
        iconName: 'checkmark-done' as const,
        progress: 60
      },
      'on-the-way': {
        color: '#6366F1', 
        bg: '#E0E7FF', 
        label: 'On The Way',
        iconName: 'car' as const,
        progress: 65
      },
      on_the_way: {
        color: '#6366F1', 
        bg: '#E0E7FF', 
        label: 'On The Way',
        iconName: 'car' as const,
        progress: 65
      },
      arrived: { 
        color: Colors.status.expired, 
        bg: '#FFEDD5', 
        label: 'Arrived',
        iconName: 'location' as const,
        progress: 80
      },
      'in-progress': { 
        color: '#0EA5E9', 
        bg: '#E0F2FE', 
        label: 'In Progress',
        iconName: 'cut' as const,
        progress: 90
      },
      in_progress: { 
        color: '#0EA5E9', 
        bg: '#E0F2FE', 
        label: 'In Progress',
        iconName: 'cut' as const,
        progress: 90
      },
      completed: { 
        color: Colors.success, 
        bg: Colors.successLight, 
        label: 'Completed',
        iconName: 'checkmark-circle' as const,
        progress: 100
      },
      cancelled: { 
        color: Colors.error, 
        bg: Colors.errorLight, 
        label: 'Cancelled',
        iconName: 'close-circle' as const,
        progress: 0
      },
      rejected: { 
        color: '#DC2626', 
        bg: Colors.errorLight, 
        label: 'Declined',
        iconName: 'close-circle-outline' as const,
        progress: 0
      },
      expired: { 
        color: Colors.status.expired, 
        bg: getStatusBackground("expired"), 
        label: 'Expired',
        iconName: 'time-outline' as const,
        progress: 0
      },
    };
    return configs[status] || configs.pending;
  };

  const statusConfig = getStatusConfig(mappedBooking.status);

  return (
    <TouchableOpacity
      style={styles.bookingCard}
      onPress={() => router.push(`/booking/${mappedBooking.id}` as any)}
      activeOpacity={0.95}
    >
      {/* Status Bar */}
      <View style={[styles.statusBar, { backgroundColor: statusConfig.bg }]}>
        <View style={styles.statusLeft}>
          <Ionicons name={statusConfig.iconName} size={18} color={statusConfig.color} style={styles.statusIcon} />
          <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
        <Text style={styles.bookingId}>#{mappedBooking.bookingNumber || mappedBooking.id.slice(-4).toUpperCase()}</Text>
      </View>

      {/* Progress Indicator */}
      {!['cancelled', 'completed', 'rejected', 'expired'].includes(mappedBooking.status) && (
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View 
              style={[
                styles.progressBar, 
                { 
                  width: `${statusConfig.progress}%`,
                  backgroundColor: statusConfig.color 
                }
              ]} 
            />
          </View>
        </View>
      )}

      {/* Content */}
      <View style={styles.cardContent}>
        {/* Barber Row */}
        {mappedBooking.barber && (
          <View style={styles.barberRow}>
            <View style={styles.barberAvatarContainer}>
              <Image
                source={{ uri: mappedBooking.barber.avatar }}
                style={styles.barberAvatar}
              />
              {/* Show green dot only for active bookings */}
              {['accepted', 'on_the_way', 'on-the-way', 'arrived', 'in_progress', 'in-progress'].includes(mappedBooking.status) && (
                <View style={styles.barberOnlineDot} />
              )}
            </View>
            <View style={styles.barberInfo}>
              <View style={styles.barberNameRow}>
                <Text style={styles.barberName} numberOfLines={1}>{mappedBooking.barber.name}</Text>
                {mappedBooking.barber.isVerified && (
                  <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
                )}
              </View>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#FBBF24" style={styles.starIcon} />
                <Text style={styles.ratingText}>{mappedBooking.barber.rating.toFixed(1)}</Text>
                <Text style={styles.reviewsText}>({mappedBooking.barber.totalReviews || 0} reviews)</Text>
                <Text style={styles.jobsTextSeparator}>•</Text>
                <Text style={styles.jobsText}>{mappedBooking.barber.completedJobs} jobs</Text>
              </View>
            </View>
          </View>
        )}

        {/* Services */}
        {mappedBooking.services && mappedBooking.services.length > 0 && (
          <View style={styles.servicesSection}>
            <Text style={styles.sectionLabel}>Services</Text>
            {mappedBooking.services.map((service: any, index: number) => (
              <View key={index} style={styles.serviceRow}>
                <View style={styles.serviceLeft}>
                  <View style={styles.serviceDot} />
                  <Text style={styles.serviceName}>{service.name}</Text>
                </View>
                <Text style={styles.servicePrice}>{formatPrice(service.price)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Date & Location */}
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="calendar" size={16} color={Colors.gray[500]} />
            </View>
            <Text style={styles.detailText}>
              {booking.scheduled_datetime ? 
                `${formatLocalDate(booking.scheduled_datetime)} at ${formatLocalTime(booking.scheduled_datetime)}` :
                mappedBooking.scheduledDate && mappedBooking.scheduledTime ? 
                  `${formatLocalDate(mappedBooking.scheduledDate)} at ${formatTime(mappedBooking.scheduledTime)}` : 
                  'Date not set'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="location" size={16} color={Colors.gray[500]} />
            </View>
            <Text style={styles.detailText} numberOfLines={1}>
              {mappedBooking.address?.fullAddress || 'Address not set'}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {/* Total Section - Full Width */}
          <View style={styles.totalSectionFull}>
            <View style={styles.totalRowInline}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(mappedBooking.totalPrice || 0)}</Text>
            </View>
            {/* Payment Method Badge */}
            <View style={styles.paymentMethodBadgeSmall}>
              <Ionicons 
                name={mappedBooking.paymentMethod === 'cash' ? 'cash-outline' : 'card-outline'} 
                size={12} 
                color={mappedBooking.paymentMethod === 'cash' ? Colors.warning : Colors.primary} 
              />
              <Text style={styles.paymentMethodTextSmall}>
                {getPaymentMethodDisplay(mappedBooking.paymentMethod || 'cash')}
              </Text>
            </View>
          </View>
          
          {/* Track Button for On The Way */}
          {(mappedBooking.status === 'on_the_way' || mappedBooking.status === 'on-the-way' || mappedBooking.status === 'arrived') && (
            <TouchableOpacity 
              style={styles.trackButton}
              onPress={() => router.push(`/booking/track-barber?bookingId=${mappedBooking.id}` as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="navigate" size={16} color={Colors.white} />
              <Text style={styles.trackButtonText}>Track</Text>
            </TouchableOpacity>
          )}
          
          {/* Action Buttons Row */}
          {(mappedBooking.status === 'pending' || mappedBooking.status === 'accepted') && (
            <View style={styles.actionButtonsRow}>
              {/* Complete Payment Button - Show for accepted bookings with pending payment */}
              {mappedBooking.status === 'accepted' && (booking.payment_status === 'pending' || booking.payment_status === 'pending_payment') ? (
            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonPrimary]} 
              activeOpacity={0.8}
              disabled={isProcessingPayment}
              onPress={async () => {
                if (!currentUser?.id) return;
                
                setIsProcessingPayment(true);
                try {
                  // Create Curlec order for this booking
                  const order = await curlecService.createOrder({
                    amount: booking.total_price,
                    receipt: `booking_${booking.booking_number}`,
                    notes: {
                      customer_id: currentUser.id,
                      barber_id: booking.barber_id,
                      booking_id: booking.id,
                      payment_method: booking.payment_method || 'card',
                    },
                  });

                  // Get user profile for payment prefill
                  const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, email, phone_number')
                    .eq('id', currentUser.id)
                    .single();

                  // Prepare checkout options
                  const checkoutOptions = curlecService.prepareCheckoutOptions(order, {
                    customerName: profile?.full_name,
                    customerEmail: profile?.email,
                    customerContact: profile?.phone_number,
                    description: `Booking #${booking.booking_number}`,
                    bookingId: booking.id,
                    barberId: booking.barber_id,
                    customerId: currentUser.id,
                    serviceName: 'Barber Services',
                  });

                  // Open payment popup
                  RazorpayCheckout.open(checkoutOptions)
                    .then(async (data: any) => {
                      // Payment successful - link to booking
                      const verified = await curlecService.verifyPayment({
                        razorpay_order_id: data.razorpay_order_id,
                        razorpay_payment_id: data.razorpay_payment_id,
                        razorpay_signature: data.razorpay_signature,
                      });

                      if (!verified) {
                        throw new Error('Payment verification failed');
                      }

                      // Link payment to booking
                      const linkResult = await bookingService.linkPaymentToBooking(
                        booking.id,
                        currentUser.id,
                        data.razorpay_payment_id,
                        data.razorpay_order_id
                      );

                      if (!linkResult.success) {
                        throw new Error(linkResult.error || 'Failed to link payment');
                      }

                      Alert.alert('Payment Successful', 'Your booking is confirmed!', [
                        { text: 'OK', onPress: () => router.push(`/booking/${booking.id}` as any) }
                      ]);
                      setIsProcessingPayment(false);
                    })
                    .catch((error: any) => {
                      console.error('[Payment Retry] Payment failed:', error);
                      Alert.alert(
                        'Payment Failed',
                        'Payment was not completed. Please try again.',
                        [{ text: 'OK' }]
                      );
                      setIsProcessingPayment(false);
                    });
                } catch (error: any) {
                  console.error('[Payment Retry] Error:', error);
                  Alert.alert('Error', error.message || 'Failed to process payment');
                  setIsProcessingPayment(false);
                }
              }}
            >
              {isProcessingPayment ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.actionButtonTextPrimary}>Complete Payment</Text>
              )}
            </TouchableOpacity>
              ) : null}
              
              {/* Cancel Button */}
            <TouchableOpacity 
              style={styles.actionButton} 
              activeOpacity={0.8}
              disabled={isCancelling}
              onPress={async () => {
                Alert.alert(
                  'Cancel Booking?',
                  mappedBooking.status === 'accepted' 
                    ? 'Barber has accepted your booking. Are you sure you want to cancel?'
                    : 'Are you sure you want to cancel this booking?',
                  [
                    { text: 'Keep Booking', style: 'cancel' },
                    { 
                      text: 'Yes, Cancel', 
                      style: 'destructive',
                      onPress: async () => {
                        if (!currentUser?.id) return;
                        
                        setIsCancelling(true);
                        
                        // OPTIMISTIC UPDATE: Remove booking immediately
                        queryClient.setQueryData(
                          ['customer-bookings', currentUser.id, 'active'],
                          (oldData: any) => {
                            if (!oldData?.pages) return oldData;
                            return {
                              ...oldData,
                              pages: oldData.pages.map((page: any) => ({
                                ...page,
                                data: page.data?.filter((b: any) => b.id !== mappedBooking.id) || []
                              }))
                            };
                          }
                        );
                        
                        try {
                          const result = await bookingService.cancelBooking(
                            mappedBooking.id,
                            currentUser.id,
                            'Customer requested cancellation'
                          );
                          
                          if (result.success) {
                            Alert.alert('Cancelled', 'Booking cancelled successfully');
                            // Invalidate to ensure data is fresh
                            queryClient.invalidateQueries({ queryKey: ['customer-bookings'] });
                            queryClient.invalidateQueries({ queryKey: ['customer-booking-counts'] });
                          } else {
                            // Rollback on error
                            Alert.alert('Error', result.error || 'Failed to cancel booking');
                            queryClient.invalidateQueries({ queryKey: ['customer-bookings'] });
                          }
                        } catch (error) {
                          Alert.alert('Error', 'Failed to cancel booking. Please try again.');
                          // Rollback on error
                          queryClient.invalidateQueries({ queryKey: ['customer-bookings'] });
                        } finally {
                          setIsCancelling(false);
                        }
                      }
                    }
                  ]
                );
              }}
            >
              {isCancelling ? (
                <ActivityIndicator size="small" color={Colors.gray[500]} />
              ) : (
                <Text style={styles.actionButtonText}>Cancel</Text>
              )}
            </TouchableOpacity>
            </View>
          )}
          
          {/* Rate Button - Hide if disputed (only if field exists in data) */}
          {mappedBooking.status === 'completed' && !mappedBooking.review && !(booking.disputed_at) && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonPrimary]} 
              activeOpacity={0.8}
              onPress={async () => {
                // Auto-confirm service if not yet confirmed (Grab standard)
                if (!booking.completion_confirmed_at && !booking.disputed_at) {
                  console.log('⭐ Rating from card = Auto-confirming service...');
                  const confirmResult = await bookingService.confirmServiceCompletion(
                    mappedBooking.id,
                    currentUser?.id || ''
                  );
                  if (!confirmResult.success) {
                    Alert.alert('Error', confirmResult.error || 'Failed to confirm service');
                    return;
                  }
                  console.log('✅ Service auto-confirmed via rating from card');
                }
                // Navigate to rating screen
                router.push(`/booking/review/${mappedBooking.id}` as any);
              }}
            >
              <Text style={styles.actionButtonTextPrimary}>Rate</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

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
    paddingVertical: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
    letterSpacing: -0.5,
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
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gray[500],
  },
  tabTextActive: {
    color: Colors.white,
  },
  tabBadge: {
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  tabBadgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: Colors.gray[500],
    fontWeight: '500',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: Colors.gray[400],
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookingCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  bookingId: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray[400],
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.gray[100],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  cardContent: {
    padding: 12,
  },
  barberRow: {
    flexDirection: 'row',
    marginBottom: 0,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  barberAvatarContainer: {
    position: 'relative',
  },
  barberAvatar: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.gray[100],
  },
  barberOnlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  barberInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  barberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  barberName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.text.primary,
    flexShrink: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginRight: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  reviewsText: {
    fontSize: 13,
    color: Colors.gray[500],
    fontWeight: '500',
  },
  jobsTextSeparator: {
    fontSize: 13,
    color: Colors.gray[500],
    marginHorizontal: 6,
  },
  jobsText: {
    fontSize: 13,
    color: Colors.gray[500],
    fontWeight: '500',
  },
  divider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.gray[300],
    marginHorizontal: 8,
  },
  servicesSection: {
    marginTop: 12,
    marginBottom: 12,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 10,
  },
  serviceName: {
    fontSize: 15,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  detailsSection: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: Colors.gray[500],
    fontWeight: '500',
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    gap: 10,
  },
  totalSectionFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  totalSection: {},
  totalRowInline: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 13,
    color: Colors.gray[500],
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  paymentMethodBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  paymentMethodTextSmall: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.gray[500],
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0EA5E9',
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.gray[200],
  },
  actionButtonPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.gray[500],
  },
  actionButtonTextPrimary: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  // Infinite scroll styles
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingMoreText: {
    fontSize: 14,
    color: Colors.gray[500],
    fontWeight: '500',
  },
  endOfList: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  endOfListText: {
    fontSize: 13,
    color: Colors.gray[400],
    fontWeight: '500',
  },
});
