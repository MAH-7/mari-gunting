# Audit: Server-Side vs Client-Side Time Usage

## 🔍 How to Check in Supabase

### 1. Check All Database Functions (Server-Side)

```sql
-- List all functions that use NOW() (server time)
SELECT 
    n.nspname as schema,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND pg_get_functiondef(p.oid) LIKE '%NOW()%'
ORDER BY p.proname;
```

### 2. Check Your Specific Functions

```sql
-- Check which functions use server-side time
SELECT 
    proname as function_name,
    CASE 
        WHEN pg_get_functiondef(oid) LIKE '%NOW()%' THEN '✅ Server-Side (NOW())'
        WHEN pg_get_functiondef(oid) LIKE '%CURRENT_TIMESTAMP%' THEN '✅ Server-Side (CURRENT_TIMESTAMP)'
        ELSE '❌ Might use client time'
    END as time_source
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname IN (
    'toggle_online_status',
    'check_radius_cooldown', 
    'update_service_radius'
)
ORDER BY proname;
```

### 3. View Function Definitions

```sql
-- See exact code of your functions
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as full_definition
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname IN (
    'toggle_online_status',
    'check_radius_cooldown',
    'update_service_radius'
)
ORDER BY proname;
```

## 📊 Current Implementation Status

### ✅ Server-Side Time (Secure)

These use `NOW()` function which executes on the database server:

| Feature | Function | Timestamp Field | Uses Server Time |
|---------|----------|----------------|------------------|
| **Service Radius Cooldown Check** | `check_radius_cooldown()` | `last_radius_change_at` | ✅ YES - `NOW()` |
| **Service Radius Update** | `update_service_radius()` | `last_radius_change_at` | ✅ YES - `NOW()` |
| **Online Status Toggle** | `toggle_online_status()` | `last_seen_at` | ✅ YES - `NOW()` |

### ❌ Client-Side Time (Vulnerable to Manipulation)

These use `new Date().toISOString()` from the client:

| Feature | Location | Field | Vulnerable |
|---------|----------|-------|-----------|
| **Avatar Upload** | `profileService.updateAvatar()` | `updated_at` | ⚠️ YES |
| **Profile Updates** | Direct Supabase calls | `updated_at` | ⚠️ YES |
| **Booking Creation** | _(if exists)_ | `created_at` | ⚠️ Maybe |

## 🧪 Test Server vs Client Time

### Test 1: Verify Server Time is Used

```sql
-- Test toggle_online_status
SELECT * FROM toggle_online_status(
    'YOUR_USER_ID'::uuid, 
    true, 
    'freelance'
);

-- Check the timestamp - it should match server time
SELECT NOW() as server_time_now;
```

### Test 2: Compare Client vs Server Time

1. **Change your device clock** to +1 day in the future
2. **Toggle online/offline** in the app
3. **Run this query**:

```sql
SELECT 
    id,
    is_online,
    last_seen_at,
    NOW() as current_server_time,
    EXTRACT(EPOCH FROM (NOW() - last_seen_at)) / 3600 as hours_difference
FROM profiles
WHERE id = 'YOUR_USER_ID';
```

**Expected Result**: 
- `hours_difference` should be near **0** (not 24 hours)
- This proves server time is used, not device time ✅

### Test 3: Check Service Radius Cooldown

1. **Change device clock** to +1 day
2. **Try to change service radius**
3. **Run this**:

```sql
SELECT * FROM check_radius_cooldown('YOUR_BARBER_ID'::uuid);
```

**Expected Result**:
- `can_change` should be based on **server time**, not device time ✅

## 🔧 How to Fix Client-Side Time Issues

If you find any operations using client-side time, convert them to RPC functions:

### Example: Convert Avatar Upload to Server-Side

**Before (Client-Side):**
```typescript
await supabase
  .from('profiles')
  .update({ 
    avatar_url: url,
    updated_at: new Date().toISOString()  // ❌ Client time!
  })
  .eq('id', userId);
```

**After (Server-Side):**
```sql
-- Create function
CREATE OR REPLACE FUNCTION update_avatar(
  p_user_id UUID,
  p_avatar_url TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET 
    avatar_url = p_avatar_url,
    updated_at = NOW()  -- ✅ Server time!
  WHERE id = p_user_id
  AND auth.uid() = p_user_id;
  
  RETURN FOUND;
END;
$$;
```

```typescript
// Call from app
await supabase.rpc('update_avatar', {
  p_user_id: userId,
  p_avatar_url: url
});
```

## 📋 Audit Checklist

Run this comprehensive check:

```sql
-- Complete audit of time-related functions
WITH function_audit AS (
  SELECT 
    proname as function_name,
    CASE 
      WHEN pg_get_functiondef(oid) LIKE '%NOW()%' THEN 'Server'
      WHEN pg_get_functiondef(oid) LIKE '%CURRENT_TIMESTAMP%' THEN 'Server'
      ELSE 'Unknown'
    END as time_source,
    CASE 
      WHEN prosecdef THEN 'SECURITY DEFINER (Elevated)'
      ELSE 'SECURITY INVOKER (Normal)'
    END as security_level
  FROM pg_proc
  WHERE pronamespace = 'public'::regnamespace
)
SELECT * FROM function_audit
WHERE time_source = 'Server'
ORDER BY function_name;
```

## 🎯 Summary

### Current Status:

✅ **Secure (Server-Side)**:
- Service radius cooldown check
- Service radius updates
- Online/offline status toggle
- Last seen timestamp

⚠️ **May Need Review**:
- Profile updates (check if any use client timestamps)
- Avatar uploads
- Any booking creation timestamps
- Review/rating timestamps

### Best Practice:

> **Rule**: Any timestamp that affects business logic or security (cooldowns, rates, limits) MUST use server-side `NOW()` function.

### Quick Check Command:

```sql
-- Run this to see all your server-time functions
SELECT proname, prosrc 
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace 
AND prosrc LIKE '%NOW()%';
```
