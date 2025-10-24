-- Add new payment statuses for authorization reversal
-- This handles the case where payment is authorized but cancelled before capture

-- Add new values to payment_status enum
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'reversing';
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'reversed';

COMMENT ON TYPE payment_status IS 'Payment status: pending, pending_payment, authorized, completed, failed, refund_pending, refund_initiated, refunded, reversing (reversing authorized payment), reversed (authorization reversed)';
