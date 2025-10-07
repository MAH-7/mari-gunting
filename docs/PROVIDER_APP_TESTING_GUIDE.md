# 🧪 Partner App Testing Guide (Weeks 1-3)

**Date:** October 2025  
**Scope:** Dashboard + Jobs Management  
**Status:** Ready for Testing

---

## 📋 **Pre-Testing Checklist**

Before you start testing:

1. ✅ Make sure Expo dev server is running
2. ✅ Open the app on your device/simulator
3. ✅ You should be on the customer app (main app)
4. ✅ Navigate to the Profile tab

---

## 🚀 **Getting to Partner App**

### Step 1: Navigate to Test Button
1. Open the app
2. Go to **Profile** tab (bottom navigation)
3. Scroll down to find the test button
4. Look for: **"🧪 Test Partner App"** button (blue, dashed border)

### Step 2: Enter Partner App
1. Tap the **"🧪 Test Partner App"** button
2. You should navigate to the Provider app
3. You'll land on the **Dashboard** screen

---

## ✅ **Week 1-2: Dashboard Testing**

### **Test 1: Dashboard Layout**

**What to check:**
- [ ] Header shows "Hello, [YourName] 👋"
- [ ] Welcome message displays
- [ ] All sections render correctly

**Expected Result:** Clean, modern dashboard with all sections visible

---

### **Test 2: Availability Toggle**

**Steps:**
1. Find the availability card (near top)
2. Check the green/gray dot indicator
3. Toggle the switch on/off

**What to check:**
- [ ] Dot color changes (green = online, gray = offline)
- [ ] Text changes ("Online" / "Offline")
- [ ] Subtitle changes ("Accepting new bookings" / "Not accepting bookings")
- [ ] Toggle animation is smooth

**Expected Result:** Toggle works smoothly, UI updates immediately

---

### **Test 3: Stats Cards**

**What to check:**
- [ ] Three cards displayed side by side
- [ ] **Today's Earnings** shows "RM 0" (unless you have matching data)
- [ ] **Active Jobs** shows a count
- [ ] **Completed Today** shows a count
- [ ] Each card has a colored icon
- [ ] Labels are clear and readable

**Expected Result:** All three cards render correctly with icons and values

**Note:** Stats will show "0" if current user ID doesn't match any barber IDs in mockBookings. This is expected!

---

### **Test 4: Quick Actions**

**Steps:**
1. Find the "Quick Actions" section
2. You should see 4 buttons in a 2x2 grid

**What to check:**
- [ ] "View Jobs" button (blue icon)
- [ ] "Schedule" button (purple icon)
- [ ] "Earnings" button (green icon)
- [ ] "Customers" button (yellow icon)
- [ ] All buttons have icons and labels
- [ ] Buttons respond to touch

**Test Navigation:**
1. Tap **"View Jobs"** - Should navigate to Jobs tab
2. Go back to Dashboard
3. Try tapping other buttons - Should navigate to respective tabs

**Expected Result:** All 4 buttons visible, tappable, and navigate correctly

---

### **Test 5: Recent Activity**

**Scenario A: No Jobs (Expected for most users)**

**What to check:**
- [ ] Empty state shows calendar icon
- [ ] Title: "No Recent Jobs"
- [ ] Subtitle: "Your recent bookings will appear here"

**Scenario B: With Jobs (If your user ID matches a barber)**

**What to check:**
- [ ] Up to 5 recent jobs displayed
- [ ] Each job shows:
  - Customer name
  - Service names
  - Date & time
  - Status badge (colored)
  - Price
- [ ] "See All" link at the top
- [ ] Can tap any job card

**Expected Result:** Either empty state OR job list displays correctly

---

### **Test 6: Pull to Refresh**

**Steps:**
1. Pull down on the Dashboard
2. Release

**What to check:**
- [ ] Spinner appears
- [ ] Dashboard refreshes
- [ ] Spinner disappears after ~1 second

**Expected Result:** Smooth pull-to-refresh animation

---

## ✅ **Week 3: Jobs Management Testing**

### **Getting to Jobs Screen**

**Method 1:** Tap "View Jobs" quick action on Dashboard  
**Method 2:** Tap "Jobs" tab in bottom navigation

---

### **Test 7: Jobs Screen Layout**

**What to check:**
- [ ] Header shows "Jobs"
- [ ] Filter/options button visible (top right)
- [ ] Search bar present
- [ ] Filter tabs visible (All, Pending, Active, Completed)
- [ ] Each filter tab shows a count badge

**Expected Result:** Complete jobs screen layout with all elements

---

### **Test 8: Filter Tabs**

**Steps:**
1. Tap each filter tab one by one

**What to check:**
- [ ] **All** - Shows all jobs
- [ ] **Pending** - Shows pending jobs only
- [ ] **Active** - Shows accepted/on-the-way/in-progress jobs
- [ ] **Completed** - Shows completed/cancelled jobs
- [ ] Active tab highlighted in green
- [ ] Badge numbers update correctly
- [ ] Tab scrolls horizontally if needed

