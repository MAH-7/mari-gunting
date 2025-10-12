# Production Readiness Checklist - Mari Gunting Customer App

## ⚠️ CRITICAL ISSUES FOUND

### 🔴 **BLOCKING** - Must fix before production

1. **❌ App Environment Still Set to Development**
   - **File:** `apps/customer/.env`
   - **Current:** `EXPO_PUBLIC_APP_ENV=development`
   - **Required:** `EXPO_PUBLIC_APP_ENV=production`
   - **Impact:** Using test OTP (123456) instead of real SMS
   - **Fix:** See Section 1 below

2. **❌ Test OTP Enabled in Production**
   - **File:** `packages/shared/services/authService.ts`
   - **Issue:** `IS_DEV_MODE` will allow test OTP in production
   - **Impact:** Security vulnerability - anyone can login with 123456
   - **Fix:** See Section 2 below

3. **❌ Real OTP Disabled**
   - **File:** `apps/customer/.env`
   - **Current:** `EXPO_PUBLIC_USE_REAL_OTP=false`
   - **Required:** `EXPO_PUBLIC_USE_REAL_OTP=true`
   - **Impact:** Won't send real SMS to users
   - **Fix:** See Section 1 below

4. **❌ Service Role Key Exposed in .env**
   - **File:** Root `.env` and `apps/customer/.env`
   - **Issue:** Service role key visible in app .env files
   - **Impact:** CRITICAL SECURITY RISK
   - **Fix:** See Section 3 below

5. **❌ Analytics & Error Tracking Disabled**
   - **Current:** Both set to `false`
   - **Impact:** No monitoring in production
   - **Fix:** See Section 4 below

6. **❌ Sentry Auto-Upload Disabled**
   - **File:** `apps/customer/.env`
   - **Current:** `SENTRY_DISABLE_AUTO_UPLOAD=true`
   - **Impact:** No error tracking/crash reports
   - **Fix:** See Section 5 below

### 🟡 **WARNING** - Should fix before production

7. **⚠️ Missing Cloudinary Configuration**
   - No cloud image storage configured
   - Users can't upload profile pictures
   - Fix: Configure Cloudinary or alternative

8. **⚠️ Missing Payment Configuration**
   - No Stripe publishable key
   - No FPX merchant ID
   - Fix: Configure payment provider

9. **⚠️ Missing Push Notifications**
   - No FCM or OneSignal configured
   - Users won't receive booking updates
   - Fix: Configure push notification service

10. **⚠️ Mapbox Downloads Token Redacted**
    - Current: `MAPBOX_DOWNLOADS_TOKEN=****************`
    - Impact: iOS builds may fail
    - Fix: Set proper secret token

---

## 🔧 REQUIRED FIXES

### Section 1: Environment Configuration

Create separate production environment file:

```bash
# Create production .env
cp apps/customer/.env apps/customer/.env.production
```

