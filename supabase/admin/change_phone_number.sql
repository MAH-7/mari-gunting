-- =====================================================
-- ADMIN SCRIPT: Change Customer Phone Number
-- =====================================================
-- 
-- SECURITY WARNING: Only run this after verifying customer identity!
-- 
-- Usage:
-- 1. Replace [OLD_PHONE] with current phone (e.g., '+601234567890')
-- 2. Replace [NEW_PHONE] with new phone (e.g., '+609876543210')
-- 3. Run each step carefully
-- =====================================================

-- STEP 1: Verify current user exists
-- =====================================================
SELECT 
  id,
  full_name,
  phone_number,
  email,
  role,
  created_at
FROM profiles
WHERE phone_number = '[OLD_PHONE]';

-- Expected: Should return 1 row
-- If no rows: User not found, check phone number
-- If multiple rows: Database error, contact tech support


-- STEP 2: Verify new phone is available
-- =====================================================
SELECT 
  id,
  full_name,
  phone_number
FROM profiles
WHERE phone_number = '[NEW_PHONE]';

-- Expected: Should return 0 rows (no one has this number)
-- If returns rows: STOP! Number already in use
-- Customer needs to provide different number


-- STEP 3: Check for bookings/reviews (optional)
-- =====================================================
-- See if user has active bookings
SELECT 
  b.id as booking_id,
  b.status,
  b.booking_date,
  b.total_price,
  s.name as barbershop_name
FROM bookings b
JOIN barbershops s ON b.barbershop_id = s.id
JOIN profiles p ON b.user_id = p.id
WHERE p.phone_number = '[OLD_PHONE]'
  AND b.status IN ('pending', 'confirmed', 'in_progress')
ORDER BY b.booking_date DESC
LIMIT 5;

-- Expected: Shows recent bookings (helps verify identity)


-- STEP 4: Backup current data (IMPORTANT!)
-- =====================================================
-- Create backup before making changes
CREATE TEMP TABLE phone_change_backup AS
SELECT 
  id,
  phone_number,
  full_name,
  email,
  avatar_url,
  role,
  created_at,
  updated_at,
  NOW() as backup_timestamp
FROM profiles
WHERE phone_number = '[OLD_PHONE]';

-- Verify backup
SELECT * FROM phone_change_backup;


-- STEP 5: Update phone number in profiles
-- =====================================================
UPDATE profiles
SET 
  phone_number = '[NEW_PHONE]',
  updated_at = NOW()
WHERE phone_number = '[OLD_PHONE]';

-- Verify update
SELECT 
  id,
  full_name,
  phone_number,
  updated_at
FROM profiles
WHERE phone_number = '[NEW_PHONE]';

-- Expected: Should show the updated profile with new number


-- STEP 6: Log the change (audit trail)
-- =====================================================
-- Insert audit log (create this table if doesn't exist)
-- 
-- First time only: Create audit log table
-- CREATE TABLE IF NOT EXISTS admin_audit_log (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   action TEXT NOT NULL,
--   admin_user TEXT NOT NULL,
--   affected_user_id UUID NOT NULL,
--   old_value TEXT,
--   new_value TEXT,
--   reason TEXT,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

INSERT INTO admin_audit_log (
  action,
  admin_user,
  affected_user_id,
  old_value,
  new_value,
  reason,
  created_at
)
SELECT
  'PHONE_CHANGE' as action,
  '[YOUR_ADMIN_EMAIL]' as admin_user,  -- Replace with your email
  id as affected_user_id,
  '[OLD_PHONE]' as old_value,
  '[NEW_PHONE]' as new_value,
  '[REASON]' as reason,  -- e.g., "Customer lost phone"
  NOW() as created_at
FROM profiles
WHERE phone_number = '[NEW_PHONE]';


-- STEP 7: Verify everything
-- =====================================================
SELECT 
  'SUCCESS' as status,
  p.id,
  p.full_name,
  p.phone_number as new_phone,
  b.phone_number as backup_old_phone,
  p.updated_at
FROM profiles p
JOIN phone_change_backup b ON p.id = b.id
WHERE p.phone_number = '[NEW_PHONE]';


-- =====================================================
-- MANUAL STEP: Update auth.users table
-- =====================================================
-- 
-- This MUST be done through Supabase Dashboard:
-- 
-- 1. Go to Authentication → Users
-- 2. Search for user by email or ID (from results above)
-- 3. Click on user
-- 4. Update Phone field to: [NEW_PHONE]
-- 5. Click Save
-- 
-- Or use Admin API (requires service role key):
-- This cannot be done directly in SQL for security reasons
-- 
-- =====================================================


-- =====================================================
-- ROLLBACK (if something goes wrong)
-- =====================================================
-- 
-- To rollback changes:
-- 
-- UPDATE profiles
-- SET 
--   phone_number = (SELECT phone_number FROM phone_change_backup),
--   updated_at = NOW()
-- WHERE id = (SELECT id FROM phone_change_backup);
-- 
-- Then revert auth.users in Dashboard
-- 
-- =====================================================


-- =====================================================
-- CLEANUP
-- =====================================================
-- Drop temporary backup table
-- DROP TABLE IF EXISTS phone_change_backup;
-- 
-- Note: Keep the audit log for records!
-- =====================================================
