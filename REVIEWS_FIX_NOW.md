# Fix Reviews Not Showing - Quick Action

## Problem
Your barber ID is found correctly, but the query returns 0 reviews even though reviews exist in the database.

**Most Likely Cause:** The INNER JOIN is failing because either:
1. RLS on `bookings` table is blocking the JOIN
2. The booking records don't exist (orphaned reviews)

## Quick Fix (Try This First)

Run `FIX_REVIEWS_RLS.sql` in Supabase SQL Editor. This will:
1. Add a policy to allow barbers to read their bookings
2. Ensure profiles are readable
3. Ensure reviews are readable
4. Test the query

**Expected Result:** The verification query at the end should return your reviews.

## If That Doesn't Work

Run `CHECK_SPECIFIC_BARBER_REVIEWS.sql` to diagnose:

### Scenario A: Step 4 shows "Booking missing"
**Problem:** Reviews are orphaned (no booking record exists)

**Fix:** Update the reviews service to use LEFT JOIN instead:

1. Edit `packages/shared/services/reviewsService.ts`
2. Find line ~99 where it says `bookings!inner (`
3. Change `!inner` to just regular join (remove the `!inner`)

```typescript
// BEFORE
bookings!inner (

// AFTER  
bookings (
```

This makes Supabase use LEFT JOIN instead of INNER JOIN.

### Scenario B: RLS policies are too restrictive

Run this to make policies more permissive (for testing):

```sql
-- Temporarily disable RLS on bookings to test
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- Test your reviews query in the app

-- If it works, the issue is RLS. Re-enable it:
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Then add the proper policy from FIX_REVIEWS_RLS.sql
```

## Summary of Actions

1. ✅ Run `FIX_REVIEWS_RLS.sql` 
2. ✅ Restart your Partner app
3. ✅ Check if reviews show up
4. ❌ If still not working, run `CHECK_SPECIFIC_BARBER_REVIEWS.sql`
5. 📊 Report back the results from Step 4

## What to Report Back

After running the scripts, send me:
1. Output from `FIX_REVIEWS_RLS.sql` verification query (does it return rows?)
2. Output from `CHECK_SPECIFIC_BARBER_REVIEWS.sql` Step 4 (booking status)
3. Any errors you see

This will tell us exactly what's blocking the reviews!
