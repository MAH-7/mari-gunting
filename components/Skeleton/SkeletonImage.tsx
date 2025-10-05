import React from 'react';
import { ViewStyle } from 'react-native';
import { SkeletonBase } from './SkeletonBase';

interface SkeletonImageProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonImage: React.FC<SkeletonImageProps> = ({
  width = '100%',
  height = 200,
  borderRadius = 12,
  style,
}) => {
  return (
    <SkeletonBase
      width={width}
      height={height}
      borderRadius={borderRadius}
      style={style}
    />
  );
};
