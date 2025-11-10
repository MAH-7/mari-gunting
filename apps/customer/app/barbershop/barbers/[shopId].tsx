import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { formatCurrency } from '@mari-gunting/shared/utils/format';
import { ACTIVE_OPACITY } from '@/constants/animations';
import { Barber, BarbershopStaff } from '@/types';
import { SkeletonCircle, SkeletonText, SkeletonBase } from '@/components/Skeleton';
import { Colors, theme, getStatusBackground, getStatusColor } from '@mari-gunting/shared/theme';

export default function SelectBarberScreen() {
  const { shopId } = useLocalSearchParams<{ shopId: string }>();
  
  const { data: shopResponse, isLoading: shopLoading } = useQuery({
    queryKey: ['barbershop', shopId],
    queryFn: () => api.getBarbershopById(shopId),
  });

  const { data: barbersResponse, isLoading: barbersLoading } = useQuery({
    queryKey: ['barbershop-barbers', shopId],
    queryFn: () => api.getBarbersByShopId(shopId),
    enabled: !!shopId,
  });

  const shop = shopResponse?.data;
  const barbers = barbersResponse?.data || [];
  const isLoading = shopLoading || barbersLoading;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={ACTIVE_OPACITY.SECONDARY}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Barber</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Skeleton Section Header */}
          <View style={styles.sectionHeader}>
            <SkeletonText width="50%" height={20} style={{ marginBottom: 6 }} />
            <SkeletonText width="70%" height={14} />
          </View>

          {/* Skeleton Barber Cards */}
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.barberCard}>
              {/* Avatar & Info */}
              <View style={styles.barberHeader}>
                <View style={styles.avatarContainer}>
                  <SkeletonCircle size={64} />
                </View>
                <View style={styles.barberInfo}>
                  <SkeletonText width="60%" height={18} style={{ marginBottom: 8 }} />
                  <SkeletonText width="50%" height={14} style={{ marginBottom: 8 }} />
                  <SkeletonBase width={100} height={24} borderRadius={12} />
                </View>
              </View>

              {/* Specializations */}
              <View style={styles.specializationsContainer}>
                <SkeletonBase width={90} height={28} borderRadius={14} />
                <SkeletonBase width={100} height={28} borderRadius={14} />
                <SkeletonBase width={80} height={28} borderRadius={14} />
              </View>

              {/* Footer */}
              <View style={styles.barberFooter}>
                <View style={styles.priceContainer}>
                  <SkeletonText width={80} height={12} style={{ marginBottom: 4 }} />
                  <SkeletonText width={60} height={20} />
                </View>
                <SkeletonBase width={100} height={36} borderRadius={12} />
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!shop) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Barber</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.gray[300]} />
          <Text style={styles.emptyText}>Barbershop not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={ACTIVE_OPACITY.SECONDARY}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Your Barber</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Shop Info Banner */}
      <View style={styles.shopBanner}>
        <View style={styles.shopBannerLeft}>
          <Image source={{ uri: shop.image }} style={styles.shopLogo} />
          <View style={styles.shopBannerInfo}>
            <Text style={styles.shopBannerName}>{shop.name}</Text>
            <View style={styles.shopBannerMeta}>
              <Ionicons name="star" size={14} color="#FBBF24" />
              <Text style={styles.shopBannerRating}>{shop.rating.toFixed(1)}</Text>
              <View style={styles.shopBannerDot} />
              <Text style={styles.shopBannerText}>{barbers.length} barbers</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Shop Pricing Info */}
      <View style={styles.pricingBanner}>
        <View style={styles.pricingContent}>
          <Ionicons name="pricetag-outline" size={20} color={Colors.primary} />
          <View style={styles.pricingInfo}>
            <Text style={styles.pricingLabel}>Services starting from</Text>
            <Text style={styles.pricingValue}>
              {formatCurrency(Math.min(...shop.services.map((s: any) => s.price)))}
            </Text>
          </View>
        </View>
        <Text style={styles.pricingNote}>All staff offer same services at shop's prices</Text>
      </View>

      {/* Barbers List */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {barbers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={Colors.gray[300]} />
            <Text style={styles.emptyTitle}>No Barbers Available</Text>
            <Text style={styles.emptyText}>This barbershop doesn't have any barbers at the moment</Text>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Available Barbers</Text>
              <Text style={styles.sectionSubtitle}>Choose your preferred barber</Text>
            </View>

            {barbers.map((staff: BarbershopStaff) => {
              return (
                <View
                  key={staff.id}
                  style={styles.barberCard}
                >
                  {/* Staff Avatar & Info */}
                  <View style={styles.barberHeader}>
                    <View style={styles.avatarContainer}>
                      <Image source={{ uri: staff.avatar }} style={styles.barberAvatar} />
                      {staff.isAvailable && <View style={styles.onlineBadge} />}
                    </View>
                    
                    <View style={styles.barberInfo}>
                      <View style={styles.barberNameRow}>
                        <Text style={styles.barberName}>{staff.name}</Text>
                        {staff.isVerified && (
                          <Ionicons name="checkmark-circle" size={18} color={Colors.info} />
                        )}
                      </View>
                      
                      <View style={styles.barberMeta}>
                        <View style={styles.ratingContainer}>
                          <Ionicons name="star" size={14} color="#FBBF24" />
                          <Text style={styles.ratingText}>{staff.rating.toFixed(1)}</Text>
                          <Text style={styles.reviewsText}>({staff.totalReviews})</Text>
                        </View>
                        <View style={styles.metaDivider} />
                        <Text style={styles.jobsText}>{staff.completedJobs} jobs</Text>
                      </View>

                      {staff.isAvailable ? (
                        <View style={styles.statusBadge}>
                          <View style={styles.statusDot} />
                          <Text style={styles.statusText}>Available Today</Text>
                        </View>
                      ) : (
                        <View style={[styles.statusBadge, styles.statusBadgeOffline]}>
                          <Text style={styles.statusTextOffline}>Not Available</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Specializations */}
                  {staff.specializations && staff.specializations.length > 0 && (
                    <View style={styles.specializationsContainer}>
                      {staff.specializations.slice(0, 3).map((spec: string, idx: number) => (
                        <View key={idx} style={styles.specPill}>
                          <Text style={styles.specPillText}>{spec}</Text>
                        </View>
                      ))}
                      {staff.specializations.length > 3 && (
                        <View style={styles.morePill}>
                          <Text style={styles.morePillText}>+{staff.specializations.length - 3}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Select Button - Full Width */}
                  <View style={styles.barberFooter}>
                    <TouchableOpacity 
                      style={styles.selectButtonFull}
                      onPress={() => router.push(`/barbershop/booking/${staff.id}?shopId=${shopId}` as any)}
                      activeOpacity={ACTIVE_OPACITY.PRIMARY}
                    >
                      <Text style={styles.selectButtonFullText}>Select {staff.name.split(' ')[0]}</Text>
                      <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.gray[500],
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.gray[500],
    fontWeight: '500',
    textAlign: 'center',
  },
  shopBanner: {
    backgroundColor: Colors.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  shopBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shopLogo: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.gray[100],
  },
  shopBannerInfo: {
    flex: 1,
    gap: 4,
  },
  shopBannerName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  shopBannerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shopBannerRating: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  shopBannerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.gray[300],
  },
  shopBannerText: {
    fontSize: 14,
    color: Colors.gray[500],
    fontWeight: '500',
  },
  pricingBanner: {
    backgroundColor: Colors.primaryLight,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DDD6FE',
  },
  pricingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  pricingInfo: {
    flex: 1,
  },
  pricingLabel: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
    marginBottom: 2,
  },
  pricingValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
  },
  pricingNote: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.gray[500],
    fontWeight: '500',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  barberCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  barberHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  avatarContainer: {
    position: 'relative',
  },
  barberAvatar: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: Colors.gray[100],
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  barberInfo: {
    flex: 1,
    marginLeft: 16,
    gap: 8,
  },
  barberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barberName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  barberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  reviewsText: {
    fontSize: 13,
    color: Colors.gray[500],
    fontWeight: '500',
  },
  metaDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.gray[300],
  },
  jobsText: {
    fontSize: 13,
    color: Colors.gray[500],
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: getStatusBackground("ready"),
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  statusBadgeOffline: {
    backgroundColor: Colors.gray[100],
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  statusTextOffline: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray[500],
  },
  specializationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  specPill: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  specPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  morePill: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  morePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray[500],
  },
  barberFooter: {
    marginTop: 4,
  },
  selectButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  selectButtonFullText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
