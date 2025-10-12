import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format, parseISO } from 'date-fns';
import { COLORS } from '@/shared/constants';
import { useStore } from '@/store/useStore';

const { width } = Dimensions.get('window');

// Mock reviews data - in production, this would come from API
const mockReviews = [
  {
    id: 'r1',
    customerName: 'Ahmad Zaki',
    customerAvatar: 'AZ',
    rating: 5,
    comment: 'Excellent service! Very professional and skilled. My fade looks perfect. Highly recommended!',
    service: 'Modern Fade Cut',
    date: '2025-01-07T14:30:00Z',
    response: null,
  },
  {
    id: 'r2',
    customerName: 'Raj Kumar',
    rating: 5,
    customerAvatar: 'RK',
    comment: "Best barber I've found in KL! Takes his time and really listens to what you want. Very professional.",
    service: 'Classic Cut + Beard Trim',
    date: '2025-01-04T16:45:00Z',
    response: {
      text: 'Thank you so much for your kind words! Looking forward to serving you again.',
      date: '2025-01-04T18:00:00Z',
    },
  },
  {
    id: 'r3',
    customerName: 'Tan Wei Ming',
    customerAvatar: 'TW',
    rating: 4,
    comment: 'Great cut and friendly service. Would have given 5 stars but had to wait a bit longer than expected.',
    service: 'Pompadour Style',
    date: '2025-01-02T10:15:00Z',
    response: null,
  },
  {
    id: 'r4',
    customerName: 'Sarah Lee',
    customerAvatar: 'SL',
    rating: 5,
    comment: 'Amazing experience! Very skilled and professional. My husband is very happy with his haircut.',
    service: 'Classic Haircut',
    date: '2024-12-30T11:30:00Z',
    response: {
      text: 'Thank you Sarah! Glad your husband is happy with the result!',
      date: '2024-12-30T12:00:00Z',
    },
  },
  {
    id: 'r5',
    customerName: 'Daniel Wong',
    customerAvatar: 'DW',
    rating: 5,
    comment: 'Superb service! Clean fade and very punctual. Will definitely book again.',
    service: 'Fade + Line Up',
    date: '2024-12-28T15:20:00Z',
    response: null,
  },
  {
    id: 'r6',
    customerName: 'Ali Hassan',
    customerAvatar: 'AH',
    rating: 4,
    comment: 'Good service overall. Professional and friendly. Only minor issue was slight delay.',
    service: 'Beard Trim',
    date: '2024-12-25T09:00:00Z',
    response: null,
  },
];

type FilterType = 'all' | '5' | '4' | '3' | '2' | '1';

