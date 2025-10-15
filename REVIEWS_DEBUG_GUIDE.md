# Reviews Not Showing - Debug Guide

## Quick Checks

### Step 1: Check Console Logs
Open your Partner app and go to the Reviews tab. Look for these logs:

```
[Reviews] Loading reviews for user: [user-id] Type: freelance
📋 Fetching reviews for user: [user-id] Type: freelance
🔍 Found barber_id: [barber-id]
```

**What to look for:**
- ✅ If you see `✅ Found X reviews for freelance` → Reviews exist, continue to Step 2
- ❌ If you see `ℹ️ No reviews found for freelance` → No reviews exist yet (see Solution A)
- ❌ If you see `❌ Error fetching barber:` → Barber record not found (see Solution B)
- ❌ If you see `❌ Error fetching reviews:` → Database/RLS issue (see Solution C)

### Step 2: Run SQL Diagnostic
Run `DEBUG_REVIEWS_ISSUE.sql` in your Supabase SQL Editor to check:
1. Does your barber record exist?
2. Do any reviews exist in the system?
3. Are reviews visible (is_visible = true)?
4. Is RLS blocking access?

## Common Issues & Solutions

### Solution A: No Reviews Exist Yet

**Problem:** You haven't received any reviews yet.

**Quick Test:** Create a test review manually:
```sql
-- Get your barber_id first
SELECT id FROM barbers WHERE user_id = 'a8467a5b-b92c-471c-a932-c9619fbc4829';

-- Create a test completed booking (if you don't have one)
INSERT INTO bookings (
    id,
    customer_id,
    barber_id,
    status,
    services,
    booking_date,
    booking_time,
    total_price,
    created_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE role = 'customer' LIMIT 1), -- Use any customer
    '[YOUR-BARBER-ID]', -- Replace with your barber_id from above
    'completed',
    '[{"name": "Haircut", "price": 50000}]'::jsonb,
    NOW(),
    '10:00',
    50000,
    NOW()
) RETURNING id;

-- Create a test review using the booking_id from above
INSERT INTO reviews (
    id,
    booking_id,
    barber_id,
    rating,
    comment,
    is_visible,
    created_at
) VALUES (
    gen_random_uuid(),
    '[BOOKING-ID-FROM-ABOVE]', -- Replace with booking id
    '[YOUR-BARBER-ID]', -- Replace with your barber_id
    5,
    'Great service! Very professional.',
    true,
    NOW()
);
```

After creating this test review, refresh your Reviews tab.

### Solution B: Barber Record Not Found

**Problem:** Your user account doesn't have a barber record.

**Check:**
```sql
SELECT id, user_id FROM barbers WHERE user_id = 'a8467a5b-b92c-471c-a932-c9619fbc4829';
```

**If empty:** You need to complete barber onboarding first.

### Solution C: RLS is Blocking Reviews

**Problem:** RLS policies are preventing you from seeing reviews.

**Check RLS Policies:**
```sql
SELECT 
    policyname,
    cmd,
    qual as using_clause
FROM pg_policies 
WHERE tablename = 'reviews';
```

**Expected Policies:**
- `reviews_select_all` - Anyone can view visible reviews
- `reviews_insert_customer` - Customers can create reviews
- `reviews_update_barber` - Barbers can respond to reviews

