# Testing Guide: Points on Completion

## 🎯 What We're Testing
Verify that points are awarded **only when booking is completed**, not at payment.

---

## 📋 Test Scenarios

### ✅ Test 1: Complete Flow (Points Should Be Awarded)
### ❌ Test 2: Cancelled Booking (No Points)
### 🔄 Test 3: Duplicate Prevention

---

## 🧪 Test 1: Complete Booking → Points Awarded

### Step 1: Note Starting Points
1. Open app
2. Go to **Rewards** tab
3. **Note current points** (e.g., 1250 pts)
4. Take a screenshot for comparison

### Step 2: Create a Booking
1. Go to **Home** tab
2. Tap any barber card (e.g., "Ahmad Rahman")
3. Select service: **"Classic Haircut - RM 30"**
4. Tap "Book Now"
5. Select "Home" address
6. Add notes (optional): "Test booking for points"
7. Tap "Request Barber Now"

### Step 3: Complete Payment
1. Select payment method: **"Cash"**
2. Tap "Continue"
3. Confirm alert
4. **✓ Expected:** Success modal appears: "Booking Confirmed!"
5. **✓ Expected:** NO points modal (this is correct!)
6. Tap "View Booking"

### Step 4: Verify No Points Yet
1. Go to **Rewards** tab
2. **✓ Expected:** Points unchanged (still 1250)
3. Go to **Activity** tab
4. **✓ Expected:** No "Service completed" entry

### Step 5: Simulate Service Completion
1. Go to **Bookings** tab
2. Tap the booking you just created
3. **Look for:** Green dashed button: "🧪 Test: Mark as Completed"
4. Tap the test button
5. Confirm alert: "Complete Booking"
6. **Wait 1-2 seconds** for screen to refresh

### Step 6: Points Modal Appears! 🎉
**✓ Expected:**
- Points earned modal appears
- Shows "+300 pts!" (for RM 30 service)
- Confetti animation plays
- Auto-dismisses after 3 seconds OR tap "Awesome!"

### Step 7: Verify Points Added
1. Go to **Rewards** tab
2. **✓ Expected:** Points increased by 300 (1250 → 1550)
3. Tap "Activity" tab
4. **✓ Expected:** New entry at top:
   ```
   +300
   Service completed - Classic Haircut
   6 Oct 2025
   ```

### Step 8: Verify No Duplicate Awards
1. Go back to **Bookings** tab
2. Tap the same completed booking
3. **✓ Expected:** No test button (booking is completed)
4. **✓ Expected:** "Rate & Review" button appears
5. Navigate away and back to booking
6. **✓ Expected:** No points modal appears again
7. Check **Rewards** tab
8. **✓ Expected:** Points still 1550 (not doubled to 1850)

---

## 🧪 Test 2: Cancelled Booking → No Points

### Step 1: Create Another Booking
1. Go to **Home** tab
2. Select any barber
3. Select service: **"Beard Trim - RM 20"**
4. Complete booking flow (address → payment)
5. Tap "View Booking"

### Step 2: Cancel the Booking
1. In booking details, tap "Cancel Booking" (red button)
2. Confirm cancellation
3. **✓ Expected:** Cancellation success modal

### Step 3: Verify No Points Awarded
1. Go to **Rewards** tab
2. **✓ Expected:** Points unchanged (1550, not 1750)
3. Go to **Activity** tab
4. **✓ Expected:** No new entry for cancelled booking
5. Go to **Bookings** tab → "Cancelled" filter
6. **✓ Expected:** Booking shows as cancelled
7. **✓ Expected:** No points earned

---

## 🧪 Test 3: Multiple Bookings

### Scenario: Create 3 bookings, complete 2, cancel 1

1. **Booking A:** RM 30 service → Complete → +300 pts
2. **Booking B:** RM 25 service → Complete → +250 pts
3. **Booking C:** RM 40 service → Cancel → 0 pts

**✓ Expected Total:** 300 + 250 = 550 points earned

### Steps:
1. Note starting points
2. Create Booking A, complete it, verify +300
3. Create Booking B, complete it, verify +250
4. Create Booking C, cancel it, verify no points
5. Final check: Points increased by 550 only

---

## 📱 Visual Checklist

### At Payment Screen:
- [ ] No "You'll earn X points" preview box
- [ ] No points modal after payment
- [ ] Only "Booking Confirmed!" success modal

