import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '@mari-gunting/shared/store/useStore';

interface OperatingHours {
  open: string;
  close: string;
  isOpen: boolean;
}

export default function ShopScreen() {
  const router = useRouter();
  const setCurrentUser = useStore((state) => state.setCurrentUser);
  const [isEditing, setIsEditing] = useState(false);
  
  const [shopInfo, setShopInfo] = useState({
    name: "Budi's Barbershop",
    address: "Jalan Sultan Ismail 123, Kuala Lumpur",
    phone: "+60 12-345 6789",
    description: "Premium barbershop with experienced barbers. We specialize in modern haircuts, traditional shaves, and grooming services.",
  });

  const [operatingHours, setOperatingHours] = useState<Record<string, OperatingHours>>({
    monday: { open: '09:00', close: '21:00', isOpen: true },
    tuesday: { open: '09:00', close: '21:00', isOpen: true },
    wednesday: { open: '09:00', close: '21:00', isOpen: true },
    thursday: { open: '09:00', close: '21:00', isOpen: true },
    friday: { open: '09:00', close: '21:00', isOpen: true },
    saturday: { open: '10:00', close: '22:00', isOpen: true },
    sunday: { open: '10:00', close: '20:00', isOpen: false },
  });

  const [settings, setSettings] = useState({
    onlineBooking: true,
    instantConfirmation: false,
    bufferTime: 15,
  });

  const dayNames: Record<string, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  };

  const toggleDayStatus = (day: string) => {
    setOperatingHours({
      ...operatingHours,
      [day]: {
        ...operatingHours[day],
        isOpen: !operatingHours[day].isOpen,
      },
    });
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
          <Text style={styles.title}>Shop Profile</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Ionicons
              name={isEditing ? 'checkmark' : 'create-outline'}
              size={24}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Shop Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Shop Information</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Shop Name</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={shopInfo.name}
              onChangeText={(text) => setShopInfo({ ...shopInfo, name: text })}
              editable={isEditing}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={shopInfo.address}
              onChangeText={(text) => setShopInfo({ ...shopInfo, address: text })}
              editable={isEditing}
              multiline
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={shopInfo.phone}
              onChangeText={(text) => setShopInfo({ ...shopInfo, phone: text })}
              editable={isEditing}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.textarea, !isEditing && styles.inputDisabled]}
              value={shopInfo.description}
              onChangeText={(text) => setShopInfo({ ...shopInfo, description: text })}
              editable={isEditing}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Operating Hours */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Operating Hours</Text>
          {Object.keys(operatingHours).map((day) => (
            <View key={day} style={styles.dayRow}>
              <View style={styles.dayInfo}>
                <Text style={styles.dayName}>{dayNames[day]}</Text>
                {operatingHours[day].isOpen ? (
                  <Text style={styles.dayHours}>
                    {operatingHours[day].open} - {operatingHours[day].close}
                  </Text>
                ) : (
                  <Text style={[styles.dayHours, { color: COLORS.error }]}>Closed</Text>
                )}
              </View>
              <Switch
                value={operatingHours[day].isOpen}
                onValueChange={() => toggleDayStatus(day)}
                trackColor={{ false: COLORS.background.secondary, true: COLORS.primary }}
                disabled={!isEditing}
              />
            </View>
          ))}
        </View>

        {/* Quick Links */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push('/portfolio')}
          >
            <View style={styles.linkIcon}>
              <Ionicons name="images" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.linkContent}>
              <Text style={styles.linkTitle}>Portfolio</Text>
              <Text style={styles.linkSubtitle}>Manage your work gallery</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push('/services')}
          >
            <View style={styles.linkIcon}>
              <Ionicons name="cut" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.linkContent}>
              <Text style={styles.linkTitle}>Services</Text>
              <Text style={styles.linkSubtitle}>Manage services and pricing</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Booking Settings</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Online Booking</Text>
              <Text style={styles.settingSubtitle}>
                Allow customers to book appointments online
              </Text>
            </View>
            <Switch
              value={settings.onlineBooking}
              onValueChange={(value) =>
                setSettings({ ...settings, onlineBooking: value })
              }
              trackColor={{ false: COLORS.background.secondary, true: COLORS.primary }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Instant Confirmation</Text>
              <Text style={styles.settingSubtitle}>
                Auto-confirm bookings without manual approval
              </Text>
            </View>
            <Switch
              value={settings.instantConfirmation}
              onValueChange={(value) =>
                setSettings({ ...settings, instantConfirmation: value })
              }
              trackColor={{ false: COLORS.background.secondary, true: COLORS.primary }}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Buffer Time (minutes)</Text>
            <Text style={styles.hint}>
              Time gap between appointments for cleanup and preparation
            </Text>
            <TextInput
              style={styles.input}
              value={settings.bufferTime.toString()}
              onChangeText={(text) =>
                setSettings({ ...settings, bufferTime: parseInt(text) || 0 })
              }
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* Account */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity 
            style={styles.linkRow}
            onPress={handleLogout}
          >
            <View style={[styles.linkIcon, { backgroundColor: '#FFEBEE' }]}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            </View>
            <View style={styles.linkContent}>
              <Text style={[styles.linkTitle, { color: COLORS.error }]}>Logout</Text>
              <Text style={styles.linkSubtitle}>Sign out of your account</Text>
            </View>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    ...TYPOGRAPHY.body1,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.background.secondary,
    color: COLORS.text.primary,
  },
  inputDisabled: {
    backgroundColor: COLORS.background.primary,
    borderColor: COLORS.background.secondary,
  },
  textarea: {
    ...TYPOGRAPHY.body1,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.background.secondary,
    color: COLORS.text.primary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.secondary,
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  dayHours: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.secondary,
  },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  linkSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.secondary,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  hint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
});
