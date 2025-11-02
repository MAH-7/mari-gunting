import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { mockBookings } from '@/services/mockData';
import { Booking } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useState, useMemo } from 'react';
import { Calendar, DateData } from 'react-native-calendars';
import { format, parseISO, isSameDay } from 'date-fns';

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

interface WorkingHours {
  start: string;
  end: string;
  isEnabled: boolean;
}

export default function PartnerScheduleScreen() {
  const currentUser = useStore((state) => state.currentUser);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [isAvailable, setIsAvailable] = useState(true);
  const [showWorkingHoursModal, setShowWorkingHoursModal] = useState(false);
  const [workingHours, setWorkingHours] = useState<Record<DayOfWeek, WorkingHours>>({
    monday: { start: '09:00', end: '18:00', isEnabled: true },
    tuesday: { start: '09:00', end: '18:00', isEnabled: true },
    wednesday: { start: '09:00', end: '18:00', isEnabled: true },
    thursday: { start: '09:00', end: '18:00', isEnabled: true },
    friday: { start: '09:00', end: '18:00', isEnabled: true },
    saturday: { start: '10:00', end: '16:00', isEnabled: true },
    sunday: { start: '00:00', end: '00:00', isEnabled: false },
  });

  // Get partner's bookings
  const partnerBookings = useMemo(() => {
    if (!currentUser) return [];
    return mockBookings.filter((booking) => booking.barberId === currentUser.id);
  }, [currentUser]);

  // Get bookings for selected date
  const selectedDateBookings = useMemo(() => {
    return partnerBookings.filter((booking) => {
      if (!booking.scheduledDate) return false;
      const bookingDate = parseISO(booking.scheduledDate);
      const selected = parseISO(selectedDate);
      return isSameDay(bookingDate, selected);
    });
  }, [partnerBookings, selectedDate]);

  // Create marked dates for calendar
  const markedDates = useMemo(() => {
    const marked: any = {};
    
    partnerBookings.forEach((booking) => {
      if (booking.scheduledDate) {
        const date = booking.scheduledDate;
        if (!marked[date]) {
          marked[date] = { marked: true, dots: [] };
        }
        
        // Add colored dot based on status
        const color = 
          booking.status === 'completed' ? COLORS.success :
          booking.status === 'accepted' || booking.status === 'confirmed' ? COLORS.primary :
          booking.status === 'pending' ? COLORS.warning :
          COLORS.text.tertiary;
        
        marked[date].dots = marked[date].dots || [];
        if (marked[date].dots.length < 3) { // Limit to 3 dots
          marked[date].dots.push({ color });
        }
      }
    });

    // Highlight selected date
    marked[selectedDate] = {
      ...marked[selectedDate],
      selected: true,
      selectedColor: COLORS.primary,
    };

    return marked;
  }, [partnerBookings, selectedDate]);

  const renderBookingCard = (booking: Booking) => {
    const statusColor =
      booking.status === 'completed' ? COLORS.success :
      booking.status === 'accepted' || booking.status === 'confirmed' ? COLORS.primary :
      booking.status === 'pending' ? COLORS.warning :
      booking.status === 'cancelled' ? COLORS.error :
      COLORS.text.tertiary;

    return (
      <View key={booking.id} style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={16} color={COLORS.text.secondary} />
            <Text style={styles.bookingTime}>{booking.scheduledTime || 'TBD'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {booking.status}
            </Text>
          </View>
        </View>

        <Text style={styles.customerName}>{booking.customer?.name || booking.customerName}</Text>
        
        <View style={styles.servicesContainer}>
          {(booking.services || []).map((service, idx) => (
            <Text key={idx} style={styles.serviceText}>
              • {service.name}
            </Text>
          ))}
        </View>

        {booking.address && (
          <View style={styles.addressContainer}>
            <Ionicons name="location-outline" size={14} color={COLORS.text.tertiary} />
            <Text style={styles.addressText} numberOfLines={1}>
              {booking.address.fullAddress}
            </Text>
          </View>
        )}

        {booking.totalPrice && (
          <Text style={styles.priceText}>RM {booking.totalPrice.toFixed(2)}</Text>
        )}
      </View>
    );
  };

  const renderWorkingHoursModal = () => (
    <Modal
      visible={showWorkingHoursModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowWorkingHoursModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Working Hours</Text>
            <TouchableOpacity onPress={() => setShowWorkingHoursModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {(Object.keys(workingHours) as DayOfWeek[]).map((day) => (
              <View key={day} style={styles.dayRow}>
                <View style={styles.dayInfo}>
                  <Text style={styles.dayName}>
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </Text>
                  {workingHours[day].isEnabled ? (
                    <Text style={styles.dayHours}>
                      {workingHours[day].start} - {workingHours[day].end}
                    </Text>
                  ) : (
                    <Text style={styles.dayClosed}>Closed</Text>
                  )}
                </View>
                <Switch
                  value={workingHours[day].isEnabled}
                  onValueChange={(value) => {
                    setWorkingHours({
                      ...workingHours,
                      [day]: { ...workingHours[day], isEnabled: value },
                    });
                  }}
                  trackColor={{ false: COLORS.border.light, true: COLORS.primary + '60' }}
                  thumbColor={workingHours[day].isEnabled ? COLORS.primary : COLORS.text.tertiary}
                />
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.modalSaveButton}
            onPress={() => setShowWorkingHoursModal(false)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Save working hours changes"
          >
            <Text style={styles.modalSaveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Please log in to view schedule</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Schedule</Text>
            <Text style={styles.subtitle}>Manage your bookings and availability</Text>
          </View>
        </View>

        {/* Availability Toggle */}
        <View style={styles.availabilityCard}>
          <View style={styles.availabilityInfo}>
            <View style={[styles.availabilityDot, { backgroundColor: isAvailable ? COLORS.success : COLORS.error }]} />
            <View>
              <Text style={styles.availabilityLabel}>Availability Status</Text>
              <Text style={[styles.availabilityStatus, { color: isAvailable ? COLORS.success : COLORS.error }]}>
                {isAvailable ? 'Available for Bookings' : 'Not Available'}
              </Text>
            </View>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={setIsAvailable}
            trackColor={{ false: COLORS.border.light, true: COLORS.success + '60' }}
            thumbColor={isAvailable ? COLORS.success : COLORS.text.tertiary}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => setShowWorkingHoursModal(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Set working hours"
          >
            <Ionicons name="time-outline" size={20} color={COLORS.primary} />
            <Text style={styles.quickActionText}>Working Hours</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => Alert.alert('Block Dates', 'Coming soon! Block specific dates when you\'re unavailable.')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Block dates"
          >
            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
            <Text style={styles.quickActionText}>Block Dates</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            current={selectedDate}
            onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            markingType={'multi-dot'}
            theme={{
              backgroundColor: COLORS.background.secondary,
              calendarBackground: COLORS.background.primary,
              textSectionTitleColor: COLORS.text.secondary,
              selectedDayBackgroundColor: COLORS.primary,
              selectedDayTextColor: COLORS.text.inverse,
              todayTextColor: COLORS.primary,
              dayTextColor: COLORS.text.primary,
              textDisabledColor: COLORS.text.tertiary,
              dotColor: COLORS.primary,
              selectedDotColor: COLORS.text.inverse,
              arrowColor: COLORS.primary,
              monthTextColor: COLORS.text.primary,
              textMonthFontWeight: '600',
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
          />
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
            <Text style={styles.legendText}>Accepted</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} />
            <Text style={styles.legendText}>Pending</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
            <Text style={styles.legendText}>Completed</Text>
          </View>
        </View>

        {/* Selected Date Bookings */}
        <View style={styles.bookingsSection}>
          <Text style={styles.sectionTitle}>
            {format(parseISO(selectedDate), 'EEEE, MMM dd, yyyy')}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {selectedDateBookings.length} {selectedDateBookings.length === 1 ? 'booking' : 'bookings'}
          </Text>

          {selectedDateBookings.length > 0 ? (
            <View style={styles.bookingsList}>
              {selectedDateBookings.map(renderBookingCard)}
            </View>
          ) : (
            <View style={styles.emptyBookings}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.text.tertiary} />
              <Text style={styles.emptyBookingsText}>No bookings on this date</Text>
              <Text style={styles.emptyBookingsSubtext}>You're free this day!</Text>
            </View>
          )}
        </View>

        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>This Month</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{partnerBookings.length}</Text>
              <Text style={styles.statLabel}>Total Bookings</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {partnerBookings.filter(b => b.status === 'completed').length}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {partnerBookings.filter(b => b.status === 'pending').length}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {renderWorkingHoursModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  availabilityCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  availabilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  availabilityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  availabilityLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  availabilityStatus: {
    fontSize: 16,
    fontWeight: '700',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  calendarContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
  },
  bookingsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.body.medium,
    color: COLORS.text.secondary,
    marginBottom: 16,
  },
  bookingsList: {
    gap: 12,
  },
  bookingCard: {
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookingTime: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    ...TYPOGRAPHY.body.small,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  servicesContainer: {
    marginBottom: 8,
  },
  serviceText: {
    ...TYPOGRAPHY.body.medium,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  addressText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.tertiary,
    flex: 1,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 4,
  },
  emptyBookings: {
    padding: 40,
    alignItems: 'center',
  },
  emptyBookingsText: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.secondary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyBookingsSubtext: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.tertiary,
  },
  statsContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 6,
  },
  statLabel: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  modalTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
  },
  modalBody: {
    padding: 20,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  dayHours: {
    ...TYPOGRAPHY.body.medium,
    color: COLORS.text.secondary,
  },
  dayClosed: {
    ...TYPOGRAPHY.body.medium,
    color: COLORS.text.tertiary,
    fontStyle: 'italic',
  },
  modalSaveButton: {
    backgroundColor: COLORS.primary,
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.text.inverse,
  },
});
