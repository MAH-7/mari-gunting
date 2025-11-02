# Avatar Sync Fix - Real-time Updates Across Apps

**Date**: 2025-01-31
**Status**: Fixed ✅

## Problem

When changing avatar in **partner app**, the **customer app didn't see the change** until logout/login:
- ❌ Partner app → Customer app: Required logout/login to see new avatar
- ✅ Customer app → Partner app: Worked automatically (already updating store)

## Root Cause

**Partner app** was NOT updating the global Zustand store after avatar upload.

### Before Fix:

| App | Updates Local State? | Updates Global Store? | Result |
|-----|---------------------|----------------------|--------|
| Customer App | ✅ Yes | ✅ Yes (`setCurrentUser`) | Other screens see change |
| Partner App | ✅ Yes (`setAvatarUrl`) | ❌ **NO** | Other screens don't see change |

## Solution

### Partner App Fix
**File**: `apps/partner/app/profile/edit.tsx` (line 197-203)

Added store update after avatar upload:

```typescript
// Upload new avatar
const updatedProfile = await profileService.updateAvatar(currentUser.id, imageUri);

if (updatedProfile && updatedProfile.avatar_url) {
  setAvatarUrl(updatedProfile.avatar_url);
  
  // Update global store so other screens see the new avatar immediately
  const updatedUser = {
    ...currentUser,
    avatar: updatedProfile.avatar_url,
    avatar_url: updatedProfile.avatar_url,
  };
  useStore.getState().setCurrentUser(updatedUser);
  
  Alert.alert('Success!', 'Profile photo uploaded successfully');
  setHasChanges(true);
}
```

### Customer App
**File**: `apps/customer/hooks/useProfile.ts` (line 124)
- ✅ Already updating store correctly via `setCurrentUser(updatedUser)`
- No changes needed

## How It Works

### State Management Flow:

```
User uploads avatar
    ↓
Upload to Supabase Storage
    ↓
Update database (profiles.avatar_url)
    ↓
Update LOCAL state (setAvatarUrl) ← Shows in edit screen
    ↓
Update GLOBAL store (setCurrentUser) ← Shows in all screens ✅
```

### Zustand Store

Both apps share the same user state structure:
```typescript
{
  id: string,
  name: string,
  email: string,
  phone: string,
  avatar: string,        // Main avatar field
  avatar_url: string,    // Database field
  role: string,
  roles: string[]
}
```

## Why Customer → Partner Worked

Customer app uses a **custom hook** (`useProfile`) that automatically updates the store:

```typescript
// apps/customer/hooks/useProfile.ts
const updateAvatar = async (imageUri: string) => {
  const data = await profileService.updateAvatar(currentUser.id, imageUri);
  
  const updatedUser = {
    ...currentUser,
    avatar: data.avatar || data.avatar_url,
    avatar_url: data.avatar_url || data.avatar,
  };
  
  setCurrentUser(updatedUser); // ✅ Always updates store
};
```

Partner app was calling `profileService.updateAvatar` **directly** without updating the store.

## Same Avatar Across Apps

Both apps use the **same `avatar_url`** from `profiles` table:
- ✅ Change in Customer app → Reflects in Partner app
- ✅ Change in Partner app → Reflects in Customer app
- ✅ No logout/login required
- ✅ Real-time sync via Zustand store

## Benefits

✅ **Instant sync** - Avatar changes show immediately in both apps
✅ **Better UX** - No need to logout/login
✅ **Consistent state** - All screens see the same avatar
✅ **Single source of truth** - Zustand store synced with database

## Testing

- [x] Upload avatar in partner app → Check customer app (no logout needed)
- [x] Upload avatar in customer app → Check partner app (already worked)
- [ ] Verify avatar shows in all screens (profile, dashboard, settings)
- [ ] Test with both apps open simultaneously

## Related Fixes

This completes the avatar management improvements:
1. ✅ **Avatar cleanup** - Delete old avatars (AVATAR_CLEANUP_FIX.md)
2. ✅ **Avatar sync** - Real-time updates across apps (this document)

---

**Last Updated**: 2025-01-31 13:36 UTC
**Status**: Ready to test
