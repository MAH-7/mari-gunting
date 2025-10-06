import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert, Platform, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { formatCurrency, formatPrice } from '@/utils/format';
import { useStore } from '@/store/useStore';
import { ACTIVE_OPACITY } from '@/constants/animations';
import { SkeletonCircle, SkeletonText, SkeletonBase } from '@/components/Skeleton';

export default function CreateBookingScreen() {
  const { barberId } = useLocalSearchParams<{ barberId: string }>();
  const currentUser = useStore((state) => state.currentUser);
  
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [serviceNotes, setServiceNotes] = useState<string>('');
  const [promoCode, setPromoCode] = useState<string>('');
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { data: barberResponse } = useQuery({
    queryKey: ['barber', barberId],
    queryFn: () => api.getBarberById(barberId),
  });

  const barber = barberResponse?.data;
  const selectedServices = barber?.services.filter(s => selectedServiceIds.includes(s.id)) || [];
  
  // Toggle service selection
  const toggleService = (serviceId: string) => {
    setSelectedServiceIds(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };
  
  // Get customer addresses from authenticated user
  const addresses = currentUser?.savedAddresses || [];
  
  // Calculate totals
  const subtotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
  
  // Calculate distance and travel cost
  // In production, this would calculate distance between customer address and barber location
  const selectedAddr = addresses.find(a => a.id === selectedAddress);
  const distance = barber?.distance || 3.5; // Use barber's current distance or default
  
  // NEW PRICING MODEL: RM 5 base (0-4km) + RM 1/km after 4km
  let travelCost = 0;
  if (distance <= 4) {
    travelCost = 5; // Base fare for 0-4 km
  } else {
    travelCost = 5 + ((distance - 4) * 1); // Base + RM 1/km after 4km
  }
  travelCost = Math.round(travelCost * 100) / 100; // Round to 2 decimals
  
  // Platform fee
  const platformFee = 2.00; // RM 2 platform fee
  
  // Commission calculation (12% from service price)
  const serviceCommission = Math.round((subtotal * 0.12) * 100) / 100;
  const barberServiceEarning = Math.round((subtotal * 0.88) * 100) / 100;
  
  // Calculate ETA (estimate: 5 min base + 2 min per km)
  const estimatedETA = Math.round(5 + (distance * 2));
  
  // Calculate total with promo discount
  const totalBeforeDiscount = Math.round((subtotal + travelCost + platformFee) * 100) / 100;
  const total = Math.round((totalBeforeDiscount - promoDiscount) * 100) / 100;

  const handleApplyPromo = () => {
    // Simple promo code validation (in production, call API)
    const validPromoCodes: Record<string, number> = {
      'FIRST10': 10, // RM 10 off
      'SAVE5': 5,    // RM 5 off
      'NEWUSER': 15, // RM 15 off
    };
    
    const upperCode = promoCode.trim().toUpperCase();
    if (validPromoCodes[upperCode]) {
      setPromoDiscount(validPromoCodes[upperCode]);
      Alert.alert('Success', `Promo code applied! You saved RM ${validPromoCodes[upperCode]}`);
    } else if (upperCode) {
      Alert.alert('Invalid Code', 'The promo code you entered is not valid');
    }
  };
  
  const handleBookNow = () => {
    if (selectedServiceIds.length === 0) {
      Alert.alert('Required', 'Please select at least one service');
      return;
    }
    
    if (!selectedAddress) {
      Alert.alert('Required', 'Please select a service location');
      return;
    }

    // Show confirmation modal instead of navigating directly
    setShowConfirmModal(true);
  };
  
  const handleConfirmBooking = () => {
    setShowConfirmModal(false);
    
    // Navigate to payment method selection with complete booking data
    router.push({
      pathname: '/payment-method',
      params: {
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
        promoCode: promoCode,
        promoDiscount: promoDiscount.toString(),
        
        // Pricing
        subtotal: subtotal.toString(),
        travelCost: travelCost.toString(),
        platformFee: platformFee.toString(),
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
              <Ionicons name="time" size={24} color="#00B14F" />
            </View>
            <View style={styles.etaBannerContent}>
              <Text style={styles.etaBannerTitle}>Estimated Arrival</Text>
              <Text style={styles.etaBannerTime}>~{estimatedETA} minutes</Text>
            </View>
          </View>
          <View style={styles.etaBadge}>
            <Ionicons name="flash" size={14} color="#00B14F" />
            <Text style={styles.etaBadgeText}>ASAP</Text>
          </View>
        </View>

        {/* Barber Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Barber</Text>
          <View style={styles.barberCard}>
            <Image source={{ uri: barber.avatar }} style={styles.barberAvatar} />
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
              </View>
              <View style={styles.distanceRow}>
                <Ionicons name="location" size={14} color="#00B14F" />
                <Text style={styles.distanceText}>{distance.toFixed(1)} km away</Text>
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
          <Text style={styles.sectionTitle}>Service Location</Text>
          {addresses.length > 0 ? (
            addresses.map((addr) => (
              <TouchableOpacity
                key={addr.id}
                style={[
                  styles.addressCard,
                  selectedAddress === addr.id && styles.addressCardActive,
                ]}
                onPress={() => setSelectedAddress(addr.id)}
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
                  <Text style={styles.addressText}>{addr.fullAddress}</Text>
                  {addr.notes && (
                    <Text style={styles.addressNotes}>Note: {addr.notes}</Text>
                  )}
                </View>
                <Ionicons name="location" size={20} color="#00B14F" />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyAddresses}>
              <Ionicons name="location-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyAddressesText}>No saved addresses</Text>
              <TouchableOpacity 
                style={styles.addAddressButton}
                onPress={() => {
                  Alert.alert('Add Address', 'Address management coming soon!');
                  // TODO: Navigate to add address screen
                  // router.push('/profile/addresses/add');
                }}
              >
                <Text style={styles.addAddressButtonText}>+ Add Address</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Service Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Requests (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="E.g., Please bring extra hair product, specific haircut style..."
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
        
        {/* Promo Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Promo Code</Text>
          <View style={styles.promoContainer}>
            <View style={styles.promoInputContainer}>
              <Ionicons name="pricetag" size={20} color="#6B7280" />
              <TextInput
                style={styles.promoInput}
                placeholder="Enter promo code"
                placeholderTextColor="#9CA3AF"
                value={promoCode}
                onChangeText={setPromoCode}
                autoCapitalize="characters"
                maxLength={20}
              />
            </View>
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={handleApplyPromo}
              activeOpacity={ACTIVE_OPACITY.PRIMARY}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
          {promoDiscount > 0 && (
            <View style={styles.promoSuccess}>
              <Ionicons name="checkmark-circle" size={16} color="#00B14F" />
              <Text style={styles.promoSuccessText}>Promo applied! You saved RM {promoDiscount}</Text>
            </View>
          )}
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
              <Text style={styles.priceLabel}>Travel Fee ({distance.toFixed(1)} km)</Text>
              <Text style={styles.priceValue}>{formatPrice(travelCost)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Platform Fee</Text>
              <Text style={styles.priceValue}>{formatPrice(platformFee)}</Text>
            </View>
            {promoDiscount > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.discountLabel}>Promo Discount</Text>
                <Text style={styles.discountValue}>-{formatPrice(promoDiscount)}</Text>
              </View>
            )}
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
            (selectedServiceIds.length === 0 || !selectedAddress) && styles.bookButtonDisabled
          ]}
          onPress={handleBookNow}
          disabled={selectedServiceIds.length === 0 || !selectedAddress}
          activeOpacity={ACTIVE_OPACITY.PRIMARY}
        >
          <Text style={styles.bookButtonText}>Request Barber Now</Text>
        </TouchableOpacity>
      </View>
      
      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Your Request</Text>
              <TouchableOpacity 
                onPress={() => setShowConfirmModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {/* Barber Info */}
            <View style={styles.modalSection}>
              <View style={styles.modalRow}>
                <Ionicons name="person" size={20} color="#6B7280" />
                <View style={styles.modalRowContent}>
                  <Text style={styles.modalLabel}>Barber</Text>
                  <Text style={styles.modalValue}>{barber.name}</Text>
                </View>
              </View>
            </View>
            
            {/* Services */}
            <View style={styles.modalSection}>
              <View style={styles.modalRow}>
                <Ionicons name="cut" size={20} color="#6B7280" />
                <View style={styles.modalRowContent}>
                  <Text style={styles.modalLabel}>Services</Text>
                  <Text style={styles.modalValue}>
                    {selectedServices.map(s => s.name).join(', ')}
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Location */}
            <View style={styles.modalSection}>
              <View style={styles.modalRow}>
                <Ionicons name="location" size={20} color="#6B7280" />
                <View style={styles.modalRowContent}>
                  <Text style={styles.modalLabel}>Location</Text>
                  <Text style={styles.modalValue}>
                    {selectedAddr?.label || 'Selected Address'}
                  </Text>
                  <Text style={styles.modalSubValue}>{selectedAddr?.fullAddress}</Text>
                </View>
              </View>
            </View>
            
            {/* ETA */}
            <View style={styles.modalSection}>
              <View style={styles.modalRow}>
                <Ionicons name="time" size={20} color="#6B7280" />
                <View style={styles.modalRowContent}>
                  <Text style={styles.modalLabel}>Estimated Arrival</Text>
                  <Text style={styles.modalValue}>~{estimatedETA} minutes</Text>
                </View>
              </View>
            </View>
            
            {/* Total */}
            <View style={styles.modalTotalSection}>
              <View style={styles.modalRow}>
                <Ionicons name="cash" size={20} color="#00B14F" />
                <View style={styles.modalRowContent}>
                  <Text style={styles.modalLabel}>Total Payment</Text>
                  <Text style={styles.modalTotalValue}>{formatPrice(total)}</Text>
                </View>
              </View>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalBackButton}
                onPress={() => setShowConfirmModal(false)}
                activeOpacity={ACTIVE_OPACITY.SECONDARY}
              >
                <Text style={styles.modalBackButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirmButton}
                onPress={handleConfirmBooking}
                activeOpacity={ACTIVE_OPACITY.PRIMARY}
              >
                <Text style={styles.modalConfirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  barberAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E5E5EA',
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
  emptyAddresses: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyAddressesText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  addAddressButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#00B14F',
    borderRadius: 8,
  },
  addAddressButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
  promoContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  promoInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  promoInput: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E',
    paddingVertical: 12,
  },
  applyButton: {
    backgroundColor: '#00B14F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  promoSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 8,
  },
  promoSuccessText: {
    fontSize: 13,
    color: '#047857',
    fontWeight: '600',
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
  discountLabel: {
    fontSize: 15,
    color: '#00B14F',
    fontWeight: '600',
  },
  discountValue: {
    fontSize: 15,
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
