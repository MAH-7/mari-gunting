-- =====================================================
-- MARI-GUNTING NEW TEST BOOKINGS
-- =====================================================
-- 5 new booking records with various statuses
-- =====================================================

-- Booking 1: Completed booking - Modern Fade Cut
INSERT INTO bookings (
  id,
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
  payment_method,
  payment_status,
  paid_at,
  customer_notes,
  accepted_at,
  started_at,
  completed_at,
  created_at,
  updated_at,
  rating
) VALUES (
  '8bdcd52b-fe16-483c-bcb6-70c8cdba8843'::UUID,
  '00000000-0000-0000-0000-000000000001'::UUID, -- Ahmad Fauzi
  'b0000000-0000-0000-0000-000000000001'::UUID, -- Hairul Nizam
  'BK-10001',
  'completed',
  '[{"name": "Modern Fade Cut", "price": 35.00, "duration": 45}]'::JSONB,
  '2025-10-14',
  '02:39:04',
  '2025-10-13 18:39:17+00'::TIMESTAMPTZ,
  45,
  'home_service',
  35.00,
  0.00,
  0.00,
  0.00,
  42.00,
  'cash',
  'completed',
  '2025-10-13 18:41:46+00'::TIMESTAMPTZ,
  'Great service as always!',
  '2025-10-13 18:41:58+00'::TIMESTAMPTZ,
  '2025-10-13 18:42:00+00'::TIMESTAMPTZ,
  '2025-10-13 18:42:05+00'::TIMESTAMPTZ,
  '2025-10-13 18:42:14+00'::TIMESTAMPTZ,
  '2025-10-13 18:42:20.819697+00'::TIMESTAMPTZ,
  5.0
) ON CONFLICT (id) DO NOTHING;

-- Booking 2: Completed booking - Korean Style with Beard Trim
INSERT INTO bookings (
  id,
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
  payment_method,
  payment_status,
  paid_at,
  customer_notes,
  accepted_at,
  started_at,
  completed_at,
  created_at,
  updated_at,
  rating
) VALUES (
  'a1234567-89ab-cdef-0123-456789abcdef'::UUID,
  '00000000-0000-0000-0000-000000000002'::UUID, -- Siti Nurhaliza
  'b0000000-0000-0000-0000-000000000002'::UUID, -- Jason Tan
  'BK-10002',
  'completed',
  '[{"name": "Korean Style Cut", "price": 45.00, "duration": 60}, {"name": "Beard Trim", "price": 15.00, "duration": 15}]'::JSONB,
  '2025-10-13',
  '10:00:00',
  '2025-10-13 10:00:00+00'::TIMESTAMPTZ,
  75,
  'home_service',
  60.00,
  3.00,
  8.00,
  0.00,
  71.00,
  'ewallet_tng',
  'completed',
  '2025-10-13 09:30:00+00'::TIMESTAMPTZ,
  'Looking forward to Korean style cut',
  '2025-10-13 09:45:00+00'::TIMESTAMPTZ,
  '2025-10-13 10:00:00+00'::TIMESTAMPTZ,
  '2025-10-13 11:15:00+00'::TIMESTAMPTZ,
  '2025-10-12 15:30:00+00'::TIMESTAMPTZ,
  '2025-10-13 11:15:30+00'::TIMESTAMPTZ,
  4.5
) ON CONFLICT (id) DO NOTHING;

