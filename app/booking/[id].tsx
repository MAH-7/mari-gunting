import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, StyleSheet, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/services/api';
import { formatCurrency, formatPrice, formatShortDate, formatTime } from '@/utils/format';
import { BookingStatus } from '@/types';
import { useState } from 'react';
import ConfirmationModal from '@/components/ConfirmationModal';
import SuccessModal from '@/components/SuccessModal';

export default function BookingDetailScreen() {
  const { id, quickBook } = useLocalSearchParams<{ id: string; quickBook?: string }>();
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Check if this is a Quick Book flow (service not selected yet)
  const isQuickBookFlow = quickBook === 'true';

  const { data: bookingResponse, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => api.getBookingById(id),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => api.cancelBooking(id, reason),
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

  const getStatusConfig = (status: BookingStatus) => {
    const configs = {
      pending: { 
        color: '#F59E0B', 
        bg: '#FEF3C7', 
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
      'on-the-way': { 
        color: '#8B5CF6', 
        bg: '#EDE9FE', 
        label: 'Barber On The Way',
        iconName: 'car' as const,
        description: 'Your barber is heading to your location'
      },
      'in-progress': { 
        color: '#00B14F', 
        bg: '#D1FAE5', 
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
    Alert.alert('Coming Soon', 'Rating feature will be available soon');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00B14F" />
          <Text style={styles.loadingText}>Loading booking details...</Text>
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
  const canContact = booking.status === 'accepted' || booking.status === 'on-the-way' || booking.status === 'in-progress';

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
          <Text style={styles.bookingId}>Booking #{booking.id.slice(-8).toUpperCase()}</Text>
        </View>

        {/* Progress Tracker */}
        {booking.status !== 'cancelled' && (
          <View style={styles.progressCard}>
            <Text style={styles.sectionTitle}>Status Timeline</Text>
            <View style={styles.timelineContainer}>
              {['pending', 'accepted', 'on-the-way', 'in-progress', 'completed'].map((status, index) => {
                const isActive = ['pending', 'accepted', 'on-the-way', 'in-progress', 'completed'].indexOf(booking.status) >= index;
                const isCurrent = booking.status === status;
                
                return (
                  <View key={status} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      <View style={[
                        styles.timelineDot,
                        isActive && styles.timelineDotActive,
                        isCurrent && styles.timelineDotCurrent
                      ]}>
                        {isActive && <View style={styles.timelineDotInner} />}
                      </View>
                      {index < 4 && (
                        <View style={[
                          styles.timelineLine,
                          isActive && styles.timelineLineActive
                        ]} />
                      )}
                    </View>
                    <Text style={[
                      styles.timelineLabel,
                      isActive && styles.timelineLabelActive
                    ]}>
                      {status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </Text>
                  </View>
                );
              })}
            </View>
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
                <Text style={styles.barberName}>{booking.barber.name}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text style={styles.ratingText}>{booking.barber.rating?.toFixed(1) || '0.0'}</Text>
                  <Text style={styles.ratingCount}>({booking.barber.completedJobs || 0} jobs)</Text>
                </View>
                <Text style={styles.barberPhone}>{booking.barber.phone || 'N/A'}</Text>
              </View>
            </View>

            {canContact && (
              <View style={styles.contactButtons}>
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={handleCallBarber}
                >
                  <Ionicons name="call" size={20} color="#00B14F" />
                  <Text style={styles.contactButtonText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={handleChatBarber}
                >
                  <Ionicons name="chatbubble" size={20} color="#00B14F" />
                  <Text style={styles.contactButtonText}>Chat</Text>
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
          
          {booking.travelCost !== undefined && booking.travelCost > 0 && (
            <>
              <View style={styles.dividerLine} />
              <View style={styles.serviceItem}>
                <View style={styles.serviceLeft}>
                  <Ionicons name="car" size={18} color="#00B14F" style={{ marginRight: 12 }} />
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>Travel Cost</Text>
                    {booking.distance && (
                      <Text style={styles.serviceDuration}>{booking.distance.toFixed(1)} km</Text>
                    )}
                  </View>
                </View>
                <Text style={styles.servicePrice}>{formatCurrency(booking.travelCost)}</Text>
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
            <Text style={styles.servicePrice}>RM 2.00</Text>
          </View>
          
          <View style={styles.dividerLine} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(booking.totalPrice || booking.price || 0)}</Text>
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
        {booking.notes && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <Text style={styles.notesText}>{booking.notes}</Text>
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

        {/* Payment Info */}
        {booking.payment && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Payment</Text>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Method</Text>
              <Text style={styles.paymentValue}>
                {booking.payment.method.toUpperCase()}
              </Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Status</Text>
              <View style={[
                styles.paymentBadge,
                booking.payment.status === 'paid' && styles.paymentBadgePaid
              ]}>
                <Text style={[
                  styles.paymentBadgeText,
                  booking.payment.status === 'paid' && styles.paymentBadgeTextPaid
                ]}>
                  {booking.payment.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
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

        {!canCancel && !canRate && booking.status !== 'cancelled' && (
          <View style={styles.infoMessage}>
            <Ionicons name="information-circle" size={20} color="#6B7280" />
            <Text style={styles.infoMessageText}>
              Your booking is currently {booking.status.replace('-', ' ')}
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
  timelineContainer: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotActive: {
    borderColor: '#00B14F',
  },
  timelineDotCurrent: {
    borderColor: '#00B14F',
    backgroundColor: '#00B14F',
  },
  timelineDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00B14F',
  },
  timelineLine: {
    width: 2,
    height: 32,
    backgroundColor: '#E5E7EB',
  },
  timelineLineActive: {
    backgroundColor: '#00B14F',
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    paddingTop: 2,
  },
  timelineLabelActive: {
    color: '#111827',
    fontWeight: '600',
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
  barberName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
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
