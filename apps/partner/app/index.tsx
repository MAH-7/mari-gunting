import { Redirect } from 'expo-router';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import SplashScreen from '../components/SplashScreen';
import { verificationService, VerificationInfo } from '@mari-gunting/shared/services/verificationService';
import { supabase } from '@mari-gunting/shared/config/supabase';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { Ionicons } from '@expo/vector-icons';
import { loadBarberProgressFromDB, loadBarbershopProgressFromDB, barberOnboardingService, barbershopOnboardingService } from '@mari-gunting/shared/services/onboardingService';

export default function Index() {
  const currentUser = useStore((state) => state.currentUser);
  const logout = useStore((state) => state.logout);
  const [showSplash, setShowSplash] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [verificationChecked, setVerificationChecked] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationInfo | null>(null);
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState<number>(0);

  useEffect(() => {
    // Validate auth session on startup
    validateAuthSession();
  }, []);
  
  const validateAuthSession = async () => {
    try {
      // Check if we have a valid Supabase auth session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ [Auth] Session check error:', error);
      }
      
      // If we have a user in store but no valid auth session
      if (currentUser && !session) {
        console.warn('⚠️ [Auth] User in store but no auth session - clearing store');
        await logout();
        setIsReady(true);
        return;
      }
      
      // If we have an auth session but user ID doesn't match store
      if (session && currentUser && session.user.id !== currentUser.id) {
        console.warn('⚠️ [Auth] Session user ID mismatch - clearing store');
        console.warn('Session:', session.user.id);
        console.warn('Store:', currentUser.id);
        await logout();
        setIsReady(true);
        return;
      }
      
      // All good - proceed
      setIsReady(true);
    } catch (error) {
      console.error('❌ [Auth] Session validation error:', error);
      setIsReady(true);
    }
  };

  // Check verification status when user is ready
  useEffect(() => {
    if (isReady && currentUser) {
      checkVerificationStatus();
    } else if (isReady && !currentUser) {
      setVerificationChecked(true); // Skip verification check if no user
    }
  }, [isReady, currentUser]);

  const checkVerificationStatus = async () => {
    if (!currentUser?.id) {
      console.log('❌ [Index] No current user ID');
      setVerificationChecked(true);
      return;
    }

    try {
      setIsCheckingVerification(true);
      console.log('🔍 [Index] Checking verification for user:', currentUser.id);
      console.log('👤 [Index] Current user:', { id: currentUser.id, phone: currentUser.phone_number, role: currentUser.role });

      // Use currentUser.id directly (works in dev mode without auth session)
      const status = await verificationService.getVerificationStatus(currentUser.id);
      
      // Load onboarding progress from database if user has started onboarding
      if (status.accountType === 'freelance') {
        console.log('📥 Loading barber progress from database...');
        await loadBarberProgressFromDB(currentUser.id);
        // Get current step
        const step = await barberOnboardingService.getCurrentStep();
        setCurrentOnboardingStep(step);
        console.log('📍 Current barber step:', step);
      } else if (status.accountType === 'barbershop') {
        console.log('📥 Loading barbershop progress from database...');
        await loadBarbershopProgressFromDB(currentUser.id);
      }
      
      setVerificationStatus(status);
    } catch (error) {
      // On error, still mark as checked to prevent infinite loading
      setVerificationChecked(true);
    } finally {
      setIsCheckingVerification(false);
      setVerificationChecked(true);
    }
  };

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Wait for store to be ready
  if (!isReady) {
    return null;
  }

  // If no user, redirect to login
  if (!currentUser) {
    return <Redirect href="/login" />;
  }
  
  // Show loading screen while checking verification
  if (isCheckingVerification || !verificationChecked) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Checking your status...</Text>
      </View>
    );
  }
  
  // Route based on verification status
  if (verificationStatus) {
    console.log('🔍 [Index Routing] Verification Status:', {
      status: verificationStatus.status,
      accountType: verificationStatus.accountType,
      isComplete: verificationStatus.isComplete,
      hasSubmittedOnboarding: verificationStatus.hasSubmittedOnboarding,
      canAcceptBookings: verificationStatus.canAcceptBookings,
    });
    
    // If account setup not complete (no barber/barbershop record)
    if (!verificationStatus.isComplete) {
      // Check if account type already selected (barber or barbershop record exists)
      if (verificationStatus.accountType) {
        // Account type selected but onboarding not complete - route to appropriate onboarding screen
        if (verificationStatus.accountType === 'freelance') {
          // Route to last completed step
          const steps = [
            '/onboarding/barber/basic-info',
            '/onboarding/barber/ekyc',
            '/onboarding/barber/service-details',
            '/onboarding/barber/payout',
          ];
          return <Redirect href={steps[currentOnboardingStep] as any} />;
        } else if (verificationStatus.accountType === 'barbershop') {
          return <Redirect href="/onboarding/barbershop/business-info" />;
        }
      }
      // No account type selected - go to selection screen
      return <Redirect href="/select-account-type" />;
    }
    
    // CRITICAL: Check if user has submitted onboarding for review
    // hasSubmittedOnboarding = true when verification_status is 'pending' or 'verified'
    if (verificationStatus.isComplete && !verificationStatus.hasSubmittedOnboarding) {
      // Account exists but onboarding never submitted (status = 'unverified') - route to appropriate onboarding screen
      if (verificationStatus.accountType === 'freelance') {
        const steps = [
          '/onboarding/barber/basic-info',
          '/onboarding/barber/ekyc',
          '/onboarding/barber/service-details',
          '/onboarding/barber/payout',
        ];
        return <Redirect href={steps[currentOnboardingStep] as any} />;
      } else if (verificationStatus.accountType === 'barbershop') {
        return <Redirect href="/onboarding/barbershop/business-info" />;
      }
    }
    
    // If documents submitted but not yet approved (status = 'pending' or 'rejected')
    if (verificationStatus.hasSubmittedOnboarding && !verificationStatus.canAcceptBookings) {
      return <Redirect href="/pending-approval" />;
    }
    
    // If verified and approved (status = 'verified')
    if (verificationStatus.canAcceptBookings) {
      return <Redirect href="/(tabs)/dashboard" />;
    }
  }

  // Default fallback (shouldn't reach here if logic is correct)
  return <Redirect href="/(tabs)/dashboard" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
  },
  loadingText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
    marginTop: 16,
  },
});
