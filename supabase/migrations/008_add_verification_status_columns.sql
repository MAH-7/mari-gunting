-- =====================================================
-- ADD VERIFICATION STATUS COLUMNS
-- Adds verification tracking to partner tables
-- =====================================================

-- Add verification_status to barbers table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'barbers' 
    AND column_name = 'verification_status'
  ) THEN
    ALTER TABLE barbers 
    ADD COLUMN verification_status TEXT DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));
    
    -- Add index for faster queries
    CREATE INDEX idx_barbers_verification_status ON barbers(verification_status);
    
    COMMENT ON COLUMN barbers.verification_status IS 'Partner verification status for approval flow';
  END IF;
END $$;

-- Add is_verified to barbers table if not exists (boolean flag for quick checks)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'barbers' 
    AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE barbers 
    ADD COLUMN is_verified BOOLEAN DEFAULT false;
    
    -- Add index for faster queries
    CREATE INDEX idx_barbers_is_verified ON barbers(is_verified);
    
    COMMENT ON COLUMN barbers.is_verified IS 'Quick boolean check if barber is verified and can accept bookings';
  END IF;
END $$;

-- Add verification_status to barbershops table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'barbershops' 
    AND column_name = 'verification_status'
  ) THEN
    ALTER TABLE barbershops 
    ADD COLUMN verification_status TEXT DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));
    
    -- Add index for faster queries
    CREATE INDEX idx_barbershops_verification_status ON barbershops(verification_status);
    
    COMMENT ON COLUMN barbershops.verification_status IS 'Barbershop verification status for approval flow';
  END IF;
END $$;

-- Update existing records to 'pending' if they have data (backwards compatibility)
-- This is safe to run multiple times
UPDATE barbers 
SET verification_status = 'pending'
WHERE verification_status = 'unverified'
AND user_id IS NOT NULL
AND created_at < NOW() - INTERVAL '1 hour'; -- Only update records older than 1 hour

UPDATE barbershops 
SET verification_status = 'pending'
WHERE verification_status = 'unverified'
AND owner_id IS NOT NULL
AND created_at < NOW() - INTERVAL '1 hour'; -- Only update records older than 1 hour

-- Create a function to automatically sync is_verified with verification_status
CREATE OR REPLACE FUNCTION sync_barber_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically set is_verified based on verification_status
  IF NEW.verification_status = 'verified' THEN
    NEW.is_verified := true;
  ELSE
    NEW.is_verified := false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-sync verification flags
DROP TRIGGER IF EXISTS trigger_sync_barber_verification ON barbers;
CREATE TRIGGER trigger_sync_barber_verification
  BEFORE INSERT OR UPDATE OF verification_status ON barbers
  FOR EACH ROW
  EXECUTE FUNCTION sync_barber_verification();

-- Add helpful comments
COMMENT ON FUNCTION sync_barber_verification IS 'Automatically syncs is_verified flag when verification_status changes';

-- Grant necessary permissions
GRANT SELECT ON barbers TO authenticated;
GRANT SELECT ON barbershops TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Verification status columns added successfully!';
  RAISE NOTICE 'Tables updated: barbers, barbershops';
  RAISE NOTICE 'Indexes created for better query performance';
  RAISE NOTICE 'Auto-sync trigger created for barbers.is_verified';
END $$;
