/**
 * StatusBadge Component
 * 
 * Standardized status badge for booking statuses.
 * Automatically applies correct colors based on status.
 * 
 * @production-ready
 */

import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { getStatusColor, getStatusBackground, SPACING, TYPOGRAPHY } from '../constants';

type BookingStatus = 
  | 'pending'
  | 'accepted'
  | 'confirmed'
  | 'ready'
  | 'on-the-way'
  | 'in-progress'
  | 'completed'
  | 'cancelled';

interface StatusBadgeProps {
  /** Booking status */
  status: BookingStatus | string;
  
  /** Custom label (defaults to capitalized status) */
  label?: string;
  
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  
  /** Custom styles */
  style?: ViewStyle;
  
  /** Custom text styles */
  textStyle?: TextStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'medium',
  style,
  textStyle,
}) => {
  // Format status for display
  const displayLabel = label || formatStatus(status);
  
  const badgeStyles = [
    styles.base,
    styles[size],
    { backgroundColor: getStatusBackground(status) },
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${size}Text`],
    { color: getStatusColor(status) },
    textStyle,
  ];

  return (
    <View style={badgeStyles}>
      <Text style={textStyles}>{displayLabel}</Text>
    </View>
  );
};

// Helper function to format status string
function formatStatus(status: string): string {
  return status
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const styles = StyleSheet.create({
  // Base styles
  base: {
    alignSelf: 'flex-start',
    borderRadius: 8,
  },

  // Sizes
  small: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  medium: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  large: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  // Text styles
  text: {
    ...TYPOGRAPHY.label.small,
  },
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: 12,
  },
  largeText: {
    fontSize: 14,
  },
});
