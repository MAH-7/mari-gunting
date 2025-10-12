import React from 'react';
import { ActivityIndicator, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing } from '../theme';

type LoadingSize = 'small' | 'medium' | 'large';

interface LoadingSpinnerProps {
  size?: LoadingSize;
  message?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message,
  fullScreen = false,
  style,
}) => {
  const activitySize = size === 'small' ? 'small' : 'large';
  
  const spinnerSize = 
    size === 'small' ? 20 : 
    size === 'medium' ? 36 : 
    48;

  const containerStyle = [
    styles.container,
    fullScreen && styles.fullScreen,
    style,
  ];

  return (
    <View style={containerStyle}>
      <ActivityIndicator 
        size={activitySize} 
        color={Colors.primary}
        style={{ transform: [{ scale: spinnerSize / 36 }] }}
      />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.white,
    zIndex: 1000,
  },
  message: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
