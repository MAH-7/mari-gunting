-- ============================================
-- Migration: Prevent Financial Field Updates in Bookings
-- Security Fix: HIGH #3 - Partner Earnings Manipulation
-- Date: 2025-11-11
-- Approach: Use TRIGGER (OLD/NEW works in triggers, not RLS)
-- ============================================

-- Create trigger function to prevent financial field changes
CREATE OR REPLACE FUNCTION public.prevent_booking_financial_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Allow service_role (admin) to update everything
  IF current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Prevent modifying financial fields
  IF OLD.services IS DISTINCT FROM NEW.services THEN
    RAISE EXCEPTION 'Security: Cannot modify services after booking is created';
  END IF;

  IF OLD.subtotal IS DISTINCT FROM NEW.subtotal THEN
    RAISE EXCEPTION 'Security: Cannot modify subtotal after booking is created';
  END IF;

  IF OLD.service_fee IS DISTINCT FROM NEW.service_fee THEN
    RAISE EXCEPTION 'Security: Cannot modify service_fee after booking is created';
  END IF;

  IF OLD.travel_fee IS DISTINCT FROM NEW.travel_fee THEN
    RAISE EXCEPTION 'Security: Cannot modify travel_fee after booking is created';
  END IF;

  IF OLD.discount_amount IS DISTINCT FROM NEW.discount_amount THEN
    RAISE EXCEPTION 'Security: Cannot modify discount_amount after booking is created';
  END IF;

  IF OLD.total_price IS DISTINCT FROM NEW.total_price THEN
    RAISE EXCEPTION 'Security: Cannot modify total_price after booking is created';
  END IF;

  IF OLD.payment_method IS DISTINCT FROM NEW.payment_method THEN
    RAISE EXCEPTION 'Security: Cannot modify payment_method after booking is created';
  END IF;

  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    RAISE EXCEPTION 'Security: Cannot modify payment_status after booking is created';
  END IF;

  -- Prevent changing booking ownership
  IF OLD.customer_id IS DISTINCT FROM NEW.customer_id THEN
    RAISE EXCEPTION 'Security: Cannot reassign booking to different customer';
  END IF;

  IF OLD.barber_id IS DISTINCT FROM NEW.barber_id THEN
    RAISE EXCEPTION 'Security: Cannot reassign booking to different barber';
  END IF;

  IF OLD.barbershop_id IS DISTINCT FROM NEW.barbershop_id THEN
    RAISE EXCEPTION 'Security: Cannot reassign booking to different barbershop';
  END IF;

  -- Prevent changing scheduled time
  IF OLD.scheduled_date IS DISTINCT FROM NEW.scheduled_date THEN
    RAISE EXCEPTION 'Security: Cannot modify scheduled_date after booking is created';
  END IF;

  IF OLD.scheduled_time IS DISTINCT FROM NEW.scheduled_time THEN
    RAISE EXCEPTION 'Security: Cannot modify scheduled_time after booking is created';
  END IF;

  IF OLD.scheduled_datetime IS DISTINCT FROM NEW.scheduled_datetime THEN
    RAISE EXCEPTION 'Security: Cannot modify scheduled_datetime after booking is created';
  END IF;

  -- All checks passed, allow the update
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_prevent_booking_financial_updates ON public.bookings;

-- Create trigger on bookings table (runs BEFORE any update)
CREATE TRIGGER trigger_prevent_booking_financial_updates
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_booking_financial_updates();

-- Add documentation
COMMENT ON FUNCTION public.prevent_booking_financial_updates() IS 
  'SECURITY FIX (HIGH #3): Prevents partners/customers from modifying financial fields after booking creation. Blocks earnings manipulation fraud.';

COMMENT ON TRIGGER trigger_prevent_booking_financial_updates ON public.bookings IS
  'SECURITY: Enforces immutability of financial fields. Partners can update status/location/notes only.';

-- Verification queries
-- Run these to confirm the fix is working:
--
-- 1. Check trigger exists:
-- SELECT trigger_name, event_manipulation, action_timing, event_object_table
-- FROM information_schema.triggers
-- WHERE trigger_name = 'trigger_prevent_booking_financial_updates';
--
-- 2. Test blocking financial update (should fail):
-- UPDATE bookings SET travel_fee = 999 WHERE id = '<some-booking-id>';
--
-- 3. Test allowing status update (should work):
-- UPDATE bookings SET status = 'completed' WHERE id = '<some-booking-id>';
