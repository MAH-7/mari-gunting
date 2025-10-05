import React from 'react';
import { ViewStyle } from 'react-native';
import { SkeletonBase } from './SkeletonBase';

interface SkeletonTextProps {
  width?: number | string;
  height?: number;
  lines?: number;
  spacing?: number;
  style?: ViewStyle;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  width = '100%',
  height = 16,
  lines = 1,
  spacing = 8,
  style,
}) => {
  if (lines === 1) {
    return <SkeletonBase width={width} height={height} borderRadius={6} style={style} />;
  }

  return (
    <>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonBase
          key={index}
          width={index === lines - 1 ? '80%' : width}
          height={height}
          borderRadius={6}
          style={[style, index > 0 && { marginTop: spacing }]}
        />
      ))}
    </>
  );
};
