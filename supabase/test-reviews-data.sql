-- ============================================================================
-- TEST REVIEWS DATA FOR PARTNER APP
-- ============================================================================
-- Run this in Supabase SQL Editor to create test reviews
-- This creates reviews for both freelance barbers and barbershops
-- ============================================================================

-- First, let's check if we have profiles (customers)
-- If not, create some test customers

-- Create test customer profiles (if they don't exist)
INSERT INTO profiles (id, full_name, phone_number, role, created_at)
VALUES 
  (gen_random_uuid(), 'Ahmad Zaki', '+60111111111', 'customer', NOW() - INTERVAL '30 days'),
  (gen_random_uuid(), 'Sarah Lee', '+60122222222', 'customer', NOW() - INTERVAL '25 days'),
  (gen_random_uuid(), 'Raj Kumar', '+60133333333', 'customer', NOW() - INTERVAL '20 days'),
  (gen_random_uuid(), 'Tan Wei Ming', '+60144444444', 'customer', NOW() - INTERVAL '15 days'),
  (gen_random_uuid(), 'Ali Hassan', '+60155555555', 'customer', NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- Now let's create some test bookings and reviews
-- Note: Replace the barber_id and customer_id with actual IDs from your database

-- ============================================================================
-- OPTION 1: Insert reviews for FREELANCE BARBER
-- ============================================================================
-- To use this, you need to:
-- 1. Get your barber's user_id from Supabase auth.users
-- 2. Get your barber's id from the barbers table
-- 3. Replace 'YOUR_BARBER_ID' and 'YOUR_CUSTOMER_ID' below

/*
-- Example for freelance barber:

-- Step 1: Create a test booking
INSERT INTO bookings (
  customer_id,
  barber_id,
  booking_number,
  status,
  services,
  scheduled_date,
  scheduled_time,
  scheduled_datetime,
  estimated_duration_minutes,
  service_type,
  subtotal,
  service_fee,
  travel_fee,
  discount_amount,
  total_price,
  payment_status,
  completed_at,
  created_at
) VALUES (
  (SELECT id FROM profiles WHERE role = 'customer' LIMIT 1), -- customer_id
  'YOUR_BARBER_ID', -- Replace with your actual barber ID
  'BK-' || LPAD(floor(random() * 10000)::text, 5, '0'),
  'completed',
  '[{"service_id": "svc1", "name": "Modern Fade Cut", "price": 35, "duration": 45}]'::jsonb,
  CURRENT_DATE - 5,
  '14:00',
  (CURRENT_DATE - 5) + INTERVAL '14 hours',
  45,
  'home_service',
  35.00,
  2.00,
  5.00,
  0.00,
  42.00,
  'paid',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '6 days'
);

-- Step 2: Create a review for that booking
INSERT INTO reviews (
  booking_id,
  customer_id,
  barber_id,
  rating,
  comment,
  is_visible,
  created_at
) VALUES (
  (SELECT id FROM bookings WHERE barber_id = 'YOUR_BARBER_ID' ORDER BY created_at DESC LIMIT 1),
  (SELECT customer_id FROM bookings WHERE barber_id = 'YOUR_BARBER_ID' ORDER BY created_at DESC LIMIT 1),
  'YOUR_BARBER_ID',
  5,
  'Excellent service! Very professional and skilled. My fade looks perfect. Highly recommended!',
  true,
  NOW() - INTERVAL '5 days'
);
*/

-- ============================================================================
-- OPTION 2: Insert reviews for BARBERSHOP
-- ============================================================================

/*
-- Example for barbershop:

-- Step 1: Create a test booking
INSERT INTO bookings (
  customer_id,
  barbershop_id,
  booking_number,
  status,
  services,
  scheduled_date,
  scheduled_time,
  scheduled_datetime,
  estimated_duration_minutes,
  service_type,
  subtotal,
  service_fee,
  travel_fee,
  discount_amount,
  total_price,
  payment_status,
  completed_at,
  created_at
) VALUES (
  (SELECT id FROM profiles WHERE role = 'customer' LIMIT 1),
  'YOUR_BARBERSHOP_ID', -- Replace with your actual barbershop ID
  'BK-' || LPAD(floor(random() * 10000)::text, 5, '0'),
  'completed',
  '[{"service_id": "svc2", "name": "Classic Haircut", "price": 30, "duration": 30}]'::jsonb,
  CURRENT_DATE - 3,
  '10:00',
  (CURRENT_DATE - 3) + INTERVAL '10 hours',
  30,
  'walk_in',
  30.00,
  2.00,
  0.00,
  0.00,
  32.00,
  'paid',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '4 days'
);

-- Step 2: Create a review for that booking
INSERT INTO reviews (
  booking_id,
  customer_id,
  barbershop_id,
  rating,
  comment,
  is_visible,
  created_at
) VALUES (
  (SELECT id FROM bookings WHERE barbershop_id = 'YOUR_BARBERSHOP_ID' ORDER BY created_at DESC LIMIT 1),
  (SELECT customer_id FROM bookings WHERE barbershop_id = 'YOUR_BARBERSHOP_ID' ORDER BY created_at DESC LIMIT 1),
  'YOUR_BARBERSHOP_ID',
  5,
  'Amazing experience! Very skilled and professional. Great atmosphere and friendly staff.',
  true,
  NOW() - INTERVAL '3 days'
);
*/

-- ============================================================================
-- QUICK TEST: Check if reviews table exists and what data is there
-- ============================================================================

SELECT 
  'Reviews Table Check' as check_type,
  COUNT(*) as total_reviews,
  COUNT(DISTINCT barber_id) as unique_barbers,
  COUNT(DISTINCT barbershop_id) as unique_barbershops,
  AVG(rating) as avg_rating
FROM reviews;

-- Show sample reviews
SELECT 
  r.id,
  r.rating,
  r.comment,
  r.barber_id,
  r.barbershop_id,
  r.response,
  r.created_at,
  p.full_name as customer_name,
  b.services as booking_services
FROM reviews r
LEFT JOIN profiles p ON r.customer_id = p.id
LEFT JOIN bookings b ON r.booking_id = b.id
ORDER BY r.created_at DESC
LIMIT 10;

-- ============================================================================
-- HELPER QUERIES: Get IDs you need
-- ============================================================================

-- Get your barber ID (if you're a freelance barber)
SELECT 
  'Your Barber Info' as info_type,
  b.id as barber_id,
  b.user_id,
  p.full_name,
  p.phone_number
FROM barbers b
JOIN profiles p ON b.user_id = p.id
WHERE p.role = 'partner'
LIMIT 5;

-- Get your barbershop ID (if you're a barbershop owner)
SELECT 
  'Your Barbershop Info' as info_type,
  bs.id as barbershop_id,
  bs.owner_id as user_id,
  bs.name as shop_name,
  p.full_name as owner_name
FROM barbershops bs
JOIN profiles p ON bs.owner_id = p.id
LIMIT 5;

-- Get customer IDs for testing
SELECT 
  'Available Customers' as info_type,
  id as customer_id,
  full_name,
  phone_number
FROM profiles
WHERE role = 'customer'
LIMIT 10;

-- ============================================================================
-- CLEANUP (if you need to remove test data)
-- ============================================================================

-- Uncomment to delete test reviews
-- DELETE FROM reviews WHERE comment LIKE '%test%' OR comment LIKE '%Test%';

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. Make sure you have profiles with role = 'customer'
-- 2. Make sure you have a barber or barbershop record for your user
-- 3. Replace YOUR_BARBER_ID or YOUR_BARBERSHOP_ID with actual IDs
-- 4. Run the SELECT queries first to get the IDs you need
-- 5. Then uncomment and run the INSERT queries
-- ============================================================================
