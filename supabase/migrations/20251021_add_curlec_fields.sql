-- Migration: Add Curlec payment gateway fields
-- Description: Add columns to track Curlec payment IDs and order IDs
-- Date: 2025-10-21

-- Add Curlec fields to payments table (if exists)
ALTER TABLE IF EXISTS payments
  ADD COLUMN IF NOT EXISTS curlec_payment_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS curlec_order_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS curlec_signature VARCHAR(512);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_curlec_payment_id 
  ON payments(curlec_payment_id) 
  WHERE curlec_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_curlec_order_id 
  ON payments(curlec_order_id) 
  WHERE curlec_order_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN payments.curlec_payment_id IS 'Curlec payment ID (pay_xxxxx)';
COMMENT ON COLUMN payments.curlec_order_id IS 'Curlec order ID (order_xxxxx)';
COMMENT ON COLUMN payments.curlec_signature IS 'Curlec payment signature for verification';

-- Update payment_method enum if 'curlec' doesn't exist
DO $$
BEGIN
  -- Check if the enum value exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'curlec' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_method')
  ) THEN
    ALTER TYPE payment_method ADD VALUE 'curlec';
  END IF;
END $$;

-- Alter bookings table to support curlec payment fields
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS curlec_payment_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS curlec_order_id VARCHAR(255);

-- Add indexes for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_curlec_payment_id 
  ON bookings(curlec_payment_id) 
  WHERE curlec_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_curlec_order_id 
  ON bookings(curlec_order_id) 
  WHERE curlec_order_id IS NOT NULL;

-- Add comments
COMMENT ON COLUMN bookings.curlec_payment_id IS 'Curlec payment ID for this booking';
COMMENT ON COLUMN bookings.curlec_order_id IS 'Curlec order ID for this booking';
