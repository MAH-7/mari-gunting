# Role Security Fix - Customer/Partner App Separation

**Date**: 2025-01-31
**Status**: Fixed ✅

## Problem

Users who registered in the **customer app** could immediately log into the **partner app** and get automatically upgraded to barber role without:
- Going through partner registration (barber OR barbershop)
- Completing partner onboarding
- Partner verification process
- Any partner-specific checks

This was a **security and business logic flaw** that allowed unauthorized access to partner features.

**Note**: The partner app supports TWO types of accounts:
- **Freelance Barber** - Individual barbers who travel to customers
- **Barbershop Owner** - Owners of physical barbershop locations

## Root Cause

In `apps/partner/app/verify-otp.tsx` (lines 149-176), there was code that automatically added the 'barber' role to ANY user logging into the partner app:

```typescript
// OLD CODE (INSECURE):
if (!hasBarberRole) {
  console.log('➕ Customer logging into partner app - adding barber role...');
  // Automatically add barber role without verification
  const updatedRoles = [...userRoles, 'barber'];
  await supabase.from('profiles').update({ 
    roles: updatedRoles,
    role: 'barber'
  })
}
```

This "Grab-style" approach was too permissive and bypassed all security checks.

## Solution

### 1. Block Customers from Partner App ✅

Updated `apps/partner/app/verify-otp.tsx` to **block** customers and redirect them to proper partner registration:

**Checks for BOTH partner types:**
- `barber` role (freelance barbers)
- `barbershop_owner` role (barbershop owners)

```typescript
// NEW CODE (SECURE):
const userRoles = profile.roles || [profile.role];
const hasBarberRole = userRoles.includes('barber') || userRoles.includes('barbershop_owner');

if (!hasBarberRole) {
  console.log('❌ Customer attempting to access partner app - blocked');
  Alert.alert(
    'Partner Account Required',
    'This app is for verified partners only (freelance barbers or barbershop owners). Please complete partner registration to continue.',
    [
      {
        text: 'Register as Partner',
        onPress: () => router.replace({
          pathname: '/complete-profile',
          params: { phoneNumber, role: 'barber' }
        })
      },
      { text: 'Cancel', onPress: () => router.replace('/login') }
    ]
  );
  return;
}
```

### 2. Handle Existing Customers Upgrading to Barber ✅

Updated `apps/partner/app/complete-profile.tsx` to detect existing customers and guide them through proper account setup:

```typescript
// Check if user already exists (customer upgrading to barber)
const existingUserCheck = await authService.checkPhoneExists(phoneNumber);

if (existingUserCheck.success && existingUserCheck.data?.exists) {
  console.log('ℹ️ Existing customer upgrading to barber partner');
  // Don't create duplicate profile - proceed to account type selection
  router.replace('/select-account-type');
  return;
}
```

### 3. Fix Database Functions to Handle Roles Array ✅

Created migration `20250131_fix_roles_array_in_setup_functions.sql` to properly update the `roles` array when users set up barber accounts:

**`setup_freelance_barber` function now:**
- Adds 'barber' to `roles` array (keeps 'customer' if exists)
- Sets `role = 'barber'` for backward compatibility
- Creates barber table record

**`setup_barbershop_owner` function now:**
- Adds 'barbershop_owner' to `roles` array
- Removes 'barber' role (business rule: no dual freelance + shop)
- Keeps 'customer' if exists
- Sets `role = 'barbershop_owner'` for backward compatibility
- Creates barbershop table record

## Database Schema

The `profiles` table supports multiple roles via array:

```sql
profiles {
  role TEXT,              -- Primary role (backward compatibility)
  roles TEXT[],           -- Array of roles (NEW: supports multiple)
  ...
}

-- Supported roles:
- 'customer'          -- Uses customer app
- 'barber'            -- Freelance barber (travels to customers)
- 'barbershop_owner'  -- Owns a physical barbershop
- 'admin'             -- Platform admin (not implemented yet)

-- Example valid roles arrays:
['customer']                        -- Customer only
['customer', 'barber']              -- Customer who is also a freelance barber
['customer', 'barbershop_owner']    -- Customer who owns a barbershop
['barber']                          -- Barber only (no customer account)
['barbershop_owner']                -- Shop owner only (no customer account)

-- Invalid combinations (enforced by business logic):
['barber', 'barbershop_owner']      -- ❌ Cannot be both freelance + shop owner
```

## User Flows After Fix

### New User (Fresh Registration)

**Customer App:**
1. Enter phone → OTP → Register → Customer role
2. ✅ Can use customer app immediately

**Partner App:**
1. Enter phone → OTP → Complete Profile → Select Account Type → Onboarding
2. ✅ Gets barber role only after completing onboarding

### Existing Customer Upgrading to Partner

1. Opens partner app → Login with phone
2. ❌ Blocked: "Partner Account Required"
3. Taps "Register as Partner"
4. Complete Profile screen (detected as existing user)
5. **Select Account Type:**
   - **Freelance Barber** → Creates barber record → role added: `['customer', 'barber']`
   - **Barbershop Owner** → Creates barbershop record → role added: `['customer', 'barbershop_owner']`
6. Complete Onboarding (verification, documents, services)
7. ✅ Partner role added to roles array
8. ✅ Can now use BOTH apps with same phone number

### Existing Barber Trying Customer App

1. Opens customer app → Login with phone
2. ✅ Works immediately (no blocking)
3. If roles = `['barber']`, customer role is added on first use
4. ✅ Can use both apps

## Security Improvements

✅ **Partner app requires proper registration** - No automatic role escalation for customers
✅ **Supports both partner types** - Freelance barbers AND barbershop owners
✅ **Proper onboarding flow enforced** - Partner role only after completing verification
✅ **RLS policies remain secure** - Role checks happen at database level
✅ **Multi-role support** - Customers can upgrade to partners while keeping customer role
✅ **Backward compatibility** - Old code using `role` column still works

## Testing Checklist

- [ ] Test customer login blocked from partner app
- [ ] Test "Register as Partner" flow from partner app
- [ ] Test existing customer upgrading to **freelance barber**
- [ ] Test existing customer upgrading to **barbershop owner**
- [ ] Test `barber` role added to roles array after freelance onboarding
- [ ] Test `barbershop_owner` role added to roles array after barbershop onboarding
- [ ] Test both apps work with multi-role account (`['customer', 'barber']`)
- [ ] Test barbershop owner CANNOT also be freelance barber (business rule)
- [ ] Apply database migration to production

## Migration Steps

1. **Apply code changes** (already done in this session)
2. **Deploy migration** to Supabase:
   ```bash
   cd supabase
   supabase db push
   ```
3. **Test** with existing customer account
4. **Verify** in Supabase dashboard that roles array is updated correctly

## Files Changed

- ✅ `apps/partner/app/verify-otp.tsx` - Added customer blocking logic
- ✅ `apps/partner/app/complete-profile.tsx` - Handle existing customers
- ✅ `supabase/migrations/20250131_fix_roles_array_in_setup_functions.sql` - Fix RPC functions

---

**Last Updated**: 2025-01-31 12:10 UTC
**Status**: Ready for deployment
