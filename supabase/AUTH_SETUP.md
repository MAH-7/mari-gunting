# 🔐 Authentication Setup Guide

## Overview
This guide will help you configure all authentication providers in Supabase.

---

## 📧 1. Email Authentication (Already Enabled)

Email authentication is enabled by default in Supabase. No additional configuration needed!

**Features:**
- ✅ Sign up with email/password
- ✅ Email verification
- ✅ Password reset
- ✅ Email change

---

## 📱 2. Phone Authentication (OTP/SMS)

### **Step 1: Enable Phone Auth**
1. Go to: https://supabase.com/dashboard/project/uufiyurcsldecspakneg/auth/providers
2. Click on **"Phone"**
3. Toggle **"Enable Phone provider"** ON
4. Click **"Save"**

### **Step 2: Configure SMS Provider**

For production, you need to configure a real SMS provider:

#### **Option A: Twilio (Recommended)**
1. Create Twilio account: https://www.twilio.com/
2. Get your credentials:
   - Account SID
   - Auth Token
   - Phone Number
3. In Supabase Phone settings:
   - Select **"Twilio"**
   - Enter your Twilio Account SID
   - Enter your Twilio Auth Token
   - Enter your Twilio Phone Number
   - Click **"Save"**

#### **Option B: MessageBird**
Similar process with MessageBird credentials

#### **Option C: Vonage**
Similar process with Vonage credentials

### **For Development/Testing:**
Supabase provides a built-in test SMS provider that logs OTPs to the console.
- Toggle **"Enable phone signup"**
- Use the built-in provider for testing

---

## 🔑 3. Google OAuth

### **Step 1: Create Google OAuth Credentials**

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/

2. **Create a New Project** (or select existing)

3. **Enable Google+ API:**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth Credentials:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Application type: **"Web application"**
   - Name: "Mari-Gunting"
   
5. **Add Authorized Redirect URIs:**
   ```
   https://uufiyurcsldecspakneg.supabase.co/auth/v1/callback
   ```

6. **Copy your credentials:**
   - Client ID
   - Client Secret

### **Step 2: Configure in Supabase**

1. Go to: https://supabase.com/dashboard/project/uufiyurcsldecspakneg/auth/providers
2. Find **"Google"** provider
3. Toggle **"Enable Sign in with Google"** ON
4. Enter your:
   - **Client ID**
   - **Client Secret**
5. Click **"Save"**

---

## 🍎 4. Apple Sign In

### **Step 1: Set up Apple Developer Account**

1. **Join Apple Developer Program:**
   - https://developer.apple.com/programs/
   - Cost: $99/year

2. **Create App ID:**
   - Go to: https://developer.apple.com/account/resources/identifiers
   - Click "+" to create new identifier
   - Select "App IDs"
   - Description: "Mari-Gunting"
   - Bundle ID: `com.marigunting.app` (or your chosen ID)
   - Enable "Sign In with Apple"

3. **Create Service ID:**
   - Create new identifier
   - Select "Services IDs"
   - Description: "Mari-Gunting Auth"
   - Identifier: `com.marigunting.auth`
   - Enable "Sign In with Apple"
   - Configure:
     - Domains: `uufiyurcsldecspakneg.supabase.co`
     - Return URLs: `https://uufiyurcsldecspakneg.supabase.co/auth/v1/callback`

4. **Create Private Key:**
   - Go to "Keys" section
   - Click "+" to create new key
   - Enable "Sign In with Apple"
   - Download the `.p8` key file
   - Note the Key ID

5. **Get Team ID:**
   - Found in your Apple Developer account at the top right

### **Step 2: Configure in Supabase**

1. Go to: https://supabase.com/dashboard/project/uufiyurcsldecspakneg/auth/providers
2. Find **"Apple"** provider
3. Toggle **"Enable Sign in with Apple"** ON
4. Enter:
   - **Services ID:** (e.g., com.marigunting.auth)
   - **Team ID:** (from Apple Developer account)
   - **Key ID:** (from the private key you created)
   - **Private Key:** (content of the .p8 file)
5. Click **"Save"**

---

## ⚙️ 5. Auth Settings Configuration

### **Email Templates**

Customize email templates:
1. Go to: https://supabase.com/dashboard/project/uufiyurcsldecspakneg/auth/templates
2. Customize:
   - Confirmation email
   - Magic link email
   - Password reset email
   - Email change email

