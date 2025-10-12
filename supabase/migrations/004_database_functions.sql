-- =====================================================
-- DATABASE FUNCTIONS & TRIGGERS
-- =====================================================
-- Advanced PostgreSQL functions for Mari-Gunting

-- =====================================================
-- 1. NEARBY BARBERSHOP SEARCH (PostGIS)
-- =====================================================

-- Search barbershops within radius with filtering and sorting
CREATE OR REPLACE FUNCTION search_nearby_barbershops(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_km INTEGER DEFAULT 10,
  min_rating DECIMAL(3,2) DEFAULT 0,
  service_id UUID DEFAULT NULL,
  search_query TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_km DECIMAL(10,2),
  average_rating DECIMAL(3,2),
  total_reviews INTEGER,
  is_open BOOLEAN,
  profile_image_url TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.description,
    b.address,
    b.latitude,
    b.longitude,
    ROUND(
      ST_Distance(
        ST_MakePoint(user_lng, user_lat)::geography,
        ST_MakePoint(b.longitude, b.latitude)::geography
      ) / 1000, 2
    )::DECIMAL(10,2) AS distance_km,
    COALESCE(b.average_rating, 0)::DECIMAL(3,2) AS average_rating,
    COALESCE(b.total_reviews, 0)::INTEGER AS total_reviews,
    b.is_open,
    b.profile_image_url,
    b.created_at
  FROM barbershops b
  WHERE 
    b.status = 'active'
    AND ST_DWithin(
      ST_MakePoint(user_lng, user_lat)::geography,
      ST_MakePoint(b.longitude, b.latitude)::geography,
      radius_km * 1000
    )
    AND (min_rating = 0 OR COALESCE(b.average_rating, 0) >= min_rating)
    AND (service_id IS NULL OR EXISTS (
      SELECT 1 FROM services s 
      WHERE s.barbershop_id = b.id AND s.id = service_id
    ))
    AND (search_query IS NULL OR 
      b.name ILIKE '%' || search_query || '%' OR
      b.description ILIKE '%' || search_query || '%' OR
      b.address ILIKE '%' || search_query || '%'
    )
  ORDER BY distance_km ASC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 2. CHECK BOOKING AVAILABILITY
-- =====================================================

-- Check if a time slot is available for booking
CREATE OR REPLACE FUNCTION check_booking_availability(
  p_barber_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_duration_minutes INTEGER
)
RETURNS TABLE (
  is_available BOOLEAN,
  conflict_booking_id UUID,
  reason TEXT
) AS $$
DECLARE
  v_end_time TIME;
  v_conflicting_booking UUID;
  v_is_working_day BOOLEAN;
BEGIN
  -- Calculate end time
  v_end_time := p_start_time + (p_duration_minutes || ' minutes')::INTERVAL;
  
  -- Check if barber works on this day
  SELECT EXISTS (
    SELECT 1 FROM barber_working_hours bwh
    WHERE bwh.barber_id = p_barber_id
    AND bwh.day_of_week = EXTRACT(DOW FROM p_date)::INTEGER
    AND bwh.is_working = TRUE
    AND p_start_time >= bwh.start_time
    AND v_end_time <= bwh.end_time
  ) INTO v_is_working_day;
  
  IF NOT v_is_working_day THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Barber not working at this time';
    RETURN;
  END IF;
  
  -- Check for conflicting bookings
  SELECT b.id INTO v_conflicting_booking
  FROM bookings b
  WHERE b.barber_id = p_barber_id
    AND b.booking_date = p_date
    AND b.status NOT IN ('cancelled', 'rejected')
    AND (
      -- New booking starts during existing booking
      (p_start_time >= b.start_time AND p_start_time < b.end_time)
      OR
      -- New booking ends during existing booking
      (v_end_time > b.start_time AND v_end_time <= b.end_time)
      OR
      -- New booking completely overlaps existing booking
      (p_start_time <= b.start_time AND v_end_time >= b.end_time)
    )
  LIMIT 1;
  
  IF v_conflicting_booking IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, v_conflicting_booking, 'Time slot already booked';
    RETURN;
  END IF;
  
  -- Available
  RETURN QUERY SELECT TRUE, NULL::UUID, 'Available';
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 3. GET AVAILABLE TIME SLOTS
-- =====================================================

-- Get all available time slots for a barber on a specific date
CREATE OR REPLACE FUNCTION get_available_time_slots(
  p_barber_id UUID,
  p_date DATE,
  p_service_duration_minutes INTEGER DEFAULT 60,
  p_slot_interval_minutes INTEGER DEFAULT 30
)
RETURNS TABLE (
  slot_time TIME,
  is_available BOOLEAN
) AS $$
DECLARE
  v_start_time TIME;
  v_end_time TIME;
  v_current_time TIME;
  v_service_end_time TIME;
BEGIN
  -- Get working hours for the day
  SELECT bwh.start_time, bwh.end_time
  INTO v_start_time, v_end_time
  FROM barber_working_hours bwh
  WHERE bwh.barber_id = p_barber_id
    AND bwh.day_of_week = EXTRACT(DOW FROM p_date)::INTEGER
    AND bwh.is_working = TRUE;
  
  -- If not working, return empty
  IF v_start_time IS NULL THEN
    RETURN;
  END IF;
  
  -- Generate time slots
  v_current_time := v_start_time;
  
  WHILE v_current_time + (p_service_duration_minutes || ' minutes')::INTERVAL <= v_end_time LOOP
    v_service_end_time := v_current_time + (p_service_duration_minutes || ' minutes')::INTERVAL;
    
    -- Check if slot is available
    RETURN QUERY
    SELECT 
      v_current_time,
      NOT EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.barber_id = p_barber_id
          AND b.booking_date = p_date
          AND b.status NOT IN ('cancelled', 'rejected')
          AND (
            (v_current_time >= b.start_time AND v_current_time < b.end_time)
            OR (v_service_end_time > b.start_time AND v_service_end_time <= b.end_time)
            OR (v_current_time <= b.start_time AND v_service_end_time >= b.end_time)
          )
      );
    
    v_current_time := v_current_time + (p_slot_interval_minutes || ' minutes')::INTERVAL;
  END LOOP;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 4. CALCULATE RATING STATISTICS
