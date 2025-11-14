-- Migration: Fix loyalty points trigger to use correct column name
-- Issue: Trigger references 'loyalty_points' but profiles table has 'points_balance'
-- Fix: Update trigger to use 'points_balance' instead
-- Date: 2025-11-14

CREATE OR REPLACE FUNCTION award_points_on_payment_capture()
RETURNS TRIGGER AS $$
DECLARE
  points_to_award INTEGER;
  current_points INTEGER;
BEGIN
  -- Only award points when payment_status changes to 'completed'
  IF NEW.payment_status = 'completed' AND OLD.payment_status != 'completed' THEN
    
    -- Only award points if not already awarded and service completed successfully
    IF NEW.status = 'completed' AND NEW.disputed_at IS NULL THEN
      
      -- Calculate points: 10 points per RM spent
      points_to_award := FLOOR(NEW.total_price * 10);
      
      -- Get current points (use points_balance, not loyalty_points)
      SELECT COALESCE(points_balance, 0) INTO current_points
      FROM profiles
      WHERE id = NEW.customer_id;
      
      -- Award points (use points_balance, not loyalty_points)
      UPDATE profiles
      SET 
        points_balance = COALESCE(points_balance, 0) + points_to_award,
        updated_at = NOW()
      WHERE id = NEW.customer_id;
      
      -- Create transaction record
      INSERT INTO points_transactions (
        user_id,
        type,
        amount,
        balance_after,
        description,
        booking_id
      ) VALUES (
        NEW.customer_id,
        'earn',
        points_to_award,
        current_points + points_to_award,
        'Earned ' || points_to_award || ' points from booking #' || NEW.booking_number,
        NEW.id
      );
      
      RAISE NOTICE '🎁 Loyalty points awarded: % points to customer % (Total: % → %)', 
        points_to_award, NEW.customer_id, current_points, current_points + points_to_award;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION award_points_on_payment_capture IS 
'Awards loyalty points to customer when payment is captured (payment_status → completed).
Uses profiles.points_balance column (not loyalty_points).
Points = 10 points per RM spent.';
