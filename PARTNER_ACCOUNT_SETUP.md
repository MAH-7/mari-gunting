# Partner Account Setup - Implementation Guide

## ✅ What Was Changed

### 1. **Database Migration** (`007_partner_account_setup.sql`)
Created two SQL functions to handle account type finalization:

- `setup_freelance_barber(user_id)` - Creates barber record, keeps role as 'barber'
- `setup_barbershop_owner(user_id, shop_name?)` - Updates role to 'barbershop_owner', creates barbershop record

**📍 Location:** `/supabase/migrations/007_partner_account_setup.sql`

### 2. **Partner Account Service** 
Created TypeScript service to call the SQL functions from React Native:

**📍 Location:** `/packages/shared/services/partnerAccountService.ts`

**Methods:**
- `setupFreelanceBarber(userId)` - Setup freelance barber
- `setupBarbershopOwner(userId, shopName?)` - Setup barbershop owner  
- `setupAccount(userId, accountType, shopName?)` - Convenience method
- `hasCompletedSetup(userId)` - Check if setup is done
- `getAccountType(userId)` - Get user's account type

### 3. **Updated Screens**

#### `complete-profile.tsx`
- Now uses temporary `role: 'barber'` during profile creation
- Added comments explaining the role will be finalized in account type selection

#### `select-account-type.tsx`
- **Now calls the database functions!**
- Added loading state
- Calls `partnerAccountService.setupAccount()` when user selects account type
- Shows error alerts if setup fails
- Only navigates to onboarding after successful setup

---

## 🔄 New Flow

### Before (Confusing):
```
1. Profile Creation → role: 'barber' ❓
2. Account Type Selection → Just saves to AsyncStorage ❓
3. Onboarding → ???
```

### After (Clear):
```
1. Profile Creation → role: 'barber' (temporary)
2. Account Type Selection → 
   - Freelance: stays 'barber' + creates barbers table record ✅
   - Barbershop: updates to 'barbershop_owner' + creates barbershops table record ✅
3. Onboarding → Continue with proper role set
```

---

## 📋 To Apply This Update

### Step 1: Run the Database Migration

Go to your Supabase Dashboard → SQL Editor → New Query, then paste and run:

```sql
/supabase/migrations/007_partner_account_setup.sql
```

(Copy the entire contents of that file)

### Step 2: Restart the Partner App

```bash
cd apps/partner
npm exec expo start --port 8082 --clear
```

### Step 3: Test the Flow

1. Register a new partner account
2. Complete profile (name, email)
3. **Select account type** (Freelance or Barbershop)
4. Should see loading spinner
5. Should navigate to onboarding welcome
6. Check logs for: `✅ Account setup successful`

---

## 🗄️ Database Tables After Setup

### Freelance Barber:
```
profiles: { id: user-123, role: 'barber' }
barbers: { user_id: user-123, verification_status: 'unverified' }
```

### Barbershop Owner:
```
profiles: { id: user-456, role: 'barbershop_owner' }
barbershops: { owner_id: user-456, name: 'My Barbershop' }
```

---

## 🐛 Troubleshooting

### Error: "function setup_freelance_barber does not exist"
→ You need to run the migration in Step 1 above

### Error: "User not found or not a barber"
→ User's profile doesn't exist or role is wrong. Check profiles table

### Navigation stuck on account type screen
→ Check console logs for error messages
→ Verify user is authenticated with `supabase.auth.getUser()`

---

## ✨ Benefits of This Approach

1. **Clear separation**: Role is set ONLY when account type is chosen
2. **Database-driven**: Logic in SQL functions (secure, reusable)
3. **Idempotent**: Can call setup functions multiple times safely
4. **Type-safe**: TypeScript service with proper types
5. **Error handling**: Proper error messages for users
6. **Grab-style**: Professional onboarding flow like Grab drivers/merchants

---

## 🎯 Next Steps

- Add progress indicator during onboarding
- Implement eKYC verification approval
- Add admin dashboard to approve partners
- Set up push notifications for approval status
