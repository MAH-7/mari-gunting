import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { barberOnboardingService, BarberOnboardingData } from '@mari-gunting/shared/services/onboardingService';
import { useAuth } from '@mari-gunting/shared/hooks/useAuth';
import { useStore } from '@mari-gunting/shared/store/useStore';

export default function ReviewScreen() {
  const { user } = useAuth();
  const logout = useStore((state) => state.logout);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [data, setData] = useState<BarberOnboardingData>({});

  useEffect(() => {
    loadData();
  }, []);

  // Reload data when screen comes back into focus (after editing)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const progress = await barberOnboardingService.getProgress();
      setData(progress);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load your data. Please try again.');
      router.back();
    }
  };

  const maskAccountNumber = (number: string) => {
    if (number.length <= 4) return number;
    return '*'.repeat(number.length - 4) + number.slice(-4);
  };

  const handleEdit = (screen: string) => {
    router.push({
      pathname: `/onboarding/barber/${screen}` as any,
      params: { returnTo: 'review' },
    });
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

  const handleSubmit = async () => {
    if (!acceptedTerms) {
      Alert.alert('Terms Required', 'Please accept the terms and conditions to continue.');
      return;
    }

    Alert.alert(
      'Submit Application',
      'Are you sure you want to submit your application? You can still edit your profile later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            try {
              setSubmitting(true);

              const result = await barberOnboardingService.submitOnboarding(user?.id || '', data);

              if (result.success) {
                Alert.alert(
                  'Success!',
                  'Your application has been submitted successfully. We will review it within 2-3 business days.',
                  [
                    {
                      text: 'OK',
                      onPress: () => router.replace('/pending-approval'),
                    },
                  ]
                );
              } else {
                Alert.alert('Submission Failed', result.error || 'Please try again.');
              }
            } catch (error) {
              console.error('Error submitting:', error);
              Alert.alert('Error', 'Failed to submit application. Please try again.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading your data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <View style={styles.progressContainer}>
          <View style={styles.progressDotCompleted} />
          <View style={styles.progressDotCompleted} />
          <View style={styles.progressDotCompleted} />
          <View style={styles.progressDotCompleted} />
          <View style={[styles.progressDot, styles.progressActive]} />
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Review & Submit</Text>
        <Text style={styles.subtitle}>
          Please review your information before submitting your application.
        </Text>

        {/* Basic Info Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <TouchableOpacity onPress={() => handleEdit('basic-info')}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            <InfoRow label="Experience" value={`${data.basicInfo?.experience || 0}+ years`} />
            <InfoRow
              label="Specializations"
              value={data.basicInfo?.specializations.join(', ') || 'N/A'}
            />
            <InfoRow label="Bio" value={data.basicInfo?.bio || 'N/A'} multiline />
          </View>
        </View>

        {/* Identity Verification */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Identity Verification</Text>
            <TouchableOpacity onPress={() => handleEdit('ekyc')}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            <InfoRow label="IC Number" value={data.ekyc?.icNumber || 'N/A'} />
            <View style={styles.documentsRow}>
              <Text style={styles.label}>Documents Uploaded:</Text>
              <View style={styles.documentsList}>
                <DocumentItem icon="checkmark-circle" text="IC Front" />
                <DocumentItem icon="checkmark-circle" text="IC Back" />
                <DocumentItem icon="checkmark-circle" text="Selfie" />
                {data.ekyc?.certificateUrls && data.ekyc.certificateUrls.length > 0 && (
                  <DocumentItem
                    icon="checkmark-circle"
                    text={`${data.ekyc.certificateUrls.length} Certificate(s)`}
                  />
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Service Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Service Details</Text>
            <TouchableOpacity onPress={() => handleEdit('service-details')}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            <InfoRow label="Service Radius" value={`${data.serviceDetails?.radius || 0} km`} />
            <InfoRow
              label="Portfolio Photos"
              value={`${data.serviceDetails?.portfolioUrls.length || 0} photos`}
            />
            <View style={styles.documentsRow}>
              <Text style={styles.label}>Working Days:</Text>
              <Text style={styles.value}>
                {data.serviceDetails?.hours
                  ? Object.entries(data.serviceDetails.hours)
                      .filter(([, hours]) => hours.isAvailable)
                      .map(([day]) => day.toUpperCase())
                      .join(', ')
                  : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Payout Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payout Details</Text>
            <TouchableOpacity onPress={() => handleEdit('payout')}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            <InfoRow label="Bank" value={data.payout?.bankName || 'N/A'} />
            <InfoRow
              label="Account Number"
              value={data.payout?.accountNumber ? maskAccountNumber(data.payout.accountNumber) : 'N/A'}
            />
            <InfoRow label="Account Name" value={data.payout?.accountName || 'N/A'} />
          </View>
        </View>

        {/* Terms & Conditions */}
        <View style={styles.termsContainer}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
          >
            <View style={[styles.checkbox, acceptedTerms && styles.checkboxActive]}>
              {acceptedTerms && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.link}>Terms and Conditions</Text> and{' '}
              <Text style={styles.link}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Important Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#2196F3" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>What happens next?</Text>
            <Text style={styles.infoText}>
              • Your application will be reviewed within 2-3 business days{'\\n'}
              • We'll verify your documents and information{'\n'}
              • You'll receive a notification once approved{'\n'}
              • After approval, you can start accepting bookings
            </Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!acceptedTerms || submitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!acceptedTerms || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Submit Application</Text>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Helper Components
const InfoRow = ({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) => (
  <View style={[styles.infoRow, multiline && styles.infoRowColumn]}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={[styles.value, multiline && styles.valueMultiline]}>{value}</Text>
  </View>
);

const DocumentItem = ({ icon, text }: { icon: string; text: string }) => (
  <View style={styles.documentItem}>
    <Ionicons name={icon as any} size={16} color="#4CAF50" />
    <Text style={styles.documentText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  editButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  card: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  infoRowColumn: {
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    minWidth: 120,
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '400',
  },
  valueMultiline: {
    lineHeight: 20,
  },
  documentsRow: {
    paddingVertical: 8,
  },
  documentsList: {
    marginTop: 8,
    gap: 6,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  documentText: {
    fontSize: 14,
    color: '#4CAF50',
  },
  termsContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  link: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
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
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
