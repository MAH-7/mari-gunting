import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { useStore } from '@/store/useStore';
import VerificationStatusBanner from '@/components/VerificationStatusBanner';
import { supabase } from '@mari-gunting/shared/config/supabase';

const MALAYSIAN_BANKS = [
  { code: 'maybank', name: 'Maybank' },
  { code: 'cimb', name: 'CIMB Bank' },
  { code: 'public_bank', name: 'Public Bank' },
  { code: 'rhb', name: 'RHB Bank' },
  { code: 'hong_leong', name: 'Hong Leong Bank' },
  { code: 'ambank', name: 'AmBank' },
  { code: 'uob', name: 'UOB Malaysia' },
  { code: 'ocbc', name: 'OCBC Bank' },
  { code: 'hsbc', name: 'HSBC Bank' },
  { code: 'standard_chartered', name: 'Standard Chartered' },
  { code: 'affin', name: 'Affin Bank' },
  { code: 'alliance', name: 'Alliance Bank' },
  { code: 'bsn', name: 'Bank Simpanan Nasional' },
  { code: 'bank_islam', name: 'Bank Islam Malaysia' },
  { code: 'other', name: 'Other' },
];

export default function PayoutScreen() {
  const [formData, setFormData] = useState({
    accountHolderName: '',
    bankName: 'maybank',
    accountNumber: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'not_started' | 'in_progress' | 'submitted' | 'verified' | 'failed'>('in_progress');

  const updateOnboardingProgress = useStore((state) => state.updateOnboardingProgress);
  const completeOnboardingStep = useStore((state) => state.completeOnboardingStep);
  const onboardingData = useStore((state) => state.onboardingData);

  useEffect(() => {
    if (onboardingData?.payout?.verificationStatus) {
      setVerificationStatus(onboardingData.payout.verificationStatus);
    }
  }, [onboardingData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.accountHolderName.trim()) {
      newErrors.accountHolderName = 'Account holder name is required';
    } else if (formData.accountHolderName.trim().length < 3) {
      newErrors.accountHolderName = 'Name must be at least 3 characters';
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else if (!/^\d{10,16}$/.test(formData.accountNumber)) {
      newErrors.accountNumber = 'Invalid account number (10-16 digits)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please complete all required fields correctly');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const currentData = onboardingData || {
        progress: {
          status: 'in_progress',
          currentStep: 5,
          totalSteps: 8,
          completedSteps: ['account_type', 'ekyc'],
          lastUpdatedAt: new Date().toISOString(),
        },
        consents: {},
      };

      const updatedData = {
        ...currentData,
        payout: {
          accountHolderName: formData.accountHolderName,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          verificationStatus: 'pending' as const,
        },
      };

      // Update local store with payout data
      useStore.setState({ onboardingData: updatedData });
      completeOnboardingStep('payout');

      // CRITICAL: Update verification status in database to 'pending' so app knows onboarding is submitted
      // This is the source of truth for determining if user should see onboarding or pending-approval
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('No authenticated user found');
        }

        const accountType = onboardingData?.progress.accountType;
        console.log('🔐 Submitting onboarding for user:', user.id, 'Account type:', accountType);
        
        if (accountType === 'barbershop') {
          const { error, data } = await supabase
            .from('barbershops')
            .update({ 
              verification_status: 'pending',
              updated_at: new Date().toISOString()
            })
            .eq('owner_id', user.id)
            .select();
          
          if (error) {
            console.error('❌ Failed to update barbershop status:', error);
            throw error;
          }
          
          console.log('✅ Barbershop verification status updated:', data);
        } else {
          const { error, data } = await supabase
            .from('barbers')
            .update({ 
              verification_status: 'pending',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .select();
          
          if (error) {
            console.error('❌ Failed to update barber status:', error);
            throw error;
          }
          
          console.log('✅ Barber verification status updated:', data);
        }
        
        // Update local store to mark onboarding as submitted
        updateOnboardingProgress({
          status: 'submitted',
          currentStep: 6,
        });
        
      } catch (error) {
        console.error('❌ CRITICAL: Error updating verification status:', error);
        Alert.alert(
          'Submission Error',
          'Failed to submit your application. Please check your connection and try again.',
          [{ text: 'OK' }]
        );
        return; // Don't navigate if submission failed
      }

      // For now, go directly to pending-approval since services/availability/portfolio screens don't exist yet
      // TODO: Add remaining onboarding screens (services, availability, portfolio, review)
      router.push('/pending-approval');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit payout details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="card" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Setup Payouts</Text>
          <Text style={styles.subtitle}>
            Add your bank account to receive earnings
          </Text>
        </View>

        <VerificationStatusBanner 
          status={verificationStatus}
          message={
            verificationStatus === 'submitted' 
              ? 'Test deposit sent. Your bank account is being verified.'
              : undefined
          }
        />

        <View style={styles.form}>
          {/* Account Holder Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Holder Name *</Text>
            <TextInput
              style={[styles.input, errors.accountHolderName && styles.inputError]}
              value={formData.accountHolderName}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, accountHolderName: text.toUpperCase() }));
                if (errors.accountHolderName) setErrors(prev => ({ ...prev, accountHolderName: '' }));
              }}
              placeholder="Enter name as per bank account"
              placeholderTextColor={COLORS.text.tertiary}
              autoCapitalize="characters"
            />
            {errors.accountHolderName && <Text style={styles.errorText}>{errors.accountHolderName}</Text>}
            <Text style={styles.helperText}>
              Must match your bank account exactly
            </Text>
          </View>

          {/* Bank Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bank Name *</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowBankDropdown(!showBankDropdown)}
            >
              <View style={styles.dropdownLeft}>
                <Ionicons name="business" size={20} color={COLORS.text.secondary} />
                <Text style={styles.dropdownText}>
                  {MALAYSIAN_BANKS.find(b => b.code === formData.bankName)?.name}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color={COLORS.text.secondary} />
            </TouchableOpacity>
            {showBankDropdown && (
              <View style={styles.dropdownMenu}>
                <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled>
                  {MALAYSIAN_BANKS.map((bank) => (
                    <TouchableOpacity
                      key={bank.code}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setFormData(prev => ({ ...prev, bankName: bank.code }));
                        setShowBankDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{bank.name}</Text>
                      {formData.bankName === bank.code && (
                        <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Account Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Number *</Text>
            <TextInput
              style={[styles.input, errors.accountNumber && styles.inputError]}
              value={formData.accountNumber}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, accountNumber: text.replace(/\D/g, '') }));
                if (errors.accountNumber) setErrors(prev => ({ ...prev, accountNumber: '' }));
              }}
              placeholder="Enter bank account number"
              placeholderTextColor={COLORS.text.tertiary}
              keyboardType="number-pad"
              maxLength={16}
            />
            {errors.accountNumber && <Text style={styles.errorText}>{errors.accountNumber}</Text>}
          </View>

          {/* Security Info */}
          <View style={styles.securityBox}>
            <Ionicons name="shield-checkmark" size={24} color={COLORS.success} />
            <View style={styles.securityTextContainer}>
              <Text style={styles.securityTitle}>Secure & Encrypted</Text>
              <Text style={styles.securityText}>
                Your banking details are encrypted and stored securely. We use bank-level security to protect your information.
              </Text>
            </View>
          </View>

          {/* Payout Schedule Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="calendar" size={20} color={COLORS.primary} />
              <Text style={styles.infoCardTitle}>Payout Schedule</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time" size={16} color={COLORS.text.secondary} />
              <Text style={styles.infoRowText}>Earnings are paid out weekly, every Monday</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="wallet" size={16} color={COLORS.text.secondary} />
              <Text style={styles.infoRowText}>Minimum payout threshold: RM 50</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="flash" size={16} color={COLORS.text.secondary} />
              <Text style={styles.infoRowText}>Instant payout available after 30 days</Text>
            </View>
          </View>

          {/* Verification Notice */}
          <View style={styles.noticeBox}>
            <Ionicons name="information-circle" size={20} color={COLORS.warning} />
            <Text style={styles.noticeText}>
              We'll verify your bank account with a small deposit (RM 0.01) that will be refunded immediately.
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Verify Bank Account</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.footerText}>
            By continuing, you agree to our payout terms and conditions
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    ...TYPOGRAPHY.heading.h2,
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    ...TYPOGRAPHY.body.medium,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.error,
    marginTop: 4,
  },
  helperText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.tertiary,
    marginTop: 4,
  },
  dropdown: {
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  dropdownMenu: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    maxHeight: 250,
  },
  dropdownScrollView: {
    maxHeight: 250,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  dropdownItemText: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  securityTextContainer: {
    flex: 1,
  },
  securityTitle: {
    ...TYPOGRAPHY.body.medium,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 4,
  },
  securityText: {
    ...TYPOGRAPHY.body.small,
    color: '#166534',
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  infoCardTitle: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoRowText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
    flex: 1,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  noticeText: {
    ...TYPOGRAPHY.body.small,
    color: '#92400E',
    flex: 1,
    lineHeight: 18,
  },
  actionButtons: {
    gap: 12,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.background.tertiary,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    ...TYPOGRAPHY.body.large,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  footerText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
