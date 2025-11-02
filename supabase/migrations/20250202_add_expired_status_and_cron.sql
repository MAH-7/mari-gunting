-- ============================================
-- ADD 'EXPIRED' STATUS AND AUTO-EXPIRATION SYSTEM
-- Migration: 20250202_add_expired_status_and_cron.sql
-- Purpose: Implement Grab-style booking expiration (production-grade)
-- ============================================

-- 1. Add 'expired' to booking_status enum
-- This allows bookings to be marked as expired after 3 minutes
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'expired';

-- 2. Create function to auto-expire old pending bookings
-- This is the BACKUP mechanism (cron job calls this)
CREATE OR REPLACE FUNCTION public.expire_old_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  -- Find and expire bookings that are:
  -- 1. Still in 'pending' status
  -- 2. Older than 3 minutes (180 seconds)
  UPDATE public.bookings
  SET 
    status = 'expired',
    cancellation_reason = 'No response within 3 minutes (auto-expired)',
    cancelled_at = NOW(),
    updated_at = NOW()
  WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '3 minutes';
  
  -- Get count of expired bookings
  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  
  -- Log if any bookings were expired (for monitoring)
  IF v_expired_count > 0 THEN
    RAISE NOTICE 'Auto-expired % pending booking(s)', v_expired_count;
  END IF;
END;
$$;

-- 3. Create trigger function to prevent accepting expired bookings
-- This prevents race conditions (database-level protection)
CREATE OR REPLACE FUNCTION public.prevent_expired_acceptance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Prevent changing status FROM 'expired' TO 'accepted'
  IF OLD.status = 'expired' AND NEW.status = 'accepted' THEN
    RAISE EXCEPTION 'Cannot accept expired booking. This booking expired due to no response.';
  END IF;
  
  -- Prevent changing status FROM 'expired' TO 'on_the_way', 'arrived', 'in_progress'
  IF OLD.status = 'expired' AND NEW.status IN ('on_the_way', 'arrived', 'in_progress') THEN
    RAISE EXCEPTION 'Cannot update expired booking. This booking is no longer available.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Attach trigger to bookings table
DROP TRIGGER IF EXISTS trigger_prevent_expired_acceptance ON public.bookings;
CREATE TRIGGER trigger_prevent_expired_acceptance
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_expired_acceptance();

-- 5. Enable pg_cron extension (if not already enabled)
-- Required for scheduling the auto-expiration job
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 6. Schedule cron job to run every 30 seconds
-- This is the BACKUP mechanism that catches edge cases
SELECT cron.schedule(
  'expire-pending-bookings',     -- Job name
  '30 seconds',                  -- Run every 30 seconds
  $$ SELECT expire_old_bookings() $$  -- Call the function
);

-- 7. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.expire_old_bookings() TO postgres;
GRANT EXECUTE ON FUNCTION public.prevent_expired_acceptance() TO postgres;

-- ============================================
-- VERIFICATION QUERIES (for testing)
-- ============================================

-- Check if 'expired' status was added
-- SELECT unnest(enum_range(NULL::booking_status));

-- Check if cron job is scheduled
-- SELECT * FROM cron.job WHERE jobname = 'expire-pending-bookings';

-- Manually trigger expiration (for testing)
-- SELECT expire_old_bookings();

-- Check bookings that would be expired
-- SELECT id, booking_number, status, created_at, 
--        EXTRACT(EPOCH FROM (NOW() - created_at)) as seconds_elapsed
-- FROM bookings 
-- WHERE status = 'pending' 
--   AND created_at < NOW() - INTERVAL '3 minutes';

-- ============================================
-- ROLLBACK (if needed)
-- ============================================

-- To remove cron job:
-- SELECT cron.unschedule('expire-pending-bookings');

-- To remove trigger:
-- DROP TRIGGER IF EXISTS trigger_prevent_expired_acceptance ON bookings;
-- DROP FUNCTION IF EXISTS prevent_expired_acceptance();

-- To remove function:
-- DROP FUNCTION IF EXISTS expire_old_bookings();

-- Note: Cannot remove enum value once added (PostgreSQL limitation)
-- But it's safe to keep it even if not used
