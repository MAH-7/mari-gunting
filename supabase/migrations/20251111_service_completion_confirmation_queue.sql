-- Migration: Service Completion Confirmation with Queue-Based Payment Capture
-- Description: Implement Grab-style confirmation system to prevent partner fraud
-- Security Fix: HIGH #1 - Service completion confirmation
-- Date: 2025-11-11

-- ============================================
-- 1. CREATE CAPTURE QUEUE STATUS ENUM
-- ============================================
CREATE TYPE capture_queue_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');

COMMENT ON TYPE capture_queue_status IS 'Status for payment capture queue: pending (waiting), processing (being captured), completed (captured), failed (retry exhausted), cancelled (customer disputed)';

-- ============================================
-- 2. ADD COLUMNS TO BOOKINGS TABLE
-- ============================================
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS completion_confirmed_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS disputed_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS dispute_reason TEXT NULL;

COMMENT ON COLUMN bookings.completion_confirmed_at IS 'Timestamp when customer confirmed service completion (triggers immediate capture)';
COMMENT ON COLUMN bookings.disputed_at IS 'Timestamp when customer reported service issue (cancels capture)';
COMMENT ON COLUMN bookings.dispute_reason IS 'Reason provided by customer when disputing service completion';

-- Add index for quick lookup of disputed bookings
CREATE INDEX IF NOT EXISTS idx_bookings_disputed 
  ON bookings(disputed_at) 
  WHERE disputed_at IS NOT NULL;

-- ============================================
-- 3. CREATE CAPTURE QUEUE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS capture_queue (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  curlec_payment_id VARCHAR(255) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status capture_queue_status NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT NULL,
  processed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT capture_queue_amount_positive CHECK (amount > 0),
  CONSTRAINT capture_queue_retry_count_valid CHECK (retry_count >= 0 AND retry_count <= 5)
);

COMMENT ON TABLE capture_queue IS 'Queue for delayed payment captures with Grab-style confirmation (2-hour delay, customer can confirm early or dispute)';

-- Indexes for queue processing performance
CREATE INDEX IF NOT EXISTS idx_capture_queue_status_scheduled 
  ON capture_queue(status, scheduled_at) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_capture_queue_booking 
  ON capture_queue(booking_id);

CREATE INDEX IF NOT EXISTS idx_capture_queue_processing 
  ON capture_queue(status, updated_at) 
  WHERE status = 'processing';

-- Auto-update timestamp
CREATE TRIGGER update_capture_queue_updated_at 
  BEFORE UPDATE ON capture_queue 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. FUNCTION: QUEUE PAYMENT CAPTURE
