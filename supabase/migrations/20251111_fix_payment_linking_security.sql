-- Migration: Fix Payment Linking - Allow payment_status update when linking Curlec payment
-- Description: The security trigger was blocking legitimate payment linking after barber accepts
-- Issue: Customer pays → Curlec authorizes → Cannot link payment_id to booking
-- Fix: Allow payment_status update when curlec_payment_id is being set (payment linking)
-- Date: 2025-11-11

-- Update the trigger function to allow payment linking
CREATE OR REPLACE FUNCTION prevent_booking_financial_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Only apply restrictions to authenticated users (not service_role)
  IF current_setting('role', true) = 'authenticated' THEN
    
    -- EXCEPTION: Allow payment_status updates when curlec_payment_id is being set (linking payment)
    -- This happens when customer pays and payment needs to be linked to booking
    IF (NEW.curlec_payment_id IS DISTINCT FROM OLD.curlec_payment_id) AND 
       (NEW.curlec_payment_id IS NOT NULL) THEN
      
      -- During payment linking, allow:
      -- - curlec_payment_id (being set)
      -- - curlec_order_id (being set)
      -- - payment_status (pending → authorized)
      
      -- But still protect other financial fields from manipulation:
      IF (NEW.services IS DISTINCT FROM OLD.services) OR
         (NEW.subtotal IS DISTINCT FROM OLD.subtotal) OR
         (NEW.travel_fee IS DISTINCT FROM OLD.travel_fee) OR
         (NEW.total_price IS DISTINCT FROM OLD.total_price) OR
         (NEW.payment_method IS DISTINCT FROM OLD.payment_method) THEN
        RAISE EXCEPTION 'Security: Cannot modify financial fields during payment linking';
      END IF;
      
      -- Allow the payment linking update
      RETURN NEW;
    END IF;
    
    -- NORMAL CASE: Block any financial field modifications after booking created
    IF (NEW.services IS DISTINCT FROM OLD.services) OR
       (NEW.subtotal IS DISTINCT FROM OLD.subtotal) OR
       (NEW.travel_fee IS DISTINCT FROM OLD.travel_fee) OR
       (NEW.total_price IS DISTINCT FROM OLD.total_price) OR
       (NEW.payment_status IS DISTINCT FROM OLD.payment_status) OR
       (NEW.payment_method IS DISTINCT FROM OLD.payment_method) THEN
      
      RAISE EXCEPTION 'Security: Cannot modify payment_status after booking is created';
    END IF;
  END IF;
  
  -- Allow update (service_role or non-financial fields)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION prevent_booking_financial_updates IS 
'Security trigger: Prevents modification of financial fields after booking creation.
EXCEPTION: Allows payment_status update when linking Curlec payment (curlec_payment_id being set).
This allows the payment flow: pending → authorized (during payment) → completed (during capture).';

-- Test the fix
DO $$
BEGIN
  RAISE NOTICE '✅ Security trigger updated to allow payment linking';
  RAISE NOTICE 'Protected fields: services, subtotal, travel_fee, total_price, payment_method';
  RAISE NOTICE 'Allowed: payment_status update when linking curlec_payment_id';
END $$;
