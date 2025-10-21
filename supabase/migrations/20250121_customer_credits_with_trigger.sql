-- Create customer_credits table for cached balance (Grab/Stripe pattern)
-- This provides O(1) balance lookup instead of summing all transactions

CREATE TABLE IF NOT EXISTS customer_credits (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  balance NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_customer_credits_user_id ON customer_credits(user_id);

-- Enable RLS
ALTER TABLE customer_credits ENABLE ROW LEVEL SECURITY;

-- Users can only read their own balance
CREATE POLICY "Users can read own credits"
  ON customer_credits
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Only service role can update (via trigger)
CREATE POLICY "Service role can update credits"
  ON customer_credits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to update customer_credits balance when transaction inserted
CREATE OR REPLACE FUNCTION update_customer_credit_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Upsert the customer_credits record
  INSERT INTO customer_credits (user_id, balance, updated_at)
  VALUES (NEW.user_id, NEW.balance_after, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance = NEW.balance_after,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update balance after transaction insert
DROP TRIGGER IF EXISTS trg_update_customer_credit_balance ON credit_transactions;
CREATE TRIGGER trg_update_customer_credit_balance
  AFTER INSERT ON credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_credit_balance();

-- Populate existing balances from credit_transactions
INSERT INTO customer_credits (user_id, balance, updated_at)
SELECT 
  user_id,
  COALESCE(MAX(balance_after), 0) as balance,
  NOW()
FROM credit_transactions
GROUP BY user_id
ON CONFLICT (user_id) DO NOTHING;

-- Comment for documentation
COMMENT ON TABLE customer_credits IS 'Cached customer credit balances for fast lookup. Auto-updated via trigger.';
COMMENT ON COLUMN customer_credits.balance IS 'Current credit balance. Always reflects latest transaction balance_after.';
