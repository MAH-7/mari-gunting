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
  StatusBar,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { barberService } from '@/shared/services/barberService';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { COLORS } from '@/shared/constants';

const MALAYSIAN_BANKS = [
  'Maybank',
  'CIMB Bank',
  'Public Bank',
  'RHB Bank',
  'Hong Leong Bank',
  'AmBank',
  'Bank Islam',
  'Bank Rakyat',
  'OCBC Bank',
  'HSBC Bank',
  'Standard Chartered',
  'UOB Bank',
  'Affin Bank',
  'Alliance Bank',
  'Bank Muamalat',
];

export default function BankPayoutSettingsScreen() {
  const insets = useSafeAreaInsets();
  const currentUser = useStore((state) => state.currentUser);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [showIOSPicker, setShowIOSPicker] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Original values to track changes
  const [originalData, setOriginalData] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
  });

  useEffect(() => {
    loadBankDetails();
  }, []);

  useEffect(() => {
    // Check if there are changes
    const changed = 
      bankName !== originalData.bankName ||
      accountNumber !== originalData.accountNumber ||
      accountName !== originalData.accountName;
    setHasChanges(changed);
  }, [bankName, accountNumber, accountName, originalData]);

  const loadBankDetails = async () => {
    try {
      setLoading(true);
      
      if (!currentUser?.id) {
        Alert.alert('Error', 'User not found');
        router.back();
        return;
      }

      const profile = await barberService.getBarberProfileByUserId(currentUser.id);
      
      if (profile) {
        const data = {
          bankName: profile.bankName || '',
          accountNumber: profile.bankAccountNumber || '',
          accountName: profile.bankAccountName || '',
        };
        
        setBankName(data.bankName);
        setAccountNumber(data.accountNumber);
        setAccountName(data.accountName);
        setOriginalData(data);
      }
    } catch (error) {
      console.error('Error loading bank details:', error);
      Alert.alert('Error', 'Failed to load bank details');
    } finally {
      setLoading(false);
    }
  };

  const formatAccountNumber = (text: string) => {
    // Remove non-digits
    return text.replace(/[^0-9]/g, '');
  };

  const formatAccountName = (text: string) => {
    // Only allow letters and spaces
    return text.replace(/[^a-zA-Z\s]/g, '').toUpperCase();
  };

  const validateForm = (): boolean => {
    if (!bankName) {
      Alert.alert('Bank Required', 'Please select your bank.');
      return false;
    }

    if (accountNumber.length < 10 || accountNumber.length > 16) {
      Alert.alert('Invalid Account Number', 'Account number must be 10-16 digits.');
      return false;
    }

    if (accountName.trim().length < 3) {
      Alert.alert('Account Name Required', 'Please enter account holder name (min 3 characters).');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      if (!currentUser?.id) {
        Alert.alert('Error', 'User not found');
        return;
      }

      const profile = await barberService.getBarberProfileByUserId(currentUser.id);
      
      if (!profile) {
        Alert.alert('Error', 'Profile not found');
        return;
      }

      // Update bank details using the barber ID (not user ID)
      const success = await barberService.updateBarberProfile(profile.barberId, {
        bank_name: bankName,
        bank_account_number: accountNumber,
        bank_account_name: accountName.trim(),
      });
      
      if (!success) {
        Alert.alert('Error', 'Failed to update bank details. Please try again.');
        return;
      }

      // Update original data
      const newData = {
        bankName,
        accountNumber,
        accountName: accountName.trim(),
      };
      setOriginalData(newData);
      setHasChanges(false);

      Alert.alert(
        'Success',
        'Bank details updated successfully!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error saving bank details:', error);
      Alert.alert('Error', 'Failed to save bank details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!hasChanges) {
      router.back();
      return;
    }

    Alert.alert(
      'Discard Changes?',
      'You have unsaved changes. Are you sure you want to discard them?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setBankName(originalData.bankName);
            setAccountNumber(originalData.accountNumber);
            setAccountName(originalData.accountName);
            router.back();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading bank details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFF' }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDiscard} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bank & Payout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Payout Details</Text>
        <Text style={styles.subtitle}>
          Your earnings will be transferred to this bank account every Monday.
        </Text>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
          <Text style={styles.infoText}>
            Your banking details are encrypted and secure. We use them only for payout purposes.
          </Text>
        </View>

        {/* Bank Name */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Bank Name <Text style={styles.required}>*</Text>
          </Text>
          {Platform.OS === 'android' ? (
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={bankName}
                onValueChange={(value) => setBankName(value)}
                style={styles.picker}
                mode="dropdown"
              >
                <Picker.Item label="Select your bank" value="" />
                {MALAYSIAN_BANKS.map((bank) => (
                  <Picker.Item key={bank} label={bank} value={bank} />
                ))}
              </Picker>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowIOSPicker(true)}
            >
              <Text style={[styles.pickerButtonText, !bankName && styles.pickerPlaceholder]}>
                {bankName || 'Select your bank'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Account Number */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Account Number <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="1234567890123"
            placeholderTextColor="#999"
            value={accountNumber}
            onChangeText={(text) => setAccountNumber(formatAccountNumber(text))}
            keyboardType="number-pad"
            maxLength={16}
          />
          <Text style={styles.hint}>10-16 digits</Text>
        </View>

        {/* Account Holder Name */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Account Holder Name <Text style={styles.required}>*</Text>
          </Text>
          <Text style={styles.hint}>Name as shown on your bank account (must match IC)</Text>
          <TextInput
            style={styles.input}
            placeholder="AHMAD BIN ALI"
            placeholderTextColor="#999"
            value={accountName}
            onChangeText={(text) => setAccountName(formatAccountName(text))}
            autoCapitalize="characters"
            maxLength={100}
          />
        </View>

        {/* Important Notice */}
        <View style={styles.noticeBox}>
          <Ionicons name="alert-circle" size={20} color="#ff9800" />
          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>Important</Text>
            <Text style={styles.noticeText}>
              • Account holder name must match your IC name{'\n'}
              • Double-check your account number{'\n'}
              • Payouts are processed every Monday
            </Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Action Buttons */}
      {hasChanges && (
        <View style={[styles.floatingButtonContainer, { paddingBottom: Platform.OS === 'android' ? insets.bottom + 16 : 32 }]}>
          <TouchableOpacity
            style={styles.discardButton}
            onPress={handleDiscard}
            activeOpacity={0.8}
          >
            <Text style={styles.discardButtonText}>Discard</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* iOS Picker Modal - Dropdown Style */}
      {Platform.OS === 'ios' && showIOSPicker && (
        <Modal
          visible={showIOSPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowIOSPicker(false)}
        >
          <TouchableOpacity 
            style={styles.iosModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowIOSPicker(false)}
          >
            <View style={styles.iosDropdownContainer}>
              <FlatList
                data={MALAYSIAN_BANKS}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.iosDropdownItem}
                    onPress={() => {
                      setBankName(item);
                      setShowIOSPicker(false);
                    }}
                  >
                    <Text style={styles.iosDropdownItemText}>{item}</Text>
                    {bankName === item && (
                      <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                )}
                style={styles.iosDropdownList}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  required: {
    color: '#f44336',
  },
  hint: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#fafafa',
    overflow: 'hidden',
  },
  picker: {
    height: 56,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#fafafa',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  pickerPlaceholder: {
    color: '#999',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#f0f9f4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#4CAF50',
    lineHeight: 20,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fff8e1',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#ffe082',
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff9800',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 14,
    color: '#f57c00',
    lineHeight: 20,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    /* paddingBottom handled inline with insets */
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  discardButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  discardButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  iosModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  iosDropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  iosDropdownList: {
    borderRadius: 12,
  },
  iosDropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iosDropdownItemText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
});
