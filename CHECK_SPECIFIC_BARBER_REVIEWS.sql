-- ========================================
-- SPECIFIC BARBER REVIEWS CHECK
-- ========================================
-- Barber ID: 3f2ec946-120e-4cc2-8b0e-0762397acfbb
-- User ID: a8467a5b-b92c-471c-a932-c9619fbc4829

-- Step 1: Check if reviews exist for this barber (simple query)
SELECT 
    id,
    barber_id,
    booking_id,
    rating,
    comment,
    is_visible,
    created_at
FROM reviews
WHERE barber_id = '3f2ec946-120e-4cc2-8b0e-0762397acfbb';

-- Step 2: Check with JOIN to see if it fails
SELECT 
    r.id,
    r.rating,
    r.comment,
    r.response,
    r.response_at,
    r.created_at,
    r.booking_id,
    r.barber_id,
    r.is_visible,
    b.id as booking_exists,
    b.customer_id,
    b.services
FROM reviews r
LEFT JOIN bookings b ON r.booking_id = b.id
WHERE r.barber_id = '3f2ec946-120e-4cc2-8b0e-0762397acfbb';

-- Step 3: Check with full JOIN (what the app does)
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
    AND r.barber_id = '3f2ec946-120e-4cc2-8b0e-0762397acfbb'
ORDER BY r.created_at DESC;

-- Step 4: Check if the issue is INNER JOIN (bookings missing)
SELECT 
    r.id as review_id,
    r.booking_id,
    r.barber_id,
    r.is_visible,
    CASE 
        WHEN b.id IS NULL THEN '❌ Booking missing!'
        ELSE '✅ Booking exists'
    END as booking_status,
    CASE 
        WHEN b.id IS NOT NULL AND p.id IS NULL THEN '❌ Profile missing!'
        WHEN b.id IS NOT NULL AND p.id IS NOT NULL THEN '✅ Profile exists'
        ELSE 'N/A'
    END as profile_status
FROM reviews r
LEFT JOIN bookings b ON r.booking_id = b.id
LEFT JOIN profiles p ON b.customer_id = p.id
WHERE r.barber_id = '3f2ec946-120e-4cc2-8b0e-0762397acfbb';

-- Step 5: Check RLS on reviews
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'reviews' AND schemaname = 'public';

-- Step 6: Check RLS policies on reviews
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual as using_clause
FROM pg_policies 
WHERE tablename = 'reviews'
ORDER BY cmd;

-- Step 7: Check RLS on bookings (might block the JOIN)
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'bookings' AND cmd = 'SELECT';

-- ========================================
-- INTERPRETATION
-- ========================================
-- If Step 1 returns rows → Reviews exist
-- If Step 2 returns fewer rows than Step 1 → Booking records missing (orphaned reviews)
-- If Step 3 returns 0 rows but Step 2 has rows → INNER JOIN failing (bookings or profiles missing)
-- If Step 4 shows "Booking missing" → Reviews are orphaned (no booking record)
-- If Step 4 shows "Profile missing" → Customer profile is missing
-- If Step 6 shows restrictive policies → RLS might be blocking
-- If Step 7 shows no SELECT policy → RLS on bookings is blocking the JOIN
