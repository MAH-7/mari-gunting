-- ============================================================================
-- PRODUCTION FIX: Auto-set verification status to pending
-- ============================================================================
-- Problem: Users submit onboarding but status stays 'unverified'
-- Solution: Database trigger + default value + proper RLS policies
-- ============================================================================

-- 1. Set default verification_status to 'pending' for new records
ALTER TABLE barbers 
ALTER COLUMN verification_status SET DEFAULT 'pending';

ALTER TABLE barbershops 
ALTER COLUMN verification_status SET DEFAULT 'pending';

-- 2. Update existing unverified records to pending (one-time migration)
UPDATE barbers 
SET verification_status = 'pending' 
WHERE verification_status = 'unverified';

UPDATE barbershops 
SET verification_status = 'pending' 
WHERE verification_status = 'unverified';

-- 3. Drop old policies if they exist
DROP POLICY IF EXISTS "Users can update own verification status" ON barbers;
DROP POLICY IF EXISTS "Owners can update own verification status" ON barbershops;
DROP POLICY IF EXISTS "Users can update own barber record" ON barbers;
DROP POLICY IF EXISTS "Owners can update own barbershop record" ON barbershops;

-- 4. Create comprehensive UPDATE policies for authenticated users
CREATE POLICY "Users can update own barber record"
ON barbers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update own barbershop record"
ON barbershops
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- 5. Ensure SELECT policies exist (needed to verify updates)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'barbers' 
        AND policyname = 'Users can view own barber record'
    ) THEN
        CREATE POLICY "Users can view own barber record"
        ON barbers
        FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'barbershops' 
        AND policyname = 'Owners can view own barbershop record'
    ) THEN
        CREATE POLICY "Owners can view own barbershop record"
        ON barbershops
        FOR SELECT
        TO authenticated
        USING (auth.uid() = owner_id);
    END IF;
END $$;

-- 6. Grant necessary permissions
GRANT UPDATE ON barbers TO authenticated;
GRANT UPDATE ON barbershops TO authenticated;

-- ============================================================================
-- Verification queries (run these to check if it worked)
-- ============================================================================

-- Check barbers table
SELECT 
    'barbers' as table_name,
    verification_status, 
    COUNT(*) as count
FROM barbers 
GROUP BY verification_status;

-- Check barbershops table
SELECT 
    'barbershops' as table_name,
    verification_status, 
    COUNT(*) as count
FROM barbershops 
GROUP BY verification_status;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as command,
    roles
FROM pg_policies 
WHERE tablename IN ('barbers', 'barbershops')
ORDER BY tablename, policyname;
