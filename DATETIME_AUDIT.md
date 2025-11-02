# Date/Time Handling Audit - Mari Gunting Apps
**Date:** 2025-02-02  
**Purpose:** Audit current date/time handling before implementing Grab-style best practices

---

## 📊 Current State Analysis

### **Existing Utilities:**

#### **1. packages/shared/utils/format.ts** ✅
```typescript
formatTime(time: string) 
// Input: "14:30" → Output: "2:30 PM"
// ✅ Already converts to 12-hour format
// ❌ Only handles HH:MM string, not full timestamps
// ❌ No timezone handling

formatDate(dateStr: string)
// Uses: 'id-ID' locale (Indonesian) ❌
// Should use: 'en-MY' (Malaysia)

formatShortDate(dateStr: string)
// Uses: 'id-ID' locale (Indonesian) ❌
// Should use: 'en-MY' (Malaysia)
```

#### **2. apps/customer/utils/format.ts** ✅
```typescript
// DUPLICATE of packages/shared/utils/format.ts
// Same functions, same issues
```

---

## 🔍 Issues Found:

### **1. Locale Inconsistency ❌**
```typescript
// Current:
formatDate() uses 'id-ID' (Indonesian)
formatCurrency() uses 'en-MY' (Malaysia)

// Should be:
ALL formatters use 'en-MY' (Malaysia) consistently
```

### **2. No Timezone Handling ❌**
```typescript
// Current:
formatTime("14:30") → "2:30 PM"
// ❌ No timezone conversion
// ❌ Assumes input is already in local time

// Database stores:
created_at: "2025-02-02T12:30:00Z" (UTC)
// ❌ Not converted to Malaysia time (GMT+8)
```

### **3. Missing Timestamp Formatters ❌**
```typescript
// Needed but missing:
formatDateTime(utcTimestamp) → "2 Feb 2025, 8:30 PM"
formatRelativeTime(timestamp) → "2 hours ago"
formatFullDateTime(timestamp) → "Monday, 2 Feb 2025, 8:30 PM"
```

### **4. Inconsistent Usage Across Apps ❌**
```typescript
// Customer app bookings.tsx (line 563):
{booking.scheduledTime} // Direct usage ❌

// Should be:
{formatTime(booking.scheduledTime)} // Formatted ✅
```

---

## 🎯 What Grab/Uber Do (Best Practice):

### **1. Database Layer:**
```sql
-- Store everything in UTC (TIMESTAMPTZ)
created_at: TIMESTAMPTZ DEFAULT NOW() 
-- Stores: 2025-02-02T12:30:00Z (UTC)
```

### **2. Backend Layer:**
```typescript
// No conversion - keep UTC
// Let clients handle timezone
```

### **3. App Layer:**
```typescript
// Convert UTC → User's timezone
// Format for display
// Use 12-hour format with AM/PM

formatDateTime("2025-02-02T12:30:00Z")
→ "2 Feb 2025, 8:30 PM" (Malaysia time, GMT+8)
```

### **4. User Preferences:**
```typescript
// Respect user settings:
- Language: English (Malaysia) / Bahasa Malaysia
- Time format: 12-hour (default) / 24-hour
- Timezone: Auto-detect or manual
```

---

## 📝 Recommendations:

### **Priority 1: Fix Locale Consistency (Quick Win)**
```typescript
// Change ALL formatters to 'en-MY'
formatDate() → Use 'en-MY' instead of 'id-ID'
formatShortDate() → Use 'en-MY' instead of 'id-ID'
```

### **Priority 2: Add Timezone Support (Critical)**
```typescript
// New functions needed:
export const formatDateTime = (utcTimestamp: string) => {
  return new Date(utcTimestamp).toLocaleString('en-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export const formatTimeWithTimezone = (utcTimestamp: string) => {
  return new Date(utcTimestamp).toLocaleTimeString('en-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export const formatRelativeTime = (utcTimestamp: string) => {
  const now = new Date();
  const then = new Date(utcTimestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
  return `${Math.floor(diffMins / 1440)} days ago`;
};
```

### **Priority 3: Consolidate Utilities (Code Cleanup)**
```bash
# Remove duplicate:
apps/customer/utils/format.ts ❌

# Use shared:
packages/shared/utils/format.ts ✅

# Update imports everywhere
```

