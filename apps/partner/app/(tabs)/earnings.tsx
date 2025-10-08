import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { useStore } from '@/store/useStore';
import { mockBookings } from '@/services/mockData';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { Booking } from '@/types';

const { width } = Dimensions.get('window');

type TimePeriod = 'today' | 'week' | 'month' | 'all';

export default function GrabEarningsScreen() {
  const currentUser = useStore((state) => state.currentUser);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('today');
  const [refreshing, setRefreshing] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showTripDetails, setShowTripDetails] = useState<string | null>(null);

  // Get completed bookings
  const completedBookings = useMemo(() => {
    if (!currentUser) return [];
    return mockBookings.filter(
      (b) => b.barberId === currentUser.id && b.status === 'completed'
    );
  }, [currentUser]);

  // Filter by period
  const filteredBookings = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return completedBookings.filter((booking) => {
      if (!booking.completedAt && !booking.createdAt) return false;
      const jobDate = parseISO(booking.completedAt || booking.createdAt);

      switch (selectedPeriod) {
        case 'today':
          return jobDate >= today;
        case 'week':
          return jobDate >= startOfWeek(now) && jobDate <= endOfWeek(now);
        case 'month':
          return jobDate >= startOfMonth(now) && jobDate <= endOfMonth(now);
        case 'all':
        default:
          return true;
      }
    });
  }, [completedBookings, selectedPeriod]);

  // Calculate stats
  const stats = useMemo(() => {
    const grossEarnings = filteredBookings.reduce((sum, b) => {
      const serviceTotal = (b.services || []).reduce((s, service) => s + service.price, 0);
      return sum + serviceTotal;
    }, 0);

    const travelEarnings = filteredBookings.reduce((sum, b) => sum + (b.travelCost || 0), 0);
    const commission = grossEarnings * 0.12;
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
    await new Promise((resolve) => setTimeout(resolve, 800));
    setRefreshing(false);
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
        }
      >
        {/* Hero Section - Grab Style */}
        <LinearGradient colors={['#00B14F', '#00953F']} style={styles.heroSection}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroLabel}>
              {selectedPeriod === 'today'
                ? "Today's Earnings"
                : selectedPeriod === 'week'
                ? "This Week's Earnings"
                : selectedPeriod === 'month'
                ? "This Month's Earnings"
                : 'Total Earnings'}
            </Text>
            <TouchableOpacity style={styles.infoButton} onPress={() => setShowInfo(true)}>
              <Ionicons name="information-circle-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroAmount}>
            <Text style={styles.currency}>RM</Text>
            <Text style={styles.amount}>{stats.totalNet.toFixed(2)}</Text>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{stats.trips}</Text>
              <Text style={styles.heroStatLabel}>Trips</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>RM {stats.average.toFixed(2)}</Text>
              <Text style={styles.heroStatLabel}>Per Trip</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>RM {stats.commission.toFixed(2)}</Text>
              <Text style={styles.heroStatLabel}>Commission</Text>
            </View>
          </View>
        </LinearGradient>

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

        {/* Earnings Breakdown - Clean Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings Breakdown</Text>

          {/* Revenue Model Banner */}
          <View style={styles.revenueModelBanner}>
            <View style={styles.revenueModelRow}>
              <View style={styles.revenueModelItem}>
                <Text style={styles.revenueModelValue}>88%</Text>
                <Text style={styles.revenueModelLabel}>Service</Text>
              </View>
              <Text style={styles.revenueModelPlus}>+</Text>
              <View style={styles.revenueModelItem}>
                <Text style={styles.revenueModelValue}>100%</Text>
                <Text style={styles.revenueModelLabel}>Travel</Text>
              </View>
              <Text style={styles.revenueModelEquals}>=</Text>
              <View style={styles.revenueModelItem}>
                <Text style={styles.revenueModelValue}>💚</Text>
                <Text style={styles.revenueModelLabel}>Your Pay</Text>
              </View>
            </View>
            <Text style={styles.revenueModelSubtext}>You keep 88% of services + 100% of travel fees</Text>
          </View>

          <View style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <View style={[styles.breakdownIcon, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="cut-outline" size={20} color="#00B14F" />
                </View>
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
                <View style={[styles.breakdownIcon, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="car-outline" size={20} color="#FF9800" />
                </View>
                <View>
                  <Text style={styles.breakdownLabel}>Travel Fees</Text>
                  <Text style={styles.breakdownSub}>100% to you</Text>
                </View>
              </View>
              <Text style={styles.breakdownValue}>RM {stats.travelEarnings.toFixed(2)}</Text>
            </View>

            <View style={styles.breakdownDivider} />

            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <View style={[styles.breakdownIcon, { backgroundColor: '#FFEBEE' }]}>
                  <Ionicons name="business-outline" size={20} color="#F44336" />
                </View>
                <View>
                  <Text style={styles.breakdownLabel}>Commission</Text>
                  <Text style={styles.breakdownSub}>12% of services</Text>
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

        {/* Trip List - Grab Style */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trip History</Text>
            <Text style={styles.sectionCount}>{filteredBookings.length} trips</Text>
          </View>

          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <TripCard 
                key={booking.id} 
                booking={booking} 
                onPress={() => setShowTripDetails(booking.id)}
              />
            ))
          ) : (
            <View style={styles.emptyTrips}>
              <Ionicons name="calendar-outline" size={48} color="#BDBDBD" />
              <Text style={styles.emptyTripsText}>No trips in this period</Text>
              <Text style={styles.emptyTripsSub}>Complete trips to see them here</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionBtn}
              onPress={() => Alert.alert('Payout', 'Payout feature coming soon')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="wallet-outline" size={20} color="#00B14F" />
              </View>
              <Text style={styles.quickActionText}>Request Payout</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionBtn}
              onPress={() => Alert.alert('Export', 'Export feature coming soon')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="download-outline" size={20} color="#00B14F" />
              </View>
              <Text style={styles.quickActionText}>Download Report</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Info Modal */}
      <Modal
        visible={showInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfo(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setShowInfo(false)}
        >
          <View style={styles.infoModal}>
            <View style={styles.infoHeader}>
              <Text style={styles.infoTitle}>How Your Earnings Work</Text>
              <TouchableOpacity onPress={() => setShowInfo(false)}>
                <Ionicons name="close" size={24} color="#212121" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.infoContent} showsVerticalScrollIndicator={false}>
              {/* Key Facts Banner */}
              <View style={styles.keyFactsBanner}>
                <Text style={styles.keyFactsTitle}>🎯 Key Facts</Text>
                <View style={styles.keyFactsGrid}>
                  <View style={styles.keyFactItem}>
                    <Text style={styles.keyFactValue}>88%</Text>
                    <Text style={styles.keyFactLabel}>You Keep</Text>
                  </View>
                  <View style={styles.keyFactDivider} />
                  <View style={styles.keyFactItem}>
                    <Text style={styles.keyFactValue}>12%</Text>
                    <Text style={styles.keyFactLabel}>Commission</Text>
                  </View>
                  <View style={styles.keyFactDivider} />
                  <View style={styles.keyFactItem}>
                    <Text style={styles.keyFactValue}>100%</Text>
                    <Text style={styles.keyFactLabel}>Travel Fees</Text>
                  </View>
                </View>
              </View>

              {/* Detailed Breakdown */}
              <View style={styles.infoItem}>
                <View style={styles.infoIconCircle}>
                  <Ionicons name="cut-outline" size={20} color="#00B14F" />
                </View>
                <View style={styles.infoText}>
                  <Text style={styles.infoItemTitle}>Service Earnings (88%)</Text>
                  <Text style={styles.infoItemDesc}>
                    You keep <Text style={{ fontWeight: '700', color: '#00B14F' }}>88% of service fees</Text>. Platform takes 12% commission to cover operational costs.
                  </Text>
                  <View style={styles.infoHighlight}>
                    <Text style={styles.infoHighlightText}>✓ Much better than salon splits (50-70%)</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.infoItem}>
                <View style={styles.infoIconCircle}>
                  <Ionicons name="car-outline" size={20} color="#FF9800" />
                </View>
                <View style={styles.infoText}>
                  <Text style={styles.infoItemTitle}>Travel Fees (100%)</Text>
                  <Text style={styles.infoItemDesc}>
                    <Text style={{ fontWeight: '700', color: '#FF9800' }}>100% of travel costs</Text> go directly to you. No commission deducted from travel fees!
                  </Text>
                  <View style={styles.infoHighlight}>
                    <Text style={styles.infoHighlightText}>✓ Full reimbursement for your time & fuel</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.infoItem}>
                <View style={styles.infoIconCircle}>
                  <Ionicons name="business-outline" size={20} color="#F44336" />
                </View>
                <View style={styles.infoText}>
                  <Text style={styles.infoItemTitle}>Commission (12%)</Text>
                  <Text style={styles.infoItemDesc}>
                    The 12% commission (deducted from your service earnings) covers:
                  </Text>
                  <View style={styles.featureList}>
                    <Text style={styles.featureItem}>• Payment processing (2.5% fees)</Text>
                    <Text style={styles.featureItem}>• Customer support 24/7</Text>
                    <Text style={styles.featureItem}>• Insurance coverage</Text>
                    <Text style={styles.featureItem}>• Platform maintenance</Text>
                    <Text style={styles.featureItem}>• Marketing & customer acquisition</Text>
                  </View>
                </View>
              </View>

              {/* Platform Fee Details */}
              <View style={styles.platformFeeCard}>
                <View style={styles.platformFeeHeader}>
                  <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
                  <Text style={styles.platformFeeTitle}>RM 2 Platform Fee (Customer Pays)</Text>
                </View>
                <Text style={styles.platformFeeDesc}>
                  Customers pay an additional <Text style={{ fontWeight: '700' }}>RM 2.00 platform fee</Text> per booking. This fee is <Text style={{ fontWeight: '700', color: '#00B14F' }}>NOT deducted from your earnings</Text> - it goes directly to the company for operational costs. This helps keep your commission low at just 12%.
                </Text>
              </View>
              
              {/* Example Calculations */}
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxTitle}>💡 Example Calculation</Text>
                <View style={styles.exampleCalc}>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Service:</Text>
                    <Text style={styles.calcValue}>RM 50.00</Text>
                  </View>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Travel:</Text>
                    <Text style={styles.calcValue}>RM 10.00</Text>
                  </View>
                  <View style={styles.calcDivider} />
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Your Service (88%):</Text>
                    <Text style={[styles.calcValue, { color: '#00B14F' }]}>RM 44.00</Text>
                  </View>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Commission (12%):</Text>
                    <Text style={[styles.calcValue, { color: '#F44336' }]}>- RM 6.00</Text>
                  </View>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>RM 2 Platform Fee:</Text>
                    <Text style={[styles.calcValue, { color: '#3B82F6' }]}>RM 0.00 (customer pays)</Text>
                  </View>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Your Travel (100%):</Text>
                    <Text style={[styles.calcValue, { color: '#00B14F' }]}>RM 10.00</Text>
                  </View>
                  <View style={styles.calcDivider} />
                  <View style={styles.calcRow}>
                    <Text style={styles.calcTotalLabel}>You Earn:</Text>
                    <Text style={styles.calcTotalValue}>RM 54.00</Text>
                  </View>
                </View>
              </View>

              {/* Comparison */}
              <View style={styles.comparisonBox}>
                <Text style={styles.comparisonTitle}>🏆 Better Than Competitors</Text>
                <View style={styles.comparisonRow}>
                  <Text style={styles.comparisonPlatform}>Grab / Foodpanda:</Text>
                  <Text style={styles.comparisonRate}>25-30% commission</Text>
                </View>
                <View style={styles.comparisonRow}>
                  <Text style={[styles.comparisonPlatform, { color: '#00B14F', fontWeight: '700' }]}>Mari-Gunting:</Text>
                  <Text style={[styles.comparisonRate, { color: '#00B14F', fontWeight: '700' }]}>12% commission ✓</Text>
                </View>
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Trip Details Modal */}
      {showTripDetails && (
        <Modal
          visible={!!showTripDetails}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTripDetails(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.tripDetailModal}>
              <View style={styles.tripDetailHeader}>
                <Text style={styles.tripDetailTitle}>Trip Details</Text>
                <TouchableOpacity onPress={() => setShowTripDetails(null)}>
                  <Ionicons name="close" size={24} color="#212121" />
                </TouchableOpacity>
              </View>
              
              {(() => {
                const booking = filteredBookings.find(b => b.id === showTripDetails);
                if (!booking) return null;
                
                const serviceTotal = (booking.services || []).reduce((sum, s) => sum + s.price, 0);
                const commission = serviceTotal * 0.12;
                const netService = serviceTotal - commission;
                const totalEarned = netService + (booking.travelCost || 0);
                
                return (
                  <ScrollView style={styles.tripDetailContent}>
                    <View style={styles.tripDetailSection}>
                      <Text style={styles.tripDetailLabel}>Customer</Text>
                      <Text style={styles.tripDetailValue}>{booking.customer?.name || booking.customerName}</Text>
                    </View>
                    
                    <View style={styles.tripDetailSection}>
                      <Text style={styles.tripDetailLabel}>Date & Time</Text>
                      <Text style={styles.tripDetailValue}>
                        {format(parseISO(booking.completedAt || booking.createdAt), 'MMM dd, yyyy • HH:mm')}
                      </Text>
                    </View>
                    
                    <View style={styles.tripDetailSection}>
                      <Text style={styles.tripDetailLabel}>Location</Text>
                      <Text style={styles.tripDetailValue}>{booking.address?.fullAddress || 'N/A'}</Text>
                    </View>
                    
                    <View style={styles.tripDetailDivider} />
                    
                    <Text style={styles.tripDetailSectionTitle}>Services</Text>
                    {(booking.services || []).map((service, idx) => (
                      <View key={idx} style={styles.tripDetailService}>
                        <Text style={styles.tripDetailServiceName}>{service.name}</Text>
                        <Text style={styles.tripDetailServicePrice}>RM {service.price.toFixed(2)}</Text>
                      </View>
                    ))}
                    
                    <View style={styles.tripDetailDivider} />
                    
                    <View style={styles.tripDetailBreakdown}>
                      <View style={styles.tripDetailRow}>
                        <Text style={styles.tripDetailRowLabel}>Service Total</Text>
                        <Text style={styles.tripDetailRowValue}>RM {serviceTotal.toFixed(2)}</Text>
                      </View>
                      <View style={styles.tripDetailRow}>
                        <Text style={styles.tripDetailRowLabel}>Commission (12%)</Text>
                        <Text style={[styles.tripDetailRowValue, { color: '#F44336' }]}>- RM {commission.toFixed(2)}</Text>
                      </View>
                      <View style={styles.tripDetailRow}>
                        <Text style={styles.tripDetailRowLabel}>Net Service</Text>
                        <Text style={styles.tripDetailRowValue}>RM {netService.toFixed(2)}</Text>
                      </View>
                      <View style={styles.tripDetailRow}>
                        <Text style={styles.tripDetailRowLabel}>Travel Fee</Text>
                        <Text style={styles.tripDetailRowValue}>RM {(booking.travelCost || 0).toFixed(2)}</Text>
                      </View>
                      <View style={[styles.tripDetailRow, styles.tripDetailTotal]}>
                        <Text style={styles.tripDetailTotalLabel}>Total Earned</Text>
                        <Text style={styles.tripDetailTotalValue}>RM {totalEarned.toFixed(2)}</Text>
                      </View>
                    </View>
                  </ScrollView>
                );
              })()}
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

// Trip Card Component
function TripCard({ booking, onPress }: { booking: Booking; onPress?: () => void }) {
  const serviceTotal = (booking.services || []).reduce((sum, s) => sum + s.price, 0);
  const commission = serviceTotal * 0.12;
  const netService = serviceTotal - commission;
  const totalEarned = netService + (booking.travelCost || 0);

  const date = booking.completedAt || booking.createdAt;
  const formattedDate = format(parseISO(date), 'MMM dd');
  const formattedTime = booking.scheduledTime || format(parseISO(date), 'HH:mm');

  return (
    <TouchableOpacity 
      style={styles.tripCard} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.tripHeader}>
        <View style={styles.tripLeft}>
          <View style={styles.tripAvatar}>
            <Text style={styles.tripAvatarText}>
              {(booking.customer?.name || booking.customerName || 'C').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.tripInfo}>
            <Text style={styles.tripCustomer}>{booking.customer?.name || booking.customerName}</Text>
            <Text style={styles.tripTime}>
              {formattedDate} • {formattedTime}
            </Text>
          </View>
        </View>
        <View style={styles.tripEarnings}>
          <Text style={styles.tripAmount}>+RM {totalEarned.toFixed(2)}</Text>
          <View style={styles.tripCash}>
            <Ionicons name="cash-outline" size={12} color="#757575" />
            <Text style={styles.tripCashText}>Cash</Text>
          </View>
        </View>
      </View>

      <View style={styles.tripServices}>
        {(booking.services || []).slice(0, 2).map((service, idx) => (
          <View key={idx} style={styles.tripService}>
            <View style={styles.tripServiceDot} />
            <Text style={styles.tripServiceText}>{service.name}</Text>
          </View>
        ))}
        {(booking.services || []).length > 2 && (
          <Text style={styles.tripServiceMore}>+{(booking.services || []).length - 2} more</Text>
        )}
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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    marginTop: 4,
    marginRight: 4,
  },
  amount: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#00B14F',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
  },
  periodTextActive: {
    color: '#FFFFFF',
  },

  // Section
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
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
    backgroundColor: '#FFFFFF',
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
    color: '#00B14F',
  },

  // Trip Card - Grab Style
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tripAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tripAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00B14F',
  },
  tripInfo: {
    flex: 1,
  },
  tripCustomer: {
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
  tripEarnings: {
    alignItems: 'flex-end',
  },
  tripAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#00B14F',
    marginBottom: 4,
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
  tripServices: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  tripService: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tripServiceDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#BDBDBD',
    marginRight: 8,
  },
  tripServiceText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#616161',
  },
  tripServiceMore: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9E9E9E',
    marginTop: 4,
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

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#212121',
  },

  // Info Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  infoModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
  },
  infoContent: {
    padding: 20,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  infoIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoText: {
    flex: 1,
  },
  infoItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  infoItemDesc: {
    fontSize: 13,
    fontWeight: '500',
    color: '#757575',
    lineHeight: 18,
  },
  infoBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00B14F',
    marginBottom: 8,
  },
  infoBoxText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#212121',
    lineHeight: 20,
  },

  // Trip Detail Modal
  tripDetailModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    maxHeight: '80%',
    marginTop: 'auto',
  },
  tripDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  tripDetailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
  },
  tripDetailContent: {
    padding: 20,
  },
  tripDetailSection: {
    marginBottom: 16,
  },
  tripDetailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9E9E9E',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  tripDetailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
  },
  tripDetailDivider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: 16,
  },
  tripDetailSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 12,
  },
  tripDetailService: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  tripDetailServiceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
  },
  tripDetailServicePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  tripDetailBreakdown: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
  },
  tripDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  tripDetailRowLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#616161',
  },
  tripDetailRowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  tripDetailTotal: {
    borderTopWidth: 2,
    borderTopColor: '#E0E0E0',
    marginTop: 8,
    paddingTop: 12,
  },
  tripDetailTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
  },
  tripDetailTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#00B14F',
  },

  // New Info Modal Styles
  keyFactsBanner: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  keyFactsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00B14F',
    marginBottom: 12,
    textAlign: 'center',
  },
  keyFactsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  keyFactItem: {
    alignItems: 'center',
    flex: 1,
  },
  keyFactValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#00B14F',
    marginBottom: 4,
  },
  keyFactLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#616161',
    textAlign: 'center',
  },
  keyFactDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#BDBDBD',
  },
  infoHighlight: {
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  infoHighlightText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00B14F',
  },
  featureList: {
    marginTop: 8,
  },
  featureItem: {
    fontSize: 13,
    fontWeight: '500',
    color: '#616161',
    lineHeight: 20,
    marginBottom: 4,
  },
  platformFeeCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  platformFeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  platformFeeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212121',
  },
  platformFeeDesc: {
    fontSize: 13,
    fontWeight: '500',
    color: '#616161',
    lineHeight: 18,
  },
  exampleCalc: {
    marginTop: 8,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  calcLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#616161',
  },
  calcValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#212121',
  },
  calcDivider: {
    height: 1,
    backgroundColor: '#BDBDBD',
    marginVertical: 8,
  },
  calcTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#212121',
  },
  calcTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#00B14F',
  },
  comparisonBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  comparisonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 12,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  comparisonPlatform: {
    fontSize: 13,
    fontWeight: '600',
    color: '#616161',
  },
  comparisonRate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#616161',
  },

  // Revenue Model Banner
  revenueModelBanner: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#00B14F',
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
    color: '#00B14F',
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
    color: '#00B14F',
    marginHorizontal: 8,
  },
  revenueModelEquals: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00B14F',
    marginHorizontal: 8,
  },
  revenueModelSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00B14F',
    textAlign: 'center',
  },
});
