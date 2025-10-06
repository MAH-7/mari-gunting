import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { useStore } from '@/store/useStore';
import { mockBarbers } from '@/services/mockData';

export default function ProviderLoginScreen() {
  const [phone, setPhone] = useState('');
  const setCurrentUser = useStore((state) => state.setCurrentUser);

  const handleLogin = () => {
    // Format phone for comparison
    const formattedPhone = phone.trim();
    
    // Quick login: match phone to provider
    const provider = mockBarbers.find(b => 
      b.phone.includes(formattedPhone) || formattedPhone.includes('22-222')
    );

    if (provider) {
      setCurrentUser(provider);
      router.replace('/(tabs)/dashboard');
    } else {
      Alert.alert('Login Failed', 'Provider not found. Try: 22-222 2222');
    }
  };

  const handleQuickLogin = () => {
    // Quick login for testing
    const provider = mockBarbers[0]; // Amir Hafiz
    setCurrentUser(provider);
    router.replace('/(tabs)/dashboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Provider Login</Text>
        <Text style={styles.subtitle}>Sign in to manage your jobs</Text>

        <TextInput
          style={styles.input}
          placeholder="Phone (e.g., 22-222 2222)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoCapitalize="none"
        />

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickButton} onPress={handleQuickLogin}>
          <Text style={styles.quickButtonText}>Quick Login (Test Provider)</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>Test Provider: 22-222 2222</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    ...TYPOGRAPHY.heading.h1,
    color: COLORS.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.secondary,
    marginBottom: 40,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.background.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  loginButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.text.inverse,
  },
  quickButton: {
    backgroundColor: COLORS.background.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  quickButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary,
  },
  hint: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    marginTop: 20,
  },
});
