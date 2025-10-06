import { Redirect } from 'expo-router';
import { useStore } from '@/store/useStore';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const currentUser = useStore((state) => state.currentUser);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Small delay to let store hydrate
    setTimeout(() => setIsLoading(false), 100);
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // If no user, redirect to login
  if (!currentUser) {
    return <Redirect href="/login" />;
  }

  // If logged in, go to dashboard
  return <Redirect href="/(tabs)/dashboard" />;
}