**File:** `apps/customer/.env.production`
```bash
# Mari-Gunting Customer App - PRODUCTION

# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://uufiyurcsldecspakneg.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1Zml5dXJjc2xkZWNzcGFrbmVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5ODA4MjQsImV4cCI6MjA3NTU1NjgyNH0.tVAsj6vmw3qq3Y4L9rBZROL_zqs3i_6seNnV-eQvbUk

# Environment - CRITICAL: Set to production
EXPO_PUBLIC_APP_ENV=production

# OTP - CRITICAL: Enable real OTP in production
EXPO_PUBLIC_USE_REAL_OTP=true

# Twilio (for Supabase Edge Functions only)
# These should be set in Supabase Edge Function secrets, NOT here
# TWILIO_ACCOUNT_SID=<YOUR_PRODUCTION_SID>
# TWILIO_AUTH_TOKEN=<YOUR_PRODUCTION_TOKEN>

# Mapbox
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoiZW1hbmhha2ltIiwiYSI6ImNtZ2w2Y2ZnNzByZWUycnE0Zzh5aHliMzYifQ.vrYCXoePJpvs2ZqlQ1tCWg
MAPBOX_DOWNLOADS_TOKEN=sk.eyJ1IjoiZW1hbmhha2ltIiwiYSI6ImNtZ2w5eXU1ZzB1cm8ybXIwMDRqM3h6aDkifQ.ZdyMyuG28SSC0irpcQc8rw

# Cloudinary - REQUIRED for image uploads
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=<YOUR_CLOUD_NAME>
EXPO_PUBLIC_CLOUDINARY_API_KEY=<YOUR_API_KEY>
EXPO_PUBLIC_CLOUDINARY_AVATAR_PRESET=<YOUR_PRESET>

# Sentry - REQUIRED for error tracking
EXPO_PUBLIC_SENTRY_DSN=<YOUR_SENTRY_DSN>
SENTRY_ORG=<YOUR_ORG>
SENTRY_PROJECT=mari-gunting-customer
SENTRY_AUTH_TOKEN=<YOUR_AUTH_TOKEN>
# Enable auto-upload in production
SENTRY_DISABLE_AUTO_UPLOAD=false

# Stripe - REQUIRED for payments
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=<YOUR_PRODUCTION_KEY>
EXPO_PUBLIC_FPX_MERCHANT_ID=<YOUR_MERCHANT_ID>

# Push Notifications - REQUIRED
EXPO_PUBLIC_FCM_API_KEY=<YOUR_FCM_KEY>
EXPO_PUBLIC_ONESIGNAL_APP_ID=<YOUR_ONESIGNAL_ID>

# Analytics - ENABLE in production
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_ENABLE_ERROR_TRACKING=true
EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true

# Google Analytics
EXPO_PUBLIC_GA_TRACKING_ID=<YOUR_GA_ID>
EXPO_PUBLIC_MIXPANEL_TOKEN=<YOUR_MIXPANEL_TOKEN>

# EAS
EXPO_PUBLIC_EAS_PROJECT_ID=<YOUR_EAS_PROJECT_ID>

# App Configuration
EXPO_PUBLIC_API_URL=https://uufiyurcsldecspakneg.supabase.co
EXPO_PUBLIC_WEB_URL=https://marigunting.com
EXPO_PUBLIC_APP_SCHEME=marigunting

# Business Configuration
EXPO_PUBLIC_COMMISSION_RATE=0.15
EXPO_PUBLIC_CANCELLATION_WINDOW=24
EXPO_PUBLIC_DEFAULT_SEARCH_RADIUS=10
```

### Section 2: Fix Test OTP Security Issue

**Problem:** Current code allows test OTP (123456) in any environment where `EXPO_PUBLIC_APP_ENV=development`

**File:** `packages/shared/services/authService.ts`

**Current Code (Line 10):**
```typescript
const IS_DEV_MODE = process.env.EXPO_PUBLIC_APP_ENV === 'development';
```

**Fixed Code:**
```typescript
import Constants from 'expo-constants';

// Only allow test OTP in actual development/local builds
// NOT in production or staging, even if APP_ENV is somehow set wrong
const IS_DEV_MODE = 
  process.env.EXPO_PUBLIC_APP_ENV === 'development' && 
  !Constants.appOwnership && // Running in Expo Go or dev client
  __DEV__; // React Native debug mode

const IS_PRODUCTION = process.env.EXPO_PUBLIC_APP_ENV === 'production';
```

**Apply this fix:**
```typescript
// In verifyOTP function (around line 308)
// BEFORE:
if (IS_DEV_MODE && otp === TEST_OTP) {

// AFTER:
if (IS_DEV_MODE && otp === TEST_OTP && !IS_PRODUCTION) {
```

### Section 3: Remove Service Role Key from Client

**CRITICAL SECURITY ISSUE:** Service role key should NEVER be in client-side code.

**Action Required:**

1. **Remove from all .env files:**
```bash
# Remove this line from all .env files
# SUPABASE_SERVICE_ROLE_KEY=...
```

2. **Set in Supabase Edge Functions only:**
   - Go to Supabase Dashboard → Edge Functions → Secrets
   - Add `SUPABASE_SERVICE_ROLE_KEY` there
   - Use in edge functions only, never in client

3. **Verify removal:**
```bash
cd /Users/bos/Desktop/ProjectSideIncome/mari-gunting
grep -r "SERVICE_ROLE" --exclude-dir=node_modules --exclude-dir=.git
```

### Section 4: Enable Production Monitoring

**Required Services:**

1. **Sentry (Error Tracking)**
   ```bash
   # Sign up: https://sentry.io
   # Create project: mari-gunting-customer
   # Get DSN and add to .env.production
   ```

2. **Google Analytics (Usage Tracking)**
   ```bash
   # Create GA4 property
   # Get Measurement ID
   # Add to .env.production
   ```

