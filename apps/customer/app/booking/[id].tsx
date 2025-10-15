// ENHANCED BOOKING DETAILS SCREEN - All Phases 1-3 Implementation
// This file will replace the current booking/[id].tsx after testing

import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, StyleSheet, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency, formatPrice, formatShortDate, formatTime, formatDate } from '@/utils/format';
import { bookingService } from '@mari-gunting/shared/services/bookingService';
import { useStore } from '@/store/useStore';
import { BookingStatus, BookingType } from '@/types';
import { useState, useMemo, useEffect } from 'react';
import ConfirmationModal from '@/components/ConfirmationModal';
import SuccessModal from '@/components/SuccessModal';
import PointsEarnedModal from '@/components/PointsEarnedModal';
import { SkeletonCircle, SkeletonText, SkeletonBase } from '@/components/Skeleton';
import * as Calendar from 'expo-calendar';
import { useBookingCompletion } from '@/hooks/useBookingCompletion';
import { supabase } from '@mari-gunting/shared/config/supabase';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUser = useStore((state) => state.currentUser);
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  const { data: bookingResponse, isLoading, refetch } = useQuery({
    queryKey: ['booking-details', id],
    queryFn: () => bookingService.getBookingById(id!),
    enabled: !!id,
    // Real-time subscription replaces polling
  });

  // Real-time subscription for booking status updates
  useEffect(() => {
    if (!id) return;

    console.log('🔌 Setting up real-time subscription for booking:', id);

    // Subscribe to this specific booking's changes
    const channel = supabase
      .channel(`booking-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          console.log('🔔 Booking UPDATE received:', payload);
          const newData = payload.new as any;
          const oldData = payload.old as any;
          
          console.log('Status changed:', oldData?.status, '→', newData?.status);
          
          // Refetch booking data to update UI
          refetch();
          
          // Also invalidate the bookings list
          queryClient.invalidateQueries({ queryKey: ['customer-bookings'] });
          
          // Show notifications for important status changes
          if (oldData?.status !== newData?.status) {
            if (newData?.status === 'accepted') {
              Alert.alert('Booking Accepted', 'Your barber has confirmed the booking!');
            } else if (newData?.status === 'on-the-way') {
              Alert.alert('Barber On The Way', 'Your barber is heading to your location!');
            } else if (newData?.status === 'in-progress') {
              Alert.alert('Service Started', 'Your haircut service has started.');
            } else if (newData?.status === 'completed') {
              Alert.alert('Service Completed', 'Thank you! Please rate your experience.');
            } else if (newData?.status === 'cancelled') {
              Alert.alert('Booking Cancelled', 'This booking has been cancelled.');
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Booking subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to booking updates');
        }
      });

    return () => {
      console.log('🔌 Cleaning up booking subscription');
      supabase.removeChannel(channel);
    };
  }, [id, refetch, queryClient]);

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => 
      bookingService.cancelBooking(id!, currentUser?.id!, reason),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['booking-details', id] });
      queryClient.invalidateQueries({ queryKey: ['customer-bookings'] });
      setShowCancelModal(false);
      Alert.alert(
        'Booking Cancelled',
        result.data?.message || 'Your booking has been cancelled.',
        [{ text: 'OK', onPress: () => setShowSuccessModal(true) }]
      );
    },
    onError: (error: any) => {
      setShowCancelModal(false);
      Alert.alert('Error', error.message || 'Failed to cancel booking. Please try again.');
    },
  });

  const booking = bookingResponse?.data;
  
  // Determine booking type
  const bookingType: BookingType = booking?.type || (booking?.shopId ? 'scheduled-shop' : 'on-demand');
  const isBarbershop = bookingType === 'scheduled-shop';
  
  // Handle points awarding on completion
  useBookingCompletion({
    booking,
    onPointsAwarded: (points) => {
      setPointsEarned(points);
      setShowPointsModal(true);
    },
  });

  // STATUS TIMELINE CONFIGURATIONS (Phase 1.5)
  const getStatusSteps = () => {
    if (isBarbershop) {
      return [
        { key: 'pending', label: 'Booking Received', icon: 'time-outline' },
        { key: 'confirmed', label: 'Confirmed', icon: 'checkmark-circle' },
        { key: 'ready', label: 'Ready for You', icon: 'storefront' },
        { key: 'in-progress', label: 'Service Started', icon: 'cut' },
        { key: 'completed', label: 'Completed', icon: 'checkmark-done' },
      ];
    }
    
    return [
      { key: 'pending', label: 'Finding Barber', icon: 'search' },
      { key: 'accepted', label: 'Barber Confirmed', icon: 'checkmark-circle' },
      { key: 'on-the-way', label: 'On The Way', icon: 'car' },
      { key: 'in-progress', label: 'Service Started', icon: 'cut' },
      { key: 'completed', label: 'Completed', icon: 'checkmark-done' },
    ];
  };

  const statusSteps = getStatusSteps();

  // STATUS CONFIGURATION (Enhanced for both types)
  const getStatusConfig = (status: BookingStatus) => {
    const configs = {
      pending: {
        color: '#F59E0B',
        bg: '#FEF3C7',
        label: isBarbershop ? 'Pending Confirmation' : 'Finding Barber',
        iconName: 'time-outline' as const,
        description: isBarbershop ? 'Waiting for shop confirmation' : 'Searching for available barber',
      },
      confirmed: {
        color: '#3B82F6',
        bg: '#DBEAFE',
        label: 'Confirmed',
        iconName: 'checkmark-circle' as const,
        description: 'Your appointment is confirmed',
      },
      accepted: {
        color: '#3B82F6',
        bg: '#DBEAFE',
        label: 'Accepted',
        iconName: 'checkmark-circle' as const,
        description: 'Barber will arrive at scheduled time',
      },
      ready: {
        color: '#8B5CF6',
        bg: '#EDE9FE',
        label: 'Ready for You',
        iconName: 'storefront' as const,
        description: 'Shop is ready for your visit',
      },
      'on-the-way': {
        color: '#8B5CF6',
        bg: '#EDE9FE',
        label: 'Barber On The Way',
        iconName: 'car' as const,
        description: 'Your barber is heading to your location',
      },
      'in-progress': {
        color: '#00B14F',
        bg: '#D1FAE5',
        label: 'Service In Progress',
        iconName: 'cut' as const,
        description: 'Service is currently being performed',
      },
      completed: {
        color: '#10B981',
        bg: '#D1FAE5',
        label: 'Completed',
        iconName: 'checkmark-circle' as const,
        description: 'Service completed successfully',
      },
      cancelled: {
        color: '#EF4444',
        bg: '#FEE2E2',
        label: 'Cancelled',
        iconName: 'close-circle' as const,
        description: 'This booking has been cancelled',
      },
    };
    return configs[status] || configs.pending;
  };

  const statusConfig = booking ? getStatusConfig(booking.status) : getStatusConfig('pending');

  // Action permissions
  const canCancel = booking?.status === 'pending' || booking?.status === 'accepted' || booking?.status === 'confirmed';
  const canRate = booking?.status === 'completed';
  const canContact = booking?.status === 'accepted' || booking?.status === 'on-the-way' || booking?.status === 'in-progress';

  // Phase 2.3: Get Directions Handler
  const handleGetDirections = () => {
    if (!booking?.shopAddress) return;
    
    const address = encodeURIComponent(booking.shopAddress);
    const url = Platform.select({
      ios: `maps://app?daddr=${address}`,
      android: `geo:0,0?q=${address}`,
    });

    if (url) {
      Linking.openURL(url).catch(() => {
        // Fallback to Google Maps web
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${address}`);
      });
    }
  };

  // Phase 3.1: Add to Calendar
  const handleAddToCalendar = async () => {
    if (!booking?.scheduledDate || !booking?.scheduledTime) return;

    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant calendar permission to add this appointment.');
        return;
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(cal => cal.isPrimary) || calendars[0];

      if (!defaultCalendar) {
        Alert.alert('Error', 'No calendar found on your device.');
        return;
      }

      // Parse date and time
      const [year, month, day] = booking.scheduledDate.split('-').map(Number);
      const [hours, minutes] = booking.scheduledTime.split(':').map(Number);
      
      const startDate = new Date(year, month - 1, day, hours, minutes);
      const endDate = new Date(startDate.getTime() + (booking.duration || 60) * 60000);

      const eventId = await Calendar.createEventAsync(defaultCalendar.id, {
        title: `Haircut at ${booking.shopName}`,
        startDate,
        endDate,
        location: booking.shopAddress,
        notes: `Barber: ${booking.barberName}\nServices: ${booking.serviceName}`,
      });

      if (eventId) {
        Alert.alert('Success', 'Appointment added to your calendar!');
      }
    } catch (error) {
      console.error('Error adding to calendar:', error);
      Alert.alert('Error', 'Failed to add to calendar. Please try again.');
    }
  };

  // Phase 2.2: Calculate countdown
  const getTimeUntilAppointment = () => {
    if (!booking?.scheduledDate || !booking?.scheduledTime) return null;

    const [year, month, day] = booking.scheduledDate.split('-').map(Number);
    const [hours, minutes] = booking.scheduledTime.split(':').map(Number);
    const appointmentDate = new Date(year, month - 1, day, hours, minutes);
    const now = new Date();
    const diffMs = appointmentDate.getTime() - now.getTime();
    
    if (diffMs < 0) return null; // Past appointment

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours < 1) {
      return `Starts in ${diffMinutes} minutes`;
    } else if (diffHours < 24) {
      return `Starts in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }
  };

  const timeUntil = getTimeUntilAppointment();

  // Handlers
  const handleCancelBooking = () => {
    setShowCancelModal(true);
  };

  const handleCallBarber = () => {
    if (booking?.barber?.phone) {
      Linking.openURL(`tel:${booking.barber.phone}`);
    }
  };

  const handleCallShop = () => {
    if (booking?.shopPhone) {
      Linking.openURL(`tel:${booking.shopPhone}`);
    }
  };

  const handleChatBarber = () => {
    Alert.alert('Coming Soon', 'Chat feature will be available soon');
  };

  const handleRateBarber = () => {
    Alert.alert('Rate Barber', 'Rating feature coming soon!');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.statusCard, { backgroundColor: '#F3F4F6' }]}>
            <SkeletonCircle size={48} style={{ marginBottom: 16 }} />
            <SkeletonText width="60%" height={20} style={{ marginBottom: 8 }} />
            <SkeletonText width="80%" height={14} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Booking not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Phase 3.3: Header with visual differentiation */}
      <View style={[styles.header, isBarbershop && styles.headerBarbershop]}>
        <TouchableOpacity onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)/bookings' as any);
          }
        }}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Booking Details</Text>
          {isBarbershop && (
            <View style={styles.headerBadge}>
              <Ionicons name="storefront" size={12} color="#00B14F" />
              <Text style={styles.headerBadgeText}>Barbershop</Text>
            </View>
          )}
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Status Card - Phase 3.3: Visual differentiation */}
        <View style={[styles.statusCard, { backgroundColor: statusConfig.bg }]}>
          <Ionicons name={statusConfig.iconName} size={48} color={statusConfig.color} style={styles.statusIcon} />
          <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
          <Text style={styles.statusDescription}>{statusConfig.description}</Text>
          <Text style={styles.bookingId}>Booking #{booking.id.slice(-8).toUpperCase()}</Text>
          
          {/* Phase 3.2: Countdown for barbershop */}
          {isBarbershop && timeUntil && booking.status !== 'completed' && booking.status !== 'cancelled' && (
            <View style={styles.countdownBadge}>
              <Ionicons name="time-outline" size={14} color="#00B14F" />
              <Text style={styles.countdownText}>{timeUntil}</Text>
            </View>
          )}
        </View>

        {/* Phase 1.5: Smart Status Timeline */}
        {booking.status !== 'cancelled' && (
          <View style={styles.progressCard}>
            <Text style={styles.sectionTitle}>Status Timeline</Text>
            <View style={styles.timelineContainer}>
              {statusSteps.map((step, index) => {
                const isActive = statusSteps.findIndex(s => s.key === booking.status) >= index;
                const isCurrent = booking.status === step.key;

                return (
                  <View key={step.key} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      <View style={[
                        styles.timelineDot,
                        isActive && styles.timelineDotActive,
                        isCurrent && styles.timelineDotCurrent
                      ]}>
                        {isActive && <View style={styles.timelineDotInner} />}
                      </View>
                      {index < statusSteps.length - 1 && (
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
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Phase 1.7: Barbershop Location Card (for barbershop bookings) */}
        {isBarbershop && booking.shopName && (
          <View style={[styles.card, styles.shopCard]}>
            <Text style={styles.sectionTitle}>Barbershop</Text>
            <View style={styles.shopInfo}>
              <View style={styles.shopIconContainer}>
                <Ionicons name="storefront" size={32} color="#00B14F" />
              </View>
              <View style={styles.shopDetails}>
                <Text style={styles.shopName}>{booking.shopName}</Text>
                <View style={styles.shopAddressRow}>
                  <Ionicons name="location" size={14} color="#6B7280" />
                  <Text style={styles.shopAddress}>{booking.shopAddress}</Text>
                </View>
              </View>
            </View>

            {/* Phase 2.1: Action buttons for barbershop */}
            <View style={styles.shopActions}>
              <TouchableOpacity style={styles.shopActionButton} onPress={handleGetDirections}>
                <Ionicons name="navigate" size={20} color="#00B14F" />
                <Text style={styles.shopActionText}>Directions</Text>
              </TouchableOpacity>
              {booking.shopPhone && (
                <TouchableOpacity style={styles.shopActionButton} onPress={handleCallShop}>
                  <Ionicons name="call" size={20} color="#00B14F" />
                  <Text style={styles.shopActionText}>Call Shop</Text>
                </TouchableOpacity>
              )}
              {/* Phase 3.1: Add to Calendar */}
              {booking.scheduledDate && booking.scheduledTime && (
                <TouchableOpacity style={styles.shopActionButton} onPress={handleAddToCalendar}>
                  <Ionicons name="calendar" size={20} color="#00B14F" />
                  <Text style={styles.shopActionText}>Add to Calendar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Barber Info */}
        {booking.barber && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{isBarbershop ? 'Your Barber' : 'Barber'}</Text>
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
                {booking.barber.phone && (
                  <Text style={styles.barberPhone}>{booking.barber.phone}</Text>
                )}
              </View>
            </View>

            {/* Phase 2.1: Contact buttons (for freelance bookings) */}
            {!isBarbershop && canContact && (
              <View style={styles.contactButtons}>
                <TouchableOpacity style={styles.contactButton} onPress={handleCallBarber}>
                  <Ionicons name="call" size={20} color="#00B14F" />
                  <Text style={styles.contactButtonText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.contactButton} onPress={handleChatBarber}>
                  <Ionicons name="chatbubble" size={20} color="#00B14F" />
                  <Text style={styles.contactButtonText}>Chat</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Track Barber button (when barber is on the way) */}
            {!isBarbershop && ['accepted', 'on-the-way', 'in-progress'].includes(booking.status) && (
              <TouchableOpacity 
                style={styles.trackBarberButton} 
                onPress={() => router.push(`/booking/track-barber?bookingId=${booking.id}`)}
              >
                <Ionicons name="location" size={20} color="#FFFFFF" />
                <Text style={styles.trackBarberButtonText}>Track Barber Live</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Phase 1.6: Price Details with Travel Explanation */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Price Details</Text>

          {booking.services && booking.services.length > 0 ? (
            <>
              <Text style={styles.subsectionLabel}>Services</Text>
              {booking.services.map((service) => (
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

          {/* Phase 1.6: Travel with Explanation */}
          <View style={styles.dividerLine} />
          <View style={styles.serviceItem}>
            <View style={styles.serviceLeft}>
              <Ionicons name="car" size={18} color={isBarbershop ? '#9CA3AF' : '#00B14F'} style={{ marginRight: 12 }} />
              <View style={styles.serviceInfo}>
                <Text style={[styles.serviceName, isBarbershop && styles.serviceNameDisabled]}>
                  Travel
                </Text>
                <Text style={styles.serviceDuration}>
                  {isBarbershop ? 'Walk-in service' : `${booking.distance?.toFixed(1) || '0'} km`}
                </Text>
              </View>
            </View>
            <Text style={[styles.servicePrice, isBarbershop && styles.servicePriceDisabled]}>
              {isBarbershop ? 'RM 0.00' : formatCurrency(booking.travelCost || 0)}
            </Text>
          </View>
          {isBarbershop && (
            <Text style={styles.travelNote}>✓ No travel - you visit the shop</Text>
          )}

          {/* Booking Fee */}
          <View style={styles.serviceItem}>
            <View style={styles.serviceLeft}>
              <Ionicons name="shield-checkmark" size={18} color="#00B14F" style={{ marginRight: 12 }} />
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>Booking Fee</Text>
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

        {/* Phase 2.2: Smart Time Display */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Schedule & Location</Text>

          {isBarbershop ? (
            // Barbershop: Show specific date/time
            <>
              {booking.scheduledDate && booking.scheduledTime && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="calendar" size={20} color="#00B14F" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Appointment</Text>
                    <Text style={styles.infoValue}>
                      {formatShortDate(booking.scheduledDate)} at {formatTime(booking.scheduledTime)}
                    </Text>
                    {timeUntil && <Text style={styles.infoNote}>{timeUntil}</Text>}
                  </View>
                </View>
              )}
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
            </>
          ) : (
            // Freelance: Show ASAP or scheduled
            <>
              {booking.scheduledAt && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="flash" size={20} color="#00B14F" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Service Time</Text>
                    <Text style={styles.infoValue}>ASAP - On-Demand</Text>
                    <Text style={styles.infoNote}>
                      Requested: {new Date(booking.scheduledAt).toLocaleString()}
                    </Text>
                  </View>
                </View>
              )}
              {booking.duration && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="time" size={20} color="#00B14F" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Est. Duration</Text>
                    <Text style={styles.infoValue}>{booking.duration} minutes</Text>
                  </View>
                </View>
              )}
            </>
          )}

          {/* Phase 1.7: Location - Customer address for freelance */}
          {!isBarbershop && booking.address && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="location" size={20} color="#00B14F" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Service Location</Text>
                <Text style={styles.infoValue}>{booking.address.fullAddress}</Text>
                {booking.address.notes && (
                  <Text style={styles.infoNote}>Note: {booking.address.notes}</Text>
                )}
              </View>
            </View>
          )}
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
            {booking.cancelledAt && (
              <Text style={styles.cancelDate}>
                Cancelled on {formatShortDate(booking.cancelledAt)}
              </Text>
            )}
          </View>
        )}

        {/* Payment Info */}
        {booking.payment && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Payment</Text>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Method</Text>
              <Text style={styles.paymentValue}>{booking.payment.method.toUpperCase()}</Text>
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

        {/* Bottom Padding */}
        <View style={{ height: 100 }} />
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
          <TouchableOpacity style={styles.rateButton} onPress={handleRateBarber}>
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

      {/* Points Earned Modal */}
      <PointsEarnedModal
        visible={showPointsModal}
        points={pointsEarned}
        onClose={() => setShowPointsModal(false)}
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerBarbershop: {
    backgroundColor: '#F0FDF4',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00B14F',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  statusCard: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  statusIcon: {
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  statusDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  bookingId: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  countdownText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00B14F',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  timelineContainer: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 44,
  },
  timelineLeft: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotActive: {
    borderColor: '#00B14F',
  },
  timelineDotCurrent: {
    borderWidth: 3,
    borderColor: '#00B14F',
  },
  timelineDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00B14F',
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#D1D5DB',
    marginTop: 4,
  },
  timelineLineActive: {
    backgroundColor: '#00B14F',
  },
  timelineLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    paddingTop: 2,
  },
  timelineLabelActive: {
    color: '#1C1C1E',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  shopCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#00B14F',
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  shopIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopDetails: {
    flex: 1,
  },
  shopName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  shopAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  shopAddress: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  shopActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  shopActionButton: {
    flex: 1,
    minWidth: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00B14F',
  },
  shopActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00B14F',
  },
  barberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  barberAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  barberDetails: {
    flex: 1,
  },
  barberName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  ratingCount: {
    fontSize: 13,
    color: '#6B7280',
  },
  barberPhone: {
    fontSize: 13,
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
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00B14F',
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00B14F',
  },
  trackBarberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trackBarberButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  subsectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
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
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  serviceNameDisabled: {
    color: '#9CA3AF',
  },
  serviceDuration: {
    fontSize: 12,
    color: '#6B7280',
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  servicePriceDisabled: {
    color: '#9CA3AF',
  },
  travelNote: {
    fontSize: 12,
    color: '#00B14F',
    marginTop: 4,
    marginLeft: 30,
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00B14F',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
  },
  infoNote: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  cancelCard: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  cancelReason: {
    fontSize: 14,
    color: '#1C1C1E',
    marginBottom: 8,
  },
  cancelDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  paymentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  paymentBadgePaid: {
    backgroundColor: '#D1FAE5',
  },
  paymentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  paymentBadgeTextPaid: {
    color: '#00B14F',
  },
  bottomActions: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 34,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 12,
  },
  cancelBookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  cancelBookingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#00B14F',
    borderRadius: 8,
  },
  rateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  infoMessageText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
