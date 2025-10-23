-- Add 'authorized' payment status for auth-capture flow
-- When payment is authorized but not yet captured

-- Add new payment status
DO $$ BEGIN
  ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'authorized';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

COMMENT ON TYPE payment_status IS 'Payment status: pending, processing, authorized (held), completed (captured), failed, refund_initiated, refund_pending, refunded, refund_failed';

-- Update webhook handler to set status to 'authorized' when payment.authorized event received
-- The existing curlec-webhook function will handle this
