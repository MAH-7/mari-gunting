-- Add bank account columns to barbershops table for payout functionality
ALTER TABLE public.barbershops
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_account_name TEXT;

-- Add comment
COMMENT ON COLUMN public.barbershops.bank_name IS 'Bank name for payout (e.g., Maybank, CIMB)';
COMMENT ON COLUMN public.barbershops.bank_account_number IS 'Bank account number for receiving payouts';
COMMENT ON COLUMN public.barbershops.bank_account_name IS 'Bank account holder name';
