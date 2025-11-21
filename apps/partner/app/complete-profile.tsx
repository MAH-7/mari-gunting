import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '@mari-gunting/shared/services/authService';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { profileService } from '@mari-gunting/shared/services/profileService';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { Colors, theme } from '@mari-gunting/shared/theme';

export default function CompleteProfileScreen() {
  const params = useLocalSearchParams();
  const phoneNumber = params.phoneNumber as string || '';
  const role = (params.role as 'customer' | 'barber') || 'barber';
  const logout = useStore((state) => state.logout);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? You can login again with a different number.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photos to upload a profile picture',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        // Resize to reasonable avatar size
        maxWidth: 512,
        maxHeight: 512,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        
        // Validate URI
        if (!uri || typeof uri !== 'string' || uri.trim() === '') {
          Alert.alert('Error', 'Failed to get image. Please try again.');
          return;
        }

        // Compress image
        const compressedImage = await ImageManipulator.manipulateAsync(
          uri,
          [
            { resize: { width: 800 } },
          ],
          {
            compress: 0.8,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

        // Store locally only - will upload after registration
        setAvatar(compressedImage.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleRegister = async () => {
    // Validation
    if (!fullName.trim()) {
      Alert.alert('Required', 'Please enter your full name');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (!avatar) {
      Alert.alert('Profile Photo Required', 'Please upload your profile photo. Customers need to see who will be serving them.');
      return;
    }

    setIsLoading(true);

    try {
      // Check if user already exists (customer upgrading to barber)
      const existingUserCheck = await authService.checkPhoneExists(phoneNumber);
      
      if (existingUserCheck.success && existingUserCheck.data?.exists) {
        console.log('ℹ️ Existing customer upgrading to barber partner');
        // Handle existing customer - DON'T call register again
        // Just proceed to account type selection
        // The barber role will be added when they complete onboarding
        Alert.alert(
          'Welcome Back!',
          'Let\'s set up your barber account.',
          [
            {
              text: 'Continue',
              onPress: () => router.replace('/select-account-type'),
            },
          ]
        );
        return;
      }
      
      // Step 1: Register NEW user with Supabase with temporary 'barber' role (no avatar yet)
      // After account type selection, role will be finalized:
      // - Freelance: stays 'barber' + creates barbers table record
      // - Barbershop: updates to 'barbershop_owner' + creates barbershops table record
      const response = await authService.register({
        phoneNumber,
        fullName,
        email: email.toLowerCase(),
        role: 'barber', // Temporary - updated in account type selection
        avatarUrl: null, // Will upload after registration
      });

      if (!response.success) {
        Alert.alert(
          'Registration Failed',
          response.error || 'Unable to complete registration.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get user ID for avatar upload
      const userId = response.data?.id;
      
      if (!userId) {
        Alert.alert('Error', 'Failed to get user ID. Please try again.');
        return;
      }

      console.log('✅ User registered successfully:', userId);

      // Step 2: Upload avatar if selected (post-registration)
      let avatarUrl = null;
      if (avatar) {
        try {
          console.log('📤 Uploading avatar to UID folder:', userId);
          const updatedProfile = await profileService.updateAvatar(userId, avatar);
          avatarUrl = updatedProfile.avatar_url || updatedProfile.avatar;
          console.log('✅ Avatar uploaded successfully:', avatarUrl);
        } catch (uploadError) {
          console.error('⚠️ Avatar upload failed (non-critical):', uploadError);
          // Don't fail registration if avatar upload fails
          // User can update avatar later from profile
        }
      }
      
      // Step 3: Fetch the complete updated profile to ensure we have all data
      try {
        const finalProfile = await profileService.getProfile(userId);
        console.log('✅ Final profile fetched:', {
          id: finalProfile.id,
          avatar_url: finalProfile.avatar_url,
          full_name: finalProfile.full_name,
        });
        
        // The profile will be loaded properly on next screen
        // No need to manually set it here since select-account-type will handle routing
      } catch (profileError) {
        console.error('⚠️ Could not fetch profile:', profileError);
        // Non-critical, proceed anyway
      }
      
      Alert.alert(
        'Welcome to Mari-Gunting Partner!',
        'Your account has been created successfully. Let\'s set up your business.',
        [
          {
            text: 'Continue',
            onPress: () => router.replace({
              pathname: '/select-account-type',
              params: { userId },
            }),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error.message || 'Unable to complete registration. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = fullName.trim() && email.trim() && validateEmail(email) && avatar;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Phone Number & Logout */}
          <View style={styles.header}>
            <View style={{ width: 40 }} />
            
            <View style={styles.headerCenter}>
              <Text style={styles.phoneNumberLabel}>Logged in as</Text>
              <Text style={styles.phoneNumberText}>{phoneNumber}</Text>
            </View>
            
            <TouchableOpacity
              style={styles.logoutIconButton}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={22} color={Colors.error} />
            </TouchableOpacity>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Tell us about yourself to get started as a partner
            </Text>
          </View>

          {/* Avatar Upload */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handlePickImage}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={48} color={Colors.gray[400]} />
                </View>
              )}
              <View style={styles.avatarBadge}>
                <Ionicons name="camera" size={16} color={Colors.white} />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarLabel}>
              Upload Photo <Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.avatarHint}>Required for verification</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Full Name <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={Colors.gray[500]} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor={Colors.gray[400]}                   value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Email Address <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={Colors.gray[500]} />
                <TextInput
                  style={styles.input}
                  placeholder="your.email@example.com"
                  placeholderTextColor={Colors.gray[400]}                   value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Phone Number (Read-only) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={[styles.inputContainer, styles.inputDisabled]}>
                <Ionicons name="call-outline" size={20} color={Colors.gray[500]} />
                <TextInput
                  style={[styles.input, styles.inputTextDisabled]}
                  value={phoneNumber}
                  editable={false}
                />
                <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.helperText}>Verified via OTP</Text>
            </View>

            {/* Role Badge */}
            <View style={styles.roleSection}>
              <View style={styles.roleCard}>
                <View style={styles.roleIconContainer}>
                  <Ionicons name="cut" size={24} color={Colors.primary} />
                </View>
                <View style={styles.roleContent}>
                  <Text style={styles.roleLabel}>Registering as</Text>
                  <Text style={styles.roleValue}>Barber Partner</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[
              styles.registerButton,
              (!isFormValid || isLoading) && styles.registerButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={!isFormValid || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <Text style={styles.registerButtonText}>Complete Registration</Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.white} />
              </>
            )}
          </TouchableOpacity>

          {/* Terms */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By registering, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  phoneNumberLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.gray[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  phoneNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 2,
  },
  logoutIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.gray[500],
    lineHeight: 22,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.gray[100],
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.gray[200],
    borderStyle: 'dashed',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  avatarLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: 4,
  },
  avatarHint: {
    fontSize: 13,
    color: Colors.gray[400],
  },
  formSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: 8,
  },
  required: {
    color: Colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  inputDisabled: {
    backgroundColor: Colors.gray[100],
    borderColor: Colors.gray[300],
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  inputTextDisabled: {
    color: Colors.gray[500],
  },
  helperText: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 6,
    marginLeft: 4,
  },
  roleSection: {
    marginTop: 8,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.primaryBorder,
    borderRadius: 12,
    padding: 16,
  },
  roleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roleContent: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 12,
    color: Colors.primaryText,
    fontWeight: '500',
    marginBottom: 2,
  },
  roleValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 56,
    gap: 8,
  },
  registerButtonDisabled: {
    backgroundColor: Colors.gray[300],
    shadowOpacity: 0,
    elevation: 0,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  termsContainer: {
    paddingHorizontal: 32,
    marginTop: 20,
  },
  termsText: {
    fontSize: 13,
    color: Colors.gray[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
