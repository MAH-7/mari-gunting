import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { Ionicons } from '@expo/vector-icons';
import { barbershopOnboardingService, BarbershopOnboardingData } from '@mari-gunting/shared/services/onboardingService';
import { useAuth } from '@mari-gunting/shared/hooks/useAuth';
import { Colors, theme } from '@mari-gunting/shared/theme';

export default function ReviewScreen() {
  const insets = useSafeAreaInsets();
  const logout = useStore((state) => state.logout);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [data, setData] = useState<BarbershopOnboardingData>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const progress = await barbershopOnboardingService.getProgress();
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
    router.push(`/onboarding/barbershop/${screen}` as any);
  };

  const handleSubmit = async () => {
    if (!acceptedTerms) {
      Alert.alert('Terms Required', 'Please accept the terms and conditions to continue.');
      return;
    }

    Alert.alert(
      'Submit Application',
      'Are you sure you want to submit your barbershop application? You can still edit your profile later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            try {
              setSubmitting(true);

              const result = await barbershopOnboardingService.submitOnboarding(user?.id || '', data);

              if (result.success) {
                Alert.alert(
                  'Success!',
                  'Your barbershop application has been submitted successfully. We will review it within 2-3 business days.',
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
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={22} color={Colors.error} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressDotCompleted} />
          <View style={styles.progressDotCompleted} />
          <View style={styles.progressDotCompleted} />
          <View style={styles.progressDotCompleted} />
          <View style={styles.progressDotCompleted} />
          <View style={styles.progressDotCompleted} />
          <View style={styles.progressDotCompleted} />
          <View style={[styles.progressDot, styles.progressActive]} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Review & Submit</Text>
        <Text style={styles.subtitle}>
          Please review your barbershop information before submitting your application.
        </Text>

        {/* Business Info Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Business Information</Text>
            <TouchableOpacity onPress={() => handleEdit('business-info')}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            <InfoRow label="Business Name" value={data.businessInfo?.name || 'N/A'} />
            <InfoRow label="Phone Number" value={data.businessInfo?.phone || 'N/A'} />
            <InfoRow label="Email" value={data.businessInfo?.email || 'N/A'} />
            <InfoRow label="Description" value={data.businessInfo?.description || 'N/A'} multiline />
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Location</Text>
            <TouchableOpacity onPress={() => handleEdit('location')}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            <InfoRow label="Address" value={data.location?.address || 'N/A'} multiline />
            <InfoRow label="State" value={data.location?.state || 'N/A'} />
            <InfoRow label="Postcode" value={data.location?.postcode || 'N/A'} />
            {data.location?.coordinates && (
              <InfoRow
                label="Coordinates"
                value={`${data.location.coordinates.latitude.toFixed(6)}, ${data.location.coordinates.longitude.toFixed(6)}`}
              />
            )}
          </View>
        </View>

        {/* Documents Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Documents</Text>
            <TouchableOpacity onPress={() => handleEdit('documents')}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            <View style={styles.documentsRow}>
              <Text style={styles.label}>Uploaded Documents:</Text>
              <View style={styles.documentsList}>
                {data.documents?.logoUrl && <DocumentItem icon="checkmark-circle" text="Business Logo" />}
                {data.documents?.coverUrls && data.documents.coverUrls.length > 0 && (
                  <DocumentItem
                    icon="checkmark-circle"
                    text={`${data.documents.coverUrls.length} Cover Photo(s)`}
                  />
                )}
                {data.documents?.ssmUrl && <DocumentItem icon="checkmark-circle" text="SSM Certificate" />}
                {data.documents?.licenseUrl && <DocumentItem icon="checkmark-circle" text="Business License" />}
              </View>
            </View>
          </View>
        </View>

        {/* Operating Hours Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Operating Hours</Text>
            <TouchableOpacity onPress={() => handleEdit('operating-hours')}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            {data.operatingHours &&
              Object.entries(data.operatingHours).map(([day, hours]) => (
                <View key={day} style={styles.hoursRow}>
                  <Text style={styles.dayLabel}>{day.toUpperCase()}</Text>
                  {hours.isOpen ? (
                    <Text style={styles.hoursValue}>
                      {hours.start} - {hours.end}
                    </Text>
                  ) : (
                    <Text style={styles.closedValue}>Closed</Text>
                  )}
                </View>
              ))}
            {!data.operatingHours && <InfoRow label="Status" value="Not set" />}
          </View>
        </View>

        {/* Staff & Services Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Staff & Services</Text>
            <TouchableOpacity onPress={() => handleEdit('staff-services')}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            <InfoRow
              label="Staff Members"
              value={`${data.staffServices?.staff?.length || 0} member(s)`}
            />
            <InfoRow
              label="Services Offered"
              value={`${data.staffServices?.services?.length || 0} service(s)`}
            />
            {data.staffServices?.staff && data.staffServices.staff.length > 0 && (
              <View style={styles.listSection}>
                <Text style={styles.listTitle}>Staff:</Text>
                {data.staffServices.staff.map((staff, index) => (
                  <Text key={index} style={styles.listItem}>
                    • {staff.name} - {staff.role}
                  </Text>
                ))}
              </View>
            )}
            {data.staffServices?.services && data.staffServices.services.length > 0 && (
              <View style={styles.listSection}>
                <Text style={styles.listTitle}>Services:</Text>
                {data.staffServices.services.map((service, index) => (
                  <Text key={index} style={styles.listItem}>
                    • {service.name} - RM{service.price}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Amenities Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <TouchableOpacity onPress={() => handleEdit('amenities')}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            {data.amenities && data.amenities.length > 0 ? (
              <View style={styles.amenitiesList}>
                {data.amenities.map((amenity, index) => (
                  <View key={index} style={styles.amenityItem}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <InfoRow label="Status" value="No amenities selected" />
            )}
          </View>
        </View>

        {/* Payout Details Section */}
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
              • Your barbershop application will be reviewed within 2-3 business days{'\\n'}
              • We'll verify your business documents and information{'\n'}
              • You'll receive a notification once approved{'\n'}
              • After approval, customers can start booking at your shop{'\n'}
              • You can manage bookings and staff through the partner dashboard
            </Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={[styles.footer, { paddingBottom: Platform.OS === 'android' ? insets.bottom + 16 : 32 }]}>
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
    <Ionicons name={icon as any} size={16} color={Colors.primary} />
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

    backgroundColor: Colors.errorLight,
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
    backgroundColor: Colors.primary,
  },
  progressActive: {
    backgroundColor: Colors.primary,
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
    color: Colors.primary,
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
    color: Colors.primary,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    width: 60,
  },
  hoursValue: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  closedValue: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  listSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  listItem: {
    fontSize: 13,
    color: '#1a1a1a',
    lineHeight: 20,
    paddingLeft: 8,
  },
  amenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    width: '48%',
  },
  amenityText: {
    fontSize: 13,
    color: '#1a1a1a',
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
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  link: {
    color: Colors.primary,
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
    // paddingBottom handled inline with insets
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
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
