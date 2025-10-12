# 🚀 PHASE 1: QUICK START GUIDE
## Critical Profile Features (Week 1-2)

---

## 📋 IMPLEMENTATION ORDER

### Day 1-2: Setup & Infrastructure
1. ✅ Create database schemas
2. ✅ Create service files
3. ✅ Create type definitions

### Day 3-5: Edit Profile
1. ✅ Build edit profile screen
2. ✅ Implement avatar upload
3. ✅ Add form validation
4. ✅ Connect to API

### Day 6-7: Real Stats
1. ✅ Create stats service
2. ✅ Connect to bookings API
3. ✅ Update profile screen

### Day 8-9: Loading & Error States
1. ✅ Add skeleton loaders
2. ✅ Implement error handling
3. ✅ Add retry mechanisms

### Day 10: Testing & Polish
1. ✅ Test all flows
2. ✅ Fix bugs
3. ✅ Polish UI

---

## 🗂️ FILES TO CREATE

```
packages/shared/
├── services/
│   ├── profileService.ts       ⭐ NEW
│   ├── statsService.ts         ⭐ NEW
│   └── verificationService.ts  ⭐ NEW
├── types/
│   └── profile.ts              ⭐ NEW
└── hooks/
    └── useProfile.ts           ⭐ NEW

apps/customer/
├── app/
│   └── profile/
│       ├── edit.tsx            ⭐ NEW
│       └── security/
│           └── change-password.tsx ⭐ NEW (Phase 3)
└── components/
    └── ProfileSkeleton.tsx     ⭐ NEW
```

---

## 🛠️ STEP-BY-STEP IMPLEMENTATION

### STEP 1: Database Setup (15 mins)

Run these SQL commands in Supabase SQL Editor:

```sql
-- Add missing profile columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP DEFAULT NOW();

-- Create stats view for performance
CREATE OR REPLACE VIEW user_booking_stats AS
SELECT 
  customer_id as user_id,
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
  ROUND(AVG(CASE WHEN rating IS NOT NULL THEN rating END), 1) as avg_rating
FROM bookings
GROUP BY customer_id;
```

---

### STEP 2: Create Profile Service (30 mins)

**File:** `packages/shared/services/profileService.ts`

```typescript
import { api } from './api';
import { uploadToCloudinary } from './cloudinaryUpload';

export interface UpdateProfileInput {
  full_name?: string;
  email?: string;
  avatar_url?: string;
}

export const profileService = {
  /**
   * Get user profile by ID
   */
  async getProfile(userId: string) {
    try {
      const { data, error } = await api
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[profileService] getProfile error:', error);
      throw error;
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: UpdateProfileInput) {
    try {
      const { data, error } = await api
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[profileService] updateProfile error:', error);
      throw error;
    }
  },

  /**
   * Upload avatar to Cloudinary and update profile
   */
  async updateAvatar(userId: string, imageUri: string) {
    try {
      // 1. Upload to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(imageUri, 'avatars');
      
      // 2. Update profile with new URL
      const { data, error } = await api
        .from('profiles')
        .update({ 
          avatar_url: cloudinaryUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[profileService] updateAvatar error:', error);
      throw error;
    }
  },

  /**
   * Refresh profile from database
   */
  async refreshProfile(userId: string) {
    return this.getProfile(userId);
  },
};
```

---

### STEP 3: Create Stats Service (20 mins)

**File:** `packages/shared/services/statsService.ts`

