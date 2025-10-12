import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Switch,
  Alert, 
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/shared/constants';
import { mockBarbers } from '@/shared/services/mockData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '@/store/useStore';

const { width } = Dimensions.get('window');

export default function PartnerProfileScreen() {
  const router = useRouter();
  const setCurrentUser = useStore((state) => state.setCurrentUser);
  const profile = mockBarbers[0];
  
  const [isOnline, setIsOnline] = useState(profile.isOnline);

  // This week's stats
  const weekStats = {
    earnings: 'RM 1,240',
    jobs: 12,
    rating: 4.9,
  };

  // Menu sections
  const menuSections = [
    {
      title: 'ACCOUNT',
      items: [
        { 
          icon: 'person-outline', 
          label: 'Personal Information', 
          screen: '/profile/edit',
          iconBg: '#E3F2FD',
          iconColor: '#2196F3',
        },
        { 
          icon: 'card-outline', 
          label: 'Bank & Payout Settings', 
          action: 'bank',
          iconBg: '#E8F5E9',
          iconColor: '#4CAF50',
        },
        { 
          icon: 'shield-checkmark-outline', 
          label: 'Verification & Documents', 
          action: 'verification',
          badge: profile.isVerified ? 'Verified' : 'Pending',
          badgeColor: profile.isVerified ? '#4CAF50' : '#FF9800',
          iconBg: '#FFF3E0',
          iconColor: '#FF9800',
        },
        { 
          icon: 'receipt-outline', 
          label: 'Tax Information', 
          action: 'tax',
          iconBg: '#F3E5F5',
          iconColor: '#9C27B0',
        },
      ],
    },
    {
      title: 'MY BUSINESS',
      items: [
        { 
          icon: 'cut-outline', 
          label: 'Manage Services & Pricing', 
          screen: '/services',
          iconBg: '#E8F5E9',
          iconColor: '#00B87C',
        },
        { 
          icon: 'calendar-outline', 
          label: 'Availability & Schedule', 
          screen: '/schedule',
          iconBg: '#FFF3E0',
          iconColor: '#FF9800',
        },
        { 
          icon: 'images-outline', 
          label: 'Portfolio Management', 
          screen: '/portfolio',
          badge: `${profile.photos.length}`,
          iconBg: '#F3E5F5',
          iconColor: '#9C27B0',
        },
        { 
          icon: 'star-outline', 
          label: 'Ratings & Reviews', 
          action: 'reviews',
          badge: profile.rating.toFixed(1),
          iconBg: '#FFF8E1',
          iconColor: '#FFC107',
        },
        { 
          icon: 'analytics-outline', 
          label: 'Performance Insights', 
          action: 'insights',
          iconBg: '#E3F2FD',
          iconColor: '#2196F3',
        },
      ],
    },
    {
      title: 'SETTINGS',
      items: [
        { 
          icon: 'notifications-outline', 
          label: 'Notifications', 
          action: 'notifications',
          iconBg: '#E3F2FD',
          iconColor: '#2196F3',
        },
        { 
          icon: 'globe-outline', 
          label: 'Language & Region', 
          action: 'language',
          value: 'English',
          iconBg: '#E8F5E9',
          iconColor: '#4CAF50',
        },
        { 
          icon: 'settings-outline', 
          label: 'App Preferences', 
          action: 'preferences',
          iconBg: '#F5F5F5',
          iconColor: '#757575',
        },
      ],
    },
    {
      title: 'HELP & SUPPORT',
      items: [
        { 
          icon: 'help-circle-outline', 
          label: 'Help Center', 
          action: 'help',
          iconBg: '#E8F5E9',
          iconColor: '#4CAF50',
        },
        { 
          icon: 'chatbubble-ellipses-outline', 
          label: 'Contact Support', 
          action: 'contact',
          iconBg: '#E3F2FD',
          iconColor: '#2196F3',
        },
        { 
          icon: 'document-text-outline', 
          label: 'FAQs', 
          action: 'faqs',
          iconBg: '#FFF3E0',
          iconColor: '#FF9800',
        },
        { 
          icon: 'bug-outline', 
          label: 'Report a Problem', 
          action: 'report',
          iconBg: '#FFEBEE',
          iconColor: '#F44336',
        },
      ],
    },
    {
      title: 'LEGAL',
      items: [
        { 
          icon: 'document-outline', 
          label: 'Terms of Service', 
          action: 'terms',
          iconBg: '#F5F5F5',
          iconColor: '#757575',
        },
        { 
          icon: 'lock-closed-outline', 
          label: 'Privacy Policy', 
          action: 'privacy',
          iconBg: '#F5F5F5',
          iconColor: '#757575',
        },
        { 
          icon: 'information-circle-outline', 
          label: 'About Mari-Gunting', 
          action: 'about',
          iconBg: '#F5F5F5',
          iconColor: '#757575',
        },
      ],
    },
  ];

  const handleMenuPress = (item: any) => {
    if (item.screen) {
      router.push(item.screen);
    } else if (item.action) {
      Alert.alert(item.label, `${item.label} feature`);
    }
  };

  const handleToggleOnline = (value: boolean) => {
    setIsOnline(value);
    Alert.alert(
      value ? 'Going Online' : 'Going Offline',
      value ? 'You will now receive booking requests' : 'You will not receive booking requests'
    );
  };

  const handleViewPublicProfile = () => {
    Alert.alert('Public Profile', 'This shows how customers see your profile');
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
              setCurrentUser(null);
              await AsyncStorage.multiRemove(['partnerAccountType', 'mari-gunting-storage']);
              router.replace('/login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileTopRow}>
            <View style={styles.avatarSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{profile.name.charAt(0)}</Text>
              </View>
              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.profileName}>{profile.name}</Text>
                  {profile.isVerified && (
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                  )}
                </View>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#FFC107" />
                  <Text style={styles.ratingText}>{profile.rating.toFixed(1)}</Text>
                  <Text style={styles.ratingCount}>({profile.totalReviews})</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => router.push('/profile/edit')}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={18} color="#FFF" />
              <Text style={styles.primaryButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleViewPublicProfile}
              activeOpacity={0.8}
            >
              <Ionicons name="eye-outline" size={18} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>View Public</Text>
            </TouchableOpacity>
          </View>

          {/* Online Toggle */}
          <View style={styles.onlineToggleRow}>
            <View style={styles.onlineToggleLeft}>
              <View style={[styles.onlineDot, isOnline && styles.onlineDotActive]} />
              <Text style={styles.onlineLabel}>{isOnline ? 'Online' : 'Offline'}</Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              trackColor={{ false: '#E0E0E0', true: COLORS.primaryLight }}
              thumbColor={isOnline ? COLORS.primary : '#F5F5F5'}
              ios_backgroundColor="#E0E0E0"
            />
          </View>
        </View>

        {/* This Week Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statsCardHeader}>
            <Text style={styles.statsCardTitle}>This Week</Text>
            <Ionicons name="calendar-outline" size={16} color={COLORS.text.secondary} />
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxValue}>{weekStats.earnings}</Text>
              <Text style={styles.statBoxLabel}>Earnings</Text>
            </View>
            <View style={styles.statBoxDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statBoxValue}>{weekStats.jobs}</Text>
              <Text style={styles.statBoxLabel}>Jobs</Text>
            </View>
            <View style={styles.statBoxDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statBoxValue}>{weekStats.rating.toFixed(1)}</Text>
              <Text style={styles.statBoxLabel}>Rating</Text>
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        <View style={styles.menuContainer}>
          {menuSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.menuSection}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.menuCard}>
                {section.items.map((item, itemIndex) => (
                  <View key={itemIndex}>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => handleMenuPress(item)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.menuIcon, { backgroundColor: item.iconBg }]}>
                        <Ionicons name={item.icon as any} size={20} color={item.iconColor} />
                      </View>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                      <View style={styles.menuRight}>
                        {item.badge && (
                          <View style={[styles.badge, item.badgeColor && { backgroundColor: `${item.badgeColor}15` }]}>
                            <Text style={[styles.badgeText, item.badgeColor && { color: item.badgeColor }]}>
                              {item.badge}
                            </Text>
                          </View>
                        )}
                        {item.value && (
                          <Text style={styles.menuValue}>{item.value}</Text>
                        )}
                        <Ionicons name="chevron-forward" size={18} color="#CCC" />
                      </View>
                    </TouchableOpacity>
                    {itemIndex < section.items.length - 1 && <View style={styles.menuDivider} />}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.versionText}>Mari-Gunting Partner v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F7',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Profile Header
  profileHeader: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    marginBottom: 16,
  },
  profileTopRow: {
    marginBottom: 16,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  ratingCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 12,
    borderRadius: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  onlineToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  onlineToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#CCC',
  },
  onlineDotActive: {
    backgroundColor: COLORS.success,
  },
  onlineLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  // Stats Card
  statsCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statsCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statBoxValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statBoxLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  statBoxDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#F0F0F0',
  },
  // Menu Container
  menuContainer: {
    paddingHorizontal: 16,
  },
  menuSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  menuDivider: {
    height: 0.5,
    backgroundColor: '#F0F0F0',
    marginLeft: 68,
  },
  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FFE5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.error,
  },
  versionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#999',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
});
