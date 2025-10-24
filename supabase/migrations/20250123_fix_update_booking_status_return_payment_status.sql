-- Fix update_booking_status to return payment_status 
-- This is needed for payment capture logic to work

DROP FUNCTION IF EXISTS update_booking_status(UUID, booking_status, UUID, TEXT);

CREATE OR REPLACE FUNCTION update_booking_status(
  p_booking_id UUID,
  p_new_status booking_status,
  p_updated_by UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  updated_at TIMESTAMPTZ,
  returned_payment_status payment_status,  -- Renamed to avoid ambiguity
  refund_needed BOOLEAN,
  payment_id VARCHAR(255),
  refund_amount NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_status booking_status;
  v_updated_at TIMESTAMPTZ;
  v_booking RECORD;
BEGIN
  -- Get current booking info
  SELECT 
    bookings.status,
    bookings.payment_status,
    bookings.payment_method,
    bookings.curlec_payment_id,
    bookings.total_price,
    bookings.customer_id
  INTO v_booking
  FROM bookings
  WHERE bookings.id = p_booking_id;
  
  IF v_booking.status IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Booking not found'::TEXT, NULL::TIMESTAMPTZ, NULL::payment_status, FALSE, NULL::VARCHAR(255), NULL::NUMERIC;
    RETURN;
  END IF;
  
  v_current_status := v_booking.status;
  
  -- Update booking status with proper timestamp tracking
  UPDATE bookings
  SET 
    status = p_new_status,
    barber_notes = CASE WHEN p_notes IS NOT NULL THEN p_notes ELSE barber_notes END,
    cancellation_reason = CASE WHEN p_new_status = 'cancelled' AND p_notes IS NOT NULL THEN p_notes ELSE cancellation_reason END,
    accepted_at = CASE WHEN p_new_status = 'accepted' AND accepted_at IS NULL THEN NOW() ELSE accepted_at END,
    on_the_way_at = CASE WHEN p_new_status = 'on_the_way' AND on_the_way_at IS NULL THEN NOW() ELSE on_the_way_at END,
    arrived_at = CASE WHEN p_new_status = 'arrived' AND arrived_at IS NULL THEN NOW() ELSE arrived_at END,
    started_at = CASE WHEN p_new_status = 'in_progress' AND started_at IS NULL THEN NOW() ELSE started_at END,
    completed_at = CASE WHEN p_new_status = 'completed' AND completed_at IS NULL THEN NOW() ELSE completed_at END,
    cancelled_at = CASE WHEN p_new_status = 'cancelled' AND cancelled_at IS NULL THEN NOW() ELSE cancelled_at END,
    updated_at = NOW()
  WHERE id = p_booking_id
  RETURNING bookings.updated_at INTO v_updated_at;
  
  -- Handle refund if booking is being cancelled/rejected and payment was completed
  IF p_new_status IN ('cancelled', 'rejected')
     AND v_booking.payment_status = 'completed'
     AND v_booking.payment_method::TEXT LIKE 'curlec%'
     AND v_booking.curlec_payment_id IS NOT NULL THEN
    
    -- Mark as pending refund
    UPDATE bookings
    SET payment_status = 'refund_pending'
    WHERE id = p_booking_id;
    
    -- Return info for app to process refund
    RETURN QUERY SELECT 
      TRUE as success, 
      'Booking cancelled. Processing refund...'::TEXT as message, 
      v_updated_at as updated_at,
      'refund_pending'::payment_status as returned_payment_status,
      TRUE as refund_needed,
      v_booking.curlec_payment_id::VARCHAR(255) as payment_id,
      v_booking.total_price as refund_amount;
    RETURN;
    
  ELSIF p_new_status IN ('cancelled', 'rejected')
        AND v_booking.payment_status = 'completed'
        AND v_booking.payment_method = 'credits' THEN
    
    -- For credits payment, add credits back immediately
    DECLARE
      v_current_balance NUMERIC(10,2);
    BEGIN
      SELECT COALESCE(SUM(CASE WHEN type = 'add' THEN amount ELSE -amount END), 0)
      INTO v_current_balance
      FROM credit_transactions
      WHERE user_id = v_booking.customer_id;
      
      INSERT INTO credit_transactions (user_id, type, source, amount, balance_after, description, booking_id, metadata)
      VALUES (
        v_booking.customer_id,
        'add',
        'refund',
        v_booking.total_price,
        v_current_balance + v_booking.total_price,
        'Refund for cancelled booking',
        p_booking_id,
        jsonb_build_object(
          'original_amount', v_booking.total_price,
          'refund_reason', COALESCE(p_notes, 'Booking cancelled')
        )
      );
      
      UPDATE bookings
      SET payment_status = 'refunded'
      WHERE id = p_booking_id;
      
      RETURN QUERY SELECT 
        TRUE as success, 
        'Booking cancelled and RM ' || v_booking.total_price::TEXT || ' refunded as MARI CREDITS'::TEXT as message, 
        v_updated_at as updated_at,
        'refunded'::payment_status as returned_payment_status,
        FALSE as refund_needed,
        NULL::VARCHAR(255) as payment_id,
        NULL::NUMERIC as refund_amount;
      RETURN;
    END;
  END IF;
  
  -- No refund needed - return current payment_status (with alias to avoid ambiguity)
  RETURN QUERY 
  SELECT 
    TRUE as success, 
    'Status updated successfully'::TEXT as message, 
    v_updated_at as updated_at, 
    v_booking.payment_status as returned_payment_status, 
    FALSE as refund_needed, 
    NULL::VARCHAR(255) as payment_id, 
    NULL::NUMERIC as refund_amount;
END;
$$;

COMMENT ON FUNCTION update_booking_status IS 'Updates booking status, returns payment_status for capture logic, and handles refund when cancelled';
