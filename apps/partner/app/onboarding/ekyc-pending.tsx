import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { useStore } from '@/store/useStore';

export default function EKYCPendingScreen() {
  const updateOnboardingProgress = useStore((state) => state.updateOnboardingProgress);

  // For demo: simulate instant approval
  const handleContinue = () => {
    updateOnboardingProgress({
      status: 'ekyc_passed',
      currentStep: 3,
    });

    const accountType = useStore.getState().onboardingData?.progress.accountType;
    
    // Barbershop goes to business details, freelance goes to payout
    if (accountType === 'barbershop') {
      router.push('/onboarding/business');
    } else {
      router.push('/onboarding/payout');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="hourglass" size={64} color={COLORS.warning} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.textContent}>
          <Text style={styles.title}>Verification in Progress</Text>
          <Text style={styles.subtitle}>
            We're reviewing your identity documents. This usually takes 1-2 business days.
          </Text>
        </View>

        {/* Status Steps */}
        <View style={styles.stepsContainer}>
          <View style={styles.step}>
            <View style={[styles.stepIcon, styles.stepIconComplete]}>
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Documents Submitted</Text>
              <Text style={styles.stepDescription}>Your documents have been received</Text>
            </View>
          </View>

          <View style={styles.stepLine} />

          <View style={styles.step}>
            <View style={[styles.stepIcon, styles.stepIconPending]}>
              <Ionicons name="document-text" size={20} color={COLORS.warning} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Under Review</Text>
              <Text style={styles.stepDescription}>Our team is verifying your information</Text>
            </View>
          </View>

          <View style={styles.stepLine} />

          <View style={styles.step}>
            <View style={styles.stepIcon}>
              <Ionicons name="shield-checkmark" size={20} color={COLORS.text.tertiary} />
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, styles.stepTitleInactive]}>Verification Complete</Text>
              <Text style={styles.stepDescription}>You'll be notified once approved</Text>
            </View>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            You'll receive a notification once verification is complete. You can continue with the next steps while we review.
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleContinue}>
            <Text style={styles.primaryButtonText}>Continue Setup</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/(tabs)/dashboard')}>
            <Text style={styles.secondaryButtonText}>I'll Come Back Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    marginBottom: 32,
  },
  title: {
    ...TYPOGRAPHY.heading.h1,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  stepsContainer: {
    marginBottom: 24,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconComplete: {
    backgroundColor: COLORS.success,
  },
  stepIconPending: {
    backgroundColor: '#FFF7ED',
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepTitle: {
    ...TYPOGRAPHY.body.medium,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  stepTitleInactive: {
    color: COLORS.text.tertiary,
  },
  stepDescription: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
  },
  stepLine: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.border.light,
    marginLeft: 19,
    marginVertical: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: COLORS.primaryLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
    flex: 1,
    lineHeight: 18,
  },
  buttons: {
    gap: 12,
  },
  primaryButton: {
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
  primaryButtonText: {
    ...TYPOGRAPHY.body.large,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
  },
});
