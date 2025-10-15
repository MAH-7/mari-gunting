import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, StatusBar, Dimensions, Animated, Easing, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { useStore } from '@/store/useStore';
import { mockBookings } from '@/services/mockData';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { verificationService, VerificationInfo } from '@mari-gunting/shared/services/verificationService';
import { supabase } from '@mari-gunting/shared/config/supabase';
import VerificationProgressWidget from '@/components/VerificationProgressWidget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { locationTrackingService } from '@/services/locationTrackingService';

// Responsive helper
const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

// Format currency helper
const formatCurrency = (amount: number): string => {
  return amount.toFixed(2);
};

// Verification Banner Component
const VerificationBanner = ({ verificationInfo }: { verificationInfo: VerificationInfo }) => {
  const getBannerConfig = () => {
    switch (verificationInfo.status) {
      case 'pending':
        return {
          bgColor: '#FFF3CD',
          borderColor: '#FFB800',
          icon: 'time-outline' as const,
          iconColor: '#FFB800',
          title: 'Verification Pending',
          subtitle: verificationInfo.message,
        };
      case 'rejected':
        return {
          bgColor: '#FFE8E8',
          borderColor: '#FF3B30',
          icon: 'close-circle-outline' as const,
          iconColor: '#FF3B30',
          title: 'Verification Failed',
          subtitle: verificationInfo.message,
        };
      case 'unverified':
      default:
        return {
          bgColor: '#E8F4FF',
          borderColor: '#3B82F6',
          icon: 'alert-circle-outline' as const,
          iconColor: '#3B82F6',
          title: 'Complete Your Profile',
          subtitle: verificationInfo.message,
        };
    }
  };

  const config = getBannerConfig();

  return (
    <View style={styles.verificationBannerContainer}>
      <View style={[styles.verificationBanner, { backgroundColor: config.bgColor, borderColor: config.borderColor }]}>
        <View style={[styles.verificationIcon, { backgroundColor: config.iconColor + '20' }]}>
          <Ionicons name={config.icon} size={24} color={config.iconColor} />
        </View>
        <View style={styles.verificationContent}>
          <Text style={styles.verificationTitle}>{config.title}</Text>
          <Text style={styles.verificationSubtitle}>{config.subtitle}</Text>
          {!verificationInfo.canAcceptBookings && (
            <Text style={styles.verificationWarning}>⚠️ You cannot accept bookings yet</Text>
          )}
        </View>
      </View>
    </View>
  );
};

// Animated Toast
const Toast = ({ message, type = 'success', visible, onHide }: { message: string; type?: 'success' | 'error'; visible: boolean; onHide: () => void }) => {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.spring(translateY, { toValue: 0, friction: 8, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(translateY, { toValue: -100, duration: 200, useNativeDriver: true }),
      ]).start(() => onHide());
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toast, { backgroundColor: type === 'success' ? COLORS.primary : COLORS.error, transform: [{ translateY }] }]}>
      <Ionicons name={type === 'success' ? 'checkmark-circle' : 'close-circle'} size={22} color="#FFF" />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

