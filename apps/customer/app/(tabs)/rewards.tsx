import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Animated, Alert, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { rewardsService, type Voucher as DBVoucher, type UserVoucher, type PointsTransaction, type CreditTransaction } from '@/services/rewardsService';



export default function RewardsScreen() {
  // User from store
  const currentUser = useStore((state) => state.currentUser);
  
  // Local state - Data
  const [userPoints, setUserPoints] = useState(0);
  const [userCredits, setUserCredits] = useState(0);
  const [availableVouchers, setAvailableVouchers] = useState<DBVoucher[]>([]);
  const [myVouchers, setMyVouchers] = useState<UserVoucher[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsTransaction[]>([]);
  const [creditsHistory, setCreditsHistory] = useState<CreditTransaction[]>([]);
  
  // Local state - UI
  const [activeTab, setActiveTab] = useState<'vouchers' | 'myVouchers' | 'history'>('vouchers');
  const [historyFilter, setHistoryFilter] = useState<'points' | 'credits'>('points');
  const [selectedVoucher, setSelectedVoucher] = useState<DBVoucher | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  // Load data on mount
  useEffect(() => {
    if (currentUser?.id) {
      loadRewardsData();
    }
  }, [currentUser?.id]);

  const loadRewardsData = async () => {
    if (!currentUser?.id) return;
    
    try {
      setIsLoading(true);
      
      // Load all data in parallel
      const [points, credits, vouchers, userVouchers, history, creditHistory] = await Promise.all([
        rewardsService.getUserPoints(currentUser.id),
        rewardsService.getUserCredits(currentUser.id),
        rewardsService.getAvailableVouchers(),
        rewardsService.getUserVouchers(currentUser.id),
        rewardsService.getPointsHistory(currentUser.id),
        rewardsService.getCreditTransactions(currentUser.id),
      ]);
      
      setUserPoints(points);
      setUserCredits(credits);
      setAvailableVouchers(vouchers);
      setMyVouchers(userVouchers);
      setPointsHistory(history);
      setCreditsHistory(creditHistory);
    } catch (error) {
      console.error('[RewardsScreen] Error loading data:', error);
      Alert.alert('Error', 'Failed to load rewards data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadRewardsData();
    setIsRefreshing(false);
  };

  const handleRedeemPress = (voucher: DBVoucher) => {
    if (userPoints < voucher.points_cost) {
      Alert.alert(
        'Insufficient Points',
        `You need ${voucher.points_cost - userPoints} more points to redeem this voucher.\n\nKeep booking to earn more points!`,
        [{ text: 'OK' }]
      );
      return;
    }
    setSelectedVoucher(voucher);
    setShowConfirmModal(true);
  };

  const handleConfirmRedeem = async () => {
    if (!selectedVoucher || !currentUser?.id) return;
    
    setIsRedeeming(true);
    setShowConfirmModal(false);
    
    try {
      // Redeem voucher via API
      await rewardsService.redeemVoucher(currentUser.id, selectedVoucher.id);
      
      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Reload data to get updated points and vouchers
      await loadRewardsData();
      
      // Show success modal
      setShowSuccessModal(true);
      setIsRedeeming(false);
      
      // Success animation
      Animated.parallel([
        Animated.spring(successScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Auto dismiss after 2.5 seconds
      setTimeout(() => {
        handleCloseSuccess();
      }, 2500);
    } catch (error: any) {
      setIsRedeeming(false);
      console.error('[RewardsScreen] Redeem error:', error);
      Alert.alert('Redemption Failed', error.message || 'Failed to redeem voucher. Please try again.');
    }
  };

  const handleCloseSuccess = () => {
    Animated.parallel([
      Animated.timing(successScale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(successOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccessModal(false);
      successScale.setValue(0);
      successOpacity.setValue(0);
    });
  };

  const redeemedVoucherIds = myVouchers.map(v => v.voucher_id);
  const availableForRedemption = availableVouchers.filter(v => 
    !redeemedVoucherIds.includes(v.id) && !rewardsService.isExpired(v.valid_until)
  );
  
  // Filter my vouchers to show only non-expired ones
  const activeMyVouchers = myVouchers.filter(v => !rewardsService.isExpired(v.voucher.valid_until));

  const renderVoucherCard = (voucher: DBVoucher | UserVoucher, isRedeemed: boolean = false) => {
    // Handle both DBVoucher and UserVoucher types
    const voucherData = 'voucher' in voucher ? voucher.voucher : voucher;
    const daysLeft = rewardsService.getDaysUntilExpiry(voucherData.valid_until);
    const expiringSoon = rewardsService.isExpiringSoon(voucherData.valid_until);
    const isUsed = 'status' in voucher && voucher.status === 'used';
    const voucherId = 'voucher' in voucher ? voucher.id : voucher.id;
    const voucherType = voucherData.type;
    const voucherTitle = voucherData.title;
    const voucherDescription = voucherData.description;
    const voucherPoints = voucherData.points_cost;
    const voucherExpiry = rewardsService.formatExpiryDate(voucherData.valid_until);
    
    // Extract discount value for hero display - from voucher.value
    const discountValue = voucherType === 'percentage' 
      ? `${voucherData.value}% OFF` 
      : `RM${voucherData.value} OFF`;
    
    return (
      <View
        key={voucherId}
        style={[styles.voucherCard, (isRedeemed || isUsed) && styles.voucherCardUsed]}
      >
        <View style={styles.voucherLeft}>
          <View style={styles.badgesRow}>
            <View style={[styles.typeBadge, voucherType === 'percentage' ? styles.typeBadgeOrange : styles.typeBadgeBlue]}>
              <Text style={[styles.typeBadgeText, voucherType === 'percentage' ? styles.typeBadgeTextOrange : styles.typeBadgeTextBlue]}>
                {voucherType === 'percentage' ? 'DISCOUNT' : 'FIXED'}
              </Text>
            </View>
            
            {/* Expiry warning badge */}
            {expiringSoon && (
              <View style={styles.expiryWarningBadge}>
                <Ionicons name="time" size={10} color="#EF4444" />
                <Text style={styles.expiryWarningText}>{daysLeft}d left</Text>
              </View>
            )}
          </View>
          
          {/* Hero: Discount Value (24-26px) */}
          <Text style={styles.voucherHero}>{discountValue}</Text>
          
          {/* Secondary info */}
          <Text style={styles.voucherDescription}>{voucherDescription}</Text>
          
          <View style={styles.voucherFooter}>
            <View style={styles.pointsRow}>
              <Ionicons name="pricetag" size={16} color="#7E3AF2" />
              <Text style={styles.pointsText}>{voucherPoints} pts</Text>
            </View>
            <Text style={[styles.expiryText, expiringSoon && styles.expiryTextWarning]}>Exp: {voucherExpiry}</Text>
          </View>
        </View>
        
        {/* Vertical Dotted Separator - Cross-platform */}
        <View style={styles.voucherSeparatorContainer}>
          {[...Array(8)].map((_, i) => (
            <View key={i} style={styles.voucherSeparatorDot} />
          ))}
        </View>

        <View style={[styles.voucherRight, isUsed ? styles.voucherRightUsed : isRedeemed ? styles.voucherRightActive : {}]}>
          {isUsed ? (
            <View style={styles.usedLabel}>
              <Ionicons name="checkmark-done" size={24} color="#FFFFFF" />
              <Text style={styles.usedText}>Used</Text>
            </View>
          ) : isRedeemed ? (
            <View style={styles.availableLabel}>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.availableText}>Available</Text>
            </View>
          ) : (
            <TouchableOpacity
              disabled={userPoints < voucherPoints}
              onPress={() => 'voucher' in voucher ? undefined : handleRedeemPress(voucher)}
              style={styles.redeemButton}
            >
              <Ionicons
                name="gift"
                size={26}
                color={userPoints < voucherPoints ? '#FFFFFF80' : '#FFFFFF'}
              />
              <Text style={[styles.redeemText, userPoints < voucherPoints && styles.redeemTextLocked]}>
                {userPoints < voucherPoints ? 'Locked' : 'Redeem'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Rewards Card - Points & Credits */}
      <LinearGradient
        colors={['#7E3AF2', '#6C2BD9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1}}
        style={styles.pointsCard}
      >
        <View style={styles.pointsHeader}>
          <Text style={styles.pointsLabel}>Your Rewards</Text>
          <View style={styles.memberBadge}>
            <Text style={styles.memberText}>Gold Member</Text>
          </View>
        </View>
        
        {/* Stacked Layout - Points Section (Secondary) */}
        <View style={styles.pointsSection}>
          <View style={styles.sectionRow}>
            <Ionicons name="pricetag" size={18} color="rgba(255,255,255,0.8)" />
            <Text style={styles.smallLabel}>Points Balance</Text>
          </View>
          <View style={styles.valueRow}>
            <Text style={styles.mediumValue}>{userPoints}</Text>
            <Text style={styles.mediumUnit}>pts</Text>
          </View>
        </View>

        {/* Horizontal Divider */}
        <View style={styles.horizontalDivider} />
        
        {/* Credits Section (Primary - More Prominent) */}
        <View style={styles.creditsSection}>
          <View style={styles.sectionRow}>
            <Ionicons name="wallet" size={20} color="#FFFFFF" />
            <Text style={styles.largeLabel}>Mari Credits</Text>
          </View>
          <Text style={styles.largeValue}>{rewardsService.formatCreditAmount(userCredits)}</Text>
          <Text style={styles.subtitle}>Use at checkout to pay for bookings</Text>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('vouchers')}
          style={[styles.tab, activeTab === 'vouchers' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'vouchers' && styles.tabTextActive]}>
            Vouchers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('myVouchers')}
          style={[styles.tab, activeTab === 'myVouchers' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'myVouchers' && styles.tabTextActive]}>
            My Vouchers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('history')}
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7E3AF2" />
          <Text style={styles.loadingText}>Loading rewards...</Text>
        </View>
      ) : (
        <>
          {activeTab === 'vouchers' && (
            <FlatList
              data={availableForRedemption}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => renderVoucherCard(item, false)}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor="#7E3AF2"
                  colors={['#7E3AF2']}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="gift-outline" size={64} color="#D1D5DB" />
                  <Text style={styles.emptyTitle}>All Vouchers Redeemed!</Text>
                  <Text style={styles.emptyText}>Check back later for new rewards</Text>
                </View>
              }
            />
          )}

          {activeTab === 'myVouchers' && (
            <FlatList
              data={myVouchers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => renderVoucherCard(item, true)}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor="#7E3AF2"
                  colors={['#7E3AF2']}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="ticket-outline" size={64} color="#D1D5DB" />
                  <Text style={styles.emptyTitle}>No Vouchers Yet</Text>
                  <Text style={styles.emptyText}>Redeem vouchers to see them here</Text>
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() => setActiveTab('vouchers')}
                  >
                    <Text style={styles.emptyButtonText}>Browse Vouchers</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          )}

          {activeTab === 'history' && (
            <FlatList
              data={historyFilter === 'points' ? pointsHistory : creditsHistory}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const transaction = item as PointsTransaction | CreditTransaction;
                const isPointsTransaction = 'type' in transaction && (transaction.type === 'earn' || transaction.type === 'spend');
                const isAddition = isPointsTransaction 
                  ? (transaction as PointsTransaction).type === 'earn'
                  : (transaction as CreditTransaction).type === 'add';
                
                return (
                  <View style={styles.activityCard}>
                    <View style={[styles.activityIcon, isAddition ? styles.activityIconEarn : styles.activityIconRedeem]}>
                      <Ionicons
                        name={isAddition ? 'add-circle' : 'remove-circle'}
                        size={22}
                        color={isAddition ? '#7E3AF2' : '#EF4444'}
                      />
                    </View>

                    <View style={styles.activityDetails}>
                      <Text style={styles.activityDescription}>{transaction.description}</Text>
                      <Text style={styles.activityDate}>{new Date(transaction.created_at).toLocaleDateString()}</Text>
                    </View>

                    <Text style={[styles.activityAmount, isAddition ? styles.activityAmountEarn : styles.activityAmountRedeem]}>
                      {isPointsTransaction 
                        ? `${transaction.amount > 0 ? '+' : ''}${transaction.amount} pts`
                        : `${isAddition ? '+' : '-'}${rewardsService.formatCreditAmount(transaction.amount)}`
                      }
                    </Text>
                  </View>
                );
              }}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor="#7E3AF2"
                  colors={['#7E3AF2']}
                />
              }
              ListHeaderComponent={
                <View style={styles.historyToggle}>
                  <TouchableOpacity
                    style={[styles.toggleButton, historyFilter === 'points' && styles.toggleButtonActive]}
                    onPress={() => setHistoryFilter('points')}
                  >
                <Ionicons 
                  name="pricetag" 
                  size={15} 
                  color={historyFilter === 'points' ? '#FFFFFF' : '#6B7280'} 
                />
                <Text style={[styles.toggleText, historyFilter === 'points' && styles.toggleTextActive]}>
                  Points
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, historyFilter === 'credits' && styles.toggleButtonActive]}
                onPress={() => setHistoryFilter('credits')}
              >
                <Ionicons 
                  name="wallet" 
                  size={15} 
                  color={historyFilter === 'credits' ? '#FFFFFF' : '#6B7280'} 
                />
                    <Text style={[styles.toggleText, historyFilter === 'credits' && styles.toggleTextActive]}>
                      Credits
                    </Text>
                  </TouchableOpacity>
                </View>
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons 
                    name={historyFilter === 'points' ? 'list-outline' : 'wallet-outline'} 
                    size={64} 
                    color="#D1D5DB" 
                  />
                  <Text style={styles.emptyTitle}>
                    {historyFilter === 'points' ? 'No Points Activity' : 'No Credits History'}
                  </Text>
                  <Text style={styles.emptyText}>
                    {historyFilter === 'points' 
                      ? 'Start earning points with every booking'
                      : 'Credits from refunds will appear here'
                    }
                  </Text>
                </View>
              }
            />
          )}
        </>
      )}

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Redeem Voucher?</Text>
            
            {selectedVoucher && (
              <>
                <View style={styles.modalVoucher}>
                  <Text style={styles.modalVoucherTitle}>{selectedVoucher.title}</Text>
                  <Text style={styles.modalVoucherDesc}>{selectedVoucher.description}</Text>
                </View>

                <View style={styles.modalPoints}>
                  <Ionicons name="pricetag" size={20} color="#F59E0B" />
                  <Text style={styles.modalPointsText}>{selectedVoucher.points_cost} points will be deducted</Text>
                </View>

                <View style={styles.modalWarning}>
                  <Ionicons name="alert-circle" size={16} color="#EF4444" />
                  <Text style={styles.modalWarningText}>This action cannot be undone</Text>
                </View>
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={handleConfirmRedeem}
              >
                <Text style={styles.modalButtonConfirmText}>Confirm Redeem</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="none"
      >
        <View style={styles.successOverlay}>
          <Animated.View
            style={[
              styles.successContent,
              {
                opacity: successOpacity,
                transform: [{ scale: successScale }],
              },
            ]}
          >
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={64} color="#7E3AF2" />
            </View>
            <Text style={styles.successTitle}>Voucher Redeemed!</Text>
            <Text style={styles.successText}>Check My Vouchers to use it</Text>
            
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => {
                handleCloseSuccess();
                setActiveTab('myVouchers');
              }}
            >
              <Text style={styles.successButtonText}>View My Vouchers</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Loading Overlay */}
      {isRedeeming && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#7E3AF2" />
            <Text style={styles.loadingText}>Redeeming voucher...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  pointsCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#7E3AF2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  pointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pointsLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  memberBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  memberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  pointsValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  pointsValue: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: 'bold',
  },
  pointsUnit: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 8,
    marginBottom: 8,
  },
  pointsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsInfoText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
  },
  tabActive: {
    backgroundColor: '#7E3AF2',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  badgeText: {
    color: '#7E3AF2',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  voucherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  voucherCardUsed: {
    opacity: 0.7,
  },
  voucherLeft: {
    flex: 1,
    padding: 12,
  },
  voucherHero: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 3,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  expiryWarningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  expiryWarningText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  typeBadgeOrange: {
    backgroundColor: '#FEF3C7',
  },
  typeBadgeBlue: {
    backgroundColor: '#DBEAFE',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  typeBadgeTextOrange: {
    color: '#D97706',
  },
  typeBadgeTextBlue: {
    color: '#2563EB',
  },
  voucherDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 17,
    marginBottom: 8,
  },
  voucherFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7E3AF2',
  },
  expiryText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  expiryTextWarning: {
    color: '#EF4444',
    fontWeight: '600',
  },
  voucherSeparatorContainer: {
    width: 2,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 8,
  },
  voucherSeparatorDot: {
    width: 2,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 1,
  },
  voucherRight: {
    width: 80,
    backgroundColor: '#7E3AF2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherRightActive: {
    backgroundColor: '#7E3AF2',
  },
  voucherRightUsed: {
    backgroundColor: '#6B7280',
  },
  redeemButton: {
    alignItems: 'center',
  },
  redeemText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 6,
  },
  redeemTextLocked: {
    color: 'rgba(255,255,255,0.5)',
  },
  usedLabel: {
    alignItems: 'center',
  },
  usedText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 6,
  },
  availableLabel: {
    alignItems: 'center',
  },
  availableText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 6,
  },
  emptyState: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyButton: {
    marginTop: 16,
    backgroundColor: '#7E3AF2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIconEarn: {
    backgroundColor: '#EDE9FE',
  },
  activityIconRedeem: {
    backgroundColor: '#FEE2E2',
  },
  activityDetails: {
    flex: 1,
    marginLeft: 10,
  },
  activityDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
    lineHeight: 18,
  },
  activityDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  activityAmountEarn: {
    color: '#7E3AF2',
  },
  activityAmountRedeem: {
    color: '#EF4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalVoucher: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalVoucherTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  modalVoucherDesc: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  modalPointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    flex: 1,
  },
  modalWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  modalWarningText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  modalButtonConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#7E3AF2',
    alignItems: 'center',
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  successButton: {
    backgroundColor: '#7E3AF2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  // Stacked card layout styles
  pointsSection: {
    marginBottom: 10,
  },
  creditsSection: {
    marginTop: 10,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  smallLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  largeLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  mediumValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  mediumUnit: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
    marginBottom: 2,
  },
  largeValue: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: 'bold',
    letterSpacing: -1,
    marginBottom: 3,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '500',
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 3,
  },
  // History toggle styles
  historyToggle: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
    gap: 3,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 7,
    gap: 5,
  },
  toggleButtonActive: {
    backgroundColor: '#7E3AF2',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  historyContent: {
    gap: 12,
  },
});
