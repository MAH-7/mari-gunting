import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBase } from './SkeletonBase';
import { SkeletonText } from './SkeletonText';
import { SkeletonCircle } from './SkeletonCircle';
import { SkeletonImage } from './SkeletonImage';

interface SkeletonCardProps {
  variant?: 'default' | 'horizontal' | 'list';
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  variant = 'default',
}) => {
  if (variant === 'horizontal') {
    return (
      <View style={styles.horizontalCard}>
        <SkeletonImage width={120} height={120} borderRadius={12} />
        <View style={styles.horizontalContent}>
          <SkeletonText width="80%" height={18} />
          <SkeletonText width="60%" height={14} style={{ marginTop: 8 }} />
          <View style={styles.horizontalFooter}>
            <SkeletonText width={60} height={16} />
            <SkeletonText width={40} height={16} />
          </View>
        </View>
      </View>
    );
  }

  if (variant === 'list') {
    return (
      <View style={styles.listCard}>
        <SkeletonCircle size={44} />
        <View style={styles.listContent}>
          <SkeletonText width="70%" height={16} />
          <SkeletonText width="50%" height={14} style={{ marginTop: 6 }} />
        </View>
      </View>
    );
  }

  // Default vertical card
  return (
    <View style={styles.defaultCard}>
      <SkeletonImage width="100%" height={180} borderRadius={12} />
      <View style={styles.defaultContent}>
        <SkeletonText width="80%" height={18} />
        <SkeletonText width="60%" height={14} style={{ marginTop: 8 }} />
        <View style={styles.defaultFooter}>
          <SkeletonText width={80} height={16} />
          <SkeletonText width={60} height={16} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  defaultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  defaultContent: {
    marginTop: 12,
  },
  defaultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  horizontalCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  horizontalContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  horizontalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  listContent: {
    flex: 1,
  },
});
