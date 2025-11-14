-- Migration: Fix Loyalty Points Formula (10 points per RM)
-- Description: Backend was awarding 1 point per RM, frontend expects 10 points per RM
-- Issue: Mismatch between database trigger and frontend calculation
-- Fix: Update trigger to award 10 points per RM (FLOOR(total_price * 10))
-- Date: 2025-11-12

-- Update function with correct formula
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
      
      -- Calculate points: 10 points per RM spent (total_price * 10)
      -- Example: RM 50 = 500 points
      points_to_award := FLOOR(NEW.total_price * 10);
      
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
      
      RAISE NOTICE '💰 Payment captured for booking %: RM % = % points', 
        NEW.id, NEW.total_price, points_to_award;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION award_points_on_payment_capture IS 
'Awards loyalty points to customer when payment is captured (payment_status → completed).
Points = 10 points per RM spent.
Example: RM 50 booking = 500 points.
Only awards if service completed successfully and not disputed.
Aligned with queue-based payment capture system.';

-- Test notification
DO $$
BEGIN
  RAISE NOTICE '✅ Loyalty points formula fixed!';
  RAISE NOTICE '📋 Old: 1 point per RM (RM 50 = 50 points) ❌';
  RAISE NOTICE '📋 New: 10 points per RM (RM 50 = 500 points) ✅';
  RAISE NOTICE '🎁 Matches frontend calculation';
  RAISE NOTICE '🚫 No points if disputed';
  RAISE NOTICE '⏰ Aligned with 2-hour queue system';
END $$;
