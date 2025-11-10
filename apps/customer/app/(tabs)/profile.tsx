import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator, AppState, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { formatPhoneNumber } from '@mari-gunting/shared/utils/format';
import { useProfile } from '@/hooks/useProfile';
import { SkeletonText } from '@/components/Skeleton';
import { useEffect, useRef, useCallback, useState } from 'react';
import { Colors, theme } from '@mari-gunting/shared/theme';

// Helper function to safely get avatar URL
const getAvatarUrl = (user: any) => {
  // Check avatar_url field (database field name)
  if (user?.avatar_url && typeof user.avatar_url === 'string') {
    const trimmedAvatarUrl = user.avatar_url.trim();
    if (trimmedAvatarUrl !== '' && !trimmedAvatarUrl.includes('placeholder')) {
      return trimmedAvatarUrl;
    }
  }
  
  // Fallback to placeholder
  return 'https://via.placeholder.com/100';
};

export default function ProfileScreen() {
  const currentUser = useStore((state) => state.currentUser);
  const setCurrentUser = useStore((state) => state.setCurrentUser);
  const logout = useStore((state) => state.logout);
  const { stats, isLoadingStats, refreshProfile } = useProfile();
  const appState = useRef(AppState.currentState);
  const [refreshing, setRefreshing] = useState(false);

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
    } catch (error) {
      console.error('[Profile] Manual refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshProfile]);

  // Also refresh when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('[Profile] App came to foreground, refreshing profile...');
        refreshProfile().catch(err => console.error('[Profile] Refresh failed:', err));
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [refreshProfile]);

  const handleSwitchRole = () => {
    if (!currentUser) return;
    
    // Check roles array for multi-role support
    const userRoles = (currentUser as any).roles || [currentUser.role];
    const hasBarberRole = userRoles.includes('barber') || userRoles.includes('barbershop_owner');
    
    if (!hasBarberRole) {
      // Customer wants to become Barber - needs KYC verification
      Alert.alert(
        'Become a Barber',
        'To offer services as a barber, you need to complete KYC verification.\n\nThis includes:\n• ID verification\n• Selfie verification\n• Optional certifications',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Start Verification',
            style: 'default',
            onPress: () => {
              router.push('/barber-verification');
            },
          },
        ]
      );
    } else {
      // Barber wants to switch back to Customer - instant switch
      Alert.alert(
        'Switch to Customer',
        'Switch back to customer account?\n\nYou can become a barber again anytime.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Switch to Customer',
            style: 'default',
            onPress: () => {
              const updatedUser = {
                ...currentUser,
                role: 'customer' as const,
              };
              setCurrentUser(updatedUser as any);
              
              Alert.alert(
                'Success',
                'Switched to Customer account successfully!',
                [{ text: 'OK' }]
              );
            },
          },
        ]
      );
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all user data and storage
              await logout();
              
              // Navigate to login
              router.replace('/login');
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleMenuItemPress = (itemId: string) => {
    switch (itemId) {
      case 'addresses':
        router.push('/profile/addresses');
        break;
      case 'favorites':
        Alert.alert('Coming Soon', 'Favorites feature is coming soon!');
        break;
      case 'help':
        Alert.alert('Coming Soon', 'Help center is coming soon!');
        break;
      case 'contact':
        Alert.alert('Contact Us', 'Email: support@marigunting.com\nPhone: +60 123 456 789');
        break;
      case 'about':
        Alert.alert('About Mari Gunting', 'Version 1.0.0\n\nMari Gunting - Your trusted barber booking platform.');
        break;
      case 'settings':
        Alert.alert('Coming Soon', 'Settings page is coming soon!');
        break;
      case 'privacy':
        Alert.alert('Coming Soon', 'Privacy policy page is coming soon!');
        break;
      case 'terms':
        Alert.alert('Coming Soon', 'Terms of service page is coming soon!');
        break;
      default:
        console.log('Unknown menu item:', itemId);
    }
  };

  const menuSections = [
    {
      title: 'Account',
      items: [
        { id: 'addresses', icon: 'location', label: 'My Addresses', badge: currentUser.savedAddresses?.length || 0, color: Colors.primary },
        { id: 'favorites', icon: 'heart', label: 'Favorite Barbers', badge: null, color: Colors.error },
      ]
    },
    {
      title: 'Support',
      items: [
        { id: 'help', icon: 'help-circle', label: 'Help Center', badge: null, color: Colors.warning },
        { id: 'contact', icon: 'chatbubble', label: 'Contact Us', badge: null, color: Colors.status.ready },
        { id: 'about', icon: 'information-circle', label: 'About Mari Gunting', badge: null, color: Colors.gray[500] },
      ]
    },
    {
      title: 'More',
      items: [
        { id: 'settings', icon: 'settings', label: 'Settings', badge: null, color: Colors.gray[500] },
        { id: 'privacy', icon: 'lock-closed', label: 'Privacy Policy', badge: null, color: Colors.gray[500] },
        { id: 'terms', icon: 'document-text', label: 'Terms of Service', badge: null, color: Colors.gray[500] },
      ]
    }
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        bounces={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}             colors={[Colors.primary]}
          />
        }
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: getAvatarUrl(currentUser) }}
                style={styles.avatar}
              />
              <TouchableOpacity 
                style={styles.editBadge}
                onPress={() => router.push('/profile/edit')}
              >
                <Ionicons name="pencil" size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{currentUser.full_name}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {((currentUser as any).roles || [currentUser.role]).map((r: string) => r.toUpperCase()).join(' + ')}
              </Text>
            </View>
          </View>

          {/* Contact Info */}
          <View style={styles.contactSection}>
            <View style={styles.contactRow}>
              <View style={styles.contactIconContainer}>
                <Ionicons name="mail" size={18} color={Colors.white} />
              </View>
              <Text style={styles.contactText}>{currentUser.email}</Text>
            </View>
            <View style={styles.contactRow}>
              <View style={styles.contactIconContainer}>
                <Ionicons name="call" size={18} color={Colors.white} />
              </View>
              <Text style={styles.contactText}>{formatPhoneNumber(currentUser.phone_number)}</Text>
            </View>
          </View>
        </View>

        {/* Stats Section - Show for all users */}
        {(
          <View style={styles.statsSection}>
            {isLoadingStats ? (
              <>
                <View style={styles.statCard}>
                  <SkeletonText width={60} height={28} />
                  <SkeletonText width={80} height={13} style={{ marginTop: 4 }} />
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCard}>
                  <SkeletonText width={60} height={28} />
                  <SkeletonText width={80} height={13} style={{ marginTop: 4 }} />
                </View>
              </>
            ) : (
              <>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.total}</Text>
                  <Text style={styles.statLabel}>Total Bookings</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.completed}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Menu Sections */}
        <View style={styles.contentSection}>
          {menuSections.map((section, sectionIndex) => (
            <View key={section.title} style={styles.menuSection}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.menuCard}>
                {section.items.map((item, itemIndex) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.menuItem,
                      itemIndex !== section.items.length - 1 && styles.menuItemBorder
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleMenuItemPress(item.id)}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}15` }]}>
                        <Ionicons name={item.icon as any} size={22} color={item.color} />
                      </View>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                    </View>
                    <View style={styles.menuItemRight}>
                      {item.badge !== null && item.badge > 0 && (
                        <View style={styles.menuBadge}>
                          <Text style={styles.menuBadgeText}>{item.badge}</Text>
                        </View>
                      )}
                      <Ionicons name="chevron-forward" size={20} color={Colors.gray[300]} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* Logout Button */}
          <TouchableOpacity 
            style={styles.logoutButton} 
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>

          {/* Version Info */}
          <Text style={styles.versionText}>Version 1.0.0</Text>
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
    backgroundColor: Colors.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.gray[500],
    fontWeight: '500',
  },
  heroSection: {
    backgroundColor: Colors.primary,
    paddingTop: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  profileCard: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: Colors.white,
    backgroundColor: Colors.gray[100],
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  userName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  contactSection: {
    paddingHorizontal: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  contactIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.gray[500],
    fontWeight: '600',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.gray[200],
    marginHorizontal: 16,
  },
  contentSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  menuSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  menuBadgeText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
  testPartnerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
    gap: 10,
  },
  testPartnerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.info,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 2,
    borderColor: Colors.errorLight,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.error,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 13,
    color: Colors.gray[400],
    fontWeight: '500',
    marginTop: 24,
  },
  roleSwitchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  roleSwitchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roleSwitchIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  roleSwitchContent: {
    flex: 1,
  },
  roleSwitchLabel: {
    fontSize: 12,
    color: Colors.gray[500],
    fontWeight: '600',
    marginBottom: 4,
  },
  roleSwitchValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  roleSwitchHint: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  roleSwitchBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  roleSwitchBadgeText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
