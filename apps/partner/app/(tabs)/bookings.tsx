import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { useState } from 'react';

type BookingStatus = 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  service: string;
  time: string;
  duration: number;
  barber: string;
  status: BookingStatus;
  price: number;
}

export default function BookingsScreen() {
  const [selectedDate, setSelectedDate] = useState('2024-01-15');
  const [selectedBarber, setSelectedBarber] = useState('all');

  // Mock data
  const barbers = ['all', 'Rudi', 'Andi', 'Joko'];
  
  const appointments: Appointment[] = [
    {
      id: '1',
      customerName: 'Ahmad Hassan',
      customerPhone: '+60 12-345 6789',
      service: 'Haircut + Beard Trim',
      time: '09:00',
      duration: 45,
      barber: 'Rudi',
      status: 'confirmed',
      price: 85,
    },
    {
      id: '2',
      customerName: 'Budi Santoso',
      customerPhone: '+60 13-456 7890',
      service: 'Fade Cut',
      time: '10:00',
      duration: 60,
      barber: 'Andi',
      status: 'in_progress',
      price: 100,
    },
    {
      id: '3',
      customerName: 'Chandra Lee',
      customerPhone: '+60 14-567 8901',
      service: 'Beard Trim',
      time: '11:00',
      duration: 30,
      barber: 'Rudi',
      status: 'completed',
      price: 50,
    },
    {
      id: '4',
      customerName: 'Doni Wijaya',
      customerPhone: '+60 15-678 9012',
      service: 'Haircut',
      time: '14:00',
      duration: 45,
      barber: 'Joko',
      status: 'confirmed',
      price: 75,
    },
    {
      id: '5',
      customerName: 'Eko Prasetyo',
      customerPhone: '+60 16-789 0123',
      service: 'Hair Color',
      time: '15:00',
      duration: 90,
      barber: 'Andi',
      status: 'confirmed',
      price: 200,
    },
  ];

  const filteredAppointments = appointments.filter(app => 
    selectedBarber === 'all' || app.barber === selectedBarber
  );

  const formatCurrency = (amount: number) => {
    return `RM ${amount.toFixed(2)}`;
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return COLORS.primary;
      case 'in_progress':
        return '#FF9800';
      case 'completed':
        return COLORS.success;
      case 'cancelled':
        return COLORS.error;
      default:
        return COLORS.text.secondary;
    }
  };

  const getStatusText = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const totalAppointments = filteredAppointments.length;
  const totalRevenue = filteredAppointments.reduce((sum, app) => sum + app.price, 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Bookings</Text>
          <TouchableOpacity style={styles.calendarButton}>
            <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Date Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.dateScrollView}
          contentContainerStyle={styles.dateContainer}
        >
          {['Mon 15', 'Tue 16', 'Wed 17', 'Thu 18', 'Fri 19', 'Sat 20', 'Sun 21'].map((date, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.dateCard, index === 0 && styles.selectedDateCard]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[styles.dateText, index === 0 && styles.selectedDateText]}>
                {date.split(' ')[0]}
              </Text>
              <Text style={[styles.dateNumber, index === 0 && styles.selectedDateNumber]}>
                {date.split(' ')[1]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Barber Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterContainer}
        >
          {barbers.map((barber, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.filterChip,
                selectedBarber === barber && styles.selectedFilterChip
              ]}
              onPress={() => setSelectedBarber(barber)}
            >
              <Text style={[
                styles.filterText,
                selectedBarber === barber && styles.selectedFilterText
              ]}>
                {barber === 'all' ? 'All Staff' : barber}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Summary Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalAppointments}</Text>
            <Text style={styles.statLabel}>Appointments</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{formatCurrency(totalRevenue)}</Text>
            <Text style={styles.statLabel}>Total Revenue</Text>
          </View>
        </View>

        {/* Appointments List */}
        <View style={styles.appointmentsSection}>
          <Text style={styles.sectionTitle}>
            Today's Appointments ({filteredAppointments.length})
          </Text>
          
          {filteredAppointments.map((appointment) => (
            <TouchableOpacity key={appointment.id} style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <View style={styles.timeBox}>
                  <Text style={styles.timeText}>{appointment.time}</Text>
                  <Text style={styles.durationText}>{appointment.duration} min</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(appointment.status) }]}>
                    {getStatusText(appointment.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.appointmentBody}>
                <View style={styles.customerInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{appointment.customerName.charAt(0)}</Text>
                  </View>
                  <View style={styles.customerDetails}>
                    <Text style={styles.customerName}>{appointment.customerName}</Text>
                    <Text style={styles.customerPhone}>{appointment.customerPhone}</Text>
                  </View>
                </View>

                <View style={styles.appointmentDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="cut" size={16} color={COLORS.text.secondary} />
                    <Text style={styles.detailText}>{appointment.service}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="person" size={16} color={COLORS.text.secondary} />
                    <Text style={styles.detailText}>{appointment.barber}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="cash" size={16} color={COLORS.text.secondary} />
                    <Text style={styles.detailText}>{formatCurrency(appointment.price)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.appointmentActions}>
                {appointment.status === 'confirmed' && (
                  <>
                    <TouchableOpacity style={styles.actionButtonSecondary}>
                      <Text style={styles.actionButtonSecondaryText}>Reschedule</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButtonPrimary}>
                      <Text style={styles.actionButtonPrimaryText}>Start Service</Text>
                    </TouchableOpacity>
                  </>
                )}
                {appointment.status === 'in_progress' && (
                  <TouchableOpacity style={[styles.actionButtonPrimary, { flex: 1 }]}>
                    <Text style={styles.actionButtonPrimaryText}>Mark as Complete</Text>
                  </TouchableOpacity>
                )}
                {appointment.status === 'completed' && (
                  <TouchableOpacity style={[styles.actionButtonSecondary, { flex: 1 }]}>
                    <Ionicons name="receipt-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.actionButtonSecondaryText}>View Receipt</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.fabButton}>
        <Ionicons name="add" size={32} color={COLORS.background.primary} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary,
  },
  calendarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateScrollView: {
    marginBottom: 16,
  },
  dateContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  dateCard: {
    width: 60,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: COLORS.background.primary,
    alignItems: 'center',
  },
  selectedDateCard: {
    backgroundColor: COLORS.primary,
  },
  dateText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  selectedDateText: {
    color: COLORS.background.primary,
  },
  dateNumber: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
  },
  selectedDateNumber: {
    color: COLORS.background.primary,
  },
  filterScrollView: {
    marginBottom: 16,
  },
  filterContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: COLORS.background.secondary,
  },
  selectedFilterChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.primary,
  },
  selectedFilterText: {
    color: COLORS.background.primary,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  appointmentsSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  appointmentCard: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeBox: {
    alignItems: 'flex-start',
  },
  timeText: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
  },
  durationText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    ...TYPOGRAPHY.body2,
    fontWeight: '600',
  },
  appointmentBody: {
    marginBottom: 16,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    ...TYPOGRAPHY.h4,
    color: COLORS.primary,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  customerPhone: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  appointmentDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.background.secondary,
    gap: 4,
  },
  actionButtonSecondaryText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: '600',
  },
  actionButtonPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPrimaryText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.background.primary,
    fontWeight: '600',
  },
  fabButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
