import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';

type StatusType = 'not_started' | 'in_progress' | 'submitted' | 'verified' | 'failed';

interface VerificationStatusBannerProps {
  status: StatusType;
  message?: string;
}

export default function VerificationStatusBanner({ status, message }: VerificationStatusBannerProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          icon: 'checkmark-circle' as const,
          color: COLORS.success,
          backgroundColor: '#E8F5E9',
          title: 'Verified',
          defaultMessage: 'Your documents have been verified',
        };
      case 'submitted':
        return {
          icon: 'time' as const,
          color: '#FF9800',
          backgroundColor: '#FFF3E0',
          title: 'Under Review',
          defaultMessage: 'We\'re reviewing your documents (1-2 business days)',
        };
      case 'failed':
        return {
          icon: 'close-circle' as const,
          color: COLORS.error,
          backgroundColor: '#FFEBEE',
          title: 'Action Required',
          defaultMessage: 'Please resubmit your documents',
        };
      case 'in_progress':
        return {
          icon: 'create' as const,
          color: COLORS.primary,
          backgroundColor: COLORS.primaryLight,
          title: 'In Progress',
          defaultMessage: 'Complete the form below to continue',
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();

  if (!config || status === 'not_started') {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: config.backgroundColor }]}>
      <View style={[styles.iconContainer, { backgroundColor: config.color }]}>
        <Ionicons name={config.icon} size={20} color="#FFF" />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: config.color }]}>{config.title}</Text>
        <Text style={styles.message}>{message || config.defaultMessage}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.body.medium,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
});
