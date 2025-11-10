import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, theme } from '@mari-gunting/shared/theme';

export default function BarberVerificationScreen() {
  // Personal Info
  const [fullName, setFullName] = useState('');
  const [icNumber, setIcNumber] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  
  // Documents
  const [icFrontPhoto, setIcFrontPhoto] = useState<string | null>(null);
  const [icBackPhoto, setIcBackPhoto] = useState<string | null>(null);
  const [certificationDoc, setCertificationDoc] = useState<any>(null);
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);

  const handlePickImage = async (type: 'ic-front' | 'ic-back' | 'selfie') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: type === 'selfie' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        if (type === 'ic-front') setIcFrontPhoto(uri);
        else if (type === 'ic-back') setIcBackPhoto(uri);
        else if (type === 'selfie') setSelfiePhoto(uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setCertificationDoc(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!fullName.trim()) {
      Alert.alert('Required', 'Please enter your full name');
      return;
    }

    if (!icNumber.trim() || icNumber.replace(/\D/g, '').length !== 12) {
      Alert.alert('Invalid IC', 'Please enter a valid 12-digit IC number');
      return;
    }

    if (!icFrontPhoto || !icBackPhoto) {
      Alert.alert('Required', 'Please upload both sides of your IC');
      return;
    }

    if (!selfiePhoto) {
      Alert.alert('Required', 'Please upload a selfie for verification');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // TODO: Upload documents to backend
      // const formData = new FormData();
      // formData.append('fullName', fullName);
      // formData.append('icNumber', icNumber);
      // formData.append('businessName', businessName);
      // formData.append('yearsExperience', yearsExperience);
      // formData.append('icFront', icFrontPhoto);
      // formData.append('icBack', icBackPhoto);
      // formData.append('selfie', selfiePhoto);
      // if (certificationDoc) formData.append('certification', certificationDoc);
      // await api.submitBarberVerification(formData);

      Alert.alert(
        'Verification Submitted!',
        'Your application is under review. We\'ll notify you within 1-3 business days.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Submission Failed', 'Please try again later');
    } finally {
      setIsLoading(false);
    }
  };

  const formatICNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 6) {
      return cleaned;
    } else if (cleaned.length <= 8) {
      return `${cleaned.slice(0, 6)}-${cleaned.slice(6)}`;
    } else {
      return `${cleaned.slice(0, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8, 12)}`;
    }
  };

  const isFormValid = 
    fullName.trim() && 
    icNumber.replace(/\D/g, '').length === 12 && 
    icFrontPhoto && 
    icBackPhoto && 
    selfiePhoto;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <View style={styles.iconBadge}>
              <Ionicons name="shield-checkmark" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Barber Verification</Text>
            <Text style={styles.subtitle}>
              Complete KYC to become a verified barber
            </Text>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '33%' }]} />
            </View>
            <Text style={styles.progressText}>Step 1 of 3: Personal Information</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Full Name (as per IC) <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={Colors.gray[500]} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor={Colors.gray[400]}                   value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* IC Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                IC Number <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="card-outline" size={20} color={Colors.gray[500]} />
                <TextInput
                  style={styles.input}
                  placeholder="123456-12-1234"
                  placeholderTextColor={Colors.gray[400]}                   value={icNumber}
                  onChangeText={(text) => setIcNumber(formatICNumber(text))}
                  keyboardType="number-pad"
                  maxLength={14}
                  editable={!isLoading}
                />
              </View>
              <Text style={styles.helperText}>12-digit Malaysian IC number</Text>
            </View>

            {/* Business Name (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business/Salon Name (Optional)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="business-outline" size={20} color={Colors.gray[500]} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Premium Cuts Barbershop"
                  placeholderTextColor={Colors.gray[400]}                   value={businessName}
                  onChangeText={setBusinessName}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Years of Experience */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Years of Experience</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="time-outline" size={20} color={Colors.gray[500]} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 5"
                  placeholderTextColor={Colors.gray[400]}                   value={yearsExperience}
                  onChangeText={setYearsExperience}
                  keyboardType="number-pad"
                  maxLength={2}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Document Upload Section */}
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Required Documents</Text>

            {/* IC Front Photo */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                IC Front Photo <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => handlePickImage('ic-front')}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                {icFrontPhoto ? (
                  <Image source={{ uri: icFrontPhoto }} style={styles.uploadedImage} />
                ) : (
                  <>
                    <Ionicons name="camera" size={32} color={Colors.gray[500]} />
                    <Text style={styles.uploadText}>Upload IC Front</Text>
                    <Text style={styles.uploadHint}>Clear photo, all corners visible</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* IC Back Photo */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                IC Back Photo <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => handlePickImage('ic-back')}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                {icBackPhoto ? (
                  <Image source={{ uri: icBackPhoto }} style={styles.uploadedImage} />
                ) : (
                  <>
                    <Ionicons name="camera" size={32} color={Colors.gray[500]} />
                    <Text style={styles.uploadText}>Upload IC Back</Text>
                    <Text style={styles.uploadHint}>Clear photo, all corners visible</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Selfie Photo */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Selfie Photo <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => handlePickImage('selfie')}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                {selfiePhoto ? (
                  <Image source={{ uri: selfiePhoto }} style={styles.uploadedImage} />
                ) : (
                  <>
                    <Ionicons name="person-circle" size={32} color={Colors.gray[500]} />
                    <Text style={styles.uploadText}>Upload Selfie</Text>
                    <Text style={styles.uploadHint}>Hold your IC next to your face</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Certification (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Barber Certification (Optional)</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handlePickDocument}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                {certificationDoc ? (
                  <View style={styles.docInfo}>
                    <Ionicons name="document-text" size={32} color={Colors.primary} />
                    <Text style={styles.docName} numberOfLines={1}>
                      {certificationDoc.name}
                    </Text>
                    <Text style={styles.docSize}>
                      {(certificationDoc.size / 1024 / 1024).toFixed(2)} MB
                    </Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="document-attach" size={32} color={Colors.gray[500]} />
                    <Text style={styles.uploadText}>Upload Certificate</Text>
                    <Text style={styles.uploadHint}>PDF or Image (optional)</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#0891B2" />
              <Text style={styles.infoText}>
                Your documents will be securely reviewed by our team within 1-3 business days.
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!isFormValid || isLoading) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Submit for Verification</Text>
                <Ionicons name="shield-checkmark" size={20} color={Colors.white} />
              </>
            )}
          </TouchableOpacity>

          {/* Terms */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By submitting, you agree to our{' '}
              <Text style={styles.termsLink}>Barber Terms & Conditions</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
  },
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    fontSize: 13,
    color: Colors.gray[500],
    fontWeight: '600',
  },
  formSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: 8,
  },
  required: {
    color: Colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  helperText: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 6,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray[200],
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    borderRadius: 12,
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  uploadedImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[700],
    marginTop: 12,
  },
  uploadHint: {
    fontSize: 13,
    color: Colors.gray[400],
    marginTop: 4,
  },
  docInfo: {
    alignItems: 'center',
  },
  docName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 8,
    maxWidth: 200,
  },
  docSize: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#ECFEFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#0E7490',
    lineHeight: 20,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 56,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.gray[300],
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  termsContainer: {
    paddingHorizontal: 32,
    marginTop: 20,
  },
  termsText: {
    fontSize: 13,
    color: Colors.gray[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
