import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useStore } from '@/store/useStore';
import { getNextOnboardingRoute, calculateCompletionPercentage } from '@/utils/onboarding';
import { COLORS } from '@/shared/constants';

export default function OnboardingLayout() {
  const router = useRouter();
  const segments = useSegments();
  const onboardingData = useStore((state) => state.onboardingData);
  
  // Route guard - DISABLED for now since we're skipping services/availability/portfolio screens
  // TODO: Re-enable when all onboarding screens are implemented
  useEffect(() => {
    // Commented out to allow direct navigation to pending-approval
    // if (!onboardingData) return;
    // 
    // const currentRoute = `/${segments.join('/')}`;
    // const expectedRoute = getNextOnboardingRoute(onboardingData.progress);
    // 
    // console.log('🛑 Route guard check:', { currentRoute, expectedRoute });
    // 
    // // If user is on wrong route, redirect to correct step
    // if (currentRoute !== expectedRoute && segments[0] === 'onboarding' && segments[1] !== 'welcome') {
    //   console.log('⚠️ Redirecting from', currentRoute, 'to', expectedRoute);
    //   router.replace(expectedRoute as any);
    // }
  }, [onboardingData, segments]);

  return (
    <>
      {/* Progress Bar */}
      {onboardingData && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${calculateCompletionPercentage(onboardingData.progress)}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            Step {onboardingData.progress.currentStep} of {onboardingData.progress.totalSteps}
          </Text>
        </View>
      )}
      
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: false, // Prevent swipe back
        }}
      >
        {/* Core Onboarding Screens */}
        <Stack.Screen name="ekyc" />
        <Stack.Screen name="business" />
        <Stack.Screen name="payout" />
        
        {/* Phase 2 - Optional Enhancement Screens (not implemented yet) */}
        {/* Uncomment when Phase 2 screens are created:
        <Stack.Screen name="services" />
        <Stack.Screen name="availability" />
        <Stack.Screen name="portfolio" />
        <Stack.Screen name="review" />
        <Stack.Screen name="pending-review" />
        <Stack.Screen name="fix-issues" />
        <Stack.Screen name="rejected" />
        */}
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  progressContainer: {
    backgroundColor: COLORS.background.primary,
    paddingTop: 60, // Account for safe area
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.background.tertiary,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});
