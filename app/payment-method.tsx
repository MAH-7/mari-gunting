import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '@/services/api';
import SuccessModal from '@/components/SuccessModal';

type PaymentMethod = 'card' | 'fpx' | 'ewallet' | 'cash';

interface PaymentOption {
  id: PaymentMethod;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  badge?: string;
}

const paymentOptions: PaymentOption[] = [
  {
    id: 'card',
    name: 'Card',
    icon: 'card-outline',
    description: 'Visa, Mastercard',
    badge: 'RECOMMENDED',
  },
  {
    id: 'fpx',
    name: 'Online Banking',
    icon: 'business-outline',
    description: 'FPX',
  },
  {
    id: 'ewallet',
    name: 'E-Wallet',
    icon: 'wallet-outline',
    description: 'TNG, GrabPay, ShopeePay',
  },
  {
    id: 'cash',
    name: 'Cash',
    icon: 'cash-outline',
    description: 'Pay after service',
  },
];

export default function PaymentMethodScreen() {
  const params = useLocalSearchParams<{
    // Booking data
    barberId: string;
    barberName: string;
    barberAvatar?: string;
    serviceIds: string;
    services: string;
    addressId: string;
    address: string;
    distance: string;
    
    // Pricing
    subtotal: string;
    travelCost: string;
    platformFee: string;
    serviceCommission: string;
    barberServiceEarning: string;
    amount: string;
    totalDuration: string;
    
    // Display
    serviceName: string;
  }>();
  
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookingId, setBookingId] = useState<string>('');

  const totalAmount = parseFloat(params.amount || '0');

  const handleConfirmPayment = async () => {
    if (!selectedMethod) {
      Alert.alert('Required', 'Please select a payment method');
      return;
    }

    setIsProcessing(true);

    try {
      // Handle different payment methods
      if (selectedMethod === 'card') {
        setIsProcessing(false);
        router.push({
          pathname: '/payment-card',
          params: params,
        } as any);
      } else if (selectedMethod === 'fpx') {
        setIsProcessing(false);
        router.push({
          pathname: '/payment-fpx',
          params: params,
        } as any);
      } else if (selectedMethod === 'ewallet') {
        setIsProcessing(false);
        router.push({
          pathname: '/payment-ewallet',
          params: params,
        } as any);
      } else if (selectedMethod === 'cash') {
        // Create booking via API for cash payment
        try {
          // Parse booking data
          const services = JSON.parse(params.services || '[]');
          const address = JSON.parse(params.address || '{}');
          
          console.log('🔄 Creating booking...');
          
          // Fetch barber details to include in booking
          const barberResponse = await api.getBarberById(params.barberId);
          const barber = barberResponse.data;
          
          if (!barber) {
            throw new Error('Barber not found');
          }
          
          console.log('✅ Barber fetched:', barber.name);
          
          // Create booking
          const createBookingResponse = await api.createBooking({
            barberId: params.barberId,
            barberName: params.barberName,
            barberAvatar: params.barberAvatar,
            barber: barber, // Include full barber object
            customerId: 'user123', // TODO: Get from auth context
            services: services,
            serviceName: params.serviceName,
            addressId: params.addressId,
            address: address,
            distance: parseFloat(params.distance || '0'),
            price: parseFloat(params.subtotal || '0'),
            travelCost: parseFloat(params.travelCost || '0'),
            platformFee: parseFloat(params.platformFee || '0'),
            serviceCommission: parseFloat(params.serviceCommission || '0'),
            barberServiceEarning: parseFloat(params.barberServiceEarning || '0'),
            totalPrice: totalAmount,
            duration: parseInt(params.totalDuration || '0'),
            paymentMethod: 'cash',
            status: 'pending',
            scheduledAt: new Date().toISOString(),
          });
          
          setIsProcessing(false);
          
          const createdBookingId = createBookingResponse.data?.id;
          
          if (createdBookingId) {
            console.log('✅ Booking created with ID:', createdBookingId);
            
            // Store booking ID and show success modal
            setBookingId(createdBookingId);
            setShowSuccessModal(true);
          } else {
            throw new Error('No booking ID received');
          }
        } catch (error) {
          setIsProcessing(false);
          console.error('❌ Failed to create booking:', error);
          Alert.alert('Error', 'Failed to create booking. Please try again.');
        }
      }
    } catch (error) {
      setIsProcessing(false);
      console.error('❌ Error in payment flow:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const getMethodDetails = (method: PaymentMethod) => {
    const details = {
      card: {
        title: 'How Card Payment Works',
        steps: [
          'We pre-authorize (hold) the amount on your card',
          'No charge until service is completed',
          'After service, amount is captured automatically',
          'More secure for both parties',
        ],
      },
      fpx: {
        title: 'How FPX Works',
        steps: [
          'You pay now via your bank',
          'Money is transferred immediately',
          'Barber gets notified and accepts job',
          'Auto-refund if barber cancels',
        ],
      },
      ewallet: {
        title: 'How E-Wallet Works',
        steps: [
          'Pay now from your e-wallet balance',
          'Instant payment confirmation',
          'Barber accepts your booking',
          'Auto-refund if barber cancels',
        ],
      },
      cash: {
        title: 'How Cash Payment Works',
        steps: [
          'No payment needed now',
          'Prepare exact amount in cash',
          'Pay barber directly after service',
          'Confirm payment in app',
        ],
      },
    };
    return details[method];
  };

  const selectedDetails = selectedMethod ? getMethodDetails(selectedMethod) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount Section */}
        <View style={styles.amountSection}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>RM {totalAmount.toFixed(2)}</Text>
        </View>

        {/* Payment Methods */}
        <View style={styles.methodsSection}>
          {paymentOptions.map((option, index) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.methodCard,
                selectedMethod === option.id && styles.methodCardActive,
                index === paymentOptions.length - 1 && styles.methodCardLast,
              ]}
              onPress={() => setSelectedMethod(option.id)}
              activeOpacity={0.6}
            >
              <View style={styles.methodContent}>
                <View style={styles.methodIcon}>
                  <Ionicons 
                    name={option.icon} 
                    size={24} 
                    color={selectedMethod === option.id ? '#00B14F' : '#3C3C43'} 
                  />
                </View>
                
                <View style={styles.methodInfo}>
                  <View style={styles.methodHeader}>
                    <Text style={styles.methodName}>{option.name}</Text>
                    {option.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{option.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.methodDesc}>{option.description}</Text>
                </View>
              </View>
              
              <View style={[
                styles.radio,
                selectedMethod === option.id && styles.radioActive,
              ]}>
                {selectedMethod === option.id && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Section */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={16} color="#8E8E93" />
          <Text style={styles.infoText}>
            Card payments are pre-authorized and charged after service completion
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedMethod && styles.continueButtonDisabled,
          ]}
          onPress={handleConfirmPayment}
          disabled={!selectedMethod || isProcessing}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>
            {isProcessing ? 'Processing...' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Booking Confirmed!"
        message="Your booking request has been sent. Please prepare cash payment after service."
        primaryButton={{
          label: 'View Booking',
          onPress: () => {
            setShowSuccessModal(false);
            // Clear the entire booking flow stack and navigate to booking detail
            router.dismissAll();
            router.replace(`/booking/${bookingId}` as any);
          },
          icon: 'calendar-outline',
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
  scrollContent: {
    paddingBottom: 100,
  },
  amountSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderBottomWidth: 8,
    borderBottomColor: '#F2F2F7',
  },
  totalLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
    fontWeight: '400',
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.6,
  },
  methodsSection: {
    backgroundColor: '#FFFFFF',
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  methodCardActive: {
    backgroundColor: '#F0FDF4',
  },
  methodCardLast: {
    borderBottomWidth: 0,
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  methodIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  badge: {
    backgroundColor: '#00B14F',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  methodDesc: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '400',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  radioActive: {
    borderColor: '#00B14F',
    borderWidth: 2,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00B14F',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F2F2F7',
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 16,
    fontWeight: '400',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 34,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  continueButton: {
    backgroundColor: '#00B14F',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
});
