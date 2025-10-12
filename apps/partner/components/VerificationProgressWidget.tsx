import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { verificationService, VerificationInfo } from '@mari-gunting/shared/services/verificationService';
import { supabase } from '@mari-gunting/shared/config/supabase';

export default function VerificationProgressWidget() {
  const [verificationInfo, setVerificationInfo] = useState<VerificationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const status = await verificationService.getVerificationStatus(user.id);
        setVerificationInfo(status);

        // Calculate days remaining
        if (status.estimatedCompletionDate) {
          const estimated = new Date(status.estimatedCompletionDate);
          const now = new Date();
          const diffTime = estimated.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setDaysRemaining(Math.max(0, diffDays));
        }
      }
    } catch (error) {
      console.error('Error checking verification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show widget if approved or if not submitted
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  if (!verificationInfo || verificationInfo.canAcceptBookings || !verificationInfo.hasSubmittedOnboarding) {
    return null;
  }

  const getStatusConfig = () => {
    if (verificationInfo.status === 'rejected') {
      return {
        icon: 'alert-circle' as const,
        color: COLORS.error,
        backgroundColor: '#FFEBEE',
        title: 'Action Required',
        message: 'Your verification needs attention',
      };
    }
    return {
      icon: 'time' as const,
      color: '#FF9800',
      backgroundColor: '#FFF3E0',
      title: 'Account Under Review',
      message: daysRemaining > 0 
        ? `Estimated ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining`
        : 'Review in progress',
    };
  };

  const config = getStatusConfig();
  const completedSteps = verificationInfo.steps.filter(s => s.status === 'verified').length;
  const totalSteps = verificationInfo.steps.length;

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: config.backgroundColor }]}
      onPress={() => router.push('/pending-approval')}
      activeOpacity={0.8}
    >
      <View style={styles.leftSection}>
        <View style={[styles.iconContainer, { backgroundColor: config.color }]}>
          <Ionicons name={config.icon} size={24} color="#FFF" />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: config.color }]}>{config.title}</Text>
          <Text style={styles.message}>{config.message}</Text>
          {totalSteps > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${(completedSteps / totalSteps) * 100}%`,
                      backgroundColor: config.color,
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {completedSteps}/{totalSteps} verified
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.arrowContainer}>
        <Ionicons name="arrow-forward" size={20} color={config.color} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    ...TYPOGRAPHY.body.small,
    fontSize: 11,
    color: COLORS.text.tertiary,
    fontWeight: '600',
  },
  arrowContainer: {
    marginLeft: 8,
  },
});
