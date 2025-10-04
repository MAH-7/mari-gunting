import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export default function ConfirmationModal({
  visible,
  onClose,
  title,
  message,
  icon = 'alert-circle',
  iconColor = '#F59E0B',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  isDestructive = false,
  isLoading = false,
}: ConfirmationModalProps) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animation values before animating in
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0);
      
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 90,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 15,
          stiffness: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim, scaleAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => {}}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.container,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Icon with Animation */}
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                <Ionicons name={icon} size={64} color={iconColor} />
              </Animated.View>

              {/* Title */}
              <Text style={styles.title}>{title}</Text>

              {/* Message */}
              <Text style={styles.message}>{message}</Text>

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                {/* Confirm Button */}
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    isDestructive && styles.confirmButtonDestructive,
                  ]}
                  onPress={onConfirm}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={isDestructive ? '#FFFFFF' : '#FFFFFF'}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.confirmButtonText,
                        isDestructive && styles.confirmButtonTextDestructive,
                      ]}
                    >
                      {confirmText}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Cancel Button */}
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onClose}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelButtonText}>{cancelText}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  confirmButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00B14F',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonDestructive: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  confirmButtonTextDestructive: {
    color: '#FFFFFF',
  },
  cancelButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.3,
  },
});
