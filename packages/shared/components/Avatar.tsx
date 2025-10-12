import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, BorderRadius } from '../theme';

type AvatarSize = 'small' | 'medium' | 'large' | 'xlarge';

interface AvatarProps {
  imageUri?: string;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
}

const getInitials = (name: string): string => {
  if (!name) return '?';
  
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (
    parts[0].charAt(0).toUpperCase() + 
    parts[parts.length - 1].charAt(0).toUpperCase()
  );
};

export const Avatar: React.FC<AvatarProps> = ({
  imageUri,
  name,
  size = 'medium',
  style,
}) => {
  const containerStyle = [
    styles.container,
    styles[`size_${size}`],
    style,
  ];

  const textStyle = [
    styles.text,
    styles[`textSize_${size}`],
  ];

  return (
    <View style={containerStyle}>
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <Text style={textStyle}>
          {name ? getInitials(name) : '?'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  text: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.bold,
  },

  // Sizes
  size_small: {
    width: 32,
    height: 32,
  },
  size_medium: {
    width: 48,
    height: 48,
  },
  size_large: {
    width: 64,
    height: 64,
  },
  size_xlarge: {
    width: 96,
    height: 96,
  },

  // Text sizes
  textSize_small: {
    fontSize: Typography.fontSize.sm,
  },
  textSize_medium: {
    fontSize: Typography.fontSize.lg,
  },
  textSize_large: {
    fontSize: Typography.fontSize.xl,
  },
  textSize_xlarge: {
    fontSize: Typography.fontSize['2xl'],
  },
});
