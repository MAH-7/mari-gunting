# Real Authentication Implementation Guide

## 🎯 Goal
Enable **real user registration and login** using Supabase Phone OTP for both Customer and Partner apps, so you can test with actual accounts instead of mock data.

---

## ✅ What You Already Have

Great news! You already have:
- ✅ `authService.ts` - Complete authentication service
- ✅ `login.tsx` - Login screen (currently using mock)
- ✅ `register.tsx` - Registration screen (currently using mock)
- ✅ Supabase configured
- ✅ Database schema ready

**What we need to do:**
1. Enable Supabase Phone Auth
2. Create OTP verification screen
3. Update login/register screens to use real auth
4. Test the flow

---

## 🚀 Step-by-Step Implementation

### **Step 1: Enable Supabase Phone Authentication** (10 mins)

#### **Option A: With Twilio (Production - costs money)**

1. **Go to Supabase Dashboard**
   - Select your project
   - Go to **Authentication → Settings → Phone Auth**

2. **Enable Phone Provider**
   - Toggle **Enable Phone Sign-Up**
   - Select provider: **Twilio**

3. **Configure Twilio:**
   - Create Twilio account: https://www.twilio.com/
   - Get: Account SID, Auth Token, Phone Number
   - Enter in Supabase Phone Auth settings
   - Save

**Cost:** ~$1 per month + $0.0075 per SMS

---

#### **Option B: Test Mode (Free - for development)**

If you want to test WITHOUT spending money first:

1. **Go to Supabase Dashboard**
   - Authentication → Settings → Phone Auth
   - Toggle **Enable Phone Sign-Up**

2. **Use Test Phone Numbers:**
   - Add test phone numbers in Supabase Dashboard
   - Set fixed OTP codes for testing
   - Example: `+60123456789` → OTP: `123456`

3. **Alternative: Use Supabase Test Mode**
   - Supabase provides test mode for development
   - All OTPs will be `123456` in test mode

---

#### **Option C: Skip SMS Temporarily (Mock OTP)**

For immediate testing without Twilio setup:

**Update authService to accept any OTP in development:**

```typescript
// In packages/shared/services/authService.ts
// Add this to verifyOTP method:

if (__DEV__ && otp === '123456') {
  // Accept any phone in dev mode with OTP 123456
  // Create a mock session
  // This bypasses real Supabase auth for testing
}
```

We'll provide the exact code modification below.

---

### **Step 2: Create OTP Verification Screen** (30 mins)

Create this file: `apps/customer/app/verify-otp.tsx`

```typescript
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '@mari-gunting/shared/services/authService';

export default function VerifyOTPScreen() {
  const params = useLocalSearchParams();
  const phoneNumber = params.phoneNumber as string;
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOTPChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const otpArray = value.slice(0, 6).split('');
      setOtp(otpArray.concat(Array(6 - otpArray.length).fill('')));
      inputRefs.current[5]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.verifyOTP(phoneNumber, otpCode);

      if (!response.success) {
        Alert.alert('Verification Failed', response.error || 'Invalid OTP code');
        setIsLoading(false);
        return;
      }

      // Check if user profile exists
      const userCheck = await authService.checkPhoneExists(phoneNumber);
      
      if (!userCheck.success || !userCheck.data?.exists) {
        // New user - go to registration
        router.replace({
          pathname: '/register',
          params: { phoneNumber },
        });
      } else {
        // Existing user - go to app
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    try {
      const response = await authService.sendOTP({ phoneNumber });
      
      if (response.success) {
        Alert.alert('OTP Sent', 'A new code has been sent to your phone');
        setCountdown(60);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        Alert.alert('Failed', 'Could not resend OTP. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="mail-unread-outline" size={64} color="#00B14F" />
        </View>

        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          We sent a code to{'\n'}
          <Text style={styles.phone}>{phoneNumber}</Text>
        </Text>

        {/* OTP Inputs */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.otpInput,
                digit && styles.otpInputFilled,
              ]}
              value={digit}
              onChangeText={(value) => handleOTPChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              editable={!isLoading}
            />
          ))}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[
            styles.verifyButton,
            (otp.join('').length !== 6 || isLoading) && styles.verifyButtonDisabled,
          ]}
          onPress={handleVerifyOTP}
          disabled={otp.join('').length !== 6 || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify Code</Text>
          )}
        </TouchableOpacity>

        {/* Resend */}
        <TouchableOpacity
          style={styles.resendContainer}
          onPress={handleResendOTP}
          disabled={countdown > 0}
          activeOpacity={0.7}
        >
          {countdown > 0 ? (
            <Text style={styles.resendText}>
              Resend code in <Text style={styles.countdown}>{countdown}s</Text>
            </Text>
          ) : (
            <Text style={styles.resendTextActive}>Resend Code</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  iconContainer: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  phone: {
    fontWeight: '600',
    color: '#111827',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 8,
  },
  otpInput: {
    flex: 1,
    height: 56,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  otpInputFilled: {
    borderColor: '#00B14F',
    backgroundColor: '#FFFFFF',
  },
  verifyButton: {
    backgroundColor: '#00B14F',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 56,
  },
  verifyButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resendContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#6B7280',
  },
  countdown: {
    fontWeight: '600',
    color: '#00B14F',
  },
  resendTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00B14F',
  },
});
```

