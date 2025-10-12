# 🚀 PROFILE SCREEN - PRODUCTION ROADMAP
## Mari Gunting Customer App | Grab/Gojek Production Standard

---

## 📋 OVERVIEW

**Goal:** Transform the profile screen from MVP to production-ready following Grab/Gojek standards  
**Timeline:** 6 weeks  
**Philosophy:** "If it's on screen, it MUST work flawlessly"

---

## 🎯 PHASE 1: CRITICAL PROFILE FEATURES
**Timeline:** Week 1-2  
**Priority:** 🔥 CRITICAL

### 1.1 Edit Profile Implementation
**Status:** ❌ Not Implemented  
**Current Issue:** Edit badge exists but doesn't work

#### Files to Create/Modify:
```
app/profile/edit.tsx                    # Edit profile screen
services/profileService.ts              # Profile CRUD operations  
hooks/useProfile.ts                     # Profile data hooks
types/profile.ts                        # Profile type definitions
```

#### Features:
- ✅ Edit full name (validation)
- ✅ Edit email (with verification required)
- ✅ Avatar upload + crop functionality
- ✅ Phone number display (read-only, verified)
- ✅ Optimistic UI updates
- ✅ Error handling & retry
- ✅ Loading states

#### Implementation Details:

**1. Avatar Upload with Cloudinary**
```typescript
// services/profileService.ts
import { uploadToCloudinary } from './cloudinaryUpload';
import { api } from './api';

export const profileService = {
  async updateAvatar(userId: string, imageUri: string) {
    try {
      // Upload to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(imageUri, 'avatars');
      
      // Update Supabase profile
      const { data, error } = await api
        .from('profiles')
        .update({ avatar_url: cloudinaryUrl })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Avatar upload failed:', error);
      throw error;
    }
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await api
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getProfile(userId: string) {
    const { data, error } = await api
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }
};
```

**2. Edit Profile Screen**
```typescript
// app/profile/edit.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '@/store/useStore';
import { profileService } from '@/services/profileService';

export default function EditProfileScreen() {
  const currentUser = useStore((state) => state.currentUser);
  const setCurrentUser = useStore((state) => state.setCurrentUser);
  
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleAvatarPick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      // Upload avatar if changed
      if (avatar !== currentUser.avatar) {
        await profileService.updateAvatar(currentUser.id, avatar);
      }

      // Update profile
      const updated = await profileService.updateProfile(currentUser.id, {
        full_name: name,
        email: email,
      });

      // Update store
      setCurrentUser({ ...currentUser, ...updated });
      
      Alert.alert('Success', 'Profile updated successfully!');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ... UI implementation
}
```

---

### 1.2 Real Stats Integration
**Status:** ❌ Currently Mock Data  
**Current Issue:** Hardcoded stats (12, 9, 4.8)

#### API Integration:
```typescript
// services/statsService.ts
export const statsService = {
  async getUserStats(userId: string) {
    const { data: bookings, error } = await api
      .from('bookings')
      .select('status, rating')
      .eq('customer_id', userId);
    
    if (error) throw error;

    const total = bookings.length;
    const completed = bookings.filter(b => b.status === 'completed').length;
    const avgRating = bookings
      .filter(b => b.rating)
      .reduce((sum, b) => sum + b.rating, 0) / completed || 0;

    return { total, completed, avgRating: avgRating.toFixed(1) };
  }
};
```

#### Update Profile Screen:
```typescript
// Add to profile.tsx
const [stats, setStats] = useState({ total: 0, completed: 0, avgRating: '0.0' });
const [isLoadingStats, setIsLoadingStats] = useState(true);

useEffect(() => {
  if (currentUser) {
    loadStats();
  }
}, [currentUser]);

const loadStats = async () => {
  try {
    const data = await statsService.getUserStats(currentUser.id);
    setStats(data);
  } catch (error) {
    console.error('Failed to load stats:', error);
  } finally {
    setIsLoadingStats(false);
  }
};
```

---

### 1.3 Loading States & Error Handling
**Status:** ❌ Not Implemented

