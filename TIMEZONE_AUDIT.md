# Timezone & 12-Hour Format Audit

## ❌ Issues Found

### Customer App

1. **`app/booking/[id].tsx` (Lines 600-622)**
   - Uses `formatTime()` with direct time strings → ✅ OK (already 12-hour)
   - BUT: `booking.acceptedAt`, `booking.onTheWayAt` etc are **ISO timestamps**
   - **Problem:** Passing ISO datetime to `formatTime()` expecting "HH:mm" string
   - **Fix:** Use `formatLocalTime(booking.acceptedAt)` instead

2. **`app/(tabs)/bookings.tsx` (Line 571)**
   - Uses `formatTime(mappedBooking.scheduledTime)` → ✅ OK
   - Uses `formatShortDate(mappedBooking.scheduledDate)` → ❌ Not timezone-aware
   - **Fix:** Use `formatLocalDate(mappedBooking.scheduledDate)`

3. **`components/BarberResponseWaitingModal.tsx` (Line 98-102)**
   - Local `formatTime()` function for countdown → ✅ OK (minutes:seconds)

4. **`app/barbershop/booking/[barberId].tsx` (Line 68-70)**
   - Generates dates locally → ✅ OK (user's timezone)
   - Uses `toLocaleDateString()` → ✅ OK

5. **`app/barbershop/[id].tsx` + `app/barbershops.tsx`**
   - Manual timezone calculation for Malaysia time (GMT+8) → ❌ WRONG
   - Lines like: `const malaysiaTime = new Date(now.getTime() + (8 * 60 * 60 * 1000))`
   - **Problem:** Hardcodes GMT+8, breaks for users in other timezones
   - **Fix:** Use `Intl.DateTimeFormat` with user's timezone

### Partner App

6. **`app/(tabs)/dashboard.tsx` (Lines 970, 976)**
   - Uses `new Date().getTime()` for countdown timer → ✅ OK
   - Manual timer formatting (`${minutes}:${seconds}`) → ✅ OK

7. **`app/(tabs)/jobs.tsx` (Lines 219, 238-240)**
   - `new Date(b.createdAt).getTime()` for sorting → ✅ OK
   - `new Date(job.completedAt)` for monthly stats → ✅ OK
   - BUT: Comparing `getMonth()` and `getFullYear()` → ❌ Uses local timezone
   - **Problem:** Month boundaries differ by timezone
   - **Fix:** Use UTC methods or timezone-aware comparison

8. **`app/(tabs)/reviews.tsx` (Lines 372, 420)**
   - Uses `formatDistanceToNow(parseISO(review.date))` from `date-fns` → ✅ OK
   - **Note:** date-fns respects user's timezone automatically

---

## ✅ Grab Best Practice

**Store UTC, Display Local:**
- Database: Store as UTC (PostgreSQL `timestamptz`)
- Frontend: Display in user's device timezone using `Intl.DateTimeFormat`
- Format: 12-hour with AM/PM for Malaysia market

---

## 🔧 Required Fixes

### High Priority

1. **Customer `app/booking/[id].tsx`** - Fix progress tracker timestamps
2. **Customer `app/(tabs)/bookings.tsx`** - Fix date display
3. **Both Apps** - Remove hardcoded GMT+8 calculations

### Medium Priority

4. **Partner `app/(tabs)/jobs.tsx`** - Fix monthly stats calculation
5. **Customer barbershop screens** - Remove manual timezone logic

### Functions to Use

```typescript
// ✅ CORRECT - Grab-style (user's timezone)
formatLocalTime(datetime)      // "2:30 PM"
formatLocalDate(datetime)      // "15 Jan 2025"  
formatLocalDateTime(datetime)  // "15 Jan 2025, 2:30 PM"

// ❌ WRONG - Hardcoded timezone
const malaysiaTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));

// ❌ WRONG - Wrong input type
formatTime("2024-01-15T14:30:00Z") // Expects "14:30", not ISO string
```

---

## Summary

- **Customer App:** 5 files need fixes
- **Partner App:** 2 files need fixes
- **Main Issue:** Mixing time strings ("14:30") with ISO timestamps
- **Solution:** Use `formatLocalTime/Date()` for ISO timestamps, keep `formatTime()` for time strings only
