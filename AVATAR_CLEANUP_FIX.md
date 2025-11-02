# Avatar Cleanup Fix - Prevent Storage Waste

**Date**: 2025-01-31
**Status**: Fixed ✅

## Problem

When users changed their profile avatar, **old avatar files were NOT deleted** from Supabase Storage, causing:
- ❌ Wasted storage space
- ❌ Accumulation of orphaned files
- ❌ Increased storage costs over time

## Investigation Results

| App | Before Fix | After Fix |
|-----|------------|-----------|
| **Customer App** | ❌ Does NOT delete old avatar | ✅ Deletes old avatar |
| **Partner App** | ✅ Already deletes old avatar | ✅ Already correct |

## Solution

### Customer App Fix
**File**: `apps/customer/app/profile/edit.tsx`

Added cleanup logic before uploading new avatar:

```typescript
// Delete old avatar file from storage if exists
if (profileAvatar && profileAvatar.includes('supabase.co/storage')) {
  try {
    // Extract file path from URL
    // URL format: https://xxx.supabase.co/storage/v1/object/public/avatars/userId/avatar-123.jpg
    const urlParts = profileAvatar.split('/avatars/');
    if (urlParts.length > 1) {
      const filePath = urlParts[1]; // userId/avatar-123.jpg
      
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([filePath]);
      
      if (deleteError) {
        console.warn('Could not delete old avatar:', deleteError);
        // Don't fail the upload if deletion fails
      } else {
        console.log('✅ Old avatar deleted:', filePath);
      }
    }
  } catch (cleanupError) {
    console.warn('Avatar cleanup error:', cleanupError);
    // Continue with upload even if cleanup fails
  }
}

// Upload new avatar
await updateAvatar(avatarUri);
```

### Partner App
**File**: `apps/partner/app/profile/edit.tsx`
- ✅ Already had cleanup logic (lines 168-189)
- No changes needed

## How It Works

1. **Extract file path** from old avatar URL
2. **Delete old file** from Supabase Storage bucket `avatars`
3. **Upload new avatar** using existing `updateAvatar` function
4. **Graceful fallback** - If deletion fails, upload still proceeds

## Storage Buckets

Both apps use the same bucket:
- Bucket: `avatars`
- Path format: `{userId}/avatar-{timestamp}.jpg`
- Access: Public (read), RLS-protected (write)

## Benefits

✅ **Saves storage space** - No orphaned files
✅ **Reduces costs** - Less storage usage
✅ **Cleaner storage** - Only current avatars kept
✅ **Consistent behavior** - Both apps now work the same way

## Portfolio Images

Portfolio images (barber/barbershop portfolios) **already have delete logic**:
- ✅ `portfolioService.deleteBarberImage()` - lines 208-212
- ✅ `portfolioService.deleteBarbershopImage()` - lines 238-242

## Testing

- [ ] Upload avatar in customer app → Check old file deleted
- [ ] Upload avatar in partner app → Check old file deleted (already works)
- [ ] Verify upload still works if deletion fails
- [ ] Check Supabase Storage dashboard for orphaned files

## Cleanup Script (Optional)

If you have existing orphaned avatar files, run this SQL to find them:

```sql
-- Find users with avatars not matching current profile
SELECT 
    p.id,
    p.phone_number,
    p.avatar_url
FROM profiles p
WHERE p.avatar_url IS NOT NULL
AND p.avatar_url LIKE '%supabase.co/storage%';

-- Manually check Storage bucket for extra files
```

## Same Avatar for Both Apps

**Decision**: ✅ Both apps use the **same avatar** from `profiles.avatar_url`

**Reasoning**:
- Simpler UX - One identity across roles
- Follows Grab model - Same photo for rider/customer
- Less storage needed
- Already implemented this way

If you want professional photos for partners in the future:
- Add optional `barbers.professional_avatar_url`
- Fallback to main `avatar_url` if not set

---

**Last Updated**: 2025-01-31 13:30 UTC
**Status**: Ready to test
