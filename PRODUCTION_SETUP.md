# 🚀 Production Setup - Quick Guide

## ⚡ Quick Actions (15 Minutes)

### Step 1: Remove Sensitive Keys from Client (2 mins)

```bash
cd /Users/bos/Desktop/ProjectSideIncome/mari-gunting

# Backup current .env files
cp .env .env.backup
cp apps/customer/.env apps/customer/.env.backup

# Edit root .env - Remove this line:
# SUPABASE_SERVICE_ROLE_KEY=...
# Also remove TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN

# Edit apps/customer/.env - Remove same keys
```

**Use this command to verify removal:**
```bash
grep -E "(SERVICE_ROLE|TWILIO)" .env apps/customer/.env
# Should return no results
```

### Step 2: Set Supabase Edge Function Secrets (3 mins)

1. Open https://supabase.com/dashboard/project/uufiyurcsldecspakneg/settings/functions
2. Click "Edge Functions" → "Secrets"
3. Add these secrets:

```
TWILIO_ACCOUNT_SID=AC93abceea9412ca00be9c162f59c730a9
TWILIO_AUTH_TOKEN=c7bd3e155e3230eb6a162f274112b5b7
SUPABASE_SERVICE_ROLE_KEY=<from your backup .env>
```

### Step 3: Run Database Migrations (3 mins)

1. Open https://supabase.com/dashboard/project/uufiyurcsldecspakneg/sql/new
2. Copy-paste from: `supabase/migrations/20250501000002_fix_customer_address_rls.sql`
3. Click "Run"
4. Copy-paste from: `supabase/migrations/20250501000003_enhance_customer_addresses.sql`
5. Click "Run"

**Verify migrations:**
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'customer_addresses'
ORDER BY ordinal_position;
```

Should include: building_name, floor, unit_number, delivery_instructions, contact_number, address_type, landmark, gps_accuracy, last_used_at

### Step 4: Create Production Environment File (3 mins)

```bash
cd apps/customer

# Create production .env
cp .env.production.template .env.production

# Edit .env.production and set:
# - EXPO_PUBLIC_APP_ENV=production
# - EXPO_PUBLIC_USE_REAL_OTP=true
# - Configure optional services (Sentry, Cloudinary, etc.)
```

### Step 5: Test Current Dev Build (4 mins)

```bash
# Test authentication fix works
cd apps/customer
npx expo start -c

# On your device:
1. Close app completely
2. Reopen
3. Login with OTP (123456)
4. Watch console for: "✅ Authenticated session established"
5. Try adding an address
6. Should work without "Not authenticated" error
```

---

## 🔒 Security Verification

Run these checks:

```bash
cd /Users/bos/Desktop/ProjectSideIncome/mari-gunting

# 1. Verify no service role key in client code
echo "Checking for SERVICE_ROLE_KEY..."
grep -r "SERVICE_ROLE" --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" .
# Should only find references in edge functions/backend code

# 2. Verify Twilio keys not in client  
echo "Checking for Twilio keys..."
grep -r "TWILIO_" apps/customer --exclude-dir=node_modules
# Should return no results in .env or code

# 3. Check production mode setup
echo "Checking production environment..."
grep "EXPO_PUBLIC_APP_ENV" apps/customer/.env.production
# Should return: EXPO_PUBLIC_APP_ENV=production

# 4. Verify test OTP protection
echo "Checking OTP security..."
grep "IS_PRODUCTION" packages/shared/services/authService.ts
# Should find the new security check
```

---

## 📋 Production Build Checklist

Before building for production:

### Must Have ✅
- [x] Database migrations run
- [x] Security fixes applied (test OTP protection)
- [x] Service role key removed from client
- [x] Authentication session fix implemented
- [ ] Production .env file created
- [ ] Tested complete user flow on dev build
- [ ] Supabase edge function secrets set

### Should Have 🟡
- [ ] Sentry configured (error tracking)
- [ ] Cloudinary configured (image uploads)
- [ ] Stripe configured (payments)
- [ ] Push notifications configured
- [ ] Analytics configured

### Nice to Have 🔵
- [ ] App Store assets ready
- [ ] Play Store assets ready
- [ ] Privacy policy URL
- [ ] Terms of service URL

---

## 🏗️ Build Commands

### For Testing (Development Build)
```bash
cd apps/customer

# iOS
npx expo run:ios --device

# Android
npx expo run:android --device
```

### For Production (When Ready)
```bash
cd apps/customer

# Install EAS CLI (if not already installed)
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS (first time only)
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production
```

---

## 🧪 Testing Production Build

### Option 1: TestFlight (iOS)
```bash
# After EAS build completes:
eas submit --platform ios

# Then test via TestFlight:
1. Download TestFlight app
2. Get invite link from App Store Connect
3. Install beta build
4. Test all critical flows
```

### Option 2: Internal Testing (Android)
```bash
# After EAS build completes:
eas submit --platform android

# Then test via Play Console:
1. Go to Play Console
2. Internal Testing track
3. Download and install
4. Test all critical flows
```

### Critical Test Cases
1. ✅ Login with REAL phone number (not test OTP)
2. ✅ OTP SMS arrives
3. ✅ Registration works
4. ✅ Address creation works
5. ✅ Map picker works
6. ✅ Barber search works
7. ✅ No crashes or errors

---

## ⚠️ Pre-Launch Warnings

### DO NOT launch without:
1. **Real OTP testing** - Test with your actual phone number
2. **Service role key secured** - Verify it's not in client bundle
3. **Database migrations** - All migrations must be applied
4. **Monitoring setup** - At least Sentry for crash tracking

### OPTIONAL but recommended:
1. Image uploads (Cloudinary)
2. Payments (Stripe)
3. Push notifications
4. Analytics

---

## 📊 Post-Launch Monitoring

### First Hour
```bash
# Check Supabase logs
https://supabase.com/dashboard/project/uufiyurcsldecspakneg/logs/edge-functions

# Check for errors
# Look for OTP delivery issues
# Monitor user registrations
```

### First Day
- Monitor crash rate (Sentry)
- Check OTP delivery success
- Review user feedback
- Monitor API response times

### First Week
- Analyze user behavior
- Review feature usage
- Check retention rates
- Identify bugs/issues

---

## 🆘 Rollback Plan

If critical issues found:

```bash
# Option 1: Quick fix via hotfix
1. Fix issue in code
2. Run: eas build --platform ios --profile production
3. Submit: eas submit --platform ios

# Option 2: Database rollback
1. Go to Supabase Dashboard
2. Database → Backups
3. Restore to point before issue

# Option 3: Disable features
1. Update remote config (if implemented)
2. Or push emergency update with features disabled
```

---

## 📞 Support Contacts

- **Supabase**: support@supabase.com
- **Expo EAS**: support@expo.dev  
- **Mapbox**: help@mapbox.com
- **Sentry**: support@sentry.io

---

## ✅ Ready to Go?

Your current status:
- ✅ Authentication fix applied
- ✅ Security vulnerability fixed (test OTP protection)
- ✅ Address management enhancements ready
- ✅ Database migrations created
- ✅ Production checklist provided

**Next steps:**
1. Remove sensitive keys from client (Step 1)
2. Set Supabase edge function secrets (Step 2)
3. Run database migrations (Step 3)
4. Create production .env (Step 4)
5. Test thoroughly
6. Build for production when ready

**Estimated time to production-ready: 15-30 minutes** (excluding third-party service setup)

Good luck! 🚀