export default function PartnerDashboardScreen() {
  const currentUser = useStore((state) => state.currentUser);
  const [isOnline, setIsOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyGoal] = useState(200);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({ message: '', type: 'success', visible: false });
  const [acceptingJob, setAcceptingJob] = useState<string | null>(null);
  const [verificationInfo, setVerificationInfo] = useState<VerificationInfo | null>(null);
  const [loadingVerification, setLoadingVerification] = useState(true);
  const [accountType, setAccountType] = useState<'freelance' | 'barbershop'>('freelance');

  // Animation
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    // Load account type
    const loadAccountType = async () => {
      try {
        const type = await AsyncStorage.getItem('partnerAccountType');
        if (type === 'freelance' || type === 'barbershop') {
          setAccountType(type);
        }
      } catch (error) {
        console.error('Error loading account type:', error);
      }
    };

    loadAccountType();
    // Load verification status
    loadVerificationStatus();
    // Load initial online status
    loadOnlineStatus();
  }, []);

  const loadVerificationStatus = async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoadingVerification(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const info = await verificationService.getVerificationStatus(user.id);
      setVerificationInfo(info);
    } catch (error) {
      console.error('Failed to load verification status:', error);
    } finally {
      setLoadingVerification(false);
    }
  };

  const loadOnlineStatus = async () => {
    if (!currentUser?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_online')
        .eq('id', currentUser.id)
        .single();
      
      if (error) {
        console.error('Error loading online status:', error);
        return;
      }
      
      if (data) {
        setIsOnline(data.is_online || false);
      }
    } catch (error) {
      console.error('Failed to load online status:', error);
    }
  };

  const stats = useMemo(() => {
    if (!currentUser)
      return {
        todayEarnings: 0,
        weekEarnings: 0,
        completedToday: 0,
        pendingCount: 0,
        activeCount: 0,
        goalProgress: 0,
        avgRating: 0,
        acceptance: 95,
      };

    const today = new Date().toISOString().split('T')[0];
    const partnerBookings = mockBookings.filter((b) => b.barberId === currentUser.id);

    const todayBookings = partnerBookings.filter((b) => b.scheduledDate === today);
    const completed = todayBookings.filter((b) => b.status === 'completed');
    const todayEarnings = completed.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const weekEarnings = todayEarnings * 3.5; // Mock week earnings

    const activeCount = partnerBookings.filter((b) => ['accepted', 'on-the-way', 'in-progress'].includes(b.status)).length;
    const pendingCount = partnerBookings.filter((b) => b.status === 'pending').length;

    return {
      todayEarnings,
      weekEarnings,
      completedToday: completed.length,
      pendingCount,
      activeCount,
      goalProgress: Math.min((todayEarnings / dailyGoal) * 100, 100),
      avgRating: ('rating' in currentUser ? currentUser.rating : 4.8),
      acceptance: 95,
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

  // Memoize completed today list
  const completedToday = useMemo(() => {
    if (!currentUser) return [];
    return mockBookings
      .filter((b) => b.barberId === currentUser.id && b.status === 'completed')
      .slice(0, 3);
  }, [currentUser]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadVerificationStatus(),
      new Promise((resolve) => setTimeout(resolve, 1000)),
    ]);
    setRefreshing(false);
  };

  const handleAcceptJob = useCallback(async (jobId: string) => {
    setAcceptingJob(jobId);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      setAcceptingJob(null);
      setToast({ message: 'Booking accepted!', type: 'success', visible: true });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 600);
  }, []);

  const handleRejectJob = useCallback(async (jobId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setToast({ message: 'Booking declined', type: 'error', visible: true });
  }, []);

  const toggleOnlineStatus = useCallback(async () => {
    if (!currentUser?.id) return;
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    const newStatus = !isOnline;
    
    try {
      // Update local state immediately for better UX
      setIsOnline(newStatus);
      
      // Start/stop location tracking for freelance barbers
      if (accountType === 'freelance') {
        if (newStatus) {
          // Going online - start tracking
          try {
            await locationTrackingService.startTracking(currentUser.id);
            console.log('✅ Location tracking started');
          } catch (locationError) {
            console.error('❌ Failed to start location tracking:', locationError);
            // Don't block the online toggle if location fails
          }
        } else {
          // Going offline - stop tracking
          locationTrackingService.stopTracking();
          console.log('🛑 Location tracking stopped');
        }
      }
      
      // Use server-side function to update status with server time
      const { data, error } = await supabase.rpc('toggle_online_status', {
        p_user_id: currentUser.id,
        new_status: newStatus,
        account_type: accountType,
      });
      
      if (error) {
        console.error('Error toggling online status:', error);
        // Revert on error
        setIsOnline(!newStatus);
        // Stop tracking if we failed to go online
        if (newStatus && accountType === 'freelance') {
          locationTrackingService.stopTracking();
        }
        setToast({ message: 'Failed to update status', type: 'error', visible: true });
        return;
      }
      
      // Check result from server function
      if (data && data.length > 0) {
        const result = data[0];
        
        if (!result.success) {
          console.error('Server rejected status update:', result.message);
          setIsOnline(!newStatus);
          // Stop tracking if we failed to go online
          if (newStatus && accountType === 'freelance') {
            locationTrackingService.stopTracking();
          }
          setToast({ message: result.message || 'Failed to update status', type: 'error', visible: true });
          return;
        }
        
        // Success!
        setToast({ 
          message: result.message, 
          type: newStatus ? 'success' : 'error', 
          visible: true 
        });
      }
    } catch (error) {
      console.error('Exception toggling online status:', error);
      // Revert on error
      setIsOnline(!newStatus);
      // Stop tracking if we failed to go online
      if (newStatus && accountType === 'freelance') {
        locationTrackingService.stopTracking();
      }
      setToast({ message: 'Failed to update status', type: 'error', visible: true });
    }
  }, [currentUser, isOnline, accountType]);

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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={() => setToast({ ...toast, visible: false })} />
      
      {/* Green Header */}
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>Hi, {currentUser.name?.split(' ')[0] || 'Partner'}!</Text>
                <View style={styles.statusBadge}>
                  <View style={[styles.statusDot, { backgroundColor: isOnline ? '#FFF' : '#FFD700' }]} />
                  <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.notifIcon}
                onPress={() => router.push('/(tabs)/jobs')}
                accessibilityLabel="Notifications"
              >
                <Ionicons name="notifications" size={24} color="#FFF" />
                {stats.pendingCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{stats.pendingCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Earnings Card in Header */}
            <TouchableOpacity
              style={styles.earningsCard}
              activeOpacity={0.9}
              onPress={() => router.push('/(tabs)/earnings')}
            >
              <View style={styles.earningsLeft}>
                <Text style={styles.earningsLabel}>TODAY'S EARNINGS</Text>
                <Text style={styles.earningsValue}>RM {formatCurrency(stats.todayEarnings)}</Text>
                <Text style={styles.earningsSubtext}>{stats.completedToday} trips completed</Text>
              </View>
              <View style={styles.earningsRight}>
                <View style={styles.earningsIcon}>
                  <Ionicons name="wallet" size={28} color={COLORS.primary} />
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(0,0,0,0.3)" style={{ marginTop: 4 }} />
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Verification Progress Widget */}
        <VerificationProgressWidget />
        
        {/* Verification Status Banner (Old - can be removed later) */}
        {!loadingVerification && verificationInfo && verificationInfo.status !== 'verified' && verificationInfo.status !== 'pending' && (
          <VerificationBanner verificationInfo={verificationInfo} />
        )}

        {/* Online/Offline Toggle - Prominent */}
        <Animated.View style={[styles.toggleSection, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={[styles.toggleButton, isOnline ? styles.toggleOnline : styles.toggleOffline]}
            onPress={toggleOnlineStatus}
            activeOpacity={0.8}
          >
            <View style={styles.toggleContent}>
              <View style={styles.toggleLeft}>
                <View style={[styles.toggleDot, { backgroundColor: isOnline ? '#FFF' : '#999' }]} />
                <Text style={[styles.toggleText, { color: isOnline ? '#FFF' : '#666' }]}>
                  {isOnline ? "You're Online" : "You're Offline"}
                </Text>
              </View>
              <View style={[styles.toggleSwitch, isOnline && styles.toggleSwitchActive]}>
                <View style={[styles.toggleThumb, isOnline && styles.toggleThumbActive]} />
              </View>
            </View>
            <Text style={[styles.toggleSubtext, { color: isOnline ? 'rgba(255,255,255,0.8)' : '#999' }]}>
              {isOnline ? 'Tap to go offline and stop receiving orders' : 'Tap to go online and start receiving orders'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              icon="trending-up"
              label="Week Earnings"
              value={`RM ${formatCurrency(stats.weekEarnings)}`}
              color={COLORS.primary}
              onPress={() => router.push('/(tabs)/earnings')}
            />
            <StatCard
              icon="star"
              label="Rating"
              value={stats.avgRating.toFixed(1)}
              color="#FFB800"
              onPress={() => router.push('/(tabs)/profile')}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              icon="checkmark-done"
              label="Acceptance"
              value={`${stats.acceptance}%`}
              color="#00C48C"
            />
            <StatCard
              icon="car"
              label="Active Orders"
              value={String(stats.activeCount)}
              color="#FF6B6B"
              onPress={() => router.push('/(tabs)/jobs')}
            />
          </View>
        </View>

        {/* New Orders */}
        {pendingRequests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>New Orders ({pendingRequests.length})</Text>
              <Text style={styles.sectionSubtitle}>Accept or decline</Text>
            </View>

            {pendingRequests.map((job, idx) => (
              <Animated.View
                key={job.id}
                style={[
                  styles.orderCard,
                  {
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.orderHeader}>
                  <View style={styles.orderInfo}>
                    <View style={styles.orderAvatar}>
                      <Ionicons name="person" size={24} color={COLORS.primary} />
                    </View>
                    <View style={styles.orderDetails}>
                      <Text style={styles.orderName}>{job.customer?.name}</Text>
                      <View style={styles.orderMeta}>
                        <Ionicons name="location" size={14} color="#999" />
                        <Text style={styles.orderMetaText}>{job.distance} km away</Text>
                        <Text style={styles.orderDot}>•</Text>
                        <Text style={styles.orderMetaText}>{job.scheduledTime}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.orderPrice}>
                    <Text style={styles.orderPriceText}>RM {job.totalPrice}</Text>
                  </View>
                </View>

                <View style={styles.orderActions}>
                  <TouchableOpacity
                    style={styles.declineBtn}
                    onPress={() => handleRejectJob(job.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.declineBtnText}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.acceptButton, acceptingJob === job.id && styles.acceptButtonLoading]}
                    onPress={() => handleAcceptJob(job.id)}
                    disabled={acceptingJob === job.id}
                    activeOpacity={0.8}
                  >
                    {acceptingJob === job.id ? (
                      <Text style={styles.acceptButtonText}>Accepting...</Text>
                    ) : (
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </Animated.View>
            ))}
          </View>
        )}

        {/* Active Order */}
        {nextJob && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Order</Text>
              <Text style={styles.sectionSubtitle}>On the way</Text>
            </View>
            <TouchableOpacity style={styles.activeCard} activeOpacity={0.9}>
              <View style={styles.activeLeft}>
                <View style={styles.activePulse}>
                  <View style={styles.activeIcon}>
                    <Ionicons name="navigate" size={20} color="#FFF" />
                  </View>
                </View>
                <View>
                  <Text style={styles.activeName}>{nextJob.customer?.name}</Text>
                  <View style={styles.activeMeta}>
                    <Ionicons name="location" size={12} color="#999" />
                    <Text style={styles.activeMetaText}>{nextJob.distance} km • {nextJob.scheduledTime}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.navigateBtn}>
                <Text style={styles.navigateBtnText}>Navigate</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {accountType === 'barbershop' && (
              <ActionCard icon="calendar" label="Schedule" color="#3B82F6" onPress={() => router.push('/(tabs)/schedule')} />
            )}
            <ActionCard icon="briefcase" label="My Orders" color="#8B5CF6" onPress={() => router.push('/(tabs)/jobs')} />
            <ActionCard icon="person" label="Profile" color="#F59E0B" onPress={() => router.push('/(tabs)/profile')} />
            <ActionCard icon="help-circle" label="Help" color="#EF4444" onPress={() => {}} />
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

// Stat Card Component
function StatCard({ icon, label, value, color, onPress }: { icon: string; label: string; value: string; color: string; onPress?: () => void }) {
  return (
    <TouchableOpacity
      style={styles.statCard}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </TouchableOpacity>
  );
}

// Action Card Component
function ActionCard({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.actionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={24} color="#FFF" />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function KPI({ icon, color, label, value, accessibilityLabel }: { icon: keyof typeof Ionicons.glyphMap; color: string; label: string; value: string; accessibilityLabel?: string }) {
  return (
    <View style={styles.kpiCard} accessibilityLabel={accessibilityLabel || `${label}: ${value}`} accessibilityRole="text">
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
    <TouchableOpacity
      style={styles.quickAction}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityHint={`Navigate to ${label} screen`}
    >
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
    backgroundColor: '#F5F5F5',
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

  // Green Header (Grab Style)
  header: {
    paddingBottom: 24,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
  },

  // Earnings Card in Header
  earningsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  earningsLeft: {
    flex: 1,
  },
  earningsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  earningsValue: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  earningsSubtext: {
    fontSize: 13,
    color: '#666',
  },
  earningsRight: {
    alignItems: 'center',
    gap: 4,
  },
  earningsIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Online/Offline Toggle (Prominent)
  toggleSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  toggleButton: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  toggleOnline: {
    backgroundColor: COLORS.primary,
  },
  toggleOffline: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  toggleText: {
    fontSize: 18,
    fontWeight: '700',
  },
  toggleSwitch: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFF',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  toggleSubtext: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Stats Grid
  statsGrid: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
  },



  // Section
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#999',
  },

  // Order Card (New)
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  orderInfo: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  orderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderDetails: {
    flex: 1,
  },
  orderName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderMetaText: {
    fontSize: 13,
    color: '#999',
  },
  orderDot: {
    fontSize: 13,
    color: '#999',
    marginHorizontal: 4,
  },
  orderPrice: {
    alignItems: 'flex-end',
  },
  orderPriceText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  orderActions: {
    flexDirection: 'row',
    gap: 12,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  declineBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#666',
  },
  acceptButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  acceptButtonLoading: {
    opacity: 0.7,
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
  },

  // Active Order Card
  activeCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  activeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  activePulse: {
    position: 'relative',
  },
  activeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  activeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeMetaText: {
    fontSize: 13,
    color: '#999',
  },
  navigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  navigateBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Quick Actions Grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  actionCard: {
    width: (width - 52) / 2,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },

  // Verification Banner
  verificationBannerContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  verificationBanner: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 12,
  },
  verificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verificationContent: {
    flex: 1,
  },
  verificationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  verificationSubtitle: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  verificationWarning: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '600',
    marginTop: 6,
  },

  // Toast
  toast: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  toastText: {
    ...TYPOGRAPHY.body.medium,
    color: COLORS.text.inverse,
    fontWeight: '700' as const,
    flex: 1,
  },

  // KPI Styles
  kpiCard: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    minWidth: 100,
  },
  kpiIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '800' as '800',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '500' as '500',
    color: COLORS.text.secondary,
    textAlign: 'center',
  },

  // Quick Action Styles
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 15,
    fontWeight: '600' as '600',
    color: COLORS.text.primary,
    flex: 1,
  },

});
