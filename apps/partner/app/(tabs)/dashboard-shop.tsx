import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '@mari-gunting/shared/store/useStore';
import VerificationProgressWidget from '@/components/VerificationProgressWidget';

export default function DashboardShopScreen() {
  const router = useRouter();
  const setCurrentUser = useStore((state) => state.setCurrentUser);

  // Mock data
  const shopData = {
    name: "Budi's Barbershop",
    address: "Jalan Sultan Ismail 123, Kuala Lumpur",
    isOpen: true,
    todayAppointments: 12,
    todayRevenue: 850,
    todayCustomers: 10,
    staffCount: 3,
    weeklyRevenue: [120, 150, 180, 200, 190, 220, 185], // Last 7 days (in RM)
  };

  const todaysSchedule = [
    { id: '1', time: '09:00', customer: 'Ahmad Hassan', barber: 'Rudi', service: 'Haircut' },
    { id: '2', time: '10:00', customer: 'Budi Santoso', barber: 'Andi', service: 'Fade Cut' },
    { id: '3', time: '11:00', customer: 'Chandra Lee', barber: 'Rudi', service: 'Beard Trim' },
    { id: '4', time: '14:00', customer: 'Doni Wijaya', barber: 'Joko', service: 'Haircut' },
  ];

  const topBarber = {
    name: 'Rudi Hartono',
    weeklyRevenue: 450,
    appointments: 18,
  };

  const formatCurrency = (amount: number) => {
    return `RM ${amount.toFixed(2)}`;
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear user from store
              setCurrentUser(null);
              
              // Clear AsyncStorage
              await AsyncStorage.multiRemove([
                'partnerAccountType',
                'mari-gunting-storage',
              ]);
              
              // Redirect to login
              router.replace('/login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Welcome Back!</Text>
            <Text style={styles.shopName}>{shopData.name}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.statusBadge, shopData.isOpen ? styles.statusOpen : styles.statusClosed]}>
              <View style={[styles.statusDot, shopData.isOpen ? styles.dotOpen : styles.dotClosed]} />
              <Text style={styles.statusText}>{shopData.isOpen ? 'Open' : 'Closed'}</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => router.push('/profile/edit')}
            >
              <Ionicons name="person-circle-outline" size={32} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Verification Progress Widget */}
        <VerificationProgressWidget />

        {/* Shop Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="storefront" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Shop Overview</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color={COLORS.text.secondary} />
            <Text style={styles.infoText}>{shopData.address}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="people" size={16} color={COLORS.text.secondary} />
            <Text style={styles.infoText}>{shopData.staffCount} Active Barbers</Text>
          </View>
        </View>

        {/* Today's Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="calendar" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{shopData.todayAppointments}</Text>
            <Text style={styles.statLabel}>Appointments</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="cash" size={24} color={COLORS.success} />
            </View>
            <Text style={styles.statValue}>{formatCurrency(shopData.todayRevenue)}</Text>
            <Text style={styles.statLabel}>Today's Revenue</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="people" size={24} color="#FF9800" />
            </View>
            <Text style={styles.statValue}>{shopData.todayCustomers}</Text>
            <Text style={styles.statLabel}>Customers</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/bookings')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="calendar" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.actionText}>View Bookings</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/staff')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="people" size={24} color="#9C27B0" />
              </View>
              <Text style={styles.actionText}>Manage Staff</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/shop')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="storefront" size={24} color="#FF9800" />
              </View>
              <Text style={styles.actionText}>Edit Shop</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/reports')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="bar-chart" size={24} color={COLORS.success} />
              </View>
              <Text style={styles.actionText}>View Reports</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Schedule */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/bookings')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {todaysSchedule.map((appointment) => (
            <View key={appointment.id} style={styles.scheduleItem}>
              <View style={styles.scheduleTime}>
                <Text style={styles.timeText}>{appointment.time}</Text>
              </View>
              <View style={styles.scheduleDetails}>
                <Text style={styles.customerName}>{appointment.customer}</Text>
                <Text style={styles.scheduleInfo}>
                  {appointment.service} • {appointment.barber}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
            </View>
          ))}
        </View>

        {/* Top Performer */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="trophy" size={20} color="#FFD700" />
            <Text style={styles.cardTitle}>Top Performer This Week</Text>
          </View>
          <View style={styles.topPerformerCard}>
            <View style={styles.performerAvatar}>
              <Text style={styles.avatarText}>{topBarber.name.charAt(0)}</Text>
            </View>
            <View style={styles.performerInfo}>
              <Text style={styles.performerName}>{topBarber.name}</Text>
              <Text style={styles.performerStats}>
                {topBarber.appointments} appointments • {formatCurrency(topBarber.weeklyRevenue)}
              </Text>
            </View>
            <View style={styles.trophyIcon}>
              <Ionicons name="trophy" size={32} color="#FFD700" />
            </View>
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity 
            style={styles.accountButton}
            onPress={() => router.push('/profile/edit')}
          >
            <View style={styles.accountIcon}>
              <Ionicons name="person-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.accountButtonText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.accountButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <View style={[styles.accountIcon, { backgroundColor: '#FFEBEE' }]}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            </View>
            <Text style={[styles.accountButtonText, { color: COLORS.error }]}>Logout</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  greeting: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
  },
  shopName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
    marginTop: 4,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusOpen: {
    backgroundColor: '#E8F5E9',
  },
  statusClosed: {
    backgroundColor: '#FFEBEE',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  dotOpen: {
    backgroundColor: COLORS.success,
  },
  dotClosed: {
    backgroundColor: COLORS.error,
  },
  statusText: {
    ...TYPOGRAPHY.body2,
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
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
    marginLeft: 8,
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: '47%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: COLORS.background.secondary,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  seeAllText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: '600',
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.secondary,
  },
  scheduleTime: {
    width: 60,
    marginRight: 12,
  },
  timeText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  scheduleDetails: {
    flex: 1,
  },
  customerName: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  scheduleInfo: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  topPerformerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    padding: 16,
    borderRadius: 8,
  },
  performerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    ...TYPOGRAPHY.h4,
    color: COLORS.background.primary,
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  performerStats: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  trophyIcon: {
    marginLeft: 8,
  },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.secondary,
  },
  accountIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountButtonText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text.primary,
    flex: 1,
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
});
