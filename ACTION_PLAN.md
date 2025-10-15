# RLS Fix - Action Plan

## Current Status
✅ Logs confirm: Status 200, but returns empty data `[]`  
✅ RLS policies exist and are correct  
❌ **auth.uid()** is likely NOT matching your user ID in the database context

## Root Cause
When you run an UPDATE with RLS enabled, Postgres evaluates:
```sql
UPDATE profiles 
SET full_name = 'Test Seven' 
WHERE id = 'a8467a5b-b92c-471c-a932-c9619fbc4829'  -- Your WHERE clause
AND (auth.uid() = id);  -- RLS USING clause adds this
```

If `auth.uid()` returns **NULL** or a **different ID**, the AND fails → 0 rows updated → empty array returned.

## Solutions (Try in Order)

### Solution 1: Verify Session in App (DO THIS FIRST) 🔥

I've added session checking to your code. Run your app again and look for:
```
[EditProfile] Session check:
[EditProfile]   - Session exists: true/false
[EditProfile]   - Session user ID: [some-id]
[EditProfile]   - User ID matches session: true/false
```

**If session exists = false:**
- Your auth token expired
- Log out and log back in
- Then try updating profile again

**If session user ID doesn't match:**
- Your store has stale data
- Clear app storage and re-authenticate

### Solution 2: Temporarily Disable RLS to Confirm (TESTING ONLY) ⚠️

Run `TEMPORARY_RLS_BYPASS.sql` in Supabase:
```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE barbers DISABLE ROW LEVEL SECURITY;
```

Test your update. 

**If it works now:** RLS is definitely the problem, but it's auth context issue.  
**If it still doesn't work:** Different problem entirely (not RLS).

**IMPORTANT:** Re-enable RLS after testing:
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
```

### Solution 3: Check Auth Context in SQL

Run this in Supabase SQL Editor **while logged into your app**:
```sql
SELECT 
    auth.uid() as current_auth_uid,
    'a8467a5b-b92c-471c-a932-c9619fbc4829' as your_user_id,
    CASE 
        WHEN auth.uid() IS NULL THEN '❌ No auth context!'
        WHEN auth.uid() = 'a8467a5b-b92c-471c-a932-c9619fbc4829' THEN '✅ Match!'
        ELSE '⚠️ Mismatch'
    END as status;
```

**⚠️ Important:** The SQL Editor has its own auth context. This will probably show NULL because you're not authenticated in the SQL editor. That's normal and doesn't mean your app is broken.

### Solution 4: Try Alternative RLS Policy

Run `ALTERNATIVE_RLS_FIX.sql` - Approach 1:
```sql
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "barbers_update_policy" ON barbers;

CREATE POLICY "profiles_update_v2" ON profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "barbers_update_v2" ON barbers
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
```

This is essentially the same but with a clean slate.

### Solution 5: Debug Policy (Last Resort) 🚨

**ONLY IF NOTHING ELSE WORKS** - Use the debug policy from `ALTERNATIVE_RLS_FIX.sql` - Approach 2:

```sql
DROP POLICY IF EXISTS "profiles_update_v2" ON profiles;

CREATE POLICY "profiles_update_debug" ON profiles
    FOR UPDATE TO authenticated
    USING (true)  -- Very permissive - allows checking any row
    WITH CHECK (auth.uid() = id);  -- Still secure - only updates own record
```

This will help us see if the USING clause is the problem or the WITH CHECK clause.

## Diagnostic Steps

### Step 1: Check Session (Your App)
Run the app, try to save, check console for session info.

### Step 2: Check User Exists
Run `CHECK_USER_DATA.sql` in Supabase to verify your user record exists.

### Step 3: Verify RLS Status
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('profiles', 'barbers');
```

### Step 4: Check Policy Count
```sql
SELECT tablename, COUNT(*) 
FROM pg_policies 
WHERE tablename IN ('profiles', 'barbers') AND cmd = 'UPDATE'
GROUP BY tablename;
```
Should return exactly 1 policy per table.

## What to Report Back

After trying the solutions, send me:

1. **Session check output** from the app console:
   ```
   [EditProfile] Session exists: ?
   [EditProfile] Session user ID: ?
   ```

2. **Did disabling RLS work?** (Yes/No)

3. **Error code if any** (from console)

4. **Which solution worked** (if any)

## Most Likely Solution

Based on your logs, I suspect:
- Session exists but JWT token isn't being included in the Supabase request headers properly
- OR auth.uid() in Postgres context is returning NULL even though session exists

**Quick test:** Try Solution 2 (disable RLS temporarily). If that works, we know it's 100% an auth context issue, not a data/policy issue.

## Files Created
- ✅ `CHECK_USER_DATA.sql` - Verify user exists
- ✅ `TEMPORARY_RLS_BYPASS.sql` - Test without RLS
- ✅ `ALTERNATIVE_RLS_FIX.sql` - Alternative policy approaches
- ✅ `ACTION_PLAN.md` - This file

## Next Steps After Fix
Once working:
1. Re-enable RLS if you disabled it
2. Use the production-ready policy (Approach 1)
3. Test with a different user to ensure isolation
4. Add audit logging for profile changes
