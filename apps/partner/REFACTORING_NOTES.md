# Partner App Refactoring - Unified Login Flow

## Changes Made

### 1. **Removed Separate Register Screen**
- **Before**: Partner app had both `/login` and `/register` screens
- **After**: Single `/login` screen handles both new and existing users
- **File**: `app/register.tsx` → renamed to `app/select-account-type-backup.tsx`

### 2. **Updated Login Screen**
**File**: `apps/partner/app/login.tsx`

**Changes**:
- Removed "Don't have account? Register" link
- Added helper text: "New to Mari Gunting? We'll create your partner account after verifying your number"
- Removed explicit role parameter from OTP navigation (handled by verify-otp logic)

### 3. **Updated Select Account Type**
**File**: `apps/partner/app/select-account-type.tsx`

**Changes**:
- Session error now redirects to `/login` instead of `/register`

---

## New User Flow

```
Partner Login
    ↓ (enter phone number)
OTP Verification (verify-otp.tsx)
    ↓
[Check if phone exists in database]
    ↓                           ↓
Existing User                New User
    ↓                           ↓
[Check if has barber role]   Complete Profile
    ↓           ↓                ↓
Yes (→ /)   No (→ prompt)    Select Account Type
                                ↓
                         Onboarding Flow
```

### Detailed Flow:

1. **Login Screen** (`/login`)
   - User enters phone number
   - Sends OTP via WhatsApp
   - Navigates to `/verify-otp`

2. **OTP Verification** (`/verify-otp`)
   - Verifies OTP code
   - Checks if phone number exists in database:
     - **New User**: Routes to `/complete-profile`
     - **Existing User**: 
       - **Has barber role**: Routes to `/` (index)
       - **No barber role** (customer): Shows "Partner Account Required" alert → routes to `/complete-profile` OR `/login`

3. **Complete Profile** (`/complete-profile`)
   - Collects: Full Name, Email, Avatar (optional)
   - Phone number is pre-filled (verified)
   - Creates user profile with temporary 'barber' role
   - Routes to `/select-account-type`

4. **Select Account Type** (`/select-account-type`)
   - Choose: Freelance Barber OR Barbershop Owner
   - Updates role and creates appropriate record:
     - **Freelance**: Stays 'barber' role + creates `barbers` table record
     - **Barbershop**: Updates to 'barbershop_owner' role + creates `barbershops` table record
   - Routes to onboarding:
     - Freelance: `/onboarding/barber/basic-info`
     - Barbershop: `/onboarding/barbershop/business-info`

---

## Benefits

### ✅ **Consistent UX**
- Same login pattern across customer and partner apps
- No confusion about "login vs register"

### ✅ **Simpler Maintenance**
- One less screen to maintain
- Unified authentication logic

### ✅ **Better Security**
- Role checking at OTP verification level
- Prevents customers from accessing partner app

### ✅ **Modern Pattern**
- Follows industry standard (WhatsApp, Telegram, Uber, etc.)
- Phone → OTP → Auto-register if new

---

## Files Modified

1. `apps/partner/app/login.tsx` - Removed register link, added consistent helper text
2. `apps/customer/app/login.tsx` - Added new user helper text for consistency
3. `apps/partner/app/register.tsx` → `apps/partner/app/select-account-type-backup.tsx` (backup)
4. `apps/partner/app/select-account-type.tsx` - Updated error redirect
5. `apps/partner/app/verify-otp.tsx` - Already handles new/existing user logic

---

## Testing Checklist

- [ ] New partner can login with phone → OTP → complete profile → select account type → onboarding
- [ ] Existing partner can login with phone → OTP → dashboard
- [ ] Customer trying to access partner app gets blocked with proper message
- [ ] Helper text displays correctly on login screen
- [ ] Role verification works correctly in verify-otp

---

## Rollback Plan

If needed to revert:
1. Rename `select-account-type-backup.tsx` back to `register.tsx`
2. Revert `login.tsx` changes (add back register link)
3. Revert `select-account-type.tsx` redirect change

---

**Date**: 2025-10-31
**Author**: Senior Dev Review
**Status**: ✅ Complete