### **URL Configuration**

1. Go to: https://supabase.com/dashboard/project/uufiyurcsldecspakneg/auth/url-configuration
2. Set:
   - **Site URL:** Your production URL (e.g., https://marigunting.com)
   - **Redirect URLs:** Add allowed redirect URLs

For development, add:
```
exp://localhost:8081
marigunting://
```

### **Security Settings**

1. Go to Settings
2. Configure:
   - ✅ **Enable email confirmations** (recommended)
   - ✅ **Secure password requirements**
   - ⏱️ **Session timeout:** 604800 (7 days)
   - 🔒 **JWT expiry:** 3600 (1 hour)

---

## 📱 6. Mobile App Configuration (Expo)

### **For React Native with Expo:**

Add to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "scheme": "marigunting",
    "ios": {
      "bundleIdentifier": "com.marigunting.app",
      "associatedDomains": [
        "applinks:uufiyurcsldecspakneg.supabase.co"
      ]
    },
    "android": {
      "package": "com.marigunting.app",
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "marigunting"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

---

## 🧪 Testing Authentication

### **Test Email Auth:**
```typescript
import { signUpWithEmail, signInWithEmail } from '@/shared';

// Sign up
const result = await signUpWithEmail({
  email: 'test@example.com',
  password: 'SecurePass123!',
  fullName: 'Test User',
  role: 'customer',
});

// Sign in
const result = await signInWithEmail({
  email: 'test@example.com',
  password: 'SecurePass123!',
});
```

### **Test Phone Auth:**
```typescript
import { signInWithPhone, verifyOTP, formatPhoneNumber } from '@/shared';

// Send OTP
const phone = formatPhoneNumber('0123456789'); // +60123456789
const result = await signInWithPhone({ phone });

// Verify OTP
const result = await verifyOTP({
  phone,
  token: '123456', // OTP from SMS
});
```

### **Test Google Sign In:**
```typescript
import { signInWithGoogle } from '@/shared';

const result = await signInWithGoogle();
```

---

## 🔄 Auth Flow Examples

### **Customer Sign Up Flow:**
1. User enters email/password or phone
2. System creates auth user
3. System creates profile with role='customer'
4. User is logged in
5. Redirect to customer dashboard

### **Barber Sign Up Flow:**
1. User enters email/password
2. System creates auth user
3. System creates profile with role='barber'
4. System creates barber profile entry
5. User is logged in
6. Redirect to barber onboarding

### **Session Management:**
- Session stored in AsyncStorage
- Auto-refresh on app launch
- Listen to auth state changes
- Handle token expiry gracefully

---

## 📝 Current Status

| Provider | Status | Notes |
|----------|--------|-------|
| ✅ Email | Enabled | Default, no config needed |
| ⏳ Phone | Needs Setup | Configure Twilio/SMS provider |
| ⏳ Google | Needs Setup | Requires Google OAuth credentials |
| ⏳ Apple | Needs Setup | Requires Apple Developer account |

---

## 🚀 Next Steps

**For MVP Launch:**
1. ✅ Email auth (already working)
2. ⚠️ Phone auth (setup Twilio for OTP)
3. 🔜 Google OAuth (optional but recommended)
4. 🔜 Apple Sign In (required for iOS App Store)

**Priority Order:**
1. **Email** - Working ✅
2. **Phone** - High priority (most users in Malaysia use this)
3. **Google** - Medium priority (convenience)
4. **Apple** - Required for iOS submission

---

## 💡 Tips

### **Phone Authentication in Malaysia:**
- Use Twilio for reliable SMS delivery
- Format all numbers to E.164: `+60123456789`
- Test with your own number first
- Monitor SMS costs (Twilio charges per SMS)

### **Social Auth Best Practices:**
- Always ask for profile completion after social sign-in
- Map social profile data to your profile fields
- Handle cases where email might not be provided
- Add linking/unlinking social accounts feature

### **Security Tips:**
- Enable email confirmation in production
- Use strong password requirements
- Implement rate limiting
- Add 2FA for sensitive accounts
- Monitor auth logs for suspicious activity

---

**Ready to configure?** Start with Phone Auth (most important for Malaysia market) 🚀

**Need help?** Check Supabase docs: https://supabase.com/docs/guides/auth
