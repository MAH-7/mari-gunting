import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Alert, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { bookingService } from '@mari-gunting/shared/services/bookingService';
import { supabase } from '@mari-gunting/shared/config/supabase';
import { formatCurrency, formatShortDate, formatTime } from '@/utils/format';
import { useStore } from '@/store/useStore';
import { BookingStatus } from '@/types';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUser = useStore((state) => state.currentUser);
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Fetch booking data
  const { data: bookingResponse, isLoading, refetch } = useQuery({
    queryKey: ['booking-details', id],
    queryFn: () => bookingService.getBookingById(id!),
    enabled: !!id,
  });

  // Real-time subscription
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`booking-${id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings',
        filter: `id=eq.${id}`,
      }, (payload) => {
        console.log('🔔 Booking updated:', payload);
        refetch();
        queryClient.invalidateQueries({ queryKey: ['customer-bookings'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, refetch, queryClient]);

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (reason: string) => bookingService.cancelBooking(id!, currentUser?.id!, reason),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['customer-bookings'] });
      Alert.alert('Success', 'Booking cancelled successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to cancel booking');
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const booking = bookingResponse?.data;

  if (!booking) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>Booking not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Determine booking type and status
  const isBarbershop = booking.service_type === 'walk_in' || !!booking.barbershop_id;
  const isCashPayment = booking.payment_method === 'cash';
  const isPaymentPending = booking.payment_status === 'pending';
  const barberName = booking.barber?.barber_profile?.full_name || 'Barber';

  // Status configuration
  const getStatusConfig = (status: BookingStatus) => {
    const configs: Record<BookingStatus, any> = {
      pending: {
        color: '#F59E0B',
        bg: '#FEF3C7',
        icon: 'time-outline',
        title: 'Waiting for Confirmation',
        subtitle: `${barberName} will review your request`,
      },
      accepted: {
        color: '#3B82F6',
        bg: '#DBEAFE',
        icon: 'checkmark-circle',
        title: 'Booking Confirmed',
        subtitle: isBarbershop ? 'See you at the shop' : 'Barber is preparing',
      },
      confirmed: {
        color: '#06B6D4',
        bg: '#CFFAFE',
        icon: 'checkmark-done-circle',
        title: 'Confirmed',
        subtitle: 'Your appointment is confirmed',
      },
      ready: {
        color: '#14B8A6',
        bg: '#CCFBF1',
        icon: 'storefront',
        title: 'Ready for You',
        subtitle: 'Shop is waiting for your arrival',
      },
      'on-the-way': {
        color: '#8B5CF6',
        bg: '#EDE9FE',
        icon: 'car',
        title: 'Barber On The Way',
        subtitle: 'Heading to your location',
      },
      'in-progress': {
        color: '#00B14F',
        bg: '#D1FAE5',
        icon: 'cut',
        title: 'Service Started',
        subtitle: 'Your haircut is in progress',
      },
      completed: {
        color: '#10B981',
        bg: '#D1FAE5',
        icon: 'checkmark-done',
        title: 'Completed',
        subtitle: 'Thank you for your business!',
      },
      cancelled: {
        color: '#EF4444',
        bg: '#FEE2E2',
        icon: 'close-circle',
        title: 'Cancelled',
        subtitle: 'This booking was cancelled',
      },
    };
    return configs[status] || configs.pending;
  };

  const statusConfig = getStatusConfig(booking.status);

  // Action handlers
  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking?',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => cancelMutation.mutate('Customer requested cancellation'),
        },
      ]
    );
  };

  const handleCallBarber = () => {
    const phone = booking.barber?.barber_profile?.phone_number;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('Unavailable', 'Barber phone number not available');
    }
  };

  const handleTrackBarber = () => {
    router.push(`/booking/track-barber?bookingId=${booking.id}` as any);
  };

  // Show relevant actions based on status
  const canCancel = ['pending', 'accepted', 'confirmed'].includes(booking.status);
  const canCall = ['accepted', 'on-the-way', 'in-progress'].includes(booking.status) && !isBarbershop;
  const canTrack = ['on-the-way', 'in-progress'].includes(booking.status) && !isBarbershop;
  const canRate = booking.status === 'completed';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* ========== STATUS HERO SECTION ========== */}
        <View style={[styles.statusHero, { backgroundColor: statusConfig.bg }]}>
          <View style={styles.statusIconContainer}>
            <Ionicons name={statusConfig.icon} size={56} color={statusConfig.color} />
          </View>
          <Text style={[styles.statusTitle, { color: statusConfig.color }]}>
            {statusConfig.title}
          </Text>
          <Text style={styles.statusSubtitle}>{statusConfig.subtitle}</Text>
          <Text style={styles.bookingNumber}>#{booking.booking_number}</Text>
        </View>

        {/* ========== CASH PAYMENT ALERT ========== */}
        {isCashPayment && isPaymentPending && booking.status !== 'cancelled' && booking.status !== 'completed' && (
          <View style={styles.cashAlert}>
            <View style={styles.cashAlertIcon}>
              <Ionicons name="cash" size={24} color="#F59E0B" />
            </View>
            <View style={styles.cashAlertContent}>
              <Text style={styles.cashAlertTitle}>Cash Payment</Text>
              <Text style={styles.cashAlertAmount}>{formatCurrency(booking.total_price)}</Text>
              <Text style={styles.cashAlertText}>Pay barber after service</Text>
            </View>
          </View>
        )}

        {/* ========== QUICK ACTIONS ========== */}
        {(canCancel || canCall || canTrack || canRate) && (
          <View style={styles.actionsCard}>
            {canTrack && (
              <TouchableOpacity style={styles.primaryAction} onPress={handleTrackBarber}>
                <Ionicons name="navigate" size={20} color="#FFFFFF" />
                <Text style={styles.primaryActionText}>Track Barber</Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.secondaryActions}>
              {canCall && (
                <TouchableOpacity style={styles.secondaryAction} onPress={handleCallBarber}>
                  <Ionicons name="call" size={20} color="#00B14F" />
                  <Text style={styles.secondaryActionText}>Call</Text>
                </TouchableOpacity>
              )}
              {canCancel && (
                <TouchableOpacity style={styles.secondaryAction} onPress={handleCancel}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                  <Text style={[styles.secondaryActionText, { color: '#EF4444' }]}>Cancel</Text>
                </TouchableOpacity>
              )}
              {canRate && (
                <TouchableOpacity style={styles.secondaryAction}>
                  <Ionicons name="star" size={20} color="#F59E0B" />
                  <Text style={styles.secondaryActionText}>Rate</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* ========== BARBER INFO ========== */}
        {booking.barber && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Barber</Text>
            <View style={styles.barberCard}>
              <Image
                source={{ uri: booking.barber.barber_profile?.avatar_url || 'https://via.placeholder.com/80' }}
                style={styles.barberAvatar}
              />
              <View style={styles.barberInfo}>
                <Text style={styles.barberName}>{barberName}</Text>
                <View style={styles.barberStats}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.barberRating}>4.8</Text>
                  <Text style={styles.barberJobs}>· 156 jobs</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ========== SERVICE DETAILS ========== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Details</Text>
          
          {/* Services */}
          {booking.services && booking.services.length > 0 && (
            <View style={styles.detailGroup}>
              <Text style={styles.detailLabel}>Services</Text>
              {booking.services.map((service: any, index: number) => (
                <View key={index} style={styles.serviceItem}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.servicePrice}>{formatCurrency(service.price)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Date & Time */}
          <View style={styles.detailGroup}>
            <Text style={styles.detailLabel}>When</Text>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <Text style={styles.detailValue}>
                {formatShortDate(booking.scheduled_date)} at {formatTime(booking.scheduled_time)}
              </Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.detailGroup}>
            <Text style={styles.detailLabel}>Location</Text>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={20} color="#6B7280" />
              <Text style={styles.detailValue}>
                {isBarbershop
                  ? booking.barbershop?.name || 'Barbershop'
                  : booking.customer_address
                  ? `${booking.customer_address.line1}, ${booking.customer_address.city}`
                  : 'Address not set'}
              </Text>
            </View>
          </View>
        </View>

        {/* ========== PAYMENT SUMMARY ========== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Services</Text>
            <Text style={styles.priceValue}>{formatCurrency(booking.subtotal)}</Text>
          </View>
          
          {booking.travel_fee > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Travel</Text>
              <Text style={styles.priceValue}>{formatCurrency(booking.travel_fee)}</Text>
            </View>
          )}
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Platform Fee</Text>
            <Text style={styles.priceValue}>{formatCurrency(booking.service_fee)}</Text>
          </View>
          
          <View style={styles.priceDivider} />
          
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(booking.total_price)}</Text>
          </View>
          
          <View style={styles.paymentMethodRow}>
            <Ionicons 
              name={isCashPayment ? "cash-outline" : "card-outline"} 
              size={18} 
              color="#6B7280" 
            />
            <Text style={styles.paymentMethodText}>
              {booking.payment_method?.toUpperCase()} · {booking.payment_status?.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Bottom padding */}
        <View style={{ height: isCashPayment && isPaymentPending ? 120 : 40 }} />
      </ScrollView>

      {/* ========== STICKY CASH FOOTER ========== */}
      {isCashPayment && isPaymentPending && booking.status !== 'cancelled' && (
        <View style={styles.stickyFooter}>
          <View style={styles.footerContent}>
            <View style={styles.footerLeft}>
              <Ionicons name="cash" size={32} color="#F59E0B" />
              <View>
                <Text style={styles.footerLabel}>Cash Payment</Text>
                <Text style={styles.footerAmount}>{formatCurrency(booking.total_price)}</Text>
              </View>
            </View>
            <View style={styles.footerBadge}>
              <Text style={styles.footerBadgeText}>PAY AFTER</Text>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
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
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },

  // Status Hero
  statusHero: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  statusIconContainer: {
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  bookingNumber: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '600',
  },

  // Cash Alert
  cashAlert: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F59E0B',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  cashAlertIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cashAlertContent: {
    flex: 1,
  },
  cashAlertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  cashAlertAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 2,
  },
  cashAlertText: {
    fontSize: 13,
    color: '#78350F',
    fontWeight: '500',
  },

  // Actions
  actionsCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  primaryAction: {
    backgroundColor: '#00B14F',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00B14F',
  },

  // Section
  section: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
  },

  // Barber
  barberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  barberAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
  },
  barberInfo: {
    flex: 1,
  },
  barberName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  barberStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  barberRating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  barberJobs: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Details
  detailGroup: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailValue: {
    fontSize: 15,
    color: '#1C1C1E',
    flex: 1,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  serviceName: {
    fontSize: 15,
    color: '#1C1C1E',
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },

  // Payment
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00B14F',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  paymentMethodText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Sticky Footer
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FEF3C7',
    borderTopWidth: 2,
    borderTopColor: '#F59E0B',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  footerAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#92400E',
  },
  footerBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  footerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
