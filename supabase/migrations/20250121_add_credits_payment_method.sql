-- Add 'credits' payment method to enum
-- This allows bookings to be paid fully with MARI CREDITS

ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'credits';

-- Comment for documentation
COMMENT ON TYPE payment_method IS 'Payment methods: cash, ewallet, fpx, card, curlec_card, curlec_fpx, credits';
