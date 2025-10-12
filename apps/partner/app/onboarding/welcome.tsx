import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { useStore } from '@/store/useStore';

export default function WelcomeScreen() {
  const updateOnboardingProgress = useStore((state) => state.updateOnboardingProgress);

  const handleGetStarted = () => {
    console.log('🚀 Get Started clicked');
    
    // Initialize onboarding
    updateOnboardingProgress({
      status: 'phone_verified',
      currentStep: 1,
      totalSteps: 8,
      completedSteps: ['account_type'],
    });
    
    console.log('✅ Onboarding progress updated');
    console.log('➡️ Navigating to /onboarding/ekyc');
    
    // Account type already selected before onboarding
    // Go directly to eKYC verification
    router.push('/onboarding/ekyc');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Mari Gunting</Text>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.title}>Welcome to Partner Onboarding!</Text>
          <Text style={styles.subtitle}>
            Let's get you set up to start earning. This process takes about 10-15 minutes.
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>What to Expect:</Text>
          
          <View style={styles.benefitItem}>
            <View style={[styles.benefitIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="shield-checkmark" size={24} color="#2196F3" />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Identity Verification</Text>
              <Text style={styles.benefitText}>Quick NRIC/Passport verification for security</Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <View style={[styles.benefitIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="wallet" size={24} color="#4CAF50" />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Payout Setup</Text>
              <Text style={styles.benefitText}>Connect your bank account securely</Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <View style={[styles.benefitIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="cut" size={24} color="#9C27B0" />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Services & Pricing</Text>
              <Text style={styles.benefitText}>Configure your services and rates</Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <View style={[styles.benefitIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="images" size={24} color="#FF9800" />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Portfolio</Text>
              <Text style={styles.benefitText}>Showcase your best work to customers</Text>
            </View>
          </View>
        </View>

        {/* Steps Info */}
        <View style={styles.stepsInfo}>
          <View style={styles.stepsRow}>
            <Ionicons name="time-outline" size={20} color={COLORS.text.secondary} />
            <Text style={styles.stepsText}>7-8 simple steps</Text>
          </View>
          <View style={styles.stepsRow}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.stepsText}>Quick approval process</Text>
          </View>
        </View>

        {/* Get Started Button */}
        <TouchableOpacity 
          style={styles.startButton}
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Footer Note */}
        <Text style={styles.footerNote}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  content: {
    flexGrow: 1,
    padding: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  heroSection: {
    marginBottom: 32,
  },
  title: {
    ...TYPOGRAPHY.heading.h1,
    color: COLORS.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  benefitsSection: {
    marginBottom: 32,
  },
  benefitsTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  benefitContent: {
    flex: 1,
    paddingTop: 4,
  },
  benefitTitle: {
    ...TYPOGRAPHY.body.medium,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  benefitText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  stepsInfo: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepsText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    ...TYPOGRAPHY.body.large,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  footerNote: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
