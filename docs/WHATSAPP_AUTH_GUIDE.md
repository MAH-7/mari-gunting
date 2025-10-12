# WhatsApp OTP Authentication - Implementation Guide

## 🎯 Goal
Implement **phone number login with WhatsApp OTP** for both Customer and Partner apps.

**User Flow:**
1. Enter phone number
2. Receive OTP via WhatsApp
3. Enter OTP code
4. Register (if new user) OR Login (if existing)

---

## ✅ What's Already Done

- ✅ `verify-otp.tsx` created in customer app
- ✅ `authService.ts` exists with OTP functions
- ✅ Login/Register screens exist
- ✅ Supabase configured

---

## 🚀 **IMPLEMENTATION STEPS** (1 hour)

### **Step 1: Copy OTP Screen to Partner App** (2 mins)

```bash
# In terminal, from project root:
cp apps/customer/app/verify-otp.tsx apps/partner/app/verify-otp.tsx
```

✅ Done! Both apps now have OTP verification screen.

---

### **Step 2: Update Login Screen - Customer App** (10 mins)

**File:** `apps/customer/app/login.tsx`

**Find this section** (around line 55-126):
```typescript
const handleLogin = async () => {
  // ... existing mock code ...
};
```

**Replace with:**
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

**Add import at the top** (after line 18):
```typescript
import { authService } from '@mari-gunting/shared/services/authService';
```

**Remove mock imports** (line 19):
```typescript
// Delete or comment out:
// import { mockCustomer } from '@/services/mockData';
```

**Remove Zustand store** (line 18, 25):
```typescript
// Delete or comment out:
// import { useStore } from '@/store/useStore';
// const setCurrentUser = useStore((state) => state.setCurrentUser);
```

---

### **Step 3: Update Login Screen - Partner App** (10 mins)

**File:** `apps/partner/app/login.tsx`

Do the EXACT SAME changes as Step 2, but in the Partner app.

**Additional:** Add role parameter for partner app:

```typescript
// In handleLogin, when navigating to OTP:
router.push({
  pathname: '/verify-otp',
  params: { 
    phoneNumber: fullPhone,
    role: 'barber', // ← Add this for partner app
  },
});
```

---

### **Step 4: Update Register Screen - Customer App** (15 mins)

**File:** `apps/customer/app/register.tsx`

**Find** `handleRegister` function (around line 67):

**Replace with:**
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
      avatarUrl: avatar || null,
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

**Remove mock imports:**
```typescript
// Delete:
// import { mockCustomer } from '@/services/mockData';
// import { useStore } from '@/store/useStore';
```

---

### **Step 5: Update Register Screen - Partner App** (10 mins)

**File:** `apps/partner/app/register.tsx`

Do the EXACT SAME changes as Step 4.

---

### **Step 6: Enable WhatsApp OTP in Supabase** (15 mins)

#### **Option A: With Twilio WhatsApp (Production)**

1. **Get Twilio WhatsApp:**
   - Go to https://www.twilio.com/
   - Sign up / Login
   - Go to **Messaging → Try it Out → Send a WhatsApp message**
   - Request WhatsApp sender approval
   - Get: Account SID, Auth Token, WhatsApp Number

2. **Configure in Supabase:**
   - Supabase Dashboard → **Authentication → Settings**
   - Click **Phone Auth**
   - Toggle **Enable Phone Sign-Up**
   - Provider: **Twilio**
   - Enter: Account SID, Auth Token
   - Phone Number: Your Twilio WhatsApp number (format: `whatsapp:+14155238886`)
   - Save

**Cost:** ~$1/month + $0.005 per WhatsApp message (cheaper than SMS!)

---

#### **Option B: Development Mode (FREE - Recommended for now)**

**For immediate testing without Twilio:**

Update `authService.ts` to use mock OTP in development:

**File:** `packages/shared/services/authService.ts`

**Add at the top** (after imports):
```typescript
const __DEV__ = process.env.NODE_ENV === 'development';
const TEST_OTP = '123456';
```

**In `sendOTP` method** (around line 109), add BEFORE the try block:
```typescript
async sendOTP(params: LoginParams): Promise<ApiResponse<{ sent: boolean }>> {
  // DEV MODE: Skip real OTP, use test OTP
  if (__DEV__) {
    console.log(`🔐 DEV MODE: OTP for ${params.phoneNumber} is: ${TEST_OTP}`);
    console.log('📱 WhatsApp OTP would be sent in production');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      data: { sent: true },
    };
  }

  // Production code below...
  try {
    // ... rest of existing code
```

