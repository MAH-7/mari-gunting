import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, StyleSheet, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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

    // Debounce refetch to prevent race conditions
    let refetchTimeout: NodeJS.Timeout;

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
          
          // Debounce refetch to avoid multiple simultaneous calls
          clearTimeout(refetchTimeout);
          refetchTimeout = setTimeout(() => {
            refetch();
          }, 500); // Wait 500ms before refetching
          
          // Log events for debugging
          if (payload.eventType === 'INSERT') {
            console.log('New booking created');
          } else if (payload.eventType === 'UPDATE') {
            const newData = payload.new as any;
            const oldData = payload.old as any;
            
            if (oldData?.status !== newData?.status) {
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
      clearTimeout(refetchTimeout);
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, refetch]);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('❌ Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // FIX: Only use data if response was successful
  const bookings = (bookingsResponse?.success !== false) ? (bookingsResponse?.data || []) : [];

  const activeBookings = bookings.filter(
    (b: any) => ['pending', 'accepted', 'confirmed', 'ready', 'on_the_way', 'on-the-way', 'arrived', 'in_progress', 'in-progress'].includes(b.status)
  );

  const completedBookings = bookings.filter(
    (b: any) => ['completed', 'cancelled', 'rejected', 'expired'].includes(b.status)
  );

  // Apply filters
  let filteredBookings = selectedTab === 'active' ? activeBookings : completedBookings;
  
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
            tintColor={Colors.primary}             colors={[Colors.primary]}
          />
        }
      >
        {isLoading ? (
          // Skeleton Loading Cards
          <>
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
          </>
        ) : error ? (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
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
              color={Colors.gray[300]}             />
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
  const currentUser = useStore((state) => state.currentUser);
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
  
  // Debug: Check what booking data looks like
  console.log('📋 Booking data:', { id: booking.id, booking_number: booking.booking_number, keys: Object.keys(booking) });
  
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
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
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
            <Text style={styles.totalValue}>{formatPrice(mappedBooking.totalPrice || 0)}</Text>
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
                        try {
                          const result = await bookingService.cancelBooking(
                            mappedBooking.id,
                            currentUser.id,
                            'Customer requested cancellation'
                          );
                          
                          if (result.success) {
                            Alert.alert('Cancelled', 'Booking cancelled successfully');
                            // List will auto-update via real-time subscription
                          } else {
                            Alert.alert('Error', result.error || 'Failed to cancel booking');
                          }
                        } catch (error) {
                          Alert.alert('Error', 'Failed to cancel booking. Please try again.');
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
    padding: 20,
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
    color: Colors.gray[400],
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
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
    padding: 16,
  },
  barberRow: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
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
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    gap: 12,
  },
  totalSectionFull: {
    marginBottom: 12,
  },
  totalSection: {},
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 12,
    color: Colors.gray[400],
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 22,
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
});
