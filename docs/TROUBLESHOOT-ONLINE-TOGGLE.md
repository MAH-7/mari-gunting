# Troubleshooting: Online/Offline Toggle Not Updating

## 🔍 Quick Diagnosis Steps

### Step 1: Check React Native Debugger Console
When you toggle online/offline, check for error messages:
- Look for: `"Error updating profile online status"`
- Look for: `"Error updating barber availability"`

### Step 2: Check Database Columns Exist

Run this in **Supabase SQL Editor**:

```sql
-- Check if columns exist in profiles table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('is_online', 'last_seen_at');

-- Check if columns exist in barbers table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'barbers' 
AND column_name = 'is_available';
```

**Expected Results:**
- `profiles.is_online` → boolean
- `profiles.last_seen_at` → timestamp with time zone
- `barbers.is_available` → boolean

### Step 3: Add Missing Columns (If Needed)

If columns are missing, run:

```sql
-- Add to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- Add to barbers table
ALTER TABLE barbers 
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON profiles(is_online);
CREATE INDEX IF NOT EXISTS idx_barbers_is_available ON barbers(is_available);
```

### Step 4: Check RLS Policies

Run this to see if user can update their own profile:

```sql
-- Check existing policies for profiles
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Check existing policies for barbers
SELECT * FROM pg_policies WHERE tablename = 'barbers';
```

### Step 5: Add/Fix RLS Policies

If policies don't allow updates, add them:

```sql
-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to update their barber record
CREATE POLICY "Users can update own barber record"
ON barbers FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

## 🧪 Manual Test

After running the fixes, test manually in SQL:

```sql
-- Replace YOUR_USER_ID with your actual user ID
-- Test updating profiles
UPDATE profiles 
SET is_online = true, last_seen_at = NOW()
WHERE id = 'YOUR_USER_ID';

-- Check if it worked
SELECT id, is_online, last_seen_at 
FROM profiles 
WHERE id = 'YOUR_USER_ID';

-- Test updating barbers
UPDATE barbers 
SET is_available = true
WHERE user_id = 'YOUR_USER_ID';

-- Check if it worked
SELECT id, user_id, is_available 
FROM barbers 
WHERE user_id = 'YOUR_USER_ID';
```

## 📱 App Test

After fixing database:

1. **Toggle to Online** → Check console for errors
2. **Check database** → Verify `is_online = true` in profiles
3. **Check database** → Verify `is_available = true` in barbers (freelance only)
4. **Toggle to Offline** → Repeat checks

## 🐛 Common Issues & Fixes

### Issue 1: "new row violates row-level security policy"
**Cause**: RLS policy doesn't allow the update  
**Fix**: Run Step 5 above (Add RLS policies)

### Issue 2: Column doesn't exist
**Cause**: Migration wasn't run  
**Fix**: Run Step 3 above (Add missing columns)

### Issue 3: Update succeeds but doesn't show in database
**Cause**: Different user ID than expected  
**Fix**: Check `currentUser.id` matches database `id`

```sql
-- Find your user
SELECT id, email FROM auth.users WHERE email = 'your_email@example.com';

-- Check if profile exists
SELECT * FROM profiles WHERE id = 'YOUR_USER_ID_FROM_ABOVE';

-- Check if barber record exists
SELECT * FROM barbers WHERE user_id = 'YOUR_USER_ID_FROM_ABOVE';
```

### Issue 4: Toggle works but reverts immediately
**Cause**: `loadOnlineStatus()` is being called and overwriting  
**Fix**: This is by design - status loads from database on mount

## ✅ Success Checklist

- [ ] Columns exist in database
- [ ] RLS policies allow updates
- [ ] No errors in console when toggling
- [ ] Database values change when toggling
- [ ] Toast message appears ("You're online..." or "You're offline...")
- [ ] Status badge updates in header

## 🔧 Quick Fix (Run All)

If you want to just fix everything at once:

```sql
-- Add columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

ALTER TABLE barbers 
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON profiles(is_online);
CREATE INDEX IF NOT EXISTS idx_barbers_is_available ON barbers(is_available);

-- Drop existing policies if they exist (in case they're wrong)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own barber record" ON barbers;

-- Create correct policies
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own barber record"
ON barbers FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Verify everything
SELECT 
    'profiles' as table_name,
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('is_online', 'last_seen_at')
UNION ALL
SELECT 
    'barbers' as table_name,
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'barbers' 
AND column_name = 'is_available';
```

## 📊 Debug Output

Add this temporarily to see what's happening:

```typescript
// In dashboard.tsx, replace toggleOnlineStatus with:
const toggleOnlineStatus = useCallback(async () => {
  if (!currentUser?.id) {
    console.log('❌ No currentUser.id');
    return;
  }
  
  console.log('👤 Current User ID:', currentUser.id);
  console.log('📊 Current Status:', isOnline);
  console.log('🏪 Account Type:', accountType);
  
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  
  const newStatus = !isOnline;
  console.log('🔄 Toggling to:', newStatus);
  
  try {
    setIsOnline(newStatus);
    
    console.log('📝 Updating profiles table...');
    const { error: profileError, data: profileData } = await supabase
      .from('profiles')
      .update({ 
        is_online: newStatus,
        last_seen_at: new Date().toISOString()
      })
      .eq('id', currentUser.id)
      .select();  // Add .select() to see what was updated
    
    console.log('✅ Profile update result:', profileData);
    
    if (profileError) {
      console.error('❌ Profile error:', profileError);
      setIsOnline(!newStatus);
      setToast({ message: 'Failed to update status', type: 'error', visible: true });
      return;
    }
    
    if (accountType === 'freelance') {
      console.log('📝 Updating barbers table...');
      const { error: barberError, data: barberData } = await supabase
        .from('barbers')
        .update({ is_available: newStatus })
        .eq('user_id', currentUser.id)
        .select();  // Add .select() to see what was updated
      
      console.log('✅ Barber update result:', barberData);
      
      if (barberError) {
        console.error('❌ Barber error:', barberError);
      }
    }
    
    console.log('🎉 Toggle complete!');
    setToast({ 
      message: newStatus ? "You're online - customers can find you!" : "You're offline - hidden from search", 
      type: newStatus ? 'success' : 'error', 
      visible: true 
    });
  } catch (error) {
    console.error('💥 Exception:', error);
    setIsOnline(!newStatus);
    setToast({ message: 'Failed to update status', type: 'error', visible: true });
  }
}, [currentUser, isOnline, accountType]);
```

This will show you exactly where it's failing!
