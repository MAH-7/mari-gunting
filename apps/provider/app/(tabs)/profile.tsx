import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';

export default function ProviderProfileScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Profile & settings coming soon...</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    ...TYPOGRAPHY.heading.h1,
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});
