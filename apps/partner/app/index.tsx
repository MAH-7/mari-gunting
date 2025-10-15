import { Redirect } from 'expo-router';
import { useStore } from '@/store/useStore';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import SplashScreen from '../components/SplashScreen';
import { verificationService, VerificationInfo } from '@mari-gunting/shared/services/verificationService';
import { supabase } from '@mari-gunting/shared/config/supabase';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';

export default function Index() {
  const currentUser = useStore((state) => state.currentUser);
  const [showSplash, setShowSplash] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [verificationChecked, setVerificationChecked] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationInfo | null>(null);

  useEffect(() => {
    // Small delay to let store hydrate
    setTimeout(() => setIsReady(true), 100);
  }, []);

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
      setVerificationChecked(true);
      return;
    }

    try {
      setIsCheckingVerification(true);

      // Use currentUser.id directly (works in dev mode without auth session)
      const status = await verificationService.getVerificationStatus(currentUser.id);
      
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
    // If account setup not complete (no barber/barbershop record)
    if (!verificationStatus.isComplete) {
      // Check if account type already selected (barber or barbershop record exists)
      if (verificationStatus.accountType) {
        // Account type selected but onboarding not complete - route to appropriate onboarding screen
        if (verificationStatus.accountType === 'freelance') {
          return <Redirect href="/onboarding/barber/basic-info" />;
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
        return <Redirect href="/onboarding/barber/basic-info" />;
      } else if (verificationStatus.accountType === 'barbershop') {
        return <Redirect href="/onboarding/barbershop/business-info" />;
      }
    }
    
    // If documents submitted but not yet approved (status = 'pending')
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
