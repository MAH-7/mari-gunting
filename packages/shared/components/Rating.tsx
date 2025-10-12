import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing } from '../theme';

type RatingSize = 'small' | 'medium' | 'large';

interface RatingProps {
  rating: number;
  reviewCount?: number;
  size?: RatingSize;
  showNumber?: boolean;
  style?: ViewStyle;
}

const StarIcon: React.FC<{ filled: boolean; size: number }> = ({ filled, size }) => {
  return (
    <Text style={{ fontSize: size, color: filled ? Colors.warning : Colors.gray[300] }}>
      ★
    </Text>
  );
};

export const Rating: React.FC<RatingProps> = ({
  rating,
  reviewCount,
  size = 'medium',
  showNumber = true,
  style,
}) => {
  const stars = Array.from({ length: 5 }, (_, index) => {
    const fillValue = rating - index;
    return fillValue >= 1;
  });

  const starSize = size === 'small' ? 14 : size === 'medium' ? 18 : 24;
  const textSize = size === 'small' 
    ? Typography.fontSize.xs 
    : size === 'medium' 
    ? Typography.fontSize.sm 
    : Typography.fontSize.base;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.stars}>
        {stars.map((filled, index) => (
          <StarIcon key={index} filled={filled} size={starSize} />
        ))}
      </View>
      
      {showNumber && (
        <Text style={[styles.ratingText, { fontSize: textSize }]}>
          {rating.toFixed(1)}
        </Text>
      )}
      
      {reviewCount !== undefined && (
        <Text style={[styles.reviewCount, { fontSize: textSize }]}>
          ({reviewCount})
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
  },
  ratingText: {
    marginLeft: Spacing.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  reviewCount: {
    marginLeft: Spacing.xs,
    color: Colors.text.secondary,
  },
});
