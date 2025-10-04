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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SuccessModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  primaryButton?: {
    label: string;
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
  };
  secondaryButton?: {
    label: string;
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
  };
  details?: Array<{ label: string; value: string }>;
}

export default function SuccessModal({
  visible,
  onClose,
  title,
  message,
  icon = 'checkmark-circle',
  iconColor = '#00B14F',
  primaryButton,
  secondaryButton,
  details,
}: SuccessModalProps) {
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
              {/* Success Icon with Animation */}
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

              {/* Details Card (if provided) */}
              {details && details.length > 0 && (
                <View style={styles.detailsCard}>
                  {details.map((detail, index) => (
                    <View
                      key={index}
                      style={[
                        styles.detailRow,
                        index < details.length - 1 && styles.detailRowBorder,
                      ]}
                    >
                      <Text style={styles.detailLabel}>{detail.label}</Text>
                      <Text style={styles.detailValue}>{detail.value}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Primary Button */}
              {primaryButton && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={primaryButton.onPress}
                  activeOpacity={0.8}
                >
                  {primaryButton.icon && (
                    <Ionicons
                      name={primaryButton.icon}
                      size={20}
                      color="#FFFFFF"
                      style={styles.buttonIcon}
                    />
                  )}
                  <Text style={styles.primaryButtonText}>
                    {primaryButton.label}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Secondary Button */}
              {secondaryButton && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={secondaryButton.onPress}
                  activeOpacity={0.8}
                >
                  {secondaryButton.icon && (
                    <Ionicons
                      name={secondaryButton.icon}
                      size={20}
                      color="#00B14F"
                      style={styles.buttonIcon}
                    />
                  )}
                  <Text style={styles.secondaryButtonText}>
                    {secondaryButton.label}
                  </Text>
                </TouchableOpacity>
              )}
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
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
  },
  primaryButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00B14F',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#00B14F',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00B14F',
    letterSpacing: 0.3,
  },
  buttonIcon: {
    marginRight: 8,
  },
});
