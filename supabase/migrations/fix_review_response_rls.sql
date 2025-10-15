-- =====================================================
-- FIX REVIEW RESPONSE RLS POLICIES
-- =====================================================
-- This migration fixes the RLS policies to allow partners
-- (barbers and barbershop owners) to respond to reviews
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Barbers can respond to reviews" ON reviews;
DROP POLICY IF EXISTS "Barbershop owners can respond to reviews" ON reviews;

-- Recreate barber response policy with both USING and WITH CHECK
CREATE POLICY "Barbers can respond to reviews"
  ON reviews FOR UPDATE
  USING (
    barber_id IN (
      SELECT id FROM barbers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    barber_id IN (
      SELECT id FROM barbers WHERE user_id = auth.uid()
    )
  );

-- Recreate barbershop owner response policy with both USING and WITH CHECK
CREATE POLICY "Barbershop owners can respond to reviews"
  ON reviews FOR UPDATE
  USING (
    barbershop_id IN (
      SELECT id FROM barbershops WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    barbershop_id IN (
      SELECT id FROM barbershops WHERE owner_id = auth.uid()
    )
  );

-- Verify the policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'reviews' 
AND policyname LIKE '%respond%'
ORDER BY policyname;
