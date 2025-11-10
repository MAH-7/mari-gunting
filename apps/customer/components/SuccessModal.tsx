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
import { MODAL_ANIMATION, ACTIVE_OPACITY } from '@/constants/animations';
import { Colors, theme } from '@mari-gunting/shared/theme';

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
  iconColor = Colors.primary,
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
          duration: MODAL_ANIMATION.BACKDROP_FADE_IN,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: MODAL_ANIMATION.SPRING.damping,
          stiffness: MODAL_ANIMATION.SPRING.stiffness,
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
          duration: MODAL_ANIMATION.BACKDROP_FADE_OUT,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: MODAL_ANIMATION.SLIDE_DURATION,
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
                  activeOpacity={ACTIVE_OPACITY.PRIMARY}
                >
                  {primaryButton.icon && (
                    <Ionicons
                      name={primaryButton.icon}
                      size={20}
                      color={Colors.white}                       style={styles.buttonIcon}
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
                  activeOpacity={ACTIVE_OPACITY.SECONDARY}
                >
                  {secondaryButton.icon && (
                    <Ionicons
                      name={secondaryButton.icon}
                      size={20}
                      color={Colors.primary}                       style={styles.buttonIcon}
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
    backgroundColor: Colors.white,
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
    color: Colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: Colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.gray[500],
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: '700',
  },
  primaryButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  secondaryButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.3,
  },
  buttonIcon: {
    marginRight: 8,
  },
});
