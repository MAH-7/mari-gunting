# Bug Fix: Foreign Key Constraint Error in Dev Mode Registration

**Date:** 2025-10-12  
**Status:** ✅ Fixed  
**Severity:** High (blocking registration)

---

## 🐛 Problem

When attempting to register a new user in dev mode, the following error occurred:

```
ERROR ❌ DEV MODE: Profile creation error: 
{
  "code": "23503", 
  "details": "Key is not present in table \"users\".", 
  "message": "insert or update on table \"profiles\" violates foreign key constraint \"profiles_id_fkey\""
}
```

### Root Cause

The `profiles` table has a foreign key constraint to `auth.users`:

```sql
ALTER TABLE profiles 
  ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id);
```

In the original dev mode implementation, we were:
1. Generating **deterministic UUIDs** from phone numbers
2. Attempting to insert profiles with these fake UUIDs
3. ❌ PostgreSQL rejected the insert because the UUID didn't exist in `auth.users`

---

## ✅ Solution: Option A - Create Real Auth Users

We chose **Option A**: Always create real auth users, even in dev mode.

### Changes Made

#### 1. **Simplified Registration Flow** (`authService.register()`)

**Before:**
```typescript
if (IS_DEV_MODE) {
  // Generate fake UUID from phone number
  userId = generateDevUUID(params.phoneNumber);
} else {
  // Create real auth user via Supabase
  const { data } = await supabase.auth.signUp({...});
  userId = data.user.id;
}
```

**After:**
```typescript
// Always create real auth user (both dev and production)
const { data } = await supabase.auth.signUp({
  phone: params.phoneNumber,
  password: tempPassword,
  options: {
    data: {
      full_name: params.fullName,
      email: params.email,
      role: params.role,
    },
  },
});
userId = data.user.id;
```

#### 2. **Simplified Profile Insert**

**Before:**
```typescript
if (IS_DEV_MODE) {
  // Special dev mode insert
  await supabase.from('profiles').insert({...});
} else {
  // Production insert
  await supabase.from('profiles').insert({...});
}
```

**After:**
```typescript
// Single code path for both dev and production
const { data: profileData, error } = await supabase
  .from('profiles')
  .insert({
    id: userId, // Real UUID from auth.users
    phone_number: params.phoneNumber,
    full_name: params.fullName,
    email: params.email,
    avatar_url: params.avatarUrl,
    role: params.role,
  })
  .select()
  .single();
```

#### 3. **Updated Dev Mode OTP Verification**

Removed the code that generated fake UUIDs for new users:

**Before:**
```typescript
if (!authUserId) {
  // Generate fake UUID for dev mode
  authUserId = generateDevUUID(phoneNumber);
}
```

**After:**
```typescript
// Just check if profile exists, no fake UUIDs
if (!authUserId) {
  console.log('ℹ️ DEV MODE: No auth session, checking profile directly...');
}
```

#### 4. **Removed Unused Function**

Deleted `generateDevUUID()` function - no longer needed!

---

## 🎯 Benefits of This Approach

### ✅ Pros
1. **Simpler Code** - One registration flow instead of two
2. **Real Database State** - Dev environment matches production
3. **No Foreign Key Issues** - All user IDs exist in `auth.users`
4. **Better Testing** - Testing with real auth users = production-like
5. **Easier Debugging** - Real sessions, real tokens, real behavior

### 🤔 Tradeoffs
- **Requires Supabase Connection**: Dev mode now needs real Supabase backend
  - ✅ We already use Supabase for profiles table
  - ✅ Not a new dependency
- **Auth Users Created in Dev**: Each test creates real auth records
  - ✅ Can be cleaned up periodically
  - ✅ Better than fake data anyway

---

## 🧪 What Still Works in Dev Mode

Even though we create real auth users, dev mode still has benefits:

### 1. **Test OTP (`123456`)**
```typescript
if (IS_DEV_MODE && otp === TEST_OTP) {
  // Accept test OTP instead of real SMS
  console.log('✅ DEV MODE: Accepting test OTP');
}
```

### 2. **Skip SMS Sending**
```typescript
if (IS_DEV_MODE) {
  console.log('📱 SMS would be sent via Twilio in production');
  return { success: true, data: { sent: true } };
}
```

### 3. **Visual Dev Hints**
- Yellow banner on OTP screen: "🐛 Dev Mode: Use OTP 123456"
- Console logs for debugging

---

## 📊 Flow Comparison

### Before (Broken)
```
Register →  Generate Fake UUID
         →  Try to insert profile with fake UUID
         →  ❌ Foreign key constraint violation
```

### After (Fixed)
```
Register →  Create real auth user via Supabase
         →  Get real UUID from auth.users
         →  Insert profile with real UUID
         →  ✅ Success! Foreign key constraint satisfied
```

---

## 🧪 Testing

### Test 1: New User Registration ✅
```bash
Phone: 19-999 8888
OTP: 123456
Name: Test User
Email: test@example.com
```

**Expected:**
- ✅ Real auth user created in `auth.users`
- ✅ Profile created in `profiles` with matching UUID
- ✅ No foreign key error
- ✅ User successfully registered

### Test 2: Existing User Login ✅
```bash
Phone: 11-111 1111 (existing customer)
OTP: 123456
```

**Expected:**
- ✅ Profile found by phone number
- ✅ User logged in successfully
- ✅ No registration required

---

## 🔄 Migration Notes

### For Developers
- **No action required** - The fix is backwards compatible
- Existing test users still work
- New registrations now create real auth users

### For Database
- **No schema changes needed**
- Foreign key constraint remains in place (as it should)
- All new profiles will have valid `auth.users` references

---

## 📝 Files Changed

1. `packages/shared/services/authService.ts`
   - Simplified `register()` method
   - Updated `verifyOTP()` dev mode logic
   - Removed `generateDevUUID()` function

---

## 🚀 Deployment

### Development
- ✅ Already deployed (local changes)
- ✅ Ready to test immediately

### Production
- ✅ No changes needed
- ✅ Production flow unchanged (was already correct)

---

## ✅ Verification Checklist

- [x] Fix applied to authService.ts
- [x] Unused code removed (generateDevUUID)
- [x] Dev mode still uses test OTP (123456)
- [x] Foreign key constraint satisfied
- [x] Ready for testing

---

## 🎓 Lessons Learned

1. **Don't bypass database constraints** - They exist for a reason
2. **Keep dev close to production** - Reduces surprises
3. **Real data beats fake data** - Even in development
4. **Foreign keys are your friend** - They prevent data inconsistencies

---

**Status:** ✅ Fixed and ready for testing!

Last updated: 2025-10-12 04:48 UTC
