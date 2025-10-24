-- Update cancel_booking to handle authorized (but not captured) payments
-- Authorized payments should be reversed/voided instead of refunded

DROP FUNCTION IF EXISTS cancel_booking(UUID, UUID, TEXT);

CREATE OR REPLACE FUNCTION cancel_booking(
  p_booking_id UUID,
  p_customer_id UUID,
  p_cancellation_reason TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  refund_needed BOOLEAN,
  reverse_needed BOOLEAN,
  payment_id VARCHAR(255),
  refund_amount NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking RECORD;
  v_refund_amount NUMERIC(10,2);
  v_current_balance NUMERIC(10,2);
BEGIN
  -- Get booking details with payment info
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id
  AND customer_id = p_customer_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Booking not found or unauthorized', FALSE, FALSE, NULL::TEXT, NULL::NUMERIC;
    RETURN;
  END IF;

  -- Check if booking can be cancelled
  IF v_booking.status IN ('completed', 'cancelled') THEN
    RETURN QUERY SELECT FALSE, 'Cannot cancel completed or already cancelled booking', FALSE, FALSE, NULL::TEXT, NULL::NUMERIC;
    RETURN;
  END IF;

  -- Update booking status to cancelled
  UPDATE bookings
  SET 
    status = 'cancelled',
    cancellation_reason = p_cancellation_reason,
    cancelled_at = NOW(),
    updated_at = NOW()
  WHERE id = p_booking_id;

  -- Handle AUTHORIZED payment (not yet captured) - should be reversed/voided
  IF v_booking.payment_status = 'authorized' 
     AND v_booking.payment_method::TEXT LIKE 'curlec%'
     AND v_booking.curlec_payment_id IS NOT NULL THEN
    
    v_refund_amount := v_booking.total_price;
    
    -- Mark as reversing, app will call reverse/void API
    UPDATE bookings
    SET payment_status = 'reversing'
    WHERE id = p_booking_id;
    
    -- Return info for app to reverse authorization
    RETURN QUERY SELECT 
      TRUE, 
      'Booking cancelled. Reversing payment authorization...', 
      FALSE, -- refund_needed
      TRUE,  -- reverse_needed
      v_booking.curlec_payment_id,
      v_refund_amount;
    RETURN;

  -- Handle COMPLETED payment (already captured) - needs refund
  ELSIF v_booking.payment_status = 'completed' 
     AND v_booking.payment_method::TEXT LIKE 'curlec%'
     AND v_booking.curlec_payment_id IS NOT NULL THEN
    
    v_refund_amount := v_booking.total_price;
    
    -- Mark as pending, app will call refund API
    UPDATE bookings
    SET payment_status = 'refund_pending'
    WHERE id = p_booking_id;
    
    -- Return info for app to process refund
    RETURN QUERY SELECT 
      TRUE, 
      'Booking cancelled. Processing refund...', 
      TRUE,  -- refund_needed
      FALSE, -- reverse_needed
      v_booking.curlec_payment_id,
      v_refund_amount;
    RETURN;

  -- Handle credits payment
  ELSIF v_booking.payment_status = 'completed' 
        AND v_booking.payment_method = 'credits' THEN
    
    -- For credits payment, add credits back immediately
    v_refund_amount := v_booking.total_price;
    
    SELECT COALESCE(SUM(CASE WHEN type = 'add' THEN amount ELSE -amount END), 0)
    INTO v_current_balance
    FROM credit_transactions
    WHERE user_id = p_customer_id;
    
    INSERT INTO credit_transactions (user_id, type, source, amount, balance_after, description, booking_id, metadata)
    VALUES (
      p_customer_id,
      'add',
      'refund',
      v_refund_amount,
      v_current_balance + v_refund_amount,
      'Refund for cancelled booking #' || v_booking.booking_number,
      p_booking_id,
      jsonb_build_object(
        'original_amount', v_refund_amount,
        'booking_number', v_booking.booking_number,
        'refund_reason', p_cancellation_reason
      )
    );
    
    UPDATE bookings
    SET payment_status = 'refunded'
    WHERE id = p_booking_id;
    
    RETURN QUERY SELECT 
      TRUE, 
      'Booking cancelled and RM ' || v_refund_amount::TEXT || ' refunded as MARI CREDITS', 
      FALSE,
      FALSE,
      NULL::TEXT,
      NULL::NUMERIC;
    RETURN;

  ELSE
    -- No refund or reversal needed (cash payment or pending payment)
    RETURN QUERY SELECT TRUE, 'Booking cancelled successfully', FALSE, FALSE, NULL::TEXT, NULL::NUMERIC;
    RETURN;
  END IF;

  RETURN;
END;
$$;

COMMENT ON FUNCTION cancel_booking IS 'Cancels booking and handles authorized payment reversal or completed payment refund';
