import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { useStore } from '@/store/useStore';
import { serviceService, Service as ServiceType } from '@mari-gunting/shared';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
  isActive: boolean;
  isPopular: boolean;
}

export default function ServicesManagementScreen() {
  const router = useRouter();
  const currentUser = useStore((state) => state.currentUser);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration: '',
    description: '',
    category: '',
  });

  // Categories for filtering
  const categories = ['Haircut', 'Beard', 'Styling', 'Coloring', 'Treatment', 'Other'];

  // Filter services based on search and category
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || service.description?.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  // Load services on mount
  useEffect(() => {
    loadServices();
  }, [currentUser]);

  const loadServices = async () => {
    if (!currentUser?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await serviceService.getMyServices(currentUser.id);
      
      // Convert from Supabase format to local format
      const mappedServices: Service[] = data.map((s: ServiceType) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        duration: s.duration_minutes,
        description: s.description || undefined,
        isActive: s.is_active,
        isPopular: s.is_popular,
      }));
      
      setServices(mappedServices);
    } catch (error) {
      console.error('Error loading services:', error);
      Alert.alert('Error', 'Failed to load services');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddService = () => {
    setEditingService(null);
    setFormData({ name: '', price: '', duration: '', description: '', category: '' });
    setModalVisible(true);
  };

  const handleQuickAdd = (serviceName: string, price: number, duration: number, category: string) => {
    setEditingService(null);
    setFormData({ 
      name: serviceName, 
      price: price.toString(), 
      duration: duration.toString(), 
      description: '',
      category 
    });
    setModalVisible(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      price: service.price.toString(),
      duration: service.duration.toString(),
      description: service.description || '',
      category: '', // We'll extract from description if needed
    });
    setModalVisible(true);
  };

  const handleSaveService = async () => {
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

    if (!currentUser?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    try {
      setIsSaving(true);

      if (editingService) {
        // Update existing service
        await serviceService.updateService(editingService.id, {
          name: formData.name,
          price: parseFloat(formData.price),
          duration_minutes: parseInt(formData.duration),
          description: formData.description || undefined,
        });
      } else {
        // Add new service
        await serviceService.createMyService(currentUser.id, {
          name: formData.name,
          price: parseFloat(formData.price),
          duration_minutes: parseInt(formData.duration),
          description: formData.description || undefined,
        });
      }

      // Reload services
      await loadServices();
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving service:', error);
      Alert.alert('Error', 'Failed to save service');
    } finally {
      setIsSaving(false);
    }
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
          onPress: async () => {
            try {
              await serviceService.deleteService(service.id);
              await loadServices();
            } catch (error) {
              console.error('Error deleting service:', error);
              Alert.alert('Error', 'Failed to delete service');
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (service: Service) => {
    try {
      await serviceService.toggleServiceActive(service.id, !service.isActive);
      await loadServices();
    } catch (error) {
      console.error('Error toggling service:', error);
      Alert.alert('Error', 'Failed to update service status');
    }
  };

  const handleTogglePopular = async (service: Service) => {
    try {
      await serviceService.toggleServicePopular(service.id, !service.isPopular);
      await loadServices();
    } catch (error) {
      console.error('Error toggling popular:', error);
      Alert.alert('Error', 'Failed to update service popularity');
    }
  };

  const activeServices = filteredServices.filter(s => s.isActive);
  const inactiveServices = filteredServices.filter(s => !s.isActive);
  const totalActiveServices = services.filter(s => s.isActive).length;
  const totalPopularServices = services.filter(s => s.isPopular).length;
  
  // Calculate price range
  const prices = services.map(s => s.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const priceRange = prices.length > 0 
    ? (minPrice === maxPrice ? `RM ${minPrice}` : `RM ${minPrice}-${maxPrice}`)
    : 'RM 0';
  
  // Calculate time range
  const durations = services.map(s => s.duration);
  const minDuration = durations.length > 0 ? Math.min(...durations) : 0;
  const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;
  const timeRange = durations.length > 0
    ? (minDuration === maxDuration ? `${minDuration}m` : `${minDuration}-${maxDuration}m`)
    : '0m';

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Services</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      </SafeAreaView>
    );
  }

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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Search Bar */}
        {services.length > 0 && (
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={COLORS.text.tertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search services..."
                placeholderTextColor={COLORS.text.tertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={COLORS.text.tertiary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Stats - Improved */}
        {services.length > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statCardLarge}>
              <View style={styles.statIconContainer}>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>{totalActiveServices}</Text>
                <Text style={styles.statLabel}>Active Services</Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={styles.statCardSmall}>
                <Ionicons name="star" size={20} color="#FFA500" />
                <Text style={styles.statValueSmall}>{totalPopularServices}</Text>
                <Text style={styles.statLabelSmall}>Popular</Text>
              </View>
              <View style={styles.statCardSmall}>
                <Ionicons name="cash-outline" size={20} color={COLORS.primary} />
                <Text style={styles.statValueSmall}>{priceRange}</Text>
                <Text style={styles.statLabelSmall}>Price Range</Text>
              </View>
              <View style={styles.statCardSmall}>
                <Ionicons name="time-outline" size={20} color={COLORS.warning} />
                <Text style={styles.statValueSmall}>{timeRange}</Text>
                <Text style={styles.statLabelSmall}>Duration</Text>
              </View>
            </View>
          </View>
        )}

        {/* Active Services - Redesigned */}
        {activeServices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Services</Text>
            {activeServices.map((service) => (
              <View key={service.id} style={styles.serviceCard}>
                <View style={styles.serviceCardHeader}>
                  <View style={styles.serviceCardLeft}>
                    <View style={styles.serviceIconNew}>
                      <Ionicons name="cut" size={24} color={COLORS.primary} />
                    </View>
                    <View style={styles.serviceCardInfo}>
                      <View style={styles.serviceNameRow}>
                        <Text style={styles.serviceNameNew}>{service.name}</Text>
                        {service.isPopular && (
                          <View style={styles.popularBadge}>
                            <Ionicons name="star" size={12} color="#FFA500" />
                            <Text style={styles.popularBadgeText}>Popular</Text>
                          </View>
                        )}
                      </View>
                      {service.description && (
                        <Text style={styles.serviceDescriptionNew} numberOfLines={2}>
                          {service.description}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
                
                <View style={styles.serviceCardMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={16} color={COLORS.text.secondary} />
                    <Text style={styles.metaText}>{service.duration} min</Text>
                  </View>
                  <View style={styles.metaDivider} />
                  <View style={styles.metaItem}>
                    <Ionicons name="cash-outline" size={16} color={COLORS.text.secondary} />
                    <Text style={styles.metaText}>RM {service.price.toFixed(2)}</Text>
                  </View>
                </View>

                <View style={styles.serviceCardFooter}>
                  <TouchableOpacity 
                    style={styles.serviceActionBtn}
                    onPress={() => handleTogglePopular(service)}
                  >
                    <Ionicons 
                      name={service.isPopular ? "star" : "star-outline"} 
                      size={18} 
                      color={service.isPopular ? "#FFA500" : COLORS.text.secondary} 
                    />
                    <Text style={[styles.serviceActionText, service.isPopular && { color: "#FFA500" }]}>
                      {service.isPopular ? 'Popular' : 'Mark'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.serviceActionBtn}
                    onPress={() => handleEditService(service)}
                  >
                    <Ionicons name="create-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.serviceActionText}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.serviceActionBtn}
                    onPress={() => handleToggleActive(service)}
                  >
                    <Ionicons name="eye-off-outline" size={18} color={COLORS.text.secondary} />
                    <Text style={[styles.serviceActionText, { color: COLORS.text.secondary }]}>Hide</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.serviceActionBtn}
                    onPress={() => handleDeleteService(service)}
                  >
                    <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                    <Text style={[styles.serviceActionText, { color: COLORS.error }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Inactive Services - Simplified */}
        {inactiveServices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hidden Services</Text>
            {inactiveServices.map((service) => (
              <View key={service.id} style={[styles.serviceCard, styles.inactiveServiceCard]}>
                <View style={styles.inactiveServiceRow}>
                  <View style={styles.inactiveServiceInfo}>
                    <Text style={styles.inactiveServiceName}>{service.name}</Text>
                    <Text style={styles.inactiveServiceMeta}>
                      {service.duration} min • RM {service.price}
                    </Text>
                  </View>
                  <View style={styles.inactiveActions}>
                    <TouchableOpacity 
                      style={styles.inactiveActionBtn}
                      onPress={() => handleToggleActive(service)}
                    >
                      <Ionicons name="eye-outline" size={20} color={COLORS.success} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.inactiveActionBtn}
                      onPress={() => handleDeleteService(service)}
                    >
                      <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty State with Quick Add Suggestions */}
        {services.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateHeader}>
              <Ionicons name="cut-outline" size={64} color={COLORS.primary} />
              <Text style={styles.emptyStateTitle}>Let's Add Your Services</Text>
              <Text style={styles.emptyStateText}>
                Start with popular services or create your own
              </Text>
            </View>

            <Text style={styles.quickAddTitle}>Popular Services</Text>
            <View style={styles.quickAddGrid}>
              <TouchableOpacity 
                style={styles.quickAddCard}
                onPress={() => handleQuickAdd('Classic Haircut', 45, 45, 'Haircut')}
              >
                <Ionicons name="cut" size={24} color={COLORS.primary} />
                <Text style={styles.quickAddName}>Classic Haircut</Text>
                <Text style={styles.quickAddPrice}>RM 45 • 45 min</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickAddCard}
                onPress={() => handleQuickAdd('Fade Cut', 55, 60, 'Haircut')}
              >
                <Ionicons name="cut" size={24} color={COLORS.primary} />
                <Text style={styles.quickAddName}>Fade Cut</Text>
                <Text style={styles.quickAddPrice}>RM 55 • 60 min</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickAddCard}
                onPress={() => handleQuickAdd('Beard Trim', 25, 30, 'Beard')}
              >
                <Ionicons name="cut" size={24} color={COLORS.primary} />
                <Text style={styles.quickAddName}>Beard Trim</Text>
                <Text style={styles.quickAddPrice}>RM 25 • 30 min</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickAddCard}
                onPress={() => handleQuickAdd('Hair Coloring', 120, 120, 'Coloring')}
              >
                <Ionicons name="color-palette" size={24} color={COLORS.primary} />
                <Text style={styles.quickAddName}>Hair Coloring</Text>
                <Text style={styles.quickAddPrice}>RM 120 • 2h</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.emptyStateButton} onPress={handleAddService}>
              <Ionicons name="add-circle-outline" size={20} color="#FFF" />
              <Text style={styles.emptyStateButtonText}>Create Custom Service</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Floating Action Button */}
      {services.length > 0 && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={handleAddService}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      )}

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
            <TouchableOpacity onPress={handleSaveService} disabled={isSaving}>
              <Text style={[styles.modalSaveText, isSaving && styles.disabledText]}>
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
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
  scrollContent: {
    paddingBottom: 100,
  },
  // Search Bar
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.primary,
  },
  // Stats - New Design
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCardLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${COLORS.success}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    ...TYPOGRAPHY.heading.h1,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCardSmall: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  statValueSmall: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  statLabelSmall: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontSize: 11,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  // Service Cards - New Modern Design
  serviceCard: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceCardHeader: {
    marginBottom: 16,
  },
  serviceCardLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  serviceIconNew: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceCardInfo: {
    flex: 1,
  },
  serviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  serviceNameNew: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  popularBadgeText: {
    ...TYPOGRAPHY.body.small,
    color: '#FFA500',
    fontWeight: '600',
    fontSize: 11,
  },
  serviceDescriptionNew: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  serviceCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border.light,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaDivider: {
    width: 1,
    height: 16,
    backgroundColor: COLORS.border.light,
    marginHorizontal: 16,
  },
  metaText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
  },
  serviceCardFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  serviceActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.background.secondary,
    gap: 6,
  },
  serviceActionText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.primary,
    fontWeight: '600',
  },
  // Inactive Services
  inactiveServiceCard: {
    opacity: 0.6,
  },
  inactiveServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inactiveServiceInfo: {
    flex: 1,
  },
  inactiveServiceName: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  inactiveServiceMeta: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
  },
  inactiveActions: {
    flexDirection: 'row',
    gap: 12,
  },
  inactiveActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Empty State with Quick Add
  emptyStateContainer: {
    paddingHorizontal: 20,
  },
  emptyStateHeader: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    ...TYPOGRAPHY.heading.h2,
    color: COLORS.text.primary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  quickAddTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  quickAddGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  quickAddCard: {
    width: '48%',
    backgroundColor: COLORS.background.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  quickAddName: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  quickAddPrice: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
  },
  emptyStateButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyStateButtonText: {
    ...TYPOGRAPHY.body.large,
    color: '#FFF',
    fontWeight: '600',
  },
  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomSpacer: {
    height: 80,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
    marginTop: 16,
  },
  disabledText: {
    opacity: 0.5,
  },
});
