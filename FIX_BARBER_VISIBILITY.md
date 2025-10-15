# Fix Barber Visibility Issue - EMERGENCY FIX

## ⚠️ CRITICAL: Infinite Recursion Error

If you're seeing the error `infinite recursion detected in policy for relation "profiles"`, apply this fix IMMEDIATELY!

## Problem
The customer app shows "No barbers found" and now there's an infinite recursion error in the RLS policies.

## Root Cause
The previous RLS policy fix created a recursive policy that references the profiles table within its own policy check, causing infinite recursion.

## Solution
We need to fix the RLS policies with a non-recursive approach.

## Steps to Fix IMMEDIATELY

### Via Supabase Dashboard (URGENT - Do This Now!)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `uufiyurcsldecspakneg`
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste the following SQL:

```sql
-- EMERGENCY FIX: Remove infinite recursion in profiles RLS policies
-- The previous migration caused infinite recursion - this fixes it

-- First, drop ALL policies on profiles table to stop the recursion
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Barber profiles viewable by all for discovery" ON profiles;
DROP POLICY IF EXISTS "Own profile viewable by user" ON profiles;

-- Now create simple, non-recursive policies

-- 1. Users can view their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- 2. Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 3. Users can insert their own profile
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. Allow viewing profiles for barbers (non-recursive approach)
-- This uses a direct check against the barbers table without joining back to profiles
CREATE POLICY "profiles_select_barbers_public"
  ON profiles FOR SELECT
  USING (
    is_active = TRUE 
    AND id IN (
      SELECT user_id FROM barbers
    )
  );

-- 5. Allow viewing profiles for barbershop owners (non-recursive approach)
CREATE POLICY "profiles_select_barbershop_owners_public"
  ON profiles FOR SELECT
  USING (
    is_active = TRUE 
    AND id IN (
      SELECT owner_id FROM barbershops
    )
  );

-- Verify the policies are applied
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
```

6. Click "Run" (or press Cmd+Enter / Ctrl+Enter)
7. You should see the query succeed and a list of the current policies at the end

### Option 2: Via psql command line

If you have `psql` installed and Supabase connection details:

```bash
# Apply the migration
psql "postgresql://postgres:[YOUR-PASSWORD]@db.uufiyurcsldecspakneg.supabase.co:5432/postgres" \
  -f supabase/migrations/fix_barber_profile_visibility.sql
```

## Verification

After applying the fix, verify it works:

1. Run the check script:
```bash
node check-barbers.js
```

2. Check the customer app - barbers should now be visible

3. The real-time subscription for barber status changes should also work now

## What This Fix Does

- ✅ Allows anonymous users to view profiles of barbers and barbershop owners
- ✅ Keeps customer profiles private (only visible to the profile owner)
- ✅ Maintains security - only active profiles with barber/barbershop records are visible
- ✅ Enables the customer app to fetch and display barbers

## Security Note

This change is safe because:
- Only profiles with associated barber or barbershop records are made public
- Customer profiles remain private
- Only `is_active = TRUE` profiles are visible
- This is standard for discovery/marketplace applications
