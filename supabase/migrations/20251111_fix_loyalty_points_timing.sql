-- Migration: Fix Loyalty Points Timing - Award After Payment Capture
-- Description: Points should be awarded after payment is captured, not just on service completion
-- Issue: With queue system, points are awarded before customer confirms, allowing dispute abuse
-- Fix: Award points when payment_status changes to 'completed' (payment captured)
-- Date: 2025-11-11

-- Drop old trigger that awards on service completion
DROP TRIGGER IF EXISTS trigger_award_points_on_completion ON bookings;
DROP TRIGGER IF EXISTS trigger_award_booking_points ON bookings;

-- Create new function: Award points when payment is captured
CREATE OR REPLACE FUNCTION award_points_on_payment_capture()
RETURNS TRIGGER AS $$
DECLARE
  points_to_award INTEGER;
  current_points INTEGER;
BEGIN
  -- Only award points when payment_status changes to 'completed'
  -- This happens when:
  -- 1. Customer confirms service completion (immediate capture)
  -- 2. Auto-capture after 2 hours (queue processor)
  IF NEW.payment_status = 'completed' AND OLD.payment_status != 'completed' THEN
    
    -- Only award points if not already awarded and service completed successfully
    IF NEW.status = 'completed' AND NOT NEW.disputed_at IS NOT NULL THEN
      
      -- Calculate points: 1 point per RM spent (total_price)
      points_to_award := FLOOR(NEW.total_price);
      
      -- Get current points
      SELECT COALESCE(loyalty_points, 0) INTO current_points
      FROM profiles
      WHERE id = NEW.customer_id;
      
      -- Award points
      UPDATE profiles
      SET 
        loyalty_points = COALESCE(loyalty_points, 0) + points_to_award,
        updated_at = NOW()
      WHERE id = NEW.customer_id;
      
      RAISE NOTICE '🎁 Loyalty points awarded: % points to customer % (Total: % → %)', 
        points_to_award, NEW.customer_id, current_points, current_points + points_to_award;
      
      RAISE NOTICE '💰 Payment captured for booking %: RM %', NEW.id, NEW.total_price;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger: Award points on payment capture
CREATE TRIGGER trigger_award_points_on_payment_capture
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION award_points_on_payment_capture();

COMMENT ON FUNCTION award_points_on_payment_capture IS 
'Awards loyalty points to customer when payment is captured (payment_status → completed).
Points = 1 point per RM spent.
Only awards if service completed successfully and not disputed.
Aligned with queue-based payment capture system.';

-- Test notification
DO $$
BEGIN
  RAISE NOTICE '✅ Loyalty points timing fixed!';
  RAISE NOTICE '📋 Old behavior: Points awarded on status=completed';
  RAISE NOTICE '📋 New behavior: Points awarded on payment_status=completed';
  RAISE NOTICE '🎁 Points formula: 1 point per RM (floor of total_price)';
  RAISE NOTICE '🚫 No points if disputed';
  RAISE NOTICE '⏰ Aligned with 2-hour queue system';
END $$;
