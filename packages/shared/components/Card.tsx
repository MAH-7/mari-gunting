/**
 * Card Component
 * 
 * Standardized card wrapper component used across Customer and Partner apps.
 * Provides consistent elevation, padding, and border radius.
 * 
 * @production-ready
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { Colors, BorderRadius, Spacing, Shadows } from '../theme';

interface CardProps {
  /** Child components */
  children: React.ReactNode;
  
  /** Custom styles */
  style?: ViewStyle;
  
  /** Padding variant */
  padding?: 'none' | 'small' | 'medium' | 'large';
  
  /** Card variant */
  variant?: 'elevated' | 'outlined' | 'flat';
  
  /** On press handler for interactive cards */
  onPress?: () => void;
  
  /** Whether card is disabled */
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 'medium',
  variant = 'elevated',
  onPress,
  disabled,
}) => {
  const cardStyles = [
    styles.base,
    variant === 'elevated' && styles.elevated,
    variant === 'outlined' && styles.outlined,
    variant === 'flat' && styles.flat,
    padding !== 'none' && styles[`padding_${padding}`],
    disabled && styles.disabled,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          cardStyles,
          pressed && !disabled && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginVertical: Spacing.sm,
  },

  elevated: {
    ...Shadows.md,
  },

  outlined: {
    borderWidth: 1,
    borderColor: Colors.border.default,
  },

  flat: {
    backgroundColor: Colors.gray[50],
  },

  disabled: {
    opacity: 0.5,
  },

  pressed: {
    opacity: 0.7,
  },

  // Padding variants
  padding_small: {
    padding: Spacing.sm,
  },
  padding_medium: {
    padding: Spacing.md,
  },
  padding_large: {
    padding: Spacing.lg,
  },
});
