-- Migration: Update payouts table for custom amount withdrawals
-- Date: 2025-02-06
-- Description: Add fields to support custom withdrawal amounts and prevent duplicate requests

-- Add new columns if they don't exist
ALTER TABLE public.payouts 
  ADD COLUMN IF NOT EXISTS requested_amount numeric(10, 2), -- Amount partner wants to withdraw
  ADD COLUMN IF NOT EXISTS available_balance numeric(10, 2), -- Total available at time of request
  ADD COLUMN IF NOT EXISTS processed_by uuid REFERENCES auth.users(id), -- Admin who processed it
  ADD COLUMN IF NOT EXISTS rejection_reason text, -- Why request was rejected
  ADD COLUMN IF NOT EXISTS notes text, -- Admin notes
  ADD COLUMN IF NOT EXISTS requested_at timestamptz NOT NULL DEFAULT now();

-- Update existing columns to proper types (if needed)
ALTER TABLE public.payouts
  ALTER COLUMN amount TYPE numeric(10, 2) USING amount::numeric(10, 2),
  ALTER COLUMN total_earnings TYPE numeric(10, 2) USING total_earnings::numeric(10, 2),
  ALTER COLUMN platform_fee TYPE numeric(10, 2) USING platform_fee::numeric(10, 2),
  ALTER COLUMN created_at TYPE timestamptz USING created_at::timestamptz,
  ALTER COLUMN updated_at TYPE timestamptz USING updated_at::timestamptz,
  ALTER COLUMN paid_at TYPE timestamptz USING paid_at::timestamptz;

-- Update status column to add 'rejected' to enum (if using enum type)
-- First check if it's an enum or text
DO $$
BEGIN
  -- If status is an enum type, add 'rejected' value
  IF EXISTS (
    SELECT 1 FROM pg_type 
    WHERE typname = 'payout_status'
  ) THEN
    -- Add rejected to enum if not exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'rejected' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payout_status')
    ) THEN
      ALTER TYPE payout_status ADD VALUE IF NOT EXISTS 'rejected';
    END IF;
  END IF;
END $$;

-- If status is text type, just ensure valid values (no constraint needed since it's text)
-- The application layer will handle validation

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_payouts_barber_status ON public.payouts(barber_id, status);
CREATE INDEX IF NOT EXISTS idx_payouts_requested_at ON public.payouts(requested_at DESC);

-- Function to check if barber has pending payout
CREATE OR REPLACE FUNCTION check_pending_payout(p_barber_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.payouts
    WHERE barber_id = p_barber_id
    AND status IN ('pending', 'processing')
  );
END;
$$;

-- Function to get available balance for barber
CREATE OR REPLACE FUNCTION get_available_balance(p_barber_id uuid)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_earnings numeric(10, 2) DEFAULT 0;
  v_total_withdrawn numeric(10, 2) DEFAULT 0;
  v_pending_withdrawals numeric(10, 2) DEFAULT 0;
  v_service_total numeric(10, 2);
  v_commission numeric(10, 2);
  v_net_service numeric(10, 2);
  v_travel numeric(10, 2);
BEGIN
  -- Calculate total earnings from completed bookings (matching app logic)
  FOR v_service_total, v_travel IN
    SELECT 
      COALESCE((SELECT SUM(price) FROM jsonb_to_recordset(b.services) AS s(price numeric)), 0) as service_total,
      COALESCE(b.travel_cost, 0) as travel
    FROM bookings b
    WHERE b.barber_id = p_barber_id
    AND b.status = 'completed'
  LOOP
    -- Calculate commission (15%)
    v_commission := v_service_total * 0.15;
    -- Net service (85%)
    v_net_service := v_service_total - v_commission;
    -- Add to total (net service + 100% travel)
    v_total_earnings := v_total_earnings + v_net_service + v_travel;
  END LOOP;

  -- Calculate total withdrawn (completed payouts)
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_withdrawn
  FROM payouts
  WHERE barber_id = p_barber_id
  AND status = 'completed';

  -- Calculate pending withdrawals
  SELECT COALESCE(SUM(amount), 0)
  INTO v_pending_withdrawals
  FROM payouts
  WHERE barber_id = p_barber_id
  AND status IN ('pending', 'processing');

  -- Return available balance
  RETURN GREATEST(v_total_earnings - v_total_withdrawn - v_pending_withdrawals, 0);
END;
$$;

-- Add comments for documentation
COMMENT ON COLUMN public.payouts.requested_amount IS 'Amount barber requested to withdraw (custom amount)';
COMMENT ON COLUMN public.payouts.available_balance IS 'Total available balance at time of request';
COMMENT ON COLUMN public.payouts.processed_by IS 'Admin user ID who processed the payout';
COMMENT ON COLUMN public.payouts.rejection_reason IS 'Reason for rejection (if status = rejected)';

-- Grant permissions (adjust as needed)
GRANT SELECT ON public.payouts TO authenticated;
GRANT INSERT ON public.payouts TO authenticated;
GRANT UPDATE ON public.payouts TO service_role;

-- Example RLS policy (barbers can only see their own payouts)
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Barbers can view own payouts" ON public.payouts;
CREATE POLICY "Barbers can view own payouts" ON public.payouts
  FOR SELECT
  TO authenticated
  USING (
    barber_id IN (
      SELECT id FROM barbers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Barbers can insert own payout requests" ON public.payouts;
CREATE POLICY "Barbers can insert own payout requests" ON public.payouts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    barber_id IN (
      SELECT id FROM barbers WHERE user_id = auth.uid()
    )
  );
