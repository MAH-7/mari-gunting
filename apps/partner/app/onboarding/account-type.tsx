import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { useStore } from '@/store/useStore';
import { AccountType } from '@/types/onboarding';

export default function AccountTypeScreen() {
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const updateOnboardingProgress = useStore((state) => state.updateOnboardingProgress);
  const completeOnboardingStep = useStore((state) => state.completeOnboardingStep);

  const handleContinue = () => {
    if (!selectedType) {
      Alert.alert('Selection Required', 'Please select your account type to continue.');
      return;
    }

    // Update onboarding progress
    updateOnboardingProgress({
      status: 'account_type_selected',
      accountType: selectedType,
      currentStep: 1,
      totalSteps: selectedType === 'freelance' ? 7 : 8,
    });

    completeOnboardingStep('account_type');

    // Navigate to next step
    router.push('/onboarding/ekyc');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Account Type</Text>
          <Text style={styles.subtitle}>
            Select how you want to work with Mari Gunting
          </Text>
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
            <View style={styles.optionHeader}>
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
              
              <View style={styles.optionTitleRow}>
                <Text style={styles.optionTitle}>Freelance Barber</Text>
                {selectedType === 'freelance' && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  </View>
                )}
              </View>
            </View>

            <Text style={styles.optionDescription}>
              I'm an individual barber who travels to customers' locations
            </Text>
            
            <View style={styles.features}>
              <Text style={styles.featuresTitle}>Features:</Text>
              <View style={styles.feature}>
                <Ionicons name="checkmark" size={16} color={COLORS.success} />
                <Text style={styles.featureText}>Accept mobile bookings</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="checkmark" size={16} color={COLORS.success} />
                <Text style={styles.featureText}>Set your service area & travel fees</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="checkmark" size={16} color={COLORS.success} />
                <Text style={styles.featureText}>Manage your own schedule</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="checkmark" size={16} color={COLORS.success} />
                <Text style={styles.featureText}>Keep 88% + 100% travel fees</Text>
              </View>
            </View>

            <View style={styles.badge}>
              <Text style={styles.badgeText}>7 Steps • 10 mins</Text>
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
            <View style={styles.optionHeader}>
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
              
              <View style={styles.optionTitleRow}>
                <Text style={styles.optionTitle}>Barbershop Owner</Text>
                {selectedType === 'barbershop' && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  </View>
                )}
              </View>
            </View>

            <Text style={styles.optionDescription}>
              I own a barbershop where customers come to my location
            </Text>
            
            <View style={styles.features}>
              <Text style={styles.featuresTitle}>Features:</Text>
              <View style={styles.feature}>
                <Ionicons name="checkmark" size={16} color={COLORS.success} />
                <Text style={styles.featureText}>Manage shop appointments</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="checkmark" size={16} color={COLORS.success} />
                <Text style={styles.featureText}>Add & manage staff members</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="checkmark" size={16} color={COLORS.success} />
                <Text style={styles.featureText}>Track shop analytics & reports</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="checkmark" size={16} color={COLORS.success} />
                <Text style={styles.featureText}>Set operating hours & capacity</Text>
              </View>
            </View>

            <View style={styles.badge}>
              <Text style={styles.badgeText}>8 Steps • 15 mins</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Warning */}
        <View style={styles.warningBox}>
          <Ionicons name="alert-circle" size={20} color="#F59E0B" />
          <Text style={styles.warningText}>
            You can't change this later, so choose carefully
          </Text>
        </View>

        {/* Continue Button */}
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
            color={!selectedType ? COLORS.text.tertiary : '#FFFFFF'} 
          />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
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
    gap: 16,
    marginBottom: 20,
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
  optionHeader: {
    marginBottom: 12,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconContainerSelected: {
    backgroundColor: COLORS.background.primary,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    marginBottom: 16,
  },
  featuresTitle: {
    ...TYPOGRAPHY.body.medium,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
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
  badge: {
    backgroundColor: COLORS.background.secondary,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF7ED',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  warningText: {
    ...TYPOGRAPHY.body.regular,
    color: '#92400E',
    flex: 1,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.background.tertiary,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    ...TYPOGRAPHY.body.large,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  continueButtonTextDisabled: {
    color: COLORS.text.tertiary,
  },
});
