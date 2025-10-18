import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert, Platform, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { addressService } from '@mari-gunting/shared/services/addressService';
import { formatCurrency, formatPrice } from '@/utils/format';
import { useStore } from '@/store/useStore';
import { ACTIVE_OPACITY } from '@/constants/animations';
import { SkeletonCircle, SkeletonText, SkeletonBase } from '@/components/Skeleton';
import { useBooking } from '@/contexts/BookingContext';
import { batchCalculateDistances } from '@mari-gunting/shared/utils/directions';
import { ENV } from '@mari-gunting/shared/config/env';
import { supabase } from '@mari-gunting/shared/config/supabase';

export default function CreateBookingScreen() {
  const { barberId } = useLocalSearchParams<{ barberId: string }>();
  const currentUser = useStore((state) => state.currentUser);
  const booking = useBooking();
  
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [serviceNotes, setServiceNotes] = useState<string>('');
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMinutes: number } | null>(null);

  // Initialize booking flow on mount
  useEffect(() => {
    if (barberId && !booking.isInBookingFlow && currentUser?.id) {
      // Start booking flow and auto-select default address (Grab-style UX)
      booking.startBookingFlow(barberId, 'Barber', currentUser.id);
    }
  }, [barberId, currentUser?.id]);

  // Get selected address from context
  const selectedAddress = booking.selectedAddress?.id || '';

  const { data: barberResponse } = useQuery({
    queryKey: ['barber', barberId],
    queryFn: () => api.getBarberById(barberId),
  });

  // Fetch customer addresses from database
  const { data: addressResponse } = useQuery({
    queryKey: ['customer-addresses', currentUser?.id],
    queryFn: () => addressService.getCustomerAddresses(currentUser?.id!),
    enabled: !!currentUser?.id,
  });

  const barber = barberResponse?.data;
  const selectedServices = barber?.services.filter(s => selectedServiceIds.includes(s.id)) || [];
  const addresses = addressResponse?.data || [];
  
  // Calculate distance and duration from selected address to barber
  useEffect(() => {
    const calculateRoute = async () => {
      if (!selectedAddress || !barber) return;
      
      const selectedAddr = addresses.find(a => a.id === selectedAddress);
      if (!selectedAddr?.latitude || !selectedAddr?.longitude) return;
      
      setCalculatingRoute(true);
      
      try {
        console.log('🗺️ Calculating route from service address to barber...');
        
        const routesMap = await batchCalculateDistances(
          { latitude: selectedAddr.latitude, longitude: selectedAddr.longitude },
          [{
            id: barber.id,
            latitude: barber.location.latitude,
            longitude: barber.location.longitude,
          }],
          ENV.MAPBOX_ACCESS_TOKEN || '',
          { 
            useCache: true,
            supabase: supabase
          }
        );
        
        const route = routesMap.get(barber.id);
        if (route) {
          console.log(`✅ Route calculated: ${route.distanceKm}km, ${route.durationMinutes}min`);
          setRouteInfo(route);
        }
      } catch (error) {
        console.error('❌ Error calculating route:', error);
      } finally {
        setCalculatingRoute(false);
      }
    };
    
    calculateRoute();
  }, [selectedAddress, barber, addresses]);
  
  // Toggle service selection
  const toggleService = (serviceId: string) => {
    setSelectedServiceIds(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };
  
  // Calculate totals
  const subtotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
  
  // Use calculated route info from selected address to barber
  const selectedAddr = addresses.find(a => a.id === selectedAddress);
  const distance = routeInfo?.distanceKm || 0;
  const drivingDuration = routeInfo?.durationMinutes || 0;
  
  // NEW PRICING MODEL: RM 5 base (0-4km) + RM 1/km after 4km
  let travelCost = 0;
  if (distance > 0) {
    if (distance <= 4) {
      travelCost = 5; // Base fare for 0-4 km
    } else {
      travelCost = 5 + ((distance - 4) * 1); // Base + RM 1/km after 4km
    }
    travelCost = Math.round(travelCost * 100) / 100; // Round to 2 decimals
  }
  
  // Booking fee
  const bookingFee = 2.00; // RM 2 booking fee
  
  // Commission calculation (12% from service price)
  const serviceCommission = Math.round((subtotal * 0.12) * 100) / 100;
  const barberServiceEarning = Math.round((subtotal * 0.88) * 100) / 100;
  
  // Calculate ETA using actual driving time + 5 min preparation
  const estimatedETA = drivingDuration > 0 ? Math.round(drivingDuration + 5) : 0;
  
  // Calculate total
  const total = Math.round((subtotal + travelCost + bookingFee) * 100) / 100;
  
  const handleBookNow = () => {
    if (selectedServiceIds.length === 0) {
      Alert.alert('Required', 'Please select at least one service');
      return;
    }
    
    if (!selectedAddress) {
      Alert.alert('Required', 'Please select a service location');
      return;
    }
    
    if (!routeInfo) {
      Alert.alert('Calculating Route', 'Please wait while we calculate the distance and travel time.');
      return;
    }

    // Navigate directly to payment screen
    router.push({
      pathname: '/payment-method',
      params: {
        // Booking type
        type: 'on-demand',        // NEW: Freelance/on-demand booking type
        
        // Booking data
        barberId: barber.id,
        barberName: barber.name,
        barberAvatar: barber.avatar,
        serviceIds: selectedServiceIds.join(','),
        services: JSON.stringify(selectedServices),
        addressId: selectedAddress,
        address: JSON.stringify(addresses.find(a => a.id === selectedAddress)),
        distance: distance.toString(),
        serviceNotes: serviceNotes,
        
        // Pricing
        subtotal: subtotal.toString(),
        travelCost: travelCost.toString(),
        bookingFee: bookingFee.toString(),
        serviceCommission: serviceCommission.toString(),
        barberServiceEarning: barberServiceEarning.toString(),
        amount: total.toString(),
        totalDuration: totalDuration.toString(),
        
        // Display
        serviceName: selectedServices.map(s => s.name).join(', '),
      },
    } as any);
  };

  if (!barber) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm Booking</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* ETA Banner Skeleton */}
          <View style={styles.etaBanner}>
            <View style={styles.etaBannerLeft}>
              <SkeletonCircle size={48} />
              <View style={styles.etaBannerContent}>
                <SkeletonText width="60%" height={13} style={{ marginBottom: 4 }} />
                <SkeletonText width="40%" height={20} />
              </View>
            </View>
            <SkeletonBase width={60} height={32} borderRadius={12} />
          </View>

          {/* Barber Info Skeleton */}
          <View style={styles.section}>
            <SkeletonText width="20%" height={18} style={{ marginBottom: 16 }} />
            <View style={styles.barberCard}>
              <SkeletonCircle size={60} />
              <View style={styles.barberInfo}>
                <SkeletonText width="50%" height={16} style={{ marginBottom: 6 }} />
                <SkeletonText width="40%" height={14} style={{ marginBottom: 6 }} />
                <SkeletonText width="35%" height={13} />
              </View>
            </View>
          </View>

          {/* Services Skeleton */}
          <View style={styles.section}>
            <SkeletonText width="35%" height={18} style={{ marginBottom: 16 }} />
            {[1, 2, 3].map((item) => (
              <View key={item} style={[styles.serviceCard, { marginBottom: 12 }]}>
                <View style={styles.serviceCardInner}>
                  <SkeletonBase width={24} height={24} borderRadius={6} />
                  <View style={styles.serviceInfo}>
                    <SkeletonText width="50%" height={15} style={{ marginBottom: 4 }} />
                    <SkeletonText width="30%" height={13} />
                  </View>
                  <SkeletonText width="20%" height={16} />
                </View>
              </View>
            ))}
          </View>

          {/* Address Skeleton */}
          <View style={styles.section}>
            <SkeletonText width="35%" height={18} style={{ marginBottom: 16 }} />
            {[1, 2].map((item) => (
              <View key={item} style={[styles.addressCard, { marginBottom: 12 }]}>
                <SkeletonCircle size={24} />
                <View style={styles.addressInfo}>
                  <SkeletonText width="40%" height={15} style={{ marginBottom: 4 }} />
                  <SkeletonText width="70%" height={13} />
                </View>
                <SkeletonBase width={20} height={20} borderRadius={10} />
              </View>
            ))}
          </View>

          {/* Notes Skeleton */}
          <View style={styles.section}>
            <SkeletonText width="45%" height={18} style={{ marginBottom: 16 }} />
            <SkeletonBase width="100%" height={80} borderRadius={12} />
          </View>

          {/* Promo Skeleton */}
          <View style={styles.section}>
            <SkeletonText width="30%" height={18} style={{ marginBottom: 16 }} />
            <View style={styles.promoContainer}>
              <SkeletonBase width="70%" height={44} borderRadius={12} />
              <SkeletonBase width="25%" height={44} borderRadius={12} />
            </View>
          </View>

          {/* Price Skeleton */}
          <View style={styles.section}>
            <SkeletonText width="30%" height={18} style={{ marginBottom: 16 }} />
            <View style={styles.priceBreakdown}>
              {[1, 2, 3].map((item) => (
                <View key={item} style={styles.priceRow}>
                  <SkeletonText width="40%" height={15} />
                  <SkeletonText width="20%" height={15} />
                </View>
              ))}
              <View style={styles.priceDivider} />
              <View style={styles.priceRow}>
                <SkeletonText width="20%" height={17} />
                <SkeletonText width="30%" height={20} />
              </View>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom Button Skeleton */}
        <View style={styles.bottomBar}>
          <SkeletonBase width="100%" height={48} borderRadius={12} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Booking</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* ETA Banner */}
        <View style={styles.etaBanner}>
          <View style={styles.etaBannerLeft}>
            <View style={styles.etaBannerIcon}>
              {calculatingRoute ? (
                <ActivityIndicator size="small" color="#00B14F" />
              ) : (
                <Ionicons name="time" size={24} color="#00B14F" />
              )}
            </View>
            <View style={styles.etaBannerContent}>
              <Text style={styles.etaBannerTitle}>Estimated Arrival</Text>
              {calculatingRoute ? (
                <Text style={styles.etaBannerTime}>Calculating...</Text>
              ) : estimatedETA > 0 ? (
                <Text style={styles.etaBannerTime}>~{estimatedETA} minutes</Text>
              ) : (
                <Text style={styles.etaBannerTime}>Select address</Text>
              )}
            </View>
          </View>
          {!calculatingRoute && estimatedETA > 0 && (
            <View style={styles.etaBadge}>
              <Ionicons name="flash" size={14} color="#00B14F" />
              <Text style={styles.etaBadgeText}>ASAP</Text>
            </View>
          )}
        </View>

        {/* Barber Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Barber</Text>
          <View style={styles.barberCard}>
            <View style={styles.barberAvatarContainer}>
              <Image source={{ uri: barber.avatar }} style={styles.barberAvatar} />
              <View style={styles.barberOnlineDot} />
            </View>
            <View style={styles.barberInfo}>
              <View style={styles.barberNameRow}>
                <Text style={styles.barberName}>{barber.name}</Text>
                {barber.isVerified && (
                  <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
                )}
              </View>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#FBBF24" />
                <Text style={styles.ratingText}>{barber.rating.toFixed(1)}</Text>
                <Text style={styles.reviewsText}>({barber.totalReviews} reviews)</Text>
                <Text style={styles.jobsText}>• {barber.completedJobs} jobs</Text>
              </View>
              <View style={styles.distanceRow}>
                <Ionicons name="location" size={14} color="#00B14F" />
                {calculatingRoute ? (
                  <Text style={styles.distanceText}>Calculating...</Text>
                ) : distance > 0 ? (
                  <Text style={styles.distanceText}>{distance.toFixed(1)} km away</Text>
                ) : (
                  <Text style={styles.distanceText}>Select address</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Service Selection */}
        <View style={styles.section}>
          <View style={styles.servicesHeader}>
            <Text style={styles.sectionTitle}>Select Services</Text>
            {selectedServiceIds.length > 0 && (
              <Text style={styles.selectedCount}>{selectedServiceIds.length} selected</Text>
            )}
          </View>
          {barber.services.map((service) => {
            const isSelected = selectedServiceIds.includes(service.id);
            return (
              <TouchableOpacity 
                key={service.id} 
                style={[
                  styles.serviceCard,
                  isSelected && styles.serviceCardSelected
                ]}
                onPress={() => toggleService(service.id)}
                activeOpacity={ACTIVE_OPACITY.SECONDARY}
              >
                <View style={styles.serviceCardInner}>
                  <View style={[
                    styles.checkbox,
                    isSelected && styles.checkboxSelected
                  ]}>
                    {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                  </View>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.serviceDuration}>{service.duration} min</Text>
                  </View>
                  <Text style={styles.servicePrice}>{formatCurrency(service.price)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Select Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Service Location</Text>
            {addresses.length > 0 && (
              <TouchableOpacity onPress={booking.goToAddressSelection}>
                <Text style={styles.manageAddressesLink}>Manage</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {addresses.length > 0 ? (
            <>
              {addresses.map((addr) => {
                const fullAddress = [
                  addr.address_line1,
                  addr.address_line2,
                  addr.city,
                  addr.state,
                  addr.postal_code
                ].filter(Boolean).join(', ');
                
                return (
                  <TouchableOpacity
                    key={addr.id}
                    style={[
                      styles.addressCard,
                      selectedAddress === addr.id && styles.addressCardActive,
                    ]}
                    onPress={() => {
                      // Update context with selected address
                      booking.setSelectedAddress({
                        id: addr.id,
                        label: addr.label,
                        fullAddress: fullAddress,
                        latitude: addr.latitude,
                        longitude: addr.longitude,
                      });
                    }}
                    activeOpacity={ACTIVE_OPACITY.SECONDARY}
                  >
                    <View style={[
                      styles.radioCircle,
                      selectedAddress === addr.id && styles.radioCircleActive,
                    ]}>
                      {selectedAddress === addr.id && <View style={styles.radioInner} />}
                    </View>
                    <View style={styles.addressInfo}>
                      <Text style={styles.addressLabel}>{addr.label}</Text>
                      <Text style={styles.addressText}>{fullAddress}</Text>
                    </View>
                    <Ionicons name="location" size={20} color="#00B14F" />
                  </TouchableOpacity>
                );
              })}
              
              {/* Add New Address Option - Grab Style */}
              <TouchableOpacity
                style={styles.addNewAddressCard}
                onPress={booking.goToAddressSelection}
                activeOpacity={ACTIVE_OPACITY.SECONDARY}
              >
                <View style={styles.addIconCircle}>
                  <Ionicons name="add" size={20} color="#00B14F" />
                </View>
                <Text style={styles.addNewAddressText}>Add New Address</Text>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyAddresses}>
              <Ionicons name="location-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyAddressesText}>No saved addresses</Text>
              <Text style={styles.emptyAddressesSubtext}>Add your address to get started</Text>
              <TouchableOpacity 
                style={styles.addAddressButton}
                onPress={booking.goToAddressSelection}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.addAddressButtonText}>Add Address</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Service Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Note for Barber (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder='E.g., "Prefer fade style", "Need quick service", "First time customer"'
            placeholderTextColor="#9CA3AF"
            value={serviceNotes}
            onChangeText={setServiceNotes}
            multiline
            numberOfLines={3}
            maxLength={200}
            textAlignVertical="top"
          />
          <Text style={styles.notesCounter}>{serviceNotes.length}/200</Text>
        </View>
        
        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Details</Text>
          <View style={styles.priceBreakdown}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Services ({selectedServices.length})</Text>
              <Text style={styles.priceValue}>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                Travel {distance > 0 ? `(${distance.toFixed(1)} km)` : ''}
              </Text>
              {calculatingRoute ? (
                <ActivityIndicator size="small" color="#00B14F" />
              ) : (
                <Text style={styles.priceValue}>{formatPrice(travelCost)}</Text>
              )}
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Booking Fee</Text>
              <Text style={styles.priceValue}>{formatPrice(bookingFee)}</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(total)}</Text>
            </View>
            <View style={styles.durationRow}>
              <Ionicons name="time-outline" size={16} color="#8E8E93" />
              <Text style={styles.durationText}>Estimated duration: {totalDuration} minutes</Text>
            </View>
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[
            styles.bookButton,
            (selectedServiceIds.length === 0 || !selectedAddress || !routeInfo || calculatingRoute) && styles.bookButtonDisabled
          ]}
          onPress={handleBookNow}
          disabled={selectedServiceIds.length === 0 || !selectedAddress || !routeInfo || calculatingRoute}
          activeOpacity={ACTIVE_OPACITY.PRIMARY}
        >
          {calculatingRoute ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.bookButtonText}>Request Barber Now</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.4,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 8,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
    letterSpacing: -0.4,
  },
  etaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  etaBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  etaBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  etaBannerContent: {
    gap: 2,
  },
  etaBannerTitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  etaBannerTime: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00B14F',
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  etaBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B14F',
  },
  barberCard: {
    flexDirection: 'row',
    gap: 12,
  },
  barberAvatarContainer: {
    position: 'relative',
  },
  barberAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E5E5EA',
  },
  barberOnlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00B14F',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  barberInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  barberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  reviewsText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  jobsText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  distanceText: {
    fontSize: 13,
    color: '#00B14F',
    fontWeight: '600',
  },
  servicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00B14F',
  },
  serviceCard: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    backgroundColor: '#F9FAFB',
  },
  serviceCardSelected: {
    borderColor: '#00B14F',
    backgroundColor: '#F0FDF4',
  },
  serviceCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#00B14F',
    borderColor: '#00B14F',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  serviceDuration: {
    fontSize: 13,
    color: '#8E8E93',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00B14F',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  addressCardActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#00B14F',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
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
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  addressNotes: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    fontStyle: 'italic',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  manageAddressesLink: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00B14F',
  },
  addNewAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#00B14F',
    borderStyle: 'dashed',
  },
  addIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNewAddressText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#00B14F',
  },
  emptyAddresses: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyAddressesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  emptyAddressesSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#00B14F',
    borderRadius: 12,
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addAddressButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  notesInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#1C1C1E',
    minHeight: 80,
  },
  notesCounter: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 6,
  },
  priceBreakdown: {
    gap: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 8,
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
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  durationText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    height: Platform.OS === 'ios' ? 95 : 75,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  bookButton: {
    backgroundColor: '#00B14F',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bookButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  modalSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  modalRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalRowContent: {
    flex: 1,
    gap: 4,
  },
  modalLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  modalValue: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  modalSubValue: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  modalTotalSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F0FDF4',
  },
  modalTotalValue: {
    fontSize: 24,
    color: '#00B14F',
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalBackButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  modalBackButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#00B14F',
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalConfirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
