import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import { useLocationPermission } from '@/hooks/useLocationPermission';
import { LocationPermissionModal } from '@/components/LocationPermissionModal';

export default function ServiceScreen() {
  const [showModal, setShowModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const navigation = useNavigation();
  const { status: locationStatus, requestPermission } = useLocationPermission();

  // TEST: Verify file is loading
  useEffect(() => {
    console.log('✨✨✨ SERVICE SCREEN MOUNTED - FILE IS LOADED ✨✨✨');
    console.log('Initial locationStatus:', locationStatus);
  }, []);

  // Debug: Log when showLocationModal changes
  useEffect(() => {
    console.log('🔴 showLocationModal state changed:', showLocationModal);
  }, [showLocationModal]);

  // Show modal every time this screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setShowModal(true);
    });

    return unsubscribe;
  }, [navigation]);

  const handleClose = () => {
    setShowModal(false);
    setTimeout(() => {
      router.replace('/(tabs)' as any);
    }, 200);
  };

  const handleQuickBook = () => {
    console.log('🔍 Quick Book pressed - locationStatus:', locationStatus);
    if (locationStatus === 'granted') {
      console.log('✅ Quick Book selected - navigating');
      setShowModal(false);
      router.push('/quick-book');
    } else {
      console.log('🚫 Location required for Quick Book - showing modal');
      setShowModal(false);
      setTimeout(() => {
        console.log('📍 Setting showLocationModal to true');
        setShowLocationModal(true);
      }, 300);
    }
  };

  const handleChooseBarber = () => {
    console.log('🔍 Choose Barber pressed - locationStatus:', locationStatus);
    if (locationStatus === 'granted') {
      console.log('✅ Choose Barber selected - navigating');
      setShowModal(false);
      router.push('/barbers');
    } else {
      console.log('🚫 Location required for Choose Barber - showing modal');
      setShowModal(false);
      setTimeout(() => {
        console.log('📍 Setting showLocationModal to true');
        setShowLocationModal(true);
      }, 300);
    }
  };

  const handleBarbershop = () => {
    console.log('🔍 Barbershop pressed - locationStatus:', locationStatus);
    if (locationStatus === 'granted') {
      console.log('✅ Barbershop selected - navigating');
      setShowModal(false);
      router.push('/barbershops');
    } else {
      console.log('🚫 Location required for Barbershop - showing modal');
      setShowModal(false);
      setTimeout(() => {
        console.log('📍 Setting showLocationModal to true');
        setShowLocationModal(true);
      }, 300);
    }
  };

  // Handle location permission request
  const handleRequestLocationPermission = async () => {
    setShowLocationModal(false);
    const granted = await requestPermission();
    
    if (granted) {
      console.log('✅ Location enabled from Service tab');
      // User can now tap the service tab again
    }
  };

  // Handle manual location entry
  const handleManualLocation = () => {
    setShowLocationModal(false);
    router.push('/profile/addresses');
  };

  // Handle dismiss modal
  const handleDismissLocationModal = () => {
    setShowLocationModal(false);
  };

  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        <Modal
          visible={showModal}
          transparent={true}
          animationType="fade"
          onRequestClose={handleClose}
        >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.backdrop} 
            activeOpacity={1} 
            onPress={handleClose}
          />
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔥 TESTING - Book Service 🔥</Text>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Option 1: Quick Book */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={handleQuickBook}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="flash" size={28} color="#F59E0B" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Quick Book</Text>
                <Text style={styles.optionDescription}>
                  Nearest available barber
                </Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>⚡ Fast</Text>
              </View>
            </TouchableOpacity>

            {/* Option 2: Choose Barber */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={handleChooseBarber}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="person" size={28} color="#3B82F6" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Choose Barber</Text>
                <Text style={styles.optionDescription}>
                  Browse & select your favorite
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: '#DBEAFE' }]}>
                <Text style={[styles.badgeText, { color: '#3B82F6' }]}>⭐ Popular</Text>
              </View>
            </TouchableOpacity>

            {/* Option 3: Barbershop */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={handleBarbershop}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="business" size={28} color="#8B5CF6" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Barbershop</Text>
                <Text style={styles.optionDescription}>
                  Visit professional shops
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
        </Modal>
        
        {/* Empty placeholder - modal shows on top */}
        <View style={styles.placeholder} />
      </SafeAreaView>

      {/* Location Permission Modal - Render OUTSIDE SafeAreaView for higher z-index */}
      <LocationPermissionModal
        visible={showLocationModal}
        onRequestPermission={handleRequestLocationPermission}
        onManualLocation={handleManualLocation}
        onDismiss={handleDismissLocationModal}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  placeholder: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  badge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
  },
});
