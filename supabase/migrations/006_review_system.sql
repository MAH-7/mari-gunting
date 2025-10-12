-- =====================================================
-- REVIEW SYSTEM (Week 5-6)
-- =====================================================
-- Functions for customer reviews and automatic rating updates

-- =====================================================
-- 1. SUBMIT REVIEW
-- =====================================================
CREATE OR REPLACE FUNCTION submit_review(
  p_booking_id UUID,
  p_customer_id UUID,
  p_rating INTEGER,
  p_comment TEXT DEFAULT NULL,
  p_images TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  review_id UUID,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_review_id UUID;
  v_barber_id UUID;
  v_barbershop_id UUID;
  v_booking_customer_id UUID;
  v_booking_status booking_status;
BEGIN
  -- Validate rating
  IF p_rating < 1 OR p_rating > 5 THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, 'Rating must be between 1 and 5'::TEXT;
    RETURN;
  END IF;
  
  -- Get booking details and verify
  SELECT customer_id, barber_id, barbershop_id, status
  INTO v_booking_customer_id, v_barber_id, v_barbershop_id, v_booking_status
  FROM bookings
  WHERE id = p_booking_id;
  
  -- Verify booking exists
  IF v_booking_customer_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, 'Booking not found'::TEXT;
    RETURN;
  END IF;
  
  -- Verify customer owns the booking
  IF v_booking_customer_id != p_customer_id THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, 'Unauthorized: Not your booking'::TEXT;
    RETURN;
  END IF;
  
  -- Verify booking is completed
  IF v_booking_status != 'completed' THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, 'Can only review completed bookings'::TEXT;
    RETURN;
  END IF;
  
  -- Check if review already exists
  IF EXISTS (SELECT 1 FROM reviews WHERE booking_id = p_booking_id) THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, 'Review already submitted for this booking'::TEXT;
    RETURN;
  END IF;
  
  -- Insert review
  INSERT INTO reviews (
    booking_id,
    customer_id,
    barber_id,
    barbershop_id,
    rating,
    comment,
    images,
    is_verified
  ) VALUES (
    p_booking_id,
    p_customer_id,
    v_barber_id,
    v_barbershop_id,
    p_rating,
    p_comment,
    p_images,
    TRUE -- Verified because it's linked to completed booking
  )
  RETURNING id INTO v_review_id;
  
  -- Trigger will update barber/shop rating automatically
  
  RETURN QUERY SELECT v_review_id, TRUE, 'Review submitted successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. GET BARBER REVIEWS
-- =====================================================
CREATE OR REPLACE FUNCTION get_barber_reviews(
  p_barber_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  customer_name TEXT,
  customer_avatar TEXT,
  rating INTEGER,
  comment TEXT,
  images TEXT[],
  response TEXT,
  response_at TIMESTAMPTZ,
  is_verified BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    p.full_name AS customer_name,
    p.avatar_url AS customer_avatar,
    r.rating,
    r.comment,
    r.images,
    r.response,
    r.response_at,
    r.is_verified,
    r.created_at
  FROM reviews r
  LEFT JOIN profiles p ON r.customer_id = p.id
  WHERE r.barber_id = p_barber_id
    AND r.is_visible = TRUE
  ORDER BY r.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 3. GET BARBERSHOP REVIEWS
-- =====================================================
CREATE OR REPLACE FUNCTION get_barbershop_reviews(
  p_barbershop_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  customer_name TEXT,
  customer_avatar TEXT,
  rating INTEGER,
  comment TEXT,
  images TEXT[],
  response TEXT,
  response_at TIMESTAMPTZ,
  is_verified BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    p.full_name AS customer_name,
    p.avatar_url AS customer_avatar,
    r.rating,
    r.comment,
    r.images,
    r.response,
    r.response_at,
    r.is_verified,
    r.created_at
  FROM reviews r
  LEFT JOIN profiles p ON r.customer_id = p.id
  WHERE r.barbershop_id = p_barbershop_id
    AND r.is_visible = TRUE
  ORDER BY r.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 4. UPDATE BARBER RATING (TRIGGER FUNCTION)
-- =====================================================
CREATE OR REPLACE FUNCTION update_barber_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_avg_rating DECIMAL(3,2);
  v_total_reviews INTEGER;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Calculate new average for barber
    IF NEW.barber_id IS NOT NULL THEN
      SELECT 
        ROUND(AVG(rating)::NUMERIC, 2),
        COUNT(*)
      INTO v_avg_rating, v_total_reviews
      FROM reviews
      WHERE barber_id = NEW.barber_id
        AND is_visible = TRUE;
      
      -- Update barber record
      UPDATE barbers
      SET 
        rating = v_avg_rating,
        total_reviews = v_total_reviews,
        updated_at = NOW()
      WHERE id = NEW.barber_id;
    END IF;
    
    -- Calculate new average for barbershop
    IF NEW.barbershop_id IS NOT NULL THEN
      SELECT 
        ROUND(AVG(rating)::NUMERIC, 2),
        COUNT(*)
      INTO v_avg_rating, v_total_reviews
      FROM reviews
      WHERE barbershop_id = NEW.barbershop_id
        AND is_visible = TRUE;
      
      -- Update barbershop record
      UPDATE barbershops
      SET 
        rating = v_avg_rating,
        total_reviews = v_total_reviews,
        updated_at = NOW()
      WHERE id = NEW.barbershop_id;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    -- Recalculate after deletion
    IF OLD.barber_id IS NOT NULL THEN
      SELECT 
        ROUND(AVG(rating)::NUMERIC, 2),
        COUNT(*)
      INTO v_avg_rating, v_total_reviews
      FROM reviews
      WHERE barber_id = OLD.barber_id
        AND is_visible = TRUE;
      
      UPDATE barbers
      SET 
        rating = COALESCE(v_avg_rating, 0),
        total_reviews = v_total_reviews,
        updated_at = NOW()
      WHERE id = OLD.barber_id;
    END IF;
    
    IF OLD.barbershop_id IS NOT NULL THEN
      SELECT 
        ROUND(AVG(rating)::NUMERIC, 2),
        COUNT(*)
      INTO v_avg_rating, v_total_reviews
      FROM reviews
      WHERE barbershop_id = OLD.barbershop_id
        AND is_visible = TRUE;
      
      UPDATE barbershops
      SET 
        rating = COALESCE(v_avg_rating, 0),
        total_reviews = v_total_reviews,
        updated_at = NOW()
      WHERE id = OLD.barbershop_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_barber_rating ON reviews;
CREATE TRIGGER trigger_update_barber_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_barber_rating();

-- =====================================================
-- 5. GET REVIEW STATS
-- =====================================================
CREATE OR REPLACE FUNCTION get_review_stats(
  p_barber_id UUID DEFAULT NULL,
  p_barbershop_id UUID DEFAULT NULL
)
RETURNS TABLE (
  average_rating DECIMAL(3,2),
  total_reviews INTEGER,
  rating_5_count INTEGER,
  rating_4_count INTEGER,
  rating_3_count INTEGER,
  rating_2_count INTEGER,
  rating_1_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(r.rating)::NUMERIC, 2) AS average_rating,
    COUNT(*)::INTEGER AS total_reviews,
    COUNT(*) FILTER (WHERE r.rating = 5)::INTEGER AS rating_5_count,
    COUNT(*) FILTER (WHERE r.rating = 4)::INTEGER AS rating_4_count,
    COUNT(*) FILTER (WHERE r.rating = 3)::INTEGER AS rating_3_count,
    COUNT(*) FILTER (WHERE r.rating = 2)::INTEGER AS rating_2_count,
    COUNT(*) FILTER (WHERE r.rating = 1)::INTEGER AS rating_1_count
  FROM reviews r
  WHERE r.is_visible = TRUE
    AND (p_barber_id IS NULL OR r.barber_id = p_barber_id)
    AND (p_barbershop_id IS NULL OR r.barbershop_id = p_barbershop_id);
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 6. BARBER RESPOND TO REVIEW
-- =====================================================
CREATE OR REPLACE FUNCTION respond_to_review(
  p_review_id UUID,
  p_barber_user_id UUID,
  p_response TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_review_barber_id UUID;
  v_barber_id UUID;
BEGIN
  -- Get the barber_id from the review
  SELECT barber_id INTO v_review_barber_id
  FROM reviews
  WHERE id = p_review_id;
  
  IF v_review_barber_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Review not found'::TEXT;
    RETURN;
  END IF;
  
  -- Get barber_id from user_id
  SELECT id INTO v_barber_id
  FROM barbers
  WHERE user_id = p_barber_user_id;
  
  -- Verify ownership
  IF v_barber_id != v_review_barber_id THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: Not your review'::TEXT;
    RETURN;
  END IF;
  
  -- Update review with response
  UPDATE reviews
  SET 
    response = p_response,
    response_at = NOW(),
    updated_at = NOW()
  WHERE id = p_review_id;
  
  RETURN QUERY SELECT TRUE, 'Response added successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_reviews_barber_id ON reviews(barber_id);
CREATE INDEX IF NOT EXISTS idx_reviews_barbershop_id ON reviews(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_visible ON reviews(is_visible) WHERE is_visible = TRUE;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION submit_review IS 'Submits a review for a completed booking';
COMMENT ON FUNCTION get_barber_reviews IS 'Retrieves all reviews for a barber';
COMMENT ON FUNCTION get_barbershop_reviews IS 'Retrieves all reviews for a barbershop';
COMMENT ON FUNCTION update_barber_rating IS 'Trigger function to automatically update average ratings';
COMMENT ON FUNCTION get_review_stats IS 'Gets rating statistics and distribution';
COMMENT ON FUNCTION respond_to_review IS 'Allows barber to respond to a review';
