import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SelectAccountTypeScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<'freelance' | 'barbershop' | null>(null);

  const handleContinue = async () => {
    if (!selectedType) return;
    
    // Save account type
    await AsyncStorage.setItem('partnerAccountType', selectedType);
    
    // Navigate to onboarding flow
    router.push('/onboarding/welcome');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Account Type</Text>
        <Text style={styles.subtitle}>Select how you want to work with Mari Gunting</Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {/* Freelance Barber */}
        <TouchableOpacity
          style={[
            styles.optionCard,
            selectedType === 'freelance' && styles.optionCardSelected
          ]}
          onPress={() => setSelectedType('freelance')}
          activeOpacity={0.7}
        >
          <View style={styles.optionContent}>
            <View style={[
              styles.iconContainer,
              selectedType === 'freelance' && styles.iconContainerSelected
            ]}>
              <Ionicons 
                name="person" 
                size={32} 
                color={selectedType === 'freelance' ? COLORS.primary : COLORS.text.secondary} 
              />
            </View>
            
            <View style={styles.optionText}>
              <View style={styles.optionHeader}>
                <Text style={styles.optionTitle}>Freelance Barber</Text>
                {selectedType === 'freelance' && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  </View>
                )}
              </View>
              <Text style={styles.optionDescription}>
                I'm an individual barber who travels to customers' locations
              </Text>
              
              <View style={styles.features}>
                <View style={styles.feature}>
                  <Ionicons name="checkmark" size={16} color={COLORS.success} />
                  <Text style={styles.featureText}>Accept mobile bookings</Text>
                </View>
                <View style={styles.feature}>
                  <Ionicons name="checkmark" size={16} color={COLORS.success} />
                  <Text style={styles.featureText}>Set your service area</Text>
                </View>
                <View style={styles.feature}>
                  <Ionicons name="checkmark" size={16} color={COLORS.success} />
                  <Text style={styles.featureText}>Manage your schedule</Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Barbershop Owner */}
        <TouchableOpacity
          style={[
            styles.optionCard,
            selectedType === 'barbershop' && styles.optionCardSelected
          ]}
          onPress={() => setSelectedType('barbershop')}
          activeOpacity={0.7}
        >
          <View style={styles.optionContent}>
            <View style={[
              styles.iconContainer,
              selectedType === 'barbershop' && styles.iconContainerSelected
            ]}>
              <Ionicons 
                name="business" 
                size={32} 
                color={selectedType === 'barbershop' ? COLORS.primary : COLORS.text.secondary} 
              />
            </View>
            
            <View style={styles.optionText}>
              <View style={styles.optionHeader}>
                <Text style={styles.optionTitle}>Barbershop Owner</Text>
                {selectedType === 'barbershop' && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  </View>
                )}
              </View>
              <Text style={styles.optionDescription}>
                I own a barbershop where customers come to my location
              </Text>
              
              <View style={styles.features}>
                <View style={styles.feature}>
                  <Ionicons name="checkmark" size={16} color={COLORS.success} />
                  <Text style={styles.featureText}>Manage shop appointments</Text>
                </View>
                <View style={styles.feature}>
                  <Ionicons name="checkmark" size={16} color={COLORS.success} />
                  <Text style={styles.featureText}>Add & manage staff</Text>
                </View>
                <View style={styles.feature}>
                  <Ionicons name="checkmark" size={16} color={COLORS.success} />
                  <Text style={styles.featureText}>Track shop analytics</Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedType && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!selectedType}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.continueButtonText,
            !selectedType && styles.continueButtonTextDisabled
          ]}>
            Continue
          </Text>
          <Ionicons 
            name="arrow-forward" 
            size={20} 
            color={!selectedType ? COLORS.text.tertiary : COLORS.text.inverse} 
          />
        </TouchableOpacity>
        
        <Text style={styles.footerNote}>
          You can't change this later, so choose carefully
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  header: {
    padding: 24,
    paddingTop: 32,
  },
  title: {
    ...TYPOGRAPHY.heading.h1,
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.secondary,
  },
  optionsContainer: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  optionCard: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.border.light,
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  optionContent: {
    flexDirection: 'row',
    gap: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerSelected: {
    backgroundColor: COLORS.background.primary,
  },
  optionText: {
    flex: 1,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  optionTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
  },
  checkmark: {
    marginLeft: 8,
  },
  optionDescription: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  features: {
    gap: 8,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
  },
  footer: {
    padding: 20,
    gap: 12,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.background.tertiary,
  },
  continueButtonText: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.inverse,
    fontWeight: '600',
  },
  continueButtonTextDisabled: {
    color: COLORS.text.tertiary,
  },
  footerNote: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.tertiary,
    textAlign: 'center',
  },
});
