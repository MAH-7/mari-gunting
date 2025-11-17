import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { barberOnboardingService } from '@mari-gunting/shared/services/onboardingService';
import { BARBER_SPECIALIZATIONS } from '@mari-gunting/shared/constants/specializations';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { Colors, theme } from '@mari-gunting/shared/theme';

const EXPERIENCE_OPTIONS = [
  { label: '< 1 year', value: 0 },
  { label: '1-2 years', value: 1 },
  { label: '3-5 years', value: 3 },
  { label: '6-10 years', value: 6 },
  { label: '10+ years', value: 10 },
];

export default function BasicInfoScreen() {
  const insets = useSafeAreaInsets();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const logout = useStore((state) => state.logout);
  const [loading, setLoading] = useState(false);
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState<number>(1);
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);

  // Load saved progress
  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const progress = await barberOnboardingService.getProgress();
      if (progress.basicInfo) {
        setBio(progress.basicInfo.bio);
        setExperience(progress.basicInfo.experience);
        setSelectedSpecializations(progress.basicInfo.specializations);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const toggleSpecialization = (spec: string) => {
    if (selectedSpecializations.includes(spec)) {
      setSelectedSpecializations(selectedSpecializations.filter((s) => s !== spec));
    } else {
      setSelectedSpecializations([...selectedSpecializations, spec]);
    }
  };

  const validateForm = (): boolean => {
    if (bio.trim().length < 20) {
      Alert.alert('Bio Required', 'Please write at least 20 characters about yourself.');
      return false;
    }

    if (selectedSpecializations.length === 0) {
      Alert.alert('Specializations Required', 'Please select at least one specialization.');
      return false;
    }

    return true;
  };

  const handleContinue = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const data = {
        bio: bio.trim(),
        experience,
        specializations: selectedSpecializations,
      };

      // Save progress
      await barberOnboardingService.saveProgress('basicInfo', data);

      // Navigate to next step or back to review
      if (returnTo === 'review') {
        router.back();
      } else {
        router.push('/onboarding/barber/ekyc');
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      Alert.alert('Error', 'Failed to save progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Exit Onboarding?',
      'Your progress will be saved. You can continue later by logging in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, styles.progressActive]} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={22} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={styles.title}>Tell us about yourself</Text>
        <Text style={styles.subtitle}>
          Share your experience and skills so customers can get to know you better.
        </Text>

        {/* Bio */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Your Bio <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.textArea}
            placeholder="Tell customers about your experience, approach, and what makes you unique..."
            placeholderTextColor="#999"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={6}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{bio.length}/500</Text>
        </View>

        {/* Experience */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Years of Experience <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.experienceGrid}>
            {EXPERIENCE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.experienceButton,
                  experience === option.value && styles.experienceButtonActive,
                ]}
                onPress={() => setExperience(option.value)}
              >
                <Text
                  style={[
                    styles.experienceButtonText,
                    experience === option.value && styles.experienceButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Specializations */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Your Specializations <Text style={styles.required}>*</Text>
          </Text>
          <Text style={styles.hint}>Select all that apply</Text>
          <View style={styles.specializationsGrid}>
            {BARBER_SPECIALIZATIONS.map((spec) => (
              <TouchableOpacity
                key={spec}
                style={[
                  styles.specializationChip,
                  selectedSpecializations.includes(spec) && styles.specializationChipActive,
                ]}
                onPress={() => toggleSpecialization(spec)}
              >
                <Text
                  style={[
                    styles.specializationChipText,
                    selectedSpecializations.includes(spec) && styles.specializationChipTextActive,
                  ]}
                >
                  {spec}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.footer, { paddingBottom: Platform.OS === 'android' ? insets.bottom + 16 : 32 }]}>
        <TouchableOpacity
          style={[styles.continueButton, loading && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.continueButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  progressActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  required: {
    color: '#f44336',
  },
  hint: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    minHeight: 140,
    backgroundColor: '#fafafa',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  experienceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  experienceButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
  },
  experienceButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  experienceButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  experienceButtonTextActive: {
    color: '#fff',
  },
  specializationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  specializationChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
  },
  specializationChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  specializationChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  specializationChipTextActive: {
    color: '#fff',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    // paddingBottom handled inline with insets
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
