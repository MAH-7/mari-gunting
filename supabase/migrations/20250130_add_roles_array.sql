-- Migration: Add roles array to support multiple roles (Grab-style)
-- Date: 2025-01-30
-- Description: Allow users to have both customer and barber roles

-- Step 1: Add new roles column (nullable to start, for safety)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS roles TEXT[];

-- Step 2: Migrate existing data from 'role' to 'roles'
-- Default all existing users to their current role
UPDATE profiles 
SET roles = ARRAY[role]::TEXT[]
WHERE roles IS NULL AND role IS NOT NULL;

-- Step 3: Set default for new rows
ALTER TABLE profiles 
ALTER COLUMN roles SET DEFAULT ARRAY['customer']::TEXT[];

-- Step 4: Add users who are barbers to have both roles
-- (For users who already have barber records)
UPDATE profiles p
SET roles = CASE 
    WHEN 'customer' = ANY(p.roles) THEN array_append(p.roles, 'barber')
    ELSE ARRAY['customer', 'barber']::TEXT[]
END
FROM barbers b
WHERE b.user_id = p.id 
AND NOT ('barber' = ANY(p.roles));

-- Step 5: Add users who are barbershop owners to have both roles
UPDATE profiles p
SET roles = CASE 
    WHEN 'customer' = ANY(p.roles) THEN array_append(p.roles, 'barber')
    ELSE ARRAY['customer', 'barber']::TEXT[]
END
FROM barbershops bs
WHERE bs.owner_id = p.id 
AND NOT ('barber' = ANY(p.roles));

-- Step 6: Create index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_roles 
ON profiles USING GIN (roles);

-- Step 7: Add constraint to ensure roles is never empty
ALTER TABLE profiles
ADD CONSTRAINT check_roles_not_empty 
CHECK (array_length(roles, 1) > 0);

-- IMPORTANT: Keep 'role' column for backward compatibility
-- Do NOT drop it. Old code will continue to work.
-- New code should use 'roles' array.

-- Helper function to check if user has a role
CREATE OR REPLACE FUNCTION has_role(user_roles TEXT[], check_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN check_role = ANY(user_roles);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Example usage: SELECT * FROM profiles WHERE has_role(roles, 'barber');