**Fix: Create Missing Policies**
```sql
-- Drop all existing policies on reviews
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'reviews' LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON reviews';
    END LOOP;
END $$;

-- Create proper SELECT policy (allow reading visible reviews)
CREATE POLICY "reviews_select_visible" ON reviews
    FOR SELECT
    TO authenticated
    USING (is_visible = true);

-- Allow public read of visible reviews (for unauthenticated users too)
CREATE POLICY "reviews_select_public" ON reviews
    FOR SELECT
    TO anon
    USING (is_visible = true);

-- Allow customers to insert reviews
CREATE POLICY "reviews_insert_customer" ON reviews
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM bookings 
            WHERE bookings.id = reviews.booking_id 
            AND bookings.customer_id = auth.uid()
        )
    );

-- Allow barbers to update their review responses
CREATE POLICY "reviews_update_response" ON reviews
    FOR UPDATE
    TO authenticated
    USING (
        barber_id IN (SELECT id FROM barbers WHERE user_id = auth.uid())
        OR barbershop_id IN (SELECT id FROM barbershops WHERE owner_id = auth.uid())
    )
    WITH CHECK (
        barber_id IN (SELECT id FROM barbers WHERE user_id = auth.uid())
        OR barbershop_id IN (SELECT id FROM barbershops WHERE owner_id = auth.uid())
    );

-- Verify policies
SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename = 'reviews';
```

### Solution D: Query Issue (JOIN failing)

**Problem:** The query joins reviews → bookings → profiles, but the JOIN is failing.

**Test the query manually:**
```sql
-- This is what the app runs
SELECT 
    r.id,
    r.rating,
    r.comment,
    r.response,
    r.response_at,
    r.created_at,
    r.booking_id,
    r.barber_id,
    r.barbershop_id,
    b.id as booking_id_check,
    b.services,
    b.customer_id,
    p.full_name,
    p.avatar_url
FROM reviews r
INNER JOIN bookings b ON r.booking_id = b.id
INNER JOIN profiles p ON b.customer_id = p.id
WHERE r.is_visible = true
    AND r.barber_id IN (
        SELECT id FROM barbers WHERE user_id = 'a8467a5b-b92c-471c-a932-c9619fbc4829'
    )
ORDER BY r.created_at DESC;
```

**If this returns 0 rows but Step 2 shows reviews exist:**
- The booking might not exist (orphaned review)
- The customer profile might not exist
- RLS on bookings/profiles tables is blocking the JOIN

**Check bookings RLS:**
```sql
-- Bookings should be readable by the barber
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'bookings' AND cmd = 'SELECT';
```

**If missing, add:**
```sql
CREATE POLICY "bookings_select_by_barber" ON bookings
    FOR SELECT
    TO authenticated
    USING (
        barber_id IN (SELECT id FROM barbers WHERE user_id = auth.uid())
        OR barbershop_id IN (SELECT id FROM barbershops WHERE owner_id = auth.uid())
    );
```

## Testing Steps

1. **Run the diagnostic SQL** (`DEBUG_REVIEWS_ISSUE.sql`)
2. **Check the console logs** in your Partner app
3. **Based on console output:**
   - "No reviews found" → Use Solution A (create test review)
   - "Error fetching barber" → Use Solution B (check barber record)
   - "Error fetching reviews" → Use Solution C (fix RLS)
   - Reviews exist but query returns 0 → Use Solution D (fix JOIN)

## Quick Test Review Creation

Once you've verified RLS is correct, create a quick test review:

```sql
-- All-in-one script
WITH barber AS (
    SELECT id FROM barbers WHERE user_id = 'a8467a5b-b92c-471c-a932-c9619fbc4829'
),
customer AS (
    SELECT id FROM profiles WHERE role = 'customer' LIMIT 1
),
new_booking AS (
    INSERT INTO bookings (
        customer_id,
        barber_id,
        status,
        services,
        booking_date,
        booking_time,
        total_price
    )
    SELECT 
        customer.id,
        barber.id,
        'completed',
        '[{"name": "Haircut", "price": 50000}]'::jsonb,
        NOW(),
        '10:00',
        50000
    FROM customer, barber
    RETURNING id, barber_id
)
INSERT INTO reviews (
    booking_id,
    barber_id,
    rating,
    comment,
    is_visible
)
SELECT 
    id,
    barber_id,
    5,
    'Excellent service! Very professional and skilled.',
    true
FROM new_booking
RETURNING *;
```

## After Fix

Once working, **remove the debug console.logs** from:
- `apps/partner/app/(tabs)/reviews.tsx`
- `packages/shared/services/reviewsService.ts`

Keep only essential error logging.
