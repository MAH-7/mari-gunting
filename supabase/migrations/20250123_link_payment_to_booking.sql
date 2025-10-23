-- Function to link payment to existing booking after payment succeeds
-- Used in booking-first payment flow

CREATE OR REPLACE FUNCTION link_payment_to_booking(
  p_booking_id UUID,
  p_customer_id UUID,
  p_curlec_payment_id TEXT,
  p_curlec_order_id TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  booking_number TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

  -- Check if booking is in correct state (pending_payment)
  IF v_booking.payment_status != 'pending_payment' THEN
    RETURN QUERY SELECT FALSE, 'Booking is not awaiting payment', v_booking.booking_number;
    RETURN;
  END IF;

  -- Link payment to booking
  UPDATE bookings
  SET 
    curlec_payment_id = p_curlec_payment_id,
    curlec_order_id = p_curlec_order_id,
    payment_status = 'authorized', -- Payment authorized, waiting for barber to accept
    updated_at = NOW()
  WHERE id = p_booking_id;

  RETURN QUERY SELECT TRUE, 'Payment linked successfully', v_booking.booking_number;
END;
$$;

COMMENT ON FUNCTION link_payment_to_booking IS 'Links payment to existing booking after payment authorization succeeds';
