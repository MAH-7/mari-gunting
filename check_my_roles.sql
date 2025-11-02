-- Check your actual roles in database
-- Run this in Supabase SQL Editor

-- Show all users with their roles
SELECT 
    phone_number,
    role as primary_role,
    roles as roles_array,
    created_at,
    updated_at
FROM profiles
ORDER BY updated_at DESC
LIMIT 10;

-- Check if you have barber record
SELECT 
    p.phone_number,
    p.role,
    p.roles,
    b.id as barber_id,
    b.verification_status
FROM profiles p
LEFT JOIN barbers b ON b.user_id = p.id
ORDER BY p.updated_at DESC
LIMIT 10;
