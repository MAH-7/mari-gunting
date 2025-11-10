/**
 * Partner App Splash Screen
 * 
 * Professional splash screen for Mari Gunting Partner app.
 * Displays branding with smooth animations before showing the app.
 * 
 * @production-ready
 */

import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
  Image,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { Colors, theme } from '@mari-gunting/shared/theme';

const { width, height } = Dimensions.get("window");

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence animation
    Animated.sequence([
      // Logo scale and fade in with icon rotation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(iconRotate, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      // Text slide up
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      // Hold for a moment
      Animated.delay(800),
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, []);

  const rotateInterpolate = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor: Colors.primary }]}>
      {/* Decorative circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo Icon with Business Badge */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBackground}>
            <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
              <Ionicons name="cut" size={80} color={Colors.primary} />
            </Animated.View>
            
            {/* Partner Badge */}
            <View style={styles.partnerBadge}>
              <Ionicons name="briefcase" size={16} color={Colors.white} />
              <Text style={styles.partnerBadgeText}>PRO</Text>
            </View>
          </View>
        </View>

        {/* App Name */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.appName}>Mari Gunting</Text>
          <Text style={styles.partnerLabel}>Partner</Text>
          <Text style={styles.tagline}>Grow Your Business</Text>
        </Animated.View>
      </Animated.View>

      {/* Bottom branding */}
      <Animated.View
        style={[
          styles.bottomContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Text style={styles.poweredBy}>Powered by</Text>
        <Text style={styles.companyName}>Mari Gunting™</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  circle1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    top: -100,
    right: -100,
  },
  circle2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    bottom: -50,
    left: -50,
  },
  circle3: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    top: height * 0.3,
    left: -75,
  },
  content: {
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoBackground: {
    width: 160,
    height: 160,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
    position: 'relative',
  },
  partnerBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  partnerBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textContainer: {
    alignItems: "center",
  },
  appName: {
    fontSize: 42,
    fontWeight: "800",
    color: Colors.white,
    letterSpacing: -1,
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  partnerLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.95)",
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
  },
  tagline: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    letterSpacing: 0.5,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 60,
    alignItems: "center",
  },
  poweredBy: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
    marginBottom: 4,
  },
  companyName: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
