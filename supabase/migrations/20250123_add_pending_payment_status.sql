-- Add 'pending_payment' status for booking-first payment flow
-- This status indicates booking is created but waiting for payment

-- Add new payment status
DO $$ BEGIN
  ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'pending_payment';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

COMMENT ON TYPE payment_status IS 'Payment status: pending, pending_payment (booking created, awaiting payment), processing, authorized (held), completed (captured), failed, refund_initiated, refund_pending, refunded, refund_failed';

-- Add new booking status for payment timeout
DO $$ BEGIN
  ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'payment_timeout';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

COMMENT ON TYPE booking_status IS 'Booking status includes payment_timeout for bookings that expired before payment';
