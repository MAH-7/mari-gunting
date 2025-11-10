import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useStore } from '@mari-gunting/shared/store/useStore';
import SplashScreen from '../components/SplashScreen';
import { LogBox } from 'react-native';
import { initializeMapbox } from '../utils/mapbox';
import { BookingProvider } from '@/contexts/BookingContext';
import { BarberOfflineProvider, useBarberOffline } from '@/contexts/BarberOfflineContext';
import AlertModal from '@/components/AlertModal';
import { Colors, theme } from '@mari-gunting/shared/theme';

// Ignore LogBox errors during development
// Customers will see user-friendly Alert messages instead
LogBox.ignoreAllLogs(true);

const queryClient = new QueryClient();

// Global modal component that listens to context
function GlobalBarberOfflineModal() {
  const { isOfflineModalVisible, barberName, hideBarberOfflineModal } = useBarberOffline();

  return (
    <AlertModal
      visible={isOfflineModalVisible}
      onClose={hideBarberOfflineModal}
      title="Barber Went Offline"
      message={`${barberName || 'This barber'} is no longer available right now.`}
      icon="alert-circle-outline"
      iconColor={Colors.warning}       buttonText="Find Another Barber"
      buttonIcon="search"
      onButtonPress={() => {
        hideBarberOfflineModal();
        router.dismissAll();
        router.replace('/(tabs)/');
      }}
    />
  );
}

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
        <BarberOfflineProvider>
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
          
          {/* Global Barber Offline Modal */}
          <GlobalBarberOfflineModal />
        </BarberOfflineProvider>
      </BookingProvider>
    </QueryClientProvider>
  );
}
