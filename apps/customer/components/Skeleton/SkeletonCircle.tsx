import React from 'react';
import { ViewStyle } from 'react-native';
import { SkeletonBase } from './SkeletonBase';

interface SkeletonCircleProps {
  size?: number;
  style?: ViewStyle;
}

export const SkeletonCircle: React.FC<SkeletonCircleProps> = ({
  size = 44,
  style,
}) => {
  return (
    <SkeletonBase
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  );
};
