# RLS Troubleshooting Guide

## Problem
Profile updates (fullname, bio, specializations) are not persisting when RLS is enabled on Supabase.

## Solution Steps

### Step 1: Run the Diagnostic SQL Script

1. Open your Supabase dashboard
2. Go to **SQL Editor**
3. Open the file `DEBUG_RLS_ISSUE.sql`
4. Run the entire script
5. **IMPORTANT**: Review the output, especially:
   - Step 2: Check if you have duplicate UPDATE policies
   - Verification section: Confirm only ONE update policy exists per table

### Step 2: Test Profile Updates

1. Open the Partner app
2. Go to Profile → Edit Profile
3. Make a change (update name, bio, or specializations)
4. Click "Save Changes"
5. **IMPORTANT**: Open your React Native debugger/console and look for:
   ```
   [EditProfile] ========================================
   [EditProfile] Starting save operation...
   ```
   
### Step 3: Identify the Exact Error

The enhanced logging will show you one of these scenarios:

#### Scenario A: RLS Policy Issue (No Data Returned)
```
[EditProfile] ⚠️ Profile update returned no data - possible RLS issue
```
**Solution**: Your RLS policies are blocking the update. The SQL script should have fixed this.

#### Scenario B: Permission Denied Error
```
[EditProfile] ❌ Profile update FAILED
[EditProfile] Error code: 42501
[EditProfile] Error message: permission denied for table profiles
```
**Solution**: Check if RLS is enabled but policies are missing. Re-run the SQL script.

#### Scenario C: Column Does Not Exist
```
[EditProfile] Error code: 42703
[EditProfile] Error message: column "full_name" does not exist
```
**Solution**: Your table schema doesn't match the code. Check column names.

#### Scenario D: Auth User Not Found
```
[EditProfile] Error: User not logged in
```
**Solution**: Your authentication session expired. Log out and log back in.

### Step 4: Verify in Supabase Dashboard

After a successful save, verify the changes:

1. Go to Supabase Dashboard → **Table Editor**
2. Open the `profiles` table
3. Find your user by ID
4. Check if `full_name` was updated
5. Open the `barbers` table
6. Find your barber record by `user_id`
7. Check if `bio` and `specializations` were updated

### Step 5: Common Issues and Solutions

#### Issue: "No rows returned" even after running SQL script

**Cause**: The RLS policy's `WITH CHECK` clause is failing.

**Solution**: Check your Supabase session:
```sql
-- Run this in Supabase SQL Editor
SELECT auth.uid();
```
If this returns `NULL`, you're not authenticated in the SQL editor context. The policies ARE working correctly, but you need to test from the app.

#### Issue: Updates work in SQL Editor but not in the app

**Cause**: The app is using a different authentication context or service role key.

**Solution**: Check your Supabase client configuration:
```typescript
// Should use the ANON key, not SERVICE_ROLE key
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY  // ✅ Correct
  // SUPABASE_SERVICE_ROLE_KEY  // ❌ Wrong for client apps
);
```

#### Issue: Only one table updates but not the other

**Cause**: One table has proper RLS policies, the other doesn't.

**Solution**: Verify both policies exist:
```sql
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE tablename IN ('profiles', 'barbers')
  AND cmd = 'UPDATE';
```
You should see exactly TWO rows:
- `profiles` | `profiles_update_policy` | `UPDATE`
- `barbers` | `barbers_update_policy` | `UPDATE`

### Step 6: Nuclear Option - Complete Reset

If nothing else works, use this script to completely reset RLS:

```sql
-- DANGER: This removes ALL policies!
-- Run this in Supabase SQL Editor

-- Drop all policies on profiles
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON profiles';
    END LOOP;
END $$;

-- Drop all policies on barbers
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'barbers' LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON barbers';
    END LOOP;
END $$;

-- Recreate policies
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "barbers_select" ON barbers FOR SELECT TO authenticated USING (true);
CREATE POLICY "barbers_insert" ON barbers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "barbers_update" ON barbers FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Verify
SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename IN ('profiles', 'barbers') ORDER BY tablename, cmd;
```

## What the Updated Code Does

The enhanced logging now shows:
1. ✅ Exactly what data is being sent
2. ✅ HTTP status codes from Supabase
3. ✅ Full error details including error codes
4. ✅ Clear success/failure indicators
5. ✅ Specific RLS failure detection

## Next Steps After Fix

Once updates work:
1. Test updating each field individually
2. Test with different specializations
3. Verify the UI reflects changes immediately
4. Check that the profile screen shows updated data

## Still Not Working?

If you've tried everything above and it still doesn't work, gather this information:

1. **Console logs** from the app (the entire `[EditProfile]` section)
2. **Supabase SQL output** from running the diagnostic script
3. **Your Supabase project ID** (found in Settings → General)
4. **Screenshot** of the RLS policies in Supabase Dashboard

Then we can investigate deeper issues like:
- Supabase Edge Functions intercepting updates
- Database triggers blocking changes
- Replication lag (unlikely but possible)
- Caching issues in the Supabase client
