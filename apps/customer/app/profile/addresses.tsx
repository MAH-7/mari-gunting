import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { addressService, CustomerAddress } from '@mari-gunting/shared/services/addressService';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { Colors, theme } from '@mari-gunting/shared/theme';

export default function AddressesScreen() {
  const currentUser = useStore((state) => state.currentUser);
  const queryClient = useQueryClient();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

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
    router.push('/profile/map-picker');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>My Addresses</Text>
          {addresses.length > 0 && (
            <Text style={styles.headerSubtitle}>{addresses.length} saved</Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="location-outline" size={48} color={Colors.gray[300]} />
            <Text style={styles.loadingText}>Loading addresses...</Text>
          </View>
        ) : addresses.length === 0 ? (
          <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="location" size={56} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Saved Addresses</Text>
            <Text style={styles.emptySubtext}>
              Add your home, work, or favorite locations{' \n'}for faster booking
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton} 
              onPress={handleAddNew}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={22} color={Colors.white} />
              <Text style={styles.emptyButtonText}>Add New Address</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {addresses.map((address, index) => (
              <AddressCard
                key={address.id}
                address={address}
                onSetDefault={() => handleSetDefault(address)}
                onEdit={() => handleEdit(address)}
                onDelete={() => handleDelete(address)}
                index={index}
              />
            ))}
            
            {/* Add New Address Card */}
            <TouchableOpacity 
              style={styles.addNewCard} 
              onPress={handleAddNew}
              activeOpacity={0.7}
            >
              <View style={styles.addNewIconContainer}>
                <Ionicons name="add" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.addNewText}>Add New Address</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
            </TouchableOpacity>
          </Animated.View>
        )}
        
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function AddressCard({
  address,
  onSetDefault,
  onEdit,
  onDelete,
  index,
}: {
  address: CustomerAddress;
  onSetDefault: () => void;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
}) {
  // Icon based on label
  const getIconName = () => {
    const label = address.label.toLowerCase();
    if (label.includes('home')) return 'home';
    if (label.includes('work') || label.includes('office')) return 'briefcase';
    return 'location';
  };
  
  const iconName = getIconName();

  const CardContent = (
    <>
      <View style={styles.cardTop}>
        {/* Icon and Label */}
        <View style={styles.cardTopLeft}>
          <View style={[styles.iconCircle, address.is_default && styles.iconCircleDefault]}>
            <Ionicons 
              name={iconName as any} 
              size={18} 
              color={address.is_default ? Colors.white : Colors.primary} 
            />
          </View>
          <View style={styles.labelContainer}>
            <Text style={styles.addressLabel}>{address.label}</Text>
            {address.is_default && (
              <View style={styles.defaultBadgeInline}>
                <Ionicons name="star" size={12} color={Colors.warning} />
                <Text style={styles.defaultBadgeText}>Default</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Full Address */}
      <View style={styles.addressContent}>
        <Text style={styles.addressTextMain} numberOfLines={1}>
          {address.address_line1}
        </Text>
        <Text style={styles.addressTextSecondary} numberOfLines={1}>
          {[
            address.address_line2,
            address.city,
            address.state,
            address.postal_code
          ].filter(Boolean).join(', ')}
        </Text>
      </View>

      {/* Actions Bottom */}
      <View style={styles.cardActions}>
        {!address.is_default && (
          <TouchableOpacity 
            style={styles.cardActionButton}
            onPress={onSetDefault}
            activeOpacity={0.7}
          >
            <Ionicons name="star-outline" size={16} color={Colors.gray[500]} />
            <Text style={styles.cardActionText}>Set Default</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={styles.cardActionButton}
          onPress={onEdit}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={16} color={Colors.gray[500]} />
          <Text style={styles.cardActionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.cardActionButton}
          onPress={onDelete}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={16} color={Colors.error} />
          <Text style={[styles.cardActionText, { color: Colors.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </>
  );

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
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.gray[200],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#8E8E93',
  },
  emptyState: {
    paddingVertical: 80,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 15,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  addressCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  // Card Top Section
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primaryBorder,
  },
  iconCircleDefault: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  labelContainer: {
    flex: 1,
    paddingTop: 0,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  defaultBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.warning,
  },
  // Address Content
  addressContent: {
    paddingLeft: 46, // Icon size + gap
    marginBottom: 10,
  },
  addressTextMain: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray[700],
    lineHeight: 19,
    marginBottom: 3,
  },
  addressTextSecondary: {
    fontSize: 13,
    color: Colors.gray[400],
    lineHeight: 17,
  },
  // Card Actions
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    paddingTop: 10,
    marginTop: 2,
    gap: 6,
  },
  cardActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray[500],
  },
  // Add New Card
  addNewCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addNewIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNewText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[500],
  },
});
