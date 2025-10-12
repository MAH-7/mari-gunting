import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useProfile } from '@/hooks/useProfile';
import { formatPhoneNumber } from '@/utils/format';

// Helper function to safely get avatar URL
const getAvatarUrl = (user: any) => {
  // Check avatar field
  if (user?.avatar && typeof user.avatar === 'string') {
    const trimmedAvatar = user.avatar.trim();
    if (trimmedAvatar !== '' && !trimmedAvatar.includes('placeholder')) {
      return trimmedAvatar;
    }
  }
  
  // Check avatar_url field
  if (user?.avatar_url && typeof user.avatar_url === 'string') {
    const trimmedAvatarUrl = user.avatar_url.trim();
    if (trimmedAvatarUrl !== '' && !trimmedAvatarUrl.includes('placeholder')) {
      return trimmedAvatarUrl;
    }
  }
  
  // Fallback to placeholder
  return 'https://via.placeholder.com/120';
};

export default function EditProfileScreen() {
  const { profile, updateProfile, updateAvatar, isLoading } = useProfile();
  
  const [name, setName] = useState(profile?.name || profile?.full_name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [avatarUri, setAvatarUri] = useState(getAvatarUrl(profile));
  const [hasChanges, setHasChanges] = useState(false);

  const handleAvatarPick = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photos to change your avatar.'
      );
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    
    try {
      // Validate name
      if (!name || name.trim().length < 2) {
        Alert.alert('Invalid Name', 'Please enter a valid name (at least 2 characters)');
        return;
      }

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email && !emailRegex.test(email)) {
        Alert.alert('Invalid Email', 'Please enter a valid email address');
        return;
      }

      // Upload avatar if changed and not a placeholder
      const profileAvatar = profile.avatar || profile.avatar_url || '';
      if (avatarUri !== profileAvatar && !avatarUri.includes('placeholder')) {
        await updateAvatar(avatarUri);
      }

      // Update profile fields
      if (name !== (profile.name || profile.full_name) || email !== profile.email) {
        await updateProfile({
          full_name: name,
          email: email,
        });
      }

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      setHasChanges(false);
    } catch (error: any) {
      console.error('Save profile error:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to update profile. Please try again.'
      );
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              onPress={handleAvatarPick}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <View style={styles.avatarContainer}>
                <Image 
                  source={{ uri: avatarUri && avatarUri.trim() !== '' ? avatarUri : 'https://via.placeholder.com/120' }} 
                  style={styles.avatar} 
                />
                <View style={styles.avatarEditButton}>
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                </View>
              </View>
              <Text style={styles.avatarHint}>Tap to change photo</Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setHasChanges(true);
                }}
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
                editable={!isLoading}
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setHasChanges(true);
                }}
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
              {email !== profile?.email && (
                <Text style={styles.hint}>
                  Changing email requires verification
                </Text>
              )}
            </View>

            {/* Phone (Read-only) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputDisabled}>
                <Text style={styles.inputDisabledText}>
                  {formatPhoneNumber(profile?.phone || profile?.phone_number || '')}
                </Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#00B14F" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              </View>
              <Text style={styles.hint}>
                Contact support to change phone number
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleSave}
            style={[
              styles.saveButton,
              (!hasChanges || isLoading) && styles.saveButtonDisabled,
            ]}
            disabled={!hasChanges || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
  },
  avatarContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00B14F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarHint: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  formSection: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  inputDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputDisabledText: {
    fontSize: 16,
    color: '#6B7280',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00B14F',
  },
  hint: {
    marginTop: 6,
    fontSize: 13,
    color: '#6B7280',
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  saveButton: {
    backgroundColor: '#00B14F',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
