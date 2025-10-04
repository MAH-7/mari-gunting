# 🧪 Testing Guide - MariGunting Authentication

## Quick Start

### 1. Start the App
```bash
cd /Users/bos/Desktop/ProjectSideIncome/mari-gunting
npx expo start
```

Then press:
- **`i`** for iOS Simulator
- **`a`** for Android Emulator
- **Scan QR code** with Expo Go app on physical device

---

## 📱 Test Phone Numbers

### Login as Customer 👤
**Phone:** `11-111 1111` or `11-1111 1111`

**What happens:**
- ✅ Logs in as **Ahmad Hassan** (Customer)
- ✅ Navigates to Customer Home
- ✅ Can browse barbers
- ✅ Can book services

**Profile Info:**
- Name: Ahmad Hassan
- Email: ahmad.hassan@email.com
- Role: Customer
- Saved Addresses: 2 locations

---

### Login as Barber ✂️
**Phone:** `22-222 2222` or `22-2222 2222`

**What happens:**
- ✅ Logs in as **Amir Hafiz** (Barber)
- ✅ Shows alert: "Logged in as Barber! (Barber app coming soon)"
- ✅ Currently shows same interface (Barber app in development)
- ✅ Profile shows role as "BARBER"

**Profile Info:**
- Name: Amir Hafiz
- Email: amir.hafiz@email.com
- Role: Barber
- Rating: 4.8 (156 reviews)

---

### New User - Role Selection 🆕
**Phone:** `99-999 9999` or `99-9999 9999`

**What happens:**
- ✅ Shows **Role Selection Screen**
- ✅ 2 beautiful cards:
  - 🟢 **Customer Card** (Green gradient)
  - ⚫ **Barber Card** (Dark gradient)
- ✅ Choose role and continue to profile setup

**Features:**
- Beautiful gradient design
- Feature highlights for each role
- Easy to switch roles later

---

### Any Other Number 🔀
**Phone:** Any valid Malaysian number (e.g., `12-345 6789`)

**What happens:**
- ✅ Logs in as **default Customer**
- ✅ Uses mock customer data
- ✅ Navigates to Customer Home

---

## 🧭 Testing Flow

### Test 1: Customer Login
```
1. Launch app
2. Wait for splash screen (3 seconds)
3. Enter: 11-111 1111
4. Tap "Continue"
5. ✅ Should see Customer Home with barbers list
```

### Test 2: Barber Login
```
1. Launch app (or logout first)
2. Enter: 22-222 2222
3. Tap "Continue"
4. ✅ Should see alert about Barber login
5. Tap "OK"
6. ✅ See Customer Home (Barber app coming soon)
7. Go to Profile tab
8. ✅ Should show "BARBER" badge
```

### Test 3: New User - Role Selection
```
1. Launch app (or logout first)
2. Enter: 99-999 9999
3. Tap "Continue"
4. ✅ Should see Role Selection screen
5. See two beautiful cards:
   - Green Customer card
   - Dark Barber card
6. Tap either card
7. ✅ Should navigate to profile completion (coming soon)
```

### Test 4: Logout & Re-login
```
1. Go to Profile tab
2. Scroll down
3. Tap "Log Out"
4. ✅ Should see confirmation dialog
5. Tap "Log Out"
6. ✅ Should return to Login screen
7. Enter any test number
8. ✅ Should login successfully
```

---

## 📊 Testing Checklist

### Login Screen ✅
- [ ] Splash screen shows once
- [ ] Malaysian flag (🇲🇾) displays
- [ ] Country code shows +60
- [ ] Phone input formats correctly (12-345 6789)
- [ ] Testing banner shows at bottom
- [ ] Tapping testing banner shows guide
- [ ] Continue button disabled for invalid input
- [ ] Continue button enabled for valid input
- [ ] Loading spinner shows during login
- [ ] Google/Apple login buttons visible

### Customer Login ✅
- [ ] Enter 11-111 1111
- [ ] Navigates to Customer Home
- [ ] Shows barbers list
- [ ] Profile shows "CUSTOMER" badge
- [ ] Can navigate to all tabs
- [ ] Logout button works

