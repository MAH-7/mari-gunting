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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BookingStatus } from '@/types';
import { MODAL_ANIMATION, ACTIVE_OPACITY } from '@/constants/animations';
import { Colors, theme } from '@mari-gunting/shared/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface BookingFilterOptions {
  sortBy: 'date' | 'price' | 'status';
  filterStatus: BookingStatus | 'all';
}

interface BookingFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: BookingFilterOptions) => void;
  currentFilters: BookingFilterOptions;
  showStatusFilter: boolean; // Only show for active bookings
}

export default function BookingFilterModal({
  visible,
  onClose,
  onApply,
  currentFilters,
  showStatusFilter,
}: BookingFilterModalProps) {
  const [sortBy, setSortBy] = useState(currentFilters.sortBy);
  const [filterStatus, setFilterStatus] = useState(currentFilters.filterStatus);

  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset to current filters when modal opens
      setSortBy(currentFilters.sortBy);
      setFilterStatus(currentFilters.filterStatus);

      // Animate in
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: MODAL_ANIMATION.BACKDROP_FADE_IN,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: MODAL_ANIMATION.SPRING.damping,
          stiffness: MODAL_ANIMATION.SPRING.stiffness,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: MODAL_ANIMATION.BACKDROP_FADE_OUT,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: MODAL_ANIMATION.SLIDE_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleReset = () => {
    setSortBy('date');
    setFilterStatus('all');
  };

  const handleApply = () => {
    onApply({
      sortBy,
      filterStatus,
    });
    onClose();
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
          <Text style={styles.headerTitle}>Filter & Sort</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={Colors.gray[500]} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Sort By Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="swap-vertical" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Sort By</Text>
            </View>
            <View style={styles.optionsList}>
              {/* Date */}
              <TouchableOpacity
                style={[styles.option, sortBy === 'date' && styles.optionActive]}
                onPress={() => setSortBy('date')}
              >
                <View style={styles.optionLeft}>
                  <View style={styles.optionIcon}>
                    <Ionicons name="calendar" size={20} color={sortBy === 'date' ? Colors.primary : Colors.gray[500]} />
                  </View>
                  <View style={styles.optionInfo}>
                    <Text style={[styles.optionLabel, sortBy === 'date' && styles.optionLabelActive]}>
                      Date
                    </Text>
                    <Text style={styles.optionDescription}>Newest first</Text>
                  </View>
                </View>
                {sortBy === 'date' && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                )}
              </TouchableOpacity>

              {/* Price */}
              <TouchableOpacity
                style={[styles.option, sortBy === 'price' && styles.optionActive]}
                onPress={() => setSortBy('price')}
              >
                <View style={styles.optionLeft}>
                  <View style={styles.optionIcon}>
                    <Ionicons name="cash" size={20} color={sortBy === 'price' ? Colors.primary : Colors.gray[500]} />
                  </View>
                  <View style={styles.optionInfo}>
                    <Text style={[styles.optionLabel, sortBy === 'price' && styles.optionLabelActive]}>
                      Price
                    </Text>
                    <Text style={styles.optionDescription}>Highest first</Text>
                  </View>
                </View>
                {sortBy === 'price' && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                )}
              </TouchableOpacity>

              {/* Status */}
              <TouchableOpacity
                style={[styles.option, sortBy === 'status' && styles.optionActive]}
                onPress={() => setSortBy('status')}
              >
                <View style={styles.optionLeft}>
                  <View style={styles.optionIcon}>
                    <Ionicons name="list" size={20} color={sortBy === 'status' ? Colors.primary : Colors.gray[500]} />
                  </View>
                  <View style={styles.optionInfo}>
                    <Text style={[styles.optionLabel, sortBy === 'status' && styles.optionLabelActive]}>
                      Status
                    </Text>
                    <Text style={styles.optionDescription}>By urgency</Text>
                  </View>
                </View>
                {sortBy === 'status' && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Filter by Status (only for active bookings) */}
          {showStatusFilter && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="funnel" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Filter by Status</Text>
              </View>
              <View style={styles.chipGrid}>
                <TouchableOpacity
                  style={[styles.chip, filterStatus === 'all' && styles.chipActive]}
                  onPress={() => setFilterStatus('all')}
                >
                  <Text style={[styles.chipText, filterStatus === 'all' && styles.chipTextActive]}>
                    All
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.chip, filterStatus === 'pending' && styles.chipActive]}
                  onPress={() => setFilterStatus('pending')}
                >
                  <Ionicons name="time" size={14} color={filterStatus === 'pending' ? Colors.white : Colors.warning} />
                  <Text style={[styles.chipText, filterStatus === 'pending' && styles.chipTextActive]}>
                    Pending
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.chip, filterStatus === 'accepted' && styles.chipActive]}
                  onPress={() => setFilterStatus('accepted')}
                >
                  <Ionicons name="checkmark-circle" size={14} color={filterStatus === 'accepted' ? Colors.white : Colors.info} />
                  <Text style={[styles.chipText, filterStatus === 'accepted' && styles.chipTextActive]}>
                    Accepted
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.chip, filterStatus === 'on-the-way' && styles.chipActive]}
                  onPress={() => setFilterStatus('on-the-way')}
                >
                  <Ionicons name="car" size={14} color={filterStatus === 'on-the-way' ? Colors.white : Colors.status.ready} />
                  <Text style={[styles.chipText, filterStatus === 'on-the-way' && styles.chipTextActive]}>
                    On The Way
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.chip, filterStatus === 'in-progress' && styles.chipActive]}
                  onPress={() => setFilterStatus('in-progress')}
                >
                  <Ionicons name="cut" size={14} color={filterStatus === 'in-progress' ? Colors.white : Colors.primary} />
                  <Text style={[styles.chipText, filterStatus === 'in-progress' && styles.chipTextActive]}>
                    In Progress
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
          >
            <Ionicons name="refresh" size={18} color={Colors.gray[500]} />
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
    backgroundColor: Colors.white,
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
    borderBottomColor: Colors.gray[100],
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
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
    color: Colors.text.primary,
  },
  optionsList: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    backgroundColor: Colors.white,
  },
  optionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: 2,
  },
  optionLabelActive: {
    color: Colors.primary,
  },
  optionDescription: {
    fontSize: 13,
    color: Colors.gray[400],
    fontWeight: '500',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    backgroundColor: Colors.white,
    gap: 6,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[700],
  },
  chipTextActive: {
    color: Colors.white,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
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
    borderColor: Colors.gray[200],
    backgroundColor: Colors.white,
    gap: 8,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.gray[500],
  },
  applyButton: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },
});
