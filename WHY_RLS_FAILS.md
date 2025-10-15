# Why RLS Updates Fail - Technical Deep Dive

## The Core Problem

When you have Row Level Security (RLS) enabled on Supabase, **every database operation is filtered through policy checks**. For UPDATE operations specifically, Postgres checks TWO things:

1. **USING clause** - "Can this user see/select the row they want to update?"
2. **WITH CHECK clause** - "After the update, does the resulting row still satisfy the policy?"

## Your Specific Issue

### Most Likely Cause: Duplicate Policies

When you have multiple UPDATE policies on the same table, Postgres evaluates them using **AND** logic (not OR). This means:

```sql
-- If you have these two policies:
POLICY "policy1" USING (auth.uid() = id) WITH CHECK (auth.uid() = id)
POLICY "policy2" USING (auth.uid() = id) WITH CHECK (true)

-- Postgres evaluates it as:
(policy1.USING AND policy2.USING) AND (policy1.WITH_CHECK AND policy2.WITH_CHECK)
```

Even if they seem compatible, subtle differences or parsing issues can cause them to conflict, resulting in **silently failing updates** (no error, but no data returned).

## Why It Returns No Data Instead of Errors

Supabase's `.update()` returns the updated rows. When RLS blocks an update:
- No error is thrown (because RLS evaluation is "successful")
- But no rows are returned (because the policy denied the operation)
- Your code sees `data = []` or `data = null`

This is **by design** in Postgres RLS - it's a security feature to prevent information leakage.

## How to Diagnose

### Check 1: Multiple Policies
```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('profiles', 'barbers') AND cmd = 'UPDATE'
GROUP BY tablename;
```

If count > 1 for any table → **You have duplicate policies causing conflicts**

### Check 2: Policy Details
```sql
SELECT 
    tablename,
    policyname,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename IN ('profiles', 'barbers') AND cmd = 'UPDATE';
```

Look for:
- Missing `WITH CHECK` clauses (they default to `USING` clause)
- Different conditions between policies
- Complex expressions that might fail silently

### Check 3: Auth Context
```sql
-- Run this while authenticated in your app
SELECT auth.uid();
```

If this returns `NULL`, your authentication session isn't properly set, and **all RLS policies will fail**.

## The Fix

### Single Policy Pattern (Recommended)
```sql
-- One UPDATE policy per table
CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
```

This ensures:
- ✅ Only authenticated users can update
- ✅ Users can only update their own records
- ✅ After update, the record still belongs to them (prevents privilege escalation)

### What NOT to Do
```sql
-- ❌ DON'T: Multiple UPDATE policies
CREATE POLICY "policy1" ON profiles FOR UPDATE ...;
CREATE POLICY "policy2" ON profiles FOR UPDATE ...;

-- ❌ DON'T: Missing WITH CHECK
CREATE POLICY "bad_policy" ON profiles 
    FOR UPDATE USING (auth.uid() = id);
    -- Missing WITH CHECK - defaults to USING, but unclear

-- ❌ DON'T: Overly permissive USING with restrictive WITH CHECK
CREATE POLICY "confusing" ON profiles
    FOR UPDATE 
    USING (true)  -- Anyone can see all rows
    WITH CHECK (auth.uid() = id);  -- But only update own rows
    -- This works but is confusing and may cause unexpected behavior
```

## Testing Methodology

### 1. Test RLS in SQL Editor First
```sql
-- Set the auth context (replace with your actual user ID)
SELECT set_config('request.jwt.claims', '{"sub":"your-user-id-here"}', true);

-- Try the update
UPDATE profiles 
SET full_name = 'Test Name' 
WHERE id = 'your-user-id-here'
RETURNING *;

-- Check result
-- If rows returned → Policy works
-- If no rows returned → Policy is blocking
```

### 2. Test from Application
With the enhanced logging I added, you'll see:
```
[EditProfile] Step 1: Updating profiles table...
[EditProfile] Profile update response:
[EditProfile]   - Status: 200
[EditProfile]   - Data: []  ← ⚠️ Empty array = RLS blocked it
[EditProfile]   - Error: null
[EditProfile] ⚠️ Profile update returned no data - possible RLS issue
```

## Common Gotchas

### Gotcha 1: Service Role vs Anon Key
```typescript
// Your app should use ANON key
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Service role BYPASSES RLS - only use server-side
const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
```

### Gotcha 2: Session Refresh
If updates suddenly stop working:
```typescript
// Session might have expired
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  // Re-authenticate user
  await supabase.auth.refreshSession();
}
```

### Gotcha 3: Column-Level RLS
Some installations have column-level security. Check:
```sql
SELECT * FROM information_schema.column_privileges 
WHERE table_name IN ('profiles', 'barbers');
```

### Gotcha 4: Triggers Interfering
Check for triggers that might block updates:
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('profiles', 'barbers')
  AND event_manipulation = 'UPDATE';
```

## How the Fix Works

### Before (Broken)
```
User clicks Save
  → App sends UPDATE to Supabase
  → Postgres evaluates Policy1: ✅ USING passes, ✅ WITH CHECK passes
  → Postgres evaluates Policy2: ✅ USING passes, ❌ WITH CHECK fails
  → Combined: ❌ FAILED
  → Returns: { data: [], error: null }
  → App sees empty data, thinks nothing happened
```

### After (Fixed)
```
User clicks Save
  → App sends UPDATE to Supabase
  → Postgres evaluates single policy: ✅ USING passes, ✅ WITH CHECK passes
  → Update succeeds
  → Returns: { data: [updatedRow], error: null }
  → App sees data, shows success message
  → UI updates immediately
```

## Prevention

To avoid this in the future:

1. **Name your policies clearly**: Use a consistent naming convention
   - `{table}_select`, `{table}_insert`, `{table}_update`, `{table}_delete`

2. **Document your RLS**: Keep a file tracking what policies exist and why

3. **Test RLS changes**: Before deploying, test in a staging environment

4. **Use migrations**: Don't manually create policies in production
   ```sql
   -- migration: 20240101_add_profile_policies.sql
   DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
   CREATE POLICY "profiles_update_policy" ON profiles
       FOR UPDATE TO authenticated
       USING (auth.uid() = id)
       WITH CHECK (auth.uid() = id);
   ```

5. **Monitor policy count**: Set up alerts if policy count changes unexpectedly

## Further Reading

- [Postgres RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [RLS Performance Tips](https://supabase.com/docs/guides/database/postgres/row-level-security#rls-performance-recommendations)
