import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, theme } from '@mari-gunting/shared/theme';
import {
  addressService,
  AddAddressParams,
  CustomerAddress,
} from '@mari-gunting/shared/services/addressService';

export type AddressFormMode = 'add' | 'edit';

export interface AddressFormBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (createdOrUpdated: CustomerAddress) => void;
  mode: AddressFormMode;
  userId: string;
  // Coordinates are required and locked from map
  latitude: number;
  longitude: number;
  // For add flow: optional address string from reverse-geocode to prefill
  initialAddressString?: string;
  // For edit flow: existing address fields
  addressToEdit?: CustomerAddress;
}

function parseAddressParts(address: string | undefined) {
  if (!address) {
    return { a1: '', city: '', state: '', postalCode: '' };
  }
  const parts = address.split(', ');
  let a1 = '';
  let city = '';
  let state = '';
  let postalCode = '';

  if (parts.length >= 3) {
    a1 = parts[0] || '';
    city = parts[1] || '';
    const statePostal = parts[2] || '';
    const statePostalMatch = statePostal.match(/^(.*?)\s+(\d{5,6})$/);
    if (statePostalMatch) {
      state = statePostalMatch[1] || '';
      postalCode = statePostalMatch[2] || '';
    } else {
      state = statePostal;
      const postalMatch = address.match(/\b(\d{5,6})\b/);
      if (postalMatch) {
        postalCode = postalMatch[1];
      }
    }
  } else {
    a1 = address;
  }

  return { a1, city, state, postalCode };
}

export default function AddressFormBottomSheet(props: AddressFormBottomSheetProps) {
  const { visible, onClose, onSuccess, mode, userId, latitude, longitude, initialAddressString, addressToEdit } = props;
  const queryClient = useQueryClient();

  const initialPrefill = useMemo(() => {
    if (mode === 'edit' && addressToEdit) {
      return {
        label: addressToEdit.label || '',
        addressLine1: addressToEdit.address_line1 || '',
        addressLine2: addressToEdit.address_line2 || '',
        city: addressToEdit.city || '',
        state: addressToEdit.state || '',
        postalCode: addressToEdit.postal_code || '',
        isDefault: !!addressToEdit.is_default,
      };
    }
    const parsed = parseAddressParts(initialAddressString);
    return {
      label: '',
      addressLine1: parsed.a1,
      addressLine2: '',
      city: parsed.city,
      state: parsed.state,
      postalCode: parsed.postalCode,
      isDefault: false,
    };
  }, [mode, addressToEdit, initialAddressString]);

  const [formData, setFormData] = useState({
    label: initialPrefill.label,
    addressLine1: initialPrefill.addressLine1,
    addressLine2: initialPrefill.addressLine2,
    city: initialPrefill.city,
    state: initialPrefill.state,
    postalCode: initialPrefill.postalCode,
    isDefault: initialPrefill.isDefault,
  });

  useEffect(() => {
    // Reset when becoming visible or props change
    setFormData({
      label: initialPrefill.label,
      addressLine1: initialPrefill.addressLine1,
      addressLine2: initialPrefill.addressLine2,
      city: initialPrefill.city,
      state: initialPrefill.state,
      postalCode: initialPrefill.postalCode,
      isDefault: initialPrefill.isDefault,
    });
  }, [visible, initialPrefill]);

  const addMutation = useMutation({
    mutationFn: (params: AddAddressParams) => addressService.addCustomerAddress(params),
    onSuccess: (resp) => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
      onSuccess(resp.data);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to add address');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (input: { id: string; updates: Partial<AddAddressParams> }) =>
      addressService.updateAddress(input.id, input.updates),
    onSuccess: (resp) => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
      onSuccess(resp.data);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update address');
    }
  });

  const handleSave = () => {
    if (!formData.label || !formData.addressLine1 || !formData.city || !formData.state) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (!latitude || !longitude) {
      Alert.alert('Error', 'Location coordinates are missing. Please adjust your pin and try again.');
      return;
    }

    if (mode === 'edit' && addressToEdit) {
      updateMutation.mutate({
        id: addressToEdit.id,
        updates: {
          userId,
          label: formData.label,
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          latitude,
          longitude,
          isDefault: formData.isDefault,
        },
      });
    } else {
      addMutation.mutate({
        userId,
        label: formData.label,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        latitude,
        longitude,
        isDefault: formData.isDefault,
      });
    }
  };

  const saving = addMutation.isPending || updateMutation.isPending;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.scrim} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetContainer}
        >
          <View style={styles.sheet}>
            <ScrollView 
              contentContainerStyle={styles.sheetContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
          {/* Grab handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{mode === 'edit' ? 'Edit Address' : 'Add Address'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={Colors.gray[500]} />
            </TouchableOpacity>
          </View>

          {/* Coordinates banner */}
          <View style={styles.coordsBanner}>
            <Ionicons name="location" size={18} color={Colors.primary} />
            <Text style={styles.coordsText}>
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </Text>
            <View style={styles.coordsSpacer} />
            <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
            <Text style={styles.coordsOk}>Locked from map</Text>
          </View>

          {/* Form */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Label *</Text>
            <TextInput
              style={styles.input}
              value={formData.label}
              onChangeText={(t) => setFormData({ ...formData, label: t })}
              placeholder="e.g. Home, Office, etc."
              placeholderTextColor={Colors.gray[400]}             />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Address Line 1 *</Text>
            <TextInput
              style={styles.input}
              value={formData.addressLine1}
              onChangeText={(t) => setFormData({ ...formData, addressLine1: t })}
              placeholder="Street address"
              placeholderTextColor={Colors.gray[400]}               multiline
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Address Line 2</Text>
            <TextInput
              style={styles.input}
              value={formData.addressLine2}
              onChangeText={(t) => setFormData({ ...formData, addressLine2: t })}
              placeholder="Apartment, suite, etc. (optional)"
              placeholderTextColor={Colors.gray[400]}             />
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                value={formData.city}
                onChangeText={(t) => setFormData({ ...formData, city: t })}
                placeholder="City"
                placeholderTextColor={Colors.gray[400]}               />
            </View>
            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>State *</Text>
              <TextInput
                style={styles.input}
                value={formData.state}
                onChangeText={(t) => setFormData({ ...formData, state: t })}
                placeholder="State"
                placeholderTextColor={Colors.gray[400]}               />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Postal Code</Text>
            <TextInput
              style={styles.input}
              value={formData.postalCode}
              onChangeText={(t) => setFormData({ ...formData, postalCode: t })}
              placeholder="Postal code"
              placeholderTextColor={Colors.gray[400]}               keyboardType="numeric"
            />
          </View>

          {/* Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  scrim: {
    flex: 1,
  },
  sheetContainer: {
    maxHeight: '80%',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 4,
    backgroundColor: Colors.gray[200],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  coordsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  coordsText: {
    fontSize: 13,
    color: Colors.primaryText,
    fontWeight: '600',
  },
  coordsSpacer: {
    flex: 1,
  },
  coordsOk: {
    fontSize: 12,
    color: Colors.primaryText,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    color: Colors.text.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text.primary,
    backgroundColor: Colors.backgroundSecondary,
  },
  row: {
    flexDirection: 'row',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.gray[100],
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: Colors.gray[700],
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: Colors.gray[400],
  },
  saveText: {
    color: Colors.white,
    fontWeight: '700',
  },
});
