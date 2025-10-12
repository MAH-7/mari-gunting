import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { addressService, CustomerAddress, AddAddressParams } from '@mari-gunting/shared/services/addressService';
import { useStore } from '@/store/useStore';

export default function AddressesScreen() {
  const currentUser = useStore((state) => state.currentUser);
  const queryClient = useQueryClient();
  const params = useLocalSearchParams();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [wasOpenForMapPicker, setWasOpenForMapPicker] = useState(false);

  // Handle return from map picker
  useEffect(() => {
    if (params.selectedAddress && params.selectedLatitude && params.selectedLongitude) {
      // Open the modal when coming back from map picker
      setShowAddModal(true);
      setWasOpenForMapPicker(false);
    }
  }, [params.selectedAddress, params.selectedLatitude, params.selectedLongitude]);

  // Fetch addresses
  const { data: response, isLoading } = useQuery({
    queryKey: ['customer-addresses', currentUser?.id],
    queryFn: () => addressService.getCustomerAddresses(currentUser?.id!),
    enabled: !!currentUser?.id,
  });

  const addresses = response?.data || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (addressId: string) => addressService.deleteAddress(addressId, currentUser?.id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
      Alert.alert('Success', 'Address deleted successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete address');
    },
  });

  // Set default mutation
  const setDefaultMutation = useMutation({
    mutationFn: (addressId: string) =>
      addressService.setDefaultAddress(currentUser?.id!, addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to set default address');
    },
  });

  const handleDelete = (address: CustomerAddress) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(address.id),
        },
      ]
    );
  };

  const handleSetDefault = (address: CustomerAddress) => {
    if (address.is_default) return;
    setDefaultMutation.mutate(address.id);
  };

  const handleEdit = (address: CustomerAddress) => {
    setEditingAddress(address);
    setShowAddModal(true);
  };

  const handleAddNew = () => {
    setEditingAddress(null);
    setShowAddModal(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Addresses</Text>
        <TouchableOpacity onPress={handleAddNew} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#00B14F" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading addresses...</Text>
          </View>
        ) : addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Addresses</Text>
            <Text style={styles.emptySubtext}>
              Add your first address to get started
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddNew}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Add Address</Text>
            </TouchableOpacity>
          </View>
        ) : (
          addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onSetDefault={() => handleSetDefault(address)}
              onEdit={() => handleEdit(address)}
              onDelete={() => handleDelete(address)}
            />
          ))
        )}
      </ScrollView>

      {/* Add/Edit Address Modal */}
      <AddressFormModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingAddress(null);
        }}
        onMapPickerOpen={() => {
          setWasOpenForMapPicker(true);
        }}
        address={editingAddress}
        userId={currentUser?.id!}
      />
    </SafeAreaView>
  );
}