export default function ReviewsScreen() {
  const currentUser = useStore((state) => state.currentUser);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedReview, setSelectedReview] = useState<typeof mockReviews[0] | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');

  // Calculate rating statistics
  const stats = useMemo(() => {
    const total = mockReviews.length;
    const avgRating = mockReviews.reduce((sum, r) => sum + r.rating, 0) / total;
    
    const distribution = {
      5: mockReviews.filter(r => r.rating === 5).length,
      4: mockReviews.filter(r => r.rating === 4).length,
      3: mockReviews.filter(r => r.rating === 3).length,
      2: mockReviews.filter(r => r.rating === 2).length,
      1: mockReviews.filter(r => r.rating === 1).length,
    };

    const withResponse = mockReviews.filter(r => r.response).length;
    const responseRate = (withResponse / total) * 100;

    return {
      total,
      avgRating,
      distribution,
      responseRate,
    };
  }, []);

  // Filter reviews
  const filteredReviews = useMemo(() => {
    if (filter === 'all') return mockReviews;
    return mockReviews.filter(r => r.rating === parseInt(filter));
  }, [filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setRefreshing(false);
  };

  const handleReply = (review: typeof mockReviews[0]) => {
    setSelectedReview(review);
    setReplyText('');
    setShowReplyModal(true);
  };

  const submitReply = () => {
    if (!replyText.trim()) {
      Alert.alert('Error', 'Please enter a reply');
      return;
    }

    // In production, this would send to API
    Alert.alert('Success', 'Reply posted successfully!');
    setShowReplyModal(false);
    setSelectedReview(null);
    setReplyText('');
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="star-outline" size={64} color="#CCC" />
          <Text style={styles.emptyText}>Please log in to view reviews</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#FFF"
          />
        }
      >
        {/* Hero Rating Card */}
        <LinearGradient
          colors={[COLORS.primary, '#00A870']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroLabel}>Your Rating</Text>
            <View style={styles.heroRating}>
              <Text style={styles.ratingNumber}>{stats.avgRating.toFixed(1)}</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= Math.round(stats.avgRating) ? 'star' : 'star-outline'}
                    size={20}
                    color="#FFD700"
                  />
                ))}
              </View>
            </View>
            <Text style={styles.heroSubtext}>Based on {stats.total} reviews</Text>

            {/* Quick Stats */}
            <View style={styles.quickStats}>
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>{stats.responseRate.toFixed(0)}%</Text>
                <Text style={styles.quickStatLabel}>Response Rate</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>
                  {mockReviews.filter(r => !r.response).length}
                </Text>
                <Text style={styles.quickStatLabel}>Need Reply</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Rating Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rating Distribution</Text>
          <View style={styles.distributionCard}>
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.distribution[rating as keyof typeof stats.distribution];
              const percentage = (count / stats.total) * 100;
              
              return (
                <View key={rating} style={styles.distributionRow}>
                  <View style={styles.distributionLeft}>
                    <Text style={styles.distributionRating}>{rating}</Text>
                    <Ionicons name="star" size={14} color="#FFB800" />
                  </View>
                  <View style={styles.distributionBar}>
                    <View 
                      style={[
                        styles.distributionBarFill, 
                        { width: `${percentage}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.distributionCount}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {(['all', '5', '4', '3', '2', '1'] as FilterType[]).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterTab, filter === f && styles.filterTabActive]}
                onPress={() => setFilter(f)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                  {f === 'all' ? 'All' : `${f} ⭐`}
                </Text>
                {f === 'all' && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{stats.total}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Reviews List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Customer Reviews</Text>
            <Text style={styles.reviewCount}>
              {filteredReviews.length} {filteredReviews.length === 1 ? 'review' : 'reviews'}
            </Text>
          </View>

          {filteredReviews.length > 0 ? (
            filteredReviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                {/* Review Header */}
                <View style={styles.reviewHeader}>
                  <View style={styles.customerInfo}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{review.customerAvatar}</Text>
                    </View>
                    <View style={styles.customerDetails}>
                      <Text style={styles.customerName}>{review.customerName}</Text>
                      <Text style={styles.reviewDate}>
                        {format(parseISO(review.date), 'MMM dd, yyyy')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={14} color="#FFB800" />
                    <Text style={styles.ratingValue}>{review.rating.toFixed(1)}</Text>
                  </View>
                </View>

                {/* Service Badge */}
                <View style={styles.serviceBadge}>
                  <Ionicons name="cut-outline" size={12} color={COLORS.primary} />
                  <Text style={styles.serviceBadgeText}>{review.service}</Text>
                </View>

                {/* Review Comment */}
                <Text style={styles.reviewComment}>{review.comment}</Text>

                {/* Response Section */}
                {review.response ? (
                  <View style={styles.responseCard}>
                    <View style={styles.responseHeader}>
                      <Ionicons name="arrow-undo" size={14} color={COLORS.primary} />
                      <Text style={styles.responseLabel}>Your Response</Text>
                      <Text style={styles.responseDate}>
                        {format(parseISO(review.response.date), 'MMM dd')}
                      </Text>
                    </View>
                    <Text style={styles.responseText}>{review.response.text}</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.replyButton}
                    onPress={() => handleReply(review)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="chatbubble-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.replyButtonText}>Reply to Review</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyReviews}>
              <Ionicons name="chatbubbles-outline" size={48} color="#CCC" />
              <Text style={styles.emptyReviewsText}>No reviews in this filter</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Reply Modal */}
      <Modal
        visible={showReplyModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowReplyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.replyModal}>
            <View style={styles.replyModalHeader}>
              <Text style={styles.replyModalTitle}>Reply to Review</Text>
              <TouchableOpacity onPress={() => setShowReplyModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedReview && (
              <View style={styles.reviewPreview}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewName}>{selectedReview.customerName}</Text>
                  <View style={styles.previewRating}>
                    {[...Array(selectedReview.rating)].map((_, i) => (
                      <Ionicons key={i} name="star" size={12} color="#FFB800" />
                    ))}
                  </View>
                </View>
                <Text style={styles.previewComment} numberOfLines={2}>
                  {selectedReview.comment}
                </Text>
              </View>
            )}

            <Text style={styles.replyLabel}>Your Response</Text>
            <TextInput
              style={styles.replyInput}
              placeholder="Write a professional and friendly response..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={6}
              value={replyText}
              onChangeText={setReplyText}
              textAlignVertical="top"
            />

            <View style={styles.replyTips}>
              <Ionicons name="bulb-outline" size={16} color="#FF9800" />
              <Text style={styles.replyTipsText}>
                Tip: Thank the customer and address any concerns professionally
              </Text>
            </View>

            <View style={styles.replyModalActions}>
              <TouchableOpacity
                style={styles.replyCancelButton}
                onPress={() => setShowReplyModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.replyCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.replySubmitButton}
                onPress={submitReply}
                activeOpacity={0.8}
              >
                <Text style={styles.replySubmitText}>Post Reply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
  },
  // Hero Card
  heroCard: {
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  heroRating: {
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingNumber: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFF',
    lineHeight: 64,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  heroSubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 24,
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  // Section
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  reviewCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
  },
  // Distribution Card
  distributionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  distributionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 40,
  },
  distributionRating: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212121',
  },
  distributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  distributionBarFill: {
    height: '100%',
    backgroundColor: '#FFB800',
    borderRadius: 4,
  },
  distributionCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#757575',
    width: 30,
    textAlign: 'right',
  },
  // Filter
  filterContainer: {
    marginTop: 16,
    paddingLeft: 16,
  },
  filterScroll: {
    paddingRight: 16,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
  },
  filterTextActive: {
    color: '#FFF',
  },
  filterBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  // Review Card
  reviewCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212121',
  },
  serviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  serviceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  reviewComment: {
    fontSize: 14,
    fontWeight: '500',
    color: '#616161',
    lineHeight: 20,
    marginBottom: 12,
  },
  // Response
  responseCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  responseLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  responseDate: {
    fontSize: 11,
    fontWeight: '500',
    color: '#999',
  },
  responseText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#616161',
    lineHeight: 18,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
  },
  replyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  // Empty
  emptyReviews: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyReviewsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
    marginTop: 16,
  },
  // Reply Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  replyModal: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  replyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  replyModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
  },
  reviewPreview: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212121',
  },
  previewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  previewComment: {
    fontSize: 13,
    fontWeight: '500',
    color: '#616161',
    lineHeight: 18,
  },
  replyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  replyInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
    minHeight: 120,
    marginBottom: 12,
  },
  replyTips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  replyTipsText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#F57C00',
  },
  replyModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  replyCancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  replyCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#757575',
  },
  replySubmitButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  replySubmitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});
