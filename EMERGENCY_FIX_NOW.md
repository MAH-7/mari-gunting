# 🚨 EMERGENCY FIX - DO THIS NOW! 🚨

## The Problem
Your app is broken with: `infinite recursion detected in policy for relation "profiles"`

## The Quick Fix (5 minutes)

### Step 1: Open Supabase Dashboard
Go to: https://supabase.com/dashboard/project/uufiyurcsldecspakneg/sql/new

### Step 2: Copy This SQL
```sql
-- EMERGENCY FIX: Remove infinite recursion
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Barber profiles viewable by all for discovery" ON profiles;
DROP POLICY IF EXISTS "Own profile viewable by user" ON profiles;

-- Create non-recursive policies
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow viewing barber profiles (non-recursive)
CREATE POLICY "profiles_select_barbers_public" ON profiles FOR SELECT 
USING (is_active = TRUE AND id IN (SELECT user_id FROM barbers));

-- Allow viewing barbershop owner profiles (non-recursive)
CREATE POLICY "profiles_select_barbershop_owners_public" ON profiles FOR SELECT 
USING (is_active = TRUE AND id IN (SELECT owner_id FROM barbershops));
```

### Step 3: Run It
- Paste the SQL in the SQL Editor
- Click "Run" or press Cmd+Enter (Mac) / Ctrl+Enter (Windows)

### Step 4: Verify
After running, refresh your customer app. Barbers should now appear!

---

## What This Does
- ✅ Removes the broken recursive policies
- ✅ Creates clean, working policies
- ✅ Allows anonymous users to see barber profiles
- ✅ Keeps customer profiles private
- ✅ Fixes the infinite recursion error

## Need More Info?
See: `FIX_BARBER_VISIBILITY.md` for detailed explanation