3. **Mixpanel (Product Analytics)**
   ```bash
   # Sign up: https://mixpanel.com
   # Get project token
   # Add to .env.production
   ```

### Section 5: Configure Sentry Properly

**Current Issue:** Auto-upload disabled

**Fix:**

1. **In production .env:**
   ```bash
   SENTRY_DISABLE_AUTO_UPLOAD=false
   SENTRY_ORG=your-org-slug
   SENTRY_PROJECT=mari-gunting-customer
   SENTRY_AUTH_TOKEN=<get from sentry.io/settings/account/api/auth-tokens/>
   ```

2. **Install Sentry CLI:**
   ```bash
   npm install -g @sentry/cli
   sentry-cli login
   ```

3. **Test source map upload:**
   ```bash
   cd apps/customer
   npx expo export
   ```

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### A. Database & Backend

- [ ] Run all pending migrations
  ```sql
  -- Check in Supabase Dashboard → Database → Migrations
  -- Ensure these are run:
  -- ✓ 20250501000002_fix_customer_address_rls.sql
  -- ✓ 20250501000003_enhance_customer_addresses.sql
  ```

- [ ] Verify RLS policies are active
  ```sql
  -- Test in Supabase SQL Editor
  SELECT tablename, policyname, permissive, roles, cmd 
  FROM pg_policies 
  WHERE schemaname = 'public';
  ```

- [ ] Set up Supabase Edge Function secrets
  ```bash
  # In Supabase Dashboard → Edge Functions → Secrets
  TWILIO_ACCOUNT_SID=<production-sid>
  TWILIO_AUTH_TOKEN=<production-token>
  SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
  ```

- [ ] Test OTP delivery
  ```bash
  # Use real phone number, verify SMS arrives
  # Test from Supabase Edge Function logs
  ```

### B. App Configuration

- [ ] Create production .env file
  ```bash
  cp apps/customer/.env apps/customer/.env.production
  # Edit with production values
  ```

- [ ] Update environment to production
  ```bash
  EXPO_PUBLIC_APP_ENV=production
  EXPO_PUBLIC_USE_REAL_OTP=true
  ```

- [ ] Remove sensitive keys from client
  ```bash
  # Remove SERVICE_ROLE_KEY from all .env files
  # Remove Twilio keys from client .env
  ```

- [ ] Configure all third-party services
  - [x] Supabase (configured)
  - [x] Mapbox (configured)
  - [ ] Cloudinary (image uploads)
  - [ ] Stripe (payments)
  - [ ] Sentry (error tracking)
  - [ ] FCM/OneSignal (push notifications)
  - [ ] Google Analytics (analytics)

### C. Security

- [ ] Verify no test OTP in production build
  ```bash
  # Build production, test login
  # Ensure 123456 does NOT work
  ```

- [ ] Check bundle identifier
  ```bash
  # iOS: com.marigunting.app
  # Android: com.marigunting.app
  ```

- [ ] Verify SSL/HTTPS for all endpoints
  ```bash
  # All API calls use https://
  ```

- [ ] Test RLS policies with real users
  ```bash
  # User A cannot access User B's data
  # Test in Supabase SQL Editor with different auth.uid()
  ```

### D. Features

- [ ] Test complete user flow
  - [ ] OTP login (real phone)
  - [ ] Registration
  - [ ] Profile setup
  - [ ] Address management
  - [ ] Barber search
  - [ ] Booking creation
  - [ ] Payment (if enabled)
  - [ ] Booking tracking

- [ ] Test map features
  - [ ] Location permission
  - [ ] Current location detection
  - [ ] Address search
  - [ ] Map picker

- [ ] Test push notifications (if enabled)
  - [ ] Device registration
  - [ ] Notification receipt
  - [ ] Deep linking

### E. Performance

- [ ] Enable Hermes engine (already enabled)
- [ ] Test app on low-end device
- [ ] Measure app size
  ```bash
  # Should be < 50MB
  ls -lh apps/customer/ios/build/*.ipa
  ```

- [ ] Check startup time (< 3 seconds)
- [ ] Test offline mode

### F. Monitoring

- [ ] Sentry error tracking working
  ```bash
  # Trigger test error, verify in Sentry dashboard
  ```

- [ ] Analytics events firing
  ```bash
  # Check Google Analytics/Mixpanel dashboard
  ```

