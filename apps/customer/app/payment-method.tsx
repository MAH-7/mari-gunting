import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '@/services/api';
import SuccessModal from '@/components/SuccessModal';
import { rewardsService, type UserVoucher } from '@/services/rewardsService';
import { supabase } from '@mari-gunting/shared';
import { bookingService } from '@mari-gunting/shared/services/bookingService';

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
    // Booking type
    type?: string;                  // NEW: 'on-demand' | 'scheduled-shop'
    bookingType?: string;           // Legacy support
    
    // Booking data
    barberId: string;
    barberName: string;
    barberAvatar?: string;
    serviceIds: string;
    services: string;
    addressId?: string;             // Optional for barbershop
    address?: string;               // Optional for barbershop
    distance?: string;              // Optional for barbershop
    
    // Barbershop-specific
    shopId?: string;
    shopName?: string;
    shopAddress?: string;
    shopPhone?: string;
    scheduledDate?: string;
    scheduledTime?: string;
    
    // Pricing
    subtotal: string;
    travelCost: string;
    bookingFee: string;
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
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<UserVoucher | null>(null);
  const [userVouchers, setUserVouchers] = useState<UserVoucher[]>([]);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState(0);
  const [useCredits, setUseCredits] = useState(false);

  // Load current user and their vouchers
  useEffect(() => {
    loadUserVouchers();
  }, []);

  const loadUserVouchers = async () => {
    try {
      setIsLoadingVouchers(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('[payment-method] No authenticated user');
        setUserVouchers([]);
        setIsLoadingVouchers(false);
        return;
      }

      setCurrentUserId(user.id);
      
      // Fetch active vouchers and credits from Supabase
      const [vouchers, credits] = await Promise.all([
        rewardsService.getActiveUserVouchers(user.id),
        rewardsService.getUserCredits(user.id),
      ]);
      console.log('[payment-method] Loaded vouchers:', vouchers.length);
      console.log('[payment-method] User credits:', credits);
      setUserVouchers(vouchers);
      setUserCredits(credits);
    } catch (error) {
      console.error('[payment-method] Error loading vouchers:', error);
      setUserVouchers([]);
    } finally {
      setIsLoadingVouchers(false);
    }
  };

  const subtotal = parseFloat(params.subtotal || '0');
  const travelCost = parseFloat(params.travelCost || '0');
  const bookingFee = parseFloat(params.bookingFee || '0');
  
  // Calculate discount from selected voucher
  const calculateDiscount = (): number => {
    if (!selectedVoucher || !selectedVoucher.voucher) return 0;
    
    return rewardsService.calculateDiscount(selectedVoucher.voucher, subtotal);
  };
  
  const discount = calculateDiscount();
  
  // Calculate credits to apply
  const creditsToApply = useCredits ? Math.min(userCredits, subtotal + travelCost + bookingFee - discount) : 0;
  
  const totalAmount = subtotal + travelCost + bookingFee - discount - creditsToApply;
  
  // Filter usable vouchers (not expired, not used, meets minimum spend)
  const usableVouchers = userVouchers.filter(uv => {
    if (uv.status !== 'active') return false;
    if (!uv.voucher) return false;
    
    const check = rewardsService.canApplyVoucher(uv.voucher, subtotal);
    return check.canApply;
  });

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
          
          if (!currentUserId) {
            throw new Error('User not authenticated');
          }
          
          // Determine booking type
          const bookingType = params.type || (params.shopId ? 'scheduled-shop' : 'on-demand');
          const isBarbershop = bookingType === 'scheduled-shop';
          
          // Prepare booking params for Supabase RPC
          const scheduledDate = isBarbershop && params.scheduledDate 
            ? params.scheduledDate 
            : new Date().toISOString().split('T')[0]; // YYYY-MM-DD
          
          const scheduledTime = isBarbershop && params.scheduledTime
            ? params.scheduledTime
            : new Date().toTimeString().split(' ')[0].substring(0, 5); // HH:MM
          
          const customerAddress = !isBarbershop ? {
            line1: address.address_line1 || address.line1 || '',
            line2: address.address_line2 || address.line2 || '',
            city: address.city || '',
            state: address.state || '',
            postalCode: address.postal_code || address.postalCode || '',
          } : null;
          
          // Create booking using Supabase RPC function
          const createBookingResponse = await bookingService.createBooking({
            customerId: currentUserId,
            barberId: params.barberId,
            services: services,
            scheduledDate: scheduledDate,
            scheduledTime: scheduledTime,
            serviceType: isBarbershop ? 'walk_in' : 'home_service',
            barbershopId: params.shopId || null,
            customerAddress: customerAddress,
            customerNotes: params.serviceNotes || null,
            paymentMethod: 'cash',
            travelFee: parseFloat(params.travelCost || '0'),
            discountAmount: discount, // Pass voucher discount to apply to booking
          });
          
          if (!createBookingResponse.success || !createBookingResponse.data) {
            throw new Error(createBookingResponse.error || 'Failed to create booking');
          }
          
          setIsProcessing(false);
          
          // Supabase RPC returns { booking_id, booking_number, total_price, message }
          const createdBookingId = createBookingResponse.data.booking_id;
          
          if (createdBookingId) {
            console.log('✅ Booking created with ID:', createdBookingId);
            console.log('📋 Booking number:', createBookingResponse.data.booking_number);
            
            // Apply voucher to booking if one was selected
            if (selectedVoucher && currentUserId && discount > 0) {
              try {
                // Since we already passed discount to create_booking,
                // we just need to mark the voucher as used and create booking_vouchers record
                const result = await rewardsService.applyVoucherToBooking(
                  createdBookingId,
                  selectedVoucher.id,
                  subtotal + travelCost + bookingFee, // original total
                  discount, // discount applied
                  totalAmount // final total (already has discount applied)
                );
                
                if (!result.success) {
                  console.error('Failed to apply voucher:', result.error);
                  // Important: The discount was already applied in create_booking,
                  // this just tracks voucher usage for audit purposes
                }
              } catch (voucherError) {
                console.error('Error applying voucher:', voucherError);
                // The discount is already applied, this is just for tracking
              }
            }
            
            // Deduct credits if used
            if (useCredits && creditsToApply > 0 && currentUserId) {
              try {
                const result = await rewardsService.deductCredit(
                  currentUserId,
                  creditsToApply,
                  'booking_payment',
                  `Payment for booking #${createBookingResponse.data.booking_number}`,
                  createdBookingId,
                  {
                    booking_number: createBookingResponse.data.booking_number,
                    original_amount: subtotal + travelCost + bookingFee,
                    discount_amount: discount,
                    credits_used: creditsToApply,
                    final_amount: totalAmount,
                  }
                );
                
                if (!result.success) {
                  console.error('Failed to deduct credits:', result.error);
                  // Note: Booking already created, so we log but don't fail
                }
              } catch (creditError) {
                console.error('Error deducting credits:', creditError);
                // Don't block the booking flow, just log the error
              }
            }
            
            // NOTE: Points will be awarded when service is completed, not now
            // This prevents customers from earning points if they cancel
            
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
          {/* Subtotal breakdown */}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>RM {subtotal.toFixed(2)}</Text>
          </View>
          {travelCost > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Travel</Text>
              <Text style={styles.priceValue}>RM {travelCost.toFixed(2)}</Text>
            </View>
          )}
          {bookingFee > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Booking Fee</Text>
              <Text style={styles.priceValue}>RM {bookingFee.toFixed(2)}</Text>
            </View>
          )}
          
          {/* Voucher section */}
          {selectedVoucher && discount > 0 ? (
            <View style={[styles.priceRow, styles.discountRow]}>
              <View style={styles.discountLeft}>
                <Ionicons name="pricetag" size={14} color="#00B14F" />
                <Text style={styles.discountLabel}>Voucher Discount</Text>
              </View>
              <Text style={styles.discountValue}>-RM {discount.toFixed(2)}</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.voucherButton}
              onPress={() => setShowVoucherModal(true)}
            >
              <View style={styles.voucherButtonLeft}>
                <Ionicons name="ticket-outline" size={20} color="#00B14F" />
                <Text style={styles.voucherButtonText}>
                  {usableVouchers.length > 0 ? 'Select Voucher' : 'No Vouchers Available'}
                </Text>
              </View>
              {usableVouchers.length > 0 && (
                <View style={styles.voucherBadge}>
                  <Text style={styles.voucherBadgeText}>{usableVouchers.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          
          {/* Credits section */}
          {userCredits > 0 && (
            <TouchableOpacity 
              style={[styles.creditsButton, useCredits && styles.creditsButtonActive]}
              onPress={() => setUseCredits(!useCredits)}
            >
              <View style={styles.creditsButtonLeft}>
                <Ionicons name="wallet-outline" size={20} color={useCredits ? '#00B14F' : '#6B7280'} />
                <View>
                  <Text style={[styles.creditsButtonText, useCredits && styles.creditsButtonTextActive]}>
                    Use Mari Credits
                  </Text>
                  <Text style={styles.creditsAvailable}>
                    Available: {rewardsService.formatCreditAmount(userCredits)}
                  </Text>
                </View>
              </View>
              <View style={[styles.checkbox, useCredits && styles.checkboxActive]}>
                {useCredits && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </View>
            </TouchableOpacity>
          )}
          
          {/* Credits applied */}
          {creditsToApply > 0 && (
            <View style={[styles.priceRow, styles.discountRow]}>
              <View style={styles.discountLeft}>
                <Ionicons name="wallet" size={14} color="#00B14F" />
                <Text style={styles.discountLabel}>Credits Applied</Text>
              </View>
              <Text style={styles.discountValue}>-{rewardsService.formatCreditAmount(creditsToApply)}</Text>
            </View>
          )}
          
          <View style={styles.divider} />
          
          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>RM {totalAmount.toFixed(2)}</Text>
          </View>
          
          {discount > 0 && (
            <View style={styles.savingsRow}>
              <Ionicons name="checkmark-circle" size={14} color="#00B14F" />
              <Text style={styles.savingsText}>You save RM {discount.toFixed(2)}!</Text>
            </View>
          )}
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

      {/* Voucher Selection Modal */}
      <Modal
        visible={showVoucherModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowVoucherModal(false)}
      >
        <SafeAreaView style={styles.voucherModalContainer}>
          <View style={styles.voucherModalHeader}>
            <Text style={styles.voucherModalTitle}>Select Voucher</Text>
            <TouchableOpacity onPress={() => setShowVoucherModal(false)}>
              <Ionicons name="close" size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.voucherList}>
            {selectedVoucher && (
              <TouchableOpacity
                style={styles.removeVoucherButton}
                onPress={() => {
                  setSelectedVoucher(null);
                  setShowVoucherModal(false);
                }}
              >
                <Ionicons name="close-circle" size={20} color="#EF4444" />
                <Text style={styles.removeVoucherText}>Remove Voucher</Text>
              </TouchableOpacity>
            )}
            
            {isLoadingVouchers ? (
              <View style={styles.loadingVouchers}>
                <ActivityIndicator size="large" color="#00B14F" />
                <Text style={styles.loadingVouchersText}>Loading vouchers...</Text>
              </View>
            ) : usableVouchers.length > 0 ? (
              usableVouchers.map((userVoucher) => {
                const isSelected = selectedVoucher?.id === userVoucher.id;
                const voucher = userVoucher.voucher;
                const voucherDiscount = rewardsService.calculateDiscount(voucher, subtotal);
                const expiryText = rewardsService.formatExpiryDate(voucher.valid_until);
                
                return (
                  <TouchableOpacity
                    key={userVoucher.id}
                    style={[styles.voucherModalCard, isSelected && styles.voucherModalCardSelected]}
                    onPress={() => {
                      setSelectedVoucher(userVoucher);
                      setShowVoucherModal(false);
                    }}
                  >
                    <View style={styles.voucherModalCardLeft}>
                      <View style={styles.voucherModalBadge}>
                        <Ionicons name="pricetag" size={16} color="#00B14F" />
                      </View>
                      <View style={styles.voucherModalInfo}>
                        <Text style={styles.voucherModalCardTitle}>{voucher.title}</Text>
                        <Text style={styles.voucherModalCardDesc}>{voucher.description}</Text>
                        <Text style={styles.voucherModalCardExpiry}>Exp: {expiryText}</Text>
                      </View>
                    </View>
                    <View style={styles.voucherModalCardRight}>
                      <Text style={styles.voucherModalDiscount}>-RM {voucherDiscount.toFixed(2)}</Text>
                      {isSelected && (
                        <View style={styles.selectedBadge}>
                          <Ionicons name="checkmark-circle" size={20} color="#00B14F" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyVouchers}>
                <Ionicons name="ticket-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyVouchersTitle}>No Vouchers Available</Text>
                <Text style={styles.emptyVouchersText}>Earn points and redeem vouchers to save on bookings</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
      
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
  // Price breakdown styles
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '400',
  },
  priceValue: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Voucher button
  voucherButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 14,
    borderRadius: 12,
    marginVertical: 12,
    borderWidth: 1.5,
    borderColor: '#00B14F',
    borderStyle: 'dashed',
  },
  voucherButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voucherButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00B14F',
  },
  voucherBadge: {
    backgroundColor: '#00B14F',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  voucherBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // Discount row
  discountRow: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  discountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  discountLabel: {
    fontSize: 15,
    color: '#00B14F',
    fontWeight: '600',
  },
  discountValue: {
    fontSize: 15,
    color: '#00B14F',
    fontWeight: '700',
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  savingsText: {
    fontSize: 13,
    color: '#00B14F',
    fontWeight: '600',
  },
  // Voucher modal styles
  voucherModalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  voucherModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  voucherModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  voucherList: {
    flex: 1,
    padding: 16,
  },
  removeVoucherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  removeVoucherText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  voucherModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  voucherModalCardSelected: {
    borderColor: '#00B14F',
    backgroundColor: '#F0FDF4',
  },
  voucherModalCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  voucherModalBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherModalInfo: {
    flex: 1,
  },
  voucherModalCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  voucherModalCardDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  voucherModalCardExpiry: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  voucherModalCardRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  voucherModalDiscount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00B14F',
  },
  selectedBadge: {
    marginTop: 4,
  },
  emptyVouchers: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyVouchersTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyVouchersText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingVouchers: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  loadingVouchersText: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 16,
  },
  // Credits button styles
  creditsButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  creditsButtonActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#00B14F',
  },
  creditsButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  creditsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  creditsButtonTextActive: {
    color: '#00B14F',
  },
  creditsAvailable: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
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
  checkboxActive: {
    backgroundColor: '#00B14F',
    borderColor: '#00B14F',
  },
});
