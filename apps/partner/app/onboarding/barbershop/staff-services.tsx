import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { Ionicons } from '@expo/vector-icons';
import { barbershopOnboardingService } from '@mari-gunting/shared/services/onboardingService';
import { Colors, theme } from '@mari-gunting/shared/theme';

const ROLES = ['Senior Barber', 'Barber', 'Junior Barber', 'Stylist', 'Trainee'];

const SPECIALIZATIONS = ['Haircut', 'Fade', 'Beard Trim', 'Shaving', 'Hair Coloring', 'Perm', 'Kids Haircut'];

export default function StaffServicesScreen() {
  const insets = useSafeAreaInsets();
  const logout = useStore((state) => state.logout);
  const [loading, setLoading] = useState(false);
  
  // Staff state
  const [staff, setStaff] = useState<Array<{ name: string; role: string; specializations: string[] }>>([]);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('');
  const [staffSpecs, setStaffSpecs] = useState<string[]>([]);
  
  // Services state
  const [services, setServices] = useState<Array<{ name: string; price: number; duration: number }>>([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const progress = await barbershopOnboardingService.getProgress();
      if (progress.staffServices) {
        setStaff(progress.staffServices.staff);
        setServices(progress.staffServices.services);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const toggleStaffSpec = (spec: string) => {
    if (staffSpecs.includes(spec)) {
      setStaffSpecs(staffSpecs.filter((s) => s !== spec));
    } else {
      setStaffSpecs([...staffSpecs, spec]);
    }
  };

  const addStaffMember = () => {
    if (!staffName.trim()) {
      Alert.alert('Name Required', 'Please enter staff member name.');
      return;
    }
    if (!staffRole) {
      Alert.alert('Role Required', 'Please select a role.');
      return;
    }
    if (staffSpecs.length === 0) {
      Alert.alert('Specializations Required', 'Please select at least one specialization.');
      return;
    }

    setStaff([...staff, { name: staffName.trim(), role: staffRole, specializations: staffSpecs }]);
    setStaffName('');
    setStaffRole('');
    setStaffSpecs([]);
    setShowStaffModal(false);
  };

  const removeStaff = (index: number) => {
    Alert.alert('Remove Staff', 'Are you sure you want to remove this staff member?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', onPress: () => setStaff(staff.filter((_, i) => i !== index)), style: 'destructive' },
    ]);
  };

  const addService = () => {
    if (!serviceName.trim()) {
      Alert.alert('Service Name Required', 'Please enter service name.');
      return;
    }
    const price = parseFloat(servicePrice);
    if (!servicePrice || isNaN(price) || price < 10) {
      Alert.alert('Invalid Price', 'Please enter a valid price (minimum RM 10).');
      return;
    }
    const duration = parseInt(serviceDuration);
    if (!serviceDuration || isNaN(duration) || duration < 10) {
      Alert.alert('Invalid Duration', 'Please enter a valid duration (minimum 10 minutes).');
      return;
    }

    setServices([...services, { name: serviceName.trim(), price, duration }]);
    setServiceName('');
    setServicePrice('');
    setServiceDuration('');
    setShowServiceModal(false);
  };

  const removeService = (index: number) => {
    Alert.alert('Remove Service', 'Are you sure you want to remove this service?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', onPress: () => setServices(services.filter((_, i) => i !== index)), style: 'destructive' },
    ]);
  };


  const handleLogout = () => {
    Alert.alert(
      'Exit Onboarding?',
      'Your progress will be saved. You can continue later by logging in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };


  const validateForm = (): boolean => {
    if (staff.length === 0) {
      Alert.alert('Staff Required', 'Please add at least 1 staff member.');
      return false;
    }
    if (services.length < 3) {
      Alert.alert('Services Required', 'Please add at least 3 services.');
      return false;
    }
    return true;
  };

  const handleContinue = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      await barbershopOnboardingService.saveProgress('staffServices', { staff, services });
      router.push('/onboarding/barbershop/amenities');
    } catch (error) {
      console.error('Error saving progress:', error);
      Alert.alert('Error', 'Failed to save progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={22} color={Colors.error} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressDotCompleted} />
          <View style={styles.progressDotCompleted} />
          <View style={styles.progressDotCompleted} />
          <View style={styles.progressDotCompleted} />
          <View style={[styles.progressDot, styles.progressActive]} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Staff & Services</Text>
        <Text style={styles.subtitle}>Tell us about your team and the services you offer.</Text>

        {/* Staff Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Staff Members ({staff.length})</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowStaffModal(true)}>
              <Ionicons name="add-circle" size={24} color={Colors.primary} />
              <Text style={styles.addButtonText}>Add Staff</Text>
            </TouchableOpacity>
          </View>
          {staff.map((member, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{member.name}</Text>
                <Text style={styles.cardSubtitle}>{member.role}</Text>
                <Text style={styles.cardDetail}>{member.specializations.join(', ')}</Text>
              </View>
              <TouchableOpacity onPress={() => removeStaff(index)}>
                <Ionicons name="trash-outline" size={20} color="#f44336" />
              </TouchableOpacity>
            </View>
          ))}
          {staff.length === 0 && (
            <Text style={styles.emptyText}>No staff members added yet</Text>
          )}
        </View>

        {/* Services Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Services ({services.length})</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowServiceModal(true)}>
              <Ionicons name="add-circle" size={24} color={Colors.primary} />
              <Text style={styles.addButtonText}>Add Service</Text>
            </TouchableOpacity>
          </View>
          {services.map((service, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{service.name}</Text>
                <Text style={styles.cardDetail}>RM {service.price} • {service.duration} mins</Text>
              </View>
              <TouchableOpacity onPress={() => removeService(index)}>
                <Ionicons name="trash-outline" size={20} color="#f44336" />
              </TouchableOpacity>
            </View>
          ))}
          {services.length === 0 && (
            <Text style={styles.emptyText}>No services added yet</Text>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Staff Modal */}
      <Modal visible={showStaffModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Staff Member</Text>
              <TouchableOpacity onPress={() => setShowStaffModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={staffName}
                onChangeText={setStaffName}
              />
              <Text style={styles.label}>Role</Text>
              <View style={styles.roleButtons}>
                {ROLES.map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[styles.roleButton, staffRole === role && styles.roleButtonActive]}
                    onPress={() => setStaffRole(role)}
                  >
                    <Text style={[styles.roleButtonText, staffRole === role && styles.roleButtonTextActive]}>
                      {role}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Specializations</Text>
              <View style={styles.specsGrid}>
                {SPECIALIZATIONS.map((spec) => (
                  <TouchableOpacity
                    key={spec}
                    style={[styles.specChip, staffSpecs.includes(spec) && styles.specChipActive]}
                    onPress={() => toggleStaffSpec(spec)}
                  >
                    <Text style={[styles.specChipText, staffSpecs.includes(spec) && styles.specChipTextActive]}>
                      {spec}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.modalButton} onPress={addStaffMember}>
                <Text style={styles.modalButtonText}>Add Staff Member</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Service Modal */}
      <Modal visible={showServiceModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Service</Text>
              <TouchableOpacity onPress={() => setShowServiceModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Service Name (e.g., Haircut)"
              value={serviceName}
              onChangeText={setServiceName}
            />
            <TextInput
              style={styles.input}
              placeholder="Price (RM)"
              value={servicePrice}
              onChangeText={setServicePrice}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Duration (minutes)"
              value={serviceDuration}
              onChangeText={setServiceDuration}
              keyboardType="number-pad"
            />
            <TouchableOpacity style={styles.modalButton} onPress={addService}>
              <Text style={styles.modalButtonText}>Add Service</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Continue Button */}
      <View style={[styles.footer, { paddingBottom: Platform.OS === 'android' ? insets.bottom + 16 : 32 }]}>
        <TouchableOpacity
          style={[styles.continueButton, loading && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.continueButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logoutButton: { width: 40,

    borderRadius: 20,

    backgroundColor: Colors.errorLight, height: 40, alignItems: 'center', justifyContent: 'center' },
  progressContainer: { flexDirection: 'row', gap: 6 },
  progressDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#e0e0e0' },
  progressDotCompleted: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  progressActive: { backgroundColor: Colors.primary, width: 20 },
  content: { flex: 1, paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', marginTop: 24, marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', lineHeight: 24, marginBottom: 32 },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addButtonText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: '#666', marginBottom: 4 },
  cardDetail: { fontSize: 13, color: '#999' },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center', fontStyle: 'italic', paddingVertical: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16, backgroundColor: '#fafafa' },
  label: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 12 },
  roleButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  roleButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#fafafa' },
  roleButtonActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  roleButtonText: { fontSize: 14, fontWeight: '500', color: '#666' },
  roleButtonTextActive: { color: '#fff' },
  specsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  specChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#fafafa' },
  specChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  specChipText: { fontSize: 13, fontWeight: '500', color: '#666' },
  specChipTextActive: { color: '#fff' },
  modalButton: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  modalButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  footer: { paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: '#f0f0f0', backgroundColor: '#fff' },
  continueButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, gap: 8 },
  continueButtonDisabled: { opacity: 0.6 },
  continueButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
