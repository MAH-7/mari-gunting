/**
 * EmptyState Component
 * 
 * Standardized empty state component for lists and data views.
 * Shows icon, title, description, and optional action button.
 * 
 * @production-ready
 */

import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants';
import { Button } from './Button';

interface EmptyStateProps {
  /** Icon name from Ionicons */
  icon?: keyof typeof Ionicons.glyphMap;
  
  /** Title text */
  title: string;
  
  /** Description text */
  description?: string;
  
  /** Action button text */
  actionLabel?: string;
  
  /** Action button handler */
  onAction?: () => void;
  
  /** Custom styles */
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'file-tray-outline',
  title,
  description,
  actionLabel,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={64} color={COLORS.text.tertiary} />
      </View>
      
      <Text style={styles.title}>{title}</Text>
      
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}
      
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          size="medium"
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxxl,
    paddingVertical: SPACING.xxxl * 2,
  },

  iconContainer: {
    marginBottom: SPACING.xl,
  },

  title: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },

  description: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },

  button: {
    marginTop: SPACING.lg,
    minWidth: 200,
  },
});
