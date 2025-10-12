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

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countryCode, setCountryCode] = useState('+60');

  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Malaysian format: 12-345 6789 or 11-2345 6789
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
    // Remove formatting characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Malaysian mobile numbers: 9-10 digits (without country code)
    // Format: 01X-XXX XXXX (10 digits) or 1X-XXXX XXXX (9 digits for old format)
    return cleaned.length >= 9 && cleaned.length <= 10;
  };

  const handleLogin = async () => {
    // Validate phone number
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

      // Navigate to OTP verification
      router.push({
        pathname: '/verify-otp',
        params: { phoneNumber: fullPhone },
      });
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
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
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('@/assets/logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue your grooming journey
            </Text>
          </View>

          {/* Phone Input Section */}
          <View style={styles.formSection}>
            <Text style={styles.label}>Phone Number</Text>
            
            <View style={styles.phoneInputContainer}>
              {/* Country Code Selector */}
              <TouchableOpacity style={styles.countryCodeButton} activeOpacity={0.7}>
                <Text style={styles.flag}>🇲🇾</Text>
                <Text style={styles.countryCode}>{countryCode}</Text>
                <Ionicons name="chevron-down" size={16} color="#6B7280" />
              </TouchableOpacity>

              {/* Phone Number Input */}
              <TextInput
                style={styles.phoneInput}
                placeholder="12-345 6789"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={13} // Formatted: 12-345 6789
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                autoFocus
                editable={!isLoading}
              />
            </View>

          {/* Helper Text */}
            <View style={styles.helperContainer}>
              <Ionicons name="information-circle-outline" size={14} color="#6B7280" />
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
            onPress={handleLogin}
            disabled={isButtonDisabled}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.continueButtonText}>Continue</Text>
            )}
          </TouchableOpacity>

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
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
    marginTop: 20,
  },
  logoContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  formSection: {
    marginBottom: 32,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    gap: 6,
  },
  flag: {
    fontSize: 20,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
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
    color: '#6B7280',
  },
  continueButton: {
    backgroundColor: '#00B14F',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 56,
  },
  continueButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  termsContainer: {
    marginTop: 20,
    paddingHorizontal: 32,
  },
  termsText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
  termsLink: {
    fontSize: 13,
    color: '#00B14F',
    fontWeight: '600',
    lineHeight: 20,
  },
});
