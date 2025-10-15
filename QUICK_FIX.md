# Quick Fix Reference Card

## 🔥 IMMEDIATE ACTION

### 1️⃣ Run This SQL in Supabase Dashboard
Copy and paste this into Supabase SQL Editor and run it:

```sql
-- Drop duplicate policies
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own barber record" ON barbers;
DROP POLICY IF EXISTS "barbers_update_own" ON barbers;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON barbers;
DROP POLICY IF EXISTS "Barbers can update their own record" ON barbers;

-- Create single clean policies
CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "barbers_update_policy" ON barbers
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Verify
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE tablename IN ('profiles', 'barbers') AND cmd = 'UPDATE';
```

### 2️⃣ Test the Update
1. Restart your Partner app
2. Go to Profile → Edit Profile
3. Change your name, bio, or specializations
4. Click "Save Changes"
5. **Look at the console output** - you'll see detailed logs

### 3️⃣ Check the Console Logs

#### ✅ Success looks like:
```
[EditProfile] ✅ Profile updated successfully
[EditProfile] ✅ Barber data updated successfully
[EditProfile] ✅✅✅ ALL UPDATES SUCCESSFUL
```

#### ❌ Failure looks like:
```
[EditProfile] ⚠️ Profile update returned no data - possible RLS issue
```
**OR**
```
[EditProfile] ❌ Profile update FAILED
[EditProfile] Error code: 42501
```

### 4️⃣ Verify in Supabase
After a successful save:
- Open Supabase → Table Editor
- Check `profiles` table → find your user → verify `full_name` changed
- Check `barbers` table → find your barber → verify `bio` and `specializations` changed

## 🔍 What Changed?

### Code Changes
- Added comprehensive logging to `apps/partner/app/profile/edit.tsx`
- Now shows exactly what's happening at each step
- Detects RLS issues specifically

### SQL Changes
- Removed duplicate RLS policies (these were conflicting)
- Created single, clean UPDATE policy for each table
- Both `USING` and `WITH CHECK` clauses properly set

## 📋 Common Error Codes

| Code | Meaning | Fix |
|------|---------|-----|
| 42501 | Permission denied | RLS policy missing or incorrect |
| 42703 | Column doesn't exist | Check table schema |
| 23505 | Unique constraint violation | Duplicate data |
| No error but no data | RLS `WITH CHECK` failing | Policy conditions wrong |

## 🆘 Still Not Working?

Run this diagnostic query in Supabase:
```sql
-- Check current policies
SELECT tablename, policyname, cmd, 
       qual as using_clause, 
       with_check as check_clause
FROM pg_policies 
WHERE tablename IN ('profiles', 'barbers')
ORDER BY tablename, cmd;
```

Then send me:
1. The output of the query above
2. The console logs from your app (entire `[EditProfile]` section)
3. Screenshot of the error message

## 📁 Files Created
- `DEBUG_RLS_ISSUE.sql` - Comprehensive diagnostic and fix script
- `RLS_TROUBLESHOOTING_GUIDE.md` - Detailed troubleshooting guide
- `QUICK_FIX.md` - This quick reference card

## ⏭️ Next Steps After Fix
Once this is working, consider:
- Adding real-time subscriptions to the profile screen
- Implementing optimistic UI updates
- Adding validation for profile photo file size
- Creating a change history/audit log
