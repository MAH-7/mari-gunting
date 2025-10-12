import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Button,
  Badge,
  Avatar,
  Card,
  Colors,
  Typography,
  Spacing,
  BorderRadius,
} from '@mari-gunting/shared';
import { Calendar } from 'react-native-calendars';

type BookingStep = 'service' | 'barber' | 'datetime' | 'confirm';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface Barber {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  experience: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

// Mock data
const mockServices: Service[] = [
  { id: '1', name: 'Haircut', price: 25, duration: 30 },
  { id: '2', name: 'Beard Trim', price: 15, duration: 15 },
  { id: '3', name: 'Hot Shave', price: 20, duration: 20 },
  { id: '4', name: 'Hair Coloring', price: 80, duration: 90 },
  { id: '5', name: 'Hair Treatment', price: 50, duration: 45 },
];

const mockBarbers: Barber[] = [
  { id: '1', name: 'Ahmad Hassan', avatar: 'https://i.pravatar.cc/150?img=1', rating: 4.9, experience: '5 years' },
  { id: '2', name: 'Lee Wei', avatar: 'https://i.pravatar.cc/150?img=2', rating: 4.8, experience: '3 years' },
  { id: '3', name: 'Kumar', avatar: 'https://i.pravatar.cc/150?img=3', rating: 4.7, experience: '4 years' },
];

const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let hour = 9; hour <= 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push({ time, available: Math.random() > 0.3 });
    }
  }
  return slots;
};

