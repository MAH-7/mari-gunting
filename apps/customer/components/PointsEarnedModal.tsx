import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, theme } from '@mari-gunting/shared/theme';

interface PointsEarnedModalProps {
  visible: boolean;
  points: number;
  onClose: () => void;
  onComplete?: () => void; // Called after modal closes
}

export default function PointsEarnedModal({ visible, points, onClose, onComplete }: PointsEarnedModalProps) {
  const [displayPoints, setDisplayPoints] = React.useState(0);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pointsAnim = useRef(new Animated.Value(0)).current;
  
  // Confetti animation values
  const confetti1 = useRef(new Animated.Value(0)).current;
  const confetti2 = useRef(new Animated.Value(0)).current;
  const confetti3 = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
      // Reset display points
      setDisplayPoints(0);
      pointsAnim.setValue(0);
      
      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Start animations
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Add listener to update display points
      const listenerId = pointsAnim.addListener(({ value }) => {
        setDisplayPoints(Math.round(value));
      });
      
      // Animate points counter
      Animated.timing(pointsAnim, {
        toValue: points,
        duration: 1000,
        useNativeDriver: false,
      }).start();
      
      // Confetti animations
      Animated.stagger(100, [
        Animated.timing(confetti1, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(confetti2, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(confetti3, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Auto close after 3 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);
      
      return () => {
        clearTimeout(timer);
        pointsAnim.removeListener(listenerId);
      };
    }
  }, [visible, points]);
  
  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      pointsAnim.setValue(0);
      setDisplayPoints(0);
      confetti1.setValue(0);
      confetti2.setValue(0);
      confetti3.setValue(0);
      onClose();
      // Call onComplete after closing animation
      if (onComplete) {
        setTimeout(() => onComplete(), 100);
      }
    });
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Confetti elements */}
        <Animated.View
          style={[
            styles.confetti,
            styles.confetti1,
            {
              opacity: confetti1,
              transform: [
                {
                  translateY: confetti1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 300],
                  }),
                },
                {
                  rotate: confetti1.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.confetti,
            styles.confetti2,
            {
              opacity: confetti2,
              transform: [
                {
                  translateY: confetti2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 320],
                  }),
                },
                {
                  rotate: confetti2.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '-360deg'],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.confetti,
            styles.confetti3,
            {
              opacity: confetti3,
              transform: [
                {
                  translateY: confetti3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 280],
                  }),
                },
                {
                  rotate: confetti3.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '270deg'],
                  }),
                },
              ],
            },
          ]}
        />
        
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={[styles.gradient, { backgroundColor: Colors.primary }]}>
            {/* Star icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="star" size={48} color="#FFD700" />
            </View>
            
            {/* Points display */}
            <Text style={styles.pointsLabel}>Points Earned!</Text>
            <View style={styles.pointsRow}>
              <Text style={styles.pointsPrefix}>+</Text>
              <Text style={styles.pointsValue}>
                {displayPoints}
              </Text>
              <Text style={styles.pointsSuffix}>pts</Text>
            </View>
            
            <Text style={styles.message}>Keep booking to earn more rewards!</Text>
            
            <TouchableOpacity style={styles.button} onPress={handleClose}>
              <Text style={styles.buttonText}>Awesome!</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  gradient: {
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  pointsLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  pointsPrefix: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
    marginRight: 4,
  },
  pointsValue: {
    fontSize: 64,
    fontWeight: 'bold',
    color: Colors.white,
    lineHeight: 72,
  },
  pointsSuffix: {
    fontSize: 24,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    backgroundColor: Colors.white,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  // Confetti
  confetti: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  confetti1: {
    backgroundColor: '#FFD700',
    top: '40%',
    left: '20%',
  },
  confetti2: {
    backgroundColor: '#FF6B6B',
    top: '35%',
    right: '25%',
  },
  confetti3: {
    backgroundColor: '#4ECDC4',
    top: '42%',
    right: '15%',
  },
});
