# Bugfix: Login After Account Selection Redirects to Wrong Screen

**Date:** 2025-10-11  
**Issue:** After selecting account type and closing app, login redirects to "Complete Profile" instead of onboarding  
**Status:** ✅ FIXED

---

## Problem

**User Flow That Was Broken:**
1. User registers → enters phone + OTP
2. User completes profile (name, email)
3. User selects account type (Freelance or Barbershop)
4. **User closes app before completing onboarding**
5. User reopens app → logs in
6. ❌ Redirected to "Complete Your Profile" screen (WRONG!)

**Expected Behavior:**
After step 5, user should be redirected to `/onboarding/welcome` to continue onboarding.

---

## Root Cause

### Issue 1: verify-otp.tsx Making Wrong Decision
**File:** `app/verify-otp.tsx` (lines 114-162)

The OTP verification screen was checking:
```typescript
if (!userCheck.data?.exists || userCheck.data.role !== expectedRole) {
  // Send to complete-profile
  router.replace('/complete-profile');
}
```

**Problem:** Role checking was too strict. If user selected account type but hadn't completed full profile, it would fail the check and send them to registration again.

### Issue 2: index.tsx Not Handling Partial Setup
**File:** `app/index.tsx` (lines 68-81)

The index routing logic was:
```typescript
if (!verificationStatus.isComplete) {
  // Always send to account type selection
  return <Redirect href="/select-account-type" />;
}
```

**Problem:** Didn't distinguish between:
- No account type selected (needs `/select-account-type`)
- Account type selected but onboarding incomplete (needs `/onboarding/welcome`)

---

## Solution

### Fix 1: Simplify verify-otp.tsx Routing
**Changed:** Let `index.tsx` handle all routing decisions after login

**Before:**
```typescript
// Complex role checking and conditional routing
if (role mismatch || !exists) {
  router.replace('/complete-profile');
} else {
  router.replace('/');
}
```

**After:**
```typescript
// Simple: just check if profile exists
if (!userCheck.data?.exists) {
  router.replace('/complete-profile'); // New user
  return;
}

// Existing user - always go through index for proper routing
router.replace('/');
```

### Fix 2: Smart Routing in index.tsx
**Changed:** Check `accountType` to determine correct destination

**Before:**
```typescript
if (!verificationStatus.isComplete) {
  return <Redirect href="/select-account-type" />;
}
```

**After:**
```typescript
if (!verificationStatus.isComplete) {
  if (verificationStatus.accountType) {
    // Account type selected - continue onboarding
    return <Redirect href="/onboarding/welcome" />;
  } else {
    // No account type - go to selection
    return <Redirect href="/select-account-type" />;
  }
}
```

---

## How It Works Now

### New User Registration:
```
Register → Complete Profile → Select Account Type → Onboarding → Dashboard
```

### Returning User Login:
```
Login → OTP → index.tsx checks status:
  ├─ No account type? → /select-account-type
  ├─ Account type but no onboarding? → /onboarding/welcome
  ├─ Onboarding done but pending? → /pending-approval
  └─ Verified? → /dashboard
```

### Edge Case: Mid-Registration Logout
```
1. Register → Complete Profile → Select Account Type
2. Close app (before onboarding)
3. Login
4. ✅ Correctly routed to /onboarding/welcome
```

---

## Files Modified

| File | Lines | Change |
|------|-------|--------|
| `app/verify-otp.tsx` | 114-157 | Removed role checking, simplified routing |
| `app/index.tsx` | 68-87 | Added accountType check for smart routing |

---

## Testing Scenarios

### ✅ Scenario 1: Complete New Registration
1. Register → Complete profile → Select account type
2. Continue through onboarding → Success! ✅

### ✅ Scenario 2: Interrupted Registration (THE BUG)
1. Register → Complete profile → Select account type
2. **Close app**
3. Login with same number
4. **Correctly routed to /onboarding/welcome** ✅

### ✅ Scenario 3: Fresh User
1. Register → Complete profile
2. Close app (before account type selection)
3. Login
4. Routed to /select-account-type ✅

### ✅ Scenario 4: Completed Onboarding
1. Complete all steps through onboarding
2. Close app
3. Login
4. Routed based on verification status (pending or dashboard) ✅

---

## Related Files

These files work together for login routing:

```
app/
├── login.tsx              → Sends OTP
├── verify-otp.tsx         → Verifies OTP, sets user, routes to index
├── index.tsx              → Smart router based on verification status
├── complete-profile.tsx   → New user registration
├── select-account-type.tsx → Account type selection
└── onboarding/
    └── welcome.tsx        → Start of onboarding flow
```

---

## Key Insight

**Single Source of Truth:**  
The `index.tsx` file is now the **single decision point** for routing authenticated users. 

- `verify-otp.tsx` only handles OTP validation
- All routing logic based on account status is in `index.tsx`
- Uses `verificationService.getVerificationStatus()` which checks:
  - Does barber/barbershop record exist? (accountType)
  - Is verification complete? (isComplete)
  - Can accept bookings? (canAcceptBookings)

---

**Status:** Production-ready ✅  
**Tested:** Mid-registration logout/login flow ✅  
**Updated:** 2025-10-11 22:20 UTC
