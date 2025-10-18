-- ============================================
-- MARI GUNTING DATABASE VIEWS
-- ============================================

-- 1. ACTIVE TRACKING SESSIONS VIEW
CREATE OR REPLACE VIEW public.active_tracking_sessions AS  
SELECT b.id AS booking_id,
    b.customer_id,
    b.barber_id,
    b.status,
    b.tracking_started_at,
    b.tracking_last_updated_at,
    b.current_distance_km,
    b.current_eta_minutes,
    b.estimated_arrival_time,
    p.location AS barber_location,
    p.updated_at AS barber_profile_updated_at,
    (EXTRACT(epoch FROM (now() - b.tracking_last_updated_at)) / (60)::numeric) AS minutes_since_last_update
FROM (bookings b
    JOIN profiles p ON ((p.id = b.barber_id)))
WHERE ((b.status = ANY (ARRAY['accepted'::booking_status, 'confirmed'::booking_status, 'in_progress'::booking_status])) AND (b.tracking_started_at IS NOT NULL))
ORDER BY b.tracking_started_at DESC;

-- 2. USER BOOKING STATS VIEW
CREATE OR REPLACE VIEW public.user_booking_stats AS  
SELECT customer_id AS user_id,
    count(*) AS total_bookings,
    count(
        CASE
            WHEN (status = 'completed'::booking_status) THEN 1
            ELSE NULL::integer
        END) AS completed_bookings,
    count(
        CASE
            WHEN (status = 'cancelled'::booking_status) THEN 1
            ELSE NULL::integer
        END) AS cancelled_bookings,
    round(avg(
        CASE
            WHEN (rating IS NOT NULL) THEN rating
            ELSE NULL::numeric
        END), 1) AS avg_rating
FROM bookings
GROUP BY customer_id;