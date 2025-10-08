import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { useStore } from '@/store/useStore';

const VERIFICATION_STEPS = [
  {
    id: 'submitted',
    label: 'Bank Account Submitted',
    icon: 'checkmark-circle',
    description: 'Bank details received',
  },
  {
    id: 'verifying',
    label: 'Test Deposit Sent',
    icon: 'cash',
    description: 'RM 0.01 deposit in progress',
  },
  {
    id: 'complete',
    label: 'Account Verified',
    icon: 'shield-checkmark',
    description: 'Ready to receive payouts',
  },
];

export default function PayoutPendingScreen() {
  const onboardingData = useStore((state) => state.onboardingData);
  const updateOnboardingProgress = useStore((state) => state.updateOnboardingProgress);
  const accountType = onboardingData?.accountType;

  const handleContinueToHome = () => {
    // Mark onboarding as complete
    updateOnboardingProgress({
      status: 'completed',
      currentStep: 8,
    });

    // Navigate to home
    router.replace('/(tabs)/home');
  };

  const handleContactSupport = () => {
    // TODO: Implement support contact
    router.push('/(tabs)/profile');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Success Header */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="card" size={48} color={COLORS.primary} />
          </View>
          <View style={styles.checkmarkBadge}>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Bank Account Submitted!</Text>
          <Text style={styles.subtitle}>
            We're verifying your bank account details
          </Text>
        </View>

        {/* Verification Timeline */}
        <View style={styles.timeline}>
          {VERIFICATION_STEPS.map((step, index) => (
            <View key={step.id} style={styles.timelineItem}>
              <View style={styles.timelineIndicator}>
                {index === 0 ? (
                  <View style={styles.activeIconCircle}>
                    <Ionicons name={step.icon} size={24} color="#FFFFFF" />
                  </View>
                ) : (
                  <View style={styles.inactiveIconCircle}>
                    <Ionicons name={step.icon} size={24} color={COLORS.text.tertiary} />
                  </View>
                )}
                {index < VERIFICATION_STEPS.length - 1 && (
                  <View style={[styles.timelineLine, index === 0 && styles.timelineLineActive]} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineLabel, index === 0 && styles.timelineLabelActive]}>
                  {step.label}
                </Text>
                <Text style={[styles.timelineDescription, index === 0 && styles.timelineDescriptionActive]}>
                  {step.description}
                </Text>
                {index === 0 && (
                  <Text style={styles.timelineStatus}>
                    {new Date().toLocaleTimeString('en-MY', { 
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                )}
                {index === 1 && (
                  <Text style={styles.timelineEstimate}>Within 24 hours</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Bank Account Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="wallet" size={24} color={COLORS.primary} />
            <Text style={styles.summaryTitle}>Bank Account Details</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Account Holder</Text>
            <Text style={styles.summaryValue}>
              {onboardingData?.payout?.accountHolderName || 'N/A'}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Bank Name</Text>
            <Text style={styles.summaryValue}>
              {onboardingData?.payout?.bankName?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Account Number</Text>
            <Text style={styles.summaryValue}>
              ****{onboardingData?.payout?.accountNumber?.slice(-4) || '****'}
            </Text>
          </View>

          <View style={[styles.summaryRow, styles.summaryRowLast]}>
            <Text style={styles.summaryLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Verifying</Text>
            </View>
          </View>
        </View>

        {/* Info Boxes */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>How does verification work?</Text>
            <Text style={styles.infoText}>
              We'll send a small deposit of RM 0.01 to your bank account. Once you receive it, your account will be automatically verified. The amount will be refunded immediately.
            </Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="time" size={20} color={COLORS.success} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>When will I get paid?</Text>
            <Text style={styles.infoText}>
              Once verified, earnings are paid weekly every Monday. Instant payout becomes available after 30 days of activity.
            </Text>
          </View>
        </View>

        {/* Celebration Card */}
        <View style={styles.celebrationCard}>
          <View style={styles.celebrationHeader}>
            <Ionicons name="trophy" size={32} color="#F59E0B" />
            <Text style={styles.celebrationTitle}>You're Almost Ready!</Text>
          </View>
          <Text style={styles.celebrationText}>
            Great job completing your onboarding! While we verify your details in the background, you can start exploring the app.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleContinueToHome}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Go to Home</Text>
            <Ionicons name="home" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleContactSupport}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.primary} />
            <Text style={styles.secondaryButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          We'll notify you via SMS and app notification once your account is verified and ready to go!
        </Text>
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
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkBadge: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.background.secondary,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    ...TYPOGRAPHY.heading.h2,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  timeline: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 16,
  },
  timelineIndicator: {
    alignItems: 'center',
  },
  activeIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border.light,
    marginVertical: 8,
  },
  timelineLineActive: {
    backgroundColor: COLORS.primary,
  },
  timelineContent: {
    flex: 1,
    paddingVertical: 4,
    paddingBottom: 20,
  },
  timelineLabel: {
    ...TYPOGRAPHY.body.medium,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  timelineLabelActive: {
    color: COLORS.text.primary,
  },
  timelineDescription: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.tertiary,
    marginBottom: 4,
  },
  timelineDescriptionActive: {
    color: COLORS.text.secondary,
  },
  timelineStatus: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.success,
    fontWeight: '600',
  },
  timelineEstimate: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.tertiary,
  },
  summaryCard: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  summaryTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  summaryRowLast: {
    borderBottomWidth: 0,
  },
  summaryLabel: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
  },
  summaryValue: {
    ...TYPOGRAPHY.body.regular,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.warning,
  },
  statusText: {
    ...TYPOGRAPHY.body.small,
    fontWeight: '600',
    color: COLORS.warning,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: COLORS.background.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    ...TYPOGRAPHY.body.medium,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  infoText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  celebrationCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FCD34D',
  },
  celebrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  celebrationTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: '#92400E',
  },
  celebrationText: {
    ...TYPOGRAPHY.body.regular,
    color: '#92400E',
    lineHeight: 20,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 16,
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
    backgroundColor: COLORS.background.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  secondaryButtonText: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.primary,
    fontWeight: '600',
  },
  footerText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
