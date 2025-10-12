import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Image,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '@mari-gunting/shared';
import { Colors, Typography, Spacing, BorderRadius } from '@mari-gunting/shared';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  image: any;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Find Your Perfect Barbershop',
    description: 'Discover top-rated barbershops near you with real reviews and ratings',
    image: require('@/assets/banner1.png'),
  },
  {
    id: '2',
    title: 'Book Anytime, Anywhere',
    description: 'Schedule your haircut appointment in seconds and skip the wait',
    image: require('@/assets/banner2.png'),
  },
  {
    id: '3',
    title: 'Earn Rewards',
    description: 'Get points with every booking and unlock exclusive discounts',
    image: require('@/assets/banner3.png'),
  },
];

export default function WelcomeScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index || 0);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const scrollToIndex = (index: number) => {
    flatListRef.current?.scrollToIndex({ animated: true, index });
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollToIndex(currentIndex + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = () => {
    router.replace('/login');
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={styles.slide}>
      <View style={styles.imageContainer}>
        <Image source={item.image} style={styles.image} resizeMode="contain" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === currentIndex && styles.activeDot,
          ]}
        />
      ))}
    </View>
  );

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Skip Button */}
      {!isLastSlide && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
      />

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {renderDots()}
        
        <View style={styles.buttonContainer}>
          <Button
            title={isLastSlide ? 'Get Started' : 'Next'}
            onPress={handleNext}
            fullWidth
            size="large"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: Spacing.lg,
    zIndex: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  skipText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  image: {
    width: width * 0.8,
    height: width * 0.8,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 36,
  },
  description: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.md,
  },
  bottomSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[300],
  },
  activeDot: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  buttonContainer: {
    width: '100%',
  },
});
