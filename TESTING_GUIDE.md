# 🧪 Registration & Onboarding Testing Guide

Complete guide to test the partner registration and onboarding flow for Mari Gunting.

---

## 📱 How to Start Testing

### 1. Start the Development Server
```bash
cd /Users/bos/Desktop/ProjectSideIncome/mari-gunting
npm start
# or
yarn start
# or
npx expo start
```

### 2. Choose Your Platform
- Press `i` for iOS Simulator
- Press `a` for Android Emulator  
- Scan QR code with Expo Go app on physical device

### 3. Navigate to Registration
- In your app, go to the registration screen
- Or directly navigate to `/register` route

---

## 🎯 Testing Flow Summary

### **Freelance Barber Path** (8 screens):
```
Register → Select Account Type → Welcome → Account Type → 
eKYC → eKYC Pending → Payout → Payout Pending → ✅ Home
```

### **Barbershop Owner Path** (10 screens):
```
Register → Select Account Type → Welcome → Account Type → 
eKYC → eKYC Pending → Business → Business Pending → 
Payout → Payout Pending → ✅ Home
```

---

## 📋 Detailed Step-by-Step Testing

### **Screen 1: Register** (`/register`)

**What to test:**
1. Enter phone number: `01-2345 6789`
2. Verify auto-formatting works
3. Click **Continue**

**Expected:** Navigate to account type selection

---

### **Screen 2: Select Account Type** (`/select-account-type`)

**What to test:**
1. Click **Freelance Barber** OR **Barbershop Owner**
2. Verify card highlights with checkmark
3. Click **Continue**

**Expected:** Navigate to `/onboarding/welcome`

---

### **Screen 3: Welcome** (`/onboarding/welcome`)

**What to test:**
1. Review welcome message and benefits
2. Click **Get Started**

**Expected:** Navigate to `/onboarding/account-type`

---

### **Screen 4: Account Type Enhanced** (`/onboarding/account-type`)

**What to test:**
1. Select account type (should match previous selection)
2. Click **Continue**

**Expected:** Navigate to `/onboarding/ekyc`

---

### **Screen 5: eKYC Verification** (`/onboarding/ekyc`)

**What to test:**
1. Full Name: `Ahmad Bin Ali`
2. NRIC: `990101-01-1234`
3. Upload ID document (click Upload button)
4. Upload selfie (click Take Selfie button)
5. Click **Submit for Verification**

**Expected:** Loading spinner → Navigate to `/onboarding/ekyc-pending`

---

### **Screen 6: eKYC Pending** (`/onboarding/ekyc-pending`)

**What to test:**
1. Verify timeline shows "Submitted" as active
2. Review summary of submitted details
3. Click **Continue Setup**

**Expected:**
- **Freelance:** → `/onboarding/payout`
- **Barbershop:** → `/onboarding/business`

---

### **Screen 7: Business Details** (`/onboarding/business`) - **BARBERSHOP ONLY**

**What to test:**
1. SSM Number: `001234567-A`
2. Business Name: `Ahmad's Barber Shop`
3. Business Type: Select from dropdown
4. Street: `123 Jalan Sultan Ismail`
5. City: `Kuala Lumpur`
6. Postcode: `50000`
7. State: Select `Kuala Lumpur`
8. Upload SSM Certificate
9. Upload Business License (optional)
10. Click **Submit for Verification**

**Expected:** Navigate to `/onboarding/business-pending`

---

### **Screen 8: Business Pending** (`/onboarding/business-pending`) - **BARBERSHOP ONLY**

**What to test:**
1. Review business details summary
2. Click **Continue Setup**

**Expected:** Navigate to `/onboarding/payout`

---

### **Screen 9: Payout Setup** (`/onboarding/payout`)

**What to test:**
1. Account Holder Name: `AHMAD BIN ALI` (auto-uppercase)
2. Bank Name: Select `Maybank` from dropdown
3. Account Number: `1234567890`
4. Click **Verify Bank Account**

**Expected:** Navigate to `/onboarding/payout-pending`

---

### **Screen 10: Payout Pending** (`/onboarding/payout-pending`)

**What to test:**
1. Review bank details (account number masked)
2. See "You're Almost Ready!" celebration
3. Click **Go to Home**

**Expected:** Navigate to `/(tabs)/home` with onboarding marked complete

---

## 🧪 Test Cases by Feature

### **Form Validation Tests**

#### Phone Number (Register)
- ❌ `12-345` → Button disabled
- ✅ `01-2345 6789` → Button enabled

#### eKYC Name
- ❌ `Ab` (too short) → Error shown
- ✅ `Ahmad Bin Ali` → Accepted

#### NRIC Format
- ✅ `990101-01-1234` → Accepted
- ✅ `A12345678` (passport) → Accepted

#### Business SSM Number
- ✅ `001234567-A` → Auto-uppercase
- ❌ Empty → Error shown

#### Postcode (Business)
- ❌ `1234` (4 digits) → Error
- ✅ `50000` (5 digits) → Accepted
- ❌ `ABCDE` (letters) → Error

#### Bank Account Number
- ❌ `12345` (too short) → Error
- ✅ `1234567890` (10 digits) → Accepted
- ✅ `1234567890123456` (16 digits) → Accepted
- ❌ `12345678901234567` (17 digits) → Error