### At Booking Detail (Pending/In-Progress):
- [ ] Green dashed test button visible
- [ ] Status shows current state (not completed)

### After Clicking Test Button:
- [ ] Confirmation alert appears
- [ ] Screen refreshes (loading indicator)
- [ ] Points modal appears with animation
- [ ] Confetti particles fall
- [ ] Counter animates from 0 to earned points

### In Rewards Tab:
- [ ] Points balance updated correctly
- [ ] Activity log shows new entry
- [ ] Entry has correct date
- [ ] Entry has correct description

---

## 🐛 Common Issues & Solutions

### Issue 1: Points modal doesn't appear
**Possible causes:**
- Booking status didn't update (check console logs)
- Hook didn't detect change

**Solution:**
1. Check console for: "✅ Booking marked as completed"
2. Force refresh by navigating away and back
3. Check Rewards tab directly to see if points were added

### Issue 2: Duplicate points awarded
**Check:**
- Did you tap the button twice?
- Did you navigate back and forth?

**Expected:** Hook prevents duplicates automatically

### Issue 3: Points calculation wrong
**Formula:** `points = Math.floor(service_price * 10)`
- RM 30 service = 300 points ✓
- RM 25.50 service = 255 points ✓
- Travel cost NOT counted ✓
- Platform fee NOT counted ✓

---

## 📊 Test Results Template

```
Date: __________
Tester: __________

Test 1: Complete Booking
Starting points: _____
Service price: RM _____
Expected points: _____
Actual points earned: _____
Points modal appeared: YES / NO
Result: PASS / FAIL

Test 2: Cancelled Booking
Starting points: _____
Service price: RM _____
Expected points: 0
Actual points earned: _____
Result: PASS / FAIL

Test 3: No Duplicates
Opened booking again: YES / NO
Modal appeared again: YES / NO
Points doubled: YES / NO
Result: PASS / FAIL

Overall: PASS / FAIL
Notes: _______________________
```

---

## 🔍 Console Logs to Watch

During testing, check console for:

```
// When test button clicked:
✅ Booking marked as completed: bk1728201234567

// When hook detects completion:
✅ Points awarded: 300 for booking bk1728201234567

// If duplicate attempted:
(No log - silently skipped)
```

---

## 🚀 Quick Test Script

For rapid testing:

1. **Open app** → Rewards tab → Note points
2. **Home** → Select barber → RM 30 service
3. **Book** → Cash → Confirm → View Booking
4. **Tap test button** → Confirm → Wait for modal 🎉
5. **Verify:** +300 points in Rewards tab
6. **Repeat steps 2-5** with different service
7. **Create booking** → Cancel it
8. **Verify:** No points added for cancelled one

**Total time:** ~5 minutes

---

## ✅ Success Criteria

All tests must pass:

- ✅ No points at payment
- ✅ Points awarded on completion
- ✅ Correct amount calculated
- ✅ Points modal appears with animation
- ✅ Activity log created
- ✅ No points for cancelled bookings
- ✅ No duplicate points
- ✅ Points persist after app restart

---

## 🧹 Clean Up After Testing

1. If using actual device, clear test data:
   - iOS: Settings → General → iPhone Storage → Mari Gunting → Delete App
   - Android: Settings → Apps → Mari Gunting → Clear Data

2. Or just note that test bookings are in the system

---

## 📝 Notes for Production

**Remember to remove test button before production:**

File: `app/booking/[id].tsx`

```typescript
// Delete these lines:
{booking?.status !== 'completed' && booking?.status !== 'cancelled' && (
  <TouchableOpacity style={styles.testCompleteButton} ...>
    ...
  </TouchableOpacity>
)}
```

And remove:
- `testCompleteButton` style
- `testCompleteButtonText` style
- `handleTestComplete` function
- `simulateBookingCompletion` import

---

## 🎓 What This Tests

1. **Hook Functionality:**
   - Detects status change
   - Awards points once
   - Prevents duplicates

2. **Points Calculation:**
   - Correct formula (10 pts per RM)
   - Only service price counted

3. **UI/UX:**
   - Modal appears at right time
   - Animation plays correctly
   - Activity log updated

4. **Business Logic:**
   - No points for cancelled bookings
   - Fair reward system

---

## 🎉 Expected Outcome

After all tests:
- Points only awarded when service completed ✓
- No points at payment ✓
- No points for cancellations ✓
- Celebration moment after service ✓
- Fair and secure system ✓

**Happy Testing! 🧪**