```typescript
import { api } from './api';

export interface UserStats {
  total: number;
  completed: number;
  cancelled: number;
  avgRating: string;
}

export const statsService = {
  /**
   * Get user booking statistics
   */
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      // Use the view we created for better performance
      const { data, error } = await api
        .from('user_booking_stats')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        // If no stats found (new user), return zeros
        if (error.code === 'PGRST116') {
          return {
            total: 0,
            completed: 0,
            cancelled: 0,
            avgRating: '0.0',
          };
        }
        throw error;
      }

      return {
        total: data.total_bookings || 0,
        completed: data.completed_bookings || 0,
        cancelled: 0, // Can add this to view if needed
        avgRating: data.avg_rating?.toFixed(1) || '0.0',
      };
    } catch (error) {
      console.error('[statsService] getUserStats error:', error);
      throw error;
    }
  },

  /**
   * Get detailed booking breakdown
   */
  async getBookingBreakdown(userId: string) {
    try {
      const { data, error } = await api
        .from('bookings')
        .select('status')
        .eq('customer_id', userId);
      
      if (error) throw error;

      const breakdown = {
        pending: 0,
        confirmed: 0,
        ongoing: 0,
        completed: 0,
        cancelled: 0,
      };

      data.forEach(booking => {
        breakdown[booking.status] = (breakdown[booking.status] || 0) + 1;
      });

      return breakdown;
    } catch (error) {
      console.error('[statsService] getBookingBreakdown error:', error);
      throw error;
    }
  },
};
```

---

### STEP 4: Create Profile Hook (25 mins)

**File:** `packages/shared/hooks/useProfile.ts`

```typescript
import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { profileService } from '@/services/profileService';
import { statsService, UserStats } from '@/services/statsService';

export const useProfile = () => {
  const currentUser = useStore((state) => state.currentUser);
  const setCurrentUser = useStore((state) => state.setCurrentUser);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    completed: 0,
    cancelled: 0,
    avgRating: '0.0',
  });

  // Load stats on mount
  useEffect(() => {
    if (currentUser) {
      loadStats();
    }
  }, [currentUser?.id]);

  const loadStats = async () => {
    if (!currentUser) return;
    
    setIsLoadingStats(true);
    setError(null);
    
    try {
      const data = await statsService.getUserStats(currentUser.id);
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
      setError('Failed to load statistics');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const refreshProfile = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await profileService.refreshProfile(currentUser.id);
      setCurrentUser(data);
    } catch (err) {
      console.error('Failed to refresh profile:', err);
      setError('Failed to refresh profile');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<typeof currentUser>) => {
    if (!currentUser) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await profileService.updateProfile(currentUser.id, updates);
      setCurrentUser({ ...currentUser, ...data });
      return data;
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update profile');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAvatar = async (imageUri: string) => {
    if (!currentUser) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await profileService.updateAvatar(currentUser.id, imageUri);
      setCurrentUser({ ...currentUser, ...data });
      return data;
    } catch (err) {
      console.error('Failed to update avatar:', err);
      setError('Failed to update avatar');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    profile: currentUser,
    stats,
    isLoading,
    isLoadingStats,
    error,
    refreshProfile,
    updateProfile,
    updateAvatar,
    loadStats,
  };
};
```

---

### STEP 5: Create Edit Profile Screen (60 mins)

**File:** `apps/customer/app/profile/edit.tsx`

```typescript
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

export default function EditProfileScreen() {
  const { profile, updateProfile, updateAvatar, isLoading } = useProfile();
  
  const [name, setName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [avatarUri, setAvatarUri] = useState(profile?.avatar_url || '');
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      // Upload avatar if changed
      if (avatarUri !== profile.avatar_url) {
        await updateAvatar(avatarUri);
      }

      // Update profile fields
      if (name !== profile.full_name || email !== profile.email) {
        await updateProfile({
          full_name: name,
          email: email,
        });
      }

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to update profile. Please try again.'
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
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
            <TouchableOpacity
              onPress={handleAvatarPick}
              style={styles.avatarEditButton}
              disabled={isLoading}
            >
              <Ionicons name="camera" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Tap to change photo</Text>
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
              <Text style={styles.hint}>
                Changing email requires verification
              </Text>
            </View>

            {/* Phone (Read-only) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputDisabled}>
                <Text style={styles.inputDisabledText}>
                  {profile?.phone_number}
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
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 32,
    right: '50%',
    marginRight: -60 + 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00B14F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarHint: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
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
```

