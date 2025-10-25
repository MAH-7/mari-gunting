import { Stack } from 'expo-router';
import { LogBox } from 'react-native';
import { useEffect } from 'react';
import { initializeMapbox } from '../utils/mapbox';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Ignore LogBox errors during development
LogBox.ignoreAllLogs(true);

const queryClient = new QueryClient();

export default function PartnerRootLayout() {
  // Initialize Mapbox on app start
  useEffect(() => {
    initializeMapbox();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="verify-otp" />
        <Stack.Screen name="complete-profile" />
        <Stack.Screen name="select-account-type" />
        <Stack.Screen name="pending-approval" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </QueryClientProvider>
  );
}
