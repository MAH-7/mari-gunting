-- Check if the dev mode UUID profile already exists
SELECT 
  id,
  role,
  full_name,
  phone_number,
  created_at
FROM profiles
WHERE id = '60111111-1115-0000-0000-000000000000'
   OR phone_number = '+601111111115';

-- If you see a result, that's why registration is failing!
-- The RLS policy prevents duplicate profiles

-- TO FIX: Delete the existing profile
-- DELETE FROM profiles WHERE phone_number = '+601111111115';
