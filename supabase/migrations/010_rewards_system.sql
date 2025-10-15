-- =====================================================
-- REWARDS SYSTEM MIGRATION
-- Platform-controlled rewards and loyalty program
-- Mari-Gunting creates and manages all vouchers
-- =====================================================

-- =====================================================
-- 1. ADD POINTS BALANCE TO PROFILES
-- =====================================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS points_balance INTEGER DEFAULT 0 CHECK (points_balance >= 0);

COMMENT ON COLUMN profiles.points_balance IS 'User loyalty points balance';

-- =====================================================
-- 2. VOUCHERS TABLE (Platform-Created)
-- =====================================================
CREATE TABLE vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Voucher Details
  code VARCHAR(20) UNIQUE NOT NULL, -- e.g., 'SAVE5', 'WELCOME10'
  title TEXT NOT NULL,
  description TEXT,
  
  -- Discount Configuration
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value DECIMAL(10,2) NOT NULL CHECK (value > 0),
  
  -- Redemption Cost
  points_cost INTEGER NOT NULL CHECK (points_cost > 0),
  
  -- Usage Limits
  max_redemptions INTEGER, -- NULL = unlimited
  current_redemptions INTEGER DEFAULT 0,
  max_per_user INTEGER DEFAULT 1, -- How many times each user can redeem
  
  -- Applicability
  min_spend DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2), -- For percentage type, cap the discount
  applicable_services TEXT[], -- NULL = all services, or specific service categories
  
  -- Validity
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  
  -- Admin
  created_by UUID REFERENCES profiles(id), -- Admin who created it
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE, -- Show prominently in app
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure valid date range
  CONSTRAINT valid_date_range CHECK (valid_until > valid_from)
);

COMMENT ON TABLE vouchers IS 'Platform-created vouchers for rewards program';
COMMENT ON COLUMN vouchers.code IS 'Unique voucher code (e.g., SAVE5)';
COMMENT ON COLUMN vouchers.type IS 'Discount type: percentage or fixed amount';
COMMENT ON COLUMN vouchers.value IS 'Discount value (percentage number or fixed RM amount)';
COMMENT ON COLUMN vouchers.points_cost IS 'Points required to redeem this voucher';

-- Index for active vouchers query
CREATE INDEX idx_vouchers_active ON vouchers(is_active, valid_until) WHERE is_active = TRUE;
CREATE INDEX idx_vouchers_code ON vouchers(code);

-- =====================================================
-- 3. USER VOUCHERS TABLE (Redeemed Vouchers)
-- =====================================================
CREATE TABLE user_vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  voucher_id UUID NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  
  -- Redemption
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  points_spent INTEGER NOT NULL,
  
  -- Usage
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  used_at TIMESTAMPTZ,
  used_for_booking_id UUID REFERENCES bookings(id),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE user_vouchers IS 'User-redeemed vouchers from rewards program';
COMMENT ON COLUMN user_vouchers.status IS 'active: can use, used: already applied, expired: past validity';

-- Indexes for user voucher queries
CREATE INDEX idx_user_vouchers_user ON user_vouchers(user_id, status);
CREATE INDEX idx_user_vouchers_booking ON user_vouchers(used_for_booking_id) WHERE used_for_booking_id IS NOT NULL;

-- =====================================================
-- 4. POINTS TRANSACTIONS TABLE (Points History)
-- =====================================================
CREATE TABLE points_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Transaction Details
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'refund', 'admin_adjustment')),
  amount INTEGER NOT NULL, -- Positive for earn/refund, negative for redeem
  balance_after INTEGER NOT NULL, -- Points balance after this transaction
  
  -- Context
  description TEXT NOT NULL,
  booking_id UUID REFERENCES bookings(id),
  voucher_id UUID REFERENCES vouchers(id),
  user_voucher_id UUID REFERENCES user_vouchers(id),
  
  -- Admin
  admin_id UUID REFERENCES profiles(id), -- If admin adjustment
  admin_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE points_transactions IS 'Complete history of all points transactions';
COMMENT ON COLUMN points_transactions.type IS 'Transaction type: earn from booking, redeem for voucher, refund, or admin adjustment';
COMMENT ON COLUMN points_transactions.amount IS 'Points change: positive for earn/refund, negative for redeem';

