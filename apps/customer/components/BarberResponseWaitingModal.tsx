import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { supabase } from '@mari-gunting/shared/config/supabase';

interface BarberResponseWaitingModalProps {
  visible: boolean;
  bookingId: string;
  barberName: string;
  onBarberAccepted: () => void;
  onBarberRejected: () => void;
  onTimeout: () => void;
  onCancel: () => void;
  timeoutSeconds?: number;
}

export const BarberResponseWaitingModal: React.FC<BarberResponseWaitingModalProps> = ({
  visible,
  bookingId,
  barberName,
  onBarberAccepted,
  onBarberRejected,
  onTimeout,
  onCancel,
  timeoutSeconds = 180, // 3 minutes default
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Timer
  useEffect(() => {
    if (!visible) {
      setElapsedSeconds(0);
      return;
    }

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => {
        const newValue = prev + 1;
        
        // Check for timeout
        if (newValue >= timeoutSeconds) {
          clearInterval(timer);
          onTimeout();
        }
        
        return newValue;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, timeoutSeconds, onTimeout]);

  // Real-time subscription for booking status changes
  useEffect(() => {
    if (!visible || !bookingId) return;

    console.log('[Waiting] Setting up real-time subscription for booking:', bookingId);

    const channel = supabase
      .channel(`booking-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`,
        },
        (payload) => {
          console.log('[Waiting] Booking updated:', payload);
          
          const newStatus = payload.new.status;
          
          if (newStatus === 'accepted' || newStatus === 'confirmed') {
            console.log('[Waiting] Barber accepted!');
            onBarberAccepted();
          } else if (newStatus === 'rejected' || newStatus === 'cancelled') {
            console.log('[Waiting] Barber rejected or booking cancelled');
            onBarberRejected();
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[Waiting] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [visible, bookingId, onBarberAccepted, onBarberRejected]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: onCancel,
        },
      ]
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Spinner */}
          <ActivityIndicator size="large" color="#7E3AF2" style={styles.spinner} />

          {/* Title */}
          <Text style={styles.title}>Finding your barber...</Text>

          {/* Barber name */}
          <Text style={styles.subtitle}>
            We've sent your request to
          </Text>
          <Text style={styles.barberName}>{barberName}</Text>

          {/* Status */}
          <Text style={styles.status}>Waiting for response...</Text>

          {/* Timer */}
          <View style={styles.timerContainer}>
            <Text style={styles.timerIcon}>⏱️</Text>
            <Text style={styles.timer}>{formatTime(elapsedSeconds)} elapsed</Text>
          </View>

          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${(elapsedSeconds / timeoutSeconds) * 100}%` },
              ]}
            />
          </View>

          {/* Info text */}
          <Text style={styles.infoText}>
            You'll be notified when the barber responds
          </Text>

          {/* Cancel button */}
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  spinner: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  barberName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7E3AF2',
    marginBottom: 15,
    textAlign: 'center',
  },
  status: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  timerIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  timer: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#7E3AF2',
    borderRadius: 2,
  },
  infoText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 25,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});
