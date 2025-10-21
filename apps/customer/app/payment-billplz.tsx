import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { billplzService } from '@mari-gunting/shared/services/billplzService';
import { bookingService } from '@mari-gunting/shared/services/bookingService';
import { rewardsService } from '@/services/rewardsService';
import { supabase } from '@mari-gunting/shared';
import { ENV } from '@mari-gunting/shared/config/env';
import SuccessModal from '@/components/SuccessModal';

export default function BillplzPaymentScreen() {
  const params = useLocalSearchParams<{
    // Booking type
    type?: string;
    bookingType?: string;
    
    // Booking data
    barberId: string;
    barberName: string;
    barberAvatar?: string;
    serviceIds: string;
    services: string;
    addressId?: string;
    address?: string;
    distance?: string;
    
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
    
    // Discount & Credits
    discount?: string;
    creditsUsed?: string;
    voucherId?: string;
    
    // Payment
    paymentMethod?: string; // 'card' or 'fpx'
    bankCode?: string;      // e.g., 'MBB0227' for Maybank
    autoSubmit?: string;    // 'true' | 'false' (default true for FPX)
    
    // Display
    serviceName: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [billId, setBillId] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    createBillplzBill();
  }, []);

  const createBillplzBill = async () => {
    try {
      setIsLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        router.back();
        return;
      }

      // Get user profile from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, full_name, phone_number')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        console.error('[billplz] Error fetching profile:', profileError);
        Alert.alert('Error', 'User profile not found. Please complete your profile first.');
        router.back();
        return;
      }

      const email = profile.email || user.email;
      const fullName = profile.full_name || 'Customer';
      const phoneNumber = profile.phone_number;

      if (!email) {
        Alert.alert('Error', 'Email not found. Please update your profile.');
        router.back();
        return;
      }

      // Calculate final amount
      const subtotal = parseFloat(params.subtotal || '0');
      const travelCost = parseFloat(params.travelCost || '0');
      const bookingFee = parseFloat(params.bookingFee || '0');
      const discount = parseFloat(params.discount || '0');
      const creditsUsed = parseFloat(params.creditsUsed || '0');
      const finalAmount = subtotal + travelCost + bookingFee - discount - creditsUsed;

      // Create Billplz bill
      const amountInCents = billplzService.formatAmount(finalAmount);

      // Determine payment preferences
      const selectedMethod = (params.paymentMethod as string) || 'card';
      let bankCode = (params.bankCode as string) || undefined;
      const autoSubmit = params.autoSubmit === 'false' ? false : true; // default true
      if (selectedMethod === 'fpx' && !bankCode) {
        // Default to Maybank in sandbox tests if not provided
        bankCode = 'MBB0227';
      }
      
      // Create the booking first
      const services = JSON.parse(params.services || '[]');
      const address = params.address ? JSON.parse(params.address) : null;
      
      const bookingType = params.type || (params.shopId ? 'scheduled-shop' : 'on-demand');
      const isBarbershop = bookingType === 'scheduled-shop';
      
      const scheduledDate = isBarbershop && params.scheduledDate 
        ? params.scheduledDate 
        : new Date().toISOString().split('T')[0];
      
      const scheduledTime = isBarbershop && params.scheduledTime
        ? params.scheduledTime
        : new Date().toTimeString().split(' ')[0].substring(0, 5);
      
      const customerAddress = !isBarbershop && address ? {
        line1: address.address_line1 || address.line1 || '',
        line2: address.address_line2 || address.line2 || '',
        city: address.city || '',
        state: address.state || '',
        postalCode: address.postal_code || address.postalCode || '',
      } : null;
      
      // Create booking
      const createBookingResponse = await bookingService.createBooking({
        customerId: user.id,
        barberId: params.barberId,
        services: services,
        scheduledDate: scheduledDate,
        scheduledTime: scheduledTime,
        serviceType: isBarbershop ? 'walk_in' : 'home_service',
        barbershopId: params.shopId || null,
        customerAddress: customerAddress,
        customerNotes: null,
        paymentMethod: (selectedMethod as any) || 'card', // 'card' or 'fpx'
        travelFee: travelCost,
        discountAmount: discount,
      });
      
      if (!createBookingResponse.success || !createBookingResponse.data) {
        throw new Error(createBookingResponse.error || 'Failed to create booking');
      }
      
      const createdBookingId = createBookingResponse.data.booking_id;
      setBookingId(createdBookingId);

      // Create Billplz bill via secured Edge Function (server-side)
      const { data: billData, error: billError } = await supabase.functions.invoke('billplz-create-bill', {
        body: {
          bookingId: createdBookingId,
          amount: amountInCents,
          email,
          name: fullName,
          description: `Booking for ${params.serviceName}`,
          mobile: phoneNumber || undefined,
          bankCode: selectedMethod === 'fpx' ? bankCode : undefined,
          redirectUrl: `marigunting://payment-success?bookingId=${createdBookingId}`,
        }
      });

      if (billError || !billData?.success) {
        throw new Error(billError?.message || 'Failed to create Billplz bill');
      }

      console.log('[billplz] Bill created:', billData.billId);
      setBillId(billData.billId);

      // Append auto_submit for direct gateway if FPX with bankCode
      let finalUrl = billData.paymentUrl as string;
      if (selectedMethod === 'fpx' && bankCode && autoSubmit) {
        finalUrl += finalUrl.includes('?') ? '&auto_submit=true' : '?auto_submit=true';
      }
      setPaymentUrl(finalUrl);

      // Payment record is inserted by the Edge Function (idempotent).

      setIsLoading(false);
    } catch (error) {
      console.error('[billplz] Error creating bill:', error);
      Alert.alert(
        'Payment Error',
        'Failed to initialize payment. Please try again.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  };

  const handleWebViewNavigationStateChange = async (navState: any) => {
    console.log('[billplz] Navigation:', navState.url);

    // Check if payment was successful (Billplz redirects to your redirect_url)
    if (navState.url.includes('marigunting://payment-success')) {
      // Extract query parameters from URL
      try {
        const url = new URL(navState.url);
        const params: any = {};
        url.searchParams.forEach((value, key) => {
          params[key] = value;
        });

        // Verify X-Signature if present (production security)
        if (params['billplz[x_signature]']) {
          console.log('[billplz] Verifying redirect signature...');
          const isValid = await billplzService.verifyRedirectSignature(params);
          
          if (!isValid) {
            console.error('[billplz] ⚠️ Redirect signature verification failed!');
            // Still proceed but log warning - webhook is source of truth
            console.warn('[billplz] Proceeding with payment - webhook will be final confirmation');
          }
        }

        // Check payment status
        const isPaid = params['billplz[paid]'] === 'true';
        console.log('[billplz] Payment status:', isPaid ? 'PAID' : 'UNPAID');

        if (isPaid) {
          handlePaymentSuccess();
        } else {
          Alert.alert(
            'Payment Incomplete',
            'Your payment was not completed. Please try again.',
            [
              { text: 'Try Again', onPress: () => router.back() },
              { text: 'Cancel', onPress: () => router.replace('/') },
            ]
          );
        }
      } catch (error) {
        console.error('[billplz] Error parsing redirect URL:', error);
        // Fallback to success if we can't parse
        handlePaymentSuccess();
      }
    }

    // Check if payment was cancelled
    if (navState.url.includes('cancelled') || navState.url.includes('cancel')) {
      Alert.alert(
        'Payment Cancelled',
        'Your payment was cancelled. Would you like to try again?',
        [
          { text: 'Try Again', onPress: () => router.back() },
          { text: 'Cancel', onPress: () => router.replace('/') },
        ]
      );
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      // Apply voucher if one was selected
      if (params.voucherId && bookingId) {
        const discount = parseFloat(params.discount || '0');
        const subtotal = parseFloat(params.subtotal || '0');
        const travelCost = parseFloat(params.travelCost || '0');
        const bookingFee = parseFloat(params.bookingFee || '0');
        const creditsUsed = parseFloat(params.creditsUsed || '0');
        const finalAmount = subtotal + travelCost + bookingFee - discount - creditsUsed;

        await rewardsService.applyVoucherToBooking(
          bookingId,
          params.voucherId,
          subtotal + travelCost + bookingFee,
          discount,
          finalAmount
        );
      }

      // Deduct credits if used
      if (params.creditsUsed && parseFloat(params.creditsUsed) > 0 && bookingId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const creditsUsed = parseFloat(params.creditsUsed);
          await rewardsService.deductCredit(
            user.id,
            creditsUsed,
            'booking_payment',
            `Payment for booking`,
            bookingId
          );
        }
      }

      setShowSuccessModal(true);
    } catch (error) {
      console.error('[billplz] Error processing post-payment:', error);
      // Still show success since payment went through
      setShowSuccessModal(true);
    }
  };

  if (isLoading || !paymentUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00B14F" />
          <Text style={styles.loadingText}>Initializing payment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          Alert.alert(
            'Cancel Payment',
            'Are you sure you want to cancel this payment?',
            [
              { text: 'No', style: 'cancel' },
              { text: 'Yes', onPress: () => router.back() },
            ]
          );
        }}>
          <Ionicons name="close" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Billplz Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      <WebView
        source={{ uri: paymentUrl }}
        onNavigationStateChange={handleWebViewNavigationStateChange}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.webviewLoading}>
            <ActivityIndicator size="large" color="#00B14F" />
          </View>
        )}
        style={styles.webview}
      />

      <SuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Payment Successful!"
        message="Your booking has been confirmed. The barber will be notified shortly."
        primaryButton={{
          label: 'View Booking',
          onPress: () => {
            setShowSuccessModal(false);
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
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#6B7280',
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
