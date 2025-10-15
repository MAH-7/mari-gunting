import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet, Animated, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useStore } from '@/store/useStore';
import { rewardsService, type Voucher as DBVoucher, type UserVoucher, type PointsTransaction } from '@/services/rewardsService';



export default function RewardsScreen() {
  // User from store
  const currentUser = useStore((state) => state.currentUser);
  
  // Local state - Data
  const [userPoints, setUserPoints] = useState(0);
  const [availableVouchers, setAvailableVouchers] = useState<DBVoucher[]>([]);
  const [myVouchers, setMyVouchers] = useState<UserVoucher[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsTransaction[]>([]);
  
  // Local state - UI
  const [activeTab, setActiveTab] = useState<'vouchers' | 'myVouchers' | 'activity'>('vouchers');
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
      const [points, vouchers, userVouchers, history] = await Promise.all([
        rewardsService.getUserPoints(currentUser.id),
        rewardsService.getAvailableVouchers(),
        rewardsService.getUserVouchers(currentUser.id),
        rewardsService.getPointsHistory(currentUser.id),
      ]);
      
      setUserPoints(points);
      setAvailableVouchers(vouchers);
      setMyVouchers(userVouchers);
      setPointsHistory(history);
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
          
          <Text style={styles.voucherTitle}>{voucherTitle}</Text>
          <Text style={styles.voucherDescription}>{voucherDescription}</Text>
          
          <View style={styles.voucherFooter}>
            <View style={styles.pointsRow}>
              <Ionicons name="pricetag" size={14} color="#00B14F" />
              <Text style={styles.pointsText}>{voucherPoints} points</Text>
            </View>
            <Text style={[styles.expiryText, expiringSoon && styles.expiryTextWarning]}>Exp: {voucherExpiry}</Text>
          </View>
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
                size={28}
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
      {/* Points Card */}
      <LinearGradient
        colors={['#00B14F', '#00A043']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1}}
        style={styles.pointsCard}
      >
        <View style={styles.pointsHeader}>
          <Text style={styles.pointsLabel}>Your Points</Text>
          <View style={styles.memberBadge}>
            <Text style={styles.memberText}>Gold Member</Text>
          </View>
        </View>
        
        <View style={styles.pointsValueRow}>
          <Text style={styles.pointsValue}>{userPoints}</Text>
          <Text style={styles.pointsUnit}>pts</Text>
        </View>

        <View style={styles.pointsFooter}>
          <View style={styles.pointsInfo}>
            <Ionicons name="information-circle-outline" size={16} color="white" />
            <Text style={styles.pointsInfoText}>Earn points with every booking</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </TouchableOpacity>
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
          onPress={() => setActiveTab('activity')}
          style={[styles.tab, activeTab === 'activity' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'activity' && styles.tabTextActive]}>
            Activity
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#00B14F"
            colors={['#00B14F']}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00B14F" />
            <Text style={styles.loadingText}>Loading rewards...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'vouchers' && (
              <View style={styles.contentSection}>
                {availableForRedemption.length > 0 ? (
                  availableForRedemption.map(voucher => renderVoucherCard(voucher, false))
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="gift-outline" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyTitle}>All Vouchers Redeemed!</Text>
                    <Text style={styles.emptyText}>Check back later for new rewards</Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === 'myVouchers' && (
          <View style={styles.contentSection}>
            {myVouchers.length > 0 ? (
              myVouchers.map(voucher => renderVoucherCard(voucher, true))
            ) : (
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
            )}
          </View>
            )}

            {activeTab === 'activity' && (
          <View style={styles.contentSection}>
            {pointsHistory.length > 0 ? (
              pointsHistory.map((transaction) => (
                <View key={transaction.id} style={styles.activityCard}>
                  <View style={[styles.activityIcon, transaction.type === 'earn' ? styles.activityIconEarn : styles.activityIconRedeem]}>
                    <Ionicons
                      name={transaction.type === 'earn' ? 'add-circle' : 'remove-circle'}
                      size={24}
                      color={transaction.type === 'earn' ? '#00B14F' : '#EF4444'}
                    />
                  </View>

                  <View style={styles.activityDetails}>
                    <Text style={styles.activityDescription}>{transaction.description}</Text>
                    <Text style={styles.activityDate}>{new Date(transaction.created_at).toLocaleDateString()}</Text>
                  </View>

                  <Text style={[styles.activityAmount, transaction.type === 'earn' ? styles.activityAmountEarn : styles.activityAmountRedeem]}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="list-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No Activity Yet</Text>
                <Text style={styles.emptyText}>Start earning and redeeming to see your activity</Text>
              </View>
            )}
          </View>
            )}
          </>
        )}
      </ScrollView>

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
              <Ionicons name="checkmark-circle" size={64} color="#00B14F" />
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
            <ActivityIndicator size="large" color="#00B14F" />
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
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  pointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pointsLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  memberBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberText: {
    color: '#FFFFFF',
    fontSize: 14,
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
    backgroundColor: '#00B14F',
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
    color: '#00B14F',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  contentSection: {
    gap: 12,
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
    padding: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
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
  voucherTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  voucherDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#00B14F',
  },
  expiryText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  expiryTextWarning: {
    color: '#EF4444',
    fontWeight: '600',
  },
  voucherRight: {
    width: 96,
    backgroundColor: '#00B14F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherRightActive: {
    backgroundColor: '#00B14F',
  },
  voucherRightUsed: {
    backgroundColor: '#6B7280',
  },
  redeemButton: {
    alignItems: 'center',
  },
  redeemText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  redeemTextLocked: {
    color: 'rgba(255,255,255,0.5)',
  },
  usedLabel: {
    alignItems: 'center',
  },
  usedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  availableLabel: {
    alignItems: 'center',
  },
  availableText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
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
    backgroundColor: '#00B14F',
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
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIconEarn: {
    backgroundColor: '#D1FAE5',
  },
  activityIconRedeem: {
    backgroundColor: '#FEE2E2',
  },
  activityDetails: {
    flex: 1,
    marginLeft: 12,
  },
  activityDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  activityAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  activityAmountEarn: {
    color: '#00B14F',
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
    backgroundColor: '#00B14F',
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
    backgroundColor: '#00B14F',
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
});
