# Authentication Flow Documentation

Complete guide to the authentication system in Mari-Gunting Customer App.

## Table of Contents
- [Overview](#overview)
- [Authentication Screens](#authentication-screens)
- [Navigation Flow](#navigation-flow)
- [Integration Guide](#integration-guide)
- [API Integration](#api-integration)
- [Testing](#testing)

---

## Overview

The Mari-Gunting authentication system provides a secure and user-friendly way for customers to sign up and log in using:
- Phone number with OTP verification
- Email/password (future)
- Social logins (future)

### Tech Stack
- **UI Components**: Custom Input, Button, LoadingSpinner from `@mari-gunting/shared`
- **Navigation**: Expo Router file-based routing
- **State Management**: Zustand
- **Authentication Service**: Supabase Auth

---

## Authentication Screens

### 1. Welcome Screen (`/welcome`)

The onboarding screen that introduces new users to the app.

#### Features
- 3-slide carousel with app benefits
- Skip functionality
- Smooth animations
- Auto-navigation to login

#### Navigation
```typescript
// From welcome screen
router.replace('/login');
```

#### UI Components Used
- `Button` - Get Started / Next
- Custom FlatList with pagination
- Image carousel

---

### 2. Login Screen (`/login`)

Phone number-based login with Malaysian format support.

#### Features
- Malaysian phone number input (+60)
- Auto-formatting (12-345 6789)
- Phone number validation
- Country code selector (Malaysia)
- Loading states
- Mock login for testing

#### Mock Test Numbers
- `11-111 1111` → Login as Customer
- `22-222 2222` → Login as Barber
- `99-999 9999` → New user (role selection)
- Any other → Default customer login

#### Navigation Flow
```typescript
// Valid phone → OTP verification (future)
router.push('/otp-verification', { phoneNumber });

// Mock direct login → Main app
router.replace('/(tabs)');

// New user → Role selection
router.push('/select-role', { phoneNumber });
```

#### Usage Example
```typescript
const handleLogin = async () => {
  if (!validatePhoneNumber(phoneNumber)) {
    Alert.alert('Invalid Phone Number', 'Please enter a valid Malaysian phone number');
    return;
  }

  setIsLoading(true);
  try {
    // TODO: Replace with actual Supabase Auth
    const response = await auth.sendOTP({ phoneNumber });
    router.push({ 
      pathname: '/otp-verification', 
      params: { phoneNumber } 
    });
  } catch (error) {
    Alert.alert('Error', 'Failed to send OTP');
  } finally {
    setIsLoading(false);
  }
};
```

---

### 3. OTP Verification Screen (`/otp-verification`)

6-digit OTP verification with auto-focus and countdown timer.

#### Features
- 6 separate input boxes
- Auto-focus next input
- Backspace navigation
- 60-second countdown timer
- Resend OTP functionality
- Visual feedback for filled inputs

#### Props
```typescript
interface OTPScreenParams {
  phoneNumber: string;
}
```

#### Navigation Flow
```typescript
// Successful verification → Main app
router.replace('/(tabs)');

// Back navigation
router.back();
```

#### Usage Example
```typescript
const handleVerifyOTP = async () => {
  const otpString = otp.join('');
  
  if (otpString.length !== 6) {
    Alert.alert('Invalid OTP', 'Please enter the complete 6-digit code');
    return;
  }

  setIsLoading(true);
  try {
    const response = await auth.verifyOTP({ phoneNumber, otp: otpString });
    setCurrentUser(response.user);
    router.replace('/(tabs)');
  } catch (error) {
    Alert.alert('Verification Failed', 'Invalid OTP code');
    setOtp(['', '', '', '', '', '']);
  } finally {
    setIsLoading(false);
  }
};
```

---

### 4. Register Screen (`/register`)

New user registration with profile information.

#### Features
- Avatar upload (optional)
- Full name input (required)
- Email input with validation (required)
- Phone number display (verified, read-only)
- Role badge display
- Image picker integration
- Form validation

#### Props
```typescript
interface RegisterScreenParams {
  phoneNumber: string;
  role: 'customer' | 'barber';
}
```

#### Form Fields
- **Avatar**: Optional profile picture (ImagePicker)
- **Full Name**: Required, auto-capitalized
- **Email**: Required, validated format
- **Phone Number**: Read-only (already verified)
- **Role**: Display only, can change

#### Navigation Flow
```typescript
// After successful registration → Main app
router.replace('/(tabs)');

// Change role → Back to role selection
router.back();
```

#### Usage Example
```typescript
const handleRegister = async () => {
  // Validation
  if (!fullName.trim() || !validateEmail(email)) {
    Alert.alert('Invalid Input', 'Please fill all required fields');
    return;
  }

  setIsLoading(true);
  try {
    // Upload avatar if selected
    let avatarUrl = null;
    if (avatar) {
      avatarUrl = await uploadImage(avatar);
    }

    // Register user
    const response = await auth.register({
      phoneNumber,
      name: fullName,
      email: email.toLowerCase(),
      role,
      avatar: avatarUrl,
    });

    setCurrentUser(response.user);
    router.replace('/(tabs)');
  } catch (error) {
    Alert.alert('Registration Failed', 'Please try again');
  } finally {
    setIsLoading(false);
  }
};
```

---

### 5. Forgot Password Screen (`/forgot-password`)

Multi-step password reset flow.

#### Features
- 4-step wizard:
  1. Enter email
  2. Verify OTP
  3. Create new password
  4. Success confirmation
- Password visibility toggle
- Password strength validation
- Match validation
- Back navigation between steps

#### Steps

**Step 1: Email**
- Email input and validation
- Send OTP button

**Step 2: OTP Verification**
- 6-digit code input
- Resend OTP option
- Timer countdown

**Step 3: New Password**
- New password input
- Confirm password input
- Password visibility toggles
- Minimum 8 characters validation

**Step 4: Success**
- Success message
- Back to login button

#### Navigation Flow
```typescript
// Step progression
email → otp → newPassword → success

// Back navigation
- Email step → router.back()
- Other steps → setStep('email')
- Success → router.replace('/login')
```

#### Usage Example
```typescript
const handleResetPassword = async () => {
  if (newPassword.length < 8) {
    Alert.alert('Weak Password', 'Password must be at least 8 characters');
    return;
  }

  if (newPassword !== confirmPassword) {
    Alert.alert('Mismatch', 'Passwords do not match');
    return;
  }

  setIsLoading(true);
  try {
    await auth.resetPassword({
      email,
      otp,
      newPassword,
    });
    
    setStep('success');
  } catch (error) {
    Alert.alert('Error', 'Failed to reset password');
  } finally {
    setIsLoading(false);
  }
};
```

---

### 6. Role Selection Screen (`/select-role`)

Choose between Customer or Barber role (existing screen).

#### Features
- Customer card option
- Barber card option
- Visual selection feedback
- Continue button

#### Navigation Flow
```typescript
// After role selection → Registration
router.push({ 
  pathname: '/register', 
  params: { phoneNumber, role } 
});
```

---

## Navigation Flow

### Complete User Journey

```
1. App Launch
   ↓
2. Welcome Screen (first time)
   ↓
3. Login Screen
   ↓
4a. Existing User Path:
   - Enter phone number
   - Verify OTP
   - → Main App
   
4b. New User Path:
   - Enter phone number
   - Verify OTP
   - Select role (Customer/Barber)
   - Complete registration
   - → Main App

4c. Forgot Password Path:
   - Tap "Forgot Password"
   - Enter email
   - Verify OTP
   - Create new password
   - → Login Screen
```

### Navigation Tree

```
/
├── welcome (onboarding)
│   └── → login
│
├── login
│   ├── → otp-verification
│   ├── → forgot-password
│   └── → (tabs) [logged in]
│
├── otp-verification
│   └── → select-role (new user)
│   └── → (tabs) (existing user)
│
├── select-role
│   └── → register
│
├── register
│   └── → (tabs)
│
└── forgot-password
    └── → login (after success)
```

---

## Integration Guide

### 1. Setup Authentication Service

```typescript
// packages/shared/services/auth.ts
import { supabase } from '@mari-gunting/shared/config/supabase';

export const authService = {
  async sendOTP(phoneNumber: string) {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phoneNumber,
    });
    
    if (error) throw error;
    return data;
  },

  async verifyOTP(phoneNumber: string, otp: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phoneNumber,
      token: otp,
      type: 'sms',
    });
    
    if (error) throw error;
    return data;
  },

  async register(userData: RegisterData) {
    // Create user profile in database
    const { data, error } = await supabase
      .from('profiles')
      .insert([userData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async resetPassword(email: string, otp: string, newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) throw error;
  },
};
```

### 2. Update Login Screen

Replace mock login with real authentication:

```typescript
// apps/customer/app/login.tsx
import { authService } from '@mari-gunting/shared';

const handleLogin = async () => {
  if (!validatePhoneNumber(phoneNumber)) {
    Alert.alert('Invalid Phone Number', 'Please enter a valid phone number');
    return;
  }

  setIsLoading(true);
  try {
    await authService.sendOTP(`${countryCode}${phoneNumber.replace(/\D/g, '')}`);
    
    router.push({ 
      pathname: '/otp-verification', 
      params: { phoneNumber: `${countryCode}${phoneNumber}` } 
    });
  } catch (error) {
    Alert.alert('Login Failed', 'Unable to send OTP. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
```

### 3. Update OTP Verification

```typescript
// apps/customer/app/otp-verification.tsx
import { authService } from '@mari-gunting/shared';
import { useStore } from '@/store/useStore';

const handleVerifyOTP = async () => {
  const otpString = otp.join('');
  
  if (otpString.length !== 6) {
    Alert.alert('Invalid OTP', 'Please enter the complete 6-digit code');
    return;
  }

  setIsLoading(true);
  try {
    const { user, session } = await authService.verifyOTP(phoneNumber, otpString);
    
    // Check if user exists in profiles table
    const profile = await checkUserProfile(user.id);
    
    if (profile) {
      // Existing user → go to main app
      setCurrentUser(profile);
      router.replace('/(tabs)');
    } else {
      // New user → go to role selection
      router.push({ 
        pathname: '/select-role', 
        params: { phoneNumber } 
      });
    }
  } catch (error) {
    Alert.alert('Verification Failed', 'Invalid OTP code');
    setOtp(['', '', '', '', '', '']);
  } finally {
    setIsLoading(false);
  }
};
```

---

## API Integration

### Supabase Auth Configuration

```typescript
// packages/shared/config/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

### Required Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Testing

### Test Scenarios

1. **Welcome Screen**
   - ✅ All 3 slides display correctly
   - ✅ Skip button navigates to login
   - ✅ Get Started button on last slide navigates to login

2. **Login Screen**
   - ✅ Phone number format validation
   - ✅ Malaysian format (12-345 6789)
   - ✅ Disabled button when invalid
   - ✅ Loading state during API call
   - ✅ Error handling for failed OTP send

3. **OTP Verification**
   - ✅ Auto-focus next input
   - ✅ Backspace navigation
   - ✅ Countdown timer works
   - ✅ Resend OTP after countdown
   - ✅ Success navigation
   - ✅ Error handling

4. **Registration**
   - ✅ Avatar upload works
   - ✅ Form validation
   - ✅ Email format validation
   - ✅ Successful registration flow
   - ✅ Role display and change

5. **Forgot Password**
   - ✅ All 4 steps flow correctly
   - ✅ Email validation
   - ✅ OTP verification
   - ✅ Password strength validation
   - ✅ Password match validation
   - ✅ Success navigation

### Manual Testing Checklist

```
□ New user can complete full signup flow
□ Existing user can log in successfully
□ OTP resend works correctly
□ Password reset completes successfully
□ Form validations show appropriate errors
□ Loading states display correctly
□ Navigation back buttons work
□ App state persists across app restarts
□ Logout functionality works
□ Error messages are user-friendly
```

---

## Troubleshooting

### Common Issues

**Issue**: OTP not received
- **Solution**: Check Supabase phone provider configuration
- **Solution**: Verify phone number format includes country code

**Issue**: Navigation not working
- **Solution**: Ensure all screens are registered in `_layout.tsx`
- **Solution**: Use `router.replace()` for auth transitions

**Issue**: User state not persisting
- **Solution**: Check Zustand store persistence configuration
- **Solution**: Verify secure storage is working

**Issue**: Form validation not working
- **Solution**: Check Input component error prop
- **Solution**: Verify validation functions are being called

---

## Next Steps

1. **Social Login Integration**
   - Google Sign-In
   - Apple Sign-In
   - Facebook Login

2. **Biometric Authentication**
   - Face ID / Touch ID
   - Fingerprint on Android

3. **Enhanced Security**
   - Two-factor authentication
   - Session management
   - Device tracking

4. **User Experience**
   - Remember me functionality
   - Auto-login after first setup
   - Smooth transitions

---

## Support

For questions or issues:
1. Check this documentation
2. Review component source code
3. Check Supabase Auth documentation
4. Review error logs in Sentry
