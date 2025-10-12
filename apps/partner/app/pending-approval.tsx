import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { verificationService, VerificationStep } from '@mari-gunting/shared/services/verificationService';
import { supabase } from '@mari-gunting/shared/config/supabase';

export default function PendingApprovalScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Your documents are under review');
  const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([]);
  const [estimatedDate, setEstimatedDate] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);

  // Initial load
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setIsLoading(true);
    setHasError(false);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check verification status
        const status = await verificationService.getVerificationStatus(user.id);
        
        console.log('🔄 Status check:', status);
        
        // If approved, redirect to dashboard
        if (status.canAcceptBookings) {
          console.log('✅ Approved! Redirecting to dashboard...');
          router.replace('/(tabs)/dashboard');
          return;
        }
        
        // Update status message and details
        setStatusMessage(status.message);
        setVerificationSteps(status.steps || []);
        
        // Calculate days remaining
        if (status.estimatedCompletionDate) {
          const estimated = new Date(status.estimatedCompletionDate);
          const now = new Date();
          const diffTime = estimated.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setDaysRemaining(Math.max(0, diffDays));
          setEstimatedDate(status.estimatedCompletionDate);
        }
      }
    } catch (error) {
      console.error('❌ Status check error:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkStatus();
    setRefreshing(false);
  };

  const handleRetry = () => {
    checkStatus();
  };

  const handleContactSupport = () => {
    // Open support chat or email
    Linking.openURL('mailto:support@mari-gunting.com?subject=Account Verification Support');
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return { name: 'checkmark-circle' as const, color: COLORS.success };
      case 'submitted':
        return { name: 'time' as const, color: '#FF9800' };
      case 'failed':
        return { name: 'close-circle' as const, color: COLORS.error };
      default:
        return { name: 'ellipse-outline' as const, color: COLORS.text.tertiary };
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Checking your status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (hasError) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorTitle}>Unable to Load Status</Text>
          <Text style={styles.errorMessage}>
            We couldn't check your verification status. Please check your connection and try again.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={20} color="#FFF" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={['#FF9800', '#F57C00']}
          style={styles.headerGradient}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="time" size={64} color="#FFF" />
          </View>
          <Text style={styles.headerTitle}>Account Under Review</Text>
          <Text style={styles.headerSubtitle}>Hang tight! We're reviewing your application</Text>
        </LinearGradient>

        {/* Estimated Completion Card */}
        {estimatedDate && daysRemaining >= 0 && (
          <View style={styles.estimatedCard}>
            <View style={styles.estimatedHeader}>
              <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
              <View style={styles.estimatedTextContainer}>
                <Text style={styles.estimatedLabel}>Estimated Completion</Text>
                <Text style={styles.estimatedValue}>
                  {daysRemaining === 0 ? 'Today' : daysRemaining === 1 ? 'Tomorrow' : `In ${daysRemaining} days`}
                </Text>
              </View>
            </View>
            <View style={styles.estimatedCountdown}>
              <View style={styles.countdownItem}>
                <Text style={styles.countdownNumber}>{daysRemaining}</Text>
                <Text style={styles.countdownLabel}>Days</Text>
              </View>
              <View style={styles.countdownDivider} />
              <View style={styles.countdownItem}>
                <Text style={styles.countdownNumber}>{new Date(estimatedDate).getHours() - new Date().getHours()}</Text>
                <Text style={styles.countdownLabel}>Hours</Text>
              </View>
            </View>
          </View>
        )}

        {/* Verification Checklist */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name="list" size={24} color="#FF9800" />
            <Text style={styles.statusTitle}>Verification Progress</Text>
          </View>
          
          <Text style={styles.statusMessage}>{statusMessage}</Text>
          
          {/* Checklist of verification steps */}
          {verificationSteps.length > 0 && (
            <View style={styles.checklistContainer}>
              {verificationSteps.map((step, index) => {
                const statusIcon = getStepStatusIcon(step.status);
                return (
                  <View key={step.id} style={styles.checklistItem}>
                    <View style={[styles.checklistIconContainer, { backgroundColor: statusIcon.color + '20' }]}>
                      <Ionicons name={statusIcon.name} size={20} color={statusIcon.color} />
                    </View>
                    <View style={styles.checklistContent}>
                      <View style={styles.checklistHeader}>
                        <Text style={styles.checklistTitle}>{step.label}</Text>
                        <Text style={[styles.checklistBadge, { backgroundColor: statusIcon.color + '20', color: statusIcon.color }]}>
                          {step.status === 'verified' ? 'Verified' : step.status === 'submitted' ? 'Under Review' : 'Pending'}
                        </Text>
                      </View>
                      {step.message && (
                        <Text style={styles.checklistMessage}>{step.message}</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Support Chat Button */}
        <TouchableOpacity style={styles.supportButton} onPress={handleContactSupport}>
          <View style={styles.supportButtonContent}>
            <View style={styles.supportIconCircle}>
              <Ionicons name="chatbubble-ellipses" size={24} color="#FFF" />
            </View>
            <View style={styles.supportTextContainer}>
              <Text style={styles.supportTitle}>Need Help?</Text>
              <Text style={styles.supportDescription}>Chat with our support team</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
          </View>
        </TouchableOpacity>

        {/* What's Next */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What Happens Next?</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="time-outline" size={20} color="#2196F3" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Review Timeline</Text>
                <Text style={styles.infoDescription}>Our team will review your application within 1-2 business days</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="notifications-outline" size={20} color="#FF9800" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>We'll Notify You</Text>
                <Text style={styles.infoDescription}>You'll receive an email and push notification once approved</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="rocket-outline" size={20} color="#00B14F" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Start Earning</Text>
                <Text style={styles.infoDescription}>Once approved, you can immediately start accepting bookings</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Ionicons name="help-circle-outline" size={20} color={COLORS.text.secondary} />
          <Text style={styles.helpText}>
            Questions? Contact us at{' '}
            <Text style={styles.helpLink}>support@mari-gunting.com</Text>
          </Text>
        </View>

        {/* Pull to Refresh Hint */}
        <View style={styles.refreshHint}>
          <Ionicons name="arrow-down" size={16} color={COLORS.text.tertiary} />
          <Text style={styles.refreshHintText}>Pull down to check approval status</Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  headerGradient: {
    padding: 32,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: COLORS.background.primary,
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  statusMessage: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  timelineContainer: {
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.background.tertiary,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotComplete: {
    backgroundColor: COLORS.success,
  },
  timelineDotCurrent: {
    backgroundColor: '#FF9800',
  },
  timelineContent: {
    flex: 1,
    marginLeft: 16,
    paddingBottom: 20,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: COLORS.border.light,
    marginLeft: 11,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  helpSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  helpText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    flex: 1,
    lineHeight: 18,
  },
  helpLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  refreshHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  refreshHintText: {
    fontSize: 12,
    color: COLORS.text.tertiary,
  },
  infoCard: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    ...TYPOGRAPHY.body.regular,
    color: '#FFF',
    fontWeight: '600',
  },
  estimatedCard: {
    backgroundColor: COLORS.background.primary,
    margin: 20,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary + '20',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  estimatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  estimatedTextContainer: {
    flex: 1,
  },
  estimatedLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  estimatedValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  estimatedCountdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  countdownItem: {
    alignItems: 'center',
    flex: 1,
  },
  countdownNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  countdownLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countdownDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border.light,
  },
  checklistContainer: {
    marginTop: 16,
    gap: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
  },
  checklistIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checklistContent: {
    flex: 1,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  checklistTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  checklistBadge: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  checklistMessage: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  supportButton: {
    margin: 20,
    marginTop: 12,
    backgroundColor: COLORS.background.primary,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  supportButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  supportIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportTextContainer: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  supportDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
});
