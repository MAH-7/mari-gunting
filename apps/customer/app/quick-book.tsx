import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import Slider from '@react-native-community/slider';
import { Colors, theme } from '@mari-gunting/shared/theme';
import { useLocation } from '@/hooks/useLocation';
import { getBlacklistedBarberIds, clearBlacklist, getBlacklistedBarbers } from '@/utils/quickBookStorage';
import { Alert } from 'react-native';
import { useStore } from '@/store/useStore';

export default function QuickBookScreen() {
  const currentUser = useStore((state) => state.currentUser); // Get current user to prevent self-booking
  const insets = useSafeAreaInsets();
  const [radius, setRadius] = useState<number>(5);
  const [maxPrice, setMaxPrice] = useState<number>(50);
  const [isSearching, setIsSearching] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const { location, getCurrentLocation } = useLocation();

  // Get location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const quickBookMutation = useMutation({
    mutationFn: async (data: { radius: number; maxPrice: number; location: any }) => {
      // Get blacklisted barbers from previous rejections
      const blacklistedIds = await getBlacklistedBarberIds();
      console.log('[QuickBook] Blacklisted barbers:', blacklistedIds.length);
      
      // Use same API as Available Barbers screen
      const response = await api.getBarbers({
        isOnline: true,
        isAvailable: true,
        location: data.location ? {
          lat: data.location.latitude,
          lng: data.location.longitude,
          radius: data.radius,
        } : undefined,
      });
      
      if (!response.success || !response.data?.data || response.data.data.length === 0) {
        throw new Error('No barbers available');
      }
      
      // Filter by price - find barbers with at least one service within budget
      console.log('[QuickBook] Checking prices for', response.data.data.length, 'barbers (max budget: RM', data.maxPrice + ')');
      response.data.data.forEach(barber => {
        const cheapestService = Math.min(...barber.services.map(s => s.price));
        console.log(`[QuickBook] - ${barber.name}: ${barber.services.length} services, cheapest: RM ${cheapestService}`);
      });
      
      let affordableBarbers = response.data.data.filter(barber =>
        barber.services.some(service => service.price <= data.maxPrice)
      );
      
      console.log('[QuickBook] Found', affordableBarbers.length, 'affordable barbers');
      
      if (affordableBarbers.length === 0) {
        const minPrice = Math.min(...response.data.data.flatMap(b => b.services.map(s => s.price)));
        throw new Error(`No barbers available within RM ${data.maxPrice} budget. Cheapest service found: RM ${minPrice}`);
      }
      
      // Filter out blacklisted barbers AND self (prevent self-booking)
      affordableBarbers = affordableBarbers.filter(barber => 
        !blacklistedIds.includes(barber.id) &&
        barber.userId !== currentUser?.id  // GRAB-STYLE: Don't match with own barber account
      );
      
      if (affordableBarbers.length > 0) {
        console.log('[QuickBook] After filtering (blacklist + self):', affordableBarbers.length, 'barbers');
      }
      
      if (affordableBarbers.length === 0) {
        throw new Error('All available barbers have been tried. Please adjust your search criteria.');
      }
      
      // Smart selection: Score barbers by distance + rating + experience
      // Distance weight: 40%, Rating weight: 30%, Experience weight: 30%
      const scoredBarbers = affordableBarbers.map(barber => {
        // Get distance (handle both field names: distance or straightLineDistance)
        const barberDistance = (barber as any).distance || (barber as any).straightLineDistance || 0;
        
        // Normalize distance (0-20km range, lower is better)
        const distanceScore = barberDistance > 0 
          ? Math.max(0, 1 - (barberDistance / 20)) * 100
          : 50; // Default score if no distance available
        
        // Normalize rating (0-5 range, higher is better)
        const ratingScore = (barber.rating / 5) * 100;
        
        // Normalize experience by completed jobs (higher is better)
        // Assume 100 jobs is excellent, use logarithmic scale
        const experienceScore = Math.min(100, (Math.log10(barber.completedJobs + 1) / Math.log10(101)) * 100);
        
        // Calculate weighted score
        const totalScore = (
          distanceScore * 0.4 + 
          ratingScore * 0.3 + 
          experienceScore * 0.3
        );
        
        return {
          barber,
          score: totalScore,
          distanceScore,
          ratingScore,
          experienceScore,
          barberDistance,
        };
      });
      
      // Sort by score (highest first)
      scoredBarbers.sort((a, b) => b.score - a.score);
      
      // Select TOP 3 barbers (Grab approach - pre-fetch backups)
      const top3Barbers = scoredBarbers.slice(0, 3).map(sb => sb.barber);
      
      console.log('[QuickBook] Selected top 3 barbers:');
      scoredBarbers.slice(0, 3).forEach((sb, idx) => {
        console.log(`[QuickBook] ${idx + 1}. ${sb.barber.name} | Score: ${sb.score.toFixed(1)} | Distance: ${sb.barberDistance.toFixed(1)}km`);
      });
      
      // Return top 3 barbers (first one is primary, others are backups)
      return { 
        success: true, 
        data: { 
          barber: top3Barbers[0],
          backupBarbers: top3Barbers, // All 3 for retry flow
        } 
      };
    },
    onSuccess: (response) => {
      // Check if the response was successful and has barber data
      if (response.success && response.data?.barber?.id && response.data?.backupBarbers) {
        const barberId = response.data.barber.id;
        const backupBarbers = response.data.backupBarbers;
        
        // Small delay to allow modal to close smoothly before navigation
        setTimeout(() => {
          setIsSearching(false);
          // Navigate to confirm booking screen with Quick Book context + backup barbers
          router.push({
            pathname: '/booking/create',
            params: {
              barberId: barberId,
              isQuickBook: 'true',
              searchRadius: radius.toString(),
              searchMaxPrice: maxPrice.toString(),
              backupBarbers: JSON.stringify(backupBarbers.map(b => b.id)), // Pass barber IDs
            },
          } as any);
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
        radius,
        maxPrice,
        location,
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
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quick Book</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Ionicons name="flash" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Quick Book</Text>
          <Text style={styles.heroSubtitle}>
            Find nearest available barber instantly
          </Text>
          <View style={styles.heroFeatures}>
            <View style={styles.heroFeature}>
              <Ionicons name="time" size={18} color={Colors.primary} />
              <Text style={styles.heroFeatureText}>Fast Match</Text>
            </View>
            <View style={styles.heroFeature}>
              <Ionicons name="location" size={18} color={Colors.primary} />
              <Text style={styles.heroFeatureText}>Nearby</Text>
            </View>
            <View style={styles.heroFeature}>
              <Ionicons name="cash" size={18} color={Colors.primary} />
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
              <Ionicons name="location" size={16} color={Colors.primary} />
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
            minimumTrackTintColor={Colors.primary}             maximumTrackTintColor={Colors.gray[200]}             thumbTintColor={Colors.primary}           />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>1 km</Text>
            <Text style={styles.sliderLabel}>20 km</Text>
          </View>
          <View style={styles.estimateRow}>
            <Ionicons name="people" size={16} color={Colors.gray[500]} />
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
            minimumTrackTintColor={Colors.primary}
            maximumTrackTintColor={Colors.gray[200]}
            thumbTintColor={Colors.primary}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>RM 10</Text>
            <Text style={styles.sliderLabel}>RM 200</Text>
          </View>
          <View style={styles.priceInfo}>
            <Ionicons name="information-circle" size={16} color={Colors.gray[500]} />
            <Text style={styles.priceInfoText}>
              Final price may vary based on barber experience
            </Text>
          </View>
        </View>


        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.summaryTitle}>Ready to Find Barber</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Ionicons name="flash-outline" size={24} color={Colors.gray[500]} />
              <Text style={styles.summaryLabel}>Service</Text>
              <Text style={styles.summaryValue}>ASAP</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="location-outline" size={24} color={Colors.gray[500]} />
              <Text style={styles.summaryLabel}>Radius</Text>
              <Text style={styles.summaryValue}>{radius} km</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="cash-outline" size={24} color={Colors.gray[500]} />
              <Text style={styles.summaryLabel}>Max Budget</Text>
              <Text style={styles.summaryValue}>RM {maxPrice}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="people-outline" size={24} color={Colors.gray[500]} />
              <Text style={styles.summaryLabel}>Available</Text>
              <Text style={styles.summaryValue}>~{estimatedBarbers}</Text>
            </View>
          </View>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.infoBoxText}>
              Service selection will be available after barber is matched
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={[styles.bottomBar, { paddingBottom: Platform.OS === 'android' ? insets.bottom + 16 : 32 }]}>
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
              <ActivityIndicator size="small" color={Colors.white} />
              <Text style={styles.bookButtonText}>Finding Barber...</Text>
            </>
          ) : (
            <>
              <Ionicons name="flash" size={22} color={Colors.white} />
              <Text style={styles.bookButtonText}>Find Barber Now</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Searching Overlay */}
      {isSearching && (
        <View style={styles.searchingOverlay}>
          <View style={styles.searchingCard}>
            <ActivityIndicator size="large" color={Colors.primary} style={styles.searchingSpinner} />
            <Text style={styles.searchingTitle}>Searching...</Text>
            <Text style={styles.searchingText}>Finding available barbers within {radius}km</Text>
            <View style={styles.searchingDetails}>
              <View style={styles.searchingDetail}>
                <Ionicons name="location" size={16} color={Colors.primary} />
                <Text style={styles.searchingDetailText}>Radius: {radius}km</Text>
              </View>
              <View style={styles.searchingDetail}>
                <Ionicons name="cash-outline" size={16} color={Colors.primary} />
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
              <Ionicons name="sad-outline" size={64} color={Colors.error} />
            </View>
            <Text style={styles.errorTitle}>No Barbers Available</Text>
            <Text style={styles.errorMessage}>
              Unfortunately, we couldn't find any available barbers within {radius}km at your budget.
            </Text>
            <View style={styles.errorSuggestions}>
              <View style={styles.suggestionItem}>
                <Ionicons name="location" size={20} color={Colors.gray[500]} />
                <Text style={styles.suggestionText}>Try increasing your search radius</Text>
              </View>
              <View style={styles.suggestionItem}>
                <Ionicons name="cash" size={20} color={Colors.gray[500]} />
                <Text style={styles.suggestionText}>Consider adjusting your budget</Text>
              </View>
              <View style={styles.suggestionItem}>
                <Ionicons name="time" size={20} color={Colors.gray[500]} />
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
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  headerRight: {
    width: 40,
  },
  debugButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: Colors.primaryLight,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: Colors.gray[500],
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
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  heroFeatureText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
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
    color: Colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.gray[500],
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
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  currencySymbol: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  valueText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
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
    color: Colors.gray[400],
    fontWeight: '600',
  },
  estimateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  estimateText: {
    fontSize: 13,
    color: Colors.gray[500],
    fontWeight: '500',
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningLight,
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
    backgroundColor: Colors.backgroundSecondary,
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
    color: Colors.text.primary,
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
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 8,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    color: Colors.gray[500],
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    // paddingBottom handled inline with insets
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
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
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    gap: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bookButtonDisabled: {
    backgroundColor: Colors.gray[300],
    shadowOpacity: 0,
  },
  bookButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
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
    backgroundColor: Colors.white,
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
    color: Colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  searchingText: {
    fontSize: 15,
    color: Colors.gray[500],
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
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  searchingDetailText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  errorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorCard: {
    backgroundColor: Colors.white,
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
    color: Colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 15,
    color: Colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  errorSuggestions: {
    width: '100%',
    backgroundColor: Colors.backgroundSecondary,
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
    color: Colors.gray[600],
    flex: 1,
  },
  errorButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  errorButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },
});
