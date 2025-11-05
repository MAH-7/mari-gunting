# Evidence Photos Implementation - Grab Standard

## Overview
Implement before/after photo capture for job completion evidence and quality verification.

## Database Changes

### Migration Created
`supabase/migrations/20250204_add_evidence_photos_to_bookings.sql`
```sql
ALTER TABLE bookings 
ADD COLUMN evidence_photos JSONB DEFAULT '{"before": [], "after": []}'::jsonb;
```

**Run migration:**
```bash
npx supabase db push
```

## Storage Setup

### Bucket
- **Name**: `barber-portfolios` (already exists, public)
- **Folder structure**: `evidence/{booking_id}/before-{timestamp}.jpg` and `after-{timestamp}.jpg`

### Upload Function Added
`packages/shared/services/storage.ts`:
```typescript
export const uploadEvidencePhoto = async (
  bookingId: string,
  fileUri: string,
  type: 'before' | 'after'
): Promise<UploadResult>
```

## Implementation Steps

### 1. Add TypeScript Type
Update `apps/partner/types/index.ts`:
```typescript
export interface Booking {
  // ... existing fields
  evidence_photos?: {
    before: string[];  // Array of photo URLs
    after: string[];   // Array of photo URLs
  };
}
```

### 2. Before Photos - At "Start Service"
**File**: `apps/partner/app/(tabs)/jobs.tsx`

**Flow**:
1. User presses "Start Service" button
2. Show Alert: "Take Before Photo? (Optional)"
3. If "Yes" → Show photo options (Camera/Library)
4. Upload to Supabase using `uploadEvidencePhoto(job.id, uri, 'before')`
5. Update booking's `evidence_photos.before` array
6. Proceed with status change to 'in_progress'

**Code location**: `handleStartJob` function (around line 406)

### 3. After Photos - At "Complete Job"
**File**: `apps/partner/app/(tabs)/jobs.tsx`

**Current flow**:
1. Press "Complete Job" → Opens completion modal
2. User fills checklist + adds photos to local state
3. Press "Complete & Submit" → Uploads photos + completes job

**Update**: When "Complete & Submit" is pressed:
1. Upload all `afterPhotos` using `uploadEvidencePhoto`
2. Update booking's `evidence_photos.after` array
3. Then complete the job

**Code location**: `finalizeJobCompletion` function (around line 483)

### 4. Backend Function Update
**File**: `packages/shared/services/bookingService.ts`

Add function to update evidence photos:
```typescript
export const updateEvidencePhotos = async (
  bookingId: string,
  photos: { before?: string[]; after?: string[] }
) => {
  const { data, error } = await supabase
    .from('bookings')
    .update({ evidence_photos: photos })
    .eq('id', bookingId)
    .single();
    
  if (error) throw error;
  return data;
};
```

## UI Updates

### Before Photos Section (Keep but rename)
**Change**: "Before Photos (Optional)" → "Before Photos (Taken at service start)"
- Show photos if `booking.evidence_photos?.before` exists
- Make read-only (already uploaded)
- Remove add/remove buttons

### After Photos Section (Keep)
- Current implementation is fine
- Just upload to Supabase when completing

## User Flow

### Happy Path
1. **Barber accepts job** → Status: 'accepted'
2. **Barber on the way** → Status: 'on_the_way'
3. **Barber arrives** → Status: 'arrived'
4. **Barber presses "Start Service"**:
   - Alert: "Take before photo?" → Optional
   - If yes: Take photo → Upload → Show success
   - Status changes to 'in_progress'
5. **Service happens** (cutting hair, etc.)
6. **Barber presses "Complete Job"**:
   - Opens completion modal
   - Shows before photos (if taken)
   - Barber adds after photos
   - Fills checklist
   - Presses "Complete & Submit"
   - After photos upload → Evidence stored → Job completed

### Skip Photos Path
1-4. Same as above, but skip before photo (press "Skip")
5-6. Same, but skip after photos (checklist will remind but not enforce)

## Benefits
- ✅ Evidence for disputes (both parties protected)
- ✅ Quality verification (platform can review)
- ✅ Professional portfolio building
- ✅ Customer confidence (see before/after)
- ✅ Insurance claims support

## Next Steps
1. Run database migration
2. Add evidence_photos to Booking type
3. Implement handleStartJob photo capture
4. Update finalizeJobCompletion to upload after photos
5. Test complete flow
6. Deploy to production

## Files Modified
- `supabase/migrations/20250204_add_evidence_photos_to_bookings.sql` (created)
- `packages/shared/services/storage.ts` (added uploadEvidencePhoto)
- `apps/partner/types/index.ts` (add evidence_photos field)
- `apps/partner/app/(tabs)/jobs.tsx` (implement photo capture flow)
- `packages/shared/services/bookingService.ts` (add updateEvidencePhotos function)
