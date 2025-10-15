-- ========================================
-- REVIEWS DEBUGGING SCRIPT
-- ========================================
-- User ID: a8467a5b-b92c-471c-a932-c9619fbc4829

-- Step 1: Check if user has a barber record
SELECT 
    id as barber_id,
    user_id,
    created_at
FROM barbers 
WHERE user_id = 'a8467a5b-b92c-471c-a932-c9619fbc4829';

-- Step 2: Check if there are any reviews for this barber
-- (Replace the barber_id from Step 1 result)
SELECT 
    r.id as review_id,
    r.rating,
    r.comment,
    r.response,
    r.created_at,
    r.barber_id,
    r.booking_id,
    r.is_visible
FROM reviews r
WHERE r.barber_id IN (
    SELECT id FROM barbers WHERE user_id = 'a8467a5b-b92c-471c-a932-c9619fbc4829'
);

-- Step 3: Check all reviews in the system (to see if any exist)
SELECT 
    COUNT(*) as total_reviews,
    COUNT(CASE WHEN barber_id IS NOT NULL THEN 1 END) as barber_reviews,
    COUNT(CASE WHEN barbershop_id IS NOT NULL THEN 1 END) as barbershop_reviews,
    COUNT(CASE WHEN is_visible = true THEN 1 END) as visible_reviews
FROM reviews;

-- Step 4: Check sample reviews with booking info
SELECT 
    r.id,
    r.rating,
    r.comment,
    r.barber_id,
    r.booking_id,
    r.is_visible,
    r.created_at,
    b.id as booking_exists,
    b.customer_id,
    b.services
FROM reviews r
LEFT JOIN bookings b ON r.booking_id = b.id
LIMIT 10;

-- Step 5: Check RLS policies on reviews table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'reviews'
ORDER BY cmd, policyname;

-- Step 6: Check if RLS is enabled on reviews table
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'reviews'
    AND schemaname = 'public';

-- Step 7: Try to query reviews as authenticated user (simulated)
-- This shows what the app would see
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
    r.is_visible
FROM reviews r
WHERE r.is_visible = true
    AND r.barber_id IN (
        SELECT id FROM barbers WHERE user_id = 'a8467a5b-b92c-471c-a932-c9619fbc4829'
    )
ORDER BY r.created_at DESC;

-- Step 8: Check if bookings table has data
SELECT 
    COUNT(*) as total_bookings,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings
FROM bookings
WHERE barber_id IN (
    SELECT id FROM barbers WHERE user_id = 'a8467a5b-b92c-471c-a932-c9619fbc4829'
);

-- Step 9: Check if there are completed bookings without reviews
SELECT 
    b.id as booking_id,
    b.status,
    b.created_at,
    b.customer_id,
    EXISTS (SELECT 1 FROM reviews WHERE booking_id = b.id) as has_review
FROM bookings b
WHERE b.barber_id IN (
    SELECT id FROM barbers WHERE user_id = 'a8467a5b-b92c-471c-a932-c9619fbc4829'
)
    AND b.status = 'completed'
ORDER BY b.created_at DESC
LIMIT 10;

-- ========================================
-- DIAGNOSIS SUMMARY
-- ========================================
-- If Step 2 returns 0 rows → No reviews exist for this barber
-- If Step 3 shows reviews exist but Step 2 doesn't → RLS is blocking access
-- If Step 5 shows complex policies → Might be RLS issue
-- If Step 9 shows completed bookings without reviews → Reviews haven't been created yet
