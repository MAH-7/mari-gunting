-- Add disputed_at field to get_customer_bookings function
-- This allows the bookings list screen to correctly hide the Rate button for disputed bookings

-- Drop existing function to allow return type change
DROP FUNCTION IF EXISTS public.get_customer_bookings(uuid, text, integer, integer);

CREATE OR REPLACE FUNCTION public.get_customer_bookings(p_customer_id uuid, p_status text DEFAULT NULL::text, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, booking_number text, status booking_status, barber_id uuid, barber_name text, barber_avatar text, barber_is_verified boolean, barber_rating numeric, barber_total_reviews integer, barber_completed_jobs integer, barbershop_name text, services jsonb, scheduled_date date, scheduled_time time without time zone, scheduled_datetime timestamp with time zone, service_type text, customer_address jsonb, subtotal numeric, service_fee numeric, travel_fee numeric, total_price numeric, payment_method payment_method, payment_status payment_status, customer_notes text, barber_notes text, review_id uuid, disputed_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.booking_number,
    b.status,
    b.barber_id,
    p.full_name AS barber_name,
    p.avatar_url AS barber_avatar,
    COALESCE(bar.is_verified, false) AS barber_is_verified,
    COALESCE(bar.rating, 0::DECIMAL)::DECIMAL(3,2) AS barber_rating,
    COALESCE(bar.total_reviews, 0) AS barber_total_reviews,
    COALESCE(bar.completed_bookings, 0) AS barber_completed_jobs,
    bs.name AS barbershop_name,
    b.services,
    b.scheduled_date,
    b.scheduled_time,
    b.scheduled_datetime,
    b.service_type,
    b.customer_address,
    b.subtotal,
    b.service_fee,
    b.travel_fee,
    b.total_price,
    b.payment_method,
    b.payment_status,
    b.customer_notes,
    b.barber_notes,
    r.id AS review_id,
    b.disputed_at,
    b.created_at,
    b.updated_at
  FROM bookings b
  LEFT JOIN barbers bar ON b.barber_id = bar.id
  LEFT JOIN profiles p ON bar.user_id = p.id
  LEFT JOIN barbershops bs ON b.barbershop_id = bs.id
  LEFT JOIN reviews r ON b.id = r.booking_id
  WHERE b.customer_id = p_customer_id
    AND (p_status IS NULL OR b.status::TEXT = p_status)
  ORDER BY b.scheduled_datetime DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;
