-- Update cancel_booking function to automatically refund to MARI CREDITS
-- When customer cancels or barber rejects a PAID booking

-- Drop existing function first
DROP FUNCTION IF EXISTS cancel_booking(UUID, UUID, TEXT);

CREATE OR REPLACE FUNCTION cancel_booking(
  p_booking_id UUID,
  p_customer_id UUID,
  p_cancellation_reason TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking RECORD;
  v_refund_amount NUMERIC(10,2);
  v_credits_to_add NUMERIC(10,2);
  v_current_balance NUMERIC(10,2);
BEGIN
  -- Get booking details
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id
  AND customer_id = p_customer_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Booking not found or unauthorized';
    RETURN;
  END IF;

  -- Check if booking can be cancelled
  IF v_booking.status IN ('completed', 'cancelled') THEN
    RETURN QUERY SELECT FALSE, 'Cannot cancel completed or already cancelled booking';
    RETURN;
  END IF;

  -- Update booking status
  UPDATE bookings
  SET 
    status = 'cancelled',
    cancellation_reason = p_cancellation_reason,
    cancelled_at = NOW(),
    updated_at = NOW()
  WHERE id = p_booking_id;

  -- Handle refund if payment was completed
  IF v_booking.payment_status = 'completed' 
     AND (v_booking.payment_method::TEXT LIKE 'curlec%' OR v_booking.payment_method = 'credits') THEN
    
    -- Calculate refund amount (exact amount paid, no rounding to prevent abuse)
    v_refund_amount := v_booking.total_price;
    v_credits_to_add := v_refund_amount; -- Exact amount, supports decimals (e.g., 25.50)
    
    -- Get current balance
    SELECT COALESCE(SUM(CASE WHEN type = 'add' THEN amount ELSE -amount END), 0)
    INTO v_current_balance
    FROM credit_transactions
    WHERE user_id = p_customer_id;
    
    -- Add credits to customer account
    INSERT INTO credit_transactions (user_id, type, source, amount, balance_after, description, booking_id, metadata)
    VALUES (
      p_customer_id,
      'add',
      'refund',
      v_credits_to_add,
      v_current_balance + v_credits_to_add,
      'Refund for cancelled booking #' || v_booking.booking_number,
      p_booking_id,
      jsonb_build_object(
        'original_amount', v_refund_amount,
        'credits_added', v_credits_to_add,
        'booking_number', v_booking.booking_number,
        'refund_reason', p_cancellation_reason
      )
    );
    
    -- Update payment status to refunded
    UPDATE bookings
    SET 
      payment_status = 'refunded',
      updated_at = NOW()
    WHERE id = p_booking_id;
    
    RETURN QUERY SELECT TRUE, 'Booking cancelled and RM ' || v_refund_amount::TEXT || ' refunded as ' || v_credits_to_add::TEXT || ' MARI CREDITS';
  ELSE
    -- No refund needed (cash payment or pending payment)
    RETURN QUERY SELECT TRUE, 'Booking cancelled successfully';
  END IF;

  RETURN;
END;
$$;
