import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { barberService, BarberProfile } from '@/shared/services/barberService';
import { useStore } from '@/store/useStore';
import { COLORS } from '@/shared/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function VerificationDocumentsScreen() {
  const currentUser = useStore((state) => state.currentUser);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<BarberProfile | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      if (!currentUser?.id) {
        Alert.alert('Error', 'User not found');
        router.back();
        return;
      }

      const barberProfile = await barberService.getBarberProfileByUserId(currentUser.id);
      
      if (barberProfile) {
        setProfile(barberProfile);
      } else {
        Alert.alert('Error', 'Failed to load profile data');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const maskAccountNumber = (number: string) => {
    if (number.length <= 4) return number;
    return '*'.repeat(number.length - 4) + number.slice(-4);
  };

  const getVerificationStatusColor = (status?: string) => {
    switch (status) {
      case 'verified':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'rejected':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const getVerificationStatusText = (status?: string) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'pending':
        return 'Pending Review';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unverified';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading verification details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
        <View style={styles.loadingContainer}>
          <Ionicons name="warning-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>Failed to load verification data</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadProfile}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const verificationStatus = profile.verificationStatus || 'unverified';
  const statusColor = getVerificationStatusColor(verificationStatus);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFF' }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification & Documents</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Verification Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: `${statusColor}15` }]}>
          <View style={[styles.statusIcon, { backgroundColor: statusColor }]}>
            <Ionicons 
              name={verificationStatus === 'verified' ? 'checkmark' : verificationStatus === 'pending' ? 'time' : 'close'} 
              size={24} 
              color="#FFF" 
            />
          </View>
          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>{getVerificationStatusText(verificationStatus)}</Text>
            <Text style={styles.statusSubtitle}>
              {verificationStatus === 'verified' 
                ? 'Your account is verified and active'
                : verificationStatus === 'pending'
                ? 'Your documents are under review'
                : 'Please contact support for assistance'
              }
            </Text>
            {profile.joinedDate && (
              <Text style={styles.statusDate}>
                Member since {new Date(profile.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </Text>
            )}
          </View>
        </View>

        {/* Identity Verification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Submitted Documents</Text>
          <Text style={styles.sectionSubtitle}>Your identity documents have been verified and secured</Text>
          
          {/* Document Cards */}
          <View style={styles.documentCard}>
            <View style={styles.documentCardHeader}>
              <View style={styles.documentCardIcon}>
                <Ionicons name="card" size={24} color="#4CAF50" />
              </View>
              <View style={styles.documentCardContent}>
                <Text style={styles.documentCardTitle}>Identity Card (IC)</Text>
                <Text style={styles.documentCardDesc}>Both front and back photos</Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            </View>
            <View style={styles.documentCardDetails}>
              <Text style={styles.documentCardLabel}>Used for identity verification and age confirmation</Text>
            </View>
            {/* IC Images */}
            {(profile.verificationDocuments?.ic_front || profile.verificationDocuments?.ic_back) && (
              <View style={styles.documentImages}>
                {profile.verificationDocuments?.ic_front && (
                  <TouchableOpacity 
                    style={styles.imagePreview}
                    onPress={() => setSelectedImage(profile.verificationDocuments!.ic_front!)}
                    activeOpacity={0.7}
                  >
                    <Image 
                      source={{ uri: profile.verificationDocuments.ic_front }} 
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                    <View style={styles.imageLabelContainer}>
                      <Text style={styles.imageLabel}>Front</Text>
                    </View>
                  </TouchableOpacity>
                )}
                {profile.verificationDocuments?.ic_back && (
                  <TouchableOpacity 
                    style={styles.imagePreview}
                    onPress={() => setSelectedImage(profile.verificationDocuments!.ic_back!)}
                    activeOpacity={0.7}
                  >
                    <Image 
                      source={{ uri: profile.verificationDocuments.ic_back }} 
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                    <View style={styles.imageLabelContainer}>
                      <Text style={styles.imageLabel}>Back</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          <View style={styles.documentCard}>
            <View style={styles.documentCardHeader}>
              <View style={styles.documentCardIcon}>
                <Ionicons name="person" size={24} color="#4CAF50" />
              </View>
              <View style={styles.documentCardContent}>
                <Text style={styles.documentCardTitle}>Selfie Photo</Text>
                <Text style={styles.documentCardDesc}>Face verification</Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            </View>
            <View style={styles.documentCardDetails}>
              <Text style={styles.documentCardLabel}>Used to verify your identity matches your IC photo</Text>
            </View>
            {/* Selfie Image */}
            {profile.verificationDocuments?.selfie && (
              <View style={styles.documentImages}>
                <TouchableOpacity 
                  style={[styles.imagePreview, styles.selfiePreview]}
                  onPress={() => setSelectedImage(profile.verificationDocuments!.selfie!)}
                  activeOpacity={0.7}
                >
                  <Image 
                    source={{ uri: profile.verificationDocuments.selfie }} 
                    style={[styles.previewImage, styles.selfieImage]}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {profile.verificationDocuments?.certificates && profile.verificationDocuments.certificates.length > 0 && (
            <View style={styles.documentCard}>
              <View style={styles.documentCardHeader}>
                <View style={styles.documentCardIcon}>
                  <Ionicons name="school" size={24} color="#4CAF50" />
                </View>
                <View style={styles.documentCardContent}>
                  <Text style={styles.documentCardTitle}>Professional Certificates</Text>
                  <Text style={styles.documentCardDesc}>{profile.verificationDocuments.certificates.length} certificate(s) on file</Text>
                </View>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              </View>
              <View style={styles.documentCardDetails}>
                <Text style={styles.documentCardLabel}>Barbering qualifications and professional certifications</Text>
              </View>
              {/* Certificate Images */}
              <View style={styles.documentImages}>
                {profile.verificationDocuments.certificates.map((cert, index) => (
                  <TouchableOpacity 
                    key={index}
                    style={styles.imagePreview}
                    onPress={() => setSelectedImage(cert)}
                    activeOpacity={0.7}
                  >
                    <Image 
                      source={{ uri: cert }} 
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                    <View style={styles.imageLabelContainer}>
                      <Text style={styles.imageLabel}>Cert {index + 1}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Verification Benefits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification Benefits</Text>
          <View style={styles.benefitsCard}>
            <BenefitItem 
              icon="shield-checkmark" 
              title="Trusted Profile" 
              description="Verified badge increases customer trust and booking rates"
            />
            <BenefitItem 
              icon="star" 
              title="Priority Visibility" 
              description="Verified barbers appear higher in search results"
            />
            <BenefitItem 
              icon="cash" 
              title="Secure Payouts" 
              description="Verified identity ensures safe and reliable payments"
            />
            <BenefitItem 
              icon="people" 
              title="Customer Confidence" 
              description="Customers prefer booking with verified professionals"
            />
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#2196F3" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Need to update your information?</Text>
            <Text style={styles.infoText}>
              To update your verification documents or business details, please contact our support team.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Image Viewer Modal */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalClose}
            onPress={() => setSelectedImage(null)}
            activeOpacity={0.9}
          >
            <View style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#FFF" />
            </View>
          </TouchableOpacity>
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
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

const BenefitItem = ({ icon, title, description }: { icon: string; title: string; description: string }) => (
  <View style={styles.benefitItem}>
    <View style={styles.benefitIcon}>
      <Ionicons name={icon as any} size={20} color="#4CAF50" />
    </View>
    <View style={styles.benefitContent}>
      <Text style={styles.benefitTitle}>{title}</Text>
      <Text style={styles.benefitDescription}>{description}</Text>
    </View>
  </View>
);

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
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
  statusBanner: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 24,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statusDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoRowColumn: {
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    width: 140,
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
  },
  valueMultiline: {
    lineHeight: 20,
  },
  documentsRow: {
    paddingVertical: 8,
  },
  documentsList: {
    marginTop: 8,
    gap: 8,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  documentText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  documentCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  documentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F9F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  documentCardContent: {
    flex: 1,
  },
  documentCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  documentCardDesc: {
    fontSize: 14,
    color: '#666',
  },
  documentCardDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  documentCardLabel: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  benefitsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  benefitItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  documentImages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  imagePreview: {
    width: (SCREEN_WIDTH - 40 - 32 - 16) / 2, // Account for padding and gap
    aspectRatio: 16 / 10,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selfiePreview: {
    width: 120,
    aspectRatio: 1,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  selfieImage: {
    borderRadius: 8,
  },
  imageLabelContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  imageLabel: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: '80%',
  },
});