**Expected Result:** Filtering works, active tab highlighted, correct counts

---

### **Test 9: Search Functionality**

**Steps:**
1. Tap the search bar
2. Type a customer name or service name
3. Try typing partial matches

**What to check:**
- [ ] Search icon visible
- [ ] Placeholder text: "Search jobs, customers..."
- [ ] Results filter as you type (live search)
- [ ] Clear button (X) appears when typing
- [ ] Tapping X clears search
- [ ] If no results: Shows "No Results Found" empty state

**Expected Result:** Real-time search works, filters update immediately

---

### **Test 10: Job Cards Display**

**Scenario A: No Jobs (Expected)**

**What to check:**
- [ ] Empty state with briefcase icon
- [ ] "No Jobs Yet"
- [ ] "Your bookings will appear here"

**Scenario B: With Jobs (If data available)**

For each job card, check:
- [ ] Customer name visible
- [ ] Date & time displayed
- [ ] Status badge with color
- [ ] Status dot (colored)
- [ ] Services list
- [ ] Location address (truncated)
- [ ] Price at bottom
- [ ] Chevron on right
- [ ] Card is tappable

**Expected Result:** Cards display all information cleanly

---

### **Test 11: Job Details Modal**

**Steps:**
1. Tap any job card
2. Modal should slide up from bottom

**What to check:**

#### Modal Header
- [ ] Close button (X) on left
- [ ] "Job Details" title in center
- [ ] Tapping X closes modal

#### Status Banner
- [ ] Colored banner at top
- [ ] Info icon
- [ ] Status-specific message
- [ ] Correct color for status

#### Customer Section
- [ ] Customer avatar (icon)
- [ ] Customer name
- [ ] Phone number
- [ ] Call button (green circle)

#### Services Section
- [ ] Section title: "Services"
- [ ] Each service listed with:
  - Service name
  - Duration (e.g., "30 min")
  - Price (e.g., "RM 35")

#### Schedule Section
- [ ] Calendar icon + date
- [ ] Clock icon + time
- [ ] Clean icon-based layout

#### Location Section
- [ ] Location icon
- [ ] Full address text
- [ ] Customer notes (if any)

#### Payment Breakdown
- [ ] Services subtotal
- [ ] Travel fee (if applicable)
- [ ] Divider line
- [ ] Total amount (larger, green)

#### Action Buttons (bottom)
**For Pending Jobs:**
- [ ] "Reject" button (gray, left)
- [ ] "Accept Job" button (green, larger, right)

**For Accepted Jobs:**
- [ ] "Start Job" button (green, full width)

**For Active Jobs (on-the-way, in-progress):**
- [ ] "Complete Job" button (green, full width)

**For Completed/Cancelled:**
- [ ] No action buttons (view only)

**Expected Result:** All sections visible, all data displayed correctly

---

### **Test 12: Job Actions - Accept Flow**

**Prerequisites:** Need a pending job

**Steps:**
1. Open a pending job details
2. Tap **"Accept Job"**

**What to check:**
- [ ] Alert dialog appears
- [ ] Title: "Accept Job"
- [ ] Message shows customer name
- [ ] "Cancel" button
- [ ] "Accept" button
- [ ] Tap "Accept"
- [ ] Success alert shows: "Job accepted successfully!"
- [ ] Modal closes automatically

**Expected Result:** Confirmation dialog, then success message

---

### **Test 13: Job Actions - Reject Flow**

**Prerequisites:** Need a pending job

**Steps:**
1. Open a pending job details
2. Tap **"Reject"**

**What to check:**
- [ ] Alert dialog appears
- [ ] Title: "Reject Job"
- [ ] Warning message
- [ ] "Cancel" button
- [ ] "Reject" button (red/destructive style)
- [ ] Tap "Reject"
- [ ] Confirmation message shows
- [ ] Modal closes

**Expected Result:** Destructive confirmation, then closes

---

### **Test 14: Job Actions - Start Job Flow**

**Prerequisites:** Need an accepted job

**Steps:**
1. Open an accepted job
2. Tap **"Start Job"**

**What to check:**
- [ ] Alert: "Mark this job as in progress?"
- [ ] "Cancel" and "Start" buttons
- [ ] Tap "Start"
- [ ] Success: "Job started! Good luck!"
- [ ] Modal closes

**Expected Result:** Confirmation then success message

---

### **Test 15: Job Actions - Complete Job Flow**

**Prerequisites:** Need an active/in-progress job

**Steps:**
1. Open an active job
2. Tap **"Complete Job"**

**What to check:**
- [ ] Alert shows job completion confirmation
- [ ] Shows payment amount: "You'll receive RM X"
- [ ] "Cancel" and "Complete" buttons
- [ ] Tap "Complete"
- [ ] Success: "Job completed! Payment will be processed."
- [ ] Modal closes

**Expected Result:** Shows payment info, then success

---

### **Test 16: Pull to Refresh (Jobs Screen)**

**Steps:**
1. On Jobs list
2. Pull down to refresh
3. Release

