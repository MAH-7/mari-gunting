import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image, Animated, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '@/shared/constants';
import { profileService } from '@mari-gunting/shared/services/profileService';
import { barberService, BarberProfile } from '@/shared/services/barberService';
import { supabase } from '@/shared/config/supabase';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { BARBER_SPECIALIZATIONS } from '@mari-gunting/shared/constants/specializations';

export default function ProfileEditScreen() {
  const router = useRouter();
  const currentUser = useStore((state) => state.currentUser);
  
  // State
  const [profile, setProfile] = useState<BarberProfile | null>(null);
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    specializations: [] as string[],
  });

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonSlideAnim = useRef(new Animated.Value(200)).current;
  

  // Fetch profile data on mount
  useEffect(() => {
    loadProfile();
  }, [currentUser]);
  
  // Animate on mount
  useEffect(() => {
    if (!isLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading]);
  
  // Animate floating button based on hasChanges
  useEffect(() => {
    Animated.spring(buttonSlideAnim, {
      toValue: hasChanges ? 0 : 200,
      useNativeDriver: true,
      tension: 65,
      friction: 10,
    }).start();
  }, [hasChanges]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      
      if (!currentUser?.id) {
        Alert.alert('Error', 'User not logged in');
        router.back();
        return;
      }

      const barberProfile = await barberService.getBarberProfileByUserId(currentUser.id);
      
      if (barberProfile) {
        setProfile(barberProfile);
        const avatarValue = barberProfile.avatar || null;
        setAvatarUrl(avatarValue);
        
        // Fetch email from profile (now that it exists in the table)
        setEmail(barberProfile.email || '');
        
        // Pre-populate form with real data
        setFormData({
          fullName: barberProfile.name || '',
          bio: barberProfile.bio || '',
          specializations: barberProfile.specializations || [],
        });
      } else {
        throw new Error('Failed to load profile');
      }
    } catch (error) {
      console.error('[EditProfile] Error loading profile:', error);
      Alert.alert(
        'Error', 
        'Failed to load profile data',
        [
          { text: 'Retry', onPress: loadProfile },
          { text: 'Go Back', onPress: () => router.back() }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleSpecialization = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }));
    setHasChanges(true);
  };

  const handlePhotoChange = async () => {
    if (!currentUser?.id) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      
      // Validate URI
      if (!imageUri || typeof imageUri !== 'string' || imageUri.trim() === '') {
        Alert.alert('Error', 'Failed to get image. Please try again.');
        return;
      }

      setUploadingAvatar(true);
      
      try {
        // Delete old avatar file from storage if exists
        if (avatarUrl && avatarUrl.includes('supabase.co/storage')) {
          try {
            
            // Extract file path from URL
            // URL format: https://xxx.supabase.co/storage/v1/object/public/avatars/userId/avatar-123.jpg
            const urlParts = avatarUrl.split('/avatars/');
            if (urlParts.length > 1) {
              const filePath = urlParts[1]; // userId/avatar-123.jpg
              
              const { error: deleteError } = await supabase.storage
                .from('avatars')
                .remove([filePath]);
              
              if (deleteError) {
                // Don't fail the upload if deletion fails
              }
            }
          } catch (cleanupError) {
            // Continue with upload even if cleanup fails
          }
        }
        
        // Upload new avatar
        const updatedProfile = await profileService.updateAvatar(currentUser.id, imageUri);
        
        if (updatedProfile && updatedProfile.avatar_url) {
          setAvatarUrl(updatedProfile.avatar_url);
          
          // Update global store so other screens see the new avatar immediately
          const updatedUser = {
            ...currentUser,
            avatar_url: updatedProfile.avatar_url,
          };
          useStore.getState().setCurrentUser(updatedUser);
          
          Alert.alert('Success!', 'Profile photo uploaded successfully');
          // Don't set hasChanges - avatar is already saved to database
        } else {
          throw new Error('No avatar URL returned from server');
        }
      } catch (error: any) {
        console.error('[EditProfile] Avatar upload failed:', error);
        Alert.alert(
          'Upload Failed',
          error.message || 'Failed to upload photo. Please try again.'
        );
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Name must be at least 3 characters';
    }

    // Phone is read-only, no validation needed

    if (formData.bio.length > 300) {
      newErrors.bio = 'Bio must be less than 300 characters';
    }

    if (formData.specializations.length === 0) {
      newErrors.specializations = 'Please select at least one specialization';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving');
      return;
    }

    if (!currentUser?.id || !profile) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    try {
      setIsSaving(true);
      
      // Check Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.user) {
        throw new Error('Authentication session expired. Please log in again.');
      }

      // 1. Update profile (name only - phone and email are read-only)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id)
        .select();

      if (profileError) {
        throw new Error(`Profile update failed: ${profileError.message}`);
      }
      
      if (!profileData || profileData.length === 0) {
        throw new Error('Profile update failed: No rows returned.');
      }

      // 2. Update barber data (bio, specializations)
      const { data: barberData, error: barberError } = await supabase
        .from('barbers')
        .update({
          bio: formData.bio.trim(),
          specializations: formData.specializations,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', currentUser.id)
        .select();

      if (barberError) {
        throw new Error(`Barber update failed: ${barberError.message}`);
      }
      
      if (!barberData || barberData.length === 0) {
        throw new Error('Barber update failed: No rows returned.');
      }
      
      Alert.alert(
        'Success!',
        'Your profile has been updated successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              setHasChanges(false);
              router.back();
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('[EditProfile] Save failed:', error.message);
      Alert.alert(
        'Update Failed',
        error.message || 'Failed to save changes. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to leave?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Leave', style: 'destructive', onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };
  
  const handleDiscard = () => {
    Alert.alert(
      'Discard Changes?',
      'All your changes will be lost. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Discard', 
          style: 'destructive', 
          onPress: () => {
            // Reset form to original values
            if (profile) {
              setFormData({
                fullName: profile.name || '',
                bio: profile.bio || '',
                specializations: profile.specializations || [],
              });
              setAvatarUrl(profile.avatar || null);
            }
            setHasChanges(false);
            setErrors({});
          }
        }
      ]
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error if no profile
  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Ionicons name="warning-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>Failed to load profile</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadProfile}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleCancel} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View 
          style={[{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }]}
        >
          {/* Avatar Section */}
          <View style={styles.avatarCard}>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={handlePhotoChange}
              activeOpacity={0.8}
              disabled={uploadingAvatar}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={56} color={COLORS.primary} />
                </View>
              )}
              
              <View style={styles.cameraButton}>
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="camera" size={20} color="#FFF" />
                )}
              </View>
              
              {profile?.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={24} color="#7E3AF2" />
                </View>
              )}
            </TouchableOpacity>
            
            <View style={styles.avatarInfo}>
              <View style={styles.avatarTitleRow}>
                <Text style={styles.avatarTitle}>Profile Photo</Text>
                {profile?.isVerified && (
                  <View style={styles.verifiedTag}>
                    <Ionicons name="shield-checkmark" size={14} color="#7E3AF2" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>
              <Text style={styles.avatarHint}>
                {uploadingAvatar ? 'Uploading...' : 'Professional photo helps build trust'}
              </Text>
            </View>
          </View>

          {/* Basic Info Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-circle-outline" size={24} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Basic Information</Text>
            </View>
            
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Full Name *</Text>
              <View style={[styles.fieldInput, errors.fullName && styles.fieldInputError]}>
                <Ionicons name="person-outline" size={20} color={errors.fullName ? COLORS.error : '#666'} />
                <TextInput
                  style={styles.textInput}
                  value={formData.fullName}
                  onChangeText={(value) => handleChange('fullName', value)}
                  placeholder="Enter your full name"
                  placeholderTextColor="#999"
                />
                {formData.fullName.trim() && (
                  <Ionicons name="checkmark-circle" size={20} color="#7E3AF2" />
                )}
              </View>
              {errors.fullName && (
                <Text style={styles.errorText}>{errors.fullName}</Text>
              )}
            </View>

            {/* Email (Read-only) */}
            {email && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Email Address</Text>
                <View style={styles.readOnlyField}>
                  <Ionicons name="mail" size={20} color="#666" />
                  <Text style={styles.readOnlyValue}>{email}</Text>
                  <View style={styles.lockBadge}>
                    <Ionicons name="lock-closed" size={14} color="#999" />
                  </View>
                </View>
                <Text style={styles.readOnlyHint}>Verified email • Cannot be changed here</Text>
              </View>
            )}

            {/* Phone Number (Read-only) */}
            {profile?.phone && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <View style={styles.readOnlyField}>
                  <Ionicons name="call" size={20} color="#666" />
                  <Text style={styles.readOnlyValue}>{profile.phone}</Text>
                  <View style={styles.lockBadge}>
                    <Ionicons name="lock-closed" size={14} color="#999" />
                  </View>
                </View>
                <Text style={styles.readOnlyHint}>Verified phone • Cannot be changed here</Text>
              </View>
            )}
          </View>

          {/* Bio Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Professional Bio</Text>
            </View>
            
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>About You</Text>
                <Text style={[styles.charCount, formData.bio.length > 280 && { color: COLORS.error }]}>
                  {formData.bio.length}/300
                </Text>
              </View>
              <View style={[styles.textAreaContainer, errors.bio && styles.fieldInputError]}>
                <TextInput
                  style={styles.textArea}
                  value={formData.bio}
                  onChangeText={(value) => handleChange('bio', value)}
                  placeholder="Share your experience, specialties, and what makes you unique..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={6}
                  maxLength={300}
                  textAlignVertical="top"
                />
              </View>
              {errors.bio && (
                <Text style={styles.errorText}>{errors.bio}</Text>
              )}
              <Text style={styles.fieldHint}>💡 A detailed bio helps customers choose you</Text>
            </View>
          </View>

          {/* Specializations Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="cut-outline" size={24} color={COLORS.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Specializations</Text>
                <Text style={styles.cardSubtitle}>Select at least one area of expertise</Text>
              </View>
              {formData.specializations.length > 0 && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>{formData.specializations.length}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.chipsContainer}>
              {BARBER_SPECIALIZATIONS.map((spec) => {
                const isSelected = formData.specializations.includes(spec);
                return (
                  <Pressable
                    key={spec}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => toggleSpecialization(spec)}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={16} color="#FFF" />
                    )}
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {spec}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            
            {errors.specializations && (
              <Text style={styles.errorText}>{errors.specializations}</Text>
            )}
          </View>

          <View style={{ height: 120 }} />
        </Animated.View>
      </ScrollView>

      {/* Smart Floating Action Buttons - Only visible when changes detected */}
      {hasChanges && (
        <Animated.View 
          style={[
            styles.floatingButtonContainer,
            {
              transform: [{ translateY: buttonSlideAnim }],
            },
          ]}
        >
          <View style={styles.actionButtons}>
            {/* Discard Button */}
            <TouchableOpacity 
              style={styles.discardButton}
              onPress={handleDiscard}
              activeOpacity={0.8}
              disabled={isSaving}
            >
              <Ionicons name="close-circle-outline" size={22} color="#666" />
              <Text style={styles.discardButtonText}>Discard</Text>
            </TouchableOpacity>
            
            {/* Save Button */}
            <TouchableOpacity 
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <ActivityIndicator size="small" color="#FFF" />
                  <Text style={styles.saveButtonText}>Saving...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  
  // Loading & Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
    marginTop: 12,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },

  // Avatar Card
  avatarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  verifiedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 2,
  },
  avatarInfo: {
    flex: 1,
  },
  avatarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  avatarTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6FAF7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7E3AF2',
  },
  avatarHint: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    lineHeight: 18,
  },

  // Card Section
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginTop: 2,
  },
  selectedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
  },

  // Field Styles
  field: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  fieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  fieldInputError: {
    borderColor: COLORS.error,
    backgroundColor: '#FFF5F5',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    padding: 0,
  },
  fieldHint: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginTop: 8,
  },
  
  // Read-only Field
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  readOnlyValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  lockBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readOnlyHint: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999',
    marginTop: 8,
  },

  // Text Area
  textAreaContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  textArea: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
    minHeight: 140,
    padding: 0,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  charCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#999',
  },

  // Error
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.error,
    marginTop: 8,
    marginLeft: 4,
  },

  // Chips
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  chipTextSelected: {
    color: '#FFF',
    fontWeight: '700',
  },

  // Smart Floating Action Buttons
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  discardButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  discardButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
  },
  saveButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  saveButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.3,
  },
});
