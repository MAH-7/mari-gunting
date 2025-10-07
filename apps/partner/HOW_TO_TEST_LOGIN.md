# How to Test Partner Login Screen

**Quick Guide:** Three easy ways to see the login screen

---

## ✅ Method 1: Logout Button (EASIEST - Already Added!)

I've added a logout button to the dashboard header!

**Steps:**
1. Open the Partner app
2. Look at the top-right corner of the Dashboard
3. Tap the **red logout icon** 🚪
4. You'll immediately see the login screen!

**Visual:**
```
Dashboard Header
┌────────────────────────────────┐
│ Hello, Amir 👋        [🚪]    │ ← Tap this button
│ Welcome back...                │
└────────────────────────────────┘
```

---

## Method 2: Clear App Data (iOS Simulator)

**For iOS Simulator:**
```bash
# Stop the app
# Then run:
xcrun simctl uninstall booted host.exp.Exponent

# Restart the app
cd apps/partner
npm start
```

**For Physical iOS Device:**
1. Long press the app icon
2. Remove app
3. Reinstall via Expo Go

---

## Method 3: Clear AsyncStorage via Code

**Quick one-liner:**

1. Stop the app
2. Add this to `apps/partner/app/index.tsx` temporarily:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

useEffect(() => {
  // Clear storage on mount (TEMPORARY - FOR TESTING ONLY)
  AsyncStorage.clear();
}, []);
```

3. Restart app
4. Remove the code after testing

---

## Method 4: Android Device

**For Android Emulator:**
```bash
# Stop the app
# Then run:
adb shell pm clear host.exp.exponent

# Restart the app
cd apps/partner
npm start
```

**For Physical Android Device:**
1. Settings → Apps → Expo Go
2. Clear Data / Clear Storage
3. Reopen Expo Go

---

## 🎯 Recommended: Use Method 1 (Logout Button)

**This is the easiest and fastest way!**

Just tap the logout button in the dashboard header:
- ✅ No commands needed
- ✅ No app restart needed
- ✅ Instant login screen
- ✅ Can test login/logout flow repeatedly

---

## 🧪 Testing the Login Flow

### Full Flow Test:

**Step 1: Logout**
- Tap logout button in dashboard
- ✅ Should see login screen with animations

**Step 2: Test Login**
- Enter phone: `22-222 2222`
- Tap "Sign In"
- ✅ Should show loading spinner
- ✅ Should navigate to dashboard after ~800ms

**Step 3: Test Quick Login**
- Logout again
- Tap "Quick Login (Test)" button
- ✅ Should instantly navigate to dashboard

**Step 4: Test Invalid Login**
- Logout again
- Enter phone: `99-999 9999`
- Tap "Sign In"
- ✅ Should show error alert

**Step 5: Test Empty Field**
- Logout again
- Leave phone field empty
- Tap "Sign In"
- ✅ Should show "Missing Phone" alert

---

## 📱 What You Should See

### 1. App Launch
```
Splash Screen (2.6s with animations)
         ↓
Login Screen (if not logged in)
  OR
Dashboard (if already logged in)
```

### 2. After Logout
```
Dashboard → [Tap Logout] → Login Screen
```

### 3. After Login
```
Login Screen → [Enter Phone] → [Sign In] → Dashboard
```

---

## 🎬 Expected Animations

### Splash Screen:
- ✅ Scissors icon rotates 360°
- ✅ Logo scales up
- ✅ Text slides up
- ✅ PRO badge visible
- ✅ Fades out after ~2.6s

### Login Screen:
- ✅ Icon and text fade in
- ✅ Icon slides up
- ✅ Duration: ~800ms

### After Login:
- ✅ Button shows loading spinner
- ✅ Input becomes disabled
- ✅ Navigates after ~800ms

---

## 🐛 Troubleshooting

### Issue: Don't see logout button
**Solution:** 
1. Make sure you're on the Dashboard tab
2. Look at the top-right corner
3. It's a circular button with a red logout icon

### Issue: Login screen doesn't show after logout
**Solution:**
1. Check that router path is correct: `/login`
2. Verify login.tsx file exists in `apps/partner/app/`
3. Restart the development server

### Issue: Can't login with test phone
**Solution:**
1. Make sure phone is: `22-222 2222`
2. Or just tap "Quick Login (Test)" button
3. Check that mockBarbers has data

### Issue: App crashes on logout
**Solution:**
1. Clear cache: `npm start -- --clear`
2. Reinstall: `rm -rf node_modules && npm install`

---

## 💡 Pro Tips

**Tip 1: Keep Logout Accessible**
The logout button is now in the dashboard header, so you can quickly test the login flow anytime!

**Tip 2: Quick Testing Cycle**
```
1. Tap logout (1 second)
2. Test login feature
3. Repeat
```

**Tip 3: Test Different Scenarios**
- Valid phone → Success
- Invalid phone → Error
- Empty phone → Error  
- Quick login → Instant success

**Tip 4: Check Persistence**
After logging in:
1. Close the app completely
2. Reopen it
3. You should see Dashboard (not login)
4. This proves storage persistence works!

---

## 📊 Test Checklist

- [ ] Logout button visible in dashboard
- [ ] Logout button navigates to login screen
- [ ] Login screen animations play smoothly
- [ ] Valid phone logs in successfully
- [ ] Invalid phone shows error
- [ ] Empty phone shows error
- [ ] Quick login works instantly
- [ ] Loading state shows during login
- [ ] Input disabled during loading
- [ ] Button shows spinner during loading
- [ ] Focus state works (green border)
- [ ] Keyboard handling works correctly
- [ ] User persists after app restart

---

## 🎯 Quick Reference

| Action | Method |
|--------|--------|
| **See Login** | Tap logout button in dashboard |
| **Login** | Enter `22-222 2222` + Sign In |
| **Quick Test** | Tap "Quick Login (Test)" |
| **Reset App** | Clear AsyncStorage or reinstall |

---

**Last Updated:** 2025-10-07 02:36 UTC  
**Status:** Ready for testing! 🚀
