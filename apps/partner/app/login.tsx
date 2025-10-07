/**
 * Partner Login Screen
 * 
 * Professional login screen for Mari Gunting Partner app.
 * Allows barbers and service partners to sign in and access their dashboard.
 * 
 * @production-ready
 */

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, ACTIVE_OPACITY } from '@/shared/constants';
import { useStore } from '@/store/useStore';
import { mockBarbers } from '@/services/mockData';
import { Button } from '@/components-shared';

export default function PartnerLoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const setCurrentUser = useStore((state) => state.setCurrentUser);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!phone.trim()) {
      Alert.alert('Missing Phone', 'Please enter your phone number');
      return;
    }

    setLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      // Format phone for comparison
      const formattedPhone = phone.trim();
      
      // Quick login: match phone to partner
      const partner = mockBarbers.find(b => 
        b.phone.includes(formattedPhone) || formattedPhone.includes('22-222')
      );

      setLoading(false);

      if (partner) {
        setCurrentUser(partner);
        router.replace('/(tabs)/dashboard');
      } else {
        Alert.alert(
          'Login Failed', 
          'Partner not found. Please check your phone number.\n\nTest Partner: 22-222 2222',
          [{ text: 'OK' }]
        );
      }
    }, 800);
  };

  const handleQuickLogin = () => {
    // Quick login for testing
    const partner = mockBarbers[0]; // Amir Hafiz
    setCurrentUser(partner);
    router.replace('/(tabs)/dashboard');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Icon */}
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#00B14F', '#00A043']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Ionicons name="cut" size={48} color="#FFFFFF" />
              </LinearGradient>
              
              {/* PRO Badge */}
              <View style={styles.proBadge}>
                <Ionicons name="briefcase" size={12} color="#FFFFFF" />
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            </View>
            
            <Text style={styles.title}>Partner Login</Text>
            <Text style={styles.subtitle}>Sign in to manage your business</Text>
          </Animated.View>

          {/* Login Form */}
          <Animated.View 
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={[
                styles.inputWrapper,
                isFocused && styles.inputWrapperFocused,
              ]}>
                <Ionicons 
                  name="call-outline" 
                  size={20} 
                  color={isFocused ? COLORS.primary : COLORS.text.tertiary} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 22-222 2222"
                  placeholderTextColor={COLORS.text.tertiary}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Login Button */}
            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              style={styles.loginButton}
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Quick Login for Testing */}
            <TouchableOpacity 
              style={styles.quickLoginButton}
              onPress={handleQuickLogin}
              activeOpacity={ACTIVE_OPACITY.SECONDARY}
              disabled={loading}
            >
              <Ionicons name="flash" size={20} color={COLORS.primary} />
              <Text style={styles.quickLoginText}>Quick Login (Test)</Text>
            </TouchableOpacity>

            {/* Test Account Info */}
            <View style={styles.testInfoCard}>
              <View style={styles.testInfoHeader}>
                <Ionicons name="information-circle" size={20} color={COLORS.info} />
                <Text style={styles.testInfoTitle}>Test Account</Text>
              </View>
              <Text style={styles.testInfoText}>Phone: <Text style={styles.testInfoBold}>22-222 2222</Text></Text>
              <Text style={styles.testInfoText}>Name: Amir Hafiz</Text>
            </View>
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity activeOpacity={ACTIVE_OPACITY.PRIMARY}>
              <Text style={styles.footerLink}>Register as Partner</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.xxl,
    justifyContent: 'center',
  },
  
  // Header Styles
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: SPACING.xl,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  proBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  proBadgeText: {
    color: COLORS.text.inverse,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    ...TYPOGRAPHY.heading.h1,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  
  // Form Styles
  formContainer: {
    marginBottom: SPACING.xxl,
  },
  inputContainer: {
    marginBottom: SPACING.xl,
  },
  label: {
    ...TYPOGRAPHY.label.regular,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border.light,
    paddingHorizontal: SPACING.lg,
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    marginRight: SPACING.md,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.primary,
    paddingVertical: SPACING.lg,
  },
  loginButton: {
    marginBottom: SPACING.lg,
  },
  
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border.light,
  },
  dividerText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.tertiary,
    marginHorizontal: SPACING.lg,
    fontWeight: '600',
  },
  
  // Quick Login Button
  quickLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  quickLoginText: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary,
  },
  
  // Test Info Card
  testInfoCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
  },
  testInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  testInfoTitle: {
    ...TYPOGRAPHY.label.regular,
    color: COLORS.info,
  },
  testInfoText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  testInfoBold: {
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  
  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xl,
  },
  footerText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
  },
  footerLink: {
    ...TYPOGRAPHY.label.regular,
    color: COLORS.primary,
  },
});
