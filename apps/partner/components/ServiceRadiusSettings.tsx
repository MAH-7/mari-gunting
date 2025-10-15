import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { barberService } from '@mari-gunting/shared/services/barberService';

interface ServiceRadiusSettingsProps {
  barberId: string;
  currentRadius: number;
  onRadiusChanged?: (newRadius: number) => void;
}

const RADIUS_OPTIONS = [
  { value: 5, label: '5 km', description: 'Nearby only' },
  { value: 10, label: '10 km', description: 'Short distance' },
  { value: 15, label: '15 km', description: 'Medium distance' },
  { value: 20, label: '20 km', description: 'Long distance' },
];

export function ServiceRadiusSettings({
  barberId,
  currentRadius,
  onRadiusChanged,
}: ServiceRadiusSettingsProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState(currentRadius);
  const [canChange, setCanChange] = useState(false);
  const [hoursRemaining, setHoursRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastChanged, setLastChanged] = useState<string | null>(null);

  // Check cooldown status
  const checkCooldown = async () => {
    setIsLoading(true);
    try {
      const result = await barberService.canChangeServiceRadius(barberId);
      setCanChange(result.canChange);
      setHoursRemaining(result.hoursRemaining);
      setLastChanged(result.lastChangedAt);
    } catch (error) {
      console.error('Error checking cooldown:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkCooldown();
  }, [barberId]);

  const handleOpenModal = () => {
    if (!canChange) {
      Alert.alert(
        'Cooldown Active',
        `You can change your service radius again in ${hoursRemaining} hours.\n\nThis prevents frequent changes and ensures consistent service for customers.`,
        [{ text: 'OK' }]
      );
      return;
    }
    setSelectedRadius(currentRadius);
    setShowModal(true);
  };

  const handleSaveRadius = async () => {
    if (selectedRadius === currentRadius) {
      setShowModal(false);
      return;
    }

    Alert.alert(
      'Confirm Change',
      `Change your service radius from ${currentRadius}km to ${selectedRadius}km?\n\nYou won't be able to change it again for 24 hours.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setIsSaving(true);
            try {
              const result = await barberService.updateServiceRadius(
                barberId,
                selectedRadius
              );

              if (result.success) {
                Alert.alert('Success', result.message);
                setShowModal(false);
                onRadiusChanged?.(selectedRadius);
                // Refresh cooldown status
                await checkCooldown();
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              Alert.alert('Error', 'An unexpected error occurred.');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  const formatLastChanged = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffHours < 48) return 'Yesterday';
    
    return date.toLocaleDateString();
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="navigate-circle" size={24} color="#00B14F" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>Service Radius</Text>
            <Text style={styles.subtitle}>How far you'll travel</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.currentRadiusContainer}>
            <Text style={styles.currentRadiusLabel}>Current Radius</Text>
            <Text style={styles.currentRadiusValue}>{currentRadius} km</Text>
          </View>

          {lastChanged && (
            <Text style={styles.lastChangedText}>
              Last changed: {formatLastChanged(lastChanged)}
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.changeButton,
              !canChange && styles.changeButtonDisabled,
            ]}
            onPress={handleOpenModal}
            disabled={isLoading || !canChange}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons
                  name="create-outline"
                  size={18}
                  color={canChange ? '#FFFFFF' : '#8E8E93'}
                />
                <Text
                  style={[
                    styles.changeButtonText,
                    !canChange && styles.changeButtonTextDisabled,
                  ]}
                >
                  {canChange ? 'Change Radius' : `Wait ${hoursRemaining}h`}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Change Radius Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Service Radius</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#1C1C1E" />
              </TouchableOpacity>
            </View>

            {/* Info Banner */}
            <View style={styles.infoBanner}>
              <Ionicons name="information-circle" size={20} color="#007AFF" />
              <Text style={styles.infoBannerText}>
                You can change this once every 24 hours
              </Text>
            </View>

            {/* Radius Options */}
            <View style={styles.radiusOptions}>
              {RADIUS_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.radiusOption,
                    selectedRadius === option.value && styles.radiusOptionActive,
                  ]}
                  onPress={() => setSelectedRadius(option.value)}
                  activeOpacity={0.7}
                >
                  <View style={styles.radiusOptionLeft}>
                    <View
                      style={[
                        styles.radioCircle,
                        selectedRadius === option.value && styles.radioCircleActive,
                      ]}
                    >
                      {selectedRadius === option.value && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.radiusOptionLabel,
                          selectedRadius === option.value && styles.radiusOptionLabelActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                      <Text style={styles.radiusOptionDescription}>
                        {option.description}
                      </Text>
                    </View>
                  </View>
                  {option.value === currentRadius && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowModal(false)}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (selectedRadius === currentRadius || isSaving) && styles.saveButtonDisabled,
                ]}
                onPress={handleSaveRadius}
                disabled={selectedRadius === currentRadius || isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Change</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  content: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 16,
  },
  currentRadiusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentRadiusLabel: {
    fontSize: 15,
    color: '#8E8E93',
  },
  currentRadiusValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00B14F',
  },
  lastChangedText: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 16,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00B14F',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  changeButtonDisabled: {
    backgroundColor: '#F2F2F7',
  },
  changeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  changeButtonTextDisabled: {
    color: '#8E8E93',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FF',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#007AFF',
  },
  radiusOptions: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  radiusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  radiusOptionActive: {
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#00B14F',
  },
  radiusOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#00B14F',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00B14F',
  },
  radiusOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  radiusOptionLabelActive: {
    color: '#00B14F',
  },
  radiusOptionDescription: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  currentBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#00B14F',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