#### Add Skeleton Loaders:
```typescript
// components/ProfileSkeleton.tsx
export const ProfileSkeleton = () => (
  <View style={styles.container}>
    <SkeletonCircle size={100} />
    <SkeletonText width={200} height={24} style={{ marginTop: 16 }} />
    <SkeletonText width={150} height={16} style={{ marginTop: 8 }} />
  </View>
);
```

#### Add Error States:
```typescript
const [error, setError] = useState<string | null>(null);

if (error) {
  return (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={48} color="#EF4444" />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity onPress={retry} style={styles.retryButton}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## 🎯 PHASE 2: ACCOUNT & NAVIGATION
**Timeline:** Week 2-3  
**Priority:** 🔥 HIGH

### 2.1 My Addresses Screen
**Status:** ⚠️ Partially Implemented  
**File:** `app/profile/addresses.tsx` (exists but needs completion)

#### Features Required:
- ✅ List all saved addresses
- ✅ Add new address (with map picker)
- ✅ Edit existing address
- ✅ Delete address
- ✅ Set default address
- ✅ Search address with autocomplete

#### Database Schema:
```sql
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  label VARCHAR(50) NOT NULL, -- 'Home', 'Work', 'Other'
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(10) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_addresses_user ON addresses(user_id);
```

#### Implementation:
```typescript
// services/addressService.ts
export const addressService = {
  async getAddresses(userId: string) {
    const { data, error } = await api
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createAddress(address: CreateAddressInput) {
    const { data, error } = await api
      .from('addresses')
      .insert(address)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateAddress(id: string, updates: Partial<Address>) {
    const { data, error } = await api
      .from('addresses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteAddress(id: string) {
    const { error } = await api
      .from('addresses')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async setDefaultAddress(userId: string, addressId: string) {
    // Unset all defaults first
    await api
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userId);
    
    // Set new default
    const { data, error } = await api
      .from('addresses')
      .update({ is_default: true })
      .eq('id', addressId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
```

---

### 2.2 Payment Methods Screen
**Status:** ❌ Not Implemented  
**File:** Create `app/profile/payment-methods.tsx`

#### Features Required:
- ✅ List all payment methods
- ✅ Add credit/debit card (Stripe/iPay88)
- ✅ Add e-wallet (TNG, GrabPay, Boost)
- ✅ Set default payment method
- ✅ Delete payment method
- ✅ Secure card display (last 4 digits)

#### Database Schema:
```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- 'card', 'ewallet'
  provider VARCHAR(50) NOT NULL, -- 'visa', 'mastercard', 'tng', 'grabpay'
  last_four VARCHAR(4),
  card_brand VARCHAR(20),
  expiry_month INTEGER,
  expiry_year INTEGER,
  cardholder_name VARCHAR(100),
  token TEXT NOT NULL, -- Encrypted payment token
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
```

#### Integration with Payment Gateway:
```typescript
// services/paymentService.ts
import { loadStripe } from '@stripe/stripe-react-native';

export const paymentService = {
  async addCard(cardDetails: CardDetails) {
    // Initialize Stripe
    const stripe = await loadStripe(process.env.STRIPE_PUBLIC_KEY!);
    
    // Create payment method
    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardDetails,
    });

    if (error) throw error;

    // Save to backend
    const { data, error: dbError } = await api
      .from('payment_methods')
      .insert({
        type: 'card',
        provider: paymentMethod.card.brand,
        last_four: paymentMethod.card.last4,
        token: paymentMethod.id,
        // ... other fields
      })
      .select()
      .single();

    if (dbError) throw dbError;
    return data;
  },

  async getPaymentMethods(userId: string) {
    const { data, error } = await api
      .from('payment_methods')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};
```

---

### 2.3 Favorite Barbers Screen
**Status:** ❌ Not Implemented  
**File:** Create `app/profile/favorites.tsx`

#### Features:
- ✅ List favorited barbers
- ✅ Remove from favorites
- ✅ Quick book with favorite barber
- ✅ View barber profile
- ✅ Empty state with CTA

#### Database Schema:
```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, barber_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
```

---

### 2.4 Booking History Screen
**Status:** ⚠️ Exists but needs enhancement  
**File:** `app/(tabs)/bookings.tsx`

#### Add Features:
- ✅ Filter by status (upcoming, completed, cancelled)
- ✅ Search by barber name
- ✅ Rebook functionality
- ✅ Leave review (if completed)
- ✅ Cancel booking (with policy)
- ✅ Receipt download

---

## 🎯 PHASE 3: SECURITY & VERIFICATION
**Timeline:** Week 3-4  
**Priority:** 🔒 HIGH

### 3.1 Email/Phone Verification Badges
**Status:** ❌ Not Implemented

#### UI Enhancement:
```typescript
// Add verification badges to profile header
<View style={styles.contactRow}>
  <Ionicons name="mail" size={18} color="#FFFFFF" />
  <Text style={styles.contactText}>{currentUser.email}</Text>
  {currentUser.email_verified && (
    <View style={styles.verifiedBadge}>
      <Ionicons name="checkmark-circle" size={16} color="#00B14F" />
    </View>
  )}
</View>
```

#### Database Update:
```sql
ALTER TABLE profiles 
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN email_verified_at TIMESTAMP,
ADD COLUMN phone_verified BOOLEAN DEFAULT TRUE, -- Already verified during SMS OTP
ADD COLUMN phone_verified_at TIMESTAMP DEFAULT NOW();
```

#### Email Verification Flow:
```typescript
// services/verificationService.ts
export const verificationService = {
  async sendEmailVerification(userId: string, email: string) {
    const { data, error } = await api.auth.updateUser({ 
      email 
    });
    
    if (error) throw error;
    
    // Supabase automatically sends verification email
    return data;
  },

  async checkEmailVerified(userId: string) {
    const { data: user } = await api.auth.getUser();
    return user?.user?.email_confirmed_at !== null;
  }
};
```

---

### 3.2 Change Password
**Status:** ❌ Not Implemented  
**File:** Create `app/profile/security/change-password.tsx`

#### Features:
- ✅ Current password verification
- ✅ New password with strength indicator
- ✅ Confirm password matching
- ✅ Password requirements display
- ✅ Success notification

#### Implementation:
```typescript
// app/profile/security/change-password.tsx
export const changePassword = async (currentPassword: string, newPassword: string) => {
  try {
    // Verify current password
    const { data: { user } } = await api.auth.getUser();
    
    const { error: signInError } = await api.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });
    
    if (signInError) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    const { error: updateError } = await api.auth.updateUser({
      password: newPassword,
    });

    if (updateError) throw updateError;

    Alert.alert('Success', 'Password changed successfully!');
    router.back();
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

---

### 3.3 Two-Factor Authentication (2FA)
**Status:** ❌ Not Implemented  
**File:** Create `app/profile/security/two-factor.tsx`

#### Features:
- ✅ Enable/Disable 2FA
- ✅ QR code generation (TOTP)
- ✅ Backup codes
- ✅ SMS fallback

#### Implementation with TOTP:
```typescript
// services/twoFactorService.ts
import * as Crypto from 'expo-crypto';

export const twoFactorService = {
  async generateSecret() {
    const secret = await Crypto.randomUUID();
    const qrCode = `otpauth://totp/MariGunting:${user.email}?secret=${secret}&issuer=MariGunting`;
    return { secret, qrCode };
  },

  async enableTwoFactor(userId: string, secret: string, code: string) {
    // Verify code first
    const isValid = await this.verifyCode(secret, code);
    if (!isValid) throw new Error('Invalid code');

    // Save to database
    const { error } = await api
      .from('profiles')
      .update({ 
        two_factor_enabled: true,
        two_factor_secret: secret 
      })
      .eq('id', userId);

    if (error) throw error;
  },

  async verifyCode(secret: string, code: string) {
    // Use TOTP library (e.g., otplib)
    const totp = new TOTP({ secret });
    return totp.verify({ token: code });
  }
};
```

---

### 3.4 Login Activity Tracking
**Status:** ❌ Not Implemented  
**File:** Create `app/profile/security/login-activity.tsx`

#### Database Schema:
```sql
CREATE TABLE login_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ip_address VARCHAR(45),
  device_info TEXT,
  location TEXT, -- City, Country
  login_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'success' -- 'success', 'failed'
);

CREATE INDEX idx_login_activities_user ON login_activities(user_id);
CREATE INDEX idx_login_activities_date ON login_activities(login_at DESC);
```

---

## 🎯 PHASE 4: LOYALTY & ENGAGEMENT
**Timeline:** Week 4-5  
**Priority:** 💎 MEDIUM

### 4.1 Points System Integration
**Status:** ⚠️ Store exists but not connected to API

#### Points Rules:
```typescript
// constants/points.ts
export const POINTS_RULES = {
  BOOKING_COMPLETED: 100,
  BOOKING_CANCELLED: -50,
  REVIEW_SUBMITTED: 20,
  REFERRAL_SUCCESS: 500,
  DAILY_CHECK_IN: 10,
  FIRST_BOOKING: 200,
};
```

#### Points Service:
```typescript
// services/pointsService.ts
export const pointsService = {
  async getUserPoints(userId: string) {
    const { data, error } = await api
      .from('user_points')
      .select('balance')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data.balance;
  },

  async addPoints(userId: string, points: number, reason: string) {
    const { data, error } = await api.rpc('add_user_points', {
      p_user_id: userId,
      p_points: points,
      p_reason: reason
    });

    if (error) throw error;
    return data;
  },

  async getPointsHistory(userId: string) {
    const { data, error } = await api
      .from('points_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    return data;
  }
};
```

#### Database Schema:
```sql
CREATE TABLE user_points (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 0,
  lifetime_earned INTEGER DEFAULT 0,
  lifetime_redeemed INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE points_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Positive for earn, negative for redeem
  reason TEXT NOT NULL,
  booking_id UUID REFERENCES bookings(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Function to add points atomically
CREATE OR REPLACE FUNCTION add_user_points(
  p_user_id UUID,
  p_points INTEGER,
  p_reason TEXT
) RETURNS void AS $$
BEGIN
  -- Update balance
  UPDATE user_points 
  SET 
    balance = balance + p_points,
    lifetime_earned = CASE WHEN p_points > 0 THEN lifetime_earned + p_points ELSE lifetime_earned END,
    lifetime_redeemed = CASE WHEN p_points < 0 THEN lifetime_redeemed + ABS(p_points) ELSE lifetime_redeemed END,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Create transaction record
  INSERT INTO points_transactions (user_id, amount, reason)
  VALUES (p_user_id, p_points, p_reason);
END;
$$ LANGUAGE plpgsql;
```

---

### 4.2 Vouchers Management
**Status:** ⚠️ Store exists but not connected to API

#### Vouchers Screen Enhancement:
**File:** `app/(tabs)/rewards.tsx` (existing)

#### Add Features:
- ✅ Browse available vouchers
- ✅ Redeem with points
- ✅ View my vouchers
- ✅ Apply to booking
- ✅ Expiry notifications

#### Database Schema:
```sql
CREATE TABLE vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL, -- 'discount_percent', 'discount_fixed', 'free_service'
  discount_value DECIMAL(10,2),
  min_spend DECIMAL(10,2),
  max_discount DECIMAL(10,2),
  points_cost INTEGER NOT NULL,
  usage_limit INTEGER,
  times_used INTEGER DEFAULT 0,
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  voucher_id UUID REFERENCES vouchers(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP,
  used_for_booking UUID REFERENCES bookings(id),
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'used', 'expired'
  UNIQUE(user_id, voucher_id)
);
```

---

### 4.3 Referral Program
**Status:** ❌ Not Implemented  
**File:** Create `app/profile/referral.tsx`

#### Features:
- ✅ Personal referral code
- ✅ Share functionality (WhatsApp, SMS, etc.)
- ✅ Track referrals
- ✅ Referral rewards
- ✅ Leaderboard (optional)

#### Implementation:
```typescript
// services/referralService.ts
export const referralService = {
  async getReferralCode(userId: string) {
    const { data, error } = await api
      .from('profiles')
      .select('referral_code')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data.referral_code;
  },

  async applyReferralCode(userId: string, code: string) {
    // Check if code exists
    const { data: referrer, error } = await api
      .from('profiles')
      .select('id')
      .eq('referral_code', code)
      .single();
    
    if (error || !referrer) throw new Error('Invalid referral code');

    // Create referral record
    const { error: insertError } = await api
      .from('referrals')
      .insert({
        referrer_id: referrer.id,
        referred_id: userId,
      });

    if (insertError) throw insertError;

    // Award points to both users
    await pointsService.addPoints(referrer.id, 500, 'Referral reward');
    await pointsService.addPoints(userId, 200, 'Referral signup bonus');
  },

  async getReferralStats(userId: string) {
    const { data, error } = await api
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId);
    
    if (error) throw error;
    
    return {
      total: data.length,
      completed: data.filter(r => r.status === 'completed').length,
      earnings: data.filter(r => r.status === 'completed').length * 500,
    };
  }
};
```

---

### 4.4 Push Notifications Settings
**Status:** ❌ Not Implemented  
**File:** Create `app/profile/notifications.tsx`

#### Features:
- ✅ Toggle push notifications
- ✅ Notification categories:
  - Booking reminders
  - Promotions & offers
  - Points & rewards
  - App updates
- ✅ Quiet hours
- ✅ Email notifications toggle

#### Implementation:
```typescript
// services/notificationService.ts
import * as Notifications from 'expo-notifications';

export const notificationService = {
  async requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  async registerForPushNotifications(userId: string) {
    const token = await Notifications.getExpoPushTokenAsync();
    
    // Save to database
    await api
      .from('push_tokens')
      .upsert({
        user_id: userId,
        token: token.data,
        platform: Platform.OS,
      });

    return token.data;
  },

  async updateNotificationSettings(userId: string, settings: NotificationSettings) {
    const { error } = await api
      .from('notification_settings')
      .upsert({
        user_id: userId,
        ...settings
      });

    if (error) throw error;
  }
};
```

---

## 🎯 PHASE 5: SUPPORT & POLISH
**Timeline:** Week 5-6  
**Priority:** ✨ MEDIUM

### 5.1 Help Center
**Status:** ❌ Not Implemented  
**File:** Create `app/profile/help/index.tsx`

#### Features:
- ✅ FAQ with categories
- ✅ Search functionality
- ✅ Step-by-step guides
- ✅ Video tutorials
- ✅ Contact support CTA

#### Implementation:
```typescript
// data/faq.ts
export const FAQ_CATEGORIES = [
  {
    id: 'booking',
    title: 'Bookings',
    icon: 'calendar',
    questions: [
      {
        id: 'q1',
        question: 'How do I book a barber?',
        answer: 'To book a barber, browse available barbers, select your preferred one, choose services, pick a date and time, and confirm your booking.',
      },
      // ... more questions
    ]
  },
  {
    id: 'payment',
    title: 'Payments',
    icon: 'card',
    questions: [/* ... */]
  },
  // ... more categories
];
```

---

### 5.2 In-App Chat Support
**Status:** ❌ Not Implemented  
**File:** Create `app/profile/help/chat.tsx`

#### Integration Options:
1. **Intercom** - Full-featured, expensive
2. **Zendesk** - Good for enterprise
3. **Custom with Firebase** - Cost-effective

#### Example with Firebase:
```typescript
// services/chatService.ts
import { getFirestore, collection, addDoc } from 'firebase/firestore';

export const chatService = {
  async sendMessage(userId: string, message: string) {
    const db = getFirestore();
    await addDoc(collection(db, 'support_chats'), {
      userId,
      message,
      timestamp: new Date(),
      status: 'pending',
    });
  },

  // Listen for responses
  subscribeToChat(userId: string, callback: Function) {
    const db = getFirestore();
    return onSnapshot(
      query(
        collection(db, 'support_chats'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      ),
      (snapshot) => {
        const messages = snapshot.docs.map(doc => doc.data());
        callback(messages);
      }
    );
  }
};
```

---

### 5.3 About Mari Gunting
**Status:** ❌ Not Implemented  
**File:** Create `app/profile/about.tsx`

#### Content:
- ✅ App version & build number
- ✅ Company info
- ✅ Mission & values
- ✅ Team
- ✅ Social media links
- ✅ App rating prompt

---

### 5.4 Animations & Haptics
**Status:** ❌ Not Implemented

#### Add Micro-interactions:
```typescript
// utils/haptics.ts
import * as Haptics from 'expo-haptics';

export const haptics = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};
```

#### Animations with Reanimated:
```typescript
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

// Button press animation
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: withSpring(pressed ? 0.95 : 1) }],
}));
```

---

### 5.5 Accessibility
**Status:** ⚠️ Partial

#### Improvements Needed:
- ✅ All interactive elements need accessibilityLabel
- ✅ Screen reader support
- ✅ Dynamic font sizing
- ✅ High contrast mode
- ✅ Keyboard navigation (tablet)

```typescript
// Example
<TouchableOpacity
  accessibilityLabel="Edit profile"
  accessibilityHint="Opens the profile editing screen"
  accessibilityRole="button"
