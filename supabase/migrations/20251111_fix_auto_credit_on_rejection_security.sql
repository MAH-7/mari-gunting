-- ============================================
-- Security Fix: auto_credit_on_rejection
-- Issue: Customers get FREE credits when barber rejects unpaid bookings
-- Date: 2025-11-11
-- ============================================

-- Drop and recreate the function with fixed logic
CREATE OR REPLACE FUNCTION public.auto_credit_on_rejection()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only process if status changed TO 'rejected'
  IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    
    -- SECURITY FIX: Only credit if payment was ACTUALLY COMPLETED
    -- Old logic: payment_status IN ('pending', 'completed') ❌ WRONG!
    -- New logic: payment_status = 'completed' OR 'authorized' ✅ CORRECT!
    
    IF NEW.payment_status IN ('completed', 'authorized') 
       AND NEW.payment_method != 'cash' THEN
      
      -- Add credit for the booking amount (this is a REFUND, not free money)
      PERFORM add_customer_credit(
        NEW.customer_id,
        NEW.total_price,
        'refund',
        'Refund for rejected booking #' || NEW.booking_number,
        NEW.id,
        jsonb_build_object(
          'booking_number', NEW.booking_number,
          'original_amount', NEW.total_price,
          'payment_method', NEW.payment_method,
          'rejection_reason', NEW.cancellation_reason
        )
      );
      
      -- Log the action
      RAISE NOTICE 'Auto-credited RM % to customer % for rejected booking % (payment was: %)', 
        NEW.total_price, NEW.customer_id, NEW.id, NEW.payment_status;
    ELSE
      -- Log when NO credit is given (for monitoring)
      RAISE NOTICE 'No credit given for rejected booking % - payment_status: %, payment_method: %',
        NEW.id, NEW.payment_status, NEW.payment_method;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Add comment explaining the security fix
COMMENT ON FUNCTION public.auto_credit_on_rejection() IS 
  'SECURITY FIX: Only refunds credits if customer actually paid (completed/authorized). Prevents free credit exploit when barber rejects unpaid bookings.';

-- ============================================
-- Verification
-- ============================================
-- After applying, test these scenarios:
--
-- Test 1: Reject BEFORE payment (should NOT give credit)
-- 1. Create booking
-- 2. Barber rejects (payment_status = 'pending')
-- 3. Expected: No credit given ✅
--
-- Test 2: Reject AFTER payment (should give refund as credit)
-- 1. Create booking
-- 2. Customer pays (payment_status = 'authorized' or 'completed')
-- 3. Barber rejects
-- 4. Expected: Credit = refund ✅