### Barber Login ✅
- [ ] Enter 22-222 2222
- [ ] Shows barber alert
- [ ] Profile shows "BARBER" badge
- [ ] Name shows "Amir Hafiz"
- [ ] Can logout successfully

### Role Selection ✅
- [ ] Enter 99-999 9999
- [ ] Shows role selection screen
- [ ] Customer card has green gradient
- [ ] Barber card has dark gradient
- [ ] Both cards are tappable
- [ ] Features list visible on each card
- [ ] Help text shows at bottom

### General UX ✅
- [ ] Keyboard appears for phone input
- [ ] Keyboard dismisses on continue
- [ ] Back button works (Android)
- [ ] App doesn't crash
- [ ] Smooth transitions
- [ ] No flickering or glitches

---

## 🔍 Where to Look

### Login Screen
**File:** `app/login.tsx`
- Phone input with Malaysian format
- Testing guide banner (yellow)
- Special phone number logic

### Role Selection Screen
**File:** `app/select-role.tsx`
- Beautiful gradient cards
- Customer (green) vs Barber (dark)
- Feature highlights

### Profile Screen
**File:** `app/(tabs)/profile.tsx`
- Shows user role badge
- Logout button
- User information

---

## 🐛 Common Issues & Solutions

### Issue: App crashes on login
**Solution:** Make sure you're using valid test numbers

### Issue: Splash screen shows twice
**Solution:** Already fixed! Should only show once now

### Issue: Can't see testing banner
**Solution:** Scroll down on login screen

### Issue: Role selection doesn't show
**Solution:** Use phone number: 99-999 9999

### Issue: Barber app looks same as customer
**Solution:** Correct! Barber app is coming soon. Currently shows same UI

---

## 🎯 What to Test Next

### Customer App Features (TODO)
- [ ] Browse all barbers
- [ ] Filter by freelance/barbershop
- [ ] Search barbers
- [ ] View barber details
- [ ] Book a service
- [ ] View booking history
- [ ] Rate & review

### Barber App Features (TODO)
- [ ] Create separate barber interface
- [ ] Dashboard with earnings
- [ ] Manage bookings
- [ ] Set availability
- [ ] Update services & prices
- [ ] Navigation to customer

---

## 📸 Screenshots to Capture

1. **Login Screen** - With testing banner
2. **Customer Login** - Barbers list
3. **Barber Login** - Alert dialog
4. **Role Selection** - Both cards visible
5. **Profile** - Customer badge
6. **Profile** - Barber badge
7. **Logout** - Confirmation dialog

---

## 💡 Tips for Testing

1. **Use Expo Go** on physical device for best experience
2. **Clear app data** if you get stuck
3. **Check console logs** for errors
4. **Test on both iOS and Android** if possible
5. **Try invalid phone numbers** to test validation
6. **Test network conditions** (slow/offline)

---

## 🚀 Production Testing (TODO)

When backend is ready:

1. **Real OTP Flow**
   - Send actual OTP via SMS
   - Verify 6-digit code
   - Handle OTP expiry
   - Test resend functionality

2. **Real User Data**
   - Fetch user from database
   - Store JWT tokens
   - Handle session expiry
   - Test refresh tokens

3. **Error Scenarios**
   - Invalid phone number
   - Network timeout
   - Server errors (500, 404)
   - Invalid OTP
   - Expired OTP

4. **Security Testing**
   - Token validation
   - Secure storage
   - API rate limiting
   - XSS prevention

---

## 📝 Test Scenarios Document

| Scenario | Input | Expected Output | Status |
|----------|-------|----------------|--------|
| Customer Login | 11-111 1111 | Navigate to Customer Home | ✅ |
| Barber Login | 22-222 2222 | Show barber alert | ✅ |
| New User | 99-999 9999 | Show role selection | ✅ |
| Invalid Phone | 123 | Button disabled | ✅ |
| Empty Input | (empty) | Button disabled | ✅ |
| Logout | Tap logout | Return to login | ✅ |
| Default Login | 12-345 6789 | Customer Home | ✅ |

---

**Happy Testing! 🎉**

For issues or questions, check the console logs or review the code comments.
