import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions, StatusBar, ActivityIndicator, Modal, TextInput, Alert, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO, isToday, isYesterday } from 'date-fns';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { Booking } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { bookingService } from '@mari-gunting/shared/services/bookingService';
import { supabase } from '@mari-gunting/shared/config/supabase';
import { router, useFocusEffect } from 'expo-router';
import { extractDateFromISO } from '@mari-gunting/shared/utils/format';
import { payoutService } from '@mari-gunting/shared/services/payoutService';
import { Colors, theme } from '@mari-gunting/shared/theme';

const { width } = Dimensions.get('window');

type TimePeriod = 'today' | 'week' | 'month' | 'all';

export default function GrabEarningsScreen() {
  const currentUser = useStore((state) => state.currentUser);
  
  // Handler for navigating to job details
  const handleViewJobDetails = (jobId: string) => {
    router.push({
      pathname: '/(tabs)/jobs',
      params: { jobId }
    });
  };
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('today');
  const [refreshing, setRefreshing] = useState(false);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [visibleTrips, setVisibleTrips] = useState(10); // Pagination
  
  // Payout modal state
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [availableBalance, setAvailableBalance] = useState(0);
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

  // Fetch barber ID from barbers table using user_id
  useEffect(() => {
    const fetchBarberId = async () => {
      if (!currentUser?.id) return;
      
      const { data, error } = await supabase
        .from('barbers')
        .select('id')
        .eq('user_id', currentUser.id)
        .single();
      
      if (error) {
        console.error('❌ Error fetching barber ID:', error);
        return;
      }
      
      setBarberId(data.id);
    };
    
    fetchBarberId();
  }, [currentUser?.id]);

  // REAL SUPABASE QUERY - Fetch barber bookings
  const { data: bookingsResponse, isLoading: loadingBookings, refetch } = useQuery({
    queryKey: ['earnings-bookings', barberId],
    queryFn: async () => {
      const result = await bookingService.getBarberBookings(barberId || '');
      return result;
    },
    enabled: !!barberId,
    staleTime: 5 * 60 * 1000,
  });

  const allBookings = bookingsResponse?.data || [];

  // Auto-refresh when tab is focused
  useFocusEffect(
    useCallback(() => {
      if (barberId) {
        refetch();
      }
    }, [barberId, refetch])
  );

  // Get completed bookings
  const completedBookings = useMemo(() => {
    return allBookings.filter((b) => b.status === 'completed');
  }, [allBookings]);

  // Filter by period (using scheduled_datetime with timezone)
  const filteredBookings = useMemo(() => {
    const now = new Date();
    // Get local date without UTC conversion
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`; // YYYY-MM-DD in local time
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return completedBookings.filter((booking) => {
      // Use scheduled_datetime (timestamptz) as source of truth, fallback to scheduledDate
      const datetime = booking.scheduled_datetime || `${booking.scheduledDate}T00:00:00Z`;
      if (!datetime) return false;

      const jobDate = new Date(datetime);
      const bookingDateStr = extractDateFromISO(datetime);

      switch (selectedPeriod) {
        case 'today':
          return bookingDateStr === today;
        case 'week':
          return jobDate >= startOfWeek(now) && jobDate <= endOfWeek(now);
        case 'month':
          return jobDate.getMonth() === currentMonth && jobDate.getFullYear() === currentYear;
        case 'all':
        default:
          return true;
      }
    });
  }, [completedBookings, selectedPeriod]);

  // Paginated trips (show 10 at a time)
  const displayedTrips = useMemo(() => {
    return filteredBookings.slice(0, visibleTrips);
  }, [filteredBookings, visibleTrips]);

  const hasMoreTrips = filteredBookings.length > visibleTrips;

  const loadMoreTrips = () => {
    setVisibleTrips(prev => prev + 10);
  };

  // Reset pagination when period changes
  useEffect(() => {
    setVisibleTrips(10);
  }, [selectedPeriod]);

  // Calculate stats
  const stats = useMemo(() => {
    const grossEarnings = filteredBookings.reduce((sum, b) => {
      const serviceTotal = (b.services || []).reduce((s, service) => s + service.price, 0);
      return sum + serviceTotal;
    }, 0);

    const travelEarnings = filteredBookings.reduce((sum, b) => sum + (b.travelCost || 0), 0);
    const commission = grossEarnings * 0.15; // 15% commission (partner keeps 85%)
    const netServiceEarnings = grossEarnings - commission;
    const totalNet = netServiceEarnings + travelEarnings;

    return {
      trips: filteredBookings.length,
      grossEarnings,
      travelEarnings,
      commission,
      netServiceEarnings,
      totalNet,
      average: filteredBookings.length > 0 ? totalNet / filteredBookings.length : 0,
    };
  }, [filteredBookings]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Fetch available balance for payout
  const fetchAvailableBalance = async () => {
    if (!barberId) return;
    try {
      const balance = await payoutService.getAvailableBalance(barberId);
      setAvailableBalance(balance);
    } catch (error) {
      console.error('Error fetching available balance:', error);
    }
  };

  // Fetch balance when barberId is available
  useEffect(() => {
    fetchAvailableBalance();
  }, [barberId, allBookings]); // Refetch when bookings change

  // Handle Request Payout button press
  const handleRequestPayout = async () => {
    if (!barberId) return;

    // Check for bank account
    const { data: barberData } = await supabase
      .from('barbers')
      .select('bank_name, bank_account_number, bank_account_name')
      .eq('id', barberId)
      .single();

    if (!barberData?.bank_account_number) {
      Alert.alert(
        'Bank Account Required',
        'Please add your bank account details in Profile first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Profile', onPress: () => router.push('/profile') }
        ]
      );
      return;
    }

    // Check minimum balance
    if (availableBalance < 50) {
      Alert.alert(
        'Insufficient Balance',
        `Minimum payout amount is RM 50.00\nYour available balance: RM ${availableBalance.toFixed(2)}`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Check for pending payout
    try {
      const hasPending = await payoutService.hasPendingPayout(barberId);
      if (hasPending) {
        Alert.alert(
          'Pending Request Exists',
          'You already have a pending payout request. Please wait for it to be processed.',
          [
            { text: 'OK' },
            { text: 'View History', onPress: () => router.push('/payout-history') }
          ]
        );
        return;
      }
    } catch (error) {
      console.error('Error checking pending payout:', error);
    }

    // Set default amount to available balance
    setPayoutAmount(availableBalance.toFixed(2));
    setShowPayoutModal(true);
  };

  // Handle payout submission
  const handleSubmitPayout = async () => {
    if (!barberId) return;

    const amount = parseFloat(payoutAmount);
    
    // Validation
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (amount < 50) {
      Alert.alert('Minimum Amount', 'Minimum payout amount is RM 50.00');
      return;
    }

    if (amount > availableBalance) {
      Alert.alert('Insufficient Balance', `Maximum amount: RM ${availableBalance.toFixed(2)}`);
      return;
    }

    setIsSubmittingPayout(true);

    try {
      // Fetch bank details
      const { data: barberData } = await supabase
        .from('barbers')
        .select('bank_name, bank_account_number, bank_account_name')
        .eq('id', barberId)
        .single();

      if (!barberData) {
        throw new Error('Bank account details not found');
      }

      // Submit payout request
      await payoutService.requestPayout({
        barberId,
        amount,
        bankName: barberData.bank_name || '',
        bankAccountNumber: barberData.bank_account_number || '',
        bankAccountName: barberData.bank_account_name || '',
      });

      setShowPayoutModal(false);
      setPayoutAmount('');
      
      Alert.alert(
        '✅ Payout Requested',
        `Your payout request of RM ${amount.toFixed(2)} has been submitted successfully.\n\nWe will process it within 3-5 business days.`,
        [
          { text: 'OK' },
          { text: 'View History', onPress: () => router.push('/payout-history') }
        ]
      );

      // Refresh balance
      fetchAvailableBalance();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit payout request');
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="wallet-outline" size={64} color={COLORS.text.tertiary} />
          <Text style={styles.emptyText}>Please log in to view earnings</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loadingBookings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.emptyText, { marginTop: 16 }]}>Loading earnings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F4F7" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.white} />
        }
      >
        {/* Hero Section - Grab Style */}
        <View style={[styles.heroSection, { backgroundColor: Colors.primary }]}>
          <Text style={styles.heroLabel}>
            {selectedPeriod === 'today'
              ? "Today's Earnings"
              : selectedPeriod === 'week'
              ? "This Week's Earnings"
              : selectedPeriod === 'month'
              ? "This Month's Earnings"
              : 'Total Earnings'}
          </Text>

          <View style={styles.heroAmount}>
            <Text style={styles.currency}>RM</Text>
            <Text style={styles.amount}>{stats.totalNet.toFixed(2)}</Text>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{stats.trips}</Text>
              <Text style={styles.heroStatLabel}>Jobs</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>RM {stats.average.toFixed(2)}</Text>
              <Text style={styles.heroStatLabel}>Average</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>RM {stats.commission.toFixed(2)}</Text>
              <Text style={styles.heroStatLabel}>Commission</Text>
            </View>
          </View>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {['today', 'week', 'month', 'all'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.periodTab, selectedPeriod === period && styles.periodTabActive]}
              onPress={() => setSelectedPeriod(period as TimePeriod)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.periodText, selectedPeriod === period && styles.periodTextActive]}
              >
                {period === 'today'
                  ? 'Today'
                  : period === 'week'
                  ? 'Week'
                  : period === 'month'
                  ? 'Month'
                  : 'All'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payout Section - Minimal (Grab Standard) */}
        <View style={styles.section}>
          <View style={styles.payoutCard}>
            {/* Available Balance - Primary Action */}
            <TouchableOpacity 
              style={styles.availableBalanceRow}
              onPress={handleRequestPayout}
              activeOpacity={0.7}
            >
              <View style={styles.availableBalanceContent}>
                <Ionicons name="wallet-outline" size={18} color={Colors.primary} style={{ marginRight: 8 }} />
                <Text style={styles.availableBalanceText}>Available: </Text>
                <Text style={styles.availableBalanceValue}>RM {availableBalance.toFixed(2)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#757575" />
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.payoutDivider} />

            {/* Payout History - Secondary Action */}
            <TouchableOpacity 
              style={styles.payoutHistoryRow}
              onPress={() => router.push('/payout-history')}
              activeOpacity={0.7}
            >
              <View style={styles.payoutHistoryContent}>
                <Ionicons name="receipt-outline" size={16} color="#757575" style={{ marginRight: 8 }} />
                <Text style={styles.payoutHistoryText}>Payout History</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#BDBDBD" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Earnings Breakdown - Clean Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings Breakdown</Text>
          {/* Revenue Model Banner */}
          <View style={styles.revenueModelBanner}>
            <View style={styles.revenueModelRow}>
              <View style={styles.revenueModelItem}>
                <Text style={styles.revenueModelValue}>85%</Text>
                <Text style={styles.revenueModelLabel}>Service</Text>
              </View>
              <Text style={styles.revenueModelPlus}>+</Text>
              <View style={styles.revenueModelItem}>
                <Text style={styles.revenueModelValue}>100%</Text>
                <Text style={styles.revenueModelLabel}>Travel</Text>
              </View>
              <Text style={styles.revenueModelEquals}>=</Text>
              <View style={styles.revenueModelItem}>
                <Ionicons name="checkmark-circle" size={28} color={Colors.primary} style={styles.revenueModelIcon} />
                <Text style={styles.revenueModelLabel}>Your Pay</Text>
              </View>
            </View>
            <Text style={styles.revenueModelSubtext}>You keep 85% of services + 100% of travel fees</Text>
          </View>

          <View style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <Ionicons name="cut-outline" size={24} color={Colors.primary} style={{ marginRight: 12 }} />
                <View>
                  <Text style={styles.breakdownLabel}>Service Earnings</Text>
                  <Text style={styles.breakdownSub}>Before commission</Text>
                </View>
              </View>
              <Text style={styles.breakdownValue}>RM {stats.grossEarnings.toFixed(2)}</Text>
            </View>

            <View style={styles.breakdownDivider} />

            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <Ionicons name="car-outline" size={24} color="#FF9800" style={{ marginRight: 12 }} />
                <View>
                  <Text style={styles.breakdownLabel}>Travel</Text>
                  <Text style={styles.breakdownSub}>100% to you</Text>
                </View>
              </View>
              <Text style={styles.breakdownValue}>RM {stats.travelEarnings.toFixed(2)}</Text>
            </View>

            <View style={styles.breakdownDivider} />

            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <Ionicons name="business-outline" size={24} color="#F44336" style={{ marginRight: 12 }} />
                <View>
                  <Text style={styles.breakdownLabel}>Commission</Text>
                  <Text style={styles.breakdownSub}>15% of services</Text>
                </View>
              </View>
              <Text style={[styles.breakdownValue, { color: '#F44336' }]}>
                - RM {stats.commission.toFixed(2)}
              </Text>
            </View>

            <View style={styles.breakdownTotal}>
              <Text style={styles.breakdownTotalLabel}>Net Earnings</Text>
              <Text style={styles.breakdownTotalValue}>RM {stats.totalNet.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Trip List - Grab Style with Pagination */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trip History</Text>
            <Text style={styles.sectionCount}>{filteredBookings.length} trips</Text>
          </View>

          {filteredBookings.length > 0 ? (
            <>
              {displayedTrips.map((booking) => (
                <TripCard 
                  key={booking.id} 
                  booking={booking} 
                  onPress={() => handleViewJobDetails(booking.id)}
                />
              ))}
              
              {/* Load More Button */}
              {hasMoreTrips && (
                <TouchableOpacity 
                  style={styles.loadMoreButton}
                  onPress={loadMoreTrips}
                  activeOpacity={0.7}
                >
                  <Text style={styles.loadMoreText}>
                    Load More ({filteredBookings.length - visibleTrips} remaining)
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={Colors.primary} />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.emptyTrips}>
              <Ionicons name="calendar-outline" size={48} color="#BDBDBD" />
              <Text style={styles.emptyTripsText}>No trips in this period</Text>
              <Text style={styles.emptyTripsSub}>Complete trips to see them here</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Payout Request Modal */}
      <Modal
        visible={showPayoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => !isSubmittingPayout && setShowPayoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.payoutModal}>
              <View style={styles.payoutHeader}>
                <Text style={styles.payoutTitle}>Request Payout</Text>
                <TouchableOpacity 
                  onPress={() => !isSubmittingPayout && setShowPayoutModal(false)}
                  disabled={isSubmittingPayout}
                >
                  <Ionicons name="close" size={24} color="#212121" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.payoutContent}>
                {/* Available Balance */}
                <View style={styles.balanceCard}>
                  <Text style={styles.balanceLabel}>Available Balance</Text>
                  <Text style={styles.balanceAmount}>RM {availableBalance.toFixed(2)}</Text>
                </View>

                {/* Amount Input */}
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Withdrawal Amount</Text>
                  <View style={styles.amountInputWrapper}>
                    <Text style={styles.currencyLabel}>RM</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={payoutAmount}
                      onChangeText={setPayoutAmount}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor="#BDBDBD"
                      editable={!isSubmittingPayout}
                    />
                  </View>
                  <Text style={styles.inputHint}>Minimum: RM 50.00 • Maximum: RM {availableBalance.toFixed(2)}</Text>
                </View>

                {/* Quick Amount Buttons */}
                <View style={styles.quickAmounts}>
                  <TouchableOpacity 
                    style={styles.quickAmountBtn}
                    onPress={() => setPayoutAmount('50')}
                    disabled={availableBalance < 50 || isSubmittingPayout}
                  >
                    <Text style={[styles.quickAmountText, availableBalance < 50 && { color: '#BDBDBD' }]}>RM 50</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.quickAmountBtn}
                    onPress={() => setPayoutAmount('100')}
                    disabled={availableBalance < 100 || isSubmittingPayout}
                  >
                    <Text style={[styles.quickAmountText, availableBalance < 100 && { color: '#BDBDBD' }]}>RM 100</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.quickAmountBtn}
                    onPress={() => setPayoutAmount(availableBalance.toFixed(2))}
                    disabled={isSubmittingPayout}
                  >
                    <Text style={styles.quickAmountText}>All</Text>
                  </TouchableOpacity>
                </View>

                {/* Info */}
                <View style={styles.payoutInfo}>
                  <Ionicons name="information-circle-outline" size={20} color="#757575" />
                  <Text style={styles.payoutInfoText}>
                    Payouts are processed within 3-5 business days. You'll receive the money via bank transfer.
                  </Text>
                </View>
              </ScrollView>

              {/* Buttons */}
              <View style={styles.payoutActions}>
                <TouchableOpacity 
                  style={[styles.payoutBtn, styles.payoutBtnSecondary]}
                  onPress={() => setShowPayoutModal(false)}
                  disabled={isSubmittingPayout}
                >
                  <Text style={styles.payoutBtnSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.payoutBtn, styles.payoutBtnPrimary, isSubmittingPayout && { opacity: 0.6 }]}
                  onPress={handleSubmitPayout}
                  disabled={isSubmittingPayout}
                >
                  {isSubmittingPayout ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={styles.payoutBtnPrimaryText}>Confirm</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// Trip Card Component - Grab Standard (Service-Focused)
function TripCard({ booking, onPress }: { booking: Booking; onPress?: () => void }) {
  const serviceTotal = (booking.services || []).reduce((sum, s) => sum + s.price, 0);
  const commission = serviceTotal * 0.15;
  const netService = serviceTotal - commission;
  const totalEarned = netService + (booking.travelCost || 0);

  // Use scheduled_datetime (when job actually happened)
  const datetime = booking.scheduled_datetime || `${booking.scheduledDate}T${booking.scheduledTime || '00:00'}:00Z`;
  const jobDate = new Date(datetime);
  
  // Format date: "Today", "Yesterday", or "Nov 05"
  let formattedDate: string;
  if (isToday(jobDate)) {
    formattedDate = 'Today';
  } else if (isYesterday(jobDate)) {
    formattedDate = 'Yesterday';
  } else {
    formattedDate = format(jobDate, 'MMM dd');
  }
  
  const formattedTime = format(jobDate, 'hh:mm a');
  
  // Format payment method
  const paymentMethod = booking.payment_method || booking.paymentMethod || 'cash';
  const paymentLabel = paymentMethod === 'curlec_card' ? 'Card' 
    : paymentMethod === 'curlec_fpx' ? 'FPX'
    : paymentMethod === 'credits' ? 'Credits'
    : 'Cash';

  const serviceCount = (booking.services || []).length;
  const serviceText = serviceCount === 1 ? '1 Service' : `${serviceCount} Services`;

  return (
    <TouchableOpacity 
      style={styles.tripCard} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.tripHeader}>
        <View style={styles.tripLeft}>
          {/* Service Icon - Grab Standard */}
          <Ionicons name="cut" size={24} color={Colors.primary} style={{ marginRight: 12 }} />
          <View style={styles.tripInfo}>
            <Text style={styles.tripServiceCount}>{serviceText}</Text>
            <Text style={styles.tripTime}>
              {formattedDate} • {formattedTime}
            </Text>
          </View>
        </View>
        <View style={styles.tripRight}>
          <Text style={styles.tripAmount}>+RM {totalEarned.toFixed(2)}</Text>
          <View style={styles.tripCash}>
            <Ionicons 
              name={paymentMethod.includes('card') ? 'card-outline' : paymentMethod === 'credits' ? 'wallet-outline' : 'cash-outline'} 
              size={12} 
              color="#757575" 
            />
            <Text style={styles.tripCashText}>{paymentLabel}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#BDBDBD" style={styles.tripChevron} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
  },

  // Hero Section - Grab Green Gradient
  heroSection: {
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    opacity: 0.9,
  },
  infoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAmount: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  currency: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    marginTop: 4,
    marginRight: 4,
  },
  amount: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: -1,
  },
  heroStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-around',
  },
  heroStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  heroStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 4,
  },
  heroStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.white,
    opacity: 0.8,
  },
  heroDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Period Selector - Clean Tabs
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodTabActive: {
    backgroundColor: Colors.primary,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
  },
  periodTextActive: {
    color: Colors.white,
  },

  // Section
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },

  // Payout Card - Combined Container (Grab Standard)
  payoutCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  availableBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  payoutDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  availableBalanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availableBalanceText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
  },
  availableBalanceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
  },

  // Breakdown Card - Clean Design
  breakdownCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  breakdownIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  breakdownLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  breakdownSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9E9E9E',
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: 4,
  },
  breakdownTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#E0E0E0',
  },
  breakdownTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
  },
  breakdownTotalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primary,
  },

  // Trip Card - Grab Standard (Service-Focused)
  tripCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  // Service Icon (replaces avatar)
  tripServiceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tripInfo: {
    flex: 1,
  },
  tripServiceCount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  tripTime: {
    fontSize: 13,
    fontWeight: '500',
    color: '#757575',
  },
  tripRight: {
    alignItems: 'flex-end',
  },
  tripAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 4,
  },
  tripChevron: {
    marginLeft: 8,
  },
  tripCash: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tripCashText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#757575',
  },

  // Load More Button
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginRight: 8,
  },

  // Empty State
  emptyTrips: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyTripsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#757575',
    marginTop: 16,
  },
  emptyTripsSub: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9E9E9E',
    marginTop: 4,
  },

  // Payout History Row - Secondary Action
  payoutHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  payoutHistoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payoutHistoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
  },

  // Revenue Model Banner
  revenueModelBanner: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  revenueModelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  revenueModelItem: {
    alignItems: 'center',
    flex: 1,
  },
  revenueModelValue: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primary,
    marginBottom: 4,
  },
  revenueModelLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#616161',
    textAlign: 'center',
  },
  revenueModelPlus: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    marginHorizontal: 8,
  },
  revenueModelEquals: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    marginHorizontal: 8,
  },
  revenueModelSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
  },
  revenueModelIcon: {
    marginBottom: 4,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },

  // Payout Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  payoutModal: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  payoutTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212121',
  },
  payoutContent: {
    padding: 24,
  },
  balanceCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#616161',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.primary,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  currencyLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#757575',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    paddingVertical: 16,
  },
  inputHint: {
    fontSize: 12,
    fontWeight: '500',
    color: '#757575',
    marginTop: 8,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickAmountBtn: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  payoutInfo: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  payoutInfoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#757575',
    lineHeight: 18,
  },
  payoutActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  payoutBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payoutBtnSecondary: {
    backgroundColor: '#F5F5F5',
  },
  payoutBtnSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#757575',
  },
  payoutBtnPrimary: {
    backgroundColor: Colors.primary,
  },
  payoutBtnPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
