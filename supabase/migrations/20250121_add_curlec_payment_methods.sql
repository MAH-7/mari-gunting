-- Add Curlec payment method types to payment_method enum
-- This allows storing specific payment methods (card vs FPX)

ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'curlec_card';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'curlec_fpx';
