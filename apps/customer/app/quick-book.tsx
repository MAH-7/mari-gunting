import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import Slider from '@react-native-community/slider';

export default function QuickBookScreen() {
  const [radius, setRadius] = useState<number>(5);
  const [maxPrice, setMaxPrice] = useState<number>(50);
  const [isSearching, setIsSearching] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const quickBookMutation = useMutation({
    mutationFn: (data: { time: string; radius: number; maxPrice: number }) => 
      api.quickBook('any', data.time),
    onSuccess: (response) => {
      // Check if the response was successful and has barber data
      if (response.success && response.data?.barber?.id) {
        const barberId = response.data.barber.id;
        // Small delay to allow modal to close smoothly before navigation
        setTimeout(() => {
          setIsSearching(false);
          // Navigate to confirm booking screen (unified flow)
          router.push(`/booking/create?barberId=${barberId}` as any);
        }, 300);
      } else {
        // No barber available
        setIsSearching(false);
        console.log('Quick book failed:', response.error || 'No barber found');
        setShowErrorModal(true);
      }
    },
    onError: (error) => {
      console.log('Quick book failed:', error);
      setIsSearching(false);
      setShowErrorModal(true);
    },
  });

  const handleQuickBook = () => {
    setIsSearching(true);
    
    // Simulate search for nearest barber (2 seconds)
    setTimeout(() => {
      quickBookMutation.mutate({
        time: 'now', // Always ASAP for Quick Book
        radius,
        maxPrice,
      });
    }, 2000);
  };
  
  // Calculate estimated barbers in range
  const estimatedBarbers = Math.floor(radius * 2.5 + (maxPrice / 10));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quick Book</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Ionicons name="flash" size={40} color="#7E3AF2" />
          </View>
          <Text style={styles.heroTitle}>Quick Book</Text>
          <Text style={styles.heroSubtitle}>
            Find nearest available barber instantly
          </Text>
          <View style={styles.heroFeatures}>
            <View style={styles.heroFeature}>
              <Ionicons name="time" size={18} color="#7E3AF2" />
              <Text style={styles.heroFeatureText}>Fast Match</Text>
            </View>
            <View style={styles.heroFeature}>
              <Ionicons name="location" size={18} color="#7E3AF2" />
              <Text style={styles.heroFeatureText}>Nearby</Text>
            </View>
            <View style={styles.heroFeature}>
              <Ionicons name="cash" size={18} color="#7E3AF2" />
              <Text style={styles.heroFeatureText}>Best Price</Text>
            </View>
          </View>
        </View>

        {/* Search Radius */}
        <View style={styles.section}>
          <View style={styles.sliderHeader}>
            <View>
              <Text style={styles.sectionTitle}>Search Radius</Text>
              <Text style={styles.sectionSubtitle}>How far should we look?</Text>
            </View>
            <View style={styles.valueBadge}>
              <Ionicons name="location" size={16} color="#7E3AF2" />
              <Text style={styles.valueText}>{radius} km</Text>
            </View>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={20}
            step={1}
            value={radius}
            onValueChange={setRadius}
            minimumTrackTintColor="#7E3AF2"
            maximumTrackTintColor="#E5E7EB"
            thumbTintColor="#7E3AF2"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>1 km</Text>
            <Text style={styles.sliderLabel}>20 km</Text>
          </View>
          <View style={styles.estimateRow}>
            <Ionicons name="people" size={16} color="#6B7280" />
            <Text style={styles.estimateText}>
              ~{estimatedBarbers} barbers available in this range
            </Text>
          </View>
        </View>

        {/* Max Price */}
        <View style={styles.section}>
          <View style={styles.sliderHeader}>
            <View>
              <Text style={styles.sectionTitle}>Maximum Price</Text>
              <Text style={styles.sectionSubtitle}>Set your budget</Text>
            </View>
            <View style={styles.valueBadge}>
              <Text style={styles.currencySymbol}>RM</Text>
              <Text style={styles.valueText}>{maxPrice}</Text>
            </View>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={10}
            maximumValue={200}
            step={5}
            value={maxPrice}
            onValueChange={setMaxPrice}
            minimumTrackTintColor="#7E3AF2"
            maximumTrackTintColor="#E5E7EB"
            thumbTintColor="#7E3AF2"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>RM 10</Text>
            <Text style={styles.sliderLabel}>RM 200</Text>
          </View>
          <View style={styles.priceInfo}>
            <Ionicons name="information-circle" size={16} color="#6B7280" />
            <Text style={styles.priceInfoText}>
              Final price may vary based on barber experience
            </Text>
          </View>
        </View>


        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <Ionicons name="checkmark-circle" size={48} color="#7E3AF2" />
          </View>
          <Text style={styles.summaryTitle}>Ready to Find Barber</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Ionicons name="flash-outline" size={24} color="#6B7280" />
              <Text style={styles.summaryLabel}>Service</Text>
              <Text style={styles.summaryValue}>ASAP</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="location-outline" size={24} color="#6B7280" />
              <Text style={styles.summaryLabel}>Radius</Text>
              <Text style={styles.summaryValue}>{radius} km</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="cash-outline" size={24} color="#6B7280" />
              <Text style={styles.summaryLabel}>Max Budget</Text>
              <Text style={styles.summaryValue}>RM {maxPrice}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="people-outline" size={24} color="#6B7280" />
              <Text style={styles.summaryLabel}>Available</Text>
              <Text style={styles.summaryValue}>~{estimatedBarbers}</Text>
            </View>
          </View>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#7E3AF2" />
            <Text style={styles.infoBoxText}>
              Service selection will be available after barber is matched
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.bookButton,
            isSearching && styles.bookButtonDisabled,
          ]}
          onPress={handleQuickBook}
          disabled={isSearching}
          activeOpacity={0.8}
        >
          {isSearching ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.bookButtonText}>Finding Barber...</Text>
            </>
          ) : (
            <>
              <Ionicons name="flash" size={22} color="#FFFFFF" />
              <Text style={styles.bookButtonText}>Find Barber Now</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Searching Overlay */}
      {isSearching && (
        <View style={styles.searchingOverlay}>
          <View style={styles.searchingCard}>
            <ActivityIndicator size="large" color="#7E3AF2" style={styles.searchingSpinner} />
            <Text style={styles.searchingTitle}>Searching...</Text>
            <Text style={styles.searchingText}>Finding available barbers within {radius}km</Text>
            <View style={styles.searchingDetails}>
              <View style={styles.searchingDetail}>
                <Ionicons name="location" size={16} color="#7E3AF2" />
                <Text style={styles.searchingDetailText}>Radius: {radius}km</Text>
              </View>
              <View style={styles.searchingDetail}>
                <Ionicons name="cash-outline" size={16} color="#7E3AF2" />
                <Text style={styles.searchingDetailText}>Max: RM {maxPrice}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.errorOverlay}>
          <View style={styles.errorCard}>
            <View style={styles.errorIconContainer}>
              <Ionicons name="sad-outline" size={64} color="#EF4444" />
            </View>
            <Text style={styles.errorTitle}>No Barbers Available</Text>
            <Text style={styles.errorMessage}>
              Unfortunately, we couldn't find any available barbers within {radius}km at your budget.
            </Text>
            <View style={styles.errorSuggestions}>
              <View style={styles.suggestionItem}>
                <Ionicons name="location" size={20} color="#6B7280" />
                <Text style={styles.suggestionText}>Try increasing your search radius</Text>
              </View>
              <View style={styles.suggestionItem}>
                <Ionicons name="cash" size={20} color="#6B7280" />
                <Text style={styles.suggestionText}>Consider adjusting your budget</Text>
              </View>
              <View style={styles.suggestionItem}>
                <Ionicons name="time" size={20} color="#6B7280" />
                <Text style={styles.suggestionText}>Try booking for a different time</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.errorButton}
              onPress={() => setShowErrorModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.errorButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#F5F3FF',
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#7E3AF2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  heroFeatures: {
    flexDirection: 'row',
    gap: 16,
  },
  heroFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  heroFeatureText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7E3AF2',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  valueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  currencySymbol: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7E3AF2',
  },
  valueText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7E3AF2',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  estimateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  estimateText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  priceInfoText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 24,
    marginTop: 8,
  },
  summaryIconContainer: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  summaryItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 8,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7E3AF2',
    borderRadius: 16,
    paddingVertical: 18,
    gap: 10,
    shadowColor: '#7E3AF2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bookButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
  },
  bookButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  searchingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  searchingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    width: '90%',
    maxWidth: 340,
  },
  searchingSpinner: {
    marginBottom: 24,
  },
  searchingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  searchingText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  searchingDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  searchingDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  searchingDetailText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7E3AF2',
  },
  errorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  errorIconContainer: {
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  errorSuggestions: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  suggestionText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  errorButton: {
    width: '100%',
    backgroundColor: '#7E3AF2',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#7E3AF2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  errorButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
