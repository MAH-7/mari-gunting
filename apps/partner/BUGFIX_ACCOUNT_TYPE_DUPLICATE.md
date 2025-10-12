# Bugfix: Duplicate Account Type Selection Screen

**Date:** 2025-10-11  
**Issue:** Two account type selection screens existed, causing confusion  
**Status:** ✅ FIXED

---

## Problem

The app had **TWO** account type selection screens:
1. `/select-account-type.tsx` (root level)
2. `/onboarding/account-type.tsx` (inside onboarding folder)

This caused confusion about when and where users select their account type.

---

## Root Cause

During development, the onboarding flow evolved:
- **Original design:** Account selection happened AFTER welcome screen inside onboarding
- **Current implementation:** Account selection happens BEFORE onboarding starts

The old `/onboarding/account-type.tsx` screen was never removed, creating duplicate functionality.

---

## What Was Fixed

### 1. ✅ Deleted unused file
```bash
rm apps/partner/app/onboarding/account-type.tsx
```

### 2. ✅ Updated onboarding layout
**File:** `apps/partner/app/onboarding/_layout.tsx`
- Removed Stack.Screen reference to `account-type`
- Added comment explaining why it's not needed

### 3. ✅ Updated documentation
**File:** `apps/partner/ONBOARDING_IMPLEMENTATION_STATUS.md`
- Updated flow diagram to show `/select-account-type` happens BEFORE onboarding
- Updated steps table to reflect correct flow
- Marked Phase 1 screens as complete

### 4. ✅ Fixed swipe-back navigation
**File:** `apps/partner/app/select-account-type.tsx`
- Changed `router.push()` to `router.replace()` (line 104)
- Prevents user from swiping back from welcome screen to account selection
- Account type selection is now truly permanent

---

## Correct Flow (After Fix)

```
Registration (phone + OTP)
    ↓
/select-account-type ← Select Freelance or Barbershop
    ↓ (creates account in DB)
/onboarding/welcome
    ↓
/onboarding/ekyc
    ↓
... (rest of onboarding)
```

### Key Points:
- Account type is selected ONCE at `/select-account-type`
- Selection creates account record in database
- Onboarding flow starts AFTER account type is set
- User cannot go back and change account type (swipe disabled)

---

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `app/onboarding/account-type.tsx` | ❌ Deleted | Unused duplicate screen |
| `app/onboarding/_layout.tsx` | ✏️ Modified | Removed screen reference + added comment |
| `app/select-account-type.tsx` | ✏️ Modified | Changed router.push to router.replace |
| `ONBOARDING_IMPLEMENTATION_STATUS.md` | ✏️ Modified | Updated flow diagram and steps |

---

## Testing

✅ **Before fix:**
- Two account type screens existed
- Documentation showed incorrect flow
- Confusion about which screen was used

✅ **After fix:**
- One account type screen at `/select-account-type`
- Flow is clear and documented
- No duplicate functionality

---

## Related Files (Not Modified)

These files correctly reference `/select-account-type`:
- ✅ `app/index.tsx` - Routes to `/select-account-type` for new users
- ✅ `app/select-account-type.tsx` - The actual account selection screen
- ✅ `app/onboarding/welcome.tsx` - Assumes account type already selected

---

**Status:** Production-ready ✅

---

## Additional Fix: Prevent Swipe Back from Onboarding

**Issue Found:** User could swipe back from `/onboarding/welcome` to `/select-account-type`

**Root Cause:** Using `router.push()` instead of `router.replace()` in account selection

**Fix Applied:**
```diff
// select-account-type.tsx line 103
- router.push('/onboarding/welcome');
+ router.replace('/onboarding/welcome');
```

**Result:** 
- ✅ User CANNOT swipe back from welcome screen to account selection
- ✅ Account type choice is truly permanent after confirmation
- ✅ Navigation stack is properly managed

---

## Testing Checklist

### Scenario 1: Normal Flow ✅
1. Register with phone + OTP
2. Select account type (Freelance or Barbershop)
3. Confirm in alert dialog
4. Redirected to `/onboarding/welcome`
5. **Try to swipe back** → Should NOT go back to account selection
6. Press "Get Started" → Continue to eKYC

**Expected:** Cannot return to account selection screen

### Scenario 2: Canceling Selection ✅
1. At account selection screen
2. Select Freelance Barber
3. Press Continue
4. Press "Go Back" in confirmation alert
5. Still at account selection screen
6. Can select Barbershop Owner instead

**Expected:** Can change choice before confirming

### Scenario 3: Session Recovery ✅
1. Select account type + confirm
2. Kill app before completing onboarding
3. Reopen app
4. Should redirect to `/onboarding/welcome` (not account selection)

**Expected:** User continues onboarding, not sent back to account selection

---

## Technical Details

### Navigation Methods Used

| Location | Method | Reason |
|----------|--------|--------|
| `select-account-type.tsx` → `onboarding/welcome` | `router.replace()` | Prevent back navigation |
| Within onboarding screens | `router.push()` | Allow forward navigation |
| `index.tsx` redirects | `<Redirect>` | Root-level routing |

### Why `router.replace()` Works

- Replaces current route in history stack
- Previous screen (`/select-account-type`) is removed from stack
- Swipe gesture has nowhere to go back to
- User must complete onboarding or logout

---

**Updated:** 2025-10-11 22:14 UTC  
**Status:** Production-ready ✅  
**Tested:** iOS swipe-back gesture blocked ✅
