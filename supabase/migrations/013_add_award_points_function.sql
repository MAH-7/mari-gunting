-- =====================================================
-- ADD AWARD_POINTS FUNCTION
-- =====================================================
-- This function was referenced by other migrations but was missing
-- from the original 010_rewards_system.sql migration
-- =====================================================

-- Function: Award points (generic function for all point awards)
CREATE OR REPLACE FUNCTION award_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_transaction_id UUID;
  v_description TEXT;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Points amount must be positive';
  END IF;
  
  -- Validate type
  IF p_type NOT IN ('earn', 'admin_adjustment', 'refund', 'bonus') THEN
    RAISE EXCEPTION 'Invalid points type. Must be: earn, admin_adjustment, refund, or bonus';
  END IF;
  
  -- Get current balance
  SELECT points_balance INTO v_current_balance
  FROM profiles
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_current_balance + p_amount;
  
  -- Update user points balance
  UPDATE profiles
  SET 
    points_balance = v_new_balance,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Generate description based on type and metadata
  CASE p_type
    WHEN 'earn' THEN
      v_description := 'Earned from booking completion';
    WHEN 'admin_adjustment' THEN
      v_description := 'Admin adjustment: ' || COALESCE(p_metadata->>'reason', 'Manual adjustment');
    WHEN 'refund' THEN
      v_description := 'Points refunded';
    WHEN 'bonus' THEN
      v_description := 'Bonus points';
    ELSE
      v_description := 'Points awarded';
  END CASE;
  
  -- Override description if provided in metadata
  IF p_metadata ? 'description' THEN
    v_description := p_metadata->>'description';
  END IF;
  
  -- Record transaction
  INSERT INTO points_transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    booking_id,
    admin_notes
  ) VALUES (
    p_user_id,
    p_type,
    p_amount,
    v_new_balance,
    v_description,
    (p_metadata->>'booking_id')::UUID,
    p_metadata->>'admin_notes'
  )
  RETURNING id INTO v_transaction_id;
  
  -- Return success with details
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'previous_balance', v_current_balance,
    'points_awarded', p_amount,
    'new_balance', v_new_balance
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION award_points IS 'Award points to a user with transaction logging. Returns success status and new balance.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION award_points TO authenticated;

-- Update award_points_on_completion to use this new function
CREATE OR REPLACE FUNCTION award_points_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  points_to_award INTEGER;
  booking_subtotal DECIMAL(10,2);
BEGIN
  -- Only proceed if status changed to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Get the subtotal (service price, not including fees)
    booking_subtotal := NEW.subtotal;
    
    -- Calculate points: 10 points per RM
    points_to_award := FLOOR(booking_subtotal * 10);
    
    -- Award points if amount is positive
    IF points_to_award > 0 THEN
      
      -- Call the award_points function
      PERFORM award_points(
        NEW.customer_id,
        points_to_award,
        'earn',
        jsonb_build_object(
          'booking_id', NEW.id::text,
          'booking_number', NEW.booking_number,
          'subtotal', booking_subtotal,
          'description', 'Earned from booking #' || NEW.booking_number
        )
      );
      
      -- Log success
      RAISE NOTICE 'Awarded % points to customer % for booking %', 
        points_to_award, NEW.customer_id, NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION award_points_on_completion IS 'Trigger function: Awards points when booking status changes to completed';
