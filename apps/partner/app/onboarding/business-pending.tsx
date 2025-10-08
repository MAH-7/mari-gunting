import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { useStore } from '@/store/useStore';

const VERIFICATION_STEPS = [
  {
    id: 'submitted',
    label: 'Documents Submitted',
    icon: 'checkmark-circle',
  },
  {
    id: 'reviewing',
    label: 'Under Review',
    icon: 'time',
  },
  {
    id: 'complete',
    label: 'Verification Complete',
    icon: 'shield-checkmark',
  },
];

export default function BusinessPendingScreen() {
  const onboardingData = useStore((state) => state.onboardingData);
  const accountType = onboardingData?.accountType;

  const handleContinueSetup = () => {
    // Move to payout setup step
    router.push('/onboarding/payout');
  };

  const handleExitToHome = () => {
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Success Header */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="document-text" size={48} color={COLORS.primary} />
          </View>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Business Details Submitted!</Text>
          <Text style={styles.subtitle}>
            We're reviewing your barbershop registration details
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
                {index === 0 && (
                  <Text style={styles.timelineStatus}>
                    {new Date().toLocaleDateString('en-MY', { 
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                )}
                {index === 1 && (
                  <Text style={styles.timelineEstimate}>Est. 2-3 business days</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Business Details Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Submitted Details</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Business Name</Text>
            <Text style={styles.summaryValue}>
              {onboardingData?.business?.businessName || 'N/A'}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>SSM Number</Text>
            <Text style={styles.summaryValue}>
              {onboardingData?.business?.ssmNumber || 'N/A'}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Business Type</Text>
            <Text style={styles.summaryValue}>
              {onboardingData?.business?.businessType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Location</Text>
            <Text style={styles.summaryValue}>
              {onboardingData?.business?.address?.city}, {onboardingData?.business?.address?.state}
            </Text>
          </View>
        </View>

        {/* Info Boxes */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>What happens next?</Text>
            <Text style={styles.infoText}>
              Our team will verify your SSM registration and business address. You'll receive a notification once verification is complete.
            </Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.warning} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Need to update details?</Text>
            <Text style={styles.infoText}>
              Contact our support team if you need to update your business information.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleContinueSetup}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Continue Setup</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleExitToHome}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Complete Later</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          You can continue setting up your profile while we verify your business details in the background.
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
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
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
  timelineStatus: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.success,
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
  summaryTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  summaryLabel: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
    flex: 1,
  },
  summaryValue: {
    ...TYPOGRAPHY.body.regular,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1,
    textAlign: 'right',
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
  actionButtons: {
    gap: 12,
    marginTop: 20,
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
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  secondaryButtonText: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  footerText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
