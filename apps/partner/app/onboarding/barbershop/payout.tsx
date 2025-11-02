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
} from 'react-native';
import { router } from 'expo-router';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { barbershopOnboardingService } from '@mari-gunting/shared/services/onboardingService';

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

export default function PayoutScreen() {
  const logout = useStore((state) => state.logout);
  const [loading, setLoading] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [showBankPicker, setShowBankPicker] = useState(false);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const progress = await barbershopOnboardingService.getProgress();
      if (progress.payout) {
        setBankName(progress.payout.bankName);
        setAccountNumber(progress.payout.accountNumber);
        setAccountName(progress.payout.accountName);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
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

  const handleContinue = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const data = {
        bankName,
        accountNumber,
        accountName: accountName.trim(),
      };

      await barbershopOnboardingService.saveProgress('payout', data);
      router.push('/onboarding/barbershop/review');
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
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressDotCompleted} />
          <View style={styles.progressDotCompleted} />
          <View style={styles.progressDotCompleted} />
          <View style={styles.progressDotCompleted} />
          <View style={styles.progressDotCompleted} />
          <View style={styles.progressDotCompleted} />
          <View style={[styles.progressDot, styles.progressActive]} />
          <View style={styles.progressDot} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Payout Details</Text>
        <Text style={styles.subtitle}>
          Enter your bank account details to receive payments from completed bookings.
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
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowBankPicker(!showBankPicker)}
          >
            <Text style={[styles.pickerButtonText, !bankName && styles.pickerPlaceholder]}>
              {bankName || 'Select your bank'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
          
          {showBankPicker && (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={bankName}
                onValueChange={(value) => {
                  setBankName(value);
                  setShowBankPicker(false);
                }}
              >
                <Picker.Item label="Select your bank" value="" />
                {MALAYSIAN_BANKS.map((bank) => (
                  <Picker.Item key={bank} label={bank} value={bank} />
                ))}
              </Picker>
            </View>
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

      {/* Continue Button */}
      <View style={styles.footer}>
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
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
  logoutButton: {
    width: 40,

    borderRadius: 20,

    backgroundColor: '#FEE2E2',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  progressDotCompleted: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  progressActive: {
    backgroundColor: '#4CAF50',
    width: 24,
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
  pickerContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    overflow: 'hidden',
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
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
