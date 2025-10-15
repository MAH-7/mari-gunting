import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useStore } from '@/store/useStore';
import SplashScreen from '../components/SplashScreen';
import { LogBox } from 'react-native';
import { initializeMapbox } from '../utils/mapbox';
import { BookingProvider } from '@/contexts/BookingContext';

// Ignore LogBox errors during development
// Customers will see user-friendly Alert messages instead
LogBox.ignoreAllLogs(true);

const queryClient = new QueryClient();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);
  const currentUser = useStore((state) => state.currentUser);

  // Initialize Mapbox on app start
  useEffect(() => {
    initializeMapbox();
  }, []);

  useEffect(() => {
    // Only navigate once after splash screen finishes
    if (isReady && !hasNavigated) {
      setHasNavigated(true);
      
      // Use setTimeout to avoid navigation during render
      setTimeout(() => {
        if (currentUser) {
          router.replace('/(tabs)');
        } else {
          router.replace('/welcome');
        }
      }, 100);
    }
  }, [isReady, hasNavigated, currentUser]);

  if (!isReady) {
    return <SplashScreen onFinish={() => setIsReady(true)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BookingProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          {/* Auth Screens */}
          <Stack.Screen name="welcome" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="select-role" />
          <Stack.Screen name="otp-verification" />
          <Stack.Screen name="forgot-password" />
          
          {/* Main App */}
          <Stack.Screen name="(tabs)" />
          
          {/* Other Screens */}
          <Stack.Screen name="barber-verification" />
        </Stack>
      </BookingProvider>
    </QueryClientProvider>
  );
}
