# Partner App - Testing Checklist

**Date:** January 2025  
**Testing:** Week 1 Setup

---

## 🧪 **How to Test**

### Step 1: Open the App
Your app is already running on port 8081

### Step 2: Navigate to Profile
1. Open your app (customer side)
2. Go to Profile tab (bottom right)
3. Scroll down
4. Find the blue "🧪 Test Partner App" button
5. Tap it!

### Step 3: Test Partner App
You should now see the partner app!

---

## ✅ **Testing Checklist**

### Navigation Bar Test
- [ ] Can you see 6 tabs at the bottom?
- [ ] Tab 1: Dashboard (grid icon)
- [ ] Tab 2: Jobs (briefcase icon)
- [ ] Tab 3: Schedule (calendar icon)
- [ ] Tab 4: Earnings (cash icon)
- [ ] Tab 5: Customers (people icon)
- [ ] Tab 6: Profile (person icon)

### Tab Interaction Test
- [ ] Tap Dashboard tab - screen changes?
- [ ] Tap Jobs tab - screen changes?
- [ ] Tap Schedule tab - screen changes?
- [ ] Tap Earnings tab - screen changes?
- [ ] Tap Customers tab - screen changes?
- [ ] Tab Profile tab - screen changes?

### Screen Content Test
- [ ] Dashboard shows "Dashboard" title?
- [ ] Jobs shows "Jobs" title?
- [ ] Schedule shows "Schedule" title?
- [ ] Earnings shows "Earnings" title?
- [ ] Customers shows "Customers" title?
- [ ] Profile shows "Profile" title?
- [ ] All screens show "coming soon" message?

### Design & Styling Test
- [ ] Navigation bar is white background?
- [ ] Active tab icon is green (#00B14F)?
- [ ] Inactive tab icons are gray?
- [ ] Tab labels visible?
- [ ] Typography looks consistent?
- [ ] No layout issues?
- [ ] Background is light gray (#F9FAFB)?

### Performance Test
- [ ] Tabs switch instantly?
- [ ] No lag or stuttering?
- [ ] No crashes?
- [ ] No error messages in console?

### Navigation Back Test
- [ ] Can you swipe back to customer app?
- [ ] Can you use back button?
- [ ] Can you navigate back successfully?

---

## 📝 **Report Issues**

### If something doesn't work, note:

**Issue 1:**
- What: ___________________________________
- Expected: _______________________________
- Actual: _________________________________

**Issue 2:**
- What: ___________________________________
- Expected: _______________________________
- Actual: _________________________________

**Issue 3:**
- What: ___________________________________
- Expected: _______________________________
- Actual: _________________________________

---

## ✅ **If Everything Works**

You should see:
- ✅ 6 tabs navigation
- ✅ All 6 screens render
- ✅ Green active tab color
- ✅ Clean, professional UI
- ✅ No errors or crashes

**If all checks pass → Week 1 is SUCCESSFUL! 🎉**

**Ready to start Week 2!** 🚀

---

## 🐛 **Troubleshooting**

### Issue: "Cannot find module @/shared/constants"
**Fix:** Restart expo with cache clear
```bash
npx expo start -c
```

### Issue: "Route not found"
**Fix:** Make sure path is exactly `/app-provider/(tabs)/dashboard`

### Issue: TypeScript errors
**Fix:** Check console, might be import issues

### Issue: Button doesn't show up
**Fix:** Scroll down in profile screen, it's after menu items

---

## 📸 **Screenshots (Optional)**

Take screenshots of:
1. Navigation bar with 6 tabs
2. Dashboard screen
3. Any issues you find

---

**After Testing:** 
Report back with results and we'll either:
- Fix any issues found
- Proceed to Week 2 (Dashboard development)

Good luck! 🚀
