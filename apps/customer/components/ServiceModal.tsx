import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, theme } from '@mari-gunting/shared/theme';

interface ServiceModalProps {
  visible: boolean;
  onClose: () => void;
  onServiceAction: (action: 'quick-book' | 'barbers' | 'barbershops') => void;
}

export function ServiceModal({ visible, onClose, onServiceAction }: ServiceModalProps) {
  const handleQuickBook = () => onServiceAction('quick-book');
  const handleChooseBarber = () => onServiceAction('barbers');
  const handleBarbershop = () => onServiceAction('barbershops');

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.container}>
          <View style={styles.handle} />
          
          {/* Quick Book */}
          <TouchableOpacity
            style={styles.option}
            onPress={handleQuickBook}
            activeOpacity={0.6}
          >
            <View style={styles.iconWrapper}>
              <View style={[styles.iconGradient, { backgroundColor: Colors.warning }]}>
                <Ionicons name="flash" size={24} color={Colors.white} />
              </View>
            </View>
            <View style={styles.textWrapper}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>Quick Book</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Fastest</Text>
                </View>
              </View>
              <Text style={styles.subtitle}>Auto-match with nearest barber</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
          </TouchableOpacity>

          {/* Choose Barber */}
          <TouchableOpacity
            style={styles.option}
            onPress={handleChooseBarber}
            activeOpacity={0.6}
          >
            <View style={styles.iconWrapper}>
              <View style={[styles.iconGradient, { backgroundColor: Colors.info }]}>
                <Ionicons name="people" size={24} color={Colors.white} />
              </View>
            </View>
            <View style={styles.textWrapper}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>Choose Barber</Text>
                <View style={[styles.badge, styles.badgeBlue]}>
                  <Text style={[styles.badgeText, styles.badgeTextBlue]}>Popular</Text>
                </View>
              </View>
              <Text style={styles.subtitle}>Browse profiles & select your favorite</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
          </TouchableOpacity>

          {/* Barbershop */}
          <TouchableOpacity
            style={[styles.option, styles.lastOption]}
            onPress={handleBarbershop}
            activeOpacity={0.6}
          >
            <View style={styles.iconWrapper}>
              <View style={[styles.iconGradient, { backgroundColor: Colors.primary }]}>
                <Ionicons name="storefront" size={24} color={Colors.white} />
              </View>
            </View>
            <View style={styles.textWrapper}>
              <Text style={styles.title}>Barbershop</Text>
              <Text style={styles.subtitle}>Visit nearby salon locations</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 32,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.gray[200],
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  lastOption: {
    marginBottom: 0,
  },
  iconWrapper: {
    marginRight: 14,
  },
  iconGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textWrapper: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginRight: 8,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.gray[500],
    lineHeight: 18,
  },
  badge: {
    backgroundColor: Colors.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 0.3,
  },
  badgeBlue: {
    backgroundColor: Colors.infoLight,
  },
  badgeTextBlue: {
    color: '#2563EB',
  },
});
