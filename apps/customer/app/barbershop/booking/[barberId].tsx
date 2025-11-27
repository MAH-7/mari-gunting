import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { formatCurrency, formatPrice, formatTime } from '@mari-gunting/shared/utils/format';
import { Colors, theme } from '@mari-gunting/shared/theme';

export default function BarbershopBookingScreen() {
  const { barberId, shopId } = useLocalSearchParams<{ barberId: string; shopId: string }>();
  const insets = useSafeAreaInsets();
  
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [showAllDates, setShowAllDates] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  // Fetch staff details (barbershop staff, not freelance barber)
  const { data: barberResponse } = useQuery({
    queryKey: ['staff', barberId],
    queryFn: () => api.getStaffById(barberId),
  });

  // Fetch barbershop details
  const { data: shopResponse } = useQuery({
    queryKey: ['barbershop', shopId],
    queryFn: () => api.getBarbershopById(shopId),
  });

  const barber = barberResponse?.data; // This is BarbershopStaff
  const shop = shopResponse?.data;
  
  // Services are based on barbershop, not individual staff
  // All staff can perform all shop services at shop's prices
  const staffServices = shop?.services || [];
  
  const selectedServices = staffServices.filter((s: any) => selectedServiceIds.includes(s.id)) || [];
  
  // Toggle service selection
  const toggleService = (serviceId: string) => {
    setSelectedServiceIds(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Generate next 14 days for date selection (2 weeks)
  // Filter out closed days based on shop's operating hours
  const dates = useMemo(() => {
    if (!shop?.detailedHours) {
      return [];
    }
    
    const result = [];
    const today = new Date();
    // Database uses short day keys: sun, mon, tue, wed, thu, fri, sat
    const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayKey = dayKeys[date.getDay()];
      const dayInfo = shop.detailedHours[dayKey];
      
      // Skip if shop is closed on this day
      if (!dayInfo?.isOpen) continue;
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNumber = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const fullDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Friendly labels
      let displayLabel = '';
      if (i === 0) displayLabel = 'Today';
      else if (i === 1) displayLabel = 'Tomorrow';
      else displayLabel = `${dayName}, ${dayNumber} ${month}`;
      
      result.push({
        id: fullDate,
        dayName,
        dayNumber,
        month,
        displayLabel,
        isToday: i === 0,
        isTomorrow: i === 1,
        dayOfWeek: dayKey,
        openTime: dayInfo.start,  // Database uses 'start', not 'open'
        closeTime: dayInfo.end,    // Database uses 'end', not 'close'
      });
    }
    
    return result;
  }, [shop]);

  // Generate time slots based on selected date and shop's operating hours
  const timeSlots = useMemo(() => {
    const morning = []; // 9 AM - 12 PM
    const afternoon = []; // 12 PM - 5 PM
    const evening = []; // 5 PM - 9 PM
    
    // If no date selected, return empty slots
    if (!selectedDate || !shop?.detailedHours) {
      return { morning, afternoon, evening };
    }
    
    // Find the selected date info
    const selectedDateInfo = dates.find(d => d.id === selectedDate);
    if (!selectedDateInfo) {
      return { morning, afternoon, evening };
    }
    
    // Parse shop's opening and closing hours for this day
    const [openHour, openMinute] = selectedDateInfo.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = selectedDateInfo.closeTime.split(':').map(Number);
    
    // Generate slots based on shop hours
    // We need to generate slots from open time up to (but not including) close time
    let currentHour = openHour;
    let currentMinute = openMinute;
    
    while (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute)) {
      const time = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      const displayHour = currentHour > 12 ? currentHour - 12 : currentHour === 0 ? 12 : currentHour;
      const displayTime = `${displayHour}:${currentMinute.toString().padStart(2, '0')} ${currentHour >= 12 ? 'PM' : 'AM'}`;
      const slot = { id: time, label: displayTime, hour: currentHour };
      
      if (currentHour < 12) {
        morning.push(slot);
      } else if (currentHour < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
      
      // Increment by 30 minutes
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour += 1;
      }
    }
    
    return { morning, afternoon, evening };
  }, [selectedDate, shop, dates]);
  
  // Calculate totals
  const subtotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
  
  // NO TRAVEL COST for barbershop bookings (walk-in service)
  const travelCost = 0;
  
  // Booking fee
  const bookingFee = 2.00; // RM 2 booking fee
  
  // Commission calculation (12% from service price)
  const serviceCommission = Math.round((subtotal * 0.12) * 100) / 100;
  const barberServiceEarning = Math.round((subtotal * 0.88) * 100) / 100;
  
  // Calculate total
  const total = Math.round((subtotal + bookingFee) * 100) / 100;

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

    // Format address for payment params
    const formattedAddress = typeof shop.address === 'string' 
      ? shop.address 
      : `${shop.address.line1}${shop.address.line2 ? ', ' + shop.address.line2 : ''}, ${shop.address.city}, ${shop.address.state} ${shop.address.postalCode}`;

    // Navigate to payment method selection with complete booking data
    router.push({
      pathname: '/payment-method',
      params: {
        // Booking data
        type: 'scheduled-shop',        // NEW: Booking type for barbershop
        bookingType: 'barbershop',     // Keep for payment screen compatibility
        barberId: barber.id,
        shopId: shop.id,
        barberName: barber.name,
        barberAvatar: barber.avatar,
        shopName: shop.name,
        shopAddress: formattedAddress,
        shopPhone: shop.phone,         // NEW: Shop phone number
        serviceIds: selectedServiceIds.join(','),
        services: JSON.stringify(selectedServices),
        scheduledDate: selectedDate,
        scheduledTime: selectedTime,
        
        // Pricing (NO travel cost for barbershop)
        subtotal: subtotal.toString(),
        travelCost: '0',
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
        {/* 1. Booking At - Context First */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="location" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Booking At</Text>
          </View>
          <View style={styles.bookingAtCard}>
            {/* Shop */}
            <View style={styles.shopRow}>
              <Ionicons name="storefront" size={18} color={Colors.primary} />
              <Text style={styles.shopName}>{shop.name}</Text>
              {shop.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
              )}
            </View>
            <View style={styles.shopAddress}>
              <Ionicons name="location-outline" size={14} color={Colors.gray[500]} />
              <Text style={styles.shopAddressText}>
                {typeof shop.address === 'string' ? shop.address : 
                 `${shop.address.line1}, ${shop.address.city}`}
              </Text>
            </View>
            
            {/* Divider */}
            <View style={styles.bookingAtDivider} />
            
            {/* Barber */}
            <View style={styles.barberRow}>
              <Image source={{ uri: barber.avatar || 'https://via.placeholder.com/40' }} style={styles.barberAvatar} />
              <View style={styles.barberInfo}>
                <View style={styles.barberNameRow}>
                  <Text style={styles.barberName}>{barber.name}</Text>
                  {barber.isVerified && (
                    <Ionicons name="checkmark-circle" size={14} color="#007AFF" />
                  )}
                </View>
                <View style={styles.barberMeta}>
                  <Ionicons name="star" size={12} color="#FBBF24" />
                  <Text style={styles.barberMetaText}>{barber.rating.toFixed(1)}</Text>
                  <Text style={styles.barberMetaText}> • </Text>
                  <Text style={styles.barberMetaText}>{barber.completedJobs} jobs</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 2. Service Selection - Step 1 */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.stepIndicator}>
              {selectedServiceIds.length > 0 ? (
                <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
              ) : (
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
              )}
            </View>
            <Text style={styles.sectionTitle}>Select Services</Text>
            {selectedServiceIds.length > 0 && (
              <Text style={styles.selectedCount}>{selectedServiceIds.length} selected</Text>
            )}
          </View>
          
          {selectedServiceIds.length === 0 && (
            <View style={styles.emptyServices}>
              <Ionicons name="cut-outline" size={48} color={Colors.gray[300]} />
              <Text style={styles.emptyServicesText}>Select at least one service to continue</Text>
            </View>
          )}
          
          {staffServices.map((service: any) => {
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
                    {isSelected && <Ionicons name="checkmark" size={16} color={Colors.white} />}
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

        {/* 3. Date Selection - Step 2 */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.stepIndicator}>
              {selectedDate ? (
                <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
              ) : (
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
              )}
            </View>
            <Text style={styles.sectionTitle}>Select Date</Text>
          </View>
          <View style={styles.dateListGrab}>
            {(showAllDates ? dates : dates.slice(0, 5)).map((date, index) => {
              return (
                <TouchableOpacity
                  key={date.id}
                  style={[
                    showAllDates ? styles.dateItemGrabExpanded : styles.dateItemGrab,
                    selectedDate === date.id && styles.dateItemGrabSelected
                  ]}
                  onPress={() => setSelectedDate(date.id)}
                  activeOpacity={0.6}
                >
                  <Text style={[
                    styles.dateDayGrab,
                    selectedDate === date.id && styles.dateDayGrabSelected
                  ]}>
                    {date.isToday ? 'Today' : date.isTomorrow ? 'Tomorrow' : date.dayName}
                  </Text>
                  <Text style={[
                    styles.dateNumberGrab,
                    selectedDate === date.id && styles.dateNumberGrabSelected
                  ]}>
                    {date.dayNumber}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {dates.length > 5 && (
            <TouchableOpacity 
              style={styles.viewMoreDates} 
              activeOpacity={0.7}
              onPress={() => setShowAllDates(!showAllDates)}
            >
              <Text style={styles.viewMoreDatesText}>
                {showAllDates ? 'Show less' : 'View more dates'}
              </Text>
              <Ionicons 
                name={showAllDates ? 'chevron-up' : 'chevron-forward'} 
                size={16} 
                color={Colors.primary}               />
            </TouchableOpacity>
          )}
        </View>

        {/* 4. Time Selection - Step 3 */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.stepIndicator}>
              {selectedTime ? (
                <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
              ) : (
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
              )}
            </View>
            <Text style={styles.sectionTitle}>Select Time</Text>
          </View>
          
          {!selectedDate ? (
            <View style={styles.timeEmptyState}>
              <Ionicons name="time-outline" size={32} color={Colors.gray[300]} />
              <Text style={styles.timeEmptyText}>Please select a date first</Text>
            </View>
          ) : (
            <>
              {/* Morning */}
              {timeSlots.morning.length > 0 && (
                <View style={styles.timeSectionGrab}>
                  <Text style={styles.timePeriodLabelGrab}>Morning</Text>
                  <View style={styles.timeRowGrab}>
                    {timeSlots.morning.map((slot: any) => (
                      <TouchableOpacity
                        key={slot.id}
                        style={[
                          styles.timeButtonGrab,
                          selectedTime === slot.id && styles.timeButtonGrabSelected
                        ]}
                        onPress={() => setSelectedTime(slot.id)}
                        activeOpacity={0.6}
                      >
                        <Text style={[
                          styles.timeTextGrab,
                          selectedTime === slot.id && styles.timeTextGrabSelected
                        ]}>
                          {slot.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Afternoon */}
              {timeSlots.afternoon.length > 0 && (
                <View style={styles.timeSectionGrab}>
                  <Text style={styles.timePeriodLabelGrab}>Afternoon</Text>
                  <View style={styles.timeRowGrab}>
                    {timeSlots.afternoon.map((slot: any) => (
                      <TouchableOpacity
                        key={slot.id}
                        style={[
                          styles.timeButtonGrab,
                          selectedTime === slot.id && styles.timeButtonGrabSelected
                        ]}
                        onPress={() => setSelectedTime(slot.id)}
                        activeOpacity={0.6}
                      >
                        <Text style={[
                          styles.timeTextGrab,
                          selectedTime === slot.id && styles.timeTextGrabSelected
                        ]}>
                          {slot.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Evening */}
              {timeSlots.evening.length > 0 && (
                <View style={styles.timeSectionGrab}>
                  <Text style={styles.timePeriodLabelGrab}>Evening</Text>
                  <View style={styles.timeRowGrab}>
                    {timeSlots.evening.map((slot: any) => (
                      <TouchableOpacity
                        key={slot.id}
                        style={[
                          styles.timeButtonGrab,
                          selectedTime === slot.id && styles.timeButtonGrabSelected
                        ]}
                        onPress={() => setSelectedTime(slot.id)}
                        activeOpacity={0.6}
                      >
                        <Text style={[
                          styles.timeTextGrab,
                          selectedTime === slot.id && styles.timeTextGrabSelected
                        ]}>
                          {slot.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* No slots available */}
              {timeSlots.morning.length === 0 && 
               timeSlots.afternoon.length === 0 && 
               timeSlots.evening.length === 0 && (
                <View style={styles.timeEmptyState}>
                  <Ionicons name="close-circle-outline" size={32} color={Colors.gray[300]} />
                  <Text style={styles.timeEmptyText}>No time slots available for this date</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Sticky Summary (Grab Style) */}
      <TouchableOpacity 
        style={styles.stickySummary}
        onPress={() => setSummaryExpanded(!summaryExpanded)}
        activeOpacity={0.9}
      >
        <View style={styles.summaryHeader}>
          <View style={styles.summaryHeaderLeft}>
            <Ionicons name={summaryExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.gray[600]} />
            <Text style={styles.summaryHeaderTitle}>Summary</Text>
          </View>
          <Text style={styles.summaryHeaderTotal}>
            Total {selectedServiceIds.length > 0 ? formatPrice(total) : 'RM 0.00'}
          </Text>
        </View>
        
        {summaryExpanded && (
          <View style={styles.summaryExpandedContent}>
            {/* Price Breakdown */}
            {selectedServiceIds.length > 0 && (
              <>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryRowLabel}>Services ({selectedServiceIds.length})</Text>
                  <Text style={styles.summaryRowValue}>{formatPrice(subtotal)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryRowLabel}>Booking Fee</Text>
                  <Text style={styles.summaryRowValue}>{formatPrice(bookingFee)}</Text>
                </View>
              </>
            )}
            
            {/* Details */}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryDetails}>
              <View style={styles.summaryDetailRow}>
                <Ionicons name={selectedServiceIds.length > 0 ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={selectedServiceIds.length > 0 ? Colors.primary : Colors.gray[400]} />
                <Text style={styles.summaryDetailText}>
                  {selectedServiceIds.length > 0 ? `${selectedServiceIds.length} services • ${totalDuration} min` : 'No services selected'}
                </Text>
              </View>
              <View style={styles.summaryDetailRow}>
                <Ionicons name={selectedDate && selectedTime ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={selectedDate && selectedTime ? Colors.primary : Colors.gray[400]} />
                <Text style={styles.summaryDetailText}>
                  {selectedDate && selectedTime
                    ? `${dates.find(d => d.id === selectedDate)?.displayLabel}, ${timeSlots.morning.concat(timeSlots.afternoon, timeSlots.evening).find((s: any) => s.id === selectedTime)?.label}`
                    : 'Date & time not selected'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Fixed Bottom Button */}
      <View style={[styles.bottomBar, { paddingBottom: Platform.OS === 'android' ? insets.bottom + 16 : 32 }]}>
        <TouchableOpacity 
          style={[
            styles.bookButton,
            (selectedServiceIds.length === 0 || !selectedDate || !selectedTime) && styles.bookButtonDisabled
          ]}
          onPress={handleBookNow}
          disabled={selectedServiceIds.length === 0 || !selectedDate || !selectedTime}
          activeOpacity={0.8}
        >
          <Text style={styles.bookButtonText}>
            Continue to Payment{selectedServiceIds.length > 0 && ` • ${formatPrice(total)}`}
          </Text>
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
    backgroundColor: Colors.white,
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
    backgroundColor: Colors.white,
    padding: 20,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
    letterSpacing: -0.3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  // Step Indicators
  stepIndicator: {
    width: 24,
    height: 24,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.gray[600],
  },
  // Booking At Section
  bookingAtCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    flex: 1,
  },
  shopAddress: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
    marginLeft: 26,
  },
  shopAddressText: {
    flex: 1,
    fontSize: 13,
    color: Colors.gray[500],
    lineHeight: 18,
  },
  bookingAtDivider: {
    height: 1,
    backgroundColor: Colors.gray[200],
    marginVertical: 16,
  },
  barberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  barberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[200],
  },
  barberInfo: {
    flex: 1,
    gap: 4,
  },
  barberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  barberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  barberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  barberMetaText: {
    fontSize: 12,
    color: Colors.gray[500],
    fontWeight: '500',
  },
  // Sticky Summary (Grab Style)
  stickySummary: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  summaryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  summaryHeaderTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  summaryExpandedContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.gray[200],
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryRowLabel: {
    fontSize: 14,
    color: Colors.gray[600],
    fontWeight: '500',
  },
  summaryRowValue: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  summaryDetails: {
    gap: 12,
  },
  summaryDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryDetailText: {
    flex: 1,
    fontSize: 13,
    color: Colors.gray[600],
    fontWeight: '500',
  },
  // Compact Barber & Shop Info
  compactInfoCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  // Shop Section (Primary)
  shopSection: {
    gap: 8,
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shopNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    flex: 1,
  },
  compactLocation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginLeft: 26, // Align with shop name (icon width + gap)
  },
  compactLocationText: {
    flex: 1,
    fontSize: 13,
    color: Colors.gray[500],
    lineHeight: 18,
  },
  // Divider
  infoDivider: {
    height: 1,
    backgroundColor: Colors.gray[200],
    marginVertical: 16,
  },
  // Barber Section (Secondary)
  barberSection: {
    gap: 12,
  },
  barberLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E5EA',
  },
  compactInfo: {
    flex: 1,
    gap: 4,
  },
  compactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  compactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactMetaText: {
    fontSize: 12,
    color: Colors.gray[500],
    fontWeight: '500',
  },
  // Empty States
  emptyServices: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyServicesText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
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
    color: Colors.primary,
  },
  serviceCard: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    backgroundColor: Colors.backgroundSecondary,
  },
  serviceCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
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
    borderColor: Colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
    color: Colors.primary,
  },
  // Grab Style - Date Selection
  dateListGrab: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateItemGrab: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingVertical: 12,
    alignItems: 'center',
    minWidth: 60,
  },
  dateItemGrabExpanded: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingVertical: 12,
    alignItems: 'center',
    width: '18%', // 5 items per row with gaps
  },
  dateItemGrabSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dateDayGrab: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 4,
  },
  dateDayGrabSelected: {
    color: Colors.white,
  },
  dateNumberGrab: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  dateNumberGrabSelected: {
    color: Colors.white,
  },
  viewMoreDates: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 12,
    gap: 4,
  },
  viewMoreDatesText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  // Grab Style - Time Selection
  timeSectionGrab: {
    marginBottom: 20,
  },
  timePeriodLabelGrab: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeRowGrab: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeButtonGrab: {
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    width: '23%', // 4 items per row with gaps
  },
  timeButtonGrabSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeTextGrab: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  timeTextGrabSelected: {
    color: Colors.white,
  },
  timeEmptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  timeEmptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
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
    color: Colors.gray[500],
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
    color: Colors.primary,
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
    // paddingBottom handled inline with insets
    backgroundColor: Colors.white,
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  bookButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bookButtonDisabled: {
    backgroundColor: Colors.gray[300],
    shadowOpacity: 0,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.2,
  },
});