- [ ] Crash reporting active
  ```bash
  # Force crash, verify report received
  ```

---

## 🚀 PRODUCTION BUILD COMMANDS

### Option 1: EAS Build (Recommended)

```bash
cd apps/customer

# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Submit to App Store
eas submit --platform ios

# Submit to Play Store
eas submit --platform android
```

### Option 2: Local Build

```bash
cd apps/customer

# iOS
npx expo run:ios --configuration Release --device

# Android
npx expo run:android --variant release
```

---

## 📱 APP STORE PREPARATION

### iOS App Store

- [ ] Apple Developer Account ($99/year)
- [ ] App Store Connect setup
- [ ] Bundle ID: `com.marigunting.app`
- [ ] Screenshots (6.5", 5.5" displays)
- [ ] App icon (1024x1024)
- [ ] Privacy policy URL
- [ ] Terms of service URL
- [ ] App description & keywords
- [ ] Age rating
- [ ] App Review Information

### Google Play Store

- [ ] Google Play Console Account ($25 one-time)
- [ ] Package name: `com.marigunting.app`
- [ ] Screenshots (phone & tablet)
- [ ] Feature graphic (1024x500)
- [ ] App icon (512x512)
- [ ] Privacy policy URL
- [ ] Content rating questionnaire
- [ ] Store listing details

---

## 🧪 PRODUCTION TESTING

### Before Release

```bash
# 1. Create production build
eas build --platform ios --profile production

# 2. Install on test devices
# iOS: Via TestFlight
# Android: Via internal testing track

# 3. Test all critical flows
- Registration with real phone
- Login with real phone
- Address management
- Barber search
- Booking flow
- Payment (if enabled)

# 4. Monitor logs
- Check Sentry for errors
- Check Analytics for events
- Check Supabase logs

# 5. Verify no development artifacts
- No test OTP working
- No console.log spam
- No debug features visible
```

---

## ⚠️ POST-DEPLOYMENT MONITORING

### First 24 Hours

- [ ] Monitor Sentry for crashes
- [ ] Check user registration rate
- [ ] Monitor OTP delivery success
- [ ] Check booking completion rate
- [ ] Monitor API response times
- [ ] Check database performance
- [ ] Monitor storage usage

### First Week

- [ ] Analyze user behavior (Analytics)
- [ ] Review crash-free rate (>99%)
- [ ] Check user feedback/reviews
- [ ] Monitor server costs
- [ ] Review feature usage
- [ ] Identify bottlenecks

---

## 🔄 ROLLBACK PLAN

If critical issues found:

```bash
# 1. Disable problematic features via remote config
# (if implemented)

# 2. Push hotfix build
eas build --platform ios --profile production
eas submit --platform ios

# 3. Force update users (if critical security issue)
# Implement version check in app

# 4. Database rollback (if needed)
# Use Supabase point-in-time recovery

# 5. Communicate with users
# Push notification + email + in-app message
```

---

## 📊 SUCCESS METRICS

Track these after launch:

### Technical
- Crash-free rate: >99%
- ANR rate: <0.5%
- App startup time: <3s
- API response time: <500ms
- Database query time: <100ms

### Business
- User registration rate
- OTP delivery success: >95%
- Booking completion rate
- User retention (D1, D7, D30)
- Active users (DAU, MAU)
- Revenue (if payment enabled)

---

## 🆘 EMERGENCY CONTACTS

- **Supabase Support**: support@supabase.com
- **Sentry Support**: support@sentry.io
- **Mapbox Support**: help@mapbox.com
- **Expo Support**: support@expo.dev

---

## ✅ FINAL SIGN-OFF

Before deploying to production, confirm:

- [ ] All CRITICAL issues fixed (Section 1-6)
- [ ] Production .env file created with correct values
- [ ] Test OTP disabled in production builds
- [ ] Service role key removed from client
- [ ] All third-party services configured
- [ ] Complete user flow tested on production build
- [ ] Monitoring and analytics active
- [ ] App Store / Play Store assets ready
- [ ] Rollback plan documented
- [ ] Team briefed on deployment

**Deployment Approval:**
- Developer: ________________ Date: ________
- QA: ________________ Date: ________
- Product Owner: ________________ Date: ________

---

**Ready to deploy?** Start with Section 1 - fix the environment configuration, then work through each section systematically.
