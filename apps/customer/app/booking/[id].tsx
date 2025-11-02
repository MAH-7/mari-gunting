import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, StyleSheet, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { bookingService } from '@mari-gunting/shared/services/bookingService';
import { formatCurrency, formatPrice, formatShortDate, formatTime } from '@/utils/format';
import { BookingStatus } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@mari-gunting/shared/store/useStore';
import ConfirmationModal from '@/components/ConfirmationModal';
import SuccessModal from '@/components/SuccessModal';
import { SkeletonCircle, SkeletonText, SkeletonBase } from '@/components/Skeleton';
import { supabase } from '@mari-gunting/shared/config/supabase';
import { useFocusEffect } from '@react-navigation/native';

export default function BookingDetailScreen() {
  const { id, quickBook } = useLocalSearchParams<{ id: string; quickBook?: string }>();
  const currentUser = useStore((state) => state.currentUser);
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
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

  const booking = bookingResponse?.data;
  
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
  
  const confirmServiceMutation = useMutation({
    mutationFn: (serviceId: string) => {
      // TODO: Update booking with selected service
      return Promise.resolve({ success: true });
    },
    onSuccess: () => {
      // Navigate to payment method selection
      const service = availableServices.find(s => s.id === selectedService);
      const total = (service?.price || 0) + travelFee;
      
      router.push({
        pathname: '/payment-method',
        params: {
          bookingId: booking?.id || '',
          amount: total.toFixed(2),
          serviceName: service?.name || '',
          barberName: booking?.barberName || '',
        },
      } as any);
    },
  });
  
  const handleConfirmService = () => {
    if (!selectedService) {
      Alert.alert('Required', 'Please select a service');
      return;
    }
    confirmServiceMutation.mutate(selectedService);
  };

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

  const getStatusConfig = (status: BookingStatus) => {
    const configs = {
      pending: { 
        color: '#6B7280', 
        bg: '#F3F4F6', 
        label: 'Pending Confirmation',
        iconName: 'time-outline' as const,
        description: 'Waiting for barber to accept'
      },
      accepted: { 
        color: '#3B82F6', 
        bg: '#DBEAFE', 
        label: 'Accepted',
        iconName: 'checkmark-circle' as const,
        description: 'Barber will arrive at scheduled time'
      },
      on_the_way: { 
        color: '#8B5CF6', 
        bg: '#F3E8FF', 
        label: 'On The Way',
        iconName: 'car' as const,
        description: 'Your barber is heading to your location'
      },
      arrived: { 
        color: '#F97316', 
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
        color: '#10B981', 
        bg: '#D1FAE5', 
        label: 'Completed',
        iconName: 'checkmark-circle' as const,
        description: 'Service completed successfully'
      },
      cancelled: { 
        color: '#EF4444', 
        bg: '#FEE2E2', 
        label: 'Cancelled',
        iconName: 'close-circle' as const,
        description: 'This booking has been cancelled'
      },
      rejected: { 
        color: '#EF4444', 
        bg: '#FEE2E2', 
        label: 'Rejected',
        iconName: 'close-circle-outline' as const,
        description: 'Barber declined this booking'
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
    Alert.alert('Coming Soon', 'Chat feature will be available soon');
  };

  const handleRateBarber = () => {
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
            <Ionicons name="arrow-back" size={24} color="#111827" />
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
          <View style={[styles.statusCard, { backgroundColor: '#F3F4F6', alignItems: 'center', paddingVertical: 32 }]}>
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
              <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 }} />
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
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
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
  const canRate = booking.status === 'completed' && !booking.review;
  
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
            <Ionicons name="arrow-back" size={24} color="#111827" />
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
            <Ionicons name="checkmark-circle" size={64} color="#00B14F" />
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
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text style={styles.ratingText}>{barber?.rating?.toFixed(1) || '4.9'}</Text>
                  <Text style={styles.ratingCount}>({barber?.completedJobs || 250}+ jobs)</Text>
                </View>
                <View style={styles.distanceInfo}>
                  <Ionicons name="location" size={14} color="#00B14F" />
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
                <Ionicons name="information-circle-outline" size={48} color="#9CA3AF" />
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
                        <Ionicons name="car" size={16} color="#6B7280" />
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
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
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
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
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
              color="#6B7280" 
            />
            <Text style={styles.serviceTypeText}>
              {booking.service_type === 'home_service' ? 'Home Service' : 'Walk-in'}
            </Text>
          </View>
        </View>

        {/* Progress Tracker - Grab Style */}
        {booking.status !== 'cancelled' && booking.status !== 'rejected' && (
          <View style={styles.progressCard}>
            {/* Completed Steps */}
            {booking.status !== 'pending' && (
              <View style={styles.completedSection}>
                {booking.acceptedAt && (
                  <View style={styles.completedStep}>
                    <Ionicons name="checkmark-circle" size={16} color="#00B14F" />
                    <Text style={styles.completedStepText}>Accepted</Text>
                    <Text style={styles.completedStepTime}>{formatTime(booking.acceptedAt)}</Text>
                  </View>
                )}
                {booking.onTheWayAt && (
                  <View style={styles.completedStep}>
                    <Ionicons name="checkmark-circle" size={16} color="#00B14F" />
                    <Text style={styles.completedStepText}>On The Way</Text>
                    <Text style={styles.completedStepTime}>{formatTime(booking.onTheWayAt)}</Text>
                  </View>
                )}
                {booking.arrivedAt && (
                  <View style={styles.completedStep}>
                    <Ionicons name="checkmark-circle" size={16} color="#00B14F" />
                    <Text style={styles.completedStepText}>Arrived</Text>
                    <Text style={styles.completedStepTime}>{formatTime(booking.arrivedAt)}</Text>
                  </View>
                )}
                {booking.startedAt && (
                  <View style={styles.completedStep}>
                    <Ionicons name="checkmark-circle" size={16} color="#00B14F" />
                    <Text style={styles.completedStepText}>Service Started</Text>
                    <Text style={styles.completedStepTime}>{formatTime(booking.startedAt)}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Current Step - BIG & PROMINENT */}
            <View style={styles.currentStepContainer}>
              <View style={[styles.currentStepIcon, { backgroundColor: statusConfig.bg }]}>
                <Ionicons name={statusConfig.iconName} size={36} color={statusConfig.color} />
              </View>
              <View style={styles.currentStepInfo}>
                <Text style={[styles.currentStepLabel, { color: statusConfig.color }]}>
                  {statusConfig.label.toUpperCase()}
                </Text>
                <Text style={styles.currentStepDescription}>{statusConfig.description}</Text>
                
                {/* ETA for on_the_way and arrived */}
                {booking.status === 'on_the_way' && (
                  <View style={styles.etaInfoContainer}>
                    {booking.current_eta_minutes && (
                      <View style={styles.etaContainer}>
                        <Ionicons name="time-outline" size={14} color="#8B5CF6" />
                        <Text style={styles.etaText}>
                          Arriving in ~{booking.current_eta_minutes} min
                        </Text>
                      </View>
                    )}
                    {booking.current_distance_km && (
                      <View style={styles.etaContainer}>
                        <Ionicons name="location-outline" size={14} color="#8B5CF6" />
                        <Text style={styles.etaText}>
                          {booking.current_distance_km.toFixed(1)} km away
                        </Text>
                      </View>
                    )}
                  </View>
                )}
                {booking.status === 'arrived' && (
                  <View style={styles.etaContainer}>
                    <Ionicons name="checkmark-circle" size={14} color="#00B14F" />
                    <Text style={[styles.etaText, { color: '#00B14F' }]}>
                      Barber has arrived
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Next Steps */}
            {booking.status !== 'completed' && (
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
                  <Text style={styles.barberName}>{booking.barber.name}</Text>
                  {booking.barber.isVerified && (
                    <Ionicons name="checkmark-circle" size={18} color="#007AFF" />
                  )}
                </View>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text style={styles.ratingText}>{booking.barber.rating?.toFixed(1) || '0.0'}</Text>
                  <Text style={styles.ratingCount}>({booking.barber.totalReviews || 0} reviews)</Text>
                  <Text style={styles.jobsSeparator}>•</Text>
                  <Text style={styles.jobsCount}>{booking.barber.completedJobs || 0} jobs</Text>
                </View>
              </View>
            </View>

            {canChat && (
              <View style={styles.contactButtons}>
                <TouchableOpacity
                  style={[styles.contactButton, styles.contactButtonFull]}
                  onPress={handleChatBarber}
                >
                  <Ionicons name="chatbubble" size={20} color="#00B14F" />
                  <Text style={styles.contactButtonText}>Chat with Barber</Text>
                </TouchableOpacity>
              </View>
            )}
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
                  <Ionicons name="car" size={18} color="#00B14F" style={{ marginRight: 12 }} />
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
              <Ionicons name="shield-checkmark" size={18} color="#00B14F" style={{ marginRight: 12 }} />
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
          
          {booking.scheduledDate && booking.scheduledTime ? (
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="calendar" size={20} color="#00B14F" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Date & Time</Text>
                <Text style={styles.infoValue}>
                  {formatShortDate(booking.scheduledDate)} at {formatTime(booking.scheduledTime)}
                </Text>
              </View>
            </View>
          ) : booking.scheduledAt ? (
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="calendar" size={20} color="#00B14F" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Scheduled At</Text>
                <Text style={styles.infoValue}>
                  {new Date(booking.scheduledAt).toLocaleString()}
                </Text>
              </View>
            </View>
          ) : null}

          {booking.duration && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="time" size={20} color="#00B14F" />
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
                <Ionicons name="location" size={20} color="#00B14F" />
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
                <Ionicons name="location" size={20} color="#00B14F" />
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

        {/* Cancellation Info */}
        {booking.status === 'cancelled' && booking.cancellationReason && (
          <View style={[styles.card, styles.cancelCard]}>
            <Text style={styles.sectionTitle}>Cancellation Reason</Text>
            <Text style={styles.cancelReason}>{booking.cancellationReason}</Text>
            <Text style={styles.cancelDate}>
              Cancelled on {formatShortDate(booking.cancelledAt || '')}
            </Text>
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
                Rejected on {formatShortDate(booking.cancelledAt)}
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
                color={booking.payment_method === 'cash' ? '#F59E0B' : '#00B14F'} 
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
                {(booking.payment_status || 'pending').toUpperCase()}
              </Text>
            </View>
          </View>
          
          {/* Cash Payment Reminder */}
          {booking.payment_method === 'cash' && booking.payment_status === 'pending' && (
            <View style={styles.paymentReminder}>
              <Ionicons name="information-circle" size={20} color="#F59E0B" />
              <Text style={styles.paymentReminderText}>
                Please prepare RM {booking.total_price?.toFixed(2) || '0.00'} in cash for payment after service
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        {/* Track Barber Button - Show when barber is on the way or arrived */}
        {(booking.status === 'on_the_way' || booking.status === 'arrived') && (
          <TouchableOpacity
            style={styles.trackBarberButton}
            onPress={() => router.push(`/booking/track-barber?bookingId=${booking.id}` as any)}
          >
            <Ionicons name="navigate" size={20} color="#FFFFFF" />
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
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <>
                <Ionicons name="close-circle" size={20} color="#EF4444" />
                <Text style={styles.cancelBookingButtonText}>Cancel Booking</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {canRate && (
          <TouchableOpacity
            style={styles.rateButton}
            onPress={handleRateBarber}
          >
            <Ionicons name="star" size={20} color="#FFFFFF" />
            <Text style={styles.rateButtonText}>Rate & Review</Text>
          </TouchableOpacity>
        )}

        {/* Rejected - Find Another Barber */}
        {booking.status === 'rejected' && (
          <TouchableOpacity
            style={styles.findAnotherBarberButton}
            onPress={() => router.push('/(tabs)/home' as any)}
          >
            <Ionicons name="search" size={20} color="#FFFFFF" />
            <Text style={styles.findAnotherBarberButtonText}>Find Another Barber</Text>
          </TouchableOpacity>
        )}

        {!canCancel && !canRate && booking.status !== 'cancelled' && booking.status !== 'rejected' && booking.status !== 'on_the_way' && booking.status !== 'arrived' && (
          <View style={styles.infoMessage}>
            <Ionicons name="information-circle" size={20} color="#6B7280" />
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
        iconColor="#EF4444"
        confirmText="Yes, Cancel Booking"
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
        iconColor="#00B14F"
        primaryButton={{
          label: 'Go to Bookings',
          onPress: () => {
            setShowSuccessModal(false);
            router.replace('/(tabs)/bookings' as any);
          },
          icon: 'list-outline',
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
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
    color: '#111827',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: '#00B14F',
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
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
  backIconButton: {
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
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  bookingId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 1,
  },
  serviceTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  serviceTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
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
    color: '#111827',
    marginBottom: 16,
  },
  subsectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  // Grab-style Timeline Styles
  completedSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
    color: '#6B7280',
    flex: 1,
  },
  completedStepTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00B14F',
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
    color: '#6B7280',
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
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  etaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  nextStepsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  nextStepsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
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
    color: '#6B7280',
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
    color: '#111827',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 4,
  },
  ratingCount: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  jobsSeparator: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  jobsCount: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  barberPhone: {
    fontSize: 14,
    color: '#6B7280',
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
    borderColor: '#00B14F',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  contactButtonFull: {
    flex: 1,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#00B14F',
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
    backgroundColor: '#00B14F',
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  serviceDuration: {
    fontSize: 13,
    color: '#6B7280',
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#F3F4F6',
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
    color: '#111827',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00B14F',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
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
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  infoNote: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  notesText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  cancelCard: {
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  cancelReason: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 8,
  },
  cancelDate: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymentLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  paymentValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  paymentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
  },
  paymentBadgePaid: {
    backgroundColor: '#D1FAE5',
  },
  paymentBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F59E0B',
  },
  paymentBadgeTextPaid: {
    color: '#00B14F',
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
    backgroundColor: '#FEF3C7',
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
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
    borderColor: '#EF4444',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  cancelBookingButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#00B14F',
    gap: 8,
  },
  rateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
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
    color: '#FFFFFF',
  },
  findAnotherBarberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#00B14F',
    gap: 8,
  },
  findAnotherBarberButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
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
    color: '#6B7280',
  },
  // Quick Book styles
  successBanner: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#F0FDF4',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    color: '#6B7280',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
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
    color: '#00B14F',
  },
  serviceSelectionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  serviceSelectionCardActive: {
    borderColor: '#00B14F',
    backgroundColor: '#F0FDF4',
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
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceRadioActive: {
    borderColor: '#00B14F',
  },
  serviceRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00B14F',
  },
  serviceTextContainer: {
    flex: 1,
  },
  serviceSelectionName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
    flexShrink: 1,
  },
  serviceSelectionDuration: {
    fontSize: 13,
    color: '#6B7280',
  },
  serviceSelectionPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00B14F',
    flexShrink: 0,
    minWidth: 70,
    textAlign: 'right',
  },
  quickBookSummary: {
    backgroundColor: '#FFFFFF',
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
    color: '#111827',
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
    color: '#6B7280',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
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
    color: '#6B7280',
  },
  bottomActionBar: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
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
    backgroundColor: '#00B14F',
    borderRadius: 16,
    paddingVertical: 18,
    gap: 10,
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmServiceButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
  },
  confirmServiceButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
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
    color: '#9CA3AF',
  },
});