**What to check:**
- [ ] Spinner appears
- [ ] List refreshes
- [ ] Spinner disappears

**Expected Result:** Smooth refresh animation

---

### **Test 17: Modal Scroll Testing**

**Steps:**
1. Open any job details modal
2. Scroll through the content

**What to check:**
- [ ] All sections scroll smoothly
- [ ] Header stays fixed at top
- [ ] Action buttons stay fixed at bottom
- [ ] Content scrolls between them
- [ ] No layout issues

**Expected Result:** Smooth scrolling, fixed header/footer

---

### **Test 18: Navigation Between Tabs**

**Steps:**
1. Start on Dashboard
2. Navigate to Jobs
3. Navigate to Schedule (placeholder)
4. Navigate to Earnings (placeholder)
5. Navigate to Customers (placeholder)
6. Navigate to Profile (placeholder)
7. Go back to Dashboard

**What to check:**
- [ ] All tab icons visible in bottom bar
- [ ] Active tab highlighted
- [ ] Tapping tabs switches screens
- [ ] Dashboard and Jobs load correctly
- [ ] Other tabs show placeholder screens

**Expected Result:** Smooth tab navigation, all tabs respond

---

## 🐛 **Known Issues to Verify**

### **Issue 1: Empty Data**
**Problem:** Stats and jobs show "0" or empty  
**Cause:** Current user ID doesn't match barber IDs in mockBookings  
**Expected:** This is normal! Real data will come from backend  
**Workaround:** Can manually match user IDs later for testing

### **Issue 2: Actions Don't Persist**
**Problem:** Accepting/rejecting jobs doesn't actually change the data  
**Cause:** No backend integration yet (TODO comments in code)  
**Expected:** Normal for Week 3! Backend will handle persistence  
**Workaround:** Actions show confirmation dialogs correctly

### **Issue 3: Call Button Does Nothing**
**Problem:** Call button in job details doesn't dial  
**Cause:** Not yet implemented  
**Expected:** Week 4 or later  
**Workaround:** Button is there, ready for linking functionality

---

## ✅ **Testing Checklist Summary**

### Dashboard (Week 2)
- [ ] Dashboard loads correctly
- [ ] Availability toggle works
- [ ] Stats cards display
- [ ] Quick actions navigate
- [ ] Recent activity shows (empty state or jobs)
- [ ] Pull-to-refresh works

### Jobs Management (Week 3)
- [ ] Jobs screen loads
- [ ] Filter tabs work
- [ ] Search filters jobs
- [ ] Empty states display
- [ ] Job cards render correctly
- [ ] Job details modal opens
- [ ] All modal sections visible
- [ ] Action buttons show correctly per status
- [ ] Accept job dialog works
- [ ] Reject job dialog works
- [ ] Start job dialog works
- [ ] Complete job dialog works
- [ ] Modal closes properly
- [ ] Pull-to-refresh works

### Navigation
- [ ] Can navigate to partner app from customer profile
- [ ] All provider tabs respond
- [ ] Can switch between tabs
- [ ] Dashboard and Jobs fully functional
- [ ] Other tabs show placeholders

---

## 📸 **What to Look For**

### Good Signs ✅
- Clean, modern UI
- Consistent green color scheme (#00B14F)
- Smooth animations
- Responsive buttons
- Clear typography
- Proper spacing
- No crashes
- All elements aligned

### Red Flags 🚩
- Crashes when navigating
- Missing text or icons
- Broken layouts
- Non-responsive buttons
- Console errors
- TypeScript errors
- Blank screens

---

## 🎯 **Test Results Template**

```
## Test Results

**Date:** [Date]
**Tester:** [Your Name]
**Device:** [iPhone/Android/Simulator]

### Dashboard
- [ ] All tests passed
- [ ] Issues found: [list any issues]

### Jobs Management
- [ ] All tests passed
- [ ] Issues found: [list any issues]

### Overall
- [ ] Ready for Week 4
- [ ] Needs fixes: [list what needs fixing]

### Notes
[Any additional observations]
```

---

## 🚀 **After Testing**

### If Everything Works:
✅ Great! Ready to proceed to Week 4  
✅ Provider app foundation is solid  
✅ Can confidently build more features  

### If Issues Found:
1. Note down specific issues
2. Check console for errors
3. Review the problem areas
4. Fix critical issues before proceeding
5. Re-test after fixes

---

## 💡 **Pro Testing Tips**

1. **Test on real device** if possible (better than simulator)
2. **Check console logs** for any errors
3. **Test edge cases** (empty data, long names, etc.)
4. **Test different screen sizes** if possible
5. **Take screenshots** of any issues
6. **Note performance** (any lag or slowness?)

---

## 📞 **Need Help?**

If you find issues:
1. Note the exact steps to reproduce
2. Check if console shows errors
3. Take a screenshot if visual issue
4. Describe what should happen vs what happens

---

**Happy Testing!** 🧪

Once testing is complete, we'll move to Week 4 with confidence! 🚀