---

### STEP 6: Update Profile Screen with Real Stats (30 mins)

**File:** `apps/customer/app/(tabs)/profile.tsx`

Add this at the top of the component:

```typescript
import { useProfile } from '@/hooks/useProfile';

export default function ProfileScreen() {
  const { profile, stats, isLoadingStats, error, loadStats } = useProfile();
  
  // ... existing code ...

  // Replace hardcoded stats section with:
  {profile?.role === 'customer' && (
    <View style={styles.statsSection}>
      {isLoadingStats ? (
        <>
          <View style={styles.statCard}>
            <SkeletonText width={60} height={28} />
            <SkeletonText width={80} height={13} style={{ marginTop: 4 }} />
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <SkeletonText width={60} height={28} />
            <SkeletonText width={80} height={13} style={{ marginTop: 4 }} />
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <SkeletonText width={60} height={28} />
            <SkeletonText width={80} height={13} style={{ marginTop: 4 }} />
          </View>
        </>
      ) : (
        <>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Bookings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.avgRating}</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
        </>
      )}
    </View>
  )}
```

Add navigation to edit screen on avatar edit button:

```typescript
<TouchableOpacity 
  style={styles.editBadge}
  onPress={() => router.push('/profile/edit')}
>
  <Ionicons name="pencil" size={14} color="#00B14F" />
</TouchableOpacity>
```

---

### STEP 7: Create Profile Skeleton (15 mins)

**File:** `apps/customer/components/ProfileSkeleton.tsx`

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonCircle, SkeletonText } from '@/components/Skeleton';

export const ProfileSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Avatar */}
      <SkeletonCircle size={100} />
      
      {/* Name */}
      <SkeletonText width={200} height={26} style={{ marginTop: 16 }} />
      
      {/* Role Badge */}
      <SkeletonText width={100} height={24} style={{ marginTop: 8 }} />
      
      {/* Contact Info */}
      <View style={styles.contactSection}>
        <SkeletonText width="100%" height={50} style={{ marginBottom: 10 }} />
        <SkeletonText width="100%" height={50} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#00B14F',
  },
  contactSection: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 24,
  },
});
```

---

## ✅ TESTING CHECKLIST

### Manual Testing
- [ ] Edit profile name and save
- [ ] Upload new avatar
- [ ] Try to change email
- [ ] View stats with real data
- [ ] Test loading states
- [ ] Test error states
- [ ] Test on slow network
- [ ] Test offline mode

### Edge Cases
- [ ] Very long names (>50 chars)
- [ ] Invalid email formats
- [ ] Large avatar images (>10MB)
- [ ] Network timeouts
- [ ] Supabase errors

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue: Avatar upload fails
**Solution:** Check Cloudinary credentials in `.env`

### Issue: Stats not loading
**Solution:** Verify the SQL view was created correctly

### Issue: Profile not updating in real-time
**Solution:** Make sure you're calling `setCurrentUser` after update

### Issue: Image picker not working
**Solution:** Check permissions in `app.json`

---

## 📊 SUCCESS CRITERIA

✅ **Profile Edit Completion Rate > 80%**
- Track with analytics: `profileEditCompleted` event

✅ **Avatar Upload Success Rate > 95%**
- Track upload failures with Sentry

✅ **Stats Loading Time < 2s**
- Monitor with performance tracking

---

## 🚀 DEPLOYMENT

1. Test on real device
2. Run `expo build`
3. Submit to TestFlight/Play Console
4. Monitor crash reports
5. Collect user feedback

---

## 📞 NEED HELP?

- Check main roadmap: `PROFILE_PRODUCTION_ROADMAP.md`
- Review Supabase docs: https://supabase.com/docs
- Test Cloudinary: https://cloudinary.com/documentation

---

**Estimated Time:** 2-3 days for experienced dev, 4-5 days for junior dev
