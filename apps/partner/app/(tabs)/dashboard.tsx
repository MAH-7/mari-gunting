import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, RefreshControl, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useStore } from '@/store/useStore';
import { mockBookings } from '@/services/mockData';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';

export default function PartnerDashboardScreen() {
  const currentUser = useStore((state) => state.currentUser);
  const [isOnline, setIsOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyGoal] = useState(200);
  const [streak] = useState(5);

  const stats = useMemo(() => {
    if (!currentUser)
      return {
        todayEarnings: 0,
        activeJobs: 0,
        completedToday: 0,
        pendingCount: 0,
        goalProgress: 0,
        avgRating: 0,
      };

    const today = new Date().toISOString().split('T')[0];
    const partnerBookings = mockBookings.filter((b) => b.barberId === currentUser.id);

    const todayBookings = partnerBookings.filter((b) => b.scheduledDate === today);
    const completed = todayBookings.filter((b) => b.status === 'completed');
    const todayEarnings = completed.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const activeJobs = partnerBookings.filter((b) => ['pending', 'accepted', 'on-the-way', 'in-progress'].includes(b.status)).length;
    const pendingCount = partnerBookings.filter((b) => b.status === 'pending').length;

    return {
      todayEarnings,
      activeJobs,
      completedToday: completed.length,
      pendingCount,
      goalProgress: Math.min((todayEarnings / dailyGoal) * 100, 100),
      avgRating: currentUser.rating || 4.8,
    };
  }, [currentUser, dailyGoal]);

  const nextJob = useMemo(() => {
    if (!currentUser) return null;
    return (
      mockBookings
        .filter((b) => b.barberId === currentUser.id && ['accepted', 'on-the-way'].includes(b.status))
        .sort((a, b) => {
          const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime}`);
          const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime}`);
          return dateA.getTime() - dateB.getTime();
        })[0] || null
    );
  }, [currentUser]);

  const pendingRequests = useMemo(() => {
    if (!currentUser) return [];
    return mockBookings
      .filter((b) => b.barberId === currentUser.id && b.status === 'pending')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2);
  }, [currentUser]);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleAcceptJob = (jobId: string) => {
    Alert.alert('Success', 'Job accepted!');
  };

  const handleRejectJob = (jobId: string) => {
    Alert.alert('Job Rejected', 'The booking has been rejected.');
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hello, {currentUser.name?.split(' ')[0]}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.success : COLORS.error }]} />
              <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
              <Switch
                value={isOnline}
                onValueChange={setIsOnline}
                trackColor={{ false: COLORS.border?.light || '#D1D5DB', true: COLORS.primary + '30' }}
                thumbColor={isOnline ? COLORS.primary : COLORS.text.tertiary}
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
            </View>
          </View>
          <TouchableOpacity style={styles.notifButton} onPress={() => router.push('/(tabs)/jobs')}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.text.primary} />
            {stats.pendingCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{stats.pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Hero - Earnings */}
        <View style={styles.heroSection}>
          <TouchableOpacity activeOpacity={0.95} onPress={() => router.push('/(tabs)/earnings')}>
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark || COLORS.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View>
                  <Text style={styles.heroLabel}>TODAY'S EARNINGS</Text>
                  <Text style={styles.heroValue}>RM {stats.todayEarnings}</Text>
                </View>
                {streak > 0 && (
                  <View style={styles.streakBadge}>
                    <Text style={styles.streakEmoji}>🔥</Text>
                    <Text style={styles.streakText}>{streak}d</Text>
                  </View>
                )}
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${stats.goalProgress}%` }]} />
              </View>
              <View style={styles.heroBottomRow}>
                <Text style={styles.heroSubText}>{stats.goalProgress.toFixed(0)}% • RM {Math.max(dailyGoal - stats.todayEarnings, 0)} to goal</Text>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.9)" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* KPIs */}
          <View style={styles.kpiRow}>
            <KPI icon="time" color={COLORS.warning} label="Active" value={String(stats.activeJobs)} />
            <KPI icon="checkmark-circle" color={COLORS.success} label="Done" value={String(stats.completedToday)} />
            <KPI icon="star" color={COLORS.info} label="Rating" value={stats.avgRating.toFixed(1)} />
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsRow}>
            <QuickAction label={isOnline ? 'Go Offline' : 'Go Online'} icon={isOnline ? 'pause' : 'play'} onPress={() => setIsOnline(!isOnline)} />
            <QuickAction label="Jobs" icon="briefcase" onPress={() => router.push('/(tabs)/jobs')} />
            <QuickAction label="Schedule" icon="calendar" onPress={() => router.push('/(tabs)/schedule')} />
            <QuickAction label="Earnings" icon="cash" onPress={() => router.push('/(tabs)/earnings')} />
          </View>
        </View>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="alert-circle" size={20} color={COLORS.error} />
                <Text style={styles.sectionTitle}>NEW REQUESTS ({pendingRequests.length})</Text>
              </View>
              <View style={styles.sectionPill}>
                <Text style={styles.sectionPillText}>ACTION NEEDED</Text>
              </View>
            </View>

            {pendingRequests.map((job) => (
              <View key={job.id} style={styles.pendingCard}>
                <View style={styles.pendingHeader}>
                  <View style={styles.pendingLeft}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{job.customer?.name?.charAt(0) || 'C'}</Text>
                    </View>
                    <View>
                      <Text style={styles.pendingName}>{job.customer?.name}</Text>
                      <View style={styles.pendingMetaRow}>
                        <Ionicons name="location" size={12} color={COLORS.text.tertiary} />
                        <Text style={styles.pendingMeta}>{job.distance} km</Text>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.pendingMeta}>{job.scheduledTime}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.pendingPrice}>RM {job.totalPrice}</Text>
                </View>

                <View style={styles.pendingActions}>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRejectJob(job.id)}>
                    <Ionicons name="close" size={18} color={COLORS.error} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptJob(job.id)}>
                    <Ionicons name="checkmark" size={18} color={COLORS.background.primary} />
                    <Text style={styles.acceptText}>Accept Job</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Next Job */}
        {nextJob && (
          <View style={styles.section}>
            <Text style={styles.caption}>NEXT JOB</Text>
            <TouchableOpacity style={styles.nextCard} activeOpacity={0.95}>
              <View style={styles.nextLeft}>
                <View style={styles.nextAvatar}>
                  <Text style={styles.nextAvatarText}>{nextJob.customer?.name?.charAt(0) || 'C'}</Text>
                </View>
                <View style={styles.nextInfo}>
                  <Text style={styles.nextName}>{nextJob.customer?.name}</Text>
                  <View style={styles.nextMetaRow}>
                    <Ionicons name="time-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.nextMeta}>{nextJob.scheduledTime}</Text>
                    <Text style={styles.dot}>•</Text>
                    <Ionicons name="location-outline" size={14} color={COLORS.text.tertiary} />
                    <Text style={styles.nextMeta}>{nextJob.distance} km</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.navBtn}>
                <Ionicons name="navigate" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        )}

        {/* Completed Today */}
        {stats.completedToday > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.caption}>COMPLETED TODAY</Text>
              <Text style={styles.earningsPill}>+RM {stats.todayEarnings}</Text>
            </View>

            <View style={{ gap: 8 }}>
              {mockBookings
                .filter((b) => b.barberId === currentUser.id && b.status === 'completed')
                .slice(0, 3)
                .map((job) => (
                  <View key={job.id} style={styles.completedItem}>
                    <View style={styles.completedIcon}>
                      <Ionicons name="checkmark" size={14} color={COLORS.background.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.completedName}>{job.customer?.name}</Text>
                      <Text style={styles.completedTime}>{job.scheduledTime}</Text>
                    </View>
                    <Text style={styles.completedAmount}>+RM {job.totalPrice}</Text>
                  </View>
                ))}
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function KPI({ icon, color, label, value }: { icon: keyof typeof Ionicons.glyphMap; color: string; label: string; value: string }) {
  return (
    <View style={styles.kpiCard}>
      <View style={[styles.kpiIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.quickActionIcon}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <Text style={styles.quickActionText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.secondary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.background.primary,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    ...TYPOGRAPHY.heading.h2,
    color: COLORS.text.primary,
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
    marginRight: 6,
    fontWeight: '600',
  },
  notifButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.background.primary,
    fontWeight: '800',
  },

  // Hero
  heroSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 12,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heroLabel: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1,
    marginBottom: 4,
    fontWeight: '800',
  },
  heroValue: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.background.primary,
    letterSpacing: -1.5,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  streakEmoji: { fontSize: 16 },
  streakText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.background.primary,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.background.primary,
    borderRadius: 2,
  },
  heroBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroSubText: {
    ...TYPOGRAPHY.body.small,
    color: 'rgba(255,255,255,0.9)',
  },

  // KPIs
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  kpiValue: {
    ...TYPOGRAPHY.heading.h4,
    color: COLORS.text.primary,
    fontWeight: '800',
  },
  kpiLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },

  // Quick Actions
  quickActionsRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  quickAction: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  quickActionIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.primary,
    fontWeight: '700',
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sectionPillText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  caption: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginBottom: 10,
    letterSpacing: 0.5,
    fontWeight: '800',
  },

  // Pending Card
  pendingCard: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  pendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  pendingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.background.primary,
    fontWeight: '800',
  },
  pendingName: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.primary,
    fontWeight: '800',
    marginBottom: 2,
  },
  pendingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pendingMeta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  dot: { ...TYPOGRAPHY.caption, color: COLORS.text.tertiary, marginHorizontal: 2 },
  pendingPrice: {
    ...TYPOGRAPHY.heading.h4,
    color: COLORS.primary,
    fontWeight: '900',
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 23,
    gap: 6,
  },
  acceptText: {
    ...TYPOGRAPHY.body.medium,
    color: COLORS.background.primary,
    fontWeight: '800',
  },

  // Next Card
  nextCard: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  nextLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  nextAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextAvatarText: {
    ...TYPOGRAPHY.heading.h4,
    color: COLORS.primary,
    fontWeight: '800',
  },
  nextInfo: { flex: 1 },
  nextName: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.primary,
    fontWeight: '800',
    marginBottom: 2,
  },
  nextMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nextMeta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },

  // Completed item
  completedItem: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  completedIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedName: {
    ...TYPOGRAPHY.body.medium,
    color: COLORS.text.primary,
    fontWeight: '800',
  },
  completedTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  completedAmount: {
    ...TYPOGRAPHY.body.medium,
    color: COLORS.success,
    fontWeight: '900',
  },

  earningsPill: {
    ...TYPOGRAPHY.body.medium,
    color: COLORS.success,
    fontWeight: '900',
  },
});
