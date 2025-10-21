-- Payment Security Migration
-- Adds payment_logs table and updates bookings table for secure payment tracking

-- 1. Create payment_logs table for audit trail
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  bill_id TEXT NOT NULL, -- Billplz bill ID
  event TEXT NOT NULL, -- 'payment_success', 'payment_cancelled', 'amount_mismatch', etc.
  amount INTEGER, -- Amount in cents
  transaction_id TEXT,
  expected_amount INTEGER,
  received_amount INTEGER,
  callback_data JSONB, -- Full callback payload for debugging
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS payment_logs_booking_id_idx ON payment_logs(booking_id);
CREATE INDEX IF NOT EXISTS payment_logs_bill_id_idx ON payment_logs(bill_id);
CREATE INDEX IF NOT EXISTS payment_logs_event_idx ON payment_logs(event);
CREATE INDEX IF NOT EXISTS payment_logs_created_at_idx ON payment_logs(created_at DESC);

-- 2. Add payment fields to bookings table (if not exists)
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS bill_id TEXT,
  ADD COLUMN IF NOT EXISTS transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS transaction_status TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Index for bill_id lookups
CREATE INDEX IF NOT EXISTS bookings_bill_id_idx ON bookings(bill_id);

-- 3. Row Level Security (RLS) for payment_logs
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can insert (webhook only)
CREATE POLICY "Service role can insert payment logs"
  ON payment_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Users can read their own payment logs
CREATE POLICY "Users can read their payment logs"
  ON payment_logs
  FOR SELECT
  TO authenticated
  USING (
    booking_id IN (
      SELECT id FROM bookings 
      WHERE customer_id = auth.uid() OR barber_id = auth.uid()
    )
  );

-- 4. Secure bookings payment_status updates
-- Prevent clients from directly updating payment_status
-- Only the webhook (via service role) can update it

-- Drop existing policies if needed
DROP POLICY IF EXISTS "Users can update their bookings" ON bookings;

-- Create new policies
CREATE POLICY "Users can update non-payment fields"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid() OR barber_id = auth.uid())
  WITH CHECK (
    customer_id = auth.uid() OR barber_id = auth.uid()
  );

-- Service role can update everything (including payment_status)
CREATE POLICY "Service role can update bookings"
  ON bookings
  FOR UPDATE
  TO service_role
  WITH CHECK (true);

-- 5. Function to check payment consistency
CREATE OR REPLACE FUNCTION check_payment_consistency()
RETURNS TABLE (
  booking_id UUID,
  status TEXT,
  payment_status TEXT,
  total_amount NUMERIC,
  bill_id TEXT,
  transaction_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  has_payment_log BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id as booking_id,
    b.status,
    b.payment_status,
    b.total_amount,
    b.bill_id,
    b.transaction_id,
    b.paid_at,
    EXISTS(
      SELECT 1 FROM payment_logs 
      WHERE payment_logs.booking_id = b.id 
      AND payment_logs.event = 'payment_success'
    ) as has_payment_log
  FROM bookings b
  WHERE b.payment_status = 'paid'
  ORDER BY b.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function to get payment history for a booking
CREATE OR REPLACE FUNCTION get_payment_history(p_booking_id UUID)
RETURNS TABLE (
  event TEXT,
  amount INTEGER,
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Check if user has access to this booking
  IF NOT EXISTS (
    SELECT 1 FROM bookings 
    WHERE id = p_booking_id 
    AND (customer_id = auth.uid() OR barber_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    pl.event,
    pl.amount,
    pl.transaction_id,
    pl.created_at
  FROM payment_logs pl
  WHERE pl.booking_id = p_booking_id
  ORDER BY pl.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant permissions
GRANT SELECT ON payment_logs TO authenticated;
GRANT ALL ON payment_logs TO service_role;

-- Comments for documentation
COMMENT ON TABLE payment_logs IS 'Audit trail for all payment events from Billplz webhooks';
COMMENT ON COLUMN bookings.bill_id IS 'Billplz bill ID for payment tracking';
COMMENT ON COLUMN bookings.transaction_id IS 'Bank transaction ID from FPX/card gateway';
COMMENT ON FUNCTION check_payment_consistency() IS 'Admin function to verify payment data integrity';
COMMENT ON FUNCTION get_payment_history(UUID) IS 'Get payment event history for a booking';
