-- Fix the get_customer_addresses function to properly return addresses

-- Drop the existing function first
DROP FUNCTION IF EXISTS get_customer_addresses(UUID) CASCADE;

-- Now create the new function
CREATE OR REPLACE FUNCTION get_customer_addresses(p_user_id UUID)
RETURNS SETOF customer_addresses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT * 
  FROM customer_addresses
  WHERE user_id = p_user_id
  ORDER BY 
    is_default DESC,
    last_used_at DESC NULLS LAST,
    created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_customer_addresses TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_addresses TO anon;

-- Test query to verify addresses exist
-- Run this separately to check if the address was actually saved
SELECT * FROM customer_addresses 
WHERE user_id IN (SELECT auth.uid())
ORDER BY created_at DESC;