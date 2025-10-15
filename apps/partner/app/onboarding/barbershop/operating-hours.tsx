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
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { barbershopOnboardingService } from '@mari-gunting/shared/services/onboardingService';

const DAYS = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

export default function OperatingHoursScreen() {
  const [loading, setLoading] = useState(false);
  const [operatingHours, setOperatingHours] = useState<Record<string, { start: string; end: string; isOpen: boolean }>>({
    mon: { start: '09:00', end: '18:00', isOpen: true },
    tue: { start: '09:00', end: '18:00', isOpen: true },
    wed: { start: '09:00', end: '18:00', isOpen: true },
    thu: { start: '09:00', end: '18:00', isOpen: true },
    fri: { start: '09:00', end: '18:00', isOpen: true },
    sat: { start: '09:00', end: '18:00', isOpen: true },
    sun: { start: '09:00', end: '18:00', isOpen: false },
  });

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const progress = await barbershopOnboardingService.getProgress();
      if (progress.operatingHours) {
        setOperatingHours(progress.operatingHours);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const toggleDay = (day: string) => {
    setOperatingHours({
      ...operatingHours,
      [day]: {
        ...operatingHours[day],
        isOpen: !operatingHours[day].isOpen,
      },
    });
  };

  const updateTime = (day: string, type: 'start' | 'end', value: string) => {
    setOperatingHours({
      ...operatingHours,
      [day]: {
        ...operatingHours[day],
        [type]: value,
      },
    });
  };

  const copyToAll = (day: string) => {
    const hours = operatingHours[day];
    const newHours: Record<string, { start: string; end: string; isOpen: boolean }> = {};
    
    DAYS.forEach((d) => {
      newHours[d.key] = {
        start: hours.start,
        end: hours.end,
        isOpen: operatingHours[d.key].isOpen, // Keep open/closed status
      };
    });

    setOperatingHours(newHours);
    Alert.alert('Success', 'Hours copied to all days');
  };

  const validateForm = (): boolean => {
    const hasAtLeastOneDay = Object.values(operatingHours).some((day) => day.isOpen);
    if (!hasAtLeastOneDay) {
      Alert.alert('Operating Hours Required', 'Please mark at least one day as open.');
      return false;
    }

    return true;
  };

  const handleContinue = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      await barbershopOnboardingService.saveProgress('operatingHours', operatingHours);
      router.push('/onboarding/barbershop/staff-services');
    } catch (error) {
      console.error('Error saving progress:', error);
      Alert.alert('Error', 'Failed to save progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressDotCompleted} />
          <View style={styles.progressDotCompleted} />
          <View style={styles.progressDotCompleted} />
          <View style={[styles.progressDot, styles.progressActive]} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Operating Hours</Text>
        <Text style={styles.subtitle}>
          Set your barbershop's opening and closing times for each day.
        </Text>

        {DAYS.map((day) => (
          <View key={day.key} style={styles.dayRow}>
            <TouchableOpacity
              style={styles.dayToggle}
              onPress={() => toggleDay(day.key)}
            >
              <View
                style={[
                  styles.checkbox,
                  operatingHours[day.key].isOpen && styles.checkboxActive,
                ]}
              >
                {operatingHours[day.key].isOpen && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text style={styles.dayLabel}>{day.label}</Text>
            </TouchableOpacity>

            {operatingHours[day.key].isOpen && (
              <View style={styles.rightSection}>
                <View style={styles.timeInputs}>
                  <TextInput
                    style={styles.timeInput}
                    value={operatingHours[day.key].start}
                    onChangeText={(text) => updateTime(day.key, 'start', text)}
                    placeholder="9:00 AM"
                    keyboardType="numbers-and-punctuation"
                    maxLength={8}
                  />
                  <Text style={styles.timeSeparator}>-</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={operatingHours[day.key].end}
                    onChangeText={(text) => updateTime(day.key, 'end', text)}
                    placeholder="6:00 PM"
                    keyboardType="numbers-and-punctuation"
                    maxLength={8}
                  />
                </View>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => copyToAll(day.key)}
                >
                  <Ionicons name="copy-outline" size={18} color="#666" />
                </TouchableOpacity>
              </View>
            )}

            {!operatingHours[day.key].isOpen && (
              <Text style={styles.closedText}>Closed</Text>
            )}
          </View>
        ))}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={16} color="#2196F3" />
          <Text style={styles.infoText}>
            Tap the copy icon to apply hours to all open days
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e0e0e0',
  },
  progressDotCompleted: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  progressActive: {
    backgroundColor: '#4CAF50',
    width: 20,
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
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dayToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  dayLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
    minWidth: 90,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    width: 70,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    fontSize: 14,
    color: '#1a1a1a',
    textAlign: 'center',
    backgroundColor: '#fafafa',
  },
  timeSeparator: {
    fontSize: 16,
    color: '#999',
  },
  copyButton: {
    padding: 8,
  },
  closedText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#2196F3',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
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
