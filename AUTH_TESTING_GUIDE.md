# Authentication Testing Guide
## Mari Gunting - Login & Registration Testing

**Status:** ✅ Both apps configured and ready for testing  
**Last Updated:** 2025-10-12 04:42 UTC

---

## 🎯 Overview

This guide will help you test the authentication flows in both Customer and Partner apps. Both apps use the same authentication service with **Supabase** for backend and support **dev mode** with test OTP.

---

## 🔐 Test Credentials

### Dev Mode (Current Configuration)
- **Test OTP:** `123456`
- **Environment:** Development (auto-detected when running on Expo)
- **Backend:** Supabase (Real backend with dev mode OTP)

### Existing Test Accounts in Database
- **Customer:** `+6011-111 1111` (or `11-111 1111` formatted)
- **Partner:** `+6022-222 2222` (or `22-222 2222` formatted)

---

## 📱 Customer App Testing

### Test 1: Existing Customer Login ✅
**Steps:**
1. Open Customer app (should be running on `http://localhost:8081`)
2. Enter phone number: `11-111 1111`
3. Tap "Continue"
4. Wait for OTP screen
5. Enter OTP: `123456`
6. Tap "Verify Code"

**Expected Result:**
- ✅ User logged in successfully
- ✅ Navigates to home screen (tabs)
- ✅ User profile loaded in store

**What's Happening:**
- `authService.sendOTP()` - Simulates sending OTP (dev mode)
- `authService.verifyOTP()` - Checks if phone exists in profiles table
- If exists → Loads profile → Saves to Zustand store → Navigates to `/(tabs)`

---

### Test 2: New Customer Registration ✅
**Steps:**
1. Open Customer app
2. Enter a NEW phone number: `19-999 8888`
3. Tap "Continue"
4. Enter OTP: `123456`
5. Should navigate to registration screen
6. Fill in:
   - Full Name: "Test Customer"
   - Email: "test@customer.com"
7. Tap "Complete Registration"

**Expected Result:**
- ✅ Profile created in Supabase
- ✅ User logged in
- ✅ Navigates to home screen

**What's Happening:**
- After OTP verification, checks if profile exists
- If NOT exists → Routes to `/register` screen
- User fills profile form
- `authService.register()` creates profile in database
- Saves to store → Navigates to app

---

## 🛠️ Partner App Testing

### Test 3: Existing Partner Login ✅
**Steps:**
1. Open Partner app (should be running on `http://localhost:8082` or different port)
2. Tap "Already have an account? Login"
3. Enter phone number: `22-222 2222`
4. Tap "Continue"
5. Enter OTP: `123456`
6. Tap "Verify Code"

**Expected Result:**
- ✅ Partner logged in successfully
- ✅ Navigates to partner dashboard
- ✅ Partner profile loaded

**What's Happening:**
- Same flow as customer login
- After OTP, checks if profile exists with `role: 'barber'`
- If exists → Loads profile → Routes to `/` (index handles routing logic)

---

### Test 4: New Partner Registration ✅
**Steps:**
1. Open Partner app
2. Tap "Become a Partner" (Register button)
3. Enter a NEW phone number: `17-888 9999`
4. Tap "Continue"
5. Enter OTP: `123456`
6. Should navigate to "Complete Profile" screen
7. Fill in:
   - Full Name: "Test Barber"
   - Email: "test@barber.com"
8. Tap "Complete Registration"

**Expected Result:**
- ✅ Partner profile created with `role: 'barber'`
- ✅ Profile saved to database
- ✅ Navigates to onboarding or setup flow

**What's Happening:**
- `/verify-otp` → Checks phone exists
- If NOT exists → Routes to `/complete-profile` with `role: 'barber'`
- After registration → Routes to `/` (index determines next step based on account status)

---

## 🐛 Dev Mode Features

### Visual Indicators
Both apps show a **yellow dev hint banner** on OTP screen:
```
🐛 Dev Mode: Use OTP 123456
```

### How Dev Mode Works
Located in: `packages/shared/services/authService.ts`

```typescript
const IS_DEV_MODE = 
  process.env.EXPO_PUBLIC_APP_ENV === 'development' && 
  __DEV__;

const TEST_OTP = '123456';
```

**When dev mode is active:**
- ✅ `sendOTP()` → Skips real SMS, console logs OTP
- ✅ `verifyOTP()` → Accepts `123456` as valid OTP
- ✅ `register()` → Uses deterministic UUIDs from phone number
- ✅ All database operations still work normally

