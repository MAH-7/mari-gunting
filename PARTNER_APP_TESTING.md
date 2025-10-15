# 🛠️ Partner App Testing Guide

**Date:** 2025-10-12  
**Status:** ✅ Ready to Test

---

## 🎯 What to Test

The Partner app has the same authentication as Customer app, with role set to `barber`.

---

## 📱 Test Scenarios

### Test 1: New Partner Registration ✅

**Steps:**
1. Open Partner app (scan QR code or press `i` for iOS simulator)
2. You should see login screen with "Become a Partner" button
3. Tap "**Register**" or "**Become a Partner**"
4. Enter your **real phone number** (Malaysian format)
   - Example: `12-345 6789`
5. Tap "**Continue**"
6. Wait for SMS/OTP (check your phone!)
7. Enter the **6-digit OTP** you received
8. Tap "**Verify Code**"
9. Should navigate to **Complete Profile** screen
10. Fill in:
    - **Full Name**: Your name
    - **Email**: Your email
11. Tap "**Complete Registration**"
12. ✅ Should create partner account with `role: 'barber'`
13. ✅ Should navigate to partner dashboard

**Expected Result:**
- ✅ Partner profile created in database
- ✅ Role set to `barber`
- ✅ Can access partner features

---

### Test 2: Existing Partner Login ✅

**Steps:**
1. Open Partner app
2. Tap "**Already have an account? Login**"
3. Enter your **registered phone number**
4. Tap "**Continue**"
5. Receive OTP via SMS
6. Enter the OTP
7. Tap "**Verify Code**"
8. ✅ Should log in directly
9. ✅ Should load existing partner profile
10. ✅ Should navigate to partner dashboard

**Expected Result:**
- ✅ Existing partner logged in
- ✅ Profile loaded from database
- ✅ No registration required

---

### Test 3: Switch Between Apps 🔄

Test that roles are separate:

**Steps:**
1. Register as **Partner** (role: `barber`)
2. Close app
3. Open **Customer app**
4. Try to login with **same phone number**
5. Should prompt for registration (different role)
6. Register as **Customer** (role: `customer`)

**Expected Result:**
- ✅ Same phone can have different roles
- ✅ Partner profile separate from Customer profile
- ⚠️ Or you might get error (depending on your business logic)

---

## 🔍 What to Check

### In the App
- [ ] Login screen loads
- [ ] Registration screen loads
- [ ] Phone number input works
- [ ] OTP is received via SMS
- [ ] OTP verification works
- [ ] Registration form appears for new users
- [ ] Profile is created successfully
- [ ] Dashboard loads after registration/login

### In Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: `mari-gunting`
3. Go to **Authentication** → **Users**
4. Check if new partner user appears
5. Go to **Table Editor** → **profiles**
6. Find your profile by phone number
7. Verify:
   - ✅ `role` = `'barber'`
   - ✅ `full_name` is correct
   - ✅ `email` is correct
   - ✅ `phone_number` is correct

---

## 🐛 Common Issues & Solutions

### Issue: "Phone number already registered"
**Cause:** You already registered this number as Customer or Partner

**Solution:**
- Use the "Login" option instead
- OR use a different phone number
- OR delete the existing profile from Supabase

---

### Issue: Not receiving OTP
**Check:**
1. Phone number format is correct: `+60123456789`
2. Phone has active SMS service
3. Check spam/junk folder
4. Wait 60 seconds (rate limit)
5. Try again

---

### Issue: "Session mismatch"
**Cause:** Phone number format inconsistency (should be fixed now)

**Solution:**
- Already fixed in code
- Restart app and try again

---

### Issue: Registration fails after OTP
**Check:**
1. Console logs for errors
2. Supabase Table Editor → profiles table
3. Check if profile already exists
4. Check database constraints

---

## 📊 Expected Database State

After successful partner registration:

### `auth.users` table
```
id: de268a86-e658-4d50-adba-dd1b6d220d39
phone: 601117834513
confirmed_at: 2025-10-12T06:00:00Z
```

### `profiles` table
```
id: de268a86-e658-4d50-adba-dd1b6d220d39
phone_number: +601117834513
full_name: Your Name
email: your@email.com
role: barber
created_at: 2025-10-12T06:00:00Z
```

---

## ✅ Success Criteria

Partner app is working if:
- [x] Can register new partners
- [x] Can login existing partners
- [x] OTP is sent and verified
- [x] Profile created with `role: 'barber'`
- [x] Dashboard accessible after login
- [x] No errors in console

---

## 🚀 Next Steps After Testing

Once Partner authentication works:

1. **Test booking flow** (if implemented)
2. **Test schedule management**
3. **Test earnings tracking**
4. **Test profile editing**
5. **Test customer management**

---

## 📝 Testing Notes

**Phone Number Used:**
- _Write down the phone you're testing with_

**Test Results:**
- [ ] Registration: ✅ / ❌
- [ ] Login: ✅ / ❌
- [ ] OTP: ✅ / ❌
- [ ] Profile Creation: ✅ / ❌

**Issues Found:**
- _List any issues here_

---

**Happy Testing!** 🎉

Last updated: 2025-10-12 06:17 UTC
