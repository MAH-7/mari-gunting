-- ============================================
-- AUTO-CANCEL ACCEPTED BOOKINGS WITHOUT PAYMENT (5-MIN TIMEOUT)
-- Migration: 20251114_cancel_unpaid_after_accept.sql
-- Purpose: Prevent barbers from waiting indefinitely when customer doesn't complete payment
-- ============================================

-- 1) Safety: ensure pg_cron is enabled (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2) Function: cancel accepted bookings still pending payment after 5 minutes
CREATE OR REPLACE FUNCTION public.cancel_unpaid_after_accept()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cancelled_count INTEGER;
BEGIN
  -- Cancel bookings that were accepted, but payment was never authorized within 5 minutes
  UPDATE public.bookings
  SET 
    status = 'cancelled',
    cancellation_reason = 'Payment not completed within 5 minutes (auto-cancel)',
    cancelled_at = NOW(),
    updated_at = NOW()
  WHERE status = 'accepted'
    AND payment_status IN ('pending', 'pending_payment')  -- Support both values
    AND accepted_at IS NOT NULL
    AND accepted_at < NOW() - INTERVAL '5 minutes';

  GET DIAGNOSTICS v_cancelled_count = ROW_COUNT;
  IF v_cancelled_count > 0 THEN
    RAISE NOTICE 'Auto-cancelled % accepted booking(s) due to unpaid timeout', v_cancelled_count;
  END IF;
END;
$$;

-- 3) Schedule: run every 30 seconds (same cadence as pending-expiry job)
-- Note: If the job already exists, this will create a second job. Use a unique name.
SELECT cron.schedule(
  'cancel-unpaid-accepted-bookings',
  '30 seconds',
  $$ SELECT public.cancel_unpaid_after_accept() $$
);

-- 4) Permissions (optional but explicit)
GRANT EXECUTE ON FUNCTION public.cancel_unpaid_after_accept() TO postgres;

-- ============================================
-- VERIFICATION QUERIES (run manually in SQL editor)
-- ============================================
-- -- View scheduled jobs
-- SELECT jobid, jobname, schedule, active FROM cron.job WHERE jobname = 'cancel-unpaid-accepted-bookings';
-- -- Preview impacted bookings
-- SELECT id, booking_number, status, payment_status, accepted_at
-- FROM bookings
-- WHERE status = 'accepted' AND payment_status IN ('pending', 'pending_payment') AND accepted_at < NOW() - INTERVAL '5 minutes'
-- ORDER BY accepted_at ASC
-- LIMIT 50;

-- ============================================
-- ROLLBACK NOTES
-- ============================================
-- -- Unschedule the job (if needed):
-- SELECT cron.unschedule('cancel-unpaid-accepted-bookings');
-- -- Remove function:
-- DROP FUNCTION IF EXISTS public.cancel_unpaid_after_accept();