-- ============================================
-- Called when partner marks booking as "completed"
-- Adds payment to queue with 2-hour delay (Grab standard)
CREATE OR REPLACE FUNCTION queue_payment_capture(
  p_booking_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_booking RECORD;
  v_queue_id UUID;
  v_scheduled_at TIMESTAMPTZ;
BEGIN
  -- Get booking details
  SELECT 
    id,
    curlec_payment_id,
    total_price,
    payment_status,
    status,
    disputed_at
  INTO v_booking
  FROM bookings
  WHERE id = p_booking_id;

  -- Validation checks
  IF v_booking IS NULL THEN
    RAISE EXCEPTION 'Booking not found: %', p_booking_id;
  END IF;

  IF v_booking.status != 'completed' THEN
    RAISE EXCEPTION 'Booking must be completed to queue capture. Current status: %', v_booking.status;
  END IF;

  IF v_booking.payment_status != 'authorized' THEN
    RAISE EXCEPTION 'Payment must be authorized to queue capture. Current payment_status: %', v_booking.payment_status;
  END IF;

  IF v_booking.curlec_payment_id IS NULL THEN
    RAISE EXCEPTION 'No Curlec payment ID found for booking';
  END IF;

  IF v_booking.disputed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot queue capture for disputed booking';
  END IF;

  -- Check if already queued
  IF EXISTS (
    SELECT 1 FROM capture_queue 
    WHERE booking_id = p_booking_id 
    AND status IN ('pending', 'processing')
  ) THEN
    RAISE EXCEPTION 'Capture already queued for this booking';
  END IF;

  -- Schedule capture for 2 hours from now (Grab standard)
  v_scheduled_at := NOW() + INTERVAL '2 hours';

  -- Insert into queue
  INSERT INTO capture_queue (
    booking_id,
    curlec_payment_id,
    amount,
    scheduled_at,
    status,
    retry_count
  ) VALUES (
    p_booking_id,
    v_booking.curlec_payment_id,
    v_booking.total_price,
    v_scheduled_at,
    'pending',
    0
  )
  RETURNING id INTO v_queue_id;

  RAISE NOTICE 'Payment capture queued - ID: %, scheduled at: %', v_queue_id, v_scheduled_at;

  RETURN json_build_object(
    'success', true,
    'queue_id', v_queue_id,
    'scheduled_at', v_scheduled_at,
    'message', 'Payment capture scheduled for 2 hours from now'
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to queue payment capture: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION queue_payment_capture IS 'Queue payment capture with 2-hour delay (Grab standard). Called when partner completes service.';

-- ============================================
-- 5. FUNCTION: CONFIRM SERVICE COMPLETION
-- ============================================
-- Called when customer confirms service via rating or explicit confirmation
-- Immediately captures payment and cancels any pending queue jobs
CREATE OR REPLACE FUNCTION confirm_service_completion(
  p_booking_id UUID,
  p_customer_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_booking RECORD;
  v_cancelled_count INTEGER := 0;
BEGIN
  -- Get booking details with customer validation
  SELECT 
    id,
    customer_id,
    curlec_payment_id,
    total_price,
    payment_status,
    status,
    completion_confirmed_at,
    disputed_at
  INTO v_booking
  FROM bookings
  WHERE id = p_booking_id;

  -- Validation checks
  IF v_booking IS NULL THEN
    RAISE EXCEPTION 'Booking not found: %', p_booking_id;
  END IF;

  IF v_booking.customer_id != p_customer_id THEN
    RAISE EXCEPTION 'Unauthorized: booking belongs to different customer';
  END IF;

  IF v_booking.status != 'completed' THEN
    RAISE EXCEPTION 'Booking must be completed to confirm. Current status: %', v_booking.status;
  END IF;

  IF v_booking.completion_confirmed_at IS NOT NULL THEN
    RAISE NOTICE 'Service already confirmed at: %', v_booking.completion_confirmed_at;
    RETURN json_build_object(
      'success', true,
      'already_confirmed', true,
      'confirmed_at', v_booking.completion_confirmed_at,
      'message', 'Service was already confirmed'
    );
  END IF;

  IF v_booking.disputed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot confirm disputed booking (disputed at: %)', v_booking.disputed_at;
  END IF;

  -- Mark booking as confirmed
  UPDATE bookings
  SET completion_confirmed_at = NOW()
  WHERE id = p_booking_id;

  -- Cancel any pending/processing queue jobs
  UPDATE capture_queue
  SET 
    status = 'cancelled',
    processed_at = NOW(),
    last_error = 'Customer confirmed service - immediate capture triggered'
  WHERE booking_id = p_booking_id
  AND status IN ('pending', 'processing');

  GET DIAGNOSTICS v_cancelled_count = ROW_COUNT;

  RAISE NOTICE 'Service confirmed by customer - % queue job(s) cancelled', v_cancelled_count;

  -- Return success with flag to trigger immediate capture in application layer
  RETURN json_build_object(
    'success', true,
    'confirmed_at', NOW(),
    'cancelled_queue_jobs', v_cancelled_count,
    'trigger_immediate_capture', true,
    'curlec_payment_id', v_booking.curlec_payment_id,
    'amount', v_booking.total_price,
    'message', 'Service confirmed - immediate capture required'
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to confirm service completion: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION confirm_service_completion IS 'Customer confirms service completion. Triggers immediate payment capture and cancels queue jobs.';

-- ============================================
-- 6. FUNCTION: REPORT SERVICE ISSUE
-- ============================================
-- Called when customer reports issue with completed service
-- Cancels pending capture and flags booking for admin review
CREATE OR REPLACE FUNCTION report_service_issue(
  p_booking_id UUID,
  p_customer_id UUID,
  p_dispute_reason TEXT
)
RETURNS JSON AS $$
DECLARE
  v_booking RECORD;
  v_cancelled_count INTEGER := 0;
BEGIN
  -- Validation
  IF p_dispute_reason IS NULL OR LENGTH(TRIM(p_dispute_reason)) < 10 THEN
    RAISE EXCEPTION 'Dispute reason must be at least 10 characters';
  END IF;

  -- Get booking details with customer validation
  SELECT 
    id,
    customer_id,
    payment_status,
    status,
    completion_confirmed_at,
    disputed_at
  INTO v_booking
  FROM bookings
  WHERE id = p_booking_id;

  -- Validation checks
  IF v_booking IS NULL THEN
    RAISE EXCEPTION 'Booking not found: %', p_booking_id;
  END IF;

  IF v_booking.customer_id != p_customer_id THEN
    RAISE EXCEPTION 'Unauthorized: booking belongs to different customer';
  END IF;

  IF v_booking.status != 'completed' THEN
    RAISE EXCEPTION 'Can only dispute completed bookings. Current status: %', v_booking.status;
  END IF;

  IF v_booking.completion_confirmed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot dispute after confirming service (confirmed at: %)', v_booking.completion_confirmed_at;
  END IF;

  IF v_booking.disputed_at IS NOT NULL THEN
    RAISE NOTICE 'Booking already disputed at: %', v_booking.disputed_at;
    RETURN json_build_object(
      'success', true,
      'already_disputed', true,
      'disputed_at', v_booking.disputed_at,
      'message', 'Booking was already disputed'
    );
  END IF;

  IF v_booking.payment_status = 'completed' THEN
    RAISE EXCEPTION 'Payment already captured - please contact support for refund';
  END IF;

  -- Mark booking as disputed
  UPDATE bookings
  SET 
    disputed_at = NOW(),
    dispute_reason = p_dispute_reason
  WHERE id = p_booking_id;

  -- Cancel any pending/processing queue jobs
  UPDATE capture_queue
  SET 
    status = 'cancelled',
    processed_at = NOW(),
    last_error = 'Customer disputed service: ' || p_dispute_reason
  WHERE booking_id = p_booking_id
  AND status IN ('pending', 'processing');

  GET DIAGNOSTICS v_cancelled_count = ROW_COUNT;

  RAISE NOTICE 'Service disputed by customer - % queue job(s) cancelled', v_cancelled_count;

  -- TODO: Create admin notification for dispute review

  RETURN json_build_object(
    'success', true,
    'disputed_at', NOW(),
    'cancelled_queue_jobs', v_cancelled_count,
    'message', 'Service dispute recorded - admin will review within 24 hours'
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to report service issue: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION report_service_issue IS 'Customer reports issue with completed service. Cancels payment capture and flags for admin review.';

-- ============================================
-- 7. GRANT PERMISSIONS
-- ============================================
GRANT SELECT, INSERT, UPDATE ON capture_queue TO authenticated;
GRANT EXECUTE ON FUNCTION queue_payment_capture TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_service_completion TO authenticated;
GRANT EXECUTE ON FUNCTION report_service_issue TO authenticated;

-- Service role (for cron job) needs full access
GRANT ALL ON capture_queue TO service_role;

-- ============================================
-- 8. RLS POLICIES FOR CAPTURE QUEUE
-- ============================================
ALTER TABLE capture_queue ENABLE ROW LEVEL SECURITY;

-- Customers can view their own booking's queue status
CREATE POLICY "Customers can view their booking queue status"
  ON capture_queue
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = capture_queue.booking_id
      AND bookings.customer_id = auth.uid()
    )
  );

-- Partners can view their booking's queue status
CREATE POLICY "Partners can view their booking queue status"
  ON capture_queue
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = capture_queue.booking_id
      AND bookings.barber_id IN (
        SELECT id FROM barbers WHERE user_id = auth.uid()
      )
    )
  );

-- Only service_role (cron job) can update queue
CREATE POLICY "Service role can manage capture queue"
  ON capture_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Next steps:
-- 1. Create Edge Function: supabase/functions/process-capture-queue/index.ts
-- 2. Modify bookingService.ts to call queue_payment_capture() instead of immediate capture
-- 3. Add customer UI for confirm/dispute buttons
-- 4. Deploy and test with staging data
