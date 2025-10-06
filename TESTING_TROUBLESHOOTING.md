# Quick Troubleshooting: Test Button Not Working

## Steps to Test with Console Logging

1. **Open Console**
   - In your terminal, you should see Metro bundler logs
   - Or open React Native Debugger
   - Or check Xcode console (iOS) / Android Studio Logcat

2. **Create a Booking**
   - Home → Select barber → Select service → Book with Cash
   - Note the booking ID from success modal

3. **Click Test Button**
   - Go to Bookings → Tap your booking
   - Tap "🧪 Test: Mark as Completed" button
   - Confirm in alert

4. **Watch Console Logs**

You should see this sequence:

```
🧪 Test button clicked for booking: bk1728201234567
👆 User confirmed completion
🧪 Attempting to complete booking: bk1728201234567
✅ Booking marked as completed: bk1728201234567
✅ Updated booking status: completed
✅ Status updated, refetching booking...

🔍 useBookingCompletion hook triggered
  - Booking ID: bk1728201234567
  - Booking status: completed
  - Already awarded: false
✅ Points awarded: 300 for booking bk1728201234567
```

---

## If Nothing Happens

### Check 1: Did the alert appear?
- **NO:** Button not clickable, check if booking status allows it
- **YES:** Continue to Check 2

### Check 2: Console logs after confirmation?
- **NO:** Check import: `import { api, simulateBookingCompletion } from '@/services/api';`
- **YES:** Continue to Check 3

### Check 3: Did you see "Booking marked as completed"?
- **NO:** Booking not in memory. Did you create it in this session?
- **YES:** Continue to Check 4

### Check 4: Did hook trigger?
- **NO:** React Query didn't refetch. Try navigating away and back
- **YES:** Check if status is "completed"

### Check 5: Did points modal appear?
- **NO:** Check if `onPointsAwarded` callback is working
- **YES:** Success! 🎉

---

## Quick Fix: Force Refresh

If the test button doesn't work:

1. **Navigate away from booking:**
   - Go to Rewards tab
   - Then back to Bookings
   - Open the booking again

2. **Or restart app:**
   - Shake device → Reload
   - Or in terminal: Press `r` to reload

3. **Or create a new booking:**
   - Sometimes easier to just test with a fresh booking

---

## Common Issues

### Issue: "Booking not found in createdBookings map"
**Cause:** Booking was created in a previous app session

**Solution:** Create a new booking in the current session

### Issue: Hook triggers but no modal
**Cause:** `onPointsAwarded` callback not firing

**Solution:** Check if `showPointsModal` state updates

### Issue: Modal appears but no points added
**Cause:** Store not persisting

**Solution:** Check AsyncStorage, or check Rewards tab manually

---

## Manual Verification

If console logs show success but modal doesn't appear:

1. **Check Rewards Tab:**
   - Go to Rewards
   - Check if points increased
   - Check Activity tab for entry

2. **If points ARE there:**
   - The system works! Modal might have auto-dismissed
   - Or there's a UI issue with modal

3. **If points are NOT there:**
   - Hook didn't complete
   - Check console for errors

---

## Developer Tools

### Check Store State:
```typescript
// In console (if using React Native Debugger):
import { useStore } from './store/useStore';
const store = useStore.getState();
console.log('Points:', store.userPoints);
console.log('Activity:', store.activity);
```

### Check Booking State:
```typescript
// Add this temporarily in booking detail screen:
console.log('Current booking:', JSON.stringify(booking, null, 2));
```

---

## Still Not Working?

1. **Reload app** (cmd+R or shake device → Reload)
2. **Check imports** in `/app/booking/[id].tsx`
3. **Verify function exists** in `/services/api.ts`
4. **Create fresh booking** in current session
5. **Check Metro bundler** for compilation errors

---

## Expected Flow Summary

```
[Create Booking] → Booking stored in memory (Map)
       ↓
[View Booking] → Test button appears
       ↓
[Tap Test Button] → simulateBookingCompletion() called
       ↓
[Confirm Alert] → Booking status updated to 'completed'
       ↓
[Refetch Query] → useBookingCompletion hook detects change
       ↓
[Award Points] → addPoints() + addActivity()
       ↓
[Show Modal] → onPointsAwarded() callback
       ↓
[Celebration!] 🎉
```

---

Need more help? Check console logs and compare with expected sequence above.
