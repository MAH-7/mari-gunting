# 🚀 Quick Test Reference - Partner App

**3-Minute Quick Check** ⚡

---

## 📍 **How to Access**
1. Open app
2. Go to **Profile** tab
3. Scroll down
4. Tap **"🧪 Test Partner App"** (blue button)

---

## ✅ **Quick Test Checklist**

### Dashboard (2 min)
```
✓ Header shows greeting
✓ Toggle online/offline (watch dot color change)
✓ See 3 stat cards
✓ Tap "View Jobs" → navigates to Jobs
✓ Pull down to refresh
```

### Jobs Screen (1 min)
```
✓ See "Jobs" header
✓ See search bar
✓ See filter tabs (All, Pending, Active, Completed)
✓ Tap filters → see badge counts
✓ If jobs exist: tap card → modal opens
✓ If no jobs: see empty state
```

### Job Details Modal (if jobs available)
```
✓ See all sections (Customer, Services, Schedule, Location, Payment)
✓ See action buttons at bottom (depends on status)
✓ Tap action button → confirmation dialog
✓ Tap X to close modal
```

---

## 🎯 **Expected Results**

### ✅ **Working:**
- Clean UI, consistent green theme
- Smooth navigation between tabs
- Toggle works
- Filters work
- Search works
- Modals open/close
- Confirmation dialogs appear
- No crashes

### ⚠️ **Expected Issues:**
- Stats show "0" (no matching data - normal!)
- Jobs list empty (no matching data - normal!)
- Actions don't persist (no backend yet - normal!)
- Call button doesn't work (not implemented - normal!)

---

## 🐛 **If You See Problems**

### App crashes?
→ Check Metro console for errors

### Nothing displays?
→ Verify user is logged in

### Jobs/stats empty?
→ Normal! User ID doesn't match mock data

### Buttons don't work?
→ Check if tappable (should show press feedback)

---

## 📱 **Tab Overview**

| Tab | Status | What to Check |
|-----|--------|---------------|
| **Dashboard** | ✅ Full | Toggle, stats, quick actions |
| **Jobs** | ✅ Full | Filters, search, job cards, modals |
| **Schedule** | ⏳ Placeholder | Shows "coming soon" |
| **Earnings** | ⏳ Placeholder | Shows "coming soon" |
| **Customers** | ⏳ Placeholder | Shows "coming soon" |
| **Profile** | ⏳ Placeholder | Shows "coming soon" |

---

## 💾 **After Testing**

### Everything works?
→ ✅ Ready for Week 4!

### Found issues?
→ 📝 Note them down and report back

---

**Total Test Time:** ~3-5 minutes  
**Full Test Guide:** See `PARTNER_APP_TESTING_GUIDE.md`

🎉 **Happy Testing!**