### **Priority 4: Update App Usage (Systematic)**
```typescript
// Customer app - 15 locations need updating
// Partner app - 12 locations need updating
// Replace direct usage with formatted functions
```

---

## 🗂️ Files That Need Updates:

### **Customer App:**
1. `app/(tabs)/bookings.tsx` - Booking list times
2. `app/booking/[id].tsx` - Booking detail times
3. `app/barbershop/[id].tsx` - Opening hours
4. `app/barbershops.tsx` - Shop hours
5. `app/(tabs)/rewards.tsx` - Voucher expiry

### **Partner App:**
1. `app/(tabs)/dashboard.tsx` - Job times
2. `app/(tabs)/jobs.tsx` - Job schedule
3. `app/(tabs)/earnings.tsx` - Payout dates
4. `app/(tabs)/schedule.tsx` - Availability

### **Shared:**
1. `packages/shared/utils/format.ts` - Fix locale, add timezone
2. `packages/shared/services/rewardsService.ts` - Date handling

---

## ✅ Implementation Plan:

### **Step 1: Fix Shared Utilities (Foundation)**
- ✅ Update locale from 'id-ID' to 'en-MY'
- ✅ Add timezone support (Asia/Kuala_Lumpur)
- ✅ Add new formatters (DateTime, RelativeTime)
- ✅ Keep existing formatters working (backward compatible)

### **Step 2: Remove Duplicates (Cleanup)**
- ✅ Delete `apps/customer/utils/format.ts`
- ✅ Update all Customer app imports to use shared utils

### **Step 3: Update Customer App (Systematic)**
- ✅ Replace direct time/date usage with formatters
- ✅ Test each screen (bookings, details, rewards)

### **Step 4: Update Partner App (Systematic)**
- ✅ Replace direct time/date usage with formatters
- ✅ Test each screen (dashboard, jobs, earnings)

### **Step 5: Testing (Verification)**
- ✅ Test with sample UTC timestamps
- ✅ Verify Malaysia timezone (GMT+8)
- ✅ Verify 12-hour format with AM/PM
- ✅ Test edge cases (midnight, noon, date transitions)

---

## 📊 Expected Results After Implementation:

### **Before:**
```
Created: 2025-02-02T12:30:00Z (raw UTC)
Time: 14:30 (24-hour)
Date: 2 Februari 2025 (Indonesian locale)
```

### **After:**
```
Created: 2 Feb 2025, 8:30 PM (Malaysia time, 12-hour)
Time: 2:30 PM (12-hour with AM/PM)
Date: 2 Feb 2025 (English Malaysia locale)
```

---

## 🚀 Benefits:

✅ **Consistent formatting** across all screens  
✅ **Malaysia timezone** (GMT+8) throughout  
✅ **12-hour format** with AM/PM (user-friendly)  
✅ **English (Malaysia) locale** (correct for market)  
✅ **Single source of truth** (shared utils)  
✅ **Easy to maintain** (centralized formatting)  
✅ **Production-ready** (Grab/Uber standard)

---

## ⚠️ What NOT to Change:

❌ **Database** - Keep storing in UTC (no migration)  
❌ **Backend** - No changes needed  
❌ **Existing data** - All compatible  
❌ **API responses** - UTC timestamps work perfectly

---

## 📚 Reference - Grab's Approach:

```typescript
// Grab stores in UTC, displays in local timezone
// Database: 2025-02-02T12:30:00Z
// Singapore: 8:30 PM (GMT+8)
// Malaysia: 8:30 PM (GMT+8)
// Indonesia: 7:30 PM (GMT+7)

// User can change preferences:
- Language: English / Bahasa / 中文
- Time format: 12-hour / 24-hour
- Timezone: Auto / Manual
```

---

## 🎯 Next Steps:

**Before proceeding, confirm:**
1. ✅ Change locale from Indonesian to Malaysia English
2. ✅ Add timezone conversion (UTC → Malaysia GMT+8)
3. ✅ Use 12-hour format with AM/PM everywhere
4. ✅ Consolidate utilities (remove duplicates)
5. ✅ Update both apps systematically

**Ready to implement?**

---

_Last updated: 2025-02-02_
