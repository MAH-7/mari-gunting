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
import { authService } from '@mari-gunting/shared/services/authService';
import { Colors, theme } from '@mari-gunting/shared/theme';

export default function PartnerRegisterScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countryCode, setCountryCode] = useState('+60');

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    
    if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
    } else {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)} ${cleaned.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 9 && cleaned.length <= 10;
  };

  const handleRegister = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert(
        'Invalid Phone Number',
        'Please enter a valid Malaysian phone number (9-10 digits)',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoading(true);

    try {
      // Format phone number
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const fullPhone = `${countryCode}${cleanPhone}`;

      // Send OTP via Supabase/Twilio WhatsApp
      const response = await authService.sendOTP({ phoneNumber: fullPhone });

      if (!response.success) {
        Alert.alert(
          'Failed to Send OTP',
          response.error || 'Please try again',
          [{ text: 'OK' }]
        );
        return;
      }

      // Navigate to OTP verification with barber role for registration
      router.push({
        pathname: '/verify-otp',
        params: { 
          phoneNumber: fullPhone,
          role: 'barber', // Partner app = barber role
        },
      });
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error.message || 'Unable to send OTP. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled = !validatePhoneNumber(phoneNumber) || isLoading;

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
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>

          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            
            <Text style={styles.title}>Become a Partner</Text>
            <Text style={styles.subtitle}>
              Join our platform and grow your business
            </Text>
          </View>

          {/* Benefits Section */}
          <View style={styles.benefitsSection}>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name="people" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.benefitText}>Reach more customers</Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name="calendar" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.benefitText}>Manage bookings easily</Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name="trending-up" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.benefitText}>Grow your revenue</Text>
            </View>
          </View>

          {/* Phone Input Section */}
          <View style={styles.formSection}>
            <Text style={styles.label}>Phone Number</Text>
            
            <View style={styles.phoneInputContainer}>
              {/* Country Code Selector */}
              <TouchableOpacity style={styles.countryCodeButton} activeOpacity={0.7}>
                <Text style={styles.flag}>🇲🇾</Text>
                <Text style={styles.countryCode}>{countryCode}</Text>
                <Ionicons name="chevron-down" size={16} color={Colors.gray[500]} />
              </TouchableOpacity>

              {/* Phone Number Input */}
              <TextInput
                style={styles.phoneInput}
                placeholder="12-345 6789"
                placeholderTextColor={Colors.gray[400]}                 keyboardType="phone-pad"
                maxLength={13}
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                autoFocus
                editable={!isLoading}
              />
            </View>

            {/* Helper Text */}
            <View style={styles.helperContainer}>
              <Ionicons name="information-circle-outline" size={14} color={Colors.gray[500]} />
              <Text style={styles.helperText}>
                We'll send an OTP to verify your number
              </Text>
            </View>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              isButtonDisabled && styles.continueButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={isButtonDisabled}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={styles.continueButtonText}>Continue</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>
              Already have an account?{' '}
              <Text 
                style={styles.loginLink}
                onPress={() => router.push('/login')}
              >
                Login
              </Text>
            </Text>
          </View>

          {/* Terms & Conditions */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By continuing, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
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
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
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
  benefitsSection: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  benefitText: {
    fontSize: 14,
    color: Colors.gray[700],
    fontWeight: '500',
  },
  formSection: {
    marginBottom: 32,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: 12,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gray[200],
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    overflow: 'hidden',
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: Colors.gray[200],
    gap: 6,
  },
  flag: {
    fontSize: 20,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  helperText: {
    fontSize: 13,
    color: Colors.gray[500],
  },
  continueButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 56,
    marginBottom: 16,
  },
  continueButtonDisabled: {
    backgroundColor: Colors.gray[300],
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  loginContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  loginText: {
    fontSize: 14,
    color: Colors.gray[500],
  },
  loginLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  termsContainer: {
    marginTop: 4,
    paddingHorizontal: 32,
  },
  termsText: {
    fontSize: 13,
    color: Colors.gray[500],
    lineHeight: 20,
    textAlign: 'center',
  },
  termsLink: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
    lineHeight: 20,
  },
});
