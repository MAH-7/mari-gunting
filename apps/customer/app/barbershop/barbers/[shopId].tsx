import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
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

      {/* Shop Info Banner - Compact */}
      <View style={styles.shopBanner}>
        <View style={styles.shopBannerRow}>
          <View style={styles.shopBannerLeft}>
            <Ionicons name="storefront" size={20} color={Colors.primary} />
            <Text style={styles.shopBannerName}>{shop.name}</Text>
          </View>
          <View style={styles.shopBannerMeta}>
            <Ionicons name="star" size={14} color="#FBBF24" />
            <Text style={styles.shopBannerRating}>{shop.rating.toFixed(1)}</Text>
          </View>
        </View>
        <Text style={styles.shopBannerSubtext}>{barbers.length} barbers available</Text>
      </View>

      {/* Barbers List - Flat Grab Style */}
      <View style={styles.barbersList}>
        {barbers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyText}>No barbers available</Text>
          </View>
        ) : (
          barbers.map((staff: BarbershopStaff, index: number) => (
            <TouchableOpacity
              key={staff.id}
              style={[
                styles.barberItem,
                index < barbers.length - 1 && styles.barberItemBorder,
                !staff.isAvailable && styles.barberItemDisabled
              ]}
              onPress={() => {
                if (staff.isAvailable) {
                  router.push(`/barbershop/booking/${staff.id}?shopId=${shopId}` as any);
                }
              }}
              activeOpacity={staff.isAvailable ? ACTIVE_OPACITY.SECONDARY : 1}
              disabled={!staff.isAvailable}
            >
              {/* Avatar */}
              <View style={[
                styles.barberAvatar,
                !staff.isAvailable && styles.barberAvatarDisabled
              ]}>
                <Text style={[
                  styles.avatarText,
                  !staff.isAvailable && styles.avatarTextDisabled
                ]}>
                  {staff.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              
              {/* Info */}
              <View style={styles.barberInfo}>
                <View style={styles.barberNameRow}>
                  <Text style={[
                    styles.barberName,
                    !staff.isAvailable && styles.barberNameDisabled
                  ]}>
                    {staff.name}
                  </Text>
                  {staff.isVerified && (
                    <Ionicons 
                      name="checkmark-circle" 
                      size={16} 
                      color={staff.isAvailable ? Colors.info : Colors.gray[300]} 
                    />
                  )}
                </View>
                <View style={styles.barberMeta}>
                  <Ionicons 
                    name="star" 
                    size={12} 
                    color={staff.isAvailable ? "#FBBF24" : Colors.gray[300]} 
                  />
                  <Text style={[
                    styles.ratingText,
                    !staff.isAvailable && styles.textDisabled
                  ]}>
                    {staff.rating.toFixed(1)}
                  </Text>
                  <Text style={[
                    styles.metaDivider,
                    !staff.isAvailable && styles.textDisabled
                  ]}>
                    {' • '}
                  </Text>
                  <Text style={[
                    styles.jobsText,
                    !staff.isAvailable && styles.textDisabled
                  ]}>
                    {staff.completedJobs} jobs
                  </Text>
                </View>
              </View>
              
              {/* Arrow or disabled indicator */}
              {staff.isAvailable ? (
                <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
              ) : (
                <Text style={styles.unavailableText}>Unavailable</Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
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
  shopBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  shopBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shopBannerName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  shopBannerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shopBannerRating: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  shopBannerSubtext: {
    fontSize: 13,
    color: Colors.gray[500],
    fontWeight: '500',
    marginLeft: 28,
  },
  barbersList: {
    backgroundColor: Colors.white,
  },
  barberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  barberItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  barberItemDisabled: {
    opacity: 0.5,
  },
  barberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barberAvatarDisabled: {
    backgroundColor: Colors.gray[100],
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  avatarTextDisabled: {
    color: Colors.gray[400],
  },
  barberInfo: {
    flex: 1,
    gap: 4,
  },
  barberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  barberName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  barberNameDisabled: {
    color: Colors.gray[400],
  },
  barberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  metaDivider: {
    fontSize: 13,
    color: Colors.gray[400],
    fontWeight: '500',
  },
  jobsText: {
    fontSize: 13,
    color: Colors.gray[500],
    fontWeight: '500',
  },
  textDisabled: {
    color: Colors.gray[400],
  },
  unavailableText: {
    fontSize: 12,
    color: Colors.gray[400],
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
});
