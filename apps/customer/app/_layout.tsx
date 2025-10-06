import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useStore } from '@/store/useStore';
import SplashScreen from '../components/SplashScreen';

const queryClient = new QueryClient();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);
  const currentUser = useStore((state) => state.currentUser);

  useEffect(() => {
    // Only navigate once after splash screen finishes
    if (isReady && !hasNavigated) {
      setHasNavigated(true);
      
      // Use setTimeout to avoid navigation during render
      setTimeout(() => {
        if (currentUser) {
          router.replace('/(tabs)');
        } else {
          router.replace('/login');
        }
      }, 100);
    }
  }, [isReady, hasNavigated, currentUser]);

  if (!isReady) {
    return <SplashScreen onFinish={() => setIsReady(true)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="select-role" />
        <Stack.Screen name="otp-verification" />
        <Stack.Screen name="barber-verification" />
      </Stack>
    </QueryClientProvider>
  );
}
