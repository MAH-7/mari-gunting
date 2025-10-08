import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { useState } from 'react';

type TimePeriod = 'today' | 'week' | 'month';

export default function ReportsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('week');

  // Mock data
  const analytics = {
    today: {
      revenue: 850,
      appointments: 12,
      average: 70.83,
      growth: 5.2,
    },
    week: {
      revenue: 3500,
      appointments: 45,
      average: 77.78,
      growth: 12.5,
    },
    month: {
      revenue: 15200,
      appointments: 180,
      average: 84.44,
      growth: 18.3,
    },
  };

  const popularServices = [
    { name: 'Haircut', count: 20, revenue: 1000, percentage: 28.6 },
    { name: 'Fade Cut', count: 15, revenue: 900, percentage: 25.7 },
    { name: 'Beard Trim', count: 12, revenue: 600, percentage: 17.1 },
    { name: 'Hair Color', count: 5, revenue: 500, percentage: 14.3 },
    { name: 'Shave', count: 8, revenue: 400, percentage: 11.4 },
  ];

  const staffPerformance = [
    {
      id: '1',
      name: 'Rudi Hartono',
      revenue: 1500,
      appointments: 20,
      rating: 4.8,
      percentage: 42.9,
    },
    {
      id: '2',
      name: 'Andi Wijaya',
      revenue: 1200,
      appointments: 15,
      rating: 4.7,
      percentage: 34.3,
    },
    {
      id: '3',
      name: 'Joko Susanto',
      revenue: 800,
      appointments: 10,
      rating: 4.6,
      percentage: 22.9,
    },
  ];

  const customerInsights = {
    newCustomers: 18,
    returningCustomers: 27,
    totalCustomers: 45,
    returningPercentage: 60,
  };

  const formatCurrency = (amount: number) => {
    return `RM ${amount.toFixed(2)}`;
  };

  const currentData = analytics[selectedPeriod];
  const periodLabel = selectedPeriod === 'today' ? 'Today' : selectedPeriod === 'week' ? 'This Week' : 'This Month';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Reports & Analytics</Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'today' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('today')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'today' && styles.periodTextActive]}>
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'week' && styles.periodTextActive]}>
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'month' && styles.periodTextActive]}>
              This Month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Revenue Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Revenue Summary</Text>
            <View style={[styles.growthBadge, currentData.growth >= 0 ? styles.growthPositive : styles.growthNegative]}>
              <Ionicons 
                name={currentData.growth >= 0 ? 'trending-up' : 'trending-down'} 
                size={16} 
                color={currentData.growth >= 0 ? COLORS.success : COLORS.error}
              />
              <Text style={[styles.growthText, { color: currentData.growth >= 0 ? COLORS.success : COLORS.error }]}>
                {currentData.growth > 0 ? '+' : ''}{currentData.growth}%
              </Text>
            </View>
          </View>

          <Text style={styles.revenueAmount}>{formatCurrency(currentData.revenue)}</Text>
          <Text style={styles.revenueLabel}>{periodLabel}</Text>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{currentData.appointments}</Text>
              <Text style={styles.summaryLabel}>Appointments</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{formatCurrency(currentData.average)}</Text>
              <Text style={styles.summaryLabel}>Avg Transaction</Text>
            </View>
          </View>
        </View>

        {/* Popular Services */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Popular Services</Text>
          {popularServices.map((service, index) => (
            <View key={index} style={styles.serviceRow}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceDetails}>
                  {service.count} bookings • {formatCurrency(service.revenue)}
                </Text>
              </View>
              <View style={styles.servicePercentage}>
                <Text style={styles.percentageText}>{service.percentage}%</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Staff Performance */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Staff Performance</Text>
          {staffPerformance.map((staff) => (
            <View key={staff.id} style={styles.staffRow}>
              <View style={styles.staffAvatar}>
                <Text style={styles.avatarText}>{staff.name.charAt(0)}</Text>
              </View>
              <View style={styles.staffInfo}>
                <View style={styles.staffHeader}>
                  <Text style={styles.staffName}>{staff.name}</Text>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <Text style={styles.ratingText}>{staff.rating}</Text>
                  </View>
                </View>
                <Text style={styles.staffDetails}>
                  {staff.appointments} appointments • {formatCurrency(staff.revenue)}
                </Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${staff.percentage}%` }]} />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Customer Insights */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Customer Insights</Text>
          
          <View style={styles.insightRow}>
            <View style={styles.insightCard}>
              <Ionicons name="person-add" size={24} color={COLORS.primary} />
              <Text style={styles.insightValue}>{customerInsights.newCustomers}</Text>
              <Text style={styles.insightLabel}>New Customers</Text>
            </View>
            <View style={styles.insightCard}>
              <Ionicons name="repeat" size={24} color={COLORS.success} />
              <Text style={styles.insightValue}>{customerInsights.returningCustomers}</Text>
              <Text style={styles.insightLabel}>Returning</Text>
            </View>
          </View>

          <View style={styles.customerSplit}>
            <Text style={styles.splitLabel}>Customer Split</Text>
            <View style={styles.splitBar}>
              <View style={[styles.splitNew, { flex: 100 - customerInsights.returningPercentage }]}>
                <Text style={styles.splitText}>
                  {100 - customerInsights.returningPercentage}%
                </Text>
              </View>
              <View style={[styles.splitReturning, { flex: customerInsights.returningPercentage }]}>
                <Text style={styles.splitText}>{customerInsights.returningPercentage}%</Text>
              </View>
            </View>
            <View style={styles.splitLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
                <Text style={styles.legendText}>New</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
                <Text style={styles.legendText}>Returning</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Export Button */}
        <TouchableOpacity style={styles.exportButton}>
          <Ionicons name="download-outline" size={20} color={COLORS.primary} />
          <Text style={styles.exportText}>Export Report</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.background.primary,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  periodText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
  },
  periodTextActive: {
    color: COLORS.background.primary,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.background.primary,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  growthPositive: {
    backgroundColor: '#E8F5E9',
  },
  growthNegative: {
    backgroundColor: '#FFEBEE',
  },
  growthText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  revenueAmount: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  revenueLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.background.secondary,
  },
  summaryValue: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.secondary,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  serviceDetails: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  servicePercentage: {
    marginLeft: 12,
  },
  percentageText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: '600',
  },
  staffRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.secondary,
  },
  staffAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    ...TYPOGRAPHY.h4,
    color: COLORS.primary,
  },
  staffInfo: {
    flex: 1,
  },
  staffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  staffName: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#FFF9E6',
  },
  ratingText: {
    ...TYPOGRAPHY.caption,
    color: '#F9A825',
    fontWeight: '600',
  },
  staffDetails: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  insightRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  insightCard: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center',
  },
  insightValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
    marginTop: 8,
    marginBottom: 4,
  },
  insightLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  customerSplit: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.background.secondary,
  },
  splitLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  splitBar: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  splitNew: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitReturning: {
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.background.primary,
    fontWeight: '600',
  },
  splitLegend: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: COLORS.background.primary,
    gap: 8,
  },
  exportText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