---

### **Photo Upload Tests**

#### ID Document Upload
1. Click **Upload ID Document**
2. Grant photo library permission
3. Select photo
4. Expected: Green checkmark + "Document uploaded"

#### Selfie Upload
1. Click **Take Selfie**
2. Grant camera permission
3. Take/select photo
4. Expected: Green checkmark + "Selfie uploaded"

#### Business Documents
1. Upload SSM Certificate (required)
2. Upload Business License (optional)
3. Expected: Both show green confirmation

---

### **Navigation Tests**

#### Forward Navigation
- Each screen should navigate to the next step
- Progress bar should increment
- State should be saved in Zustand

#### Back Navigation (if applicable)
- Header back button should work
- State should persist when going back
- Re-entering data should show saved values

#### Skip/Exit Navigation
- "Complete Later" buttons should navigate to home
- Progress should be saved
- User should be able to resume onboarding

---

### **Dropdown Tests**

#### Business Type Dropdown
- Click opens menu
- Shows 4 options: Sole Proprietor, Partnership, Sdn Bhd, Other
- Selection closes menu
- Selected value displays

#### State Dropdown
- Click opens menu
- Shows all 16 Malaysian states
- Scrollable menu
- Selection closes menu

#### Bank Dropdown
- Click opens menu
- Shows 15+ Malaysian banks
- Scrollable menu with icons
- Selection closes menu

---

## 🎨 UI/UX Checks

### Visual Elements
- [ ] Logo displays correctly
- [ ] Colors match design system (COLORS constant)
- [ ] Typography is consistent (TYPOGRAPHY constant)
- [ ] Icons render properly (Ionicons)
- [ ] Spacing and padding looks good
- [ ] Cards and borders render correctly

### Interactive Elements
- [ ] Buttons show press state (opacity change)
- [ ] Disabled buttons are grayed out
- [ ] Loading spinners appear during submission
- [ ] Dropdowns open/close smoothly
- [ ] Keyboard doesn't cover inputs

### Feedback & States
- [ ] Error messages display in red
- [ ] Success messages display in green
- [ ] Form validation works in real-time
- [ ] Loading states show activity
- [ ] Success confirmations appear after submission

---

## 📊 Sample Test Data

### Valid Inputs:

**Phone Numbers:**
```
01-2345 6789
01-9876 5432
01-1234 5678
```

**Malaysian NRIC:**
```
990101-01-1234
880505-14-5678
950315-06-9012
```

**Passport Numbers:**
```
A12345678
K98765432
M12345678
```

**SSM Registration Numbers:**
```
001234567-A
123456789-K
987654321-T
```

**Bank Account Numbers:**
```
1234567890 (10 digits)
12345678901234 (14 digits)
1234567890123456 (16 digits)
```

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot find module" errors
**Fix:** Run `npm install` or `yarn install`

### Issue: Image picker not working
**Fix:** Install expo-image-picker:
```bash
npx expo install expo-image-picker
```

### Issue: Navigation crashes
**Fix:** Check `expo-router` setup in `app/_layout.tsx`

### Issue: State not persisting
**Fix:** Verify Zustand store is initialized properly

### Issue: Styling looks broken
**Fix:** Check COLORS and TYPOGRAPHY constants exist

---

## ✅ Testing Checklist

### Pre-Testing
- [ ] Development server running
- [ ] App loads without errors
- [ ] Clear AsyncStorage (fresh start)

### Registration Flow
- [ ] Phone validation works
- [ ] Continue to account type works
- [ ] Account type saves correctly

### Onboarding (Common)
- [ ] Welcome screen displays
- [ ] Account type selection works
- [ ] eKYC form validates properly
- [ ] Photo uploads work
- [ ] eKYC pending shows timeline

### Onboarding (Barbershop)
- [ ] Business form validates
- [ ] SSM number accepts format
- [ ] Address form works
- [ ] Document uploads work
- [ ] Business pending displays

### Onboarding (Final)
- [ ] Payout form validates
- [ ] Bank dropdown works
- [ ] Account number validates
- [ ] Payout pending shows celebration
- [ ] Home navigation completes onboarding

### Edge Cases
- [ ] Back navigation works
- [ ] "Complete Later" saves progress
- [ ] Re-opening app resumes correctly
- [ ] Invalid data shows errors
- [ ] Network errors handled gracefully

---

## 🚀 Quick Commands

### Start Development:
```bash
npx expo start
```

### Clear Cache:
```bash
npx expo start -c
```

### Test on iOS:
```bash
npx expo start --ios
```

### Test on Android:
```bash
npx expo start --android
```

---

## 🎯 Success Criteria

✅ **Testing is successful when:**
1. User can complete full registration
2. All validations work correctly
3. Photos upload successfully
4. Navigation flows smoothly
5. No crashes occur
6. Data saves to Zustand store
7. User reaches home dashboard
8. Progress can be resumed later

---

## 📝 Bug Report Template

If you find issues, document them:

```
**Bug:** [Short description]
**Screen:** [Screen name/route]
**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected:** [What should happen]
**Actual:** [What actually happened]
**Priority:** [High/Medium/Low]
**Screenshot:** [If applicable]
```

---

**Happy Testing! 🚀✨**

For questions or issues, contact the development team.
