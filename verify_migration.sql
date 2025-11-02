-- Verification Script: Check if migration was applied correctly
-- Run this in Supabase SQL Editor

-- 1. Check if setup_freelance_barber function exists and has roles array logic
SELECT 
    routine_name,
    CASE 
        WHEN routine_definition LIKE '%array_append(roles%' THEN '✅ Has roles array logic'
        ELSE '❌ Missing roles array logic'
    END as status
FROM information_schema.routines 
WHERE routine_name = 'setup_freelance_barber' 
AND routine_schema = 'public';

-- 2. Check if setup_barbershop_owner function exists and has roles array logic
SELECT 
    routine_name,
    CASE 
        WHEN routine_definition LIKE '%array_append%array_remove(roles%' THEN '✅ Has roles array logic'
        ELSE '❌ Missing roles array logic'
    END as status
FROM information_schema.routines 
WHERE routine_name = 'setup_barbershop_owner' 
AND routine_schema = 'public';

-- 3. Check profiles table structure
SELECT 
    column_name, 
    data_type,
    CASE 
        WHEN column_name = 'roles' AND data_type = 'ARRAY' THEN '✅ Roles array exists'
        WHEN column_name = 'role' THEN '✅ Role column exists (backward compatibility)'
        ELSE column_name
    END as status
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('role', 'roles')
ORDER BY column_name;

-- 4. Sample check: Show some user roles
SELECT 
    phone_number,
    role as primary_role,
    roles as roles_array,
    CASE 
        WHEN 'barber' = ANY(roles) THEN '✅ Has barber role'
        WHEN 'barbershop_owner' = ANY(roles) THEN '✅ Has barbershop_owner role'
        WHEN 'customer' = ANY(roles) THEN '✅ Has customer role'
        ELSE '⚠️ No roles'
    END as role_check
FROM profiles 
LIMIT 5;

-- 5. Check for users with incorrect roles (barber role but no barber record)
SELECT 
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No users with incorrect barber role'
        ELSE '⚠️ Found users with barber role but no barber record'
    END as status
FROM profiles p
WHERE 'barber' = ANY(p.roles)
AND NOT EXISTS (SELECT 1 FROM barbers WHERE user_id = p.id);

-- 6. Check for users with incorrect barbershop_owner role
SELECT 
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No users with incorrect barbershop_owner role'
        ELSE '⚠️ Found users with barbershop_owner role but no barbershop record'
    END as status
FROM profiles p
WHERE 'barbershop_owner' = ANY(p.roles)
AND NOT EXISTS (SELECT 1 FROM barbershops WHERE owner_id = p.id);

-- 7. Check for invalid role combinations (barber + barbershop_owner)
SELECT 
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No invalid role combinations'
        ELSE '❌ Found users with both barber AND barbershop_owner roles'
    END as status
FROM profiles
WHERE 'barber' = ANY(roles) 
AND 'barbershop_owner' = ANY(roles);

-- Done! Review the results above.