-- Indexes for transaction history queries
CREATE INDEX idx_points_transactions_user ON points_transactions(user_id, created_at DESC);
CREATE INDEX idx_points_transactions_booking ON points_transactions(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX idx_points_transactions_type ON points_transactions(type, created_at DESC);

-- =====================================================
-- 5. FUNCTIONS
-- =====================================================

-- Function: Award points when booking is completed
CREATE OR REPLACE FUNCTION award_booking_points()
RETURNS TRIGGER AS $$
DECLARE
  points_to_award INTEGER;
  customer_current_points INTEGER;
BEGIN
  -- Only award points when status changes TO 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Calculate points (10 points per RM)
    points_to_award := FLOOR(NEW.total_price * 10);
    
    -- Get current points balance
    SELECT points_balance INTO customer_current_points
    FROM profiles
    WHERE id = NEW.customer_id;
    
    -- Update user points balance
    UPDATE profiles
    SET 
      points_balance = points_balance + points_to_award,
      updated_at = NOW()
    WHERE id = NEW.customer_id;
    
    -- Record transaction
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
      customer_current_points + points_to_award,
      'Points earned from booking #' || NEW.booking_number,
      NEW.id
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION award_booking_points() IS 'Automatically award points when booking is completed';

-- Trigger: Award points on booking completion
DROP TRIGGER IF EXISTS trigger_award_booking_points ON bookings;
CREATE TRIGGER trigger_award_booking_points
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION award_booking_points();

-- Function: Redeem voucher with points
CREATE OR REPLACE FUNCTION redeem_voucher(
  p_user_id UUID,
  p_voucher_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_voucher RECORD;
  v_user_points INTEGER;
  v_user_voucher_id UUID;
  v_redemption_count INTEGER;
BEGIN
  -- Get voucher details
  SELECT * INTO v_voucher
  FROM vouchers
  WHERE id = p_voucher_id AND is_active = TRUE AND valid_until > NOW();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Voucher not found or expired';
  END IF;
  
  -- Check max redemptions
  IF v_voucher.max_redemptions IS NOT NULL AND v_voucher.current_redemptions >= v_voucher.max_redemptions THEN
    RAISE EXCEPTION 'Voucher redemption limit reached';
  END IF;
  
  -- Check user redemption count
  SELECT COUNT(*) INTO v_redemption_count
  FROM user_vouchers
  WHERE user_id = p_user_id AND voucher_id = p_voucher_id;
  
  IF v_redemption_count >= v_voucher.max_per_user THEN
    RAISE EXCEPTION 'You have already redeemed this voucher maximum times';
  END IF;
  
  -- Get user points
  SELECT points_balance INTO v_user_points
  FROM profiles
  WHERE id = p_user_id;
  
  IF v_user_points < v_voucher.points_cost THEN
    RAISE EXCEPTION 'Insufficient points. Need % points', v_voucher.points_cost;
  END IF;
  
  -- Deduct points
  UPDATE profiles
  SET 
    points_balance = points_balance - v_voucher.points_cost,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Create user voucher
  INSERT INTO user_vouchers (user_id, voucher_id, points_spent, status)
  VALUES (p_user_id, p_voucher_id, v_voucher.points_cost, 'active')
  RETURNING id INTO v_user_voucher_id;
  
  -- Update voucher redemption count
  UPDATE vouchers
  SET 
    current_redemptions = current_redemptions + 1,
    updated_at = NOW()
  WHERE id = p_voucher_id;
  
  -- Record transaction
  INSERT INTO points_transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    voucher_id,
    user_voucher_id
  ) VALUES (
    p_user_id,
    'redeem',
    -v_voucher.points_cost,
    v_user_points - v_voucher.points_cost,
    'Redeemed voucher: ' || v_voucher.title,
    p_voucher_id,
    v_user_voucher_id
  );
  
  RETURN v_user_voucher_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION redeem_voucher IS 'Redeem a voucher using points, returns user_voucher_id';

-- Function: Mark voucher as used
CREATE OR REPLACE FUNCTION use_voucher(
  p_user_voucher_id UUID,
  p_booking_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_voucher RECORD;
BEGIN
  -- Get user voucher
  SELECT * INTO v_user_voucher
  FROM user_vouchers
  WHERE id = p_user_voucher_id AND status = 'active';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Voucher not found or already used';
  END IF;
  
  -- Check voucher validity
  IF NOT EXISTS (
    SELECT 1 FROM vouchers
    WHERE id = v_user_voucher.voucher_id 
    AND valid_until > NOW()
    AND is_active = TRUE
  ) THEN
    -- Mark as expired
    UPDATE user_vouchers
    SET status = 'expired', updated_at = NOW()
    WHERE id = p_user_voucher_id;
    
    RAISE EXCEPTION 'Voucher has expired';
  END IF;
  
  -- Mark as used
  UPDATE user_vouchers
  SET 
    status = 'used',
    used_at = NOW(),
    used_for_booking_id = p_booking_id,
    updated_at = NOW()
  WHERE id = p_user_voucher_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION use_voucher IS 'Mark a user voucher as used for a booking';

-- =====================================================
-- 6. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

-- Vouchers: Anyone can read active vouchers
CREATE POLICY "Anyone can view active vouchers"
  ON vouchers FOR SELECT
  USING (is_active = TRUE AND valid_until > NOW());

-- User Vouchers: Users can only see their own
CREATE POLICY "Users can view own vouchers"
  ON user_vouchers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vouchers via function"
  ON user_vouchers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vouchers via function"
  ON user_vouchers FOR UPDATE
  USING (auth.uid() = user_id);

-- Points Transactions: Users can only see their own
CREATE POLICY "Users can view own transactions"
  ON points_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions"
  ON points_transactions FOR INSERT
  WITH CHECK (true); -- Handled by functions

-- =====================================================
-- 7. UPDATED_AT TRIGGERS
-- =====================================================

CREATE TRIGGER update_vouchers_updated_at
  BEFORE UPDATE ON vouchers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_vouchers_updated_at
  BEFORE UPDATE ON user_vouchers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
