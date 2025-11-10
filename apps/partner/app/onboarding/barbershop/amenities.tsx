import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { Ionicons } from '@expo/vector-icons';
import { barbershopOnboardingService } from '@mari-gunting/shared/services/onboardingService';
import { Colors, theme } from '@mari-gunting/shared/theme';

const AMENITIES = [
  'WiFi',
  'Air Conditioning',
  'Parking Available',
  'Wheelchair Accessible',
  'TV/Entertainment',
  'Refreshments',
  'Prayer Room',
  'Kids Play Area',
  'Comfortable Waiting Area',
  'Card Payment',
  'E-Wallet Payment',
  'Online Booking',
  'Walk-in Welcome',
  'Shower Facilities',
  'Grooming Products',
];

export default function AmenitiesScreen() {
  const logout = useStore((state) => state.logout);
  const [loading, setLoading] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const progress = await barbershopOnboardingService.getProgress();
      if (progress.amenities) {
        setSelectedAmenities(progress.amenities);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
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


  const handleContinue = async () => {
    try {
      setLoading(true);
      await barbershopOnboardingService.saveProgress('amenities', selectedAmenities);
      router.push('/onboarding/barbershop/payout');
    } catch (error) {
      console.error('Error saving progress:', error);
      Alert.alert('Error', 'Failed to save progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with progress dots (6 completed, 1 active, 1 pending) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={22} color={Colors.error} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressDotCompleted} />
          <View style={styles.progressDotCompleted} />
          <View style={styles.progressDotCompleted} />
          <View style={styles.progressDotCompleted} />
          <View style={styles.progressDotCompleted} />
          <View style={styles.progressDotCompleted} />
          <View style={[styles.progressDot, styles.progressActive]} />
          <View style={styles.progressDot} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Amenities & Facilities</Text>
        <Text style={styles.subtitle}>
          Select the amenities and facilities available at your barbershop (optional).
          This helps customers choose the right shop for their needs.
        </Text>

        <View style={styles.amenitiesGrid}>
          {AMENITIES.map((amenity) => (
            <TouchableOpacity
              key={amenity}
              style={[
                styles.amenityChip,
                selectedAmenities.includes(amenity) && styles.amenityChipActive,
              ]}
              onPress={() => toggleAmenity(amenity)}
            >
              <Text
                style={[
                  styles.amenityChipText,
                  selectedAmenities.includes(amenity) && styles.amenityChipTextActive,
                ]}
              >
                {amenity}
              </Text>
              {selectedAmenities.includes(amenity) && (
                <Ionicons name="checkmark-circle" size={16} color="#fff" style={styles.checkIcon} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {selectedAmenities.length > 0 && (
          <View style={styles.selectedCount}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.selectedCountText}>
              {selectedAmenities.length} {selectedAmenities.length === 1 ? 'amenity' : 'amenities'} selected
            </Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

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
  logoutButton: {
    width: 40,

    borderRadius: 20,

    backgroundColor: Colors.errorLight,
    height: 40,
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
  progressDotCompleted: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  progressActive: {
    backgroundColor: '#4CAF50',
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
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
    gap: 6,
  },
  amenityChipActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  amenityChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  amenityChipTextActive: {
    color: '#fff',
  },
  checkIcon: {
    marginLeft: 2,
  },
  selectedCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    padding: 12,
    backgroundColor: '#f1f8f4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  selectedCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
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