**Copy this same file to Partner app:**
```bash
cp apps/customer/app/verify-otp.tsx apps/partner/app/verify-otp.tsx
```

---

### **Step 3: Update Login Screen** (15 mins)

Replace the mock login logic with real Supabase auth.

**File:** `apps/customer/app/login.tsx`

Find the `handleLogin` function (around line 55) and replace it with:

```typescript
const handleLogin = async () => {
  // Validate phone number
  if (!validatePhoneNumber(phoneNumber)) {
    Alert.alert(
      'Invalid Phone Number',
      'Please enter a valid Malaysian phone number (9-10 digits)',
      [{ text: 'OK' }]
    );
    return;
  }

  setIsLoading(true);

  try {
    // Format phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const fullPhone = `${countryCode}${cleanPhone}`;

    // Send OTP via Supabase
    const response = await authService.sendOTP({ phoneNumber: fullPhone });

    if (!response.success) {
      Alert.alert(
        'Failed to Send OTP',
        response.error || 'Please try again',
        [{ text: 'OK' }]
      );
      return;
    }

    // Navigate to OTP verification
    router.push({
      pathname: '/verify-otp',
      params: { phoneNumber: fullPhone },
    });
  } catch (error: any) {
    Alert.alert(
      'Login Failed',
      error.message || 'Unable to send OTP. Please try again.',
      [{ text: 'OK' }]
    );
  } finally {
    setIsLoading(false);
  }
};
```

**Add import at the top:**
```typescript
import { authService } from '@mari-gunting/shared/services/authService';
```

**Do the same for Partner app:**
```
apps/partner/app/login.tsx
```

---

### **Step 4: Update Register Screen** (15 mins)

Wire registration to create real user profiles.

**File:** `apps/customer/app/register.tsx`

Find the `handleRegister` function (around line 67) and replace it with:

```typescript
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

  setIsLoading(true);

  try {
    // Register user with Supabase
    const response = await authService.register({
      phoneNumber,
      fullName,
      email: email.toLowerCase(),
      role,
      avatarUrl: avatar || undefined,
    });

    if (!response.success) {
      Alert.alert(
        'Registration Failed',
        response.error || 'Unable to complete registration.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Success - navigate to app
    Alert.alert(
      'Welcome!',
      'Your account has been created successfully.',
      [
        {
          text: 'Get Started',
          onPress: () => router.replace('/(tabs)'),
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
```

**Add import:**
```typescript
import { authService } from '@mari-gunting/shared/services/authService';
```

**Do the same for Partner app.**

---

### **Step 5: Add Session Persistence** (10 mins)

Handle automatic login when app starts.

**File:** `apps/customer/app/_layout.tsx`

Add this to check for existing session:

```typescript
import { useEffect, useState } from 'react';
import { authService } from '@mari-gunting/shared/services/authService';
import { router } from 'expo-router';

export default function RootLayout() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const user = await authService.getCurrentUser();
      
      if (user.success && user.data) {
        // User is logged in - go to main app
        router.replace('/(tabs)');
      } else {
        // Not logged in - show login
        router.replace('/login');
      }
    } catch (error) {
      // Error - show login
      router.replace('/login');
    } finally {
      setIsCheckingAuth(false);
    }
  };

  if (isCheckingAuth) {
    return null; // Or show splash screen
  }

  // Rest of your layout code...
}
```

