import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { partnerAccountService } from '@mari-gunting/shared/services/partnerAccountService';
import { supabase } from '@mari-gunting/shared/config/supabase';

export default function SelectAccountTypeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = params.userId as string | undefined;
  
  const [selectedType, setSelectedType] = useState<'freelance' | 'barbershop' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedType || isLoading) return;
    
    // Show confirmation dialog
    Alert.alert(
      'Confirm Account Type',
      `You've selected ${selectedType === 'freelance' ? 'Freelance Barber' : 'Barbershop Owner'}. This cannot be changed later.\n\nAre you sure you want to continue?`,
      [
        {
          text: 'Go Back',
          style: 'cancel',
          onPress: () => console.log('Account type selection cancelled'),
        },
        {
          text: 'Yes, Continue',
          style: 'default',
          onPress: () => proceedWithAccountSetup(),
        },
      ],
      { cancelable: false }
    );
  };

  const proceedWithAccountSetup = async () => {
    setIsLoading(true);

    try {
      // Check if we have user ID (passed from registration)
      if (!userId) {
        console.error('❌ No user ID provided');
        
        // Try to get from auth as fallback
        console.log('🔍 Trying to get user from auth session...');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          Alert.alert(
            'Session Error',
            'User session not found. Please complete registration again.',
            [
              { text: 'OK', onPress: () => router.replace('/register') }
            ]
          );
          setIsLoading(false);
          return;
        }
        
        // Use user ID from auth
        console.log('✅ Got user from auth:', user.id);
      }
      
      const currentUserId = userId || (await supabase.auth.getUser()).data.user?.id;
      
      if (!currentUserId) {
        Alert.alert('Error', 'Failed to get user ID. Please try again.');
        setIsLoading(false);
        return;
      }

      // Setup account based on selected type
      console.log(`🔧 Setting up ${selectedType} account for user:`, currentUserId);
      
      if (!selectedType) {
        Alert.alert('Error', 'Please select an account type.');
        setIsLoading(false);
        return;
      }
      
      const response = await partnerAccountService.setupAccount(
        currentUserId,
        selectedType
      );

      if (!response.success) {
        Alert.alert(
          'Setup Failed',
          response.error || 'Failed to setup account. Please try again.'
        );
        setIsLoading(false);
        return;
      }

      console.log('✅ Account setup successful:', response);

      // Save account type to AsyncStorage
      if (selectedType) {
        await AsyncStorage.setItem('partnerAccountType', selectedType);
      }
      
      // Navigate to onboarding to complete profile setup
      // Use replace() to prevent user from swiping back to account selection
      // Route directly to the appropriate onboarding flow
      if (selectedType === 'freelance') {
        router.replace('/onboarding/barber/basic-info');
      } else {
        router.replace('/onboarding/barbershop/business-info');
      }
    } catch (error: any) {
      console.error('❌ Account setup error:', error);
      Alert.alert(
        'Error',
        error.message || 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
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
            (!selectedType || isLoading) && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!selectedType || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
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
            </>
          )}
        </TouchableOpacity>
        
        <View style={styles.warningBox}>
          <Ionicons name="alert-circle" size={20} color={COLORS.warning} />
          <Text style={styles.footerNote}>
            <Text style={styles.footerNoteBold}>Important:</Text> You cannot change your account type after confirming
          </Text>
        </View>
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
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.warningLight || '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.warning || '#F59E0B',
  },
  footerNote: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
    flex: 1,
    lineHeight: 18,
  },
  footerNoteBold: {
    fontWeight: '700',
    color: COLORS.text.primary,
  },
});
