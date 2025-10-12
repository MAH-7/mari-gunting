import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button, LoadingSpinner } from '@mari-gunting/shared';
import { Colors, Typography, Spacing, BorderRadius } from '@mari-gunting/shared';

type Step = 'email' | 'otp' | 'newPassword' | 'success';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendOTP = async () => {
    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Call API to send OTP
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setStep('otp');
      Alert.alert(
        'OTP Sent',
        `A verification code has been sent to ${email}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Call API to verify OTP
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setStep('newPassword');
    } catch (error) {
      Alert.alert('Error', 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Call API to reset password
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setStep('success');
    } catch (error) {
      Alert.alert('Error', 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace('/login');
  };

  const renderEmailStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="mail-outline" size={48} color={Colors.primary} />
        </View>
      </View>

      <Text style={styles.title}>Forgot Password?</Text>
      <Text style={styles.subtitle}>
        Enter your email address and we'll send you a code to reset your password
      </Text>

      <View style={styles.form}>
        <Input
          label="Email Address"
          placeholder="your.email@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          disabled={isLoading}
          leftIcon={<Ionicons name="mail-outline" size={20} color={Colors.text.secondary} />}
          required
        />

        <Button
          title="Send Code"
          onPress={handleSendOTP}
          loading={isLoading}
          disabled={isLoading || !email}
          fullWidth
          size="large"
        />
      </View>
    </View>
  );

  const renderOTPStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="shield-checkmark-outline" size={48} color={Colors.primary} />
        </View>
      </View>

      <Text style={styles.title}>Enter Verification Code</Text>
      <Text style={styles.subtitle}>
        We've sent a 6-digit code to{'\n'}
        <Text style={styles.emailHighlight}>{email}</Text>
      </Text>

      <View style={styles.form}>
        <Input
          label="Verification Code"
          placeholder="000000"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
          disabled={isLoading}
          leftIcon={<Ionicons name="key-outline" size={20} color={Colors.text.secondary} />}
          required
        />

        <Button
          title="Verify Code"
          onPress={handleVerifyOTP}
          loading={isLoading}
          disabled={isLoading || otp.length !== 6}
          fullWidth
          size="large"
        />

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleSendOTP}
          disabled={isLoading}
        >
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          <Text style={styles.resendLink}>Resend</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderNewPasswordStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed-outline" size={48} color={Colors.primary} />
        </View>
      </View>

      <Text style={styles.title}>Create New Password</Text>
      <Text style={styles.subtitle}>
        Your new password must be different from previous passwords
      </Text>

      <View style={styles.form}>
        <Input
          label="New Password"
          placeholder="Enter new password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showPassword}
          disabled={isLoading}
          leftIcon={<Ionicons name="lock-closed-outline" size={20} color={Colors.text.secondary} />}
          rightIcon={
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.text.secondary}
              />
            </TouchableOpacity>
          }
          helperText="Minimum 8 characters"
          required
        />

        <Input
          label="Confirm Password"
          placeholder="Re-enter password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          disabled={isLoading}
          leftIcon={<Ionicons name="lock-closed-outline" size={20} color={Colors.text.secondary} />}
          rightIcon={
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.text.secondary}
              />
            </TouchableOpacity>
          }
          required
        />

        <Button
          title="Reset Password"
          onPress={handleResetPassword}
          loading={isLoading}
          disabled={isLoading || !newPassword || !confirmPassword}
          fullWidth
          size="large"
        />
      </View>
    </View>
  );

  const renderSuccessStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <View style={[styles.iconCircle, styles.successCircle]}>
          <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
        </View>
      </View>

      <Text style={styles.title}>Password Reset Successful!</Text>
      <Text style={styles.subtitle}>
        Your password has been successfully reset. You can now log in with your new password.
      </Text>

      <View style={styles.form}>
        <Button
          title="Back to Login"
          onPress={handleBackToLogin}
          fullWidth
          size="large"
        />
      </View>
    </View>
  );

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
          {step !== 'success' && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => step === 'email' ? router.back() : setStep('email')}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          )}

          {/* Render Current Step */}
          {step === 'email' && renderEmailStep()}
          {step === 'otp' && renderOTPStep()}
          {step === 'newPassword' && renderNewPasswordStep()}
          {step === 'success' && renderSuccessStep()}
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  stepContainer: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCircle: {
    backgroundColor: Colors.success + '10',
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  emailHighlight: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
  form: {
    gap: Spacing.md,
  },
  resendButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  resendText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  resendLink: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
});
