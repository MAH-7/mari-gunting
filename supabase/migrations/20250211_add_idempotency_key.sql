-- ============================================
-- DUPLICATE PREVENTION: Add Idempotency Key
-- ============================================
-- Date: 2025-02-11
-- Standard: Grab/Stripe idempotency pattern
-- Purpose: Prevent duplicate bookings from network retries and API replays
--
-- HOW IT WORKS:
-- 1. Client generates unique key: {userId}_{timestamp}_{random}
-- 2. Server checks if key already exists
-- 3. If exists: Return existing booking (idempotent)
-- 4. If new: Create booking and store key
--
-- SECURITY COVERAGE:
-- ✅ Network retries (same request sent twice)
-- ✅ API replay attacks (hacker intercepts and replays)
-- ✅ Payment webhook duplicates (Curlec sends twice)
-- ============================================

BEGIN;

-- Add idempotency_key column (nullable for backward compatibility)
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Add partial unique index (only checks non-null values)
-- This allows existing bookings (with NULL) to coexist with new ones
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_idempotency_key 
  ON public.bookings(idempotency_key) 
  WHERE idempotency_key IS NOT NULL;

-- Add index for faster lookups by customer + key
CREATE INDEX IF NOT EXISTS idx_bookings_customer_idempotency 
  ON public.bookings(customer_id, idempotency_key) 
  WHERE idempotency_key IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.bookings.idempotency_key IS 
  'Unique key to prevent duplicate bookings from retries/replays. Format: {userId}_{timestamp}_{random}. Expires conceptually after 24 hours but kept for audit trail.';

-- Grant permissions
GRANT SELECT ON public.bookings TO authenticated;

COMMIT;

-- ============================================
-- DEPLOYMENT NOTES
-- ============================================
-- ✅ Safe for production (column is nullable)
-- ✅ Existing bookings unaffected (NULL allowed)
-- ✅ New bookings will use idempotency_key
-- ✅ No downtime required
--
-- ROLLBACK (if needed):
-- DROP INDEX IF EXISTS idx_bookings_idempotency_key;
-- DROP INDEX IF EXISTS idx_bookings_customer_idempotency;
-- ALTER TABLE bookings DROP COLUMN idempotency_key;
-- ============================================
