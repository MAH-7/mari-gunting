# Test Both Apps Before Cleanup 🧪

## 🎯 Goal
Test that both apps work independently before removing old folders.

---

## 📱 Test 1: Customer App (MacBook Simulator)

### Start the app:
```bash
cd /Users/bos/Desktop/ProjectSideIncome/mari-gunting/apps/customer
npm start
```

### Then press:
- `i` for iOS simulator

### What to test:
- ✅ App loads without errors
- ✅ Login screen appears
- ✅ Login with `11-111 1111`
- ✅ Browse barbers/barbershops
- ✅ Navigate through tabs
- ✅ Profile screen works
- ✅ Mock data loads correctly

### Expected:
- No "Module not found" errors
- All screens load properly
- Navigation works smoothly

---

## 📱 Test 2: Partner App (Your Phone)

### Start the app:
**Open a NEW terminal** (don't close customer app terminal)

```bash
cd /Users/bos/Desktop/ProjectSideIncome/mari-gunting/apps/partner
npm start
```

### Then:
- Scan QR code with Expo Go on your phone

### What to test:
- ✅ Provider app opens DIRECTLY (no customer app first!)
- ✅ Dashboard loads with stats
- ✅ Jobs tab shows jobs list
- ✅ Tap "Completed" filter → See analytics cards
- ✅ Navigate through all 6 tabs
- ✅ All features from Week 4 work

### Expected:
- Provider app opens immediately
- No need to navigate from customer app
- All Week 4 features working:
  - Dashboard
  - Jobs management
  - Progress tracking
  - Analytics

---

## ✅ Checklist

Run through this checklist:

### Customer App:
- [ ] App starts without errors
- [ ] Can login
- [ ] Can browse barbers
- [ ] Can navigate tabs
- [ ] No import/module errors

### Partner App:
- [ ] App opens directly (not through customer app)
- [ ] Dashboard shows stats
- [ ] Jobs list works
- [ ] Analytics appears on "Completed" filter
- [ ] All 6 tabs navigate correctly
- [ ] No import/module errors

---

## 🚨 If You See Errors:

### "Module not found" or Import errors:
```bash
# In the app folder having issues:
rm -rf node_modules
npm install
npm start -- --clear
```

### Metro bundler issues:
```bash
# Kill all node processes
killall node

# Start fresh
npm start -c
```

### Symlink not working:
```bash
# Check symlinks exist:
cd apps/customer (or apps/partner)
ls -la | grep "^l"

# You should see links to shared, types, services, etc.
```

---

## ✅ When Both Apps Work:

Come back and tell me:
- ✅ "Both apps working!" 
- ❌ "I see errors: [describe what you see]"

Then I'll prepare the cleanup script! 🧹

---

## 📝 Notes

- Keep both terminals open
- Test on 2 devices simultaneously if possible
- Make sure shared data works (bookings should be visible in both)
- The partner app should feel completely independent now!