-- Booking 3: Confirmed booking - Executive Cut (upcoming)
INSERT INTO bookings (
  id,
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
  customer_address,
  subtotal,
  service_fee,
  travel_fee,
  discount_amount,
  total_price,
  payment_method,
  payment_status,
  customer_notes,
  accepted_at,
  created_at,
  updated_at
) VALUES (
  'b2345678-90ab-cdef-0123-456789abcdef'::UUID,
  '00000000-0000-0000-0000-000000000003'::UUID, -- Lee Wei Ming
  'b0000000-0000-0000-0000-000000000004'::UUID, -- David Wong
  'BK-10003',
  'confirmed',
  '[{"name": "Executive Cut", "price": 50.00, "duration": 60}, {"name": "Hot Towel Treatment", "price": 20.00, "duration": 15}]'::JSONB,
  '2025-10-15',
  '14:30:00',
  '2025-10-15 14:30:00+00'::TIMESTAMPTZ,
  75,
  'home_service',
  '{"line1": "12, Jalan USJ 1/1", "line2": "Taman Subang Jaya", "city": "Subang Jaya", "state": "Selangor", "postal_code": "47500"}'::JSONB,
  70.00,
  3.50,
  10.00,
  5.00,
  78.50,
  'card',
  'pending',
  'Important meeting tomorrow, need professional look',
  '2025-10-13 19:15:00+00'::TIMESTAMPTZ,
  '2025-10-13 19:00:00+00'::TIMESTAMPTZ,
  '2025-10-13 19:15:30+00'::TIMESTAMPTZ
) ON CONFLICT (id) DO NOTHING;

-- Booking 4: Pending booking - Standard Fade
INSERT INTO bookings (
  id,
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
  customer_address,
  subtotal,
  service_fee,
  travel_fee,
  discount_amount,
  total_price,
  payment_method,
  payment_status,
  customer_notes,
  created_at,
  updated_at
) VALUES (
  'c3456789-01ab-cdef-0123-456789abcdef'::UUID,
  '00000000-0000-0000-0000-000000000004'::UUID, -- Raj Kumar
  'b0000000-0000-0000-0000-000000000003'::UUID, -- Azlan Ibrahim
  'BK-10004',
  'pending',
  '[{"name": "Fade Haircut", "price": 30.00, "duration": 45}]'::JSONB,
  '2025-10-16',
  '16:00:00',
  '2025-10-16 16:00:00+00'::TIMESTAMPTZ,
  45,
  'home_service',
  '{"line1": "45, Jalan SS2/75", "city": "Shah Alam", "state": "Selangor", "postal_code": "40100"}'::JSONB,
  30.00,
  2.00,
  6.00,
  0.00,
  38.00,
  NULL,
  'pending',
  'Regular trim needed',
  '2025-10-13 19:30:00+00'::TIMESTAMPTZ,
  '2025-10-13 19:30:00+00'::TIMESTAMPTZ
) ON CONFLICT (id) DO NOTHING;

-- Booking 5: Cancelled booking - Classic Cut
INSERT INTO bookings (
  id,
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
  customer_address,
  subtotal,
  service_fee,
  travel_fee,
  discount_amount,
  total_price,
  payment_method,
  payment_status,
  customer_notes,
  cancellation_reason,
  cancelled_at,
  created_at,
  updated_at
) VALUES (
  'd4567890-12ab-cdef-0123-456789abcdef'::UUID,
  '00000000-0000-0000-0000-000000000001'::UUID, -- Ahmad Fauzi
  'b0000000-0000-0000-0000-000000000005'::UUID, -- Faizal Hassan
  'BK-10005',
  'cancelled',
  '[{"name": "Classic Cut", "price": 25.00, "duration": 30}]'::JSONB,
  '2025-10-14',
  '11:00:00',
  '2025-10-14 11:00:00+00'::TIMESTAMPTZ,
  30,
  'home_service',
  '{"line1": "23, Jalan Ampang 3", "line2": "Taman Ampang Jaya", "city": "Kuala Lumpur", "state": "Wilayah Persekutuan", "postal_code": "55000"}'::JSONB,
  25.00,
  2.00,
  5.00,
  0.00,
  32.00,
  'cash',
  'cancelled',
  'Quick trim before lunch',
  'Emergency came up, need to reschedule',
  '2025-10-13 20:15:00+00'::TIMESTAMPTZ,
  '2025-10-13 18:00:00+00'::TIMESTAMPTZ,
  '2025-10-13 20:15:30+00'::TIMESTAMPTZ
) ON CONFLICT (id) DO NOTHING;

-- Display summary
SELECT 
  booking_number,
  status,
  scheduled_date,
  scheduled_time,
  total_price,
  payment_status
FROM bookings
WHERE booking_number IN ('BK-10001', 'BK-10002', 'BK-10003', 'BK-10004', 'BK-10005')
ORDER BY booking_number;