export default function CreateBookingScreen() {
  const { barbershopId } = useLocalSearchParams();
  
  const [currentStep, setCurrentStep] = useState<BookingStep>('service');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [timeSlots] = useState<TimeSlot[]>(generateTimeSlots());

  const canProceed = () => {
    switch (currentStep) {
      case 'service':
        return selectedService !== null;
      case 'barber':
        return selectedBarber !== null;
      case 'datetime':
        return selectedDate !== '' && selectedTime !== '';
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 'service') {
      setCurrentStep('barber');
    } else if (currentStep === 'barber') {
      setCurrentStep('datetime');
    } else if (currentStep === 'datetime') {
      setCurrentStep('confirm');
    }
  };

  const handleBack = () => {
    if (currentStep === 'barber') {
      setCurrentStep('service');
    } else if (currentStep === 'datetime') {
      setCurrentStep('barber');
    } else if (currentStep === 'confirm') {
      setCurrentStep('datetime');
    } else {
      router.back();
    }
  };

  const handleConfirmBooking = async () => {
    // TODO: Call API to create booking
    Alert.alert(
      'Booking Confirmed!',
      'Your booking has been successfully created.',
      [
        {
          text: 'View Bookings',
          onPress: () => router.push('/(tabs)/bookings'),
        },
        {
          text: 'Back to Home',
          onPress: () => router.push('/(tabs)'),
          style: 'cancel',
        },
      ]
    );
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={styles.stepRow}>
        <View style={[styles.step, currentStep === 'service' && styles.activeStep]}>
          <Text style={[styles.stepNumber, currentStep === 'service' && styles.activeStepNumber]}>1</Text>
        </View>
        <View style={[styles.stepLine, currentStep !== 'service' && styles.activeStepLine]} />
        
        <View style={[styles.step, currentStep === 'barber' && styles.activeStep, ['datetime', 'confirm'].includes(currentStep) && styles.completedStep]}>
          <Text style={[styles.stepNumber, currentStep === 'barber' && styles.activeStepNumber]}>2</Text>
        </View>
        <View style={[styles.stepLine, ['datetime', 'confirm'].includes(currentStep) && styles.activeStepLine]} />
        
        <View style={[styles.step, currentStep === 'datetime' && styles.activeStep, currentStep === 'confirm' && styles.completedStep]}>
          <Text style={[styles.stepNumber, currentStep === 'datetime' && styles.activeStepNumber]}>3</Text>
        </View>
        <View style={[styles.stepLine, currentStep === 'confirm' && styles.activeStepLine]} />
        
        <View style={[styles.step, currentStep === 'confirm' && styles.activeStep]}>
          <Text style={[styles.stepNumber, currentStep === 'confirm' && styles.activeStepNumber]}>4</Text>
        </View>
      </View>
      
      <View style={styles.stepLabels}>
        <Text style={styles.stepLabel}>Service</Text>
        <Text style={styles.stepLabel}>Barber</Text>
        <Text style={styles.stepLabel}>Date/Time</Text>
        <Text style={styles.stepLabel}>Confirm</Text>
      </View>
    </View>
  );

  const renderServiceSelection = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Select Service</Text>
      <Text style={styles.sectionSubtitle}>Choose the service you'd like to book</Text>
      
      {mockServices.map((service) => (
        <TouchableOpacity
          key={service.id}
          style={[
            styles.selectionCard,
            selectedService?.id === service.id && styles.selectedCard,
          ]}
          onPress={() => setSelectedService(service)}
        >
          <View style={styles.selectionCardContent}>
            <View style={styles.selectionInfo}>
              <Text style={styles.selectionName}>{service.name}</Text>
              <Text style={styles.selectionDuration}>{service.duration} min</Text>
            </View>
            <Text style={styles.selectionPrice}>RM {service.price}</Text>
          </View>
          {selectedService?.id === service.id && (
            <Ionicons name="checkmark-circle" size={24} color={Colors.primary} style={styles.checkmark} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderBarberSelection = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Choose Barber</Text>
      <Text style={styles.sectionSubtitle}>Select your preferred barber</Text>
      
      {mockBarbers.map((barber) => (
        <TouchableOpacity
          key={barber.id}
          style={[
            styles.barberCard,
            selectedBarber?.id === barber.id && styles.selectedCard,
          ]}
          onPress={() => setSelectedBarber(barber)}
        >
          <Avatar imageUri={barber.avatar} name={barber.name} size="large" />
          <View style={styles.barberInfo}>
            <Text style={styles.barberName}>{barber.name}</Text>
            <Text style={styles.barberExperience}>{barber.experience}</Text>
            <View style={styles.barberRating}>
              <Ionicons name="star" size={16} color={Colors.warning} />
              <Text style={styles.ratingText}>{barber.rating}</Text>
            </View>
          </View>
          {selectedBarber?.id === barber.id && (
            <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDateTimeSelection = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Select Date & Time</Text>
      <Text style={styles.sectionSubtitle}>Choose your preferred appointment time</Text>
      
      <Calendar
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={{
          [selectedDate]: { selected: true, selectedColor: Colors.primary },
        }}
        minDate={new Date().toISOString().split('T')[0]}
        theme={{
          selectedDayBackgroundColor: Colors.primary,
          todayTextColor: Colors.primary,
          arrowColor: Colors.primary,
        }}
      />
      
      {selectedDate && (
        <>
          <Text style={styles.timeSlotsTitle}>Available Time Slots</Text>
          <FlatList
            data={timeSlots}
            numColumns={4}
            keyExtractor={(item) => item.time}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.timeSlot,
                  !item.available && styles.unavailableSlot,
                  selectedTime === item.time && styles.selectedTimeSlot,
                ]}
                onPress={() => item.available && setSelectedTime(item.time)}
                disabled={!item.available}
              >
                <Text
                  style={[
                    styles.timeSlotText,
                    !item.available && styles.unavailableSlotText,
                    selectedTime === item.time && styles.selectedTimeSlotText,
                  ]}
                >
                  {item.time}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.timeSlotsContainer}
          />
        </>
      )}
    </View>
  );

  const renderConfirmation = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Confirm Booking</Text>
      <Text style={styles.sectionSubtitle}>Please review your booking details</Text>
      
      <Card padding="medium" variant="outlined" style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Service:</Text>
          <Text style={styles.summaryValue}>{selectedService?.name}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Duration:</Text>
          <Text style={styles.summaryValue}>{selectedService?.duration} min</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Barber:</Text>
          <Text style={styles.summaryValue}>{selectedBarber?.name}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Date:</Text>
          <Text style={styles.summaryValue}>{selectedDate}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Time:</Text>
          <Text style={styles.summaryValue}>{selectedTime}</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>RM {selectedService?.price}</Text>
        </View>
      </Card>
      
      <View style={styles.notesContainer}>
        <Text style={styles.notesTitle}>Booking Notes</Text>
        <Text style={styles.notesText}>
          • Please arrive 5 minutes before your appointment
        </Text>
        <Text style={styles.notesText}>
          • Cancellations must be made 24 hours in advance
        </Text>
        <Text style={styles.notesText}>
          • You'll receive a confirmation via SMS
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {currentStep === 'service' && renderServiceSelection()}
        {currentStep === 'barber' && renderBarberSelection()}
        {currentStep === 'datetime' && renderDateTimeSelection()}
        {currentStep === 'confirm' && renderConfirmation()}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          title={currentStep === 'confirm' ? 'Confirm Booking' : 'Next'}
          onPress={currentStep === 'confirm' ? handleConfirmBooking : handleNext}
          disabled={!canProceed()}
          fullWidth
          size="large"
        />
      </View>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },

  // Step Indicator
  stepIndicator: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.gray[50],
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  step: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeStep: {
    backgroundColor: Colors.primary,
  },
  completedStep: {
    backgroundColor: Colors.success,
  },
  stepNumber: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  activeStepNumber: {
    color: Colors.white,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.gray[300],
    marginHorizontal: Spacing.xs,
  },
  activeStepLine: {
    backgroundColor: Colors.primary,
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    width: 60,
    textAlign: 'center',
  },

  // Section
  sectionTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },

  // Selection Cards
  selectionCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border.default,
    marginBottom: Spacing.md,
    position: 'relative',
  },
  selectedCard: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  selectionCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectionInfo: {
    flex: 1,
  },
  selectionName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  selectionDuration: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  selectionPrice: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  checkmark: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },

  // Barber Cards
  barberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border.default,
    marginBottom: Spacing.md,
  },
  barberInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  barberName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  barberExperience: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  barberRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  ratingText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },

  // Time Slots
  timeSlotsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  timeSlotsContainer: {
    gap: Spacing.sm,
  },
  timeSlot: {
    flex: 1,
    aspectRatio: 2,
    margin: 4,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  selectedTimeSlot: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  unavailableSlot: {
    backgroundColor: Colors.gray[100],
    borderColor: Colors.gray[300],
  },
  timeSlotText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },
  selectedTimeSlotText: {
    color: Colors.white,
  },
  unavailableSlotText: {
    color: Colors.text.tertiary,
  },

  // Confirmation
  summaryCard: {
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  summaryValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: Spacing.sm,
  },
  totalLabel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  totalValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  notesContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.md,
  },
  notesTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  notesText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },

  // Footer
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
});
