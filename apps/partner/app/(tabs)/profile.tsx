import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/shared/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { barberService, BarberProfile } from '@/shared/services/barberService';
import { locationTrackingService } from '@/services/locationTrackingService';

// Type for menu items
type MenuItem = {
  icon: string;
  label: string;
  iconBg: string;
  iconColor: string;
  screen?: string;
  action?: string;
  badge?: string;
  badgeColor?: string;
  value?: string;
};

export default function PartnerProfileScreen() {
  const router = useRouter();
  const currentUser = useStore((state) => state.currentUser);
  const setCurrentUser = useStore((state) => state.setCurrentUser);
  
  // State
  const [profile, setProfile] = useState<BarberProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [accountType, setAccountType] = useState<'freelance' | 'barbershop'>('freelance');

  // Fetch barber profile and account type on mount (initial load)
  useEffect(() => {
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
    if (currentUser?.id) {
      loadBarberProfile(true); // Show loading spinner on initial load
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount
  
  // Reload profile when screen comes into focus (silent refresh in background)
  useFocusEffect(
    useCallback(() => {
      // Only refresh if profile already exists (skip initial load)
      if (currentUser?.id && profile) {
        loadBarberProfile(false); // Silent refresh, no loading spinner
      }
    }, [currentUser?.id, profile])
  );

  const loadBarberProfile = async (showLoading: boolean = true) => {
    try {
      // Only show loading spinner on initial load
      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      
      if (!currentUser?.id) {
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }
      
      // Fetch barber profile
      const barberProfile = await barberService.getBarberProfileByUserId(currentUser.id);
      
      if (barberProfile) {
        setProfile(barberProfile);
      } else {
        // Only show error alert on initial load, not on background refresh
        if (showLoading) {
          Alert.alert('Error', 'Failed to load profile data');
        }
      }
    } catch (error) {
      // Only show error alert on initial load, not on background refresh
      if (showLoading) {
        Alert.alert('Error', 'Failed to load profile data');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Menu sections - Reorganized based on priority
  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'ACCOUNT MANAGEMENT',
      items: [
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
          badge: profile?.isVerified ? 'Verified' : 'Pending',
          badgeColor: profile?.isVerified ? '#4CAF50' : '#FF9800',
          iconBg: '#FFF3E0',
          iconColor: '#FF9800',
        },
        { 
          icon: 'lock-closed-outline', 
          label: 'Security Settings', 
          action: 'security',
          iconBg: '#FFEBEE',
          iconColor: '#F44336',
        },
      ],
    },
    {
      title: 'BUSINESS SETTINGS',
      items: [
        { 
          icon: 'cut-outline', 
          label: 'Services & Pricing', 
          screen: '/services',
          iconBg: '#E8F5E9',
          iconColor: '#7E3AF2',
        },
        { 
          icon: 'images-outline', 
          label: 'Portfolio', 
          screen: '/portfolio',
          badge: `${profile?.photos?.length || 0}`,
          iconBg: '#F3E5F5',
          iconColor: '#9C27B0',
        },
        // Only show Service Radius for freelance barbers
        ...(accountType === 'freelance' ? [{ 
          icon: 'navigate-circle-outline', 
          label: 'Service Radius', 
          screen: '/service-radius',
          value: profile?.serviceRadiusKm ? `${profile.serviceRadiusKm} km` : undefined,
          iconBg: '#E3F2FD',
          iconColor: '#2196F3',
        }] : []),
        // Only show Availability for barbershops, not freelance barbers
        ...(accountType === 'barbershop' ? [{
          icon: 'calendar-outline', 
          label: 'Availability', 
          screen: '/schedule',
          iconBg: '#FFF3E0',
          iconColor: '#FF9800',
        }] : []),
      ],
    },
    {
      title: 'APP SETTINGS',
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
          label: 'Language', 
          action: 'language',
          value: 'English',
          iconBg: '#E8F5E9',
          iconColor: '#4CAF50',
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
          label: 'About', 
          action: 'about',
          iconBg: '#F5F5F5',
          iconColor: '#757575',
        },
      ],
    },
  ];

  const handleMenuPress = (item: MenuItem) => {
    if (item.screen) {
      router.push(item.screen as any);
    } else if (item.action) {
      // Handle specific actions
      switch (item.action) {
        case 'bank':
          router.push('/profile/bank');
          break;
        case 'verification':
          router.push('/profile/verification');
          break;
        default:
          Alert.alert(item.label, `${item.label} feature`);
          break;
      }
    }
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
              // Stop location tracking on logout
              locationTrackingService.stopTracking();
              
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

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error if no profile
  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Ionicons name="warning-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>Failed to load profile</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadBarberProfile}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFF' }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header - Enhanced */}
        <View style={styles.profileHeader}>
          {/* Edit Icon - Top Right */}
          <TouchableOpacity 
            style={styles.editIcon}
            onPress={() => router.push('/profile/edit')}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>

          {/* Avatar with Status Indicator */}
          <View style={styles.avatarContainer}>
            {profile.avatar ? (
              <Image 
                source={{ uri: profile.avatar }} 
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{profile.name.charAt(0)}</Text>
              </View>
            )}
            {/* Online Status Ring */}
            {profile.isOnline && (
              <View style={styles.onlineIndicator} />
            )}
          </View>

          {/* Profile Info */}
          <View style={styles.profileDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName} numberOfLines={2}>{profile.name}</Text>
              {profile.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#7E3AF2" />
                </View>
              )}
            </View>
            
            {/* Contact Info */}
            {profile.phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call" size={14} color="#666" />
                <Text style={styles.infoText}>{profile.phone}</Text>
              </View>
            )}
            {profile.email && (
              <View style={styles.infoRow}>
                <Ionicons name="mail" size={14} color="#666" />
                <Text style={styles.infoText}>{profile.email}</Text>
              </View>
            )}
            
            {/* Member Since */}
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={14} color="#666" />
              <Text style={styles.infoText}>
                Member since {new Date(profile.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </Text>
            </View>
            
            {/* Rating Badge */}
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={16} color="#FFC107" />
              <Text style={styles.ratingText}>{profile.rating.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>• {profile.totalReviews} reviews</Text>
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
      </ScrollView>
    </View>
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
  // Loading & Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
    marginTop: 12,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  // Profile Header
  profileHeader: {
    position: 'relative',
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    marginBottom: 16,
  },
  editIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  // Avatar Container
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
    alignSelf: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#E0E0E0',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#7E3AF2',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  profileDetails: {
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    flexShrink: 1,
    textAlign: 'center',
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  ratingCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
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