**In `verifyOTP` method** (around line 141), add BEFORE the try block:
```typescript
async verifyOTP(
  phoneNumber: string,
  otp: string
): Promise<ApiResponse<{ user: UserProfile; session: any }>> {
  // DEV MODE: Accept test OTP
  if (__DEV__ && otp === TEST_OTP) {
    console.log(`✅ DEV MODE: Accepting test OTP ${TEST_OTP}`);
    
    // Create a mock session for development
    // Still check if user exists in database
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone_number', phoneNumber)
      .maybeSingle();

    if (data) {
      // Existing user
      return {
        success: true,
        data: {
          user: data,
          session: { /* mock session */ },
        },
      };
    } else {
      // New user - needs registration
      return {
        success: true,
        data: {
          user: null,
          session: null,
        },
      };
    }
  }

  // Production code below...
  try {
    // ... rest of existing code
```

**This lets you test WITHOUT Twilio! OTP is always `123456` in dev mode.**

---

### **Step 7: Test the Flow** (10 mins)

#### **Test 1: Customer Registration**

1. **Run Customer App:**
   ```bash
   cd apps/customer
   npm start
   # Press 'i' for iOS or 'a' for Android
   ```

2. **Test Flow:**
   - Login screen → Enter: `+60123456789`
   - Tap Continue
   - OTP screen → Enter: `123456` (dev mode)
   - Tap Verify
   - Register screen → Fill: Name, Email
   - Tap Complete Registration
   - ✅ Should go to main app

3. **Verify in Supabase:**
   - Dashboard → Table Editor → `profiles`
   - You should see your new user!

---

#### **Test 2: Partner Registration**

1. **Run Partner App:**
   ```bash
   # New terminal
   cd apps/partner
   npm start
   # Scan QR with phone
   ```

2. **Test Flow:**
   - Login → Enter: `+60987654321` (different number)
   - OTP: `123456`
   - Register → Fill details
   - ✅ Should create barber account

---

#### **Test 3: Existing User Login**

1. **Customer App:** 
   - Logout (if logged in)
   - Login with: `+60123456789` (registered earlier)
   - OTP: `123456`
   - ✅ Should skip registration, go straight to app

---

## 📊 **Implementation Checklist**

### **Files to Update:**
- [x] ✅ `apps/customer/app/verify-otp.tsx` (created)
- [ ] `apps/partner/app/verify-otp.tsx` (copy from customer)
- [ ] `apps/customer/app/login.tsx` (update handleLogin)
- [ ] `apps/partner/app/login.tsx` (update handleLogin)
- [ ] `apps/customer/app/register.tsx` (update handleRegister)
- [ ] `apps/partner/app/register.tsx` (update handleRegister)
- [ ] `packages/shared/services/authService.ts` (add dev mode)

### **Testing:**
- [ ] Can send OTP in customer app
- [ ] Can verify OTP and register
- [ ] Can login as existing customer
- [ ] Can send OTP in partner app  
- [ ] Can register as barber
- [ ] Can login as existing barber
- [ ] User appears in Supabase `profiles` table

---

## 🎉 **Success Metrics**

**You'll know it's working when:**

✅ Login sends OTP (shows "123456" in dev mode)  
✅ OTP screen has WhatsApp icon  
✅ Entering `123456` verifies successfully  
✅ New users go to registration  
✅ Existing users go to main app  
✅ Users appear in Supabase `profiles` table  
✅ Can login on MacBook (customer) and Phone (barber)  

---

## 🚨 **Common Issues**

### **Issue: "authService is not defined"**
**Fix:** Add import:
```typescript
import { authService } from '@mari-gunting/shared/services/authService';
```

### **Issue: "Cannot find module '@mari-gunting/shared'"**
**Fix:** Run:
```bash
npm install
# or
yarn install
```

### **Issue: OTP verification fails**
**Fix:** Make sure you added dev mode code to authService.ts

### **Issue: "Profile creation failed"**
**Fix:** Database migrations not applied. Apply them first.

---

## 📱 **WhatsApp vs SMS Comparison**

| Feature | WhatsApp | SMS |
|---------|----------|-----|
| Cost | $0.005/message | $0.0075/message |
| Delivery | Faster | Slower |
| User Experience | Better (in-app) | Standard |
| International | Excellent | Good |
| Setup | Same (Twilio) | Same (Twilio) |

**Recommendation:** Use WhatsApp for better UX and lower cost!

---

## 🔄 **Switching to Production**

When ready to go live:

1. **Get Twilio WhatsApp approved** (takes 1-2 days)
2. **Add Twilio credentials** to Supabase
3. **Remove dev mode code** from authService.ts
4. **Test with real phone numbers**
5. **Deploy!**

---

## 📞 **Next Steps**

After authentication works:

1. **Apply database migrations**
2. **Test multi-device** (MacBook + Phone)
3. **Implement booking creation**
4. **Test full marketplace flow**

---

**Estimated Time:** 1 hour for complete implementation

**Ready to start?** Follow the steps in order! 🚀

Let me know when you complete each step and I'll help if you get stuck!
