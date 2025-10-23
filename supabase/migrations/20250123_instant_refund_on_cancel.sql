-- Update cancel_booking function to call Curlec instant refund API
-- When customer cancels or barber rejects a PAID Curlec booking
-- Note: This requires the refund-curlec-payment Edge Function to be deployed

-- Add refund tracking column if not exists
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS curlec_refund_id TEXT;
COMMENT ON COLUMN bookings.curlec_refund_id IS 'Curlec refund ID (rfnd_xxx) for tracking refund status';

-- Update payment_status enum to include refund states if needed
DO $$ BEGIN
  ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'refund_initiated';
  ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'refund_pending';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DROP FUNCTION IF EXISTS cancel_booking(UUID, UUID, TEXT);

CREATE OR REPLACE FUNCTION cancel_booking(
  p_booking_id UUID,
  p_customer_id UUID,
  p_cancellation_reason TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  refund_initiated BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking RECORD;
  v_refund_amount NUMERIC(10,2);
  v_refund_response JSONB;
  v_current_balance NUMERIC(10,2);
BEGIN
  -- Get booking details with payment info
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id
  AND customer_id = p_customer_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Booking not found or unauthorized', FALSE;
    RETURN;
  END IF;

  -- Check if booking can be cancelled
  IF v_booking.status IN ('completed', 'cancelled') THEN
    RETURN QUERY SELECT FALSE, 'Cannot cancel completed or already cancelled booking', FALSE;
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

  -- Handle refund for Curlec payments
  IF v_booking.payment_status = 'completed' 
     AND v_booking.payment_method::TEXT LIKE 'curlec%'
     AND v_booking.curlec_payment_id IS NOT NULL THEN
    
    -- Calculate refund amount
    v_refund_amount := v_booking.total_price;
    
    -- Call Curlec refund Edge Function via HTTP
    BEGIN
      SELECT content::jsonb INTO v_refund_response
      FROM extensions.http((
        'POST',
        current_setting('app.settings.supabase_url') || '/functions/v1/refund-curlec-payment',
        ARRAY[
          extensions.http_header('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
          extensions.http_header('Content-Type', 'application/json')
        ],
        'application/json',
        jsonb_build_object(
          'payment_id', v_booking.curlec_payment_id,
          'amount', (v_refund_amount * 100)::integer, -- Convert to sen
          'notes', jsonb_build_object(
            'booking_id', p_booking_id,
            'booking_number', v_booking.booking_number,
            'reason', p_cancellation_reason
          ),
          'receipt', 'refund_' || v_booking.booking_number
        )::text
      )::text);

      -- Check if refund was successful
      IF v_refund_response->>'success' = 'true' THEN
        -- Update payment status to refund_initiated
        UPDATE bookings
        SET 
          payment_status = 'refund_initiated',
          curlec_refund_id = v_refund_response->'refund'->>'id',
          updated_at = NOW()
        WHERE id = p_booking_id;

        RAISE NOTICE 'Instant refund initiated: %', v_refund_response->'refund'->>'id';
        
        RETURN QUERY SELECT TRUE, 
          'Booking cancelled. Refund of RM ' || v_refund_amount::TEXT || ' initiated (instant refund, should arrive within hours)', 
          TRUE;
        RETURN;
      ELSE
        -- Refund API call failed, log error but don't block cancellation
        RAISE WARNING 'Refund API failed for booking %: %', p_booking_id, v_refund_response->>'error';
        
        -- Update status to indicate refund pending
        UPDATE bookings
        SET payment_status = 'refund_pending'
        WHERE id = p_booking_id;
        
        RETURN QUERY SELECT TRUE, 
          'Booking cancelled. Refund pending - please contact support', 
          FALSE;
        RETURN;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      -- If Edge Function call fails, fall back to manual refund
      RAISE WARNING 'Failed to call refund Edge Function for booking %: %', p_booking_id, SQLERRM;
      
      UPDATE bookings
      SET payment_status = 'refund_pending'
      WHERE id = p_booking_id;
      
      RETURN QUERY SELECT TRUE, 
        'Booking cancelled. Refund pending - please contact support', 
        FALSE;
      RETURN;
    END;

  ELSIF v_booking.payment_status = 'completed' 
        AND v_booking.payment_method = 'credits' THEN
    
    -- For credits payment, add credits back
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
    
    RETURN QUERY SELECT TRUE, 
      'Booking cancelled and RM ' || v_refund_amount::TEXT || ' refunded as MARI CREDITS', 
      TRUE;
    RETURN;

  ELSE
    -- No refund needed (cash payment or pending payment)
    RETURN QUERY SELECT TRUE, 'Booking cancelled successfully', FALSE;
    RETURN;
  END IF;

  RETURN;
END;
$$;

-- Add comment
COMMENT ON FUNCTION cancel_booking IS 'Cancels a booking and initiates instant refund via Curlec API for paid bookings';
