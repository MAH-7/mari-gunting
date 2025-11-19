/**
 * Customer Chat Screen
 * Chat with barber for active booking
 */

import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ChatScreen } from '@mari-gunting/shared/components';
import { bookingService } from '@mari-gunting/shared/services/bookingService';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@mari-gunting/shared/theme';

export default function CustomerChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUser = useStore((state) => state.currentUser);

  // Fetch booking to get barber info
  const { data: bookingResponse, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingService.getBookingById(id),
    enabled: !!id,
  });

  const booking = bookingResponse?.data;

  if (isLoading || !booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Check if chat is available for this booking status
  const chatAvailableStatuses = ['accepted', 'on_the_way', 'arrived', 'in_progress'];
  if (!chatAvailableStatuses.includes(booking.status)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Chat Not Available</Text>
          <Text style={styles.errorMessage}>
            Chat is only available for active bookings
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking.barber) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>
            Barber information not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ChatScreen
        bookingId={id}
        currentUserId={currentUser?.id || ''}
        otherUserId={booking.barber.user_id}
        otherUserName={booking.barber.name || 'Barber'}
        otherUserAvatar={booking.barber.avatar || undefined}
        onBack={() => router.back()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