function AddressCard({
  address,
  onSetDefault,
  onEdit,
  onDelete,
}: {
  address: CustomerAddress;
  onSetDefault: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.addressCard}>
      {/* Header */}
      <View style={styles.addressHeader}>
        <View style={styles.addressHeaderLeft}>
          <Ionicons name="location" size={20} color="#00B14F" />
          <Text style={styles.addressLabel}>{address.label}</Text>
        </View>
        {address.is_default && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultBadgeText}>Default</Text>
          </View>
        )}
      </View>

      {/* Address Text */}
      <Text style={styles.addressText}>
        {address.address_line1}
        {address.address_line2 && `, ${address.address_line2}`}
      </Text>
      <Text style={styles.addressCity}>
        {address.city}, {address.state} {address.postal_code}
      </Text>

      {/* Actions */}
      <View style={styles.addressActions}>
        {!address.is_default && (
          <TouchableOpacity style={styles.actionButton} onPress={onSetDefault}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#00B14F" />
            <Text style={styles.actionButtonText}>Set as Default</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
          <Ionicons name="create-outline" size={18} color="#6B7280" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
          <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AddressFormModal({
  visible,
  onClose,
  onMapPickerOpen,
  address,
  userId,
}: {
  visible: boolean;
  onClose: () => void;
  onMapPickerOpen: () => void;
  address: CustomerAddress | null;
  userId: string;
}) {
  const queryClient = useQueryClient();
  const params = useLocalSearchParams();
  const isEditing = !!address;
  const [isNavigating, setIsNavigating] = useState(false);
  const [shouldReopenModal, setShouldReopenModal] = useState(false);

  const [formData, setFormData] = useState<AddAddressParams>({
    userId,
    label: address?.label || '',
    addressLine1: address?.address_line1 || '',
    addressLine2: address?.address_line2 || '',
    city: address?.city || '',
    state: address?.state || '',
    postalCode: address?.postal_code || '',
    latitude: address?.latitude,
    longitude: address?.longitude,
    isDefault: address?.is_default || false,
  });

  // Listen for location selected from map picker
  useEffect(() => {
    if (params.selectedAddress && params.selectedLatitude && params.selectedLongitude) {
      handleLocationFromMap(
        params.selectedAddress as string,
        parseFloat(params.selectedLatitude as string),
        parseFloat(params.selectedLongitude as string)
      );
      
      // Clear params after processing
      router.setParams({
        selectedAddress: undefined,
        selectedLatitude: undefined,
        selectedLongitude: undefined,
      });
    }
  }, [params.selectedAddress, params.selectedLatitude, params.selectedLongitude]);

  // Add mutation
  const addMutation = useMutation({
    mutationFn: (params: AddAddressParams) => addressService.addCustomerAddress(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
      
      // Close modal
      onClose();
      
      // Clear map picker params
      router.setParams({
        selectedAddress: undefined,
        selectedLatitude: undefined,
        selectedLongitude: undefined,
      });
      
      // Show success message
      Alert.alert('Success', 'Address added successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to add address');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (params: { id: string; updates: Partial<AddAddressParams> }) =>
      addressService.updateAddress(params.id, params.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
      Alert.alert('Success', 'Address updated successfully');
      onClose();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update address');
    },
  });

  const handlePickLocationOnMap = () => {
    // Prevent multiple navigations
    if (isNavigating) return;
    
    setIsNavigating(true);
    
    // Notify parent that we're opening map picker
    onMapPickerOpen();
    
    // Close modal first, then navigate to map picker
    onClose();
    
    // Small delay to ensure modal closes smoothly
    setTimeout(() => {
      // Use replace to prevent duplicate addresses screen in stack
      router.replace('/profile/map-picker');
      setIsNavigating(false);
    }, 300);
  };

  const handleLocationFromMap = (address: string, latitude: number, longitude: number) => {
    // Parse address from map picker
    const parts = address.split(', ');
    
    let addressLine1 = '';
    let city = '';
    let state = '';
    let postalCode = '';

    // Try to extract components
    if (parts.length >= 3) {
      addressLine1 = parts[0] || '';
      city = parts[1] || '';
      
      // Third part might have state and postal code
      const statePostal = parts[2] || '';
      const statePostalMatch = statePostal.match(/^(.*?)\s+(\d{5,6})$/);
      
      if (statePostalMatch) {
        state = statePostalMatch[1] || '';
        postalCode = statePostalMatch[2] || '';
      } else {
        state = statePostal;
        // Try to find postal code in the string
        const postalMatch = address.match(/\b(\d{5,6})\b/);
        if (postalMatch) {
          postalCode = postalMatch[1];
        }
      }
    } else if (address) {
      // If parsing fails, use the full address
      addressLine1 = address;
    }

    setFormData({
      ...formData,
      addressLine1: addressLine1 || address,
      city: city || '',
      state: state || '',
      postalCode: postalCode || '',
      latitude: latitude,  // ✅ Save latitude
      longitude: longitude, // ✅ Save longitude
    });

    Alert.alert(
      'Location Selected',
      'Please review and edit the address details if needed.',
      [{ text: 'OK' }]
    );
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.label || !formData.addressLine1 || !formData.city || !formData.state) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (isEditing) {
      updateMutation.mutate({ id: address!.id, updates: formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {isEditing ? 'Edit Address' : 'Add Address'}
          </Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={addMutation.isPending || updateMutation.isPending}
          >
            <Text style={styles.modalSaveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
          {/* Pick location on map button */}
          {!isEditing && (
            <TouchableOpacity
              style={[styles.detectButton, isNavigating && styles.detectButtonDisabled]}
              onPress={handlePickLocationOnMap}
              disabled={isNavigating}
              activeOpacity={0.7}
            >
              <Ionicons name="map" size={20} color="#FFFFFF" />
              <Text style={styles.detectButtonText}>
                {isNavigating ? 'Opening Map...' : 'Pick Location on Map'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Label */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Label *</Text>
            <TextInput
              style={styles.formInput}
              value={formData.label}
              onChangeText={(text) => setFormData({ ...formData, label: text })}
              placeholder="e.g. Home, Office, etc."
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Address Line 1 */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Address Line 1 *</Text>
            <TextInput
              style={styles.formInput}
              value={formData.addressLine1}
              onChangeText={(text) => setFormData({ ...formData, addressLine1: text })}
              placeholder="Street address"
              placeholderTextColor="#9CA3AF"
              multiline
            />
          </View>

          {/* Address Line 2 */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Address Line 2</Text>
            <TextInput
              style={styles.formInput}
              value={formData.addressLine2}
              onChangeText={(text) => setFormData({ ...formData, addressLine2: text })}
              placeholder="Apartment, suite, etc. (optional)"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* City & State */}
          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.formLabel}>City *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
                placeholder="City"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.formLabel}>State *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.state}
                onChangeText={(text) => setFormData({ ...formData, state: text })}
                placeholder="State"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Postal Code */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Postal Code</Text>
            <TextInput
              style={styles.formInput}
              value={formData.postalCode}
              onChangeText={(text) => setFormData({ ...formData, postalCode: text })}
              placeholder="Postal code"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
          </View>

          {/* Set as Default */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
          >
            <View style={[styles.checkbox, formData.isDefault && styles.checkboxChecked]}>
              {formData.isDefault && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </View>
            <Text style={styles.checkboxLabel}>Set as default address</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: '#6B7280',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  emptySubtext: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#00B14F',
    borderRadius: 12,
    marginTop: 16,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  defaultBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00B14F',
  },
  addressText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
    marginBottom: 4,
  },
  addressCity: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  addressActions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00B14F',
  },
  modalScroll: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  formRow: {
    flexDirection: 'row',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#00B14F',
    borderColor: '#00B14F',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#111827',
  },
  detectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00B14F',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  detectButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.7,
  },
});
