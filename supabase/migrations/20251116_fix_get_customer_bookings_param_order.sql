-- Fix parameter order for get_customer_bookings
-- PostgREST expects parameters in the order the client sends them
-- Client sends: p_customer_id, p_status, p_limit, p_offset
-- We need to match that order exactly!

DROP FUNCTION IF EXISTS public.get_customer_bookings(uuid, text, integer, integer);

CREATE OR REPLACE FUNCTION public.get_customer_bookings(
  p_customer_id uuid,
  p_status text DEFAULT NULL::text,  -- Keep same name! Now accepts comma-separated values
  p_limit integer DEFAULT 20, 
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid, 
  booking_number text, 
  status booking_status, 
  barber_id uuid, 
  barber_name text, 
  barber_avatar text, 
  barber_is_verified boolean, 
  barber_rating numeric, 
  barber_total_reviews integer, 
  barber_completed_jobs integer, 
  barbershop_name text, 
  services jsonb, 
  scheduled_date date, 
  scheduled_time time without time zone, 
  scheduled_datetime timestamp with time zone, 
  service_type text, 
  customer_address jsonb, 
  subtotal numeric, 
  service_fee numeric, 
  travel_fee numeric, 
  total_price numeric, 
  payment_method payment_method, 
  payment_status payment_status, 
  customer_notes text, 
  barber_notes text, 
  review_id uuid, 
  disputed_at timestamp with time zone, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  status_array text[];
BEGIN
  -- Convert comma-separated string to array if provided
  IF p_status IS NOT NULL THEN
    status_array := string_to_array(p_status, ',');
  END IF;
  
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
    -- Support multiple status filtering OR fetch all
    AND (
      p_status IS NULL 
      OR b.status::TEXT = ANY(status_array)
    )
  ORDER BY b.scheduled_datetime DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

COMMENT ON FUNCTION public.get_customer_bookings IS 
'Get customer bookings with optional multi-status filtering.
Pass comma-separated statuses: "pending,accepted,in_progress" for Active tab.
Parameter order matches PostgREST client expectations.';
