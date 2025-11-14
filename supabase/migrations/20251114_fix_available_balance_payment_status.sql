-- Migration: Fix available balance to only count captured payments
-- Date: 2025-11-14
-- Description: Card/FPX payments should only be available after payment_status = 'completed' (captured)

-- Drop and recreate the function with proper payment status check
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
  -- Calculate total earnings from completed bookings
  -- For cash: count when status = 'completed'
  -- For card/FPX: count only when status = 'completed' AND payment_status = 'completed' (captured)
  FOR v_service_total, v_travel IN
    SELECT 
      COALESCE((SELECT SUM(price) FROM jsonb_to_recordset(b.services) AS s(price numeric)), 0) as service_total,
      COALESCE(b.travel_fee, 0) as travel
    FROM bookings b
    WHERE b.barber_id = p_barber_id
    AND b.status = 'completed'
    AND (
      -- Cash payment: available immediately when completed
      b.payment_method = 'cash'
      OR
      -- Card/FPX payment: only available after payment captured
      (b.payment_method IN ('card', 'curlec_card', 'curlec_fpx') AND b.payment_status = 'completed')
    )
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

-- Add comment
COMMENT ON FUNCTION get_available_balance IS 'Calculate available balance for barber. Cash payments count immediately, card/FPX payments only count after capture (payment_status = completed).';
