import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useMemo } from 'react';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { useStore } from '@/store/useStore';
import { mockBookings } from '@/services/mockData';
import { getStatusColor, getStatusBackground } from '@/shared/constants/colors';

export default function ProviderDashboardScreen() {
  const currentUser = useStore((state) => state.currentUser);
  const [isOnline, setIsOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Debug: Log current user
  console.log('Provider Dashboard - Current User:', currentUser);

  // Calculate stats from mock bookings (filter by current provider)
  const stats = useMemo(() => {
    if (!currentUser) {
      console.log('No current user found in dashboard');
      return { todayEarnings: 0, activeJobs: 0, completedToday: 0 };
    }

    const today = new Date().toISOString().split('T')[0];
    const providerBookings = mockBookings.filter(b => b.barberId === currentUser.id);
    
    const todayBookings = providerBookings.filter(b => b.scheduledDate === today);
    const completedToday = todayBookings.filter(b => b.status === 'completed');
    const todayEarnings = completedToday.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const activeJobs = providerBookings.filter(b => 
      ['pending', 'accepted', 'on-the-way', 'in-progress'].includes(b.status)
    ).length;

    return {
      todayEarnings,
      activeJobs,
      completedToday: completedToday.length,
    };
  }, [currentUser]);

  // Get recent jobs (last 5)
  const recentJobs = useMemo(() => {
    if (!currentUser) return [];
    return mockBookings
      .filter(b => b.barberId === currentUser.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [currentUser]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {currentUser.name?.split(' ')[0]} 👋</Text>
            <Text style={styles.subtitle}>Welcome back to your dashboard</Text>
          </View>
        </View>

        {/* Availability Toggle */}
        <View style={styles.availabilityCard}>
          <View style={styles.availabilityLeft}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.success : COLORS.text.tertiary }]} />
            <View>
              <Text style={styles.availabilityTitle}>You are {isOnline ? 'Online' : 'Offline'}</Text>
              <Text style={styles.availabilitySubtitle}>
                {isOnline ? 'Accepting new bookings' : 'Not accepting bookings'}
              </Text>
            </View>
          </View>
          <Switch
            value={isOnline}
            onValueChange={setIsOnline}
            trackColor={{ false: COLORS.border.medium, true: COLORS.primaryLight }}
            thumbColor={isOnline ? COLORS.primary : COLORS.background.primary}
            ios_backgroundColor={COLORS.border.medium}
          />
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="cash" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.statValue}>RM {stats.todayEarnings}</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="briefcase" size={24} color={COLORS.info} />
            </View>
            <Text style={styles.statValue}>{stats.activeJobs}</Text>
            <Text style={styles.statLabel}>Active Jobs</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            </View>
            <Text style={styles.statValue}>{stats.completedToday}</Text>
            <Text style={styles.statLabel}>Completed Today</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              activeOpacity={0.7}
              onPress={() => router.push('/provider/(tabs)/jobs')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="briefcase-outline" size={24} color={COLORS.info} />
              </View>
              <Text style={styles.actionLabel}>View Jobs</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              activeOpacity={0.7}
              onPress={() => router.push('/provider/(tabs)/schedule')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="calendar-outline" size={24} color="#8B5CF6" />
              </View>
              <Text style={styles.actionLabel}>Schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              activeOpacity={0.7}
              onPress={() => router.push('/provider/(tabs)/earnings')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: COLORS.primaryLight }]}>
                <Ionicons name="wallet-outline" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.actionLabel}>Earnings</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              activeOpacity={0.7}
              onPress={() => router.push('/provider/(tabs)/customers')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="people-outline" size={24} color={COLORS.warning} />
              </View>
              <Text style={styles.actionLabel}>Customers</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/provider/(tabs)/jobs')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentJobs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.text.tertiary} />
              <Text style={styles.emptyStateTitle}>No Recent Jobs</Text>
              <Text style={styles.emptyStateText}>Your recent bookings will appear here</Text>
            </View>
          ) : (
            <View style={styles.jobsList}>
              {recentJobs.map((job, index) => (
                <TouchableOpacity
                  key={job.id}
                  style={[
                    styles.jobCard,
                    index !== recentJobs.length - 1 && styles.jobCardBorder
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.jobCardLeft}>
                    <View style={[styles.jobIconContainer, { backgroundColor: getStatusBackground(job.status) }]}>
                      <Ionicons 
                        name={job.status === 'completed' ? 'checkmark-circle' : 'time'} 
                        size={20} 
                        color={getStatusColor(job.status)} 
                      />
                    </View>
                    <View style={styles.jobInfo}>
                      <Text style={styles.jobCustomer}>{job.customer?.name || 'Customer'}</Text>
                      <Text style={styles.jobService}>
                        {job.services?.map(s => s.name).join(', ') || 'Service'}
                      </Text>
                      <Text style={styles.jobTime}>
                        {job.scheduledDate} • {job.scheduledTime}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.jobCardRight}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusBackground(job.status) }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(job.status) }]}>
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1).replace('-', ' ')}
                      </Text>
                    </View>
                    <Text style={styles.jobPrice}>RM {job.totalPrice}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    ...TYPOGRAPHY.heading.h2,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
  },
  availabilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background.primary,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  availabilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  availabilityTitle: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  availabilitySubtitle: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
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
    color: COLORS.text.primary,
  },
  seeAllText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.primary,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: '48%',
    backgroundColor: COLORS.background.primary,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    ...TYPOGRAPHY.body.regular,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  jobsList: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  jobCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  jobCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.tertiary,
  },
  jobCardLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  jobIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  jobInfo: {
    flex: 1,
  },
  jobCustomer: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  jobService: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  jobTime: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.tertiary,
  },
  jobCardRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  jobPrice: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  emptyState: {
    backgroundColor: COLORS.background.primary,
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyStateTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});
