import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow, parseISO } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '@/shared/constants';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { 
  getPartnerReviews, 
  getReviewStats, 
  postReviewResponse,
  type PartnerReview 
} from '@mari-gunting/shared/services/reviewsService';

type TabType = 'all' | 'pending' | 'replied';

export default function ReviewsScreen() {
  const currentUser = useStore((state) => state.currentUser);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<PartnerReview[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedReview, setSelectedReview] = useState<PartnerReview | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [accountType, setAccountType] = useState<'freelance' | 'barbershop'>('freelance');
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const scrollRef = useRef<FlatList>(null);

  useEffect(() => {
    loadAccountType();
  }, []);

  useEffect(() => {
    if (accountType) {
      loadReviews();
    }
  }, [currentUser?.id, accountType]);

  const loadAccountType = async () => {
    try {
      const type = await AsyncStorage.getItem('partnerAccountType');
      setAccountType((type === 'freelance' || type === 'barbershop') ? type : 'freelance');
    } catch (error) {
      setAccountType('freelance');
    }
  };

  const loadReviews = async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getPartnerReviews(currentUser.id, accountType);
      setReviews(data);
    } catch (error: any) {
      console.error('[Reviews] Error loading reviews:', error.message);
      Alert.alert('Error', error.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => getReviewStats(reviews), [reviews]);

  const allFilteredReviews = useMemo(() => {
    let filtered = reviews;

    // Tab filter
    if (activeTab === 'pending') {
      filtered = filtered.filter(r => !r.response);
    } else if (activeTab === 'replied') {
      filtered = filtered.filter(r => r.response);
    }

    // Rating filter
    if (ratingFilter !== null) {
      filtered = filtered.filter(r => r.rating === ratingFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.customerName.toLowerCase().includes(query) ||
        r.comment.toLowerCase().includes(query) ||
        r.service.toLowerCase().includes(query)
      );
    }

    // Sort: pending low ratings first, then by date
    return filtered.sort((a, b) => {
      const aUrgent = !a.response && a.rating <= 3;
      const bUrgent = !b.response && b.rating <= 3;
      if (aUrgent && !bUrgent) return -1;
      if (!aUrgent && bUrgent) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [reviews, activeTab, searchQuery, ratingFilter]);

  const totalPages = Math.ceil(allFilteredReviews.length / ITEMS_PER_PAGE);
  
  const filteredReviews = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return allFilteredReviews.slice(startIndex, endIndex);
  }, [allFilteredReviews, page]);

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await loadReviews();
    setRefreshing(false);
  };

  const goToPage = (pageNum: number) => {
    setPage(pageNum);
    scrollRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery, ratingFilter]);

  const handleReply = (review: PartnerReview) => {
    setSelectedReview(review);
    setReplyText('');
    setShowReplyModal(true);
  };

  const submitReply = async () => {
    if (!replyText.trim() || !selectedReview) {
      Alert.alert('Error', 'Please enter a reply');
      return;
    }

    try {
      setSubmitting(true);
      await postReviewResponse(selectedReview.id, replyText.trim());
      
      // Update local state
      setReviews(prevReviews =>
        prevReviews.map(r =>
          r.id === selectedReview.id
            ? { ...r, response: { text: replyText.trim(), date: new Date().toISOString() } }
            : r
        )
      );

      // Close modal and reset state
      setShowReplyModal(false);
      setSelectedReview(null);
      setReplyText('');
      
      // Switch to "All" tab to see the reply
      if (activeTab === 'pending') {
        setActiveTab('all');
      }
      
      Alert.alert('Success', 'Reply posted! ✓');
    } catch (error) {
      Alert.alert('Error', 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="star-outline" size={64} color="#CCC" />
          <Text style={styles.emptyText}>Please log in</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" />
        {/* Skeleton Loading */}
        <View style={styles.header}>
          <View style={styles.skeleton} />
          <View style={[styles.skeleton, { width: 60, height: 24 }]} />
        </View>
        <View style={styles.statsBar}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[styles.statItem, { opacity: 0.3 }]}>
              <View style={[styles.skeleton, { width: 40, height: 24, marginBottom: 4 }]} />
              <View style={[styles.skeleton, { width: 50, height: 16 }]} />
            </View>
          ))}
        </View>
        <View style={styles.tabs}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[styles.skeleton, { width: 60, height: 20, marginRight: 24 }]} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  const pendingCount = reviews.filter(r => !r.response).length;
  const lastMonth = reviews.filter(r => {
    const date = new Date(r.date);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return date >= monthAgo;
  }).length;
  const twoMonthsAgo = reviews.filter(r => {
    const date = new Date(r.date);
    const twoMonths = new Date();
    twoMonths.setMonth(twoMonths.getMonth() - 2);
    const oneMonth = new Date();
    oneMonth.setMonth(oneMonth.getMonth() - 1);
    return date >= twoMonths && date < oneMonth;
  }).length;
  const trend = twoMonthsAgo === 0 ? 0 : ((lastMonth - twoMonthsAgo) / twoMonthsAgo) * 100;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reviews</Text>
        <View style={styles.headerRight}>
          <Text style={styles.ratingText}>{stats.avgRating.toFixed(1)}</Text>
          <Ionicons name="star" size={16} color="#FFB800" />
        </View>
      </View>

      {/* Stats Bar with Trend */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <View style={styles.statWithTrend}>
            <Text style={styles.statValue}>{stats.total}</Text>
            {trend !== 0 && (
              <View style={[styles.trendBadge, trend > 0 && styles.trendUp, trend < 0 && styles.trendDown]}>
                <Ionicons 
                  name={trend > 0 ? "trending-up" : "trending-down"} 
                  size={10} 
                  color={trend > 0 ? "#00C853" : "#FF3B30"} 
                />
                <Text style={[styles.trendText, { color: trend > 0 ? "#00C853" : "#FF3B30" }]}>
                  {Math.abs(Math.round(trend))}%
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.responseRate.toFixed(0)}%</Text>
          <Text style={styles.statLabel}>Response</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, pendingCount > 0 && { color: '#FF3B30' }]}>
            {pendingCount}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Tabs with Filter Button */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'all' && styles.tabActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
              Pending {pendingCount > 0 && `(${pendingCount})`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'replied' && styles.tabActive]}
            onPress={() => setActiveTab('replied')}
          >
            <Text style={[styles.tabText, activeTab === 'replied' && styles.tabTextActive]}>
              Replied
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="options-outline" size={20} color={ratingFilter !== null ? COLORS.primary : '#666'} />
          {ratingFilter !== null && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search reviews..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Reviews List */}
      <FlatList
        ref={scrollRef}
        data={filteredReviews}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyCircle}>
              <Ionicons name="chatbubbles-outline" size={48} color="#CCC" />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No matching reviews' : activeTab === 'pending' ? 'All caught up!' : 'No reviews yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try different search terms' : activeTab === 'pending' ? 'You\'ve replied to all reviews' : 'Reviews will appear here'}
            </Text>
          </View>
        }
        renderItem={({ item: review }) => {
          const isUrgent = !review.response && review.rating <= 3;
          const timeAgo = formatDistanceToNow(parseISO(review.date), { addSuffix: true });
          
          return (
            <Pressable 
              style={[styles.card, isUrgent && styles.cardUrgent]}
              onPress={() => !review.response && handleReply(review)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.customerInfo}>
                  <View style={styles.avatar}>
                    {review.customerAvatarUrl ? (
                      <Image 
                        source={{ uri: review.customerAvatarUrl }} 
                        style={styles.avatarImage}
                      />
                    ) : (
                      <Text style={styles.avatarText}>{review.customerAvatar}</Text>
                    )}
                  </View>
                  <View style={styles.customerDetails}>
                    <Text style={styles.customerName}>{review.customerName}</Text>
                    <Text style={styles.timeText}>{timeAgo}</Text>
                  </View>
                </View>
                <View style={[
                  styles.ratingBadge,
                  review.rating >= 4 && styles.ratingGood,
                  review.rating === 3 && styles.ratingNeutral,
                  review.rating <= 2 && styles.ratingPoor,
                ]}>
                  <Ionicons 
                    name="star" 
                    size={12} 
                    color={review.rating >= 4 ? '#00C853' : review.rating === 3 ? '#FFB800' : '#FF3B30'} 
                  />
                  <Text style={styles.ratingText}>{review.rating.toFixed(1)}</Text>
                </View>
              </View>

              <Text style={styles.serviceText}>{review.service}</Text>
              <Text style={styles.commentText}>{review.comment}</Text>

              {review.response ? (
                <View style={styles.responseContainer}>
                  <View style={styles.responseBadge}>
                    <Ionicons name="checkmark-circle" size={12} color="#00C853" />
                    <Text style={styles.responseBadgeText}>Replied</Text>
                    <Text style={styles.responseTime}>
                      • {formatDistanceToNow(parseISO(review.response.date), { addSuffix: true })}
                    </Text>
                  </View>
                  <Text style={styles.responseContent}>{review.response.text}</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.replyButton, isUrgent && styles.replyButtonUrgent]}
                  onPress={() => handleReply(review)}
                >
                  <Text style={styles.replyButtonText}>
                    {isUrgent ? 'Reply Now' : 'Reply'}
                  </Text>
                </TouchableOpacity>
              )}
            </Pressable>
          );
        }}
        contentContainerStyle={styles.listContent}
      />

      {/* Pagination at Bottom */}
      {totalPages > 1 && (
        <View style={styles.paginationBottom}>
          <View style={styles.pageInfo}>
            <Text style={styles.pageInfoText}>
              Showing {((page - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(page * ITEMS_PER_PAGE, allFilteredReviews.length)} of {allFilteredReviews.length}
            </Text>
          </View>
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]}
              onPress={() => page > 1 && goToPage(page - 1)}
              disabled={page === 1}
            >
              <Ionicons name="chevron-back" size={20} color={page === 1 ? '#CCC' : COLORS.primary} />
            </TouchableOpacity>

            <View style={styles.pageNumbers}>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <TouchableOpacity
                    key={pageNum}
                    style={[styles.pageNumber, page === pageNum && styles.pageNumberActive]}
                    onPress={() => goToPage(pageNum)}
                  >
                    <Text style={[styles.pageNumberText, page === pageNum && styles.pageNumberTextActive]}>
                      {pageNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.pageButton, page === totalPages && styles.pageButtonDisabled]}
              onPress={() => page < totalPages && goToPage(page + 1)}
              disabled={page === totalPages}
            >
              <Ionicons name="chevron-forward" size={20} color={page === totalPages ? '#CCC' : COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Reply Modal */}
      <Modal visible={showReplyModal} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowReplyModal(false)}>
            <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Reply to Review</Text>
                <TouchableOpacity onPress={() => setShowReplyModal(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              {selectedReview && (
                <View style={styles.reviewPreview}>
                  <Text style={styles.previewName}>{selectedReview.customerName}</Text>
                  <Text style={styles.previewComment} numberOfLines={2}>
                    {selectedReview.comment}
                  </Text>
                </View>
              )}

              <TextInput
                style={styles.textArea}
                placeholder="Write your response..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={6}
                value={replyText}
                onChangeText={setReplyText}
                textAlignVertical="top"
              />

              {/* Quick Reply Templates */}
              <Text style={styles.quickReplyLabel}>Quick replies:</Text>
              <View style={styles.quickReplies}>
                {[
                  'Thank you for your feedback!',
                  'We appreciate your business!',
                  'Sorry for any inconvenience.',
                ].map((template) => (
                  <TouchableOpacity
                    key={template}
                    style={styles.quickReplyChip}
                    onPress={() => setReplyText(template)}
                  >
                    <Text style={styles.quickReplyText}>{template}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowReplyModal(false)}
                  disabled={submitting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, submitting && { opacity: 0.6 }]}
                  onPress={submitReply}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Send</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Filter Modal */}
      <Modal visible={showFilterModal} animationType="fade" transparent>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowFilterModal(false)}>
          <Pressable style={styles.filterModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Rating</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[styles.filterOption, ratingFilter === null && styles.filterOptionActive]}
                onPress={() => {
                  setRatingFilter(null);
                  setShowFilterModal(false);
                }}
              >
                <Ionicons 
                  name={ratingFilter === null ? "radio-button-on" : "radio-button-off"} 
                  size={24} 
                  color={ratingFilter === null ? COLORS.primary : '#CCC'} 
                />
                <Text style={[styles.filterOptionText, ratingFilter === null && styles.filterOptionTextActive]}>
                  All Ratings
                </Text>
              </TouchableOpacity>

              {[5, 4, 3, 2, 1].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[styles.filterOption, ratingFilter === rating && styles.filterOptionActive]}
                  onPress={() => {
                    setRatingFilter(rating);
                    setShowFilterModal(false);
                  }}
                >
                  <Ionicons 
                    name={ratingFilter === rating ? "radio-button-on" : "radio-button-off"} 
                    size={24} 
                    color={ratingFilter === rating ? COLORS.primary : '#CCC'} 
                  />
                  <View style={styles.filterStars}>
                    {Array.from({ length: rating }, (_, i) => (
                      <Ionicons key={i} name="star" size={16} color="#FFB800" />
                    ))}
                  </View>
                  <Text style={[styles.filterOptionText, ratingFilter === rating && styles.filterOptionTextActive]}>
                    ({rating} {rating === 1 ? 'star' : 'stars'})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={() => {
                setRatingFilter(null);
                setShowFilterModal(false);
              }}
            >
              <Text style={styles.clearFilterText}>Clear Filter</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: '#999',
  },
  // SKELETON
  skeleton: {
    width: 100,
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  // STATS BAR
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statWithTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trendUp: {
    backgroundColor: '#E8F5E9',
  },
  trendDown: {
    backgroundColor: '#FFEBEE',
  },
  trendText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E0E0E0',
  },
  // TABS
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tabs: {
    flexDirection: 'row',
    flex: 1,
  },
  tab: {
    marginRight: 24,
    paddingBottom: 12,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  filterButton: {
    paddingHorizontal: 8,
    paddingBottom: 10,
    position: 'relative',
  },
  filterDot: {
    position: 'absolute',
    top: 0,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  // SEARCH
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#000',
  },
  resultsCount: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  resultsCountText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  // LIST
  listContent: {
    padding: 20,
  },
  // PAGINATION
  paginationBottom: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingVertical: 8,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF',
  },
  pageButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: '#F8F8F8',
  },
  pageButtonDisabled: {
    opacity: 0.3,
  },
  pageNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 12,
  },
  pageNumber: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: '#F8F8F8',
  },
  pageNumberActive: {
    backgroundColor: COLORS.primary,
  },
  pageNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  pageNumberTextActive: {
    color: '#FFF',
  },
  pageInfo: {
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: '#FFF',
  },
  pageInfoText: {
    fontSize: 12,
    color: '#999',
  },
  // CARD
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  cardUrgent: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  cardHeader: {
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
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingGood: {
    backgroundColor: '#E8F5E9',
  },
  ratingNeutral: {
    backgroundColor: '#FFF8E1',
  },
  ratingPoor: {
    backgroundColor: '#FFEBEE',
  },
  serviceText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  response: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  responseText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00C853',
  },
  responseContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  responseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  responseBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00C853',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  responseTime: {
    fontSize: 11,
    color: '#999',
    marginLeft: 4,
  },
  responseContent: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  replyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  replyButtonUrgent: {
    backgroundColor: '#FF3B30',
  },
  replyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  // MODAL
  modalOverlay: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  reviewPreview: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  previewName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  previewComment: {
    fontSize: 13,
    color: '#666',
  },
  textArea: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 120,
    marginBottom: 12,
  },
  quickReplyLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  quickReplies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  quickReplyChip: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  quickReplyText: {
    fontSize: 13,
    color: '#666',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  // FILTER MODAL
  filterModal: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  filterOptions: {
    gap: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F8F8F8',
    gap: 12,
  },
  filterOptionActive: {
    backgroundColor: '#E8F5E9',
  },
  filterOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  filterOptionTextActive: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  filterStars: {
    flexDirection: 'row',
    gap: 2,
  },
  clearFilterButton: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  clearFilterText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
});
