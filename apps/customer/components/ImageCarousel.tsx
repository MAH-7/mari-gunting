import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ImageCarouselProps {
  images: string[];
  height?: number;
  autoPlayInterval?: number;
  showPagination?: boolean;
  imageStyle?: any;
  containerStyle?: any;
  scrollY?: Animated.Value;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  height = 280,
  autoPlayInterval = 3000, // Default 3 seconds
  showPagination = true,
  imageStyle,
  containerStyle,
  scrollY,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle scroll events to update active index
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const contentOffsetX = event.nativeEvent.contentOffset.x;
      const currentIndex = Math.round(contentOffsetX / SCREEN_WIDTH);
      setActiveIndex(currentIndex);
    },
    []
  );

  // Auto-play functionality
  const goToNextSlide = useCallback(() => {
    if (!images || images.length <= 1) return;
    
    const nextIndex = (activeIndex + 1) % images.length;
    scrollViewRef.current?.scrollTo({
      x: nextIndex * SCREEN_WIDTH,
      animated: true,
    });
    setActiveIndex(nextIndex);
  }, [activeIndex, images]);

  // Setup auto-play timer
  useEffect(() => {
    if (autoPlayInterval && images && images.length > 1) {
      autoPlayTimerRef.current = setInterval(goToNextSlide, autoPlayInterval);
      
      return () => {
        if (autoPlayTimerRef.current) {
          clearInterval(autoPlayTimerRef.current);
        }
      };
    }
  }, [autoPlayInterval, goToNextSlide, images]);

  // Reset timer when user manually scrolls
  const handleScrollBeginDrag = useCallback(() => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
    }
  }, []);

  const handleScrollEndDrag = useCallback(() => {
    if (autoPlayInterval && images && images.length > 1) {
      autoPlayTimerRef.current = setInterval(goToNextSlide, autoPlayInterval);
    }
  }, [autoPlayInterval, goToNextSlide, images]);

  // Parallax animation effect based on parent scroll (only if scrollY is provided)
  const imageScale = scrollY
    ? scrollY.interpolate({
        inputRange: [-100, 0],
        outputRange: [1.3, 1],
        extrapolate: 'clamp',
      })
    : undefined;

  const imageTranslateY = scrollY
    ? scrollY.interpolate({
        inputRange: [0, height],
        outputRange: [0, -height / 2],
        extrapolate: 'clamp',
      })
    : undefined;

  // Fallback to single image if photos array is empty
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { height }, containerStyle]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="center"
        bounces={false}
        directionalLockEnabled={true}
        contentContainerStyle={styles.scrollViewContent}
      >
        {images.map((imageUri, index) => (
          <View
            key={`${imageUri}-${index}`}
            style={[
              styles.imageWrapper,
              {
                width: SCREEN_WIDTH,
                height,
              },
            ]}
          >
            {scrollY && imageScale && imageTranslateY ? (
              <Animated.Image
                source={{ uri: imageUri }}
                style={[
                  styles.image,
                  imageStyle,
                  {
                    transform: [{ scale: imageScale }, { translateY: imageTranslateY }],
                  },
                ]}
                resizeMode="cover"
              />
            ) : (
              <Image
                source={{ uri: imageUri }}
                style={[styles.image, imageStyle]}
                resizeMode="cover"
              />
            )}
          </View>
        ))}
      </ScrollView>

      {/* Image Overlay */}
      <View style={styles.imageOverlay} />

      {/* Pagination Dots */}
      {showPagination && images.length > 1 && (
        <View style={styles.paginationContainer}>
          <View style={styles.paginationDots}>
            {images.map((_, index) => (
              <View
                key={`dot-${index}`}
                style={[
                  styles.paginationDot,
                  index === activeIndex && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  scrollViewContent: {
    flexDirection: 'row',
  },
  imageWrapper: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    pointerEvents: 'none',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  paginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backdropFilter: 'blur(10px)',
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    transition: 'all 0.3s ease',
  },
  paginationDotActive: {
    width: 20,
    backgroundColor: '#FFFFFF',
  },
});
