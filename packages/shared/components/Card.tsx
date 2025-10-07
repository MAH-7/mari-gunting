/**
 * Card Component
 * 
 * Standardized card wrapper component used across Customer and Partner apps.
 * Provides consistent elevation, padding, and border radius.
 * 
 * @production-ready
 */

import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants';

interface CardProps {
  /** Child components */
  children: React.ReactNode;
  
  /** Custom styles */
  style?: ViewStyle;
  
  /** Padding variant */
  padding?: 'none' | 'small' | 'medium' | 'large';
  
  /** Whether to show shadow/elevation */
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 'medium',
  elevated = true,
}) => {
  const cardStyles = [
    styles.base,
    elevated && styles.elevated,
    padding !== 'none' && styles[`padding_${padding}`],
    style,
  ];

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: COLORS.background.primary,
    borderRadius: RADIUS.lg,
  },

  elevated: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  // Padding variants
  padding_small: {
    padding: SPACING.md,
  },
  padding_medium: {
    padding: SPACING.lg,
  },
  padding_large: {
    padding: SPACING.xl,
  },
});
