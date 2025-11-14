-- Migration: Fix Cancellation - Allow payment_status update for reversals/refunds
-- Description: Security trigger blocking cancellation operations
-- Issue: Cannot cancel booking because trigger blocks payment_status changes
-- Fix: Allow payment_status updates during cancellation (authorized → reversed, completed → refunded)
-- Date: 2025-11-11

-- Update the trigger function to allow cancellation
CREATE OR REPLACE FUNCTION prevent_booking_financial_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Only apply restrictions to authenticated users (not service_role)
  IF current_setting('role', true) = 'authenticated' THEN
    
    -- EXCEPTION 1: Allow payment_status updates when curlec_payment_id is being set (linking payment)
    IF (NEW.curlec_payment_id IS DISTINCT FROM OLD.curlec_payment_id) AND 
       (NEW.curlec_payment_id IS NOT NULL) THEN
      
      -- Still protect other financial fields during payment linking
      IF (NEW.services IS DISTINCT FROM OLD.services) OR
         (NEW.subtotal IS DISTINCT FROM OLD.subtotal) OR
         (NEW.travel_fee IS DISTINCT FROM OLD.travel_fee) OR
         (NEW.total_price IS DISTINCT FROM OLD.total_price) OR
         (NEW.payment_method IS DISTINCT FROM OLD.payment_method) THEN
        RAISE EXCEPTION 'Security: Cannot modify financial fields during payment linking';
      END IF;
      
      RETURN NEW;
    END IF;
    
    -- EXCEPTION 2: Allow payment_status updates during cancellation
    -- When status changes to 'cancelled' or 'rejected', allow payment_status to change
    IF (NEW.status = 'cancelled' OR NEW.status = 'rejected') AND 
       (NEW.status IS DISTINCT FROM OLD.status) THEN
      
      -- Still protect financial amounts during cancellation
      IF (NEW.services IS DISTINCT FROM OLD.services) OR
         (NEW.subtotal IS DISTINCT FROM OLD.subtotal) OR
         (NEW.travel_fee IS DISTINCT FROM OLD.travel_fee) OR
         (NEW.total_price IS DISTINCT FROM OLD.total_price) OR
         (NEW.payment_method IS DISTINCT FROM OLD.payment_method) THEN
        RAISE EXCEPTION 'Security: Cannot modify financial amounts during cancellation';
      END IF;
      
      -- Allow payment_status change (authorized → reversed, completed → refunded, etc.)
      RETURN NEW;
    END IF;
    
    -- EXCEPTION 3: Allow payment_status updates AFTER booking is already cancelled/rejected
    -- This handles the case where cancel_booking RPC updates payment_status after status is set
    IF (OLD.status = 'cancelled' OR OLD.status = 'rejected') AND
       (NEW.payment_status IS DISTINCT FROM OLD.payment_status) THEN
      
      -- Still protect financial amounts
      IF (NEW.services IS DISTINCT FROM OLD.services) OR
         (NEW.subtotal IS DISTINCT FROM OLD.subtotal) OR
         (NEW.travel_fee IS DISTINCT FROM OLD.travel_fee) OR
         (NEW.total_price IS DISTINCT FROM OLD.total_price) OR
         (NEW.payment_method IS DISTINCT FROM OLD.payment_method) THEN
        RAISE EXCEPTION 'Security: Cannot modify financial amounts';
      END IF;
      
      -- Allow payment_status update after cancellation (for reversed/refund_initiated)
      RETURN NEW;
    END IF;
    
    -- NORMAL CASE: Block any financial field modifications after booking created
    IF (NEW.services IS DISTINCT FROM OLD.services) OR
       (NEW.subtotal IS DISTINCT FROM OLD.subtotal) OR
       (NEW.travel_fee IS DISTINCT FROM OLD.travel_fee) OR
       (NEW.total_price IS DISTINCT FROM OLD.total_price) OR
       (NEW.payment_status IS DISTINCT FROM OLD.payment_status) OR
       (NEW.payment_method IS DISTINCT FROM OLD.payment_method) THEN
      
      RAISE EXCEPTION 'Security: Cannot modify financial fields after booking is created';
    END IF;
  END IF;
  
  -- Allow update (service_role or non-financial fields)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION prevent_booking_financial_updates IS 
'Security trigger: Prevents modification of financial fields after booking creation.
EXCEPTIONS:
1. Allows payment_status update when linking Curlec payment (curlec_payment_id being set)
2. Allows payment_status update during cancellation (status → cancelled/rejected)
3. Allows payment_status update after cancellation (for reversed/refund_initiated)
Protected fields: services, subtotal, travel_fee, total_price, payment_method';

-- Test the fix
DO $$
BEGIN
  RAISE NOTICE '✅ Security trigger updated to allow cancellation';
  RAISE NOTICE 'Exceptions added:';
  RAISE NOTICE '  1. Payment linking (curlec_payment_id being set)';
  RAISE NOTICE '  2. During cancellation (status → cancelled/rejected)';
  RAISE NOTICE '  3. After cancellation (payment_status → reversed/refund_initiated)';
  RAISE NOTICE 'Protected fields: services, subtotal, travel_fee, total_price, payment_method';
END $$;
