-- Add unique constraint to phone_number in profiles table
-- This prevents duplicate phone numbers at the database level

-- First, remove any duplicate phone numbers if they exist
-- (Keep the oldest profile for each phone number)
DELETE FROM public.profiles a
USING public.profiles b
WHERE a.phone_number = b.phone_number
  AND a.created_at > b.created_at;

-- Now add the unique constraint
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_phone_number_unique UNIQUE (phone_number);

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON public.profiles(phone_number);

-- Add comment for documentation
COMMENT ON CONSTRAINT profiles_phone_number_unique ON public.profiles IS 
'Ensures each phone number can only be registered once';
