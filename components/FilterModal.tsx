import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface FilterOptions {
  distance: number;
  priceRange: 'all' | 'budget' | 'mid' | 'premium';
  openNow: boolean;
  verifiedOnly: boolean;
  sortBy: 'recommended' | 'distance' | 'rating' | 'price_low' | 'price_high';
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

export default function FilterModal({
  visible,
  onClose,
  onApply,
  currentFilters,
}: FilterModalProps) {
  const [distance, setDistance] = useState(currentFilters.distance);
  const [priceRange, setPriceRange] = useState(currentFilters.priceRange);
  const [openNow, setOpenNow] = useState(currentFilters.openNow);
  const [verifiedOnly, setVerifiedOnly] = useState(currentFilters.verifiedOnly);
  const [sortBy, setSortBy] = useState(currentFilters.sortBy);

  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset to current filters when modal opens
      setDistance(currentFilters.distance);
      setPriceRange(currentFilters.priceRange);
      setOpenNow(currentFilters.openNow);
      setVerifiedOnly(currentFilters.verifiedOnly);
      setSortBy(currentFilters.sortBy);

      // Animate in
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 25,
          stiffness: 120,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleReset = () => {
    setDistance(20);
    setPriceRange('all');
    setOpenNow(false);
    setVerifiedOnly(false);
    setSortBy('recommended');
  };

  const handleApply = () => {
    onApply({
      distance,
      priceRange,
      openNow,
      verifiedOnly,
      sortBy,
    });
    onClose();
  };

  const getPriceRangeLabel = (range: string) => {
    switch (range) {
      case 'budget': return 'RM 10-20';
      case 'mid': return 'RM 20-40';
      case 'premium': return 'RM 40+';
      default: return 'All Prices';
    }
  };

  const getSortLabel = (sort: string) => {
    switch (sort) {
      case 'distance': return 'Nearest First';
      case 'rating': return 'Highest Rated';
      case 'price_low': return 'Lowest Price';
      case 'price_high': return 'Highest Price';
      default: return 'Recommended';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.backdropOverlay,
            { opacity: fadeAnim },
          ]}
        />
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Filters</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Distance Filter */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="navigate" size={20} color="#00B14F" />
              <Text style={styles.sectionTitle}>Distance</Text>
            </View>
            <View style={styles.distanceContainer}>
              <Text style={styles.distanceValue}>{distance.toFixed(0)} km</Text>
              <Text style={styles.distanceSubtext}>Maximum distance from you</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={20}
              step={1}
              value={distance}
              onValueChange={setDistance}
              minimumTrackTintColor="#00B14F"
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor="#00B14F"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>0 km</Text>
              <Text style={styles.sliderLabel}>20 km</Text>
            </View>
          </View>

          {/* Price Range Filter */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cash" size={20} color="#00B14F" />
              <Text style={styles.sectionTitle}>Price Range</Text>
            </View>
            <View style={styles.priceGrid}>
              <TouchableOpacity
                style={[
                  styles.priceChip,
                  priceRange === 'all' && styles.priceChipActive,
                ]}
                onPress={() => setPriceRange('all')}
              >
                <Text style={[
                  styles.priceChipText,
                  priceRange === 'all' && styles.priceChipTextActive,
                ]}>
                  All
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.priceChip,
                  priceRange === 'budget' && styles.priceChipActive,
                ]}
                onPress={() => setPriceRange('budget')}
              >
                <Ionicons 
                  name="wallet" 
                  size={14} 
                  color={priceRange === 'budget' ? '#FFFFFF' : '#6B7280'} 
                />
                <Text style={[
                  styles.priceChipText,
                  priceRange === 'budget' && styles.priceChipTextActive,
                ]}>
                  RM 10-20
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.priceChip,
                  priceRange === 'mid' && styles.priceChipActive,
                ]}
                onPress={() => setPriceRange('mid')}
              >
                <Ionicons 
                  name="pricetag" 
                  size={14} 
                  color={priceRange === 'mid' ? '#FFFFFF' : '#6B7280'} 
                />
                <Text style={[
                  styles.priceChipText,
                  priceRange === 'mid' && styles.priceChipTextActive,
                ]}>
                  RM 20-40
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.priceChip,
                  priceRange === 'premium' && styles.priceChipActive,
                ]}
                onPress={() => setPriceRange('premium')}
              >
                <Ionicons 
                  name="diamond" 
                  size={14} 
                  color={priceRange === 'premium' ? '#FFFFFF' : '#6B7280'} 
                />
                <Text style={[
                  styles.priceChipText,
                  priceRange === 'premium' && styles.priceChipTextActive,
                ]}>
                  RM 40+
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sort By */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="swap-vertical" size={20} color="#00B14F" />
              <Text style={styles.sectionTitle}>Sort By</Text>
            </View>
            <View style={styles.sortGrid}>
              {(['recommended', 'distance', 'rating', 'price_low'] as const).map((sort) => (
                <TouchableOpacity
                  key={sort}
                  style={[
                    styles.sortChip,
                    sortBy === sort && styles.sortChipActive,
                  ]}
                  onPress={() => setSortBy(sort)}
                >
                  <Text style={[
                    styles.sortChipText,
                    sortBy === sort && styles.sortChipTextActive,
                  ]}>
                    {getSortLabel(sort)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quick Filters */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="funnel" size={20} color="#00B14F" />
              <Text style={styles.sectionTitle}>Quick Filters</Text>
            </View>

            <View style={styles.toggleOption}>
              <View style={styles.toggleLeft}>
                <View style={styles.toggleIcon}>
                  <Ionicons name="time" size={20} color="#00B14F" />
                </View>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>Open Now</Text>
                  <Text style={styles.toggleDescription}>Show only open barbershops</Text>
                </View>
              </View>
              <Switch
                value={openNow}
                onValueChange={setOpenNow}
                trackColor={{ false: '#E5E7EB', true: '#00B14F' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E5E7EB"
              />
            </View>

            <View style={styles.toggleOption}>
              <View style={styles.toggleLeft}>
                <View style={styles.toggleIcon}>
                  <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
                </View>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>Verified Only</Text>
                  <Text style={styles.toggleDescription}>Trusted & verified shops</Text>
                </View>
              </View>
              <Switch
                value={verifiedOnly}
                onValueChange={setVerifiedOnly}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E5E7EB"
              />
            </View>
          </View>
        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
          >
            <Ionicons name="refresh" size={18} color="#6B7280" />
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApply}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  distanceContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  distanceValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#00B14F',
    marginBottom: 4,
  },
  distanceSubtext: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
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
  priceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  priceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  priceChipActive: {
    borderColor: '#00B14F',
    backgroundColor: '#00B14F',
  },
  priceChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  priceChipTextActive: {
    color: '#FFFFFF',
  },
  sortGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sortChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  sortChipActive: {
    borderColor: '#00B14F',
    backgroundColor: '#F0FDF4',
  },
  sortChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  sortChipTextActive: {
    color: '#00B14F',
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  toggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6B7280',
  },
  applyButton: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#00B14F',
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
