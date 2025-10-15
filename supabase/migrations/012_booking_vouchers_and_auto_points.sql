-- =====================================================
-- BOOKING VOUCHERS AND AUTOMATIC POINTS SYSTEM
-- =====================================================
-- This migration adds:
-- 1. booking_vouchers table to track voucher usage on bookings
-- 2. Automatic points awarding when booking is completed
-- 3. Functions to apply vouchers to bookings
-- =====================================================

-- =====================================================
-- 1. BOOKING VOUCHERS TABLE
-- Tracks which vouchers were used on which bookings
-- =====================================================
CREATE TABLE IF NOT EXISTS booking_vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_voucher_id UUID NOT NULL REFERENCES user_vouchers(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Discount details (snapshot at time of use)
  voucher_code TEXT NOT NULL,
  voucher_title TEXT NOT NULL,
  discount_amount DECIMAL(10,2),
  discount_percent INTEGER,
  original_total DECIMAL(10,2) NOT NULL,
  discount_applied DECIMAL(10,2) NOT NULL,
  final_total DECIMAL(10,2) NOT NULL,
  
  -- Metadata
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_booking_voucher UNIQUE(booking_id)
);

-- Index for lookups
CREATE INDEX idx_booking_vouchers_booking ON booking_vouchers(booking_id);
CREATE INDEX idx_booking_vouchers_user_voucher ON booking_vouchers(user_voucher_id);
CREATE INDEX idx_booking_vouchers_customer ON booking_vouchers(customer_id);

-- =====================================================
-- 2. RLS POLICIES FOR BOOKING_VOUCHERS
-- =====================================================
ALTER TABLE booking_vouchers ENABLE ROW LEVEL SECURITY;

-- Users can view their own booking vouchers
CREATE POLICY "Users can view own booking vouchers"
  ON booking_vouchers
  FOR SELECT
  USING (auth.uid() = customer_id);

-- Users can insert their own booking vouchers (via booking creation)
CREATE POLICY "Users can insert own booking vouchers"
  ON booking_vouchers
  FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- =====================================================
-- 3. FUNCTION: Award Points on Booking Completion
-- =====================================================
-- This function is triggered when a booking status changes to 'completed'
-- It awards points to the customer based on the booking subtotal
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
        'booking_completed',
        jsonb_build_object(
          'booking_id', NEW.id,
          'booking_number', NEW.booking_number,
          'subtotal', booking_subtotal
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

-- =====================================================
-- 4. TRIGGER: Auto Award Points on Completion
-- =====================================================
DROP TRIGGER IF EXISTS trigger_award_points_on_completion ON bookings;

CREATE TRIGGER trigger_award_points_on_completion
  AFTER INSERT OR UPDATE OF status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION award_points_on_completion();

-- =====================================================
-- 5. FUNCTION: Apply Voucher to Booking
-- =====================================================
-- This function applies a user's voucher to a booking
-- It creates a booking_voucher record and updates the user_voucher status
CREATE OR REPLACE FUNCTION apply_voucher_to_booking(
  p_booking_id UUID,
  p_user_voucher_id UUID,
  p_original_total DECIMAL(10,2),
  p_discount_applied DECIMAL(10,2),
  p_final_total DECIMAL(10,2)
)
RETURNS jsonb AS $$
DECLARE
  v_customer_id UUID;
  v_user_voucher RECORD;
  v_booking_voucher_id UUID;
BEGIN
  -- Get customer ID from booking
  SELECT customer_id INTO v_customer_id
  FROM bookings
  WHERE id = p_booking_id;
  
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;
  
  -- Verify the voucher belongs to this customer and is available
  SELECT * INTO v_user_voucher
  FROM user_vouchers
  WHERE id = p_user_voucher_id
    AND user_id = v_customer_id
    AND status = 'available';
  
  IF v_user_voucher IS NULL THEN
    RAISE EXCEPTION 'Voucher not available or does not belong to user';
  END IF;
  
  -- Check if voucher is expired
  IF v_user_voucher.expires_at IS NOT NULL AND v_user_voucher.expires_at < NOW() THEN
    RAISE EXCEPTION 'Voucher has expired';
  END IF;
  
  -- Mark voucher as used
  UPDATE user_vouchers
  SET 
    status = 'used',
    used_at = NOW(),
    booking_id = p_booking_id
  WHERE id = p_user_voucher_id;
  
  -- Create booking_voucher record
  INSERT INTO booking_vouchers (
    booking_id,
    user_voucher_id,
    customer_id,
    voucher_code,
    voucher_title,
    discount_amount,
    discount_percent,
    original_total,
    discount_applied,
    final_total
  )
  VALUES (
    p_booking_id,
    p_user_voucher_id,
    v_customer_id,
    v_user_voucher.code,
    v_user_voucher.title,
    v_user_voucher.discount_amount,
    v_user_voucher.discount_percent,
    p_original_total,
    p_discount_applied,
    p_final_total
  )
  RETURNING id INTO v_booking_voucher_id;
  
  -- Update booking discount_amount
  UPDATE bookings
  SET discount_amount = p_discount_applied
  WHERE id = p_booking_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'booking_voucher_id', v_booking_voucher_id,
    'message', 'Voucher applied successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION apply_voucher_to_booking TO authenticated;

-- =====================================================
-- 6. COMMENTS
-- =====================================================
COMMENT ON TABLE booking_vouchers IS 'Tracks voucher usage on bookings with historical discount data';
COMMENT ON FUNCTION award_points_on_completion IS 'Automatically awards points when booking status changes to completed';
COMMENT ON FUNCTION apply_voucher_to_booking IS 'Applies a user voucher to a booking and records the transaction';