>
  <Ionicons name="pencil" size={24} />
</TouchableOpacity>
```

---

## 📊 TESTING CHECKLIST

### Unit Tests
- [ ] Profile service functions
- [ ] Points calculations
- [ ] Voucher redemption logic
- [ ] Form validations

### Integration Tests
- [ ] Profile update flow
- [ ] Avatar upload flow
- [ ] Payment method addition
- [ ] Address CRUD operations

### E2E Tests
- [ ] Complete profile editing journey
- [ ] Booking with voucher application
- [ ] Referral code flow
- [ ] Payment flow

---

## 🚀 DEPLOYMENT CHECKLIST

### Before Launch:
- [ ] All menu items functional
- [ ] No mock data visible
- [ ] Error handling complete
- [ ] Loading states everywhere
- [ ] Analytics events tracked
- [ ] Performance optimized
- [ ] Security audit passed
- [ ] Privacy policy updated
- [ ] Terms of service updated

### Monitoring:
- [ ] Sentry for error tracking
- [ ] Analytics (Mixpanel/Amplitude)
- [ ] Performance monitoring (Firebase)
- [ ] User feedback collection

---

## 📈 SUCCESS METRICS

### Week 1-2 (Phase 1)
- [ ] Profile edit completion rate > 80%
- [ ] Avatar upload success rate > 95%
- [ ] Stats loading time < 2s

### Week 3-4 (Phase 2-3)
- [ ] Address addition rate > 60%
- [ ] Payment method addition rate > 40%
- [ ] Email verification rate > 70%

### Week 5-6 (Phase 4-5)
- [ ] Points redemption rate > 30%
- [ ] Referral conversion rate > 10%
- [ ] Help center usage > 20%

---

## 🎯 PRIORITY MATRIX

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Edit Profile | High | Medium | 🔥 P0 |
| Real Stats | High | Low | 🔥 P0 |
| Addresses | High | High | 🔥 P0 |
| Payment Methods | High | High | 🔴 P1 |
| Email Verification | Medium | Low | 🔴 P1 |
| Change Password | Medium | Low | 🔴 P1 |
| Favorites | Medium | Medium | 🟡 P2 |
| 2FA | Low | High | 🟡 P2 |
| Referral | Medium | Medium | 🟡 P2 |
| Help Center | Low | Medium | 🟢 P3 |
| Chat Support | Low | High | 🟢 P3 |
| Animations | Low | Medium | 🟢 P3 |

---

## 🛠️ TECH STACK

### Core
- **Framework:** React Native + Expo
- **Navigation:** Expo Router
- **State:** Zustand + Persist
- **Backend:** Supabase (PostgreSQL)

### Services
- **Storage:** Cloudinary (avatars)
- **Payments:** Stripe / iPay88
- **Notifications:** Expo Notifications
- **Analytics:** Mixpanel
- **Error Tracking:** Sentry
- **Chat:** Firebase / Intercom

### UI/UX
- **Icons:** Ionicons
- **Animations:** Reanimated
- **Haptics:** Expo Haptics
- **Image Picker:** Expo Image Picker

---

## 📞 NEXT STEPS

1. **Review this roadmap** with your team
2. **Set up project tracking** (Jira, Linear, etc.)
3. **Create feature branches** for each phase
4. **Start with Phase 1** (most critical)
5. **Daily standups** to track progress
6. **Weekly demos** to stakeholders

---

## 🎓 LEARNING RESOURCES

- [Grab's Design System](https://www.grab.design/)
- [React Native Best Practices](https://reactnative.dev/docs/best-practices)
- [Supabase Documentation](https://supabase.com/docs)
- [Expo Documentation](https://docs.expo.dev/)

---

**Last Updated:** October 10, 2025  
**Document Owner:** Engineering Team  
**Review Cycle:** Weekly
