-- ================================================
-- PROFILE SCREEN - DATABASE MIGRATIONS
-- Phase 1: Critical Profile Features
-- ================================================

-- 1. Add email/phone verification columns to profiles table
-- ================================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP DEFAULT NOW();

-- Create indexes for verification lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON profiles(email_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_phone_verified ON profiles(phone_verified);

-- 2. Ensure updated_at column exists
-- ================================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 3. Add rating column to bookings if not exists
-- ================================================
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5);

-- Create index for rating queries
CREATE INDEX IF NOT EXISTS idx_bookings_rating ON bookings(rating);

-- 4. Create view for user booking statistics (for performance)
-- ================================================
CREATE OR REPLACE VIEW user_booking_stats AS
SELECT 
  customer_id as user_id,
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
  ROUND(AVG(CASE WHEN rating IS NOT NULL THEN rating END), 1) as avg_rating
FROM bookings
GROUP BY customer_id;

-- 5. Update existing users to have verified phone
-- ================================================
-- Since they registered via SMS OTP, mark phones as verified
UPDATE profiles 
SET phone_verified = TRUE, 
    phone_verified_at = COALESCE(phone_verified_at, created_at)
WHERE phone_verified IS NULL OR phone_verified = FALSE;

-- ================================================
-- VERIFICATION & NOTIFICATIONS
-- ================================================

COMMENT ON COLUMN profiles.email_verified IS 'Whether the user has verified their email address';
COMMENT ON COLUMN profiles.email_verified_at IS 'Timestamp when email was verified';
COMMENT ON COLUMN profiles.phone_verified IS 'Whether the user has verified their phone number';
COMMENT ON COLUMN profiles.phone_verified_at IS 'Timestamp when phone was verified';

-- ================================================
-- COMPLETED MIGRATIONS
-- ================================================
-- ✅ Added verification fields to profiles
-- ✅ Created updated_at trigger
-- ✅ Added rating to bookings
-- ✅ Created user_booking_stats view
-- ✅ Updated existing users' phone verification status