---

## 🧪 Testing the Flow

### **Test Scenario 1: New User Registration**

1. **Start app** → Login screen
2. **Enter phone:** `+60123456789`
3. **Tap Continue** → OTP screen
4. **Enter OTP:** Check your phone (or `123456` in test mode)
5. **Verify** → Register screen (new user)
6. **Fill details:** Name, Email
7. **Complete Registration** → Main app ✅

---

### **Test Scenario 2: Existing User Login**

1. **Login screen**
2. **Enter phone:** `+60123456789` (already registered)
3. **Continue** → OTP screen
4. **Enter OTP**
5. **Verify** → Main app ✅ (no registration)

---

### **Test Scenario 3: Multi-Device**

**MacBook (Customer):**
- Register as Customer: `+60111111111`

**Phone (Partner):**
- Register as Barber: `+60222222222`

Both can now create/manage bookings!

---

## 🔧 Development Mode (No Twilio Required)

For testing WITHOUT Twilio, add this to `authService.ts`:

```typescript
// At the top of authService.ts
const __DEV__ = process.env.NODE_ENV === 'development';
const TEST_OTP = '123456';

// In sendOTP method, add:
if (__DEV__) {
  console.log(`🔐 TEST MODE: OTP for ${params.phoneNumber} is: ${TEST_OTP}`);
  // Still call Supabase, but it will fail gracefully
  // Just return success for testing
  return {
    success: true,
    data: { sent: true },
  };
}

// In verifyOTP method, add:
if (__DEV__ && otp === TEST_OTP) {
  console.log(`✅ TEST MODE: Accepting OTP ${TEST_OTP} for any phone`);
  // Create a mock successful response
  // Then continue with normal flow
}
```

This lets you test without SMS costs!

---

## 📊 Checklist

### **Pre-Implementation:**
- [ ] Database migrations applied
- [ ] Supabase Phone Auth enabled (or test mode)
- [ ] `authService.ts` exists (✅ you have it!)
- [ ] Both apps have login/register screens

### **Implementation:**
- [ ] Create `verify-otp.tsx` in customer app
- [ ] Copy to partner app
- [ ] Update `login.tsx` to use authService
- [ ] Update `register.tsx` to use authService
- [ ] Add session check in `_layout.tsx`
- [ ] Test registration flow
- [ ] Test login flow

### **Post-Implementation:**
- [ ] Can register new customer
- [ ] Can register new barber
- [ ] Can login with OTP
- [ ] Session persists on app restart
- [ ] Different users on different devices

---

## 🎉 Success Metrics

**You'll know it's working when:**

✅ No more mock data in login  
✅ Real OTP sent to phone  
✅ User created in Supabase `profiles` table  
✅ Can login on MacBook as Customer  
✅ Can login on Phone as Barber  
✅ Both see real data from database  
✅ Session persists after app restart  

---

## 🚨 Troubleshooting

### **Issue: OTP not sending**
- Check Supabase Phone Auth is enabled
- Verify Twilio credentials (if using)
- Check phone number format: `+60123456789`
- Try test mode first

### **Issue: "Profile creation failed"**
- Verify database migrations applied
- Check `profiles` table exists
- Check RLS policies allow inserts

### **Issue: Session not persisting**
- Verify AsyncStorage is installed
- Check Supabase client config has `persistSession: true`
- Test `authService.getCurrentUser()` directly

---

## 📞 Next Steps

**After real auth is working:**

1. **Apply database migrations** (if not done)
2. **Add test data** (optional - or use real registration)
3. **Test multi-device** (MacBook + Phone)
4. **Implement booking creation**
5. **Test full marketplace flow**

---

**Estimated Time:** 1-2 hours total
- Supabase setup: 10 minutes
- Create OTP screen: 30 minutes
- Update login/register: 30 minutes  
- Testing: 30 minutes

**Ready to implement real authentication!** 🚀

Let me know when you're ready to start, and I'll guide you through each step!
