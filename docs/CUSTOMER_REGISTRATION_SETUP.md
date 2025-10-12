# Customer Registration & Authentication Setup

**Status:** ✅ Service Created, ⚠️ Requires Supabase Configuration  
**Date:** January 2025

## 📋 Overview

I've created a complete authentication service (`authService.ts`) that handles:
- ✅ User registration with real Supabase
- ✅ Phone OTP login
- ✅ Profile management
- ✅ Session handling

**However**, before this can work in production, you need to configure phone authentication in Supabase.

---

## 🚀 Quick Start (Development Mode)

For now, the app is using **mock data** for quick testing. The real Supabase auth will work once configured.

### Current Login System (Mock):
- Phone: `11-111 1111` → Logs in as Customer (mock)
- Phone: `22-222 2222` → Logs in as Barber (mock)
- Phone: `99-999 9999` → New user flow
- Any other → Customer (default)

---

## ⚙️ Supabase Configuration Required

To enable **real phone authentication**, follow these steps:

### 1. **Enable Phone Authentication in Supabase**

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Enable **Phone** provider
5. Choose an SMS provider:

#### Option A: **Twilio** (Recommended for Production)
- Sign up at [Twilio](https://www.twilio.com/)
- Get your Account SID and Auth Token
- Get a phone number from Twilio
- Configure in Supabase:
  ```
  Twilio Account SID: ACxxxxxxxxxxxxxxxxx
  Twilio Auth Token: your_auth_token
  Twilio Phone Number: +1234567890
  ```

#### Option B: **MessageBird**
- Similar setup to Twilio
- Good alternative with competitive pricing

#### Option C: **Supabase Test Mode** (Development Only)
- Use for testing without real SMS
- OTP will be logged in Supabase dashboard
- **Not for production!**

### 2. **Configure Phone Settings**

In Supabase Dashboard → Authentication → Settings:

```yaml
Phone Auth Settings:
  - Enable Phone Signup: ✅
  - Enable Phone Provider: ✅
  - Phone Number Format: International (+60...)
  - OTP Length: 6 digits
  - OTP Expiry: 60 seconds
  - Rate Limiting: Enabled (recommended)
```

### 3. **Update Database Schema**

Ensure your `profiles` table has the correct structure:

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('customer', 'barber')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

---

## 📱 How It Works

### Registration Flow:

```
1. User enters phone number
   ↓
2. authService.sendOTP() → Sends SMS
   ↓
3. User enters 6-digit OTP
   ↓
4. authService.verifyOTP() → Validates
   ↓
5. User completes profile (name, email)
   ↓
6. authService.register() → Creates account
   ↓
7. User logged in automatically
```

### Login Flow:

```
1. User enters phone number
   ↓
2. authService.checkPhoneExists() → Check if registered
   ↓
3. If exists: authService.sendOTP()
   ↓
4. User enters OTP
   ↓
5. authService.verifyOTP() → Logs in
   ↓
6. User redirected to home
```

---

## 🔧 Integration with Existing Screens

The `authService` is ready to be integrated. Here's how:

### Update `login.tsx`:

```typescript
import { authService } from '@mari-gunting/shared/services/authService';

const handleLogin = async () => {
  // 1. Check if phone exists
  const checkResult = await authService.checkPhoneExists(phoneNumber);
  
  if (checkResult.success && checkResult.data?.exists) {
    // 2. Send OTP
    const otpResult = await authService.sendOTP({ phoneNumber });
    
    if (otpResult.success) {
      // 3. Navigate to OTP screen
      router.push({
        pathname: '/otp-verification',
        params: { phoneNumber }
      });
    }
  } else {
    // New user - go to role selection
    router.push({
      pathname: '/select-role',
      params: { phoneNumber }
    });
  }
};
```

### Update `register.tsx`:

```typescript
import { authService } from '@mari-gunting/shared/services/authService';

const handleRegister = async () => {
  const result = await authService.register({
    phoneNumber: phoneNumber,
    fullName: fullName,
    email: email,
    role: role,
    avatarUrl: avatar,
  });

  if (result.success) {
    // Set user in store
    setCurrentUser(result.data);
    // Navigate to home
    router.replace('/(tabs)');
  } else {
    Alert.alert('Error', result.error);
  }
};
```

### Create `otp-verification.tsx`:

```typescript
import { authService } from '@mari-gunting/shared/services/authService';

const handleVerifyOTP = async () => {
  const result = await authService.verifyOTP(phoneNumber, otp);

  if (result.success) {
    // Set user in store
    setCurrentUser(result.data.user);
    // Navigate to home
    router.replace('/(tabs)');
  } else {
    Alert.alert('Invalid OTP', result.error);
  }
};
```

---

## 🧪 Testing Strategy

### Phase 1: **Mock Data (Current)**
- ✅ Use existing mock login
- ✅ Test UI/UX flows
- ✅ No Supabase setup needed

### Phase 2: **Supabase Test Mode**
- ⚠️ Configure Supabase phone auth (test mode)
- ⚠️ OTPs logged in dashboard (no real SMS)
- ⚠️ Test real auth flow

### Phase 3: **Production SMS**
- 🚀 Configure Twilio/MessageBird
- 🚀 Real SMS delivery
- 🚀 Production ready

---

## 📊 API Reference

### `authService.register(params)`

**Parameters:**
```typescript
{
  phoneNumber: string;  // +60123456789
  fullName: string;     // "John Doe"
  email: string;        // "john@example.com"
  role: 'customer' | 'barber';
  avatarUrl?: string;   // Optional
}
```

**Returns:**
```typescript
{
  success: boolean;
  data?: UserProfile;
  error?: string;
}
```

---

### `authService.sendOTP(params)`

**Parameters:**
```typescript
{
  phoneNumber: string;  // +60123456789
}
```

**Returns:**
```typescript
{
  success: boolean;
  data?: { sent: boolean };
  error?: string;
}
```

---

### `authService.verifyOTP(phoneNumber, otp)`

**Parameters:**
- `phoneNumber`: string (e.g., "+60123456789")
- `otp`: string (6-digit code)

**Returns:**
```typescript
{
  success: boolean;
  data?: {
    user: UserProfile;
    session: Session;
  };
  error?: string;
}
```

---

### `authService.checkPhoneExists(phoneNumber)`

**Parameters:**
- `phoneNumber`: string

**Returns:**
```typescript
{
  success: boolean;
  data?: {
    exists: boolean;
    role?: 'customer' | 'barber';
  };
  error?: string;
}
```

---

### `authService.getCurrentUser()`

**Returns:**
```typescript
{
  success: boolean;
  data?: UserProfile | null;
  error?: string;
}
```

---

### `authService.updateProfile(userId, updates)`

**Parameters:**
- `userId`: string
- `updates`: Partial<UserProfile>

**Returns:**
```typescript
{
  success: boolean;
  data?: UserProfile;
  error?: string;
}
```

---

### `authService.logout()`

**Returns:**
```typescript
{
  success: boolean;
  error?: string;
}
```

---

## 💰 SMS Costs (Twilio)

Approximate costs for SMS OTP:

- **Malaysia**: ~$0.035 per SMS
- **US**: ~$0.0075 per SMS
- **International**: Varies by country

**Estimated Monthly Costs:**
- 100 users: ~$3.50
- 1,000 users: ~$35
- 10,000 users: ~$350

---

## 🔒 Security Best Practices

1. **Rate Limiting**: Limit OTP requests per phone (Supabase handles this)
2. **OTP Expiry**: 60 seconds (configurable)
3. **Max Attempts**: 3 wrong OTP attempts before timeout
4. **Phone Validation**: Validate format before sending OTP
5. **Session Management**: Use Supabase session tokens
6. **RLS Policies**: Users can only access their own data

---

## 🐛 Troubleshooting

### OTP Not Received:
1. Check Twilio configuration
2. Verify phone number format (+60...)
3. Check Supabase logs
4. Verify SMS credits in Twilio

### Registration Fails:
1. Check profiles table exists
2. Verify RLS policies
3. Check Supabase logs
4. Ensure phone number is unique

### Login Fails:
1. Verify user exists in profiles table
2. Check OTP expiry time
3. Verify correct OTP entered
4. Check Supabase auth logs

---

## 📝 Next Steps

### Immediate (For Testing):
1. **Keep using mock data** for now
2. Test UI/UX flows
3. Ensure registration form works

### Short-term (Setup Real Auth):
1. **Configure Supabase phone auth** (test mode)
2. **Update login/register screens** to use authService
3. **Create OTP verification screen**
4. **Test with Supabase test mode**

### Long-term (Production):
1. **Sign up for Twilio** account
2. **Configure SMS in Supabase**
3. **Add rate limiting**
4. **Implement error handling**
5. **Add analytics tracking**

---

## 📚 Related Files

- `packages/shared/services/authService.ts` - ✅ Created
- `apps/customer/app/login.tsx` - ⚠️ Needs update
- `apps/customer/app/register.tsx` - ⚠️ Needs update
- `apps/customer/app/otp-verification.tsx` - ❌ Needs creation
- `supabase/migrations/xxx_profiles_table.sql` - ⚠️ Verify schema

---

## ✅ Summary

**What's Ready:**
- ✅ Complete authentication service
- ✅ Registration logic
- ✅ OTP send/verify
- ✅ Profile management
- ✅ Session handling

**What's Needed:**
- ⚠️ Supabase phone auth configuration
- ⚠️ SMS provider setup (Twilio)
- ⚠️ Update UI screens to use authService
- ⚠️ Create OTP verification screen
- ⚠️ Test end-to-end flow

**Current Status:**
- 🎮 **Mock data works** for testing
- 🔧 **Real auth ready** once Supabase configured
- 📱 **Production ready** after SMS setup

---

**For now, continue testing with mock data. When ready to go live, follow the Supabase configuration steps above!** 🚀
