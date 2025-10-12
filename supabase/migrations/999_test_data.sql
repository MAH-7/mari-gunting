-- =====================================================
-- MARI-GUNTING TEST DATA
-- =====================================================
-- This script populates the database with realistic test data
-- for development and testing purposes
-- 
-- IMPORTANT: Only run this in development/staging environments!
-- =====================================================

-- =====================================================
-- 1. TEST PROFILES (USERS)
-- =====================================================

-- Insert test customer profiles
-- Note: These should match actual auth.users created via Supabase Auth
-- For testing, create these users first or use existing test user IDs

-- Customer 1: Ahmad (Your test user)
INSERT INTO profiles (id, role, full_name, phone_number, phone_verified, avatar_url, city, state, country, is_active)
VALUES 
  ('00000000-0000-0000-0000-000000000001'::UUID, 'customer', 'Ahmad Fauzi', '+60123456789', TRUE, 'https://i.pravatar.cc/150?img=12', 'Kuala Lumpur', 'Wilayah Persekutuan', 'Malaysia', TRUE),
  ('00000000-0000-0000-0000-000000000002'::UUID, 'customer', 'Siti Nurhaliza', '+60124567890', TRUE, 'https://i.pravatar.cc/150?img=5', 'Petaling Jaya', 'Selangor', 'Malaysia', TRUE),
  ('00000000-0000-0000-0000-000000000003'::UUID, 'customer', 'Lee Wei Ming', '+60125678901', TRUE, 'https://i.pravatar.cc/150?img=33', 'Subang Jaya', 'Selangor', 'Malaysia', TRUE),
  ('00000000-0000-0000-0000-000000000004'::UUID, 'customer', 'Raj Kumar', '+60126789012', TRUE, 'https://i.pravatar.cc/150?img=15', 'Shah Alam', 'Selangor', 'Malaysia', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Barber profiles
INSERT INTO profiles (id, role, full_name, phone_number, phone_verified, avatar_url, city, state, country, is_active, is_online)
VALUES 
  ('10000000-0000-0000-0000-000000000001'::UUID, 'barber', 'Hairul Nizam', '+60127890123', TRUE, 'https://i.pravatar.cc/150?img=11', 'Kuala Lumpur', 'Wilayah Persekutuan', 'Malaysia', TRUE, TRUE),
  ('10000000-0000-0000-0000-000000000002'::UUID, 'barber', 'Jason Tan', '+60128901234', TRUE, 'https://i.pravatar.cc/150?img=52', 'Petaling Jaya', 'Selangor', 'Malaysia', TRUE, TRUE),
  ('10000000-0000-0000-0000-000000000003'::UUID, 'barber', 'Azlan Ibrahim', '+60129012345', TRUE, 'https://i.pravatar.cc/150?img=8', 'Subang Jaya', 'Selangor', 'Malaysia', TRUE, FALSE),
  ('10000000-0000-0000-0000-000000000004'::UUID, 'barber', 'David Wong', '+60120123456', TRUE, 'https://i.pravatar.cc/150?img=60', 'Kuala Lumpur', 'Wilayah Persekutuan', 'Malaysia', TRUE, TRUE),
  ('10000000-0000-0000-0000-000000000005'::UUID, 'barber', 'Faizal Hassan', '+60121234567', TRUE, 'https://i.pravatar.cc/150?img=13', 'Shah Alam', 'Selangor', 'Malaysia', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Barbershop owner profiles
INSERT INTO profiles (id, role, full_name, phone_number, phone_verified, avatar_url, city, state, country, is_active)
VALUES 
  ('20000000-0000-0000-0000-000000000001'::UUID, 'barbershop_owner', 'Tan Ah Kow', '+60122345678', TRUE, 'https://i.pravatar.cc/150?img=51', 'Kuala Lumpur', 'Wilayah Persekutuan', 'Malaysia', TRUE),
  ('20000000-0000-0000-0000-000000000002'::UUID, 'barbershop_owner', 'Mohd Razak', '+60123456780', TRUE, 'https://i.pravatar.cc/150?img=14', 'Petaling Jaya', 'Selangor', 'Malaysia', TRUE)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. BARBERS
-- =====================================================

INSERT INTO barbers (
  id, user_id, business_name, bio, experience_years, specializations,
  portfolio_images, verification_status, rating, total_reviews, total_bookings,
  completed_bookings, is_available, base_price, travel_fee_per_km,
  is_featured, is_verified
) VALUES 
  (
    'b0000000-0000-0000-0000-000000000001'::UUID,
    '10000000-0000-0000-0000-000000000001'::UUID,
    'Hairul Pro Cuts',
    'Professional barber with 8+ years experience. Specializing in modern fades and classic cuts. Mobile service available across KL.',
    8,
    ARRAY['fade', 'beard', 'styling', 'grooming'],
    ARRAY[
      'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400',
      'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400',
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400'
    ],
    'verified',
    4.8,
    127,
    203,
    189,
    TRUE,
    35.00,
    2.50,
    TRUE,
    TRUE
  ),
  (
    'b0000000-0000-0000-0000-000000000002'::UUID,
    '10000000-0000-0000-0000-000000000002'::UUID,
    'Jason The Barber',
    'Trendy cuts and premium grooming. Korean-style specialist. Walk-in and home service available.',
    5,
    ARRAY['korean_style', 'fade', 'coloring', 'perm'],
    ARRAY[
      'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400',
      'https://images.unsplash.com/photo-1620331309831-0f3b6c6dd9c8?w=400'
    ],
    'verified',
    4.9,
    94,
    156,
    148,
    TRUE,
    45.00,
    3.00,
    TRUE,
    TRUE
  ),
  (
    'b0000000-0000-0000-0000-000000000003'::UUID,
    '10000000-0000-0000-0000-000000000003'::UUID,
    'Azlan Cuts',
    'Experienced barber specializing in traditional and modern styles. Quality service at affordable prices.',
    6,
    ARRAY['classic', 'fade', 'beard'],
    ARRAY[
      'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400'
    ],
    'verified',
    4.6,
    68,
    112,
    98,
    TRUE,
    30.00,
    2.00,
    FALSE,
    TRUE
  ),
  (
    'b0000000-0000-0000-0000-000000000004'::UUID,
    '10000000-0000-0000-0000-000000000004'::UUID,
    'David Pro Grooming',
    'Premium mens grooming and styling. 10+ years in the industry. Corporate packages available.',
    10,
    ARRAY['executive_cut', 'styling', 'grooming', 'facial'],
    ARRAY[
      'https://images.unsplash.com/photo-1621607512214-68297480165e?w=400',
      'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400'
    ],
    'verified',
    4.9,
    156,
    245,
    234,
    TRUE,
    50.00,
    3.50,
    TRUE,
    TRUE
  ),
  (
    'b0000000-0000-0000-0000-000000000005'::UUID,
    '10000000-0000-0000-0000-000000000005'::UUID,
    'Faizal Mobile Barber',
    'Affordable mobile barbering service. Quick, clean cuts at your convenience.',
    4,
    ARRAY['fade', 'classic', 'kids_cut'],
    ARRAY[
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400'
    ],
    'pending',
    4.5,
    43,
    67,
    61,
    TRUE,
    25.00,
    2.00,
    FALSE,
    FALSE
  )
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. BARBERSHOPS
-- =====================================================

INSERT INTO barbershops (
  id, owner_id, name, description, logo_url,
  cover_images, phone_number, email,
  address_line1, city, state, postal_code, country,
  location,
  opening_hours, verification_status,
  rating, total_reviews, total_bookings,
  amenities, payment_methods,
  is_active, is_featured, is_verified
) VALUES 
  (
    's0000000-0000-0000-0000-000000000001'::UUID,
    '20000000-0000-0000-0000-000000000001'::UUID,
    'Classic Cuts Barbershop',
    'Traditional barbershop with modern twist. Serving KL for 15 years. Walk-ins welcome!',
    'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=300',
    ARRAY[
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600',
      'https://images.unsplash.com/photo-1621607512214-68297480165e?w=600',
      'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600'
    ],
    '+60321234567',
    'classiccuts@example.com',
    '123 Jalan Bukit Bintang',
    'Kuala Lumpur',
    'Wilayah Persekutuan',
    '55100',
    'Malaysia',
    ST_SetSRID(ST_MakePoint(101.7107, 3.1473), 4326)::GEOGRAPHY,
    '{"monday": "10:00-20:00", "tuesday": "10:00-20:00", "wednesday": "10:00-20:00", "thursday": "10:00-20:00", "friday": "10:00-22:00", "saturday": "09:00-22:00", "sunday": "09:00-18:00"}'::JSONB,
    'verified',
    4.7,
    234,
    1456,
    ARRAY['wifi', 'parking', 'air_conditioning', 'coffee', 'magazines'],
    ARRAY['cash', 'card', 'ewallet_tng', 'ewallet_grab'],
    TRUE,
    TRUE,
    TRUE
  ),
  (
    's0000000-0000-0000-0000-000000000002'::UUID,
    '20000000-0000-0000-0000-000000000002'::UUID,
    'Urban Grooming Studio',
    'Modern mens grooming studio in PJ. Premium services and products. Booking recommended.',
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300',
    ARRAY[
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600',
      'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600'
    ],
    '+60378901234',
    'urban@example.com',
    '45 Jalan PJS 11/9',
    'Petaling Jaya',
    'Selangor',
    '46150',
    'Malaysia',
    ST_SetSRID(ST_MakePoint(101.6424, 3.1073), 4326)::GEOGRAPHY,
    '{"monday": "11:00-21:00", "tuesday": "11:00-21:00", "wednesday": "11:00-21:00", "thursday": "11:00-21:00", "friday": "11:00-22:00", "saturday": "10:00-22:00", "sunday": "10:00-19:00"}'::JSONB,
    'verified',
    4.8,
    178,
    892,
    ARRAY['wifi', 'air_conditioning', 'premium_products', 'massage_chair'],
    ARRAY['cash', 'card', 'fpx', 'ewallet_tng', 'ewallet_grab', 'ewallet_boost'],
    TRUE,
    TRUE,
    TRUE
  )
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 4. SERVICES
-- =====================================================

-- Services for Barber 1 (Hairul)
INSERT INTO services (barber_id, name, description, category, price, duration_minutes, is_active, is_popular) VALUES 
  ('b0000000-0000-0000-0000-000000000001'::UUID, 'Basic Haircut', 'Classic haircut with wash', 'haircut', 25.00, 30, TRUE, TRUE),
  ('b0000000-0000-0000-0000-000000000001'::UUID, 'Fade Haircut', 'Modern fade with styling', 'haircut', 35.00, 45, TRUE, TRUE),
  ('b0000000-0000-0000-0000-000000000001'::UUID, 'Beard Trim', 'Professional beard trimming and shaping', 'beard', 15.00, 20, TRUE, FALSE),
  ('b0000000-0000-0000-0000-000000000001'::UUID, 'Hair + Beard Combo', 'Complete grooming package', 'grooming', 45.00, 60, TRUE, TRUE)
ON CONFLICT DO NOTHING;

-- Services for Barber 2 (Jason)
INSERT INTO services (barber_id, name, description, category, price, duration_minutes, is_active, is_popular) VALUES 
  ('b0000000-0000-0000-0000-000000000002'::UUID, 'Korean Style Cut', 'Trendy Korean-inspired haircut', 'haircut', 45.00, 60, TRUE, TRUE),
  ('b0000000-0000-0000-0000-000000000002'::UUID, 'Premium Fade', 'Precision fade with styling', 'haircut', 50.00, 60, TRUE, TRUE),
  ('b0000000-0000-0000-0000-000000000002'::UUID, 'Hair Coloring', 'Professional hair coloring service', 'coloring', 80.00, 120, TRUE, FALSE),
  ('b0000000-0000-0000-0000-000000000002'::UUID, 'Perm Treatment', 'Korean-style perm', 'styling', 150.00, 180, TRUE, FALSE)
ON CONFLICT DO NOTHING;

-- Services for Barber 3 (Azlan)
INSERT INTO services (barber_id, name, description, category, price, duration_minutes, is_active, is_popular) VALUES 
  ('b0000000-0000-0000-0000-000000000003'::UUID, 'Standard Cut', 'Quality haircut at affordable price', 'haircut', 20.00, 30, TRUE, TRUE),
  ('b0000000-0000-0000-0000-000000000003'::UUID, 'Fade Cut', 'Clean fade haircut', 'haircut', 30.00, 40, TRUE, TRUE),
  ('b0000000-0000-0000-0000-000000000003'::UUID, 'Beard Grooming', 'Beard trim and shape', 'beard', 12.00, 15, TRUE, FALSE)
ON CONFLICT DO NOTHING;

-- Services for Barber 4 (David)
INSERT INTO services (barber_id, name, description, category, price, duration_minutes, is_active, is_popular) VALUES 
  ('b0000000-0000-0000-0000-000000000004'::UUID, 'Executive Cut', 'Premium haircut for professionals', 'haircut', 50.00, 60, TRUE, TRUE),
  ('b0000000-0000-0000-0000-000000000004'::UUID, 'Complete Grooming', 'Hair, beard, facial treatment', 'grooming', 80.00, 90, TRUE, TRUE),
  ('b0000000-0000-0000-0000-000000000004'::UUID, 'Facial Treatment', 'Mens facial and skincare', 'grooming', 60.00, 45, TRUE, FALSE)
ON CONFLICT DO NOTHING;

-- Services for Barber 5 (Faizal)
INSERT INTO services (barber_id, name, description, category, price, duration_minutes, is_active, is_popular) VALUES 
  ('b0000000-0000-0000-0000-000000000005'::UUID, 'Quick Cut', 'Fast and clean haircut', 'haircut', 20.00, 25, TRUE, TRUE),
  ('b0000000-0000-0000-0000-000000000005'::UUID, 'Fade Haircut', 'Modern fade style', 'haircut', 25.00, 35, TRUE, TRUE),
  ('b0000000-0000-0000-0000-000000000005'::UUID, 'Kids Haircut', 'Haircut for children', 'haircut', 15.00, 20, TRUE, FALSE)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. CUSTOMER ADDRESSES
-- =====================================================

INSERT INTO customer_addresses (
  user_id, label, address_line1, address_line2, city, state, postal_code, 
  location, is_default
) VALUES 
  (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Home',
    '23, Jalan Ampang 3',
    'Taman Ampang Jaya',
    'Kuala Lumpur',
    'Wilayah Persekutuan',
    '55000',
    ST_SetSRID(ST_MakePoint(101.7573, 3.1624), 4326)::GEOGRAPHY,
    TRUE
  ),
  (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Office',
    'Level 15, Menara KL',
    'Jalan Sultan Ismail',
    'Kuala Lumpur',
    'Wilayah Persekutuan',
    '50250',
    ST_SetSRID(ST_MakePoint(101.7077, 3.1577), 4326)::GEOGRAPHY,
    FALSE
  ),
  (
    '00000000-0000-0000-0000-000000000002'::UUID,
    'Home',
    '89, Jalan SS2/24',
    '',
    'Petaling Jaya',
    'Selangor',
    '47300',
    ST_SetSRID(ST_MakePoint(101.6187, 3.1138), 4326)::GEOGRAPHY,
    TRUE
  ),
  (
    '00000000-0000-0000-0000-000000000003'::UUID,
    'Home',
    '12, Jalan USJ 1/1',
    'Taman Subang Jaya',
    'Subang Jaya',
    'Selangor',
    '47500',
    ST_SetSRID(ST_MakePoint(101.5831, 3.0437), 4326)::GEOGRAPHY,
    TRUE
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. BOOKINGS
-- =====================================================

-- Completed bookings (past)
INSERT INTO bookings (
  customer_id, barber_id, booking_number, status,
  services, scheduled_date, scheduled_time, scheduled_datetime,
  estimated_duration_minutes, service_type,
  customer_address,
  subtotal, service_fee, travel_fee, total_price,
  payment_method, payment_status,
  customer_notes, completed_at, created_at
) VALUES 
  (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'b0000000-0000-0000-0000-000000000001'::UUID,
    'MG20250101001',
    'completed',
    '[{"service_id": "1", "name": "Fade Haircut", "price": 35.00, "duration": 45}]'::JSONB,
    CURRENT_DATE - INTERVAL '7 days',
    '14:00:00',
    (CURRENT_DATE - INTERVAL '7 days' + TIME '14:00:00')::TIMESTAMPTZ,
    45,
    'home_service',
    '{"line1": "23, Jalan Ampang 3", "line2": "Taman Ampang Jaya", "city": "Kuala Lumpur", "state": "Wilayah Persekutuan", "postal_code": "55000"}'::JSONB,
    35.00,
    2.00,
    5.00,
    42.00,
    'cash',
    'completed',
    'Please bring your own tools',
    (CURRENT_DATE - INTERVAL '7 days' + TIME '14:45:00')::TIMESTAMPTZ,
    (CURRENT_DATE - INTERVAL '8 days')::TIMESTAMPTZ
  ),
  (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'b0000000-0000-0000-0000-000000000002'::UUID,
    'MG20250103002',
    'completed',
    '[{"service_id": "2", "name": "Korean Style Cut", "price": 45.00, "duration": 60}]'::JSONB,
    CURRENT_DATE - INTERVAL '14 days',
    '16:30:00',
    (CURRENT_DATE - INTERVAL '14 days' + TIME '16:30:00')::TIMESTAMPTZ,
    60,
    'home_service',
    '{"line1": "23, Jalan Ampang 3", "line2": "Taman Ampang Jaya", "city": "Kuala Lumpur", "state": "Wilayah Persekutuan", "postal_code": "55000"}'::JSONB,
    45.00,
    2.00,
    5.00,
    52.00,
    'ewallet_tng',
    'completed',
    'Looking for Korean perm style',
    (CURRENT_DATE - INTERVAL '14 days' + TIME '17:30:00')::TIMESTAMPTZ,
    (CURRENT_DATE - INTERVAL '15 days')::TIMESTAMPTZ
  ),
  (
    '00000000-0000-0000-0000-000000000002'::UUID,
    'b0000000-0000-0000-0000-000000000004'::UUID,
    'MG20250105003',
    'completed',
    '[{"service_id": "3", "name": "Executive Cut", "price": 50.00, "duration": 60}]'::JSONB,
    CURRENT_DATE - INTERVAL '5 days',
    '10:00:00',
    (CURRENT_DATE - INTERVAL '5 days' + TIME '10:00:00')::TIMESTAMPTZ,
    60,
    'home_service',
    '{"line1": "89, Jalan SS2/24", "city": "Petaling Jaya", "state": "Selangor", "postal_code": "47300"}'::JSONB,
    50.00,
    2.00,
    5.00,
    57.00,
    'card',
    'completed',
    'Professional look for meeting',
    (CURRENT_DATE - INTERVAL '5 days' + TIME '11:00:00')::TIMESTAMPTZ,
    (CURRENT_DATE - INTERVAL '6 days')::TIMESTAMPTZ
  );

-- Upcoming bookings
INSERT INTO bookings (
  customer_id, barber_id, booking_number, status,
  services, scheduled_date, scheduled_time, scheduled_datetime,
  estimated_duration_minutes, service_type,
  customer_address,
  subtotal, service_fee, travel_fee, total_price,
  payment_method, payment_status,
  customer_notes, created_at
) VALUES 
  (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'b0000000-0000-0000-0000-000000000001'::UUID,
    'MG20250108001',
    'confirmed',
    '[{"service_id": "1", "name": "Fade Haircut", "price": 35.00, "duration": 45}, {"service_id": "2", "name": "Beard Trim", "price": 15.00, "duration": 20}]'::JSONB,
    CURRENT_DATE + INTERVAL '2 days',
    '15:00:00',
    (CURRENT_DATE + INTERVAL '2 days' + TIME '15:00:00')::TIMESTAMPTZ,
    65,
    'home_service',
    '{"line1": "23, Jalan Ampang 3", "line2": "Taman Ampang Jaya", "city": "Kuala Lumpur", "state": "Wilayah Persekutuan", "postal_code": "55000"}'::JSONB,
    50.00,
    2.00,
    5.00,
    57.00,
    'cash',
    'pending',
    'Combo cut please',
    NOW() - INTERVAL '1 day'
  ),
  (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'b0000000-0000-0000-0000-000000000002'::UUID,
    'MG20250110002',
    'pending',
    '[{"service_id": "4", "name": "Premium Fade", "price": 50.00, "duration": 60}]'::JSONB,
    CURRENT_DATE + INTERVAL '5 days',
    '18:00:00',
    (CURRENT_DATE + INTERVAL '5 days' + TIME '18:00:00')::TIMESTAMPTZ,
    60,
    'home_service',
    '{"line1": "Level 15, Menara KL", "line2": "Jalan Sultan Ismail", "city": "Kuala Lumpur", "state": "Wilayah Persekutuan", "postal_code": "50250"}'::JSONB,
    50.00,
    2.00,
    5.00,
    57.00,
    NULL,
    'pending',
    'After work appointment',
    NOW() - INTERVAL '2 hours'
  ),
  (
    '00000000-0000-0000-0000-000000000003'::UUID,
    'b0000000-0000-0000-0000-000000000003'::UUID,
    'MG20250109003',
    'accepted',
    '[{"service_id": "5", "name": "Standard Cut", "price": 20.00, "duration": 30}]'::JSONB,
    CURRENT_DATE + INTERVAL '1 day',
    '11:30:00',
    (CURRENT_DATE + INTERVAL '1 day' + TIME '11:30:00')::TIMESTAMPTZ,
    30,
    'home_service',
    '{"line1": "12, Jalan USJ 1/1", "line2": "Taman Subang Jaya", "city": "Subang Jaya", "state": "Selangor", "postal_code": "47500"}'::JSONB,
    20.00,
    2.00,
    5.00,
    27.00,
    NULL,
    'pending',
    'Simple cut needed',
    NOW() - INTERVAL '3 hours'
  );

-- Cancelled booking
INSERT INTO bookings (
  customer_id, barber_id, booking_number, status,
  services, scheduled_date, scheduled_time, scheduled_datetime,
  estimated_duration_minutes, service_type,
  customer_address,
  subtotal, service_fee, travel_fee, total_price,
  payment_method, payment_status,
  customer_notes, cancellation_reason, cancelled_at, created_at
) VALUES 
  (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'b0000000-0000-0000-0000-000000000003'::UUID,
    'MG20250106004',
    'cancelled',
    '[{"service_id": "6", "name": "Fade Cut", "price": 30.00, "duration": 40}]'::JSONB,
    CURRENT_DATE - INTERVAL '2 days',
    '13:00:00',
    (CURRENT_DATE - INTERVAL '2 days' + TIME '13:00:00')::TIMESTAMPTZ,
    40,
    'home_service',
    '{"line1": "23, Jalan Ampang 3", "line2": "Taman Ampang Jaya", "city": "Kuala Lumpur", "state": "Wilayah Persekutuan", "postal_code": "55000"}'::JSONB,
    30.00,
    2.00,
    5.00,
    37.00,
    NULL,
    'cancelled',
    NULL,
    'Schedule conflict - need to reschedule',
    (CURRENT_DATE - INTERVAL '3 days')::TIMESTAMPTZ,
    (CURRENT_DATE - INTERVAL '4 days')::TIMESTAMPTZ
  );

-- =====================================================
-- 7. REVIEWS
-- =====================================================

-- Reviews for completed bookings
INSERT INTO reviews (
  booking_id, customer_id, barber_id,
  rating, comment, images,
  is_verified, is_visible, created_at
) VALUES 
  (
    (SELECT id FROM bookings WHERE booking_number = 'MG20250101001'),
    '00000000-0000-0000-0000-000000000001'::UUID,
    'b0000000-0000-0000-0000-000000000001'::UUID,
    5,
    'Excellent service! Hairul was very professional and gave me exactly the fade I wanted. Highly recommended for home service!',
    ARRAY['https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400'],
    TRUE,
    TRUE,
    (CURRENT_DATE - INTERVAL '6 days')::TIMESTAMPTZ
  ),
  (
    (SELECT id FROM bookings WHERE booking_number = 'MG20250103002'),
    '00000000-0000-0000-0000-000000000001'::UUID,
    'b0000000-0000-0000-0000-000000000002'::UUID,
    5,
    'Jason is amazing! Really knows his Korean styles. Worth every ringgit. Will definitely book again.',
    NULL,
    TRUE,
    TRUE,
    (CURRENT_DATE - INTERVAL '13 days')::TIMESTAMPTZ
  ),
  (
    (SELECT id FROM bookings WHERE booking_number = 'MG20250105003'),
    '00000000-0000-0000-0000-000000000002'::UUID,
    'b0000000-0000-0000-0000-000000000004'::UUID,
    4,
    'Very professional service. David gave me a clean executive cut perfect for my corporate look. Slightly pricey but quality work.',
    NULL,
    TRUE,
    TRUE,
    (CURRENT_DATE - INTERVAL '4 days')::TIMESTAMPTZ
  )
ON CONFLICT (booking_id) DO NOTHING;

-- =====================================================
-- 8. FAVORITES
-- =====================================================

INSERT INTO favorites (user_id, barber_id) VALUES 
  ('00000000-0000-0000-0000-000000000001'::UUID, 'b0000000-0000-0000-0000-000000000001'::UUID),
  ('00000000-0000-0000-0000-000000000001'::UUID, 'b0000000-0000-0000-0000-000000000002'::UUID),
  ('00000000-0000-0000-0000-000000000002'::UUID, 'b0000000-0000-0000-0000-000000000004'::UUID),
  ('00000000-0000-0000-0000-000000000003'::UUID, 'b0000000-0000-0000-0000-000000000003'::UUID)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. PROMO CODES
-- =====================================================

INSERT INTO promo_codes (
  code, description, discount_type, discount_value,
  max_discount_amount, usage_limit, per_user_limit,
  min_order_amount, is_active, valid_from, valid_until,
  applicable_to
) VALUES 
  (
    'FIRST10',
    'RM10 off for new users',
    'fixed',
    10.00,
    10.00,
    1000,
    1,
    30.00,
    TRUE,
    NOW() - INTERVAL '1 month',
    NOW() + INTERVAL '2 months',
    'new_users'
  ),
  (
    'WEEKEND20',
    '20% off on weekends',
    'percentage',
    20.00,
    30.00,
    NULL,
    5,
    50.00,
    TRUE,
    NOW() - INTERVAL '1 week',
    NOW() + INTERVAL '1 month',
    'all'
  ),
  (
    'PREMIUM50',
    'RM50 off premium services',
    'fixed',
    50.00,
    50.00,
    500,
    1,
    100.00,
    TRUE,
    NOW(),
    NOW() + INTERVAL '3 months',
    'all'
  )
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 10. NOTIFICATIONS (Sample)
-- =====================================================

INSERT INTO notifications (
  user_id, type, title, body, action_url,
  is_read, is_sent, sent_at, created_at
) VALUES 
  (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'booking',
    'Booking Confirmed',
    'Your booking with Hairul Nizam on ' || TO_CHAR(CURRENT_DATE + INTERVAL '2 days', 'DD Mon') || ' at 15:00 has been confirmed.',
    '/booking/MG20250108001',
    FALSE,
    TRUE,
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '1 hour'
  ),
  (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'booking',
    'New Booking Request',
    'You have a new booking request from Ahmad Fauzi',
    '/booking/MG20250110002',
    FALSE,
    TRUE,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours'
  ),
  (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'promotion',
    'Weekend Special!',
    'Use code WEEKEND20 for 20% off your next booking this weekend!',
    '/promo',
    TRUE,
    TRUE,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Run these to verify your data
/*
SELECT 'Profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'Barbers', COUNT(*) FROM barbers
UNION ALL
SELECT 'Barbershops', COUNT(*) FROM barbershops
UNION ALL
SELECT 'Services', COUNT(*) FROM services
UNION ALL
SELECT 'Bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'Customer Addresses', COUNT(*) FROM customer_addresses
UNION ALL
SELECT 'Reviews', COUNT(*) FROM reviews
UNION ALL
SELECT 'Favorites', COUNT(*) FROM favorites
UNION ALL
SELECT 'Promo Codes', COUNT(*) FROM promo_codes
UNION ALL
SELECT 'Notifications', COUNT(*) FROM notifications;
*/

-- =====================================================
-- TEST QUERIES
-- =====================================================

-- Test the customer bookings function
/*
SELECT * FROM get_customer_bookings(
  '00000000-0000-0000-0000-000000000001'::UUID,
  NULL,
  20,
  0
);
*/

-- Test the customer addresses function
/*
SELECT * FROM get_customer_addresses(
  '00000000-0000-0000-0000-000000000001'::UUID
);
*/

-- Get barbers with their services
/*
SELECT 
  b.id,
  p.full_name,
  b.business_name,
  b.rating,
  b.total_reviews,
  b.is_available,
  b.base_price,
  json_agg(
    json_build_object(
      'id', s.id,
      'name', s.name,
      'price', s.price,
      'duration', s.duration_minutes
    )
  ) as services
FROM barbers b
JOIN profiles p ON b.user_id = p.id
LEFT JOIN services s ON s.barber_id = b.id
WHERE b.is_available = TRUE
GROUP BY b.id, p.full_name, b.business_name, b.rating, b.total_reviews, b.is_available, b.base_price
ORDER BY b.rating DESC;
*/
