-- Fix link_payment_to_booking to accept both 'pending' and 'pending_payment' statuses
-- This allows payment linking to work regardless of initial booking payment status

CREATE OR REPLACE FUNCTION public.link_payment_to_booking(
  p_booking_id uuid, 
  p_customer_id uuid, 
  p_curlec_payment_id text, 
  p_curlec_order_id text
)
RETURNS TABLE(success boolean, message text, booking_number text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_booking RECORD;
BEGIN
  -- Get booking and verify ownership
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id
  AND customer_id = p_customer_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Booking not found or unauthorized', NULL::TEXT;
    RETURN;
  END IF;

  -- Check if booking is in correct state (pending_payment OR pending)
  -- Accept both 'pending' and 'pending_payment' statuses for backward compatibility
  IF v_booking.payment_status NOT IN ('pending', 'pending_payment') THEN
    RETURN QUERY SELECT FALSE, 
      'Booking is not awaiting payment (current status: ' || v_booking.payment_status::TEXT || ')', 
      v_booking.booking_number;
    RETURN;
  END IF;

  -- Link payment to booking
  UPDATE bookings
  SET 
    curlec_payment_id = p_curlec_payment_id,
    curlec_order_id = p_curlec_order_id,
    payment_status = 'authorized', -- Payment authorized successfully
    updated_at = NOW()
  WHERE id = p_booking_id;

  RETURN QUERY SELECT TRUE, 'Payment linked successfully', v_booking.booking_number;
END;
$function$;

COMMENT ON FUNCTION link_payment_to_booking IS 'Links payment to existing booking after payment succeeds - accepts both pending and pending_payment statuses';
