import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { mockBarbers, mockServices } from '@/shared/services/mockData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '@/store/useStore';

export default function PartnerProfileScreen() {
  const router = useRouter();
  const setCurrentUser = useStore((state) => state.setCurrentUser);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Using first barber as profile data
  const profile = mockBarbers[0];
  const services = mockServices.slice(0, 4);

  const stats = [
    { label: 'Jobs', value: profile.completedJobs },
    { label: 'Rating', value: profile.rating.toFixed(1) },
    { label: 'Reviews', value: profile.totalReviews },
  ];

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{profile.name.charAt(0)}</Text>
          </View>
          <Text style={styles.profileName}>{profile.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color={COLORS.warning} />
            <Text style={styles.ratingText}>
              {profile.rating.toFixed(1)} ({profile.totalReviews} reviews)
            </Text>
          </View>
          {profile.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
          <TouchableOpacity style={styles.editButton} onPress={() => router.push('/profile/edit')}>
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        </View>

        {/* Specializations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specializations</Text>
          <View style={styles.card}>
            <View style={styles.tagsContainer}>
              {profile.specializations.map((spec, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{spec}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Portfolio */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Portfolio ({profile.photos.length})</Text>
            <TouchableOpacity onPress={() => router.push('/portfolio')}>
              <Text style={styles.manageLink}>Manage</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.portfolioScroll}>
            {profile.photos.map((photo, index) => (
              <View key={index} style={styles.portfolioItem}>
                <View style={styles.portfolioPlaceholder}>
                  <Ionicons name="image-outline" size={32} color={COLORS.text.secondary} />
                </View>
              </View>
            ))}
            <TouchableOpacity style={[styles.portfolioItem, styles.addPhotoButton]}>
              <Ionicons name="add" size={32} color={COLORS.primary} />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Services Offered */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Services ({services.length})</Text>
            <TouchableOpacity onPress={() => router.push('/services')}>
              <Text style={styles.manageLink}>Manage</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            {services.map((service, index) => (
              <View key={service.id}>
                <View style={styles.serviceItem}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.serviceDuration}>{service.duration} min</Text>
                  </View>
                  <Text style={styles.servicePrice}>RM {service.price}</Text>
                </View>
                {index < services.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Business Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Information</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color={COLORS.text.secondary} />
              <Text style={styles.infoText}>{profile.phone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color={COLORS.text.secondary} />
              <Text style={styles.infoText}>{profile.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color={COLORS.text.secondary} />
              <Text style={styles.infoText}>{profile.location.address}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.text.secondary} />
              <Text style={styles.infoText}>Joined {new Date(profile.joinedDate).toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })}</Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications-outline" size={20} color={COLORS.text.secondary} />
                <Text style={styles.settingText}>Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: COLORS.border.medium, true: COLORS.primary }}
                thumbColor={COLORS.background.primary}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="moon-outline" size={20} color={COLORS.text.secondary} />
                <Text style={styles.settingText}>Dark Mode</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: COLORS.border.medium, true: COLORS.primary }}
                thumbColor={COLORS.background.primary}
              />
            </View>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="globe-outline" size={20} color={COLORS.text.secondary} />
                <Text style={styles.settingText}>Language</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={styles.settingValue}>English</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
              </View>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="document-text-outline" size={20} color={COLORS.text.secondary} />
                <Text style={styles.settingText}>Terms & Privacy</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="help-circle-outline" size={20} color={COLORS.text.secondary} />
                <Text style={styles.settingText}>Help & Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.background.primary,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    ...TYPOGRAPHY.heading.h1,
    color: COLORS.text.inverse,
    fontSize: 40,
  },
  profileName: {
    ...TYPOGRAPHY.heading.h2,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  ratingText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  verifiedText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.success,
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  editButtonText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.primary,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.heading.h2,
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  manageLink: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.primary,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    padding: 16,
  },
  bioText: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.secondary,
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.primary,
    fontWeight: '600',
  },
  portfolioScroll: {
    marginLeft: -20,
    paddingLeft: 20,
  },
  portfolioItem: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
  },
  portfolioPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoButton: {
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  serviceDuration: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
  },
  servicePrice: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border.light,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  infoText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
    flex: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.primary,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  logoutText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.error,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
});
