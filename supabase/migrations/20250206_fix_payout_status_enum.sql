-- Migration: Create payout_status enum and fix payouts table
-- Date: 2025-02-06
-- Description: Replace payment_status enum with proper payout_status enum

-- Step 1: Create payout_status enum type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payout_status') THEN
    CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'rejected');
  END IF;
END $$;

-- Step 2: Change payouts.status column to use payout_status enum
ALTER TABLE public.payouts 
  ALTER COLUMN status DROP DEFAULT;

-- Convert existing data to text first, then to new enum
ALTER TABLE public.payouts 
  ALTER COLUMN status TYPE text USING status::text;

-- Now convert to payout_status enum
ALTER TABLE public.payouts 
  ALTER COLUMN status TYPE payout_status USING 
    CASE 
      WHEN status::text = 'pending' THEN 'pending'::payout_status
      WHEN status::text = 'processing' THEN 'processing'::payout_status
      WHEN status::text = 'completed' THEN 'completed'::payout_status
      WHEN status::text = 'rejected' THEN 'rejected'::payout_status
      -- For any other payment_status values, default to pending
      ELSE 'pending'::payout_status
    END;

-- Set default value
ALTER TABLE public.payouts 
  ALTER COLUMN status SET DEFAULT 'pending'::payout_status;

-- Add comment
COMMENT ON COLUMN public.payouts.status IS 'Payout request status: pending (awaiting admin), processing (admin working on it), completed (money sent), rejected (denied with reason)';

-- Update existing pending payouts to ensure they use correct enum
UPDATE public.payouts 
SET status = 'pending'::payout_status
WHERE status::text = 'pending';
