-- Add unique constraint to owner_id in barbershops table
-- This ensures one barbershop per owner (matching barbers.user_id unique constraint)

-- First, delete any duplicate records (keeping the most recent one)
DELETE FROM barbershops a
USING barbershops b
WHERE a.id < b.id 
  AND a.owner_id = b.owner_id;

-- Add unique index on owner_id
CREATE UNIQUE INDEX IF NOT EXISTS barbershops_owner_id_unique 
ON public.barbershops USING btree (owner_id);

-- Comment
COMMENT ON INDEX barbershops_owner_id_unique IS 'Ensures one barbershop per owner, matching barbers.user_id unique constraint';
