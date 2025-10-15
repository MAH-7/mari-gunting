import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, StyleSheet, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatShortDate, formatTime } from '@/utils/format';
import { Booking, BookingStatus } from '@/types';
import BookingFilterModal, { BookingFilterOptions } from '@/components/BookingFilterModal';
import { SkeletonCircle, SkeletonText, SkeletonBase } from '@/components/Skeleton';
import { bookingService } from '@mari-gunting/shared/services/bookingService';
import { supabase } from '@mari-gunting/shared/config/supabase';

export default function BookingsScreen() {
  const currentUser = useStore((state) => state.currentUser);
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed'>('active');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Applied filters
  const [filters, setFilters] = useState<BookingFilterOptions>({
    sortBy: 'date',
    filterStatus: 'all',
  });

  const { data: bookingsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['customer-bookings', currentUser?.id, selectedTab],
    queryFn: async () => {
      if (!currentUser?.id) return { success: false, data: [] };
      
      // Fetch based on tab selection for better performance
      const statusFilter = selectedTab === 'active' 
        ? null // Get all active statuses
        : null; // Get all completed/cancelled
      
      return await bookingService.getCustomerBookings(
        currentUser.id,
        statusFilter,
        100, // limit
        0    // offset
      );
    },
    enabled: !!currentUser?.id,
    // Real-time subscription replaces polling
    refetchOnWindowFocus: true,
  });

  // Real-time subscription for customer's bookings
  useEffect(() => {
    if (!currentUser?.id) return;

    console.log('🔌 Setting up real-time subscription for customer bookings');

    // Subscribe to bookings table for this customer
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
          
          // Refetch bookings list
          refetch();
          
          // Show notification for specific events
          if (payload.eventType === 'INSERT') {
            Alert.alert('New Booking', 'A new booking has been created!');
          } else if (payload.eventType === 'UPDATE') {
            const newData = payload.new as any;
            const oldData = payload.old as any;
            
            if (oldData?.status !== newData?.status) {
              // Status changed - handled by booking details screen
              console.log('Booking status changed:', newData?.id);
            }
          }
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
  }, [currentUser?.id, refetch]);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const bookings = bookingsResponse?.data || [];

  const activeBookings = bookings.filter(
    (b: any) => ['pending', 'accepted', 'confirmed', 'ready', 'on-the-way', 'in-progress'].includes(b.booking_status)
  );

  const completedBookings = bookings.filter(
    (b: any) => ['completed', 'cancelled'].includes(b.booking_status)
  );

  // Apply filters
  let filteredBookings = selectedTab === 'active' ? activeBookings : completedBookings;
  
  // Filter by status
  if (filters.filterStatus !== 'all') {
    filteredBookings = filteredBookings.filter((b: any) => b.booking_status === filters.filterStatus);
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
      return (statusOrder[a.booking_status as BookingStatus] || 99) - (statusOrder[b.booking_status as BookingStatus] || 99);
    }
  });
  
  const displayBookings = sortedBookings;
  
  const hasActiveFilters = filters.sortBy !== 'date' || filters.filterStatus !== 'all';

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
            color={hasActiveFilters ? '#00B14F' : '#111827'} 
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
        showStatusFilter={selectedTab === 'active'}
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
          {activeBookings.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{activeBookings.length}</Text>
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

      {/* Bookings List */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00B14F"
            colors={['#00B14F']}
          />
        }
      >
        {isLoading ? (
          // Skeleton Loading Cards
          <>
            {[1, 2, 3].map((item) => (
              <View key={item} style={styles.bookingCard}>
                {/* Status Bar Skeleton */}
                <View style={[styles.statusBar, { backgroundColor: '#F3F4F6' }]}>
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
          </>
        ) : error ? (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
            <Text style={styles.emptyTitle}>Failed to load bookings</Text>
            <Text style={styles.emptySubtext}>
              Please check your connection and try again
            </Text>
          </View>
        ) : displayBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons 
              name={selectedTab === 'active' ? 'clipboard-outline' : 'checkmark-done-circle'} 
              size={64} 
              color="#D1D5DB" 
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
        ) : (
          displayBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function BookingCard({ booking }: { booking: any }) {
  // Map database booking to UI format
  const mappedBooking: Booking = {
    id: booking.booking_id,
    status: booking.booking_status,
    totalPrice: booking.total_price,
    scheduledDate: booking.scheduled_date,
    scheduledTime: booking.scheduled_time,
    createdAt: booking.created_at,
    barber: booking.barber_name ? {
      id: booking.barber_id,
      name: booking.barber_name,
      avatar: booking.barber_avatar || 'https://via.placeholder.com/150',
      rating: booking.barber_rating || 0,
      completedJobs: booking.barber_completed_jobs || 0,
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
        color: '#F59E0B', 
        bg: '#FEF3C7', 
        label: 'Pending',
        iconName: 'time-outline' as const,
        progress: 25
      },
      accepted: { 
        color: '#3B82F6', 
        bg: '#DBEAFE', 
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
        color: '#8B5CF6', 
        bg: '#EDE9FE', 
        label: 'On The Way',
        iconName: 'car' as const,
        progress: 75
      },
      'in-progress': { 
        color: '#00B14F', 
        bg: '#D1FAE5', 
        label: 'In Progress',
        iconName: 'cut' as const,
        progress: 90
      },
      completed: { 
        color: '#10B981', 
        bg: '#D1FAE5', 
        label: 'Completed',
        iconName: 'checkmark-circle' as const,
        progress: 100
      },
      cancelled: { 
        color: '#EF4444', 
        bg: '#FEE2E2', 
        label: 'Cancelled',
        iconName: 'close-circle' as const,
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
        <Text style={styles.bookingId}>#{mappedBooking.id.slice(-4).toUpperCase()}</Text>
      </View>

      {/* Progress Indicator */}
      {mappedBooking.status !== 'cancelled' && mappedBooking.status !== 'completed' && (
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
            <Image
              source={{ uri: mappedBooking.barber.avatar }}
              style={styles.barberAvatar}
            />
            <View style={styles.barberInfo}>
              <Text style={styles.barberName}>{mappedBooking.barber.name}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#FBBF24" style={styles.starIcon} />
                <Text style={styles.ratingText}>{mappedBooking.barber.rating.toFixed(1)}</Text>
                <View style={styles.divider} />
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
                <Text style={styles.servicePrice}>{formatCurrency(service.price)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Date & Location */}
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="calendar" size={16} color="#6B7280" />
            </View>
            <Text style={styles.detailText}>
              {mappedBooking.scheduledDate && mappedBooking.scheduledTime ? 
                `${formatShortDate(mappedBooking.scheduledDate)} at ${formatTime(mappedBooking.scheduledTime)}` : 
                'Date not set'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="location" size={16} color="#6B7280" />
            </View>
            <Text style={styles.detailText} numberOfLines={1}>
              {mappedBooking.address?.fullAddress || 'Address not set'}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(mappedBooking.totalPrice || 0)}</Text>
          </View>
          {(mappedBooking.status === 'pending' || mappedBooking.status === 'accepted') && (
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
          {mappedBooking.status === 'completed' && !mappedBooking.review && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonPrimary]} 
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonTextPrimary}>Rate</Text>
            </TouchableOpacity>
          )}
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
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    letterSpacing: -0.5,
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
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#00B14F',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  tabBadgeText: {
    color: '#00B14F',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#6B7280',
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
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#00B14F',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
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
    paddingVertical: 12,
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
    color: '#9CA3AF',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  cardContent: {
    padding: 16,
  },
  barberRow: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  barberAvatar: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  barberInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  barberName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
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
    color: '#111827',
  },
  divider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 8,
  },
  jobsText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  servicesSection: {
    marginBottom: 16,
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
    backgroundColor: '#00B14F',
    marginRight: 10,
  },
  serviceName: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  detailsSection: {
    marginBottom: 16,
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
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  totalSection: {},
  totalLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00B14F',
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  actionButtonPrimary: {
    backgroundColor: '#00B14F',
    borderColor: '#00B14F',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  actionButtonTextPrimary: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
