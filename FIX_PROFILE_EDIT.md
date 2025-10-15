# Fix Profile Edit Not Saving

## Problem
When editing profile (fullname, bio, specializations) in the partner app and clicking save, the changes don't persist to the Supabase database.

## Root Cause
RLS (Row Level Security) policies on `profiles` and `barbers` tables may be preventing UPDATE operations.

## Solution

### Step 1: Apply RLS Fix in Supabase Dashboard

1. **Go to Supabase Dashboard:** https://supabase.com/dashboard
2. **Select your project:** `uufiyurcsldecspakneg`
3. **Click on "SQL Editor"** in the left sidebar
4. **Click "New Query"**
5. **Copy and paste this SQL:**

```sql
-- Fix Profile Edit RLS Policies
-- Ensures barbers can update both profiles and barbers tables

-- =====================================================
-- PROFILES TABLE - Ensure UPDATE policy exists
-- =====================================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Create clean UPDATE policy for profiles
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- BARBERS TABLE - Ensure UPDATE policy exists
-- =====================================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Barbers can update own profile" ON barbers;
DROP POLICY IF EXISTS "barbers_update_own" ON barbers;

-- Create clean UPDATE policy for barbers
CREATE POLICY "barbers_update_own"
  ON barbers FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check profiles policies
SELECT 
  'profiles' as table_name,
  policyname, 
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'UPDATE';

-- Check barbers policies
SELECT 
  'barbers' as table_name,
  policyname, 
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'barbers' AND cmd = 'UPDATE';
```

6. **Click "Run"** (or press Cmd+Enter / Ctrl+Enter)
7. **Verify the output** - You should see 2 policies listed:
   - `profiles_update_own` for profiles table
   - `barbers_update_own` for barbers table

---

### Step 2: Test the Fix

1. **Open partner app**
2. **Go to Profile → Edit Profile**
3. **Make changes** to name, bio, or specializations
4. **Click "Save Changes"**
5. **Check the console logs** - You should see:

```
[EditProfile] Saving profile changes...
[EditProfile] User ID: [your-user-id]
[EditProfile] Form data: {...}
[EditProfile] Updating profiles table...
[EditProfile] Profile updated: [...]
[EditProfile] Updating barbers table...
[EditProfile] Barber data updated: [...]
[EditProfile] Profile updated successfully
```

6. **Check Supabase Dashboard:**
   - Go to Table Editor → `profiles` → Find your user
   - Verify `full_name` is updated
   - Go to Table Editor → `barbers` → Find your barber record
   - Verify `bio` and `specializations` are updated

---

## Debugging

### If you see an error in console:

**Error like:** `Profile update failed: new row violates row-level security policy`

**Solution:** The RLS policy is blocking the update. Make sure you ran the SQL fix above.

**Error like:** `Barber update failed: new row violates row-level security policy`

**Solution:** The barbers table RLS policy is blocking. Run the SQL fix above.

**Error like:** `User ID: undefined`

**Solution:** The user is not logged in properly. Check authentication.

---

### Alternative: Temporarily Disable RLS (Development Only!)

**⚠️ ONLY FOR TESTING - NOT FOR PRODUCTION!**

If you want to test if RLS is the issue:

```sql
-- Temporarily disable RLS on profiles
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Temporarily disable RLS on barbers
ALTER TABLE barbers DISABLE ROW LEVEL SECURITY;
```

Test if profile edit works now. If it does, the issue is definitely RLS policies.

**Don't forget to re-enable RLS after testing:**

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
```

---

## What We Changed

### In the Code (`edit.tsx`):

✅ Added detailed logging to see exactly what's happening:
- Logs user ID
- Logs form data
- Logs each table update separately
- Logs any errors with details

### In the Database:

✅ Ensured clean UPDATE policies exist:
- `profiles_update_own` - Allows users to update their own profile
- `barbers_update_own` - Allows barbers to update their own barber record

---

## Expected Behavior After Fix

1. **Edit profile** → Changes are made
2. **Click save** → Loading indicator shows
3. **Success alert** → "Your profile has been updated successfully"
4. **Navigate back** → Profile shows updated info
5. **Database** → Changes persisted in Supabase

---

## Files Modified

- ✅ `/apps/partner/app/profile/edit.tsx` - Added better error logging
- ✅ `/supabase/migrations/fix_profile_edit_rls.sql` - SQL fix for RLS policies

---

## Next Steps

1. ✅ Apply the SQL fix in Supabase Dashboard
2. ✅ Test profile edit in partner app
3. ✅ Check console logs for any errors
4. ✅ Verify data in Supabase table editor

**Let me know the console output after you test!**
