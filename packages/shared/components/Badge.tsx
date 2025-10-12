import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, BorderRadius, Spacing } from '../theme';

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral';
type BadgeSize = 'small' | 'medium' | 'large';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'medium',
  style,
}) => {
  const containerStyle = [
    styles.container,
    styles[`variant_${variant}`],
    styles[`size_${size}`],
    style,
  ];

  const textStyle = [
    styles.text,
    styles[`textVariant_${variant}`],
    styles[`textSize_${size}`],
  ];

  return (
    <View style={containerStyle}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  text: {
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'center',
  },

  // Variants
  variant_success: {
    backgroundColor: Colors.success + '20', // 20% opacity
  },
  variant_error: {
    backgroundColor: Colors.error + '20',
  },
  variant_warning: {
    backgroundColor: Colors.warning + '20',
  },
  variant_info: {
    backgroundColor: Colors.info + '20',
  },
  variant_neutral: {
    backgroundColor: Colors.gray[200],
  },

  // Text variants
  textVariant_success: {
    color: Colors.success,
  },
  textVariant_error: {
    color: Colors.error,
  },
  textVariant_warning: {
    color: Colors.warning,
  },
  textVariant_info: {
    color: Colors.info,
  },
  textVariant_neutral: {
    color: Colors.gray[700],
  },

  // Sizes
  size_small: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  size_medium: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  size_large: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },

  // Text sizes
  textSize_small: {
    fontSize: Typography.fontSize.xs,
  },
  textSize_medium: {
    fontSize: Typography.fontSize.sm,
  },
  textSize_large: {
    fontSize: Typography.fontSize.base,
  },
});
