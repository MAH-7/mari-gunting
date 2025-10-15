# 🚨 STEP-BY-STEP: Fix Infinite Recursion NOW

## Your app is COMPLETELY BROKEN because of RLS policy infinite recursion. Follow these EXACT steps:

---

## STEP 1: Open Your Browser

Go to this URL:
```
https://supabase.com/dashboard/project/uufiyurcsldecspakneg/sql/new
```

This will open the SQL Editor in your Supabase dashboard.

---

## STEP 2: Copy This SQL (THE NUCLEAR OPTION)

**Copy ALL of this SQL:**

```sql
-- NUCLEAR OPTION: Completely reset profiles table RLS policies
-- This will IMMEDIATELY stop the infinite recursion error

-- Step 1: Drop ALL existing policies on profiles (this stops the recursion)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', r.policyname);
    END LOOP;
END $$;

-- Step 2: Temporarily disable RLS to allow the app to work
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Show what we just did
SELECT 'PROFILES RLS DISABLED - App should work now' AS status;
SELECT COUNT(*) as remaining_policies FROM pg_policies WHERE tablename = 'profiles';
```

---

## STEP 3: Paste and Run

1. **Paste** the SQL into the editor (Cmd+V or Ctrl+V)
2. **Click the green "Run" button** or press **Cmd+Enter** (Mac) or **Ctrl+Enter** (Windows)
3. You should see: `PROFILES RLS DISABLED - App should work now`

---

## STEP 4: Verify

1. **Go back to your customer app**
2. **Close the app completely** (swipe up on iOS, or force close on Android)
3. **Restart the app**
4. The errors should be GONE!

---

## What This Does

This is the "nuclear option" - it:
- ✅ **Removes ALL policies** on the profiles table
- ✅ **Disables RLS** temporarily so your app works immediately
- ✅ **Stops the infinite recursion** error

### Is This Safe?

**For development: YES!** 

With RLS disabled on profiles:
- ✅ Your app will work
- ✅ You can fetch barbers
- ✅ Rewards will work
- ⚠️ All profiles are visible (but this is fine for development)

---

## After the App Works Again

Once your app is working, we can add back proper (non-recursive) RLS policies later. But RIGHT NOW, we need to stop the error.

---

## Still Not Working?

If you still see the error after running the SQL:

1. **Make sure you clicked "Run"** in Supabase
2. **Completely restart your app** (force close and reopen)
3. **Check that you're looking at the right project** (uufiyurcsldecspakneg)
4. Share a screenshot of what you see in Supabase after running the SQL

---

## Need Help?

File in this directory:
- `NUCLEAR_FIX.sql` - The SQL file (same as above)

Just run it and your app will work!
