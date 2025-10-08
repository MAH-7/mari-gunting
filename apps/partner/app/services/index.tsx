import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
  isActive: boolean;
}

export default function ServicesManagementScreen() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([
    { id: '1', name: 'Classic Haircut', price: 45, duration: 45, description: 'Traditional haircut with scissors', isActive: true },
    { id: '2', name: 'Fade Cut', price: 55, duration: 60, description: 'Modern fade with precision', isActive: true },
    { id: '3', name: 'Beard Trim', price: 25, duration: 30, description: 'Professional beard grooming', isActive: true },
    { id: '4', name: 'Hair Coloring', price: 120, duration: 120, description: 'Full hair coloring service', isActive: true },
    { id: '5', name: 'Kids Haircut', price: 35, duration: 30, description: 'Haircut for children under 12', isActive: true },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration: '',
    description: '',
  });

  const handleAddService = () => {
    setEditingService(null);
    setFormData({ name: '', price: '', duration: '', description: '' });
    setModalVisible(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      price: service.price.toString(),
      duration: service.duration.toString(),
      description: service.description || '',
    });
    setModalVisible(true);
  };

  const handleSaveService = () => {
    // Validate
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Service name is required');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }
    if (!formData.duration || parseInt(formData.duration) <= 0) {
      Alert.alert('Error', 'Please enter a valid duration');
      return;
    }

    if (editingService) {
      // Update existing service
      setServices(services.map(s => 
        s.id === editingService.id 
          ? {
              ...s,
              name: formData.name,
              price: parseFloat(formData.price),
              duration: parseInt(formData.duration),
              description: formData.description,
            }
          : s
      ));
    } else {
      // Add new service
      const newService: Service = {
        id: Date.now().toString(),
        name: formData.name,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        description: formData.description,
        isActive: true,
      };
      setServices([...services, newService]);
    }

    setModalVisible(false);
  };

  const handleDeleteService = (service: Service) => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${service.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setServices(services.filter(s => s.id !== service.id));
          },
        },
      ]
    );
  };

  const handleToggleActive = (service: Service) => {
    setServices(services.map(s => 
      s.id === service.id ? { ...s, isActive: !s.isActive } : s
    ));
  };

  const activeServices = services.filter(s => s.isActive);
  const inactiveServices = services.filter(s => !s.isActive);
  const totalRevenue = services.reduce((sum, s) => s.isActive ? sum + s.price : sum, 0);
  const avgDuration = services.length > 0 
    ? Math.round(services.reduce((sum, s) => sum + s.duration, 0) / services.length)
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Services</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color={COLORS.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Manage Your Services</Text>
            <Text style={styles.infoText}>
              Add, edit, or remove services you offer. Set competitive prices and accurate durations.
            </Text>
          </View>
        </View>

        {/* Add Service Button */}
        <TouchableOpacity style={styles.addServiceCard} onPress={handleAddService}>
          <View style={styles.addIconContainer}>
            <Ionicons name="add" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.addServiceTitle}>Add New Service</Text>
          <Text style={styles.addServiceSubtitle}>Create a new service offering</Text>
        </TouchableOpacity>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activeServices.length}</Text>
            <Text style={styles.statLabel}>Active Services</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>RM {totalRevenue}</Text>
            <Text style={styles.statLabel}>Total Value</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{avgDuration}m</Text>
            <Text style={styles.statLabel}>Avg Duration</Text>
          </View>
        </View>

        {/* Active Services */}
        {activeServices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Services ({activeServices.length})</Text>
            <View style={styles.card}>
              {activeServices.map((service, index) => (
                <View key={service.id}>
                  <View style={styles.serviceRow}>
                    <View style={styles.serviceLeft}>
                      <View style={styles.serviceIcon}>
                        <Ionicons name="cut" size={20} color={COLORS.primary} />
                      </View>
                      <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName}>{service.name}</Text>
                        <Text style={styles.serviceDuration}>{service.duration} min</Text>
                        {service.description && (
                          <Text style={styles.serviceDescription} numberOfLines={1}>
                            {service.description}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.serviceRight}>
                      <Text style={styles.servicePrice}>RM {service.price}</Text>
                      <View style={styles.serviceActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleToggleActive(service)}
                        >
                          <Ionicons name="eye-off-outline" size={18} color={COLORS.text.secondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleEditService(service)}
                        >
                          <Ionicons name="create-outline" size={18} color={COLORS.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleDeleteService(service)}
                        >
                          <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                  {index < activeServices.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Inactive Services */}
        {inactiveServices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inactive Services ({inactiveServices.length})</Text>
            <View style={styles.card}>
              {inactiveServices.map((service, index) => (
                <View key={service.id}>
                  <View style={styles.serviceRow}>
                    <View style={styles.serviceLeft}>
                      <View style={[styles.serviceIcon, styles.inactiveIcon]}>
                        <Ionicons name="cut" size={20} color={COLORS.text.tertiary} />
                      </View>
                      <View style={styles.serviceInfo}>
                        <Text style={[styles.serviceName, styles.inactiveText]}>{service.name}</Text>
                        <Text style={styles.serviceDuration}>{service.duration} min</Text>
                      </View>
                    </View>
                    <View style={styles.serviceRight}>
                      <Text style={[styles.servicePrice, styles.inactiveText]}>RM {service.price}</Text>
                      <View style={styles.serviceActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleToggleActive(service)}
                        >
                          <Ionicons name="eye-outline" size={18} color={COLORS.success} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleDeleteService(service)}
                        >
                          <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                  {index < inactiveServices.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {services.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="cut-outline" size={64} color={COLORS.text.tertiary} />
            <Text style={styles.emptyStateTitle}>No Services Yet</Text>
            <Text style={styles.emptyStateText}>
              Add your first service to start accepting bookings
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Add/Edit Service Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingService ? 'Edit Service' : 'Add Service'}
            </Text>
            <TouchableOpacity onPress={handleSaveService}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Service Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Classic Haircut"
                placeholderTextColor={COLORS.text.tertiary}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.label}>Price (RM) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.text.tertiary}
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.label}>Duration (min) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="30"
                  placeholderTextColor={COLORS.text.tertiary}
                  value={formData.duration}
                  onChangeText={(text) => setFormData({ ...formData, duration: text })}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe this service..."
                placeholderTextColor={COLORS.text.tertiary}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.tipCard}>
              <Ionicons name="bulb-outline" size={20} color={COLORS.warning} />
              <Text style={styles.tipText}>
                Set competitive prices and realistic durations to attract more customers.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    ...TYPOGRAPHY.heading.h2,
    color: COLORS.text.primary,
  },
  headerRight: {
    width: 32,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 16,
    margin: 20,
    marginBottom: 16,
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  addServiceCard: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  addIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  addServiceTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  addServiceSubtitle: {
    ...TYPOGRAPHY.body.regular,
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
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.primary,
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
  sectionTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    padding: 16,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  serviceLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveIcon: {
    backgroundColor: COLORS.background.tertiary,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  serviceDuration: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
  },
  serviceDescription: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.tertiary,
    marginTop: 2,
  },
  serviceRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  servicePrice: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.primary,
  },
  serviceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  inactiveText: {
    color: COLORS.text.tertiary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border.light,
  },
  emptyState: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    padding: 48,
    marginHorizontal: 20,
    alignItems: 'center',
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
  bottomSpacer: {
    height: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  modalCancelText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
  },
  modalTitle: {
    ...TYPOGRAPHY.heading.h2,
    color: COLORS.text.primary,
  },
  modalSaveText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroupHalf: {
    flex: 1,
  },
  label: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    ...TYPOGRAPHY.body.regular,
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    color: COLORS.text.primary,
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.warningLight,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  tipText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
    flex: 1,
  },
});
