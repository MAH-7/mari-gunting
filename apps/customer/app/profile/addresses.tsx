import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { addressService, CustomerAddress } from '@mari-gunting/shared/services/addressService';
import { useStore } from '@/store/useStore';
import { useBookingIfActive } from '@/contexts/BookingContext';

export default function AddressesScreen() {
  const currentUser = useStore((state) => state.currentUser);
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ fromBooking?: string }>();
  
  // Check if we're in booking flow via explicit param
  const booking = useBookingIfActive();
  const isFromBooking = params.fromBooking === 'true' && !!booking;

  // Option C: No need to handle return from map - it all happens there!

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
    // Option C: Navigate to map with existing coordinates
    router.push({
      pathname: '/profile/map-picker',
      params: {
        latitude: address.latitude.toString(),
        longitude: address.longitude.toString(),
        addressId: address.id,
        addressData: JSON.stringify(address),
      },
    });
  };

  const handleAddNew = () => {
    // Option C: Go to map picker (no special params needed!)
    router.push('/profile/map-picker');
  };

  const handleSelectAddress = (address: CustomerAddress) => {
    if (booking) {
      // We're in booking flow - use context!
      const fullAddress = [
        address.address_line1,
        address.address_line2,
        address.city,
        address.state,
        address.postal_code
      ].filter(Boolean).join(', ');
      
      booking.setSelectedAddress({
        id: address.id,
        label: address.label,
        fullAddress: fullAddress,
        latitude: address.latitude,
        longitude: address.longitude,
      });
      
      // Return to booking (clean!)
      booking.returnToBooking();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isFromBooking ? 'Select Address' : 'My Addresses'}
        </Text>
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
              onSelect={isFromBooking ? () => handleSelectAddress(address) : undefined}
              isFromBooking={isFromBooking}
            />
          ))
        )}
      </ScrollView>

      {/* Option C: No modal needed! Everything happens on map screen */}
    </SafeAreaView>
  );
}

function AddressCard({
  address,
  onSetDefault,
  onEdit,
  onDelete,
  onSelect,
  isFromBooking,
}: {
  address: CustomerAddress;
  onSetDefault: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSelect?: () => void;
  isFromBooking?: boolean;
}) {
  const [showActions, setShowActions] = useState(false);

  const CardContent = (
    <>
      {/* Header */}
      <View style={styles.addressHeader}>
        <View style={styles.addressHeaderLeft}>
          <View style={styles.locationIconContainer}>
            <Ionicons name="location" size={18} color="#00B14F" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addressLabel}>{address.label}</Text>
          </View>
        </View>
        {address.is_default && (
          <View style={styles.defaultBadge}>
            <Ionicons name="star" size={10} color="#00B14F" />
            <Text style={styles.defaultBadgeText}>Default</Text>
          </View>
        )}
      </View>

      {/* Address Text */}
      <View style={styles.addressDetailsContainer}>
        <Text style={styles.addressText} numberOfLines={2}>
          {address.address_line1}
          {address.address_line2 && `, ${address.address_line2}`}
        </Text>
        <Text style={styles.addressCity}>
          {address.city}, {address.state} {address.postal_code}
        </Text>
      </View>

      {/* Actions */}
      {isFromBooking ? (
        <View style={styles.selectContainer}>
          <View style={styles.selectDivider} />
          <View style={styles.selectRow}>
            <Text style={styles.selectHintText}>Tap to select</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>
        </View>
      ) : (
        <View style={styles.addressActions}>
          <View style={styles.actionsDivider} />
          <View style={styles.actionsRow}>
            {!address.is_default && (
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={onSetDefault}
                activeOpacity={0.6}
              >
                <Ionicons name="star-outline" size={20} color="#00B14F" />
                <Text style={[styles.actionButtonText, { color: '#00B14F' }]}>Default</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={onEdit}
              activeOpacity={0.6}
            >
              <Ionicons name="create-outline" size={20} color="#6B7280" />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={onDelete}
              activeOpacity={0.6}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );

  // In booking mode, make entire card tappable
  if (isFromBooking) {
    return (
      <TouchableOpacity 
        style={styles.addressCard} 
        onPress={onSelect}
        activeOpacity={0.7}
      >
        {CardContent}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.addressCard}>
      {CardContent}
    </View>
  );
}

// Option C: AddressFormModal removed - everything happens on map screen now!

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
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  addressHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  locationIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
    marginTop: 6,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00B14F',
    letterSpacing: 0.3,
  },
  addressDetailsContainer: {
    marginLeft: 42, // Align with label (icon width + gap)
    marginBottom: 14,
  },
  addressText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 4,
  },
  addressCity: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  // Booking mode - Selection UI
  selectContainer: {
    marginTop: 4,
  },
  selectDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  selectHintText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00B14F',
  },
  // Management mode - Actions
  addressActions: {
    marginTop: 4,
  },
  actionsDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  // Option C: All form/modal styles moved to AddressFormBottomSheet component
});
