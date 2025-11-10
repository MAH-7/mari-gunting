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
import { formatPhoneNumber } from '@mari-gunting/shared/utils/format';
import { supabase } from '@mari-gunting/shared/config/supabase';
import { Colors, theme } from '@mari-gunting/shared/theme';

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

      // Upload avatar if changed and not a placeholder
      const profileAvatar = profile.avatar || profile.avatar_url || '';
      if (avatarUri !== profileAvatar && !avatarUri.includes('placeholder')) {
        // Delete old avatar file from storage if exists
        if (profileAvatar && profileAvatar.includes('supabase.co/storage')) {
          try {
            // Extract file path from URL
            // URL format: https://xxx.supabase.co/storage/v1/object/public/avatars/userId/avatar-123.jpg
            const urlParts = profileAvatar.split('/avatars/');
            if (urlParts.length > 1) {
              const filePath = urlParts[1]; // userId/avatar-123.jpg
              
              const { error: deleteError } = await supabase.storage
                .from('avatars')
                .remove([filePath]);
              
              if (deleteError) {
                console.warn('Could not delete old avatar:', deleteError);
                // Don't fail the upload if deletion fails
              } else {
                console.log('✅ Old avatar deleted:', filePath);
              }
            }
          } catch (cleanupError) {
            console.warn('Avatar cleanup error:', cleanupError);
            // Continue with upload even if cleanup fails
          }
        }
        
        // Upload new avatar
        await updateAvatar(avatarUri);
      }

      // Update profile fields
      if (name !== (profile.name || profile.full_name)) {
        await updateProfile({
          full_name: name,
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
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
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
                  <Ionicons name="camera" size={20} color={Colors.white} />
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
                placeholderTextColor={Colors.gray[400]}
                editable={!isLoading}
              />
            </View>

            {/* Email (Read-only) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputDisabled}>
                <Text style={styles.inputDisabledText}>
                  {profile?.email || 'Not set'}
                </Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              </View>
              <Text style={styles.hint}>
                Contact support to change email
              </Text>
            </View>

            {/* Phone (Read-only) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputDisabled}>
                <Text style={styles.inputDisabledText}>
                  {formatPhoneNumber(profile?.phone || profile?.phone_number || '')}
                </Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
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
              <ActivityIndicator color={Colors.white} />
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
    backgroundColor: Colors.backgroundSecondary,
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
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: Colors.white,
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
    backgroundColor: Colors.gray[100],
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarHint: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.gray[500],
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
    color: Colors.gray[700],
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text.primary,
  },
  inputDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputDisabledText: {
    fontSize: 16,
    color: Colors.gray[500],
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  hint: {
    marginTop: 6,
    fontSize: 13,
    color: Colors.gray[500],
  },
  footer: {
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: Colors.gray[300],
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