-- =====================================================

-- Update barbershop/barber rating stats
CREATE OR REPLACE FUNCTION update_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update barbershop ratings
  IF TG_TABLE_NAME = 'reviews' AND NEW.barbershop_id IS NOT NULL THEN
    UPDATE barbershops
    SET 
      average_rating = (
        SELECT ROUND(AVG(rating)::NUMERIC, 2)
        FROM reviews
        WHERE barbershop_id = NEW.barbershop_id AND status = 'approved'
      ),
      total_reviews = (
        SELECT COUNT(*)
        FROM reviews
        WHERE barbershop_id = NEW.barbershop_id AND status = 'approved'
      ),
      updated_at = NOW()
    WHERE id = NEW.barbershop_id;
  END IF;
  
  -- Update barber ratings
  IF TG_TABLE_NAME = 'reviews' AND NEW.barber_id IS NOT NULL THEN
    UPDATE barbers
    SET 
      average_rating = (
        SELECT ROUND(AVG(rating)::NUMERIC, 2)
        FROM reviews
        WHERE barber_id = NEW.barber_id AND status = 'approved'
      ),
      total_reviews = (
        SELECT COUNT(*)
        FROM reviews
        WHERE barber_id = NEW.barber_id AND status = 'approved'
      ),
      updated_at = NOW()
    WHERE id = NEW.barber_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. AUTO-CREATE PROFILE ON USER SIGNUP
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (
    id,
    email,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. UPDATE BOOKING STATUS TIMESTAMPS
-- =====================================================

CREATE OR REPLACE FUNCTION update_booking_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Update confirmed_at
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    NEW.confirmed_at := NOW();
  END IF;
  
  -- Update completed_at
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at := NOW();
  END IF;
  
  -- Update cancelled_at
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    NEW.cancelled_at := NOW();
  END IF;
  
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Update ratings when review is inserted/updated
DROP TRIGGER IF EXISTS trigger_update_ratings_on_review_insert ON reviews;
CREATE TRIGGER trigger_update_ratings_on_review_insert
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_rating_stats();

-- Trigger: Auto-create profile on user signup
DROP TRIGGER IF EXISTS trigger_create_profile_on_signup ON auth.users;
CREATE TRIGGER trigger_create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Trigger: Update booking timestamps
DROP TRIGGER IF EXISTS trigger_update_booking_timestamps ON bookings;
CREATE TRIGGER trigger_update_booking_timestamps
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_timestamps();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Spatial index for barbershops (already created in initial schema, but ensuring)
CREATE INDEX IF NOT EXISTS idx_barbershops_location ON barbershops USING GIST(
  ST_MakePoint(longitude, latitude)::geography
);

-- Booking availability indexes
CREATE INDEX IF NOT EXISTS idx_bookings_barber_date_time 
  ON bookings(barber_id, booking_date, start_time, end_time)
  WHERE status NOT IN ('cancelled', 'rejected');

-- Review indexes
CREATE INDEX IF NOT EXISTS idx_reviews_barbershop_status 
  ON reviews(barbershop_id, status) 
  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_reviews_barber_status 
  ON reviews(barber_id, status) 
  WHERE status = 'approved';

-- Working hours index
CREATE INDEX IF NOT EXISTS idx_barber_working_hours_day 
  ON barber_working_hours(barber_id, day_of_week, is_working);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get barbershop's next available slot
CREATE OR REPLACE FUNCTION get_next_available_slot(
  p_barber_id UUID,
  p_service_duration_minutes INTEGER DEFAULT 60,
  p_days_ahead INTEGER DEFAULT 7
)
RETURNS TABLE (
  available_date DATE,
  available_time TIME
) AS $$
DECLARE
  v_current_date DATE := CURRENT_DATE;
  v_end_date DATE := CURRENT_DATE + p_days_ahead;
  v_slot RECORD;
BEGIN
  WHILE v_current_date <= v_end_date LOOP
    FOR v_slot IN
      SELECT slot_time
      FROM get_available_time_slots(
        p_barber_id,
        v_current_date,
        p_service_duration_minutes
      )
      WHERE is_available = TRUE
      LIMIT 1
    LOOP
      RETURN QUERY SELECT v_current_date, v_slot.slot_time;
      RETURN;
    END LOOP;
    
    v_current_date := v_current_date + 1;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql STABLE;

-- Calculate total earnings for barbershop/barber
CREATE OR REPLACE FUNCTION calculate_earnings(
  p_entity_type TEXT, -- 'barbershop' or 'barber'
  p_entity_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_bookings INTEGER,
  total_revenue DECIMAL(10,2),
  platform_fee DECIMAL(10,2),
  net_earnings DECIMAL(10,2)
) AS $$
DECLARE
  v_start_date DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
  v_end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
BEGIN
  IF p_entity_type = 'barbershop' THEN
    RETURN QUERY
    SELECT 
      COUNT(*)::INTEGER AS total_bookings,
      COALESCE(SUM(b.total_price), 0)::DECIMAL(10,2) AS total_revenue,
      COALESCE(SUM(b.platform_fee), 0)::DECIMAL(10,2) AS platform_fee,
      COALESCE(SUM(b.total_price - b.platform_fee), 0)::DECIMAL(10,2) AS net_earnings
    FROM bookings b
    WHERE b.barbershop_id = p_entity_id
      AND b.status = 'completed'
      AND b.booking_date BETWEEN v_start_date AND v_end_date;
  ELSIF p_entity_type = 'barber' THEN
    RETURN QUERY
    SELECT 
      COUNT(*)::INTEGER AS total_bookings,
      COALESCE(SUM(b.total_price), 0)::DECIMAL(10,2) AS total_revenue,
      COALESCE(SUM(b.platform_fee), 0)::DECIMAL(10,2) AS platform_fee,
      COALESCE(SUM(b.total_price - b.platform_fee), 0)::DECIMAL(10,2) AS net_earnings
    FROM bookings b
    WHERE b.barber_id = p_entity_id
      AND b.status = 'completed'
      AND b.booking_date BETWEEN v_start_date AND v_end_date;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;
