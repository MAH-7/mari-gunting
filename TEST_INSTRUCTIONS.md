# 🧪 Test Instructions - Mari Gunting Customer App

## Current Build Status
✅ **Security fixes applied**
✅ **Auth session bug fixed**
✅ **Existing user handling fixed**
✅ **Address management enhancements ready**

---

## 📱 Test Scenario 1: Existing User Login

### Setup
Your phone number `+601117834513` already exists in the system from previous tests.

### Expected Behavior
1. App should detect existing user
2. Should NOT try to create a new auth user
3. Should sign you in directly
4. Should show your existing profile

### Steps to Test
```bash
# Start the app (already running)
# Watch the console logs

1. In the app: Enter your phone: +601117834513
2. Click "Send OTP"
3. Enter OTP: 123456
4. Click "Verify"
```

### Expected Console Logs
```
🔐 DEV MODE: OTP for +601117834513 is: 123456
🔍 verifyOTP called with: {...}
✅ DEV MODE: Accepting test OTP 123456
ℹ️ Attempting to sign in with existing auth user...
ℹ️ Found existing user, attempting to restore session
✅ Found existing user: [Your Name]
```

### What to Watch For
- ❌ Should NOT see: "User already registered" error
- ❌ Should NOT see: "Failed to create auth user"
- ✅ Should see: "Found existing user"
- ✅ Should be logged in successfully

---

## 📱 Test Scenario 2: New User Registration

### Setup
Use a different phone number that doesn't exist in the system.

### Steps to Test
```bash
1. In the app: Enter NEW phone: +60123456789
2. Click "Send OTP"
3. Enter OTP: 123456
4. Click "Verify"
5. Should navigate to registration form
6. Fill in:
   - Full Name: Test User
   - Email: test@example.com
7. Submit registration
```

### Expected Console Logs
```
🔐 DEV MODE: OTP for +60123456789 is: 123456
✅ DEV MODE: Accepting test OTP 123456
ℹ️ Creating new auth user...
✅ New auth user created: [user-id]
⚠️ No session created by signUp, signing in explicitly...
✅ Authenticated session established: [token]...
ℹ️ New user - will need to register
```

### What to Watch For
- ✅ Should create new auth user
- ✅ Should establish session
- ✅ Should navigate to registration form
- ✅ Should be able to complete registration

---

## 📱 Test Scenario 3: Address Management

### After successful login, test address features:

```bash
1. Navigate to Profile → Addresses
2. Click "+ Add Address"
3. Click "Pick Location on Map"
4. Wait for map to load
5. Tap on a location
6. Click "Confirm Location"
7. Fill in address details:
   - Label: Home
   - Building Name: Tower A
   - Floor: 12
   - Unit: 12-03
   - Delivery Instructions: Leave at guard house
   - Contact Number: +60123456789
8. Check "Set as default"
9. Click "Save"
```

### Expected Behavior
- ✅ Map loads successfully
- ✅ Can select location
- ✅ Address populates automatically
- ✅ Can add building details
- ✅ Can save address
- ❌ Should NOT see "Not authenticated" error

---

## 🔍 Monitoring Console Logs

### Key Things to Watch

#### 1. Security Checks
```
✅ IS_DEV_MODE: true
✅ IS_PRODUCTION: false
```

#### 2. Session Management
```
✅ Authenticated session established: [token]...
```

#### 3. Address Operations
```
✅ Fetched [N] addresses
✅ Address added successfully
```

---

## ⚠️ Known Issues & Workarounds

### Issue 1: Metro Bundler Warnings
```
ENOENT: no such file or directory, open '.../Internal Bytecode.js'
```
**Status:** Safe to ignore - this is a Metro bundler sourcemap warning, doesn't affect functionality.

### Issue 2: Package Version Warnings
```
@sentry/react-native@6.22.0 - expected version: ~7.2.0
expo-router@6.0.11 - expected version: ~6.0.12
```
**Status:** Non-critical - app functions normally. Can update later.

---

## ✅ Success Criteria

### Authentication ✓
- [ ] Can login with existing phone number
- [ ] No "User already registered" errors
- [ ] Session established successfully
- [ ] Profile loaded correctly

### Address Management ✓
- [ ] Can view addresses list
- [ ] Can add new address
- [ ] Map picker works
- [ ] Building/floor/unit fields work
- [ ] Delivery instructions save
- [ ] Contact number saves
- [ ] No "Not authenticated" errors

### General UX ✓
- [ ] App doesn't crash
- [ ] Navigation works smoothly
- [ ] Forms submit successfully
- [ ] Data persists correctly

---

## 🐛 Troubleshooting

### Problem: Still seeing "User already registered"

**Solution 1: Clear Supabase Auth Data**
```bash
# In Supabase Dashboard:
1. Go to Authentication → Users
2. Find your test user (+601117834513)
3. Click "..." → Delete User
4. Try again
```

**Solution 2: Use Different Phone Number**
```bash
# Just use a different number for testing
# Example: +60123456789
```

### Problem: "Not authenticated" error when saving address

**Check:**
1. Console shows "✅ Authenticated session established"
2. Database migration is run
3. You're logged in (can see profile)

**If still failing:**
```bash
# Stop and restart Metro
Ctrl+C
npx expo start -c
```

### Problem: Map not loading

**Check:**
1. Mapbox token is set in .env
2. Location permission granted on device
3. Internet connection active

---

## 📊 Test Results Template

Use this to track your testing:

```
Date: [DATE]
Tester: [YOUR NAME]
Device: [iPhone/Android model]
OS Version: [iOS/Android version]

Test Scenario 1: Existing User Login
[ ] PASS / [ ] FAIL
Notes: _________________________

Test Scenario 2: New User Registration
[ ] PASS / [ ] FAIL
Notes: _________________________

Test Scenario 3: Address Management
[ ] PASS / [ ] FAIL
Notes: _________________________

Issues Found:
1. _________________________
2. _________________________

Overall Status: [ ] READY / [ ] NEEDS WORK
```

---

## 🚀 Next Steps After Testing

### If All Tests Pass ✅
1. Test on physical device (already deployed)
2. Try with different phone numbers
3. Test edge cases (slow network, etc.)
4. Ready for production setup (follow PRODUCTION_SETUP.md)

### If Tests Fail ❌
1. Note which scenario failed
2. Check console logs for errors
3. Share error messages
4. We'll debug together

---

## 📞 Need Help?

If you encounter issues:
1. Copy the full error from console
2. Note which step you were on
3. Check if issue is listed in "Known Issues"
4. Ask for help with specific error message

---

**Ready to test?** The app is running. Just try logging in with `+601117834513` and OTP `123456`! 🎉
