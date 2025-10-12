import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '@mari-gunting/shared/services/authService';
import { useStore } from '@/store/useStore';

export default function VerifyOTPScreen() {
  const params = useLocalSearchParams();
  const phoneNumber = params.phoneNumber as string;
  const setCurrentUser = useStore((state) => state.setCurrentUser);
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOTPChange = (value: string, index: number) => {
    // Handle paste (when user pastes full OTP)
    if (value.length > 1) {
      const otpArray = value.slice(0, 6).split('');
      const newOtp = otpArray.concat(Array(6 - otpArray.length).fill(''));
      setOtp(newOtp);
      
      // Focus last filled input
      const lastFilledIndex = Math.min(otpArray.length - 1, 5);
      inputRefs.current[lastFilledIndex]?.focus();
      return;
    }

    // Handle single digit input
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace - go to previous input
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      // Verify OTP with backend
      const response = await authService.verifyOTP(phoneNumber, otpCode);

      if (!response.success) {
        // User-friendly error messages
        let errorTitle = 'Verification Failed';
        let errorMessage = 'Invalid OTP code. Please try again.';
        
        if (response.error?.includes('expired') || response.error?.includes('invalid')) {
          errorTitle = 'Code Expired';
          errorMessage = 'This verification code has expired or been used. Please request a new one.';
        } else if (response.error?.includes('Token')) {
          errorTitle = 'Invalid Code';
          errorMessage = 'The code you entered is incorrect. Please check and try again.';
        }
        
        Alert.alert(errorTitle, errorMessage, [
          {
            text: 'Try Again',
            onPress: () => {
              setOtp(['', '', '', '', '', '']);
              inputRefs.current[0]?.focus();
            },
          },
          {
            text: 'Resend Code',
            onPress: handleResendOTP,
            style: 'cancel',
          },
        ]);
        setIsLoading(false);
        return;
      }

      // Check if user profile exists
      const userCheck = await authService.checkPhoneExists(phoneNumber);
      
      if (!userCheck.success || !userCheck.data?.exists) {
        // New user - navigate to registration
        router.replace({
          pathname: '/register',
          params: { 
            phoneNumber,
            // Pass role from params if exists (for partner app)
            role: params.role || 'customer',
          },
        });
      } else {
        // Existing user - save to store and navigate to main app
        if (response.data?.user) {
          setCurrentUser({
            id: response.data.user.id,
            name: response.data.user.full_name,
            email: response.data.user.email,
            phone: response.data.user.phone_number,
            avatar: response.data.user.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(response.data.user.full_name),
            role: response.data.user.role,
          } as any);
        }
        
        Alert.alert(
          'Welcome Back!',
          'Login successful',
          [{ text: 'Continue', onPress: () => router.replace('/(tabs)') }]
        );
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      
      // User-friendly error for network/connection issues
      Alert.alert(
        'Connection Error', 
        'Unable to verify code. Please check your internet connection and try again.',
        [
          { text: 'Try Again', onPress: () => setIsLoading(false) },
        ]
      );
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setIsLoading(true);

    try {
      const response = await authService.sendOTP({ phoneNumber });
      
      if (response.success) {
        Alert.alert(
          'OTP Sent!', 
          'A new verification code has been sent to your WhatsApp'
        );
        setCountdown(60);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        Alert.alert(
          'Failed to Resend', 
          response.error || 'Could not resend OTP. Please try again.'
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* WhatsApp Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.whatsappIcon}>
            <Ionicons name="logo-whatsapp" size={48} color="#FFFFFF" />
          </View>
        </View>

        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          We sent a code to your WhatsApp{'\n'}
          <Text style={styles.phone}>{phoneNumber}</Text>
        </Text>

        {/* OTP Input Boxes */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.otpInput,
                digit && styles.otpInputFilled,
              ]}
              value={digit}
              onChangeText={(value) => handleOTPChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              editable={!isLoading}
              autoFocus={index === 0}
            />
          ))}
        </View>

        {/* Dev Mode Hint */}
        {__DEV__ && (
          <View style={styles.devHint}>
            <Ionicons name="bug-outline" size={16} color="#F59E0B" />
            <Text style={styles.devHintText}>
              Dev Mode: Use OTP <Text style={styles.devOtp}>123456</Text>
            </Text>
          </View>
        )}

        {/* Verify Button */}
        <TouchableOpacity
          style={[
            styles.verifyButton,
            (otp.join('').length !== 6 || isLoading) && styles.verifyButtonDisabled,
          ]}
          onPress={handleVerifyOTP}
          disabled={otp.join('').length !== 6 || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.verifyButtonText}>Verify Code</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>

        {/* Resend Button */}
        <TouchableOpacity
          style={styles.resendContainer}
          onPress={handleResendOTP}
          disabled={countdown > 0 || isLoading}
          activeOpacity={0.7}
        >
          {countdown > 0 ? (
            <Text style={styles.resendText}>
              Resend code in <Text style={styles.countdown}>{countdown}s</Text>
            </Text>
          ) : (
            <View style={styles.resendActive}>
              <Ionicons name="refresh" size={18} color="#00B14F" />
              <Text style={styles.resendTextActive}>Resend Code</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* WhatsApp Help */}
        <View style={styles.helpContainer}>
          <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
          <Text style={styles.helpText}>
            Check your WhatsApp inbox for the verification code
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  iconContainer: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  whatsappIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  phone: {
    fontWeight: '600',
    color: '#111827',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  otpInput: {
    flex: 1,
    height: 56,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  otpInputFilled: {
    borderColor: '#25D366',
    backgroundColor: '#FFFFFF',
  },
  devHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 6,
  },
  devHintText: {
    fontSize: 13,
    color: '#92400E',
  },
  devOtp: {
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  verifyButton: {
    flexDirection: 'row',
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
    gap: 8,
  },
  verifyButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  resendContainer: {
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 14,
    color: '#6B7280',
  },
  countdown: {
    fontWeight: '600',
    color: '#00B14F',
  },
  resendActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resendTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00B14F',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    gap: 6,
  },
  helpText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    flex: 1,
  },
});
