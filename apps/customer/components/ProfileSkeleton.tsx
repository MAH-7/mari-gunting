import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonCircle, SkeletonText } from './Skeleton';

export const ProfileSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Avatar */}
      <SkeletonCircle size={100} />
      
      {/* Name */}
      <SkeletonText width={200} height={26} style={{ marginTop: 16 }} />
      
      {/* Role Badge */}
      <SkeletonText width={100} height={24} style={{ marginTop: 8 }} />
      
      {/* Contact Info */}
      <View style={styles.contactSection}>
        <SkeletonText width="100%" height={50} style={{ marginBottom: 10 }} />
        <SkeletonText width="100%" height={50} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#7E3AF2',
  },
  contactSection: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 24,
  },
});
