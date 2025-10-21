-- Convert credits from TEXT/INTEGER to NUMERIC(10,2) to support decimal amounts
-- This prevents refund abuse where customers could exploit rounding
-- Example: Pay RM 25.01 → Cancel → Get 26 credits (gained RM 0.99)
-- With decimals: Pay RM 25.01 → Cancel → Get 25.01 credits (exact, no abuse)

-- 1. Alter credit_transactions table
-- Change amount and balance_after to NUMERIC(10,2)
ALTER TABLE credit_transactions
  ALTER COLUMN amount TYPE NUMERIC(10,2) USING amount::NUMERIC(10,2),
  ALTER COLUMN balance_after TYPE NUMERIC(10,2) USING balance_after::NUMERIC(10,2);

-- 2. Alter customer_credits table
-- Change balance to NUMERIC(10,2)
ALTER TABLE customer_credits
  ALTER COLUMN balance TYPE NUMERIC(10,2) USING balance::NUMERIC(10,2);

-- 3. Update customer_credits constraint to work with decimals
ALTER TABLE customer_credits
  DROP CONSTRAINT IF EXISTS customer_credits_balance_check,
  ADD CONSTRAINT customer_credits_balance_check CHECK (balance >= 0);

-- Comments for documentation
COMMENT ON COLUMN credit_transactions.amount IS 'Credit amount in RM (supports decimals, e.g., 25.50)';
COMMENT ON COLUMN credit_transactions.balance_after IS 'Balance after transaction in RM (supports decimals)';
COMMENT ON COLUMN customer_credits.balance IS 'Current credit balance in RM (supports decimals, e.g., 25.50)';