---

## 🔍 Troubleshooting

### Issue: "Invalid OTP"
**Solution:**
- Make sure you're in dev mode (`__DEV__` should be true)
- Use exactly `123456` (6 digits)
- Check console logs for OTP verification details

### Issue: "Profile not found after login"
**Solution:**
- Check Supabase database - does profile exist?
- Run: `SELECT * FROM profiles WHERE phone_number = '+60...'`
- If not exists, use registration flow instead

### Issue: "Registration fails"
**Possible Causes:**
1. Phone number already registered → Use login instead
2. RLS (Row Level Security) blocking insert → Check Supabase policies
3. Network error → Check Supabase connection

**Debug Steps:**
```bash
# Check Supabase status
supabase status

# View profiles table
supabase db dump -t profiles

# Check RLS policies
supabase db dump --schema public --table profiles
```

### Issue: App won't start
**Solution:**
```bash
# Kill all node processes
killall -9 node

# Clear cache and restart
cd apps/customer && npm start -- --clear
# OR
cd apps/partner && npm start -- --clear
```

---

## 📊 Testing Checklist

### Customer App
- [ ] Login with existing customer (`11-111 1111`)
- [ ] Register new customer
- [ ] Verify OTP resend works
- [ ] Verify "Back" button works
- [ ] Check profile loads correctly after login

### Partner App
- [ ] Login with existing partner (`22-222 2222`)
- [ ] Register new partner
- [ ] Verify OTP resend works
- [ ] Check register → login flow switch
- [ ] Verify role is set to 'barber' correctly

---

## 🔧 Authentication Flow Architecture

```
┌─────────────┐
│ Login Screen│
└──────┬──────┘
       │ Enter phone + tap Continue
       ▼
┌──────────────────┐
│ authService.     │
│  sendOTP()       │ ─── Dev: Logs "123456", returns success
└──────┬───────────┘     Prod: Sends real SMS via Twilio
       │
       ▼
┌──────────────────┐
│ OTP Screen       │
│ Enter 6 digits   │
└──────┬───────────┘
       │ Tap "Verify Code"
       ▼
┌──────────────────┐
│ authService.     │
│  verifyOTP()     │ ─── Dev: Accept "123456"
└──────┬───────────┘     Prod: Verify with Supabase
       │
       ▼
┌──────────────────┐
│ Check if         │
│ phone exists     │
└──────┬───────────┘
       │
   ┌───┴───┐
   │       │
EXISTS    NEW USER
   │       │
   ▼       ▼
Login    Register
Screen   Screen
   │       │
   └───┬───┘
       │
       ▼
┌─────────────┐
│ Save profile │
│ to Zustand  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Navigate to │
│  Main App   │
└─────────────┘
```

---

## 📝 Files to Know

### Authentication Service
- `packages/shared/services/authService.ts` - Main auth logic
- `packages/shared/config/supabase.ts` - Supabase client

### Customer App
- `apps/customer/app/login.tsx` - Login screen
- `apps/customer/app/verify-otp.tsx` - OTP verification
- `apps/customer/app/register.tsx` - Registration form (if exists)
- `apps/customer/store/useStore.ts` - Zustand store

### Partner App
- `apps/partner/app/login.tsx` - Login screen
- `apps/partner/app/register.tsx` - Registration entry (phone number)
- `apps/partner/app/verify-otp.tsx` - OTP verification
- `apps/partner/app/complete-profile.tsx` - Registration form
- `apps/partner/store/useStore.ts` - Zustand store

---

## ✅ Testing Complete!

Once you've tested all flows:
1. ✅ Customer login works
2. ✅ Customer registration works
3. ✅ Partner login works
4. ✅ Partner registration works

Then your authentication is **production-ready** (just need to disable dev mode for production).

---

## 🚀 Production Deployment

When deploying to production:

1. **Set environment variable:**
   ```bash
   EXPO_PUBLIC_APP_ENV=production
   ```

2. **What changes:**
   - ❌ Dev mode disabled
   - ✅ Real SMS via Twilio
   - ✅ Real OTP verification
   - ✅ All security checks enabled

3. **Test in production:**
   - Use real phone numbers
   - Receive real SMS
   - Enter real 6-digit OTP

---

**Need help?** Check console logs for detailed debugging information!

Last updated: 2025-10-12 04:42 UTC
