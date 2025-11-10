import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { bookingService } from '@mari-gunting/shared/services/bookingService';
import { reviewService } from '@mari-gunting/shared/services/reviewService';
import { Colors, theme } from '@mari-gunting/shared/theme';

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUser = useStore((state) => state.currentUser);
  const queryClient = useQueryClient();
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  // Fetch booking details
  const { data: bookingResponse, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingService.getBookingById(id),
    enabled: !!id,
  });

  const booking = bookingResponse?.data;

  // Submit review mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id) throw new Error('User not authenticated');
      if (rating === 0) throw new Error('Please select a rating');

      return await reviewService.submitReview({
        bookingId: id,
        customerId: currentUser.id,
        rating,
        comment: comment.trim() || undefined,
      });
    },
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['booking', id] });
        queryClient.invalidateQueries({ queryKey: ['customer-bookings'] });
        
        Alert.alert(
          'Thank You!',
          'Your review has been submitted successfully.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to submit review');
      }
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to submit review');
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting');
      return;
    }
    
    submitMutation.mutate();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking || !booking.barber) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={Colors.error} />
          <Text style={styles.errorTitle}>Booking Not Found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backIconButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate & Review</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Barber Info */}
        <View style={styles.barberCard}>
          <Image
            source={{ uri: booking.barber.avatar || 'https://via.placeholder.com/80' }}
            style={styles.barberAvatar}
          />
          <View style={styles.barberInfo}>
            <View style={styles.barberNameRow}>
              <Text style={styles.barberName}>{booking.barber.name}</Text>
              {booking.barber.isVerified && (
                <Ionicons name="checkmark-circle" size={18} color="#007AFF" />
              )}
            </View>
            <Text style={styles.bookingNumber}>Booking #{booking.booking_number}</Text>
          </View>
        </View>

        {/* Rating Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How was your experience?</Text>
          <Text style={styles.sectionSubtitle}>Tap a star to rate</Text>
          
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                activeOpacity={0.7}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={48}
                  color={star <= rating ? Colors.warning : Colors.gray[300]}
                />
              </TouchableOpacity>
            ))}
          </View>

          {rating > 0 && (
            <Text style={styles.ratingLabel}>
              {rating === 5 && '⭐ Excellent!'}
              {rating === 4 && '👍 Great!'}
              {rating === 3 && '😊 Good'}
              {rating === 2 && '😐 Fair'}
              {rating === 1 && '😞 Poor'}
            </Text>
          )}
        </View>

        {/* Comment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Share your feedback</Text>
          <Text style={styles.sectionSubtitle}>Help others make better decisions (optional)</Text>
          
          <TextInput
            style={styles.commentInput}
            placeholder="Tell us about your experience..."
            placeholderTextColor={Colors.gray[400]}             multiline
            numberOfLines={6}
            value={comment}
            onChangeText={setComment}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.characterCount}>{comment.length}/500</Text>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <View style={styles.tipRow}>
            <Ionicons name="information-circle" size={20} color={Colors.gray[500]} />
            <Text style={styles.tipText}>Your review will be visible to other customers</Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.gray[500]} />
            <Text style={styles.tipText}>Reviews are verified and linked to your booking</Text>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, (rating === 0 || submitMutation.isPending) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={rating === 0 || submitMutation.isPending}
          activeOpacity={0.8}
        >
          {submitMutation.isPending ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
              <Text style={styles.submitButtonText}>Submit Review</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.gray[500],
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  backButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
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
  backIconButton: {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  barberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  barberAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.gray[100],
  },
  barberInfo: {
    flex: 1,
    marginLeft: 16,
  },
  barberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  barberName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  bookingNumber: {
    fontSize: 14,
    color: Colors.gray[500],
    fontWeight: '500',
  },
  section: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.gray[500],
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  commentInput: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: Colors.text.primary,
    minHeight: 120,
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    color: Colors.gray[400],
    textAlign: 'right',
  },
  tipsCard: {
    backgroundColor: Colors.gray[100],
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: Colors.gray[500],
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.gray[300],
    shadowOpacity: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
