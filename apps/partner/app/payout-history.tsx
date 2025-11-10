import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { payoutService, PayoutRequest } from '@mari-gunting/shared/services/payoutService';
import { supabase } from '@mari-gunting/shared/config/supabase';
import { format } from 'date-fns';
import { COLORS } from '@/shared/constants';
import { Colors, theme } from '@mari-gunting/shared/theme';

export default function PayoutHistoryScreen() {
  const currentUser = useStore((state) => state.currentUser);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch barber ID
  useEffect(() => {
    const fetchBarberId = async () => {
      if (!currentUser?.id) return;
      
      const { data, error } = await supabase
        .from('barbers')
        .select('id')
        .eq('user_id', currentUser.id)
        .single();
      
      if (error) {
        console.error('Error fetching barber ID:', error);
        return;
      }
      
      setBarberId(data.id);
    };
    
    fetchBarberId();
  }, [currentUser?.id]);

  // Fetch payout history
  const fetchPayouts = async () => {
    if (!barberId) return;

    try {
      const history = await payoutService.getPayoutHistory(barberId);
      setPayouts(history);
    } catch (error) {
      console.error('Error fetching payout history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (barberId) {
      fetchPayouts();
    }
  }, [barberId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPayouts();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return Colors.primary;
      case 'pending':
        return '#FF9800';
      case 'processing':
        return '#2196F3';
      case 'rejected':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'pending':
        return 'time-outline';
      case 'processing':
        return 'sync-outline';
      case 'rejected':
        return 'close-circle';
      default:
        return 'help-circle-outline';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payout History</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payout History</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {payouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={64} color="#BDBDBD" />
            <Text style={styles.emptyTitle}>No Payout History</Text>
            <Text style={styles.emptySubtitle}>
              Your payout requests will appear here
            </Text>
          </View>
        ) : (
          payouts.map((payout) => (
            <View key={payout.id} style={styles.payoutCard}>
              {/* Header */}
              <View style={styles.payoutCardHeader}>
                <View style={styles.payoutCardLeft}>
                  <View style={[styles.statusIcon, { backgroundColor: `${getStatusColor(payout.status)}15` }]}>
                    <Ionicons 
                      name={getStatusIcon(payout.status) as any} 
                      size={24} 
                      color={getStatusColor(payout.status)} 
                    />
                  </View>
                  <View>
                    <Text style={styles.payoutAmount}>RM {parseFloat(payout.amount.toString()).toFixed(2)}</Text>
                    <Text style={styles.payoutDate}>
                      {format(new Date(payout.requested_at), 'MMM dd, yyyy • hh:mm a')}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(payout.status)}15` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(payout.status) }]}>
                    {getStatusLabel(payout.status)}
                  </Text>
                </View>
              </View>

              {/* Bank Details */}
              <View style={styles.payoutDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="business-outline" size={16} color="#757575" />
                  <Text style={styles.detailLabel}>Bank:</Text>
                  <Text style={styles.detailValue}>{payout.bank_name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="card-outline" size={16} color="#757575" />
                  <Text style={styles.detailLabel}>Account:</Text>
                  <Text style={styles.detailValue}>
                    {payout.bank_account_name} (***{payout.bank_account_number?.slice(-4)})
                  </Text>
                </View>
              </View>

              {/* Status-specific info */}
              {payout.status === 'completed' && payout.processed_at && (
                <View style={styles.successInfo}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                  <Text style={styles.successInfoText}>
                    Completed on {format(new Date(payout.processed_at), 'MMM dd, yyyy')}
                  </Text>
                </View>
              )}

              {payout.status === 'rejected' && payout.rejection_reason && (
                <View style={styles.errorInfo}>
                  <Ionicons name="alert-circle" size={16} color="#F44336" />
                  <Text style={styles.errorInfoText}>{payout.rejection_reason}</Text>
                </View>
              )}

              {payout.status === 'pending' && (
                <View style={styles.pendingInfo}>
                  <Ionicons name="time-outline" size={16} color="#FF9800" />
                  <Text style={styles.pendingInfoText}>
                    We'll process this within 3-5 business days
                  </Text>
                </View>
              )}
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#757575',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
    marginTop: 8,
    textAlign: 'center',
  },
  payoutCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  payoutCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  payoutCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  payoutAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 4,
  },
  payoutDate: {
    fontSize: 13,
    fontWeight: '500',
    color: '#757575',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  payoutDetails: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#757575',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#212121',
    flex: 1,
  },
  successInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  successInfoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  errorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  errorInfoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#F44336',
  },
  pendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  pendingInfoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9800',
  },
});
