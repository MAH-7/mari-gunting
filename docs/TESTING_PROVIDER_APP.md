# Testing Provider App - Quick Guide

**Goal:** Test the provider app navigation and screens

---

## 🧪 **Option 1: Manual Navigation (Simplest)**

### Step 1: Start the app
```bash
npx expo start
```

### Step 2: In your browser, navigate directly to provider app
In the Expo Dev Tools or browser, type this URL:
```
exp://192.168.x.x:8081/--/app-provider/(tabs)/dashboard
```

Or press `r` in terminal to reload and manually navigate.

---

## 🧪 **Option 2: Add Test Button (Recommended)**

I'll add a test button to your customer profile screen that navigates to provider app.

### Location: `app/(tabs)/profile.tsx`

Add this button temporarily at the top of the screen (near logout button).

---

## 🧪 **Option 3: Modify Root Navigation**

Update `app/_layout.tsx` to check user role and navigate accordingly:

```typescript
if (currentUser) {
  if (currentUser.role === 'barber' || currentUser.role === 'shop') {
    router.replace('/app-provider/(tabs)');
  } else {
    router.replace('/(tabs)');
  }
}
```

---

## ✅ **What to Test**

Once in provider app:

### Navigation Test:
- [ ] Can you see 6 tabs at bottom?
- [ ] Dashboard tab (grid icon)
- [ ] Jobs tab (briefcase icon)
- [ ] Schedule tab (calendar icon)
- [ ] Earnings tab (cash icon)
- [ ] Customers tab (people icon)
- [ ] Profile tab (person icon)

### Screen Test:
- [ ] Tap each tab - does it navigate?
- [ ] Each screen shows title and "coming soon" message?
- [ ] Navigation bar uses green color (#00B14F)?
- [ ] No crashes or errors?

### Design Test:
- [ ] Colors match customer app?
- [ ] Icons look good?
- [ ] Typography consistent?
- [ ] Spacing looks right?

---

## 🐛 **Common Issues**

### Issue 1: Can't find provider app
**Solution:** Make sure you're navigating to `/app-provider/(tabs)/dashboard`

### Issue 2: Import errors
**Solution:** Restart expo with `npx expo start -c`

### Issue 3: TypeScript errors
**Solution:** Run `npx tsc --noEmit` to check

---

## 📝 **Reporting Results**

After testing, note:
1. ✅ What works
2. ❌ What doesn't work
3. 💡 What needs improvement

Then we can fix issues before Week 2!

---

**Which testing option do you want to use?**
