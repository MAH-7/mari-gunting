import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { formatCurrency, formatPrice } from '@/utils/format';

export default function BarbershopBookingScreen() {
  const { barberId, shopId } = useLocalSearchParams<{ barberId: string; shopId: string }>();
  
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Fetch barber details
  const { data: barberResponse } = useQuery({
    queryKey: ['barber', barberId],
    queryFn: () => api.getBarberById(barberId),
  });

  // Fetch barbershop details
  const { data: shopResponse } = useQuery({
    queryKey: ['barbershop', shopId],
    queryFn: () => api.getBarbershopById(shopId),
  });

  const barber = barberResponse?.data;
  const shop = shopResponse?.data;
  const selectedServices = barber?.services.filter(s => selectedServiceIds.includes(s.id)) || [];
  
  // Toggle service selection
  const toggleService = (serviceId: string) => {
    setSelectedServiceIds(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Generate next 7 days for date selection
  const dates = useMemo(() => {
    const result = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNumber = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const fullDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      result.push({
        id: fullDate,
        dayName,
        dayNumber,
        month,
        isToday: i === 0,
      });
    }
    
    return result;
  }, []);

  // Generate time slots (9 AM - 9 PM in 30 min intervals)
  const timeSlots = useMemo(() => {
    const slots = [];
    const startHour = 9;
    const endHour = 21;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = `${hour > 12 ? hour - 12 : hour}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
        slots.push({ id: time, label: displayTime });
      }
    }
    
    return slots;
  }, []);
  
  // Calculate totals
  const subtotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
  
  // NO TRAVEL COST for barbershop bookings (walk-in service)
  const travelCost = 0;
  
  // Platform fee
  const platformFee = 2.00; // RM 2 platform fee
  
  // Commission calculation (12% from service price)
  const serviceCommission = Math.round((subtotal * 0.12) * 100) / 100;
  const barberServiceEarning = Math.round((subtotal * 0.88) * 100) / 100;
  
  // Calculate total
  const total = Math.round((subtotal + platformFee) * 100) / 100;

  const handleBookNow = () => {
    if (selectedServiceIds.length === 0) {
      Alert.alert('Required', 'Please select at least one service');
      return;
    }
    
    if (!selectedDate) {
      Alert.alert('Required', 'Please select a booking date');
      return;
    }

    if (!selectedTime) {
      Alert.alert('Required', 'Please select a booking time');
      return;
    }

    // Navigate to payment method selection with complete booking data
    router.push({
      pathname: '/payment-method',
      params: {
        // Booking data
        bookingType: 'barbershop',
        barberId: barber.id,
        shopId: shop.id,
        barberName: barber.name,
        barberAvatar: barber.avatar,
        shopName: shop.name,
        shopAddress: shop.address,
        serviceIds: selectedServiceIds.join(','),
        services: JSON.stringify(selectedServices),
        scheduledDate: selectedDate,
        scheduledTime: selectedTime,
        
        // Pricing (NO travel cost for barbershop)
        subtotal: subtotal.toString(),
        travelCost: '0',
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

  if (!barber || !shop) {
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
        {/* Walk-In Info Banner */}
        <View style={styles.infoBanner}>
          <View style={styles.infoBannerIcon}>
            <Ionicons name="storefront" size={20} color="#007AFF" />
          </View>
          <View style={styles.infoBannerContent}>
            <Text style={styles.infoBannerTitle}>Barbershop Visit</Text>
            <Text style={styles.infoBannerText}>Visit the shop at your scheduled time for your service</Text>
          </View>
        </View>

        {/* Barbershop Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Barbershop</Text>
          <View style={styles.shopCard}>
            <Image source={{ uri: shop.image }} style={styles.shopImage} />
            <View style={styles.shopInfo}>
              <View style={styles.shopNameRow}>
                <Text style={styles.shopName}>{shop.name}</Text>
                {shop.isVerified && (
                  <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
                )}
              </View>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color="#00B14F" />
                <Text style={styles.locationText} numberOfLines={2}>{shop.address}</Text>
              </View>
              <View style={styles.hoursRow}>
                <Ionicons name="time-outline" size={14} color="#8E8E93" />
                <Text style={styles.hoursText}>
                  {shop.operatingHours.includes('-') 
                    ? shop.operatingHours.split(' - ').map(time => formatTime(time.trim())).join(' - ')
                    : shop.operatingHours
                  }
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Barber Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Barber</Text>
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

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.dateScroll}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            {dates.map((date) => (
              <TouchableOpacity
                key={date.id}
                style={[
                  styles.dateChip,
                  selectedDate === date.id && styles.dateChipActive
                ]}
                onPress={() => setSelectedDate(date.id)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dateDay,
                  selectedDate === date.id && styles.dateDayActive
                ]}>
                  {date.dayName}
                </Text>
                <Text style={[
                  styles.dateNumber,
                  selectedDate === date.id && styles.dateNumberActive
                ]}>
                  {date.dayNumber}
                </Text>
                <Text style={[
                  styles.dateMonth,
                  selectedDate === date.id && styles.dateMonthActive
                ]}>
                  {date.month}
                </Text>
                {date.isToday && (
                  <View style={styles.todayBadge}>
                    <Text style={styles.todayText}>Today</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <View style={styles.timeGrid}>
            {timeSlots.map((slot) => (
              <TouchableOpacity
                key={slot.id}
                style={[
                  styles.timeChip,
                  selectedTime === slot.id && styles.timeChipActive
                ]}
                onPress={() => setSelectedTime(slot.id)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.timeLabel,
                  selectedTime === slot.id && styles.timeLabelActive
                ]}>
                  {slot.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
            (selectedServiceIds.length === 0 || !selectedDate || !selectedTime) && styles.bookButtonDisabled
          ]}
          onPress={handleBookNow}
          disabled={selectedServiceIds.length === 0 || !selectedDate || !selectedTime}
          activeOpacity={0.8}
        >
          <Text style={styles.bookButtonText}>Confirm Booking</Text>
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
    backgroundColor: '#EFF6FF',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF20',
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
    color: '#007AFF',
  },
  infoBannerText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  shopCard: {
    flexDirection: 'row',
    gap: 12,
  },
  shopImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#E5E5EA',
  },
  shopInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  shopNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hoursText: {
    fontSize: 13,
    color: '#8E8E93',
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
    minWidth: 70,
    alignItems: 'center',
  },
  dateChipActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#00B14F',
  },
  dateDay: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  dateDayActive: {
    color: '#00B14F',
  },
  dateNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  dateNumberActive: {
    color: '#00B14F',
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
  },
  dateMonthActive: {
    color: '#00B14F',
  },
  todayBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#00B14F',
    borderRadius: 8,
  },
  todayText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    minWidth: 100,
    alignItems: 'center',
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
