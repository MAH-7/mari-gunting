# Evidence Photo Upload Fix 🔧

## Problem
When starting a service and taking a "before" photo in the partner app, the upload was failing with:
```
ERROR: Bucket not found [StorageApiError: Bucket not found]
```

## Root Cause
The `uploadEvidencePhoto()` function in `storage.ts` was trying to upload to a bucket named `'evidence-photos'`, but this bucket **does not exist** in Supabase.

According to the migration files and documentation, evidence photos should be stored in the **`barber-portfolios`** bucket under an `evidence/{bookingId}/` folder structure.

## Files Changed

### 1. `packages/shared/services/storage.ts`

**Changes:**
- Added `'evidence-photos'` to the `BucketName` type (for type safety)
- Updated `uploadEvidencePhoto()` function to use the correct bucket and folder structure

**Before:**
```typescript
return uploadFile({
  bucket: 'evidence-photos',  // ❌ This bucket doesn't exist
  folder: bookingId,
  fileName,
  fileUri,
  contentType: 'image/jpeg',
});
```

**After:**
```typescript
return uploadFile({
  bucket: 'barber-portfolios',  // ✅ Correct bucket
  folder: `evidence/${bookingId}`,  // ✅ Proper folder structure
  fileName,
  fileUri,
  contentType: 'image/jpeg',
});
```

## Storage Structure

Evidence photos will now be stored as:
```
barber-portfolios/
├── evidence/
│   ├── {bookingId}/
│   │   ├── before-{timestamp}.jpg
│   │   ├── after-{timestamp}.jpg
│   │   └── ...
```

## Verification Steps

### Step 1: Check if barber-portfolios bucket exists
Run the SQL script in Supabase SQL Editor:
```bash
cat scripts/verify-storage-bucket.sql
```

The script will:
1. Check if `barber-portfolios` bucket exists
2. Verify it's set to public
3. Provide commands to create/fix if needed

### Step 2: Test the upload flow

1. **Login to Partner App**
2. **Accept a job** and navigate through the flow:
   - Press "I'm on the way"
   - Press "I've Arrived"
   - Press "Start Service"
3. **Take Before Photo:**
   - Choose "Take Photo"
   - Select Camera or Library
   - Capture/select a photo
4. **Verify Success:**
   - Should see: "📸 Before photo saved! Timer started."
   - No error alerts should appear

### Step 3: Verify upload in Supabase

1. Go to **Supabase Dashboard** → **Storage** → **barber-portfolios**
2. Navigate to `evidence/{bookingId}/`
3. You should see `before-{timestamp}.jpg`
4. Click the file to verify it's the correct image

### Step 4: Check database

Run in Supabase SQL Editor:
```sql
SELECT id, status, evidence_photos 
FROM bookings 
WHERE id = '{your_booking_id}';
```

Expected result:
```json
{
  "before": ["https://...storage.supabase.co/.../barber-portfolios/evidence/{bookingId}/before-{timestamp}.jpg"],
  "after": []
}
```

## Bucket Requirements

The `barber-portfolios` bucket must:
- ✅ Exist in Supabase Storage
- ✅ Be set to **public** (so URLs work without signed URLs)
- ✅ Have proper RLS policies (optional for public buckets)

## Creating the Bucket (if missing)

If the bucket doesn't exist, create it via:

**Option 1: Supabase Dashboard**
1. Go to Storage → Create new bucket
2. Name: `barber-portfolios`
3. Public: ✅ Yes
4. Click Create

**Option 2: SQL**
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('barber-portfolios', 'barber-portfolios', true)
ON CONFLICT (id) DO UPDATE SET public = true;
```

## Testing Checklist

- [ ] Bucket `barber-portfolios` exists
- [ ] Bucket is set to public
- [ ] Start service → Take before photo works
- [ ] Photo uploads without errors
- [ ] Success message appears
- [ ] Photo visible in Supabase Storage under `evidence/{bookingId}/`
- [ ] Photo URL saved to database `evidence_photos.before`
- [ ] Complete job → Before photo displays correctly
- [ ] After photos upload to same folder structure

## Next Steps

1. ✅ Run `scripts/verify-storage-bucket.sql` to check bucket status
2. ✅ Test the photo upload flow end-to-end
3. ✅ Verify photos appear in Storage and Database
4. ✅ Test the complete job flow with after photos

## Additional Notes

- The fix maintains backward compatibility
- Existing code using `uploadEvidencePhoto()` doesn't need changes
- All evidence photos are now centralized in one bucket
- Folder structure keeps photos organized by booking ID
- Public bucket means no signed URL overhead

---

**Status**: ✅ Fix Applied - Ready for Testing
