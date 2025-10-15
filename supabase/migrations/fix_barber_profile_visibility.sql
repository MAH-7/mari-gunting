-- Fix barber profile visibility for anonymous users
-- This allows the customer app to view barber profiles even without authentication

-- Drop the existing restrictive policy if it exists
DROP POLICY IF EXISTS "Public profiles viewable by authenticated users" ON profiles;

-- Create a new policy that allows viewing barber profiles for discovery
-- This allows anon users to see profiles of active barbers
CREATE POLICY "Barber profiles viewable by all for discovery"
  ON profiles FOR SELECT
  USING (
    is_active = TRUE AND
    (
      -- Allow viewing own profile
      auth.uid() = id OR
      -- Allow viewing barber profiles (users who have a barber record)
      EXISTS (
        SELECT 1 FROM barbers
        WHERE barbers.user_id = profiles.id
      ) OR
      -- Allow viewing barbershop owner profiles
      EXISTS (
        SELECT 1 FROM barbershops
        WHERE barbershops.owner_id = profiles.id
      )
    )
  );

-- Re-create the restrictive policy for non-barber profiles
-- This ensures customer profiles remain private
CREATE POLICY "Own profile viewable by user"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Add explicit logging to help debug
COMMENT ON POLICY "Barber profiles viewable by all for discovery" ON profiles IS 
  'Allows anonymous and authenticated users to view profiles of barbers and barbershop owners for discovery purposes. Customer profiles remain private.';
