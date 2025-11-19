import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, StyleSheet, Alert, Linking, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { bookingService } from '@mari-gunting/shared/services/bookingService';
import { formatCurrency, formatPrice, formatShortDate, formatTime, formatLocalTime, formatLocalDate, formatLocalDateTime } from '@mari-gunting/shared/utils/format';
import { BookingStatus } from '@/types';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '@mari-gunting/shared/store/useStore';
import ConfirmationModal from '@/components/ConfirmationModal';
import SuccessModal from '@/components/SuccessModal';
import { SkeletonCircle, SkeletonText, SkeletonBase } from '@/components/Skeleton';
import { supabase } from '@mari-gunting/shared/config/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, theme, getStatusBackground, getStatusColor } from '@mari-gunting/shared/theme';

export default function BookingDetailScreen() {
  const { id, quickBook } = useLocalSearchParams<{ id: string; quickBook?: string }>();
  const currentUser = useStore((state) => state.currentUser);
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  
  // Check if this is a Quick Book flow (service not selected yet)
  const isQuickBookFlow = quickBook === 'true';

  const { data: bookingResponse, isLoading, refetch } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingService.getBookingById(id),
    enabled: !!id,
    staleTime: 0, // Always consider stale
    cacheTime: 0, // Don't cache
  });

  // Refetch when screen comes into focus (catches updates when returning to screen)
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Booking details screen focused - refreshing booking');
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      refetch();
    }, [id, refetch, queryClient])
  );

  // Real-time subscription for booking updates
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`booking:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          console.log('Booking updated:', payload);
          // Invalidate query to refetch fresh data
          queryClient.invalidateQueries({ queryKey: ['booking', id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => {
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }
      return bookingService.cancelBooking(id, currentUser.id, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      
      // Close cancel modal and show success modal
      setShowCancelModal(false);
      setShowSuccessModal(true);
    },
    onError: () => {
      setShowCancelModal(false);
      Alert.alert('Error', 'Failed to cancel booking. Please try again.');
    },
  });

  // Confirm service completion mutation
  const confirmServiceMutation = useMutation({
    mutationFn: () => {
      if (!currentUser?.id) throw new Error('Not authenticated');
      return bookingService.confirmServiceCompletion(id, currentUser.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      // Navigation happens in the button's onPress after timeout
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to confirm service');
    },
  });

  // Report issue mutation
  const reportIssueMutation = useMutation({
    mutationFn: (reason: string) => {
      if (!currentUser?.id) throw new Error('Not authenticated');
      return bookingService.reportServiceIssue(id, currentUser.id, reason);
    },
    onSuccess: (response) => {
      if (response.success) {
        setShowDisputeModal(false);
        setDisputeReason('');
        Alert.alert(
          'Issue Reported', 
          'Your concern has been submitted. Our admin will review and contact you within 24 hours.',
          [{ text: 'OK' }]
        );
        queryClient.invalidateQueries({ queryKey: ['booking', id] });
      }
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to report issue');
    },
  });

  const booking = bookingResponse?.data;
  
  // Calculate time remaining for auto-confirmation (MUST be before any early returns)
  useEffect(() => {
    if (!booking) return;
    
    // Only show timer if booking is completed but not confirmed/disputed
    if (
      booking.status === 'completed' &&
      !booking.completion_confirmed_at &&
      !booking.disputed_at &&
      booking.payment_status === 'authorized'
    ) {
      // Calculate time remaining based on completed_at + 2 hours
      const calculateTimeRemaining = () => {
        if (!booking.completed_at) return 0;
        
        const completedTime = new Date(booking.completed_at).getTime();
        const autoConfirmTime = completedTime + (2 * 60 * 60 * 1000); // +2 hours
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((autoConfirmTime - now) / 1000)); // in seconds
        
        return remaining;
      };
      
      // Initial calculation
      setTimeRemaining(calculateTimeRemaining());
      
      // Update every second
      const timer = setInterval(() => {
        const remaining = calculateTimeRemaining();
        setTimeRemaining(remaining);
        
        if (remaining <= 0) {
          clearInterval(timer);
          // Refresh booking to get updated status from cron job
          queryClient.invalidateQueries({ queryKey: ['booking', id] });
        }
      }, 1000);
      
      return () => clearInterval(timer);
    } else {
      setTimeRemaining(0);
    }
  }, [booking, id, queryClient]);

  // Format time remaining as human-readable
  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return 'Processing...';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Get timer color based on urgency (Grab style)
  const getTimerColor = (seconds: number) => {
    if (seconds > 3600) return Colors.success; // > 1 hour: green
    if (seconds > 1800) return Colors.warning; // 30min - 1h: yellow
    return Colors.error; // < 30min: red
  };

  // Determine if we should show confirmation card
  const needsConfirmation = booking && 
    booking.status === 'completed' &&
    !booking.completion_confirmed_at &&
    !booking.disputed_at &&
    booking.payment_status === 'authorized';
  
  // Fetch barber details to get services and other info (for Quick Book flow)
  const { data: barberResponse } = useQuery({
    queryKey: ['barber', booking?.barberId],
    queryFn: () => api.getBarberById(booking?.barberId || ''),
    enabled: !!booking?.barberId && isQuickBookFlow,
  });
  
  const barber = barberResponse?.data;
  
  // Use dynamic services from the matched barber
  const availableServices = barber?.services || [];
  
  // Calculate travel fee based on distance (NEW PRICING MODEL)
  const distance = barber?.distance || booking?.distance || 2.3; // Use barber distance if available
  // NEW PRICING MODEL: RM 5 base (0-4km) + RM 1/km after 4km
  let travelFee = 0;
  if (distance <= 4) {
    travelFee = 5;
  } else {
    travelFee = 5 + ((distance - 4) * 1);
  }
  travelFee = Math.round(travelFee * 100) / 100; // Round to 2 decimals

  // Helper to display user-friendly payment method names
  const getPaymentMethodDisplay = (method: string) => {
    const methods: Record<string, string> = {
      'curlec_card': 'Card',
      'curlec_fpx': 'Online Banking',
      'cash': 'Cash',
      'ewallet': 'E-Wallet',
      'curlec': 'Card', // Fallback for old data
    };
    return methods[method] || method;
  };

  // Helper to display payment status based on booking + payment status combination
  const getPaymentStatusDisplay = (bookingStatus: string, paymentStatus: string) => {
    // Payment completed or authorized (card payment done)
    if (paymentStatus === 'completed' || paymentStatus === 'authorized') {
      return 'PAID';
    }
    
    // For reversed/refunded payments (cancelled bookings)
    if (paymentStatus === 'reversed') {
      return 'REVERSED';
    }
    
    if (paymentStatus === 'refunded') {
      return 'REFUNDED';
    }
    
    if (paymentStatus === 'refund_pending' || paymentStatus === 'refund_initiated') {
      return 'REFUNDING';
    }
    
    // For rejected/cancelled bookings that never had payment
    if ((bookingStatus === 'rejected' || bookingStatus === 'cancelled') && paymentStatus === 'pending') {
      return 'NOT PAID';
    }
    
    // For pending/accepted bookings awaiting payment
    if ((bookingStatus === 'pending' || bookingStatus === 'accepted') && paymentStatus === 'pending') {
      return 'AWAITING PAYMENT';
    }
    
    // Fallback to raw status
    return paymentStatus.toUpperCase().replace(/_/g, ' ');
  };

  const getStatusConfig = (status: BookingStatus) => {
    const configs = {
      pending: { 
        color: Colors.gray[500], 
        bg: Colors.gray[100], 
        label: 'Pending Confirmation',
        iconName: 'time-outline' as const,
        description: 'Waiting for barber to accept'
      },
      accepted: { 
        color: Colors.info, 
        bg: Colors.infoLight, 
        label: 'Accepted',
        iconName: 'checkmark-circle' as const,
        description: 'Barber will arrive at scheduled time'
      },
      on_the_way: { 
        color: '#6366F1', 
        bg: '#E0E7FF', 
        label: 'On The Way',
        iconName: 'car' as const,
        description: 'Your barber is heading to your location'
      },
      arrived: { 
        color: Colors.status.expired, 
        bg: '#FFEDD5', 
        label: 'Arrived',
        iconName: 'location' as const,
        description: 'Your barber has arrived at your location'
      },
      in_progress: {
        color: '#0EA5E9', 
        bg: '#E0F2FE', 
        label: 'Service In Progress',
        iconName: 'cut' as const,
        description: 'Service is currently being performed'
      },
      completed: { 
        color: Colors.success, 
        bg: Colors.successLight,
        label: 'Completed',
        iconName: 'checkmark-circle' as const,
        description: 'Service completed successfully'
      },
      cancelled: { 
        color: Colors.error, 
        bg: Colors.errorLight, 
        label: 'Cancelled',
        iconName: 'close-circle' as const,
        description: 'This booking has been cancelled'
      },
      rejected: { 
        color: Colors.error, 
        bg: Colors.errorLight, 
        label: 'Rejected',
        iconName: 'close-circle-outline' as const,
        description: 'Barber declined this booking'
      },
      expired: { 
        color: Colors.status.expired, 
        bg: getStatusBackground("expired"), 
        label: 'Expired',
        iconName: 'time-outline' as const,
        description: 'No barber response within 3 minutes'
      },
    };
    return configs[status] || configs.pending;
  };

  const handleCancelBooking = () => {
    setShowCancelModal(true);
  };

  const handleCallBarber = () => {
    if (booking?.barber?.phone) {
      Linking.openURL(`tel:${booking.barber.phone}`);
    }
  };

  const handleChatBarber = () => {
    router.push(`/booking/chat/${id}` as any);
  };

  const handleRateBarber = async () => {
    // If service not yet confirmed, auto-confirm first (Grab style)
    if (!booking.completion_confirmed_at && !booking.disputed_at) {
      console.log('⭐ Rating = Auto-confirming service...');
      
      const confirmResult = await bookingService.confirmServiceCompletion(id, currentUser?.id || '');
      
      if (!confirmResult.success) {
        Alert.alert('Error', confirmResult.error || 'Failed to confirm service');
        return;
      }
      
      console.log('✅ Service auto-confirmed via rating');
    }
    
    // Navigate to rating screen
    router.push(`/booking/review/${id}` as any);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backIconButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Skeleton Status Card */}
          <View style={[styles.statusCard, { backgroundColor: Colors.gray[100], alignItems: 'center', paddingVertical: 32 }]}>
            <SkeletonCircle size={48} style={{ marginBottom: 16 }} />
            <SkeletonText width="60%" height={20} style={{ marginBottom: 8 }} />
            <SkeletonText width="80%" height={14} style={{ marginBottom: 8 }} />
            <SkeletonText width="40%" height={12} />
          </View>

          {/* Skeleton Progress Timeline */}
          <View style={styles.progressCard}>
            <SkeletonText width="40%" height={18} style={{ marginBottom: 16 }} />
            <View style={{ gap: 16 }}>
              {[1, 2, 3].map((item) => (
                <View key={item} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <SkeletonCircle size={32} />
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <SkeletonText width="50%" height={16} style={{ marginBottom: 4 }} />
                    <SkeletonText width="70%" height={12} />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Skeleton Barber Info */}
          <View style={styles.card}>
            <SkeletonText width="35%" height={18} style={{ marginBottom: 16 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <SkeletonCircle size={64} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <SkeletonText width="50%" height={18} style={{ marginBottom: 6 }} />
                <SkeletonText width="40%" height={14} style={{ marginBottom: 6 }} />
                <SkeletonText width="35%" height={14} />
              </View>
            </View>
          </View>

          {/* Skeleton Details Card */}
          <View style={styles.card}>
            <SkeletonText width="40%" height={18} style={{ marginBottom: 16 }} />
            <View style={{ gap: 16 }}>
              {[1, 2, 3, 4].map((item) => (
                <View key={item} style={{ flexDirection: 'row' }}>
                  <View style={{ width: 100 }}>
                    <SkeletonText width="80%" height={12} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <SkeletonText width="70%" height={16} />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Skeleton Payment Summary */}
          <View style={styles.card}>
            <SkeletonText width="45%" height={18} style={{ marginBottom: 16 }} />
            <View style={{ gap: 12 }}>
              {[1, 2, 3].map((item) => (
                <View key={item} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <SkeletonText width="40%" height={14} />
                  <SkeletonText width={60} height={14} />
                </View>
              ))}
              <View style={{ height: 1, backgroundColor: Colors.gray[200], marginVertical: 8 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <SkeletonText width="30%" height={20} />
                <SkeletonText width={80} height={22} />
              </View>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Skeleton Action Buttons */}
        <View style={styles.bottomActionBar}>
          <SkeletonBase width="48%" height={52} borderRadius={12} />
          <SkeletonBase width="48%" height={52} borderRadius={12} />
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={Colors.error} />
          <Text style={styles.errorTitle}>Booking Not Found</Text>
          <Text style={styles.errorText}>This booking doesn't exist or has been removed.</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = getStatusConfig(booking.status);
  const canCancel = booking.status === 'pending' || booking.status === 'accepted';
  // Can rate if completed, no review, and NOT disputed
  const canRate = booking.status === 'completed' && !booking.review && !booking.disputed_at;
  
  // Smart contact button logic - Chat only for now
  const canChat = ['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(booking.status);

  // Show Quick Book service selection flow
  if (isQuickBookFlow) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backIconButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Service</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Success Banner */}
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={64} color={Colors.primary} />
            <Text style={styles.successTitle}>Barber Found!</Text>
            <Text style={styles.successSubtitle}>
              Select a service to continue
            </Text>
          </View>

          {/* Barber Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Your Barber</Text>
            <View style={styles.barberInfo}>
              <Image
                source={{ uri: booking?.barberAvatar || 'https://i.pravatar.cc/300' }}
                style={styles.barberAvatar}
              />
              <View style={styles.barberDetails}>
                <Text style={styles.barberName}>{booking?.barberName || 'Barber'}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={16} color={Colors.warning} />
                  <Text style={styles.ratingText}>{barber?.rating?.toFixed(1) || '4.9'}</Text>
                  <Text style={styles.ratingCount}>({barber?.completedJobs || 250}+ jobs)</Text>
                </View>
                <View style={styles.distanceInfo}>
                  <Ionicons name="location" size={14} color={Colors.primary} />
                  <Text style={styles.distanceText}>{distance.toFixed(1)} km away</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Service Selection */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Select Service</Text>
            <Text style={styles.sectionSubtitle}>Choose what you need</Text>
            
            {availableServices.length === 0 ? (
              <View style={styles.noServicesContainer}>
                <Ionicons name="information-circle-outline" size={48} color={Colors.gray[400]} />
                <Text style={styles.noServicesText}>No services available</Text>
              </View>
            ) : (
              availableServices.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={[
                  styles.serviceSelectionCard,
                  selectedService === service.id && styles.serviceSelectionCardActive,
                ]}
                onPress={() => setSelectedService(service.id)}
                activeOpacity={0.7}
              >
                <View style={styles.serviceSelectionLeft}>
                  <View style={[
                    styles.serviceRadio,
                    selectedService === service.id && styles.serviceRadioActive,
                  ]}>
                    {selectedService === service.id && (
                      <View style={styles.serviceRadioInner} />
                    )}
                  </View>
                  <View style={styles.serviceTextContainer}>
                    <Text style={styles.serviceSelectionName} numberOfLines={2}>{service.name}</Text>
                    <Text style={styles.serviceSelectionDuration}>{service.duration} min</Text>
                  </View>
                </View>
                <Text style={styles.serviceSelectionPrice}>RM {service.price}</Text>
              </TouchableOpacity>
              ))
            )}
          </View>

          {/* Summary */}
          {selectedService && (
            <View style={styles.quickBookSummary}>
              <Text style={styles.summaryTitle}>Booking Summary</Text>
              {(() => {
                const service = availableServices.find(s => s.id === selectedService);
                if (!service) return null;
                
                const total = service.price + travelFee;
                
                return (
                  <>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Barber</Text>
                      <Text style={styles.summaryValue}>{booking?.barberName}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Service</Text>
                      <Text style={styles.summaryValue}>{service.name}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Duration</Text>
                      <Text style={styles.summaryValue}>{service.duration} min</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Service Price</Text>
                      <Text style={styles.summaryValue}>RM {service.price}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <View style={styles.travelFeeLabel}>
                        <Ionicons name="car" size={16} color={Colors.gray[500]} />
                        <Text style={styles.travelFeeLabelText}>Travel Fee ({distance.toFixed(1)} km)</Text>
                      </View>
                      <Text style={styles.summaryValue}>RM {travelFee.toFixed(1)}</Text>
                    </View>
                    <View style={styles.dividerLine} />
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Total</Text>
                      <Text style={styles.totalValue}>RM {total.toFixed(1)}</Text>
                    </View>
                  </>
                );
              })()}
            </View>
          )}
        </ScrollView>

        {/* Bottom Action */}
        <View style={styles.bottomActionBar}>
          <TouchableOpacity
            style={[
              styles.confirmServiceButton,
              !selectedService && styles.confirmServiceButtonDisabled,
            ]}
            onPress={handleConfirmService}
            disabled={!selectedService || confirmServiceMutation.isPending}
            activeOpacity={0.8}
          >
            {confirmServiceMutation.isPending ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color={Colors.white} />
                <Text style={styles.confirmServiceButtonText}>Confirm Booking</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Regular booking detail view
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backIconButton}
          onPress={() => {
            // If we can't go back (stack cleared after booking creation),
            // navigate to bookings tab instead
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/bookings' as any);
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card - Modified for pending confirmation */}
        {!needsConfirmation ? (
          <View style={[styles.statusCard, { backgroundColor: statusConfig.bg }]}>
            <Ionicons name={statusConfig.iconName} size={48} color={statusConfig.color} style={styles.statusIcon} />
            <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
            <Text style={styles.statusDescription}>{statusConfig.description}</Text>
            <Text style={styles.bookingId}>Booking #{booking.booking_number || booking.id.slice(-8).toUpperCase()}</Text>
            
            {/* Service Type Badge */}
            <View style={styles.serviceTypeBadge}>
              <Ionicons 
                name={booking.service_type === 'home_service' ? 'home' : 'storefront'} 
                size={14} 
                color={Colors.gray[500]}             />
              <Text style={styles.serviceTypeText}>
                {booking.service_type === 'home_service' ? 'Home Service' : 'Walk-in'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.statusCard, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="time-outline" size={48} color={Colors.warning} style={styles.statusIcon} />
            <Text style={[styles.statusLabel, { color: Colors.warning }]}>
              AWAITING CONFIRMATION
            </Text>
            <Text style={styles.statusDescription}>Service completed - please confirm below</Text>
            <Text style={styles.bookingId}>Booking #{booking.booking_number || booking.id.slice(-8).toUpperCase()}</Text>
          </View>
        )}

        {/* Service Completion Confirmation - New Compact Design */}
        {needsConfirmation && timeRemaining > 0 && (
          <View style={styles.confirmationCard}>
            {/* Header */}
            <View style={styles.confirmHeader}>
              <View style={[styles.timerDot, { backgroundColor: getTimerColor(timeRemaining) }]} />
              <Text style={styles.confirmHeaderTitle}>Service Completed</Text>
            </View>

            {/* Description */}
            <Text style={styles.confirmDescription}>
              Rate your experience or report an issue.
            </Text>

            {/* Action Buttons - Side by Side */}
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => {
                  confirmServiceMutation.mutate();
                  setTimeout(() => {
                    if (!booking.disputed_at) {
                      router.push(`/booking/review/${id}` as any);
                    }
                  }, 1500);
                }}
                disabled={confirmServiceMutation.isPending}
              >
                {confirmServiceMutation.isPending ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Ionicons name="star" size={18} color={Colors.white} />
                    <Text style={styles.confirmBtnText}>Rate Now</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reportBtn}
                onPress={() => setShowDisputeModal(true)}
                disabled={reportIssueMutation.isPending}
              >
                <Ionicons name="flag-outline" size={18} color={Colors.error} />
                <Text style={styles.reportBtnText}>Report</Text>
              </TouchableOpacity>
            </View>

            {/* Info Text with Timer */}
            <View style={styles.confirmInfoContainer}>
              <Text style={styles.confirmInfo}>
                💡 Auto-confirms if no action taken in{' '}
                <Text style={[styles.confirmInfoTimer, { color: getTimerColor(timeRemaining) }]}>
                  {formatTimeRemaining(timeRemaining)}
                </Text>
              </Text>
            </View>
          </View>
        )}

        {/* Confirmed Service Notice */}
        {booking.completion_confirmed_at && (
          <View style={styles.confirmedCard}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
            <Text style={styles.confirmedText}>
              Service confirmed on {formatLocalDate(booking.completion_confirmed_at)}
            </Text>
          </View>
        )}

        {/* Disputed Service Notice */}
        {booking.disputed_at && (
          <View style={styles.disputedCard}>
            <Ionicons name="alert-circle" size={24} color={Colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.disputedTitle}>Issue Reported</Text>
              <Text style={styles.disputedText}>
                Your concern is under review. Admin will contact you within 24 hours.
              </Text>
              {booking.dispute_reason && (
                <Text style={styles.disputeReason}>
                  Reason: {booking.dispute_reason}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Progress Tracker */}
        {!['cancelled', 'rejected', 'expired'].includes(booking.status) && (
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>Progress</Text>
            
            {/* Completed Steps */}
            {booking.status !== 'pending' && booking.status !== 'cancelled' && booking.status !== 'rejected' && booking.status !== 'expired' && (
              <View style={styles.completedSection}>
                {booking.acceptedAt && (
                  <View style={styles.completedStep}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                    <Text style={styles.completedStepText}>Accepted</Text>
                    <Text style={styles.completedStepTime}>{formatLocalTime(booking.acceptedAt)}</Text>
                  </View>
                )}
                {booking.onTheWayAt && (
                  <View style={styles.completedStep}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                    {booking.status === 'on_the_way' ? (
                      <View style={styles.stepTextWithEta}>
                        <Text style={styles.completedStepTextNoFlex}>On The Way</Text>
                        {booking.current_eta_minutes && (
                          <View style={styles.inlineEtaBadge}>
                            <Ionicons name="time-outline" size={12} color={Colors.status.ready} />
                            <Text style={styles.inlineEtaText}>
                              ~{booking.current_eta_minutes} min
                            </Text>
                          </View>
                        )}
                      </View>
                    ) : (
                      <Text style={styles.completedStepText}>On The Way</Text>
                    )}
                    <Text style={styles.completedStepTime}>{formatLocalTime(booking.onTheWayAt)}</Text>
                  </View>
                )}
                {booking.arrivedAt && (
                  <View style={styles.completedStep}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                    <Text style={styles.completedStepText}>Arrived</Text>
                    <Text style={styles.completedStepTime}>{formatLocalTime(booking.arrivedAt)}</Text>
                  </View>
                )}
                {booking.startedAt && (
                  <View style={styles.completedStep}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                    <Text style={styles.completedStepText}>Service Started</Text>
                    <Text style={styles.completedStepTime}>{formatLocalTime(booking.startedAt)}</Text>
                  </View>
                )}
                {booking.completedAt && (
                  <View style={styles.completedStep}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                    <Text style={styles.completedStepText}>Completed</Text>
                    <Text style={styles.completedStepTime}>{formatLocalTime(booking.completedAt)}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Next Steps - only show for active bookings */}
            {!['completed', 'cancelled', 'rejected', 'expired'].includes(booking.status) && (
              <View style={styles.nextStepsSection}>
                <Text style={styles.nextStepsTitle}>Next Steps</Text>
                <View style={styles.nextStepsList}>
                  {booking.status === 'pending' && (
                    <>
                      <Text style={styles.nextStepItem}>→ Barber will accept</Text>
                      <Text style={styles.nextStepItem}>→ Barber heads to location</Text>
                      <Text style={styles.nextStepItem}>→ Service begins</Text>
                    </>
                  )}
                  {booking.status === 'accepted' && (
                    <>
                      <Text style={styles.nextStepItem}>→ Barber heads to location</Text>
                      <Text style={styles.nextStepItem}>→ Service begins</Text>
                      <Text style={styles.nextStepItem}>→ Complete & pay</Text>
                    </>
                  )}
                  {(booking.status === 'on_the_way' || booking.status === 'arrived') && (
                    <>
                      <Text style={styles.nextStepItem}>→ Service begins</Text>
                      <Text style={styles.nextStepItem}>→ Complete & pay</Text>
                    </>
                  )}
                  {booking.status === 'in_progress' && (
                    <Text style={styles.nextStepItem}>→ Complete & pay</Text>
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Barber Info */}
        {booking.barber ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Barber</Text>
            <View style={styles.barberInfo}>
              <Image
                source={{ uri: booking.barber.avatar || 'https://via.placeholder.com/72' }}
                style={styles.barberAvatar}
              />
              <View style={styles.barberDetails}>
                <View style={styles.barberNameRow}>
                  <Text style={styles.barberName} numberOfLines={2}>{booking.barber.name}</Text>
                  {booking.barber.isVerified && (
                    <Ionicons name="checkmark-circle" size={18} color="#007AFF" />
                  )}
                </View>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={16} color={Colors.warning} />
                  <Text style={styles.ratingText}>{booking.barber.rating?.toFixed(1) || '0.0'}</Text>
                  <Text style={styles.ratingCount}>({booking.barber.totalReviews || 0} reviews)</Text>
                  <Text style={styles.jobsSeparator}>•</Text>
                  <Text style={styles.jobsCount}>{booking.barber.completedJobs || 0} jobs</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Barber</Text>
            <Text style={styles.notesText}>Barber information will be assigned soon</Text>
          </View>
        )}

        {/* Services */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Price Details</Text>
          
          {booking.services && booking.services.length > 0 ? (
            <>
              <Text style={styles.subsectionLabel}>Services</Text>
              {booking.services.map((service, index) => (
                <View key={service.id} style={styles.serviceItem}>
                  <View style={styles.serviceLeft}>
                    <View style={styles.serviceDot} />
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      <Text style={styles.serviceDuration}>{service.duration} min</Text>
                    </View>
                  </View>
                  <Text style={styles.servicePrice}>{formatCurrency(service.price)}</Text>
                </View>
              ))}
            </>
          ) : (
            <>
              <Text style={styles.subsectionLabel}>Service</Text>
              <View style={styles.serviceItem}>
                <View style={styles.serviceLeft}>
                  <View style={styles.serviceDot} />
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{booking.serviceName || 'Service'}</Text>
                    {booking.duration && (
                      <Text style={styles.serviceDuration}>{booking.duration} min</Text>
                    )}
                  </View>
                </View>
                <Text style={styles.servicePrice}>{formatCurrency(booking.price || 0)}</Text>
              </View>
            </>
          )}
          
          {((booking.travel_fee || booking.travelCost) !== undefined && (booking.travel_fee || booking.travelCost) > 0) && (
            <>
              <View style={styles.dividerLine} />
              <View style={styles.serviceItem}>
                <View style={styles.serviceLeft}>
                  <Ionicons name="car" size={18} color={Colors.primary} style={{ marginRight: 12 }} />
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>Travel Cost</Text>
                    {(booking.distance_km || booking.distance) && (
                      <Text style={styles.serviceDuration}>{(booking.distance_km || booking.distance).toFixed(1)} km</Text>
                    )}
                  </View>
                </View>
                <Text style={styles.servicePrice}>{formatPrice(booking.travel_fee || booking.travelCost || 0)}</Text>
              </View>
            </>
          )}
          
          {/* Platform Fee */}
          <View style={styles.serviceItem}>
            <View style={styles.serviceLeft}>
              <Ionicons name="shield-checkmark" size={18} color={Colors.primary} style={{ marginRight: 12 }} />
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>Platform Fee</Text>
                <Text style={styles.serviceDuration}>Booking & Support</Text>
              </View>
            </View>
            <Text style={styles.servicePrice}>{formatPrice(booking.service_fee || 2.00)}</Text>
          </View>
          
          <View style={styles.dividerLine} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(booking.total_price || booking.totalPrice || booking.price || 0)}</Text>
          </View>
        </View>

        {/* Schedule & Location */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Schedule & Location</Text>
          
          {/* FIX: Use scheduled_datetime first (matches bookings list) */}
          {booking.scheduled_datetime ? (
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="calendar" size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Date & Time</Text>
                <Text style={styles.infoValue}>
                  {formatLocalDate(booking.scheduled_datetime)} at {formatLocalTime(booking.scheduled_datetime)}
                </Text>
              </View>
            </View>
          ) : booking.scheduledDate && booking.scheduledTime ? (
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="calendar" size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Date & Time</Text>
                <Text style={styles.infoValue}>
                  {formatLocalDate(booking.scheduledDate)} at {formatTime(booking.scheduledTime)}
                </Text>
              </View>
            </View>
          ) : booking.scheduledAt ? (
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="calendar" size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Scheduled At</Text>
                <Text style={styles.infoValue}>
                  {formatLocalDateTime(booking.scheduledAt)}
                </Text>
              </View>
            </View>
          ) : null}

          {booking.duration && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="time" size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Duration</Text>
                <Text style={styles.infoValue}>{booking.duration} minutes</Text>
              </View>
            </View>
          )}

          {booking.address ? (
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="location" size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{booking.address.fullAddress}</Text>
                {booking.address.notes && (
                  <Text style={styles.infoNote}>Note: {booking.address.notes}</Text>
                )}
              </View>
            </View>
          ) : booking.location ? (
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="location" size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>
                  {booking.location.address || 'Location coordinates provided'}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Additional Notes */}
        {(booking.customer_notes || booking.notes) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <Text style={styles.notesText}>{booking.customer_notes || booking.notes}</Text>
          </View>
        )}

        {/* Rejection Info */}
        {booking.status === 'rejected' && (
          <View style={[styles.card, styles.cancelCard]}>
            <Text style={styles.sectionTitle}>Why was this rejected?</Text>
            <Text style={styles.cancelReason}>
              {booking.cancellationReason || 'Barber declined this booking. They may be unavailable or outside service area.'}
            </Text>
            {booking.cancelledAt && (
              <Text style={styles.cancelDate}>
                Rejected on {formatLocalDate(booking.cancelledAt)}
              </Text>
            )}
          </View>
        )}

        {/* Payment Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment</Text>
          
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Method</Text>
            <View style={styles.paymentMethodBadge}>
              <Ionicons 
                name={booking.payment_method === 'cash' ? 'cash-outline' : 'card-outline'} 
                size={16} 
                color={booking.payment_method === 'cash' ? Colors.warning : Colors.primary} 
              />
              <Text style={styles.paymentValue}>
                {getPaymentMethodDisplay(booking.payment_method || 'cash')}
              </Text>
            </View>
          </View>
          
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Status</Text>
            <View style={[
              styles.paymentBadge,
              booking.payment_status === 'completed' && styles.paymentBadgePaid
            ]}>
              <Text style={[
                styles.paymentBadgeText,
                booking.payment_status === 'completed' && styles.paymentBadgeTextPaid
              ]}>
                {getPaymentStatusDisplay(booking.status, booking.payment_status || 'pending')}
              </Text>
            </View>
          </View>
          
          {/* Card Payment Authorization Note */}
          {booking.payment_method !== 'cash' && booking.payment_status === 'authorized' && 
           !['completed', 'cancelled', 'rejected'].includes(booking.status) && (
            <View style={styles.paymentReminder}>
              <Ionicons name="information-circle" size={20} color={Colors.primary} />
              <Text style={styles.paymentReminderText}>
                Payment secured. Final charge will be processed after service completion.
              </Text>
            </View>
          )}
          
          {/* Cash Payment Reminder */}
          {booking.payment_method === 'cash' && booking.payment_status === 'pending' && (
            <View style={styles.paymentReminder}>
              <Ionicons name="information-circle" size={20} color={Colors.warning} />
              <Text style={styles.paymentReminderText}>
                Please prepare RM {booking.total_price?.toFixed(2) || '0.00'} in cash for payment after service
              </Text>
            </View>
          )}
          
          {/* Authorization Reversal Notice - For cancelled bookings */}
          {booking.status === 'cancelled' && booking.payment_status === 'reversed' && booking.payment_method !== 'cash' && (
            <View style={[styles.paymentReminder, { backgroundColor: getStatusBackground("expired"), marginTop: 12 }]}>
              <Ionicons name="information-circle" size={20} color={Colors.status.expired} />
              <Text style={[styles.paymentReminderText, { color: '#9A3412' }]}>
                The payment authorization has been released. The hold on your card will be removed by your bank within 5-7 business days.
              </Text>
            </View>
          )}
          
          {/* Refund Notice - For cancelled bookings with completed payment */}
          {booking.status === 'cancelled' && ['refund_pending', 'refund_initiated', 'refunded'].includes(booking.payment_status || '') && (
            <View style={[styles.paymentReminder, { backgroundColor: Colors.infoLight, marginTop: 12 }]}>
              <Ionicons name="cash" size={20} color="#1D4ED8" />
              <Text style={[styles.paymentReminderText, { color: '#1E40AF' }]}>
                {booking.payment_status === 'refunded' 
                  ? 'Refund completed. The amount has been returned to your payment method.'
                  : 'Refund is being processed. You will receive the amount within 5-10 business days.'}
              </Text>
            </View>
          )}
        </View>


      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        {/* Chat Button - Show for active bookings */}
        {['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(booking.status) && (
          <TouchableOpacity
            style={styles.chatButton}
            onPress={handleChatBarber}
          >
            <Ionicons name="chatbubbles" size={20} color={Colors.white} />
            <Text style={styles.chatButtonText}>Chat with Barber</Text>
          </TouchableOpacity>
        )}

        {/* Track Barber Button - Show when barber is on the way or arrived */}
        {(booking.status === 'on_the_way' || booking.status === 'arrived') && (
          <TouchableOpacity
            style={styles.trackBarberButton}
            onPress={() => router.push(`/booking/track-barber?bookingId=${booking.id}` as any)}
          >
            <Ionicons name="navigate" size={20} color={Colors.white} />
            <Text style={styles.trackBarberButtonText}>Track Barber</Text>
          </TouchableOpacity>
        )}

        {canCancel && (
          <TouchableOpacity
            style={styles.cancelBookingButton}
            onPress={handleCancelBooking}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? (
              <ActivityIndicator size="small" color={Colors.error} />
            ) : (
              <>
                <Ionicons name="close-circle" size={20} color={Colors.error} />
                <Text style={styles.cancelBookingButtonText}>Cancel Booking</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {canRate && !needsConfirmation && (
          <TouchableOpacity
            style={styles.rateButton}
            onPress={handleRateBarber}
          >
            <Ionicons name="star" size={20} color={Colors.white} />
            <Text style={styles.rateButtonText}>Rate & Review</Text>
          </TouchableOpacity>
        )}

        {/* Rejected - Find Another Barber */}
        {booking.status === 'rejected' && (
          <TouchableOpacity
            style={styles.findAnotherBarberButton}
            onPress={() => router.push('/(tabs)' as any)}
          >
            <Ionicons name="search" size={20} color={Colors.white} />
            <Text style={styles.findAnotherBarberButtonText}>Find Another Barber</Text>
          </TouchableOpacity>
        )}

        {!canCancel && !canRate && booking.status !== 'cancelled' && booking.status !== 'rejected' && booking.status !== 'on_the_way' && booking.status !== 'arrived' && (
          <View style={styles.infoMessage}>
            <Ionicons name="information-circle" size={20} color={Colors.gray[500]} />
            <Text style={styles.infoMessageText}>
              Your booking is currently {booking.status.replace(/_/g, ' ')}
            </Text>
          </View>
        )}
      </View>

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Booking?"
        message="Are you sure you want to cancel this booking? This action cannot be undone."
        icon="close-circle"
        iconColor={Colors.error}         confirmText="Yes, Cancel Booking"
        cancelText="No, Keep Booking"
        onConfirm={() => cancelMutation.mutate('Customer requested cancellation')}
        isDestructive={true}
        isLoading={cancelMutation.isPending}
      />

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Booking Cancelled"
        message="Your booking has been cancelled successfully."
        icon="checkmark-circle"
        iconColor={Colors.primary}         primaryButton={{
          label: 'Go to Bookings',
          onPress: () => {
            setShowSuccessModal(false);
            router.replace('/(tabs)/bookings' as any);
          },
          icon: 'list-outline',
        }}
      />

      {/* Dispute Modal */}
      <ConfirmationModal
        visible={showDisputeModal}
        onClose={() => {
          setShowDisputeModal(false);
          setDisputeReason('');
        }}
        title="Report Service Issue"
        message="Please describe the issue with the service. Our admin will review and contact you."
        icon="alert-circle"
        iconColor={Colors.warning}
        confirmText="Submit Report"
        cancelText="Cancel"
        onConfirm={() => {
          if (disputeReason.trim().length < 10) {
            Alert.alert('Required', 'Please provide at least 10 characters describing the issue');
            return;
          }
          reportIssueMutation.mutate(disputeReason);
        }}
        isDestructive={false}
        isLoading={reportIssueMutation.isPending}
      >
        <TextInput
          style={styles.disputeInput}
          placeholder="Describe the issue (minimum 10 characters)"
          value={disputeReason}
          onChangeText={setDisputeReason}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </ConfirmationModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.gray[500],
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: Colors.gray[500],
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
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
  backIconButton: {
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
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statusCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIcon: {
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: Colors.gray[500],
    textAlign: 'center',
    marginBottom: 12,
  },
  bookingId: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray[400],
    letterSpacing: 1,
  },
  serviceTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.gray[100],
    borderRadius: 8,
  },
  serviceTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray[500],
  },
  progressCard: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  trackingInfoSection: {
    gap: 8,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  subsectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.gray[500],
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  // Grab-style Timeline Styles
  completedSection: {
    paddingBottom: 16,
  },
  completedStep: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  completedStepText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.gray[500],
    flex: 1,
  },
  completedStepTextNoFlex: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.gray[500],
  },
  stepTextWithEta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  completedStepTime: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  inlineEtaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 4,
  },
  inlineEtaText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.status.ready,
  },
  currentStepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 16,
  },
  currentStepIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  currentStepInfo: {
    flex: 1,
  },
  currentStepLabel: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  currentStepDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray[500],
    lineHeight: 20,
  },
  etaInfoContainer: {
    marginTop: 12,
    gap: 8,
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  etaText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.status.ready,
  },
  nextStepsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  nextStepsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.gray[400],
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  nextStepsList: {
    gap: 8,
  },
  nextStepItem: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray[500],
    lineHeight: 20,
  },
  barberInfo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  barberAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: 16,
  },
  barberDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  barberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  barberName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    flexShrink: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginLeft: 4,
  },
  ratingCount: {
    fontSize: 14,
    color: Colors.gray[500],
    marginLeft: 4,
  },
  jobsSeparator: {
    fontSize: 14,
    color: Colors.gray[500],
    marginLeft: 4,
  },
  jobsCount: {
    fontSize: 14,
    color: Colors.gray[500],
    marginLeft: 4,
  },
  barberPhone: {
    fontSize: 14,
    color: Colors.gray[500],
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    gap: 8,
  },
  contactButtonFull: {
    flex: 1,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
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
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  serviceDuration: {
    fontSize: 13,
    color: Colors.gray[500],
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  dividerLine: {
    height: 1,
    backgroundColor: Colors.gray[100],
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray[500],
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  infoNote: {
    fontSize: 13,
    color: Colors.gray[500],
    fontStyle: 'italic',
    marginTop: 4,
  },
  notesText: {
    fontSize: 15,
    color: Colors.gray[700],
    lineHeight: 22,
  },
  cancelCard: {
    borderWidth: 1,
    borderColor: Colors.errorLight,
    backgroundColor: '#FEF2F2',
  },
  cancelReason: {
    fontSize: 15,
    color: Colors.gray[700],
    marginBottom: 8,
  },
  cancelDate: {
    fontSize: 13,
    color: Colors.gray[400],
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymentLabel: {
    fontSize: 15,
    color: Colors.gray[500],
  },
  paymentValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  paymentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.warningLight,
  },
  paymentBadgePaid: {
    backgroundColor: Colors.successLight,
  },
  paymentBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.warning,
  },
  paymentBadgeTextPaid: {
    color: Colors.success,
  },
  paymentMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentReminder: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.warningLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  paymentReminderText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#92400E',
    lineHeight: 18,
  },
  bottomActions: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  cancelBookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.error,
    backgroundColor: Colors.white,
    gap: 8,
  },
  cancelBookingButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.error,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    gap: 8,
  },
  rateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    gap: 8,
    marginBottom: 12,
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  trackBarberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#0EA5E9',
    gap: 8,
    marginBottom: 12,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  trackBarberButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  findAnotherBarberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    gap: 8,
  },
  findAnotherBarberButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  infoMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  infoMessageText: {
    fontSize: 14,
    color: Colors.gray[500],
  },
  // Quick Book styles
  successBanner: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: Colors.primaryLight,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    color: Colors.gray[500],
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.gray[500],
    marginTop: 4,
    marginBottom: 16,
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  serviceSelectionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    backgroundColor: Colors.white,
    marginBottom: 12,
  },
  serviceSelectionCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  serviceSelectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  serviceRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceRadioActive: {
    borderColor: Colors.primary,
  },
  serviceRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  serviceTextContainer: {
    flex: 1,
  },
  serviceSelectionName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
    flexShrink: 1,
  },
  serviceSelectionDuration: {
    fontSize: 13,
    color: Colors.gray[500],
  },
  serviceSelectionPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    flexShrink: 0,
    minWidth: 70,
    textAlign: 'right',
  },
  quickBookSummary: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.gray[500],
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'right',
    marginLeft: 12,
    flex: 1,
  },
  travelFeeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  travelFeeLabelText: {
    fontSize: 14,
    color: Colors.gray[500],
  },
  bottomActionBar: {
    backgroundColor: Colors.white,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    gap: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmServiceButtonDisabled: {
    backgroundColor: Colors.gray[300],
    shadowOpacity: 0,
  },
  confirmServiceButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  noServicesContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  noServicesText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.gray[400],
  },
  // Service Completion Confirmation Styles - New Compact Design
  confirmationCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  timerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confirmHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  confirmDescription: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  reportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.error,
    gap: 6,
  },
  reportBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.error,
  },
  confirmInfoContainer: {
    alignItems: 'center',
  },
  confirmInfo: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  confirmInfoTimer: {
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.error,
    gap: 8,
  },
  reportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  reportButtonLink: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 12,
  },
  reportButtonLinkText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.error,
    marginBottom: 6,
  },
  reportButtonSubtext: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  confirmationNote: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  confirmedCard: {
    backgroundColor: Colors.successLight,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  confirmedText: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '600',
  },
  disputedCard: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: 'row',
    gap: 12,
  },
  disputedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  disputedText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },
  disputeReason: {
    fontSize: 13,
    color: '#92400E',
    marginTop: 8,
    fontStyle: 'italic',
  },
  disputeInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text.primary,
    minHeight: 100,
    marginTop: 12,
  },
});
