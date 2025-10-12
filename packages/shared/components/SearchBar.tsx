import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  onLocationPress?: () => void;
  showFilterButton?: boolean;
  showLocationButton?: boolean;
  style?: ViewStyle;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search barbershops...',
  onFilterPress,
  onLocationPress,
  showFilterButton = true,
  showLocationButton = true,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Main Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={Colors.text.secondary} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.tertiary}
          returnKeyType="search"
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={() => onChangeText('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color={Colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {showLocationButton && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onLocationPress}
            activeOpacity={0.7}
          >
            <Ionicons name="location-outline" size={22} color={Colors.primary} />
          </TouchableOpacity>
        )}

        {showFilterButton && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onFilterPress}
            activeOpacity={0.7}
          >
            <Ionicons name="options-outline" size={22} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
    ...Shadows.sm,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    paddingVertical: 0, // Remove default padding
  },
  clearButton: {
    padding: Spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    width: 48,
    height: 48,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
});
