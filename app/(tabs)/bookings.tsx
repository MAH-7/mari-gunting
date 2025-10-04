import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, StyleSheet, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/services/api';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatShortDate, formatTime } from '@/utils/format';
import { Booking, BookingStatus } from '@/types';

export default function BookingsScreen() {
  const currentUser = useStore((state) => state.currentUser);
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed'>('active');
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Applied filters (used for display)
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'status'>('date');
  const [filterStatus, setFilterStatus] = useState<BookingStatus | 'all'>('all');
  
  // Temporary filters (used in modal before applying)
  const [tempSortBy, setTempSortBy] = useState<'date' | 'price' | 'status'>('date');
  const [tempFilterStatus, setTempFilterStatus] = useState<BookingStatus | 'all'>('all');

  const { data: bookingsResponse, isLoading } = useQuery({
    queryKey: ['bookings', currentUser?.id],
    queryFn: () => api.getBookings({ customerId: currentUser?.id }),
    enabled: !!currentUser,
  });

  const bookings = bookingsResponse?.data?.data || [];

  const activeBookings = bookings.filter(
    b => ['pending', 'accepted', 'on-the-way', 'in-progress'].includes(b.status)
  );

  const completedBookings = bookings.filter(
    b => ['completed', 'cancelled'].includes(b.status)
  );

  // Apply filters
  let filteredBookings = selectedTab === 'active' ? activeBookings : completedBookings;
  
  // Filter by status
  if (filterStatus !== 'all') {
    filteredBookings = filteredBookings.filter(b => b.status === filterStatus);
  }
  
  // Sort bookings
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'price') {
      return b.totalPrice - a.totalPrice;
    } else {
      return a.status.localeCompare(b.status);
    }
  });
  
  const displayBookings = sortedBookings;
  
  const hasActiveFilters = sortBy !== 'date' || filterStatus !== 'all';

  // Open modal and sync temp filters with applied filters
  const openFilterModal = () => {
    setTempSortBy(sortBy);
    setTempFilterStatus(filterStatus);
    setShowFilterModal(true);
  };

  // Apply filters
  const applyFilters = () => {
    setSortBy(tempSortBy);
    setFilterStatus(tempFilterStatus);
    setShowFilterModal(false);
  };

  // Reset filters
  const resetFilters = () => {
    setTempSortBy('date');
    setTempFilterStatus('all');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={openFilterModal}
          activeOpacity={0.7}
        >
          <Ionicons name="options-outline" size={24} color="#111827" />
          {hasActiveFilters && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter & Sort</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>

            {/* Sort Section */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionLabel}>SORT BY</Text>
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={[styles.optionButton, tempSortBy === 'date' && styles.optionButtonActive]}
                  onPress={() => setTempSortBy('date')}
                >
                  <Ionicons 
                    name="calendar-outline" 
                    size={20} 
                    color={tempSortBy === 'date' ? '#00B14F' : '#6B7280'} 
                  />
                  <Text style={[styles.optionText, tempSortBy === 'date' && styles.optionTextActive]}>
                    Date (Newest)
                  </Text>
                  {tempSortBy === 'date' && (
                    <Ionicons name="checkmark" size={20} color="#00B14F" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.optionButton, tempSortBy === 'price' && styles.optionButtonActive]}
                  onPress={() => setTempSortBy('price')}
                >
                  <Ionicons 
                    name="cash-outline" 
                    size={20} 
                    color={tempSortBy === 'price' ? '#00B14F' : '#6B7280'} 
                  />
                  <Text style={[styles.optionText, tempSortBy === 'price' && styles.optionTextActive]}>
                    Price (Highest)
                  </Text>
                  {tempSortBy === 'price' && (
                    <Ionicons name="checkmark" size={20} color="#00B14F" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.optionButton, tempSortBy === 'status' && styles.optionButtonActive]}
                  onPress={() => setTempSortBy('status')}
                >
                  <Ionicons 
                    name="list-outline" 
                    size={20} 
                    color={tempSortBy === 'status' ? '#00B14F' : '#6B7280'} 
                  />
                  <Text style={[styles.optionText, tempSortBy === 'status' && styles.optionTextActive]}>
                    Status
                  </Text>
                  {tempSortBy === 'status' && (
                    <Ionicons name="checkmark" size={20} color="#00B14F" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Filter Section */}
            {selectedTab === 'active' && (
              <View style={styles.filterSection}>
                <Text style={styles.sectionLabel}>FILTER BY STATUS</Text>
                <View style={styles.optionsContainer}>
                  <TouchableOpacity
                    style={[styles.optionButton, tempFilterStatus === 'all' && styles.optionButtonActive]}
                    onPress={() => setTempFilterStatus('all')}
                  >
                    <Text style={[styles.optionText, tempFilterStatus === 'all' && styles.optionTextActive]}>
                      All Active
                    </Text>
                    {tempFilterStatus === 'all' && (
                      <Ionicons name="checkmark" size={20} color="#00B14F" />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.optionButton, tempFilterStatus === 'pending' && styles.optionButtonActive]}
                    onPress={() => setTempFilterStatus('pending')}
                  >
                    <Ionicons name="time-outline" size={18} color="#F59E0B" />
                    <Text style={[styles.optionText, tempFilterStatus === 'pending' && styles.optionTextActive]}>
                      Pending
                    </Text>
                    {tempFilterStatus === 'pending' && (
                      <Ionicons name="checkmark" size={20} color="#00B14F" />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.optionButton, tempFilterStatus === 'accepted' && styles.optionButtonActive]}
                    onPress={() => setTempFilterStatus('accepted')}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#3B82F6" />
                    <Text style={[styles.optionText, tempFilterStatus === 'accepted' && styles.optionTextActive]}>
                      Accepted
                    </Text>
                    {tempFilterStatus === 'accepted' && (
                      <Ionicons name="checkmark" size={20} color="#00B14F" />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.optionButton, tempFilterStatus === 'on-the-way' && styles.optionButtonActive]}
                    onPress={() => setTempFilterStatus('on-the-way')}
                  >
                    <Ionicons name="car-outline" size={18} color="#8B5CF6" />
                    <Text style={[styles.optionText, tempFilterStatus === 'on-the-way' && styles.optionTextActive]}>
                      On The Way
                    </Text>
                    {tempFilterStatus === 'on-the-way' && (
                      <Ionicons name="checkmark" size={20} color="#00B14F" />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.optionButton, tempFilterStatus === 'in-progress' && styles.optionButtonActive]}
                    onPress={() => setTempFilterStatus('in-progress')}
                  >
                    <Ionicons name="cut-outline" size={18} color="#00B14F" />
                    <Text style={[styles.optionText, tempFilterStatus === 'in-progress' && styles.optionTextActive]}>
                      In Progress
                    </Text>
                    {tempFilterStatus === 'in-progress' && (
                      <Ionicons name="checkmark" size={20} color="#00B14F" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
            </ScrollView>

            {/* Actions - Fixed at Bottom */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetFilters}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyFilters}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'active' && styles.tabActive]}
          onPress={() => setSelectedTab('active')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, selectedTab === 'active' && styles.tabTextActive]}>
            Active
          </Text>
          {activeBookings.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{activeBookings.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'completed' && styles.tabActive]}
          onPress={() => setSelectedTab('completed')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, selectedTab === 'completed' && styles.tabTextActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#00B14F" />
            <Text style={styles.loadingText}>Loading bookings...</Text>
          </View>
        ) : displayBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons 
              name={selectedTab === 'active' ? 'clipboard-outline' : 'checkmark-done-circle'} 
              size={64} 
              color="#D1D5DB" 
            />
            <Text style={styles.emptyTitle}>
              {selectedTab === 'active' ? 'No active bookings' : 'No booking history'}
            </Text>
            <Text style={styles.emptySubtext}>
              {selectedTab === 'active' 
                ? 'Book a barber to get started' 
                : 'Completed bookings will appear here'}
            </Text>
            {selectedTab === 'active' && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/(tabs)' as any)}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyButtonText}>Find Barber</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          displayBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const getStatusConfig = (status: BookingStatus) => {
    const configs = {
      pending: { 
        color: '#F59E0B', 
        bg: '#FEF3C7', 
        label: 'Pending',
        iconName: 'time-outline' as const,
        progress: 25
      },
      accepted: { 
        color: '#3B82F6', 
        bg: '#DBEAFE', 
        label: 'Accepted',
        iconName: 'checkmark-circle' as const,
        progress: 50
      },
      'on-the-way': { 
        color: '#8B5CF6', 
        bg: '#EDE9FE', 
        label: 'On The Way',
        iconName: 'car' as const,
        progress: 75
      },
      'in-progress': { 
        color: '#00B14F', 
        bg: '#D1FAE5', 
        label: 'In Progress',
        iconName: 'cut' as const,
        progress: 90
      },
      completed: { 
        color: '#10B981', 
        bg: '#D1FAE5', 
        label: 'Completed',
        iconName: 'checkmark-circle' as const,
        progress: 100
      },
      cancelled: { 
        color: '#EF4444', 
        bg: '#FEE2E2', 
        label: 'Cancelled',
        iconName: 'close-circle' as const,
        progress: 0
      },
    };
    return configs[status] || configs.pending;
  };

  const statusConfig = getStatusConfig(booking.status);

  return (
    <TouchableOpacity
      style={styles.bookingCard}
      onPress={() => router.push(`/booking/${booking.id}` as any)}
      activeOpacity={0.95}
    >
      {/* Status Bar */}
      <View style={[styles.statusBar, { backgroundColor: statusConfig.bg }]}>
        <View style={styles.statusLeft}>
          <Ionicons name={statusConfig.iconName} size={18} color={statusConfig.color} style={styles.statusIcon} />
          <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
        <Text style={styles.bookingId}>#{booking.id.slice(-4).toUpperCase()}</Text>
      </View>

      {/* Progress Indicator */}
      {booking.status !== 'cancelled' && booking.status !== 'completed' && (
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View 
              style={[
                styles.progressBar, 
                { 
                  width: `${statusConfig.progress}%`,
                  backgroundColor: statusConfig.color 
                }
              ]} 
            />
          </View>
        </View>
      )}

      {/* Content */}
      <View style={styles.cardContent}>
        {/* Barber Row */}
        <View style={styles.barberRow}>
          <Image
            source={{ uri: booking.barber.avatar }}
            style={styles.barberAvatar}
          />
          <View style={styles.barberInfo}>
            <Text style={styles.barberName}>{booking.barber.name}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#FBBF24" style={styles.starIcon} />
              <Text style={styles.ratingText}>{booking.barber.rating.toFixed(1)}</Text>
              <View style={styles.divider} />
              <Text style={styles.jobsText}>{booking.barber.completedJobs} jobs</Text>
            </View>
          </View>
        </View>

        {/* Services */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionLabel}>Services</Text>
          {booking.services.map((service, index) => (
            <View key={service.id} style={styles.serviceRow}>
              <View style={styles.serviceLeft}>
                <View style={styles.serviceDot} />
                <Text style={styles.serviceName}>{service.name}</Text>
              </View>
              <Text style={styles.servicePrice}>{formatCurrency(service.price)}</Text>
            </View>
          ))}
        </View>

        {/* Date & Location */}
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="calendar" size={16} color="#6B7280" />
            </View>
            <Text style={styles.detailText}>
              {formatShortDate(booking.scheduledDate)} at {formatTime(booking.scheduledTime)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="location" size={16} color="#6B7280" />
            </View>
            <Text style={styles.detailText} numberOfLines={1}>
              {booking.address.fullAddress}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(booking.totalPrice)}</Text>
          </View>
          {(booking.status === 'pending' || booking.status === 'accepted') && (
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
          {booking.status === 'completed' && !booking.review && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonPrimary]} 
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonTextPrimary}>Rate</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    letterSpacing: -0.5,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00B14F',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalScroll: {
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  optionButtonActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#00B14F',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  optionTextActive: {
    color: '#00B14F',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#00B14F',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: '#00B14F',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  tabBadgeText: {
    color: '#00B14F',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#00B14F',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  bookingId: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  cardContent: {
    padding: 16,
  },
  barberRow: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  barberAvatar: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  barberInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  barberName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginRight: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  divider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 8,
  },
  jobsText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  servicesSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00B14F',
    marginRight: 10,
  },
  serviceName: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  detailsSection: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  totalSection: {},
  totalLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00B14F',
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  actionButtonPrimary: {
    backgroundColor: '#00B14F',
    borderColor: '#00B14F',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  actionButtonTextPrimary: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
