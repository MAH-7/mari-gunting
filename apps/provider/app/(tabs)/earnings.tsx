import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { useStore } from '@/store/useStore';
import { mockBookings } from '@/services/mockData';
import { Booking } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO } from 'date-fns';

type TimePeriod = 'today' | 'week' | 'month' | 'all';

export default function ProviderEarningsScreen() {
  const currentUser = useStore((state) => state.currentUser);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');

  // Filter completed jobs for this provider
  const completedJobs = useMemo(() => {
    if (!currentUser) return [];
    
    return mockBookings.filter(
      (booking) =>
        booking.barberId === currentUser.id &&
        (booking.status === 'completed' || booking.status === 'cancelled')
    );
  }, [currentUser]);

  // Filter by time period
  const filteredJobs = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return completedJobs.filter((job) => {
      if (!job.completedAt && !job.cancelledAt) return false;
      
      const jobDate = parseISO(job.completedAt || job.cancelledAt || job.createdAt);
      
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
  }, [completedJobs, selectedPeriod]);

  // Calculate earnings statistics
  const stats = useMemo(() => {
    const completedOnly = filteredJobs.filter((j) => j.status === 'completed');
    
    const totalEarnings = completedOnly.reduce(
      (sum, job) => sum + (job.totalPrice || 0),
      0
    );
    
    const totalJobs = completedOnly.length;
    const cancelledJobs = filteredJobs.filter((j) => j.status === 'cancelled').length;
    const averageJobValue = totalJobs > 0 ? totalEarnings / totalJobs : 0;
    
    // Calculate breakdown
    const serviceEarnings = completedOnly.reduce(
      (sum, job) => {
        const servicePrice = (job.services || []).reduce((s, service) => s + service.price, 0);
        return sum + servicePrice;
      },
      0
    );
    
    const travelEarnings = completedOnly.reduce(
      (sum, job) => sum + (job.travelCost || 0),
      0
    );
    
    // Calculate commission (12% of service price)
    const platformCommission = serviceEarnings * 0.12;
    const netServiceEarnings = serviceEarnings * 0.88;
    const netEarnings = netServiceEarnings + travelEarnings;
    
    return {
      totalEarnings,
      totalJobs,
      cancelledJobs,
      averageJobValue,
      serviceEarnings,
      travelEarnings,
      platformCommission,
      netEarnings,
    };
  }, [filteredJobs]);

  const renderStatCard = (label: string, value: string, icon: keyof typeof Ionicons.glyphMap, color: string) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );

  const renderTimePeriodButton = (period: TimePeriod, label: string) => (
    <TouchableOpacity
      style={[
        styles.periodButton,
        selectedPeriod === period && styles.periodButtonActive,
      ]}
      onPress={() => setSelectedPeriod(period)}
    >
      <Text
        style={[
          styles.periodButtonText,
          selectedPeriod === period && styles.periodButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderJobItem = (job: Booking) => {
    const isCompleted = job.status === 'completed';
    const date = job.completedAt || job.cancelledAt || job.createdAt;
    const formattedDate = format(parseISO(date), 'MMM dd, yyyy');
    const formattedTime = job.scheduledTime || '';
    
    return (
      <View key={job.id} style={styles.jobCard}>
        <View style={styles.jobHeader}>
          <View style={styles.jobInfo}>
            <Text style={styles.jobCustomer}>{job.customer?.name || job.customerName}</Text>
            <Text style={styles.jobDate}>
              {formattedDate} {formattedTime && `at ${formattedTime}`}
            </Text>
          </View>
          <View style={[styles.statusBadge, isCompleted ? styles.statusCompleted : styles.statusCancelled]}>
            <Text style={[styles.statusText, isCompleted ? styles.statusTextCompleted : styles.statusTextCancelled]}>
              {job.status}
            </Text>
          </View>
        </View>
        
        <View style={styles.jobServices}>
          {(job.services || []).map((service, idx) => (
            <Text key={idx} style={styles.serviceItem}>
              • {service.name} - RM {service.price}
            </Text>
          ))}
        </View>
        
        {isCompleted && (
          <View style={styles.jobEarnings}>
            <View style={styles.earningRow}>
              <Text style={styles.earningLabel}>Service Total:</Text>
              <Text style={styles.earningValue}>
                RM {(job.services || []).reduce((sum, s) => sum + s.price, 0).toFixed(2)}
              </Text>
            </View>
            {job.travelCost ? (
              <View style={styles.earningRow}>
                <Text style={styles.earningLabel}>Travel:</Text>
                <Text style={styles.earningValue}>+ RM {job.travelCost.toFixed(2)}</Text>
              </View>
            ) : null}
            <View style={[styles.earningRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Earned:</Text>
              <Text style={styles.totalValue}>RM {(job.totalPrice || 0).toFixed(2)}</Text>
            </View>
          </View>
        )}
        
        {job.payment && (
          <View style={styles.paymentInfo}>
            <Ionicons 
              name={job.payment.method === 'cash' ? 'cash-outline' : 'card-outline'} 
              size={14} 
              color={COLORS.text.tertiary} 
            />
            <Text style={styles.paymentText}>
              {job.payment.method.charAt(0).toUpperCase() + job.payment.method.slice(1)} • {job.payment.status}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Please log in to view earnings</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Earnings & History</Text>
          <Text style={styles.subtitle}>Track your income and completed jobs</Text>
        </View>

        {/* Time Period Filter */}
        <View style={styles.periodContainer}>
          {renderTimePeriodButton('today', 'Today')}
          {renderTimePeriodButton('week', 'Week')}
          {renderTimePeriodButton('month', 'Month')}
          {renderTimePeriodButton('all', 'All Time')}
        </View>

        {/* Summary Stats */}
        <View style={styles.statsContainer}>
          {renderStatCard(
            'Total Earnings',
            `RM ${stats.totalEarnings.toFixed(2)}`,
            'cash',
            COLORS.success
          )}
          {renderStatCard(
            'Completed Jobs',
            stats.totalJobs.toString(),
            'checkmark-circle',
            COLORS.primary
          )}
          {renderStatCard(
            'Average per Job',
            `RM ${stats.averageJobValue.toFixed(2)}`,
            'trending-up',
            COLORS.warning
          )}
          {renderStatCard(
            'Cancelled Jobs',
            stats.cancelledJobs.toString(),
            'close-circle',
            COLORS.error
          )}
        </View>

        {/* Earnings Breakdown */}
        <View style={styles.breakdownContainer}>
          <Text style={styles.sectionTitle}>Earnings Breakdown</Text>
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Service Earnings (Gross):</Text>
              <Text style={styles.breakdownValue}>RM {stats.serviceEarnings.toFixed(2)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Platform Commission (12%):</Text>
              <Text style={[styles.breakdownValue, { color: COLORS.error }]}>
                - RM {stats.platformCommission.toFixed(2)}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Service Earnings (Net 88%):</Text>
              <Text style={styles.breakdownValue}>RM {stats.netServiceEarnings.toFixed(2)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Travel Earnings (100%):</Text>
              <Text style={styles.breakdownValue}>RM {stats.travelEarnings.toFixed(2)}</Text>
            </View>
            <View style={[styles.breakdownRow, styles.breakdownTotal]}>
              <Text style={styles.breakdownTotalLabel}>Net Total:</Text>
              <Text style={styles.breakdownTotalValue}>RM {stats.netEarnings.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Job History */}
        <View style={styles.historyContainer}>
          <Text style={styles.sectionTitle}>
            Job History ({filteredJobs.length})
          </Text>
          
          {filteredJobs.length > 0 ? (
            filteredJobs.map(renderJobItem)
          ) : (
            <View style={styles.emptyHistory}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.text.tertiary} />
              <Text style={styles.emptyHistoryText}>No jobs in this period</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    ...TYPOGRAPHY.heading.h1,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.secondary,
  },
  periodContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.background.primary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  periodButtonText: {
    ...TYPOGRAPHY.button,
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  periodButtonTextActive: {
    color: COLORS.text.inverse,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderLeftWidth: 4,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  statValue: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
  },
  breakdownContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  breakdownCard: {
    backgroundColor: COLORS.background.primary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  breakdownLabel: {
    ...TYPOGRAPHY.body.medium,
    color: COLORS.text.secondary,
  },
  breakdownValue: {
    ...TYPOGRAPHY.body.medium,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  breakdownTotal: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    marginTop: 8,
    paddingTop: 16,
  },
  breakdownTotalLabel: {
    ...TYPOGRAPHY.heading.h4,
    color: COLORS.text.primary,
  },
  breakdownTotalValue: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.success,
  },
  historyContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  jobCard: {
    backgroundColor: COLORS.background.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobInfo: {
    flex: 1,
  },
  jobCustomer: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  jobDate: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: COLORS.success + '20',
  },
  statusCancelled: {
    backgroundColor: COLORS.error + '20',
  },
  statusText: {
    ...TYPOGRAPHY.body.small,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusTextCompleted: {
    color: COLORS.success,
  },
  statusTextCancelled: {
    color: COLORS.error,
  },
  jobServices: {
    marginBottom: 12,
  },
  serviceItem: {
    ...TYPOGRAPHY.body.medium,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  jobEarnings: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    paddingTop: 12,
    marginBottom: 8,
  },
  earningRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  earningLabel: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
  },
  earningValue: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  totalLabel: {
    ...TYPOGRAPHY.body.medium,
    color: COLORS.text.primary,
    fontWeight: '700',
  },
  totalValue: {
    ...TYPOGRAPHY.heading.h4,
    color: COLORS.success,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.tertiary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  emptyHistory: {
    padding: 40,
    alignItems: 'center',
  },
  emptyHistoryText: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.tertiary,
    marginTop: 12,
  },
});
