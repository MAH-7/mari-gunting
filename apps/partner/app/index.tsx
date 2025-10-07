import { Redirect } from 'expo-router';
import { useStore } from '@/store/useStore';
import { useEffect, useState } from 'react';
import SplashScreen from '../components/SplashScreen';

export default function Index() {
  const currentUser = useStore((state) => state.currentUser);
  const [showSplash, setShowSplash] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay to let store hydrate
    setTimeout(() => setIsReady(true), 100);
  }, []);

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

  // If logged in, go to dashboard
  return <Redirect href="/(tabs)/dashboard" />;
}
