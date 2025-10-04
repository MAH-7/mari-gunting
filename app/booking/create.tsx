import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { formatCurrency, formatPrice } from '@/utils/format';
import { mockCustomer } from '@/services/mockData';

export default function CreateBookingScreen() {
  const { barberId } = useLocalSearchParams<{ barberId: string }>();
  
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');

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
  
  // Get customer addresses (in production, this would be from authenticated user)
  const addresses = mockCustomer.savedAddresses || [];
  
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
  
  // Calculate total
  const total = Math.round((subtotal + travelCost + platformFee) * 100) / 100;

  const handleBookNow = () => {
    if (selectedServiceIds.length === 0) {
      Alert.alert('Required', 'Please select at least one service');
      return;
    }
    
    if (!selectedAddress) {
      Alert.alert('Required', 'Please select a service location');
      return;
    }

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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Service</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text>Loading...</Text>
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
        {/* On-Demand Info Banner */}
        <View style={styles.infoBanner}>
          <View style={styles.infoBannerIcon}>
            <Ionicons name="flash" size={20} color="#00B14F" />
          </View>
          <View style={styles.infoBannerContent}>
            <Text style={styles.infoBannerTitle}>On-Demand Service</Text>
            <Text style={styles.infoBannerText}>Your barber will arrive at your location as soon as possible</Text>
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
                activeOpacity={0.7}
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
                activeOpacity={0.7}
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
              <TouchableOpacity style={styles.addAddressButton}>
                <Text style={styles.addAddressButtonText}>+ Add Address</Text>
              </TouchableOpacity>
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
          activeOpacity={0.8}
        >
          <Text style={styles.bookButtonText}>Request Barber Now</Text>
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
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00B14F20',
    gap: 12,
  },
  infoBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBannerContent: {
    flex: 1,
    gap: 4,
  },
  infoBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#00B14F',
  },
  infoBannerText: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 18,
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
  dateScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  dateChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    minWidth: 100,
  },
  dateChipActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#00B14F',
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 4,
  },
  dateLabelActive: {
    color: '#00B14F',
  },
  todayBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00B14F',
    textAlign: 'center',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  timeChipActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#00B14F',
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  timeLabelActive: {
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
});
