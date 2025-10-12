import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import { Rating } from './Rating';
import { Badge } from './Badge';

interface BarbershopCardProps {
  id: string;
  name: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  address: string;
  distance?: number; // in km
  isOpen: boolean;
  services?: string[];
  onPress: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'compact' | 'featured';
}

export const BarbershopCard: React.FC<BarbershopCardProps> = ({
  id,
  name,
  imageUrl,
  rating,
  reviewCount,
  address,
  distance,
  isOpen,
  services = [],
  onPress,
  style,
  variant = 'default',
}) => {
  const renderCompactCard = () => (
    <TouchableOpacity
      style={[styles.card, styles.compactCard, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image source={{ uri: imageUrl }} style={styles.compactImage} />
      <View style={styles.compactContent}>
        <View style={styles.compactHeader}>
          <Text style={styles.compactName} numberOfLines={1}>
            {name}
          </Text>
          {distance !== undefined && (
            <Text style={styles.distance}>{distance.toFixed(1)} km</Text>
          )}
        </View>
        <Rating rating={rating} reviewCount={reviewCount} size="small" />
      </View>
    </TouchableOpacity>
  );

  const renderFeaturedCard = () => (
    <TouchableOpacity
      style={[styles.card, styles.featuredCard, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image source={{ uri: imageUrl }} style={styles.featuredImage} />
      <View style={styles.featuredBadge}>
        <Badge label={isOpen ? 'Open' : 'Closed'} variant={isOpen ? 'success' : 'error'} size="small" />
      </View>
      <View style={styles.featuredContent}>
        <Text style={styles.featuredName} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.featuredInfo}>
          <Rating rating={rating} reviewCount={reviewCount} size="small" />
          {distance !== undefined && (
            <View style={styles.distanceContainer}>
              <Ionicons name="location-outline" size={14} color={Colors.text.secondary} />
              <Text style={styles.distance}>{distance.toFixed(1)} km</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderDefaultCard = () => (
    <TouchableOpacity
      style={[styles.card, styles.defaultCard, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image source={{ uri: imageUrl }} style={styles.defaultImage} />
      
      {/* Status Badge */}
      <View style={styles.statusBadge}>
        <Badge label={isOpen ? 'Open' : 'Closed'} variant={isOpen ? 'success' : 'error'} size="small" />
      </View>

      <View style={styles.defaultContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Rating rating={rating} reviewCount={reviewCount} size="small" />
        </View>

        {/* Address */}
        <View style={styles.addressContainer}>
          <Ionicons name="location-outline" size={16} color={Colors.text.secondary} />
          <Text style={styles.address} numberOfLines={2}>
            {address}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {/* Distance */}
          {distance !== undefined && (
            <View style={styles.distanceContainer}>
              <Ionicons name="navigate-outline" size={14} color={Colors.primary} />
              <Text style={styles.distanceText}>{distance.toFixed(1)} km away</Text>
            </View>
          )}

          {/* Services Preview */}
          {services.length > 0 && (
            <View style={styles.servicesContainer}>
              <Ionicons name="cut-outline" size={14} color={Colors.text.secondary} />
              <Text style={styles.servicesText} numberOfLines={1}>
                {services.slice(0, 2).join(', ')}
                {services.length > 2 && ` +${services.length - 2}`}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (variant === 'compact') {
    return renderCompactCard();
  }

  if (variant === 'featured') {
    return renderFeaturedCard();
  }

  return renderDefaultCard();
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.md,
  },

  // Default Card Styles
  defaultCard: {
    marginBottom: Spacing.md,
  },
  defaultImage: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.gray[200],
  },
  statusBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  defaultContent: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  address: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  distanceText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
  distance: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  servicesContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  servicesText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },

  // Compact Card Styles
  compactCard: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
  },
  compactImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray[200],
  },
  compactContent: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  compactName: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginRight: Spacing.sm,
  },

  // Featured Card Styles
  featuredCard: {
    width: 280,
    marginRight: Spacing.md,
  },
  featuredImage: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.gray[200],
  },
  featuredBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  featuredContent: {
    padding: Spacing.md,
  },
  featuredName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  featuredInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
