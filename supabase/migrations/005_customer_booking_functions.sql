-- =====================================================
-- CUSTOMER APP FUNCTIONS (Week 5-6)
-- =====================================================
-- Functions for booking creation, management, and customer features

-- =====================================================
-- 1. CREATE BOOKING
-- =====================================================
CREATE OR REPLACE FUNCTION create_booking(
  p_customer_id UUID,
  p_barber_id UUID,
  p_services JSONB,
  p_scheduled_date DATE,
  p_scheduled_time TIME,
  p_service_type TEXT,
  p_barbershop_id UUID DEFAULT NULL,
  p_customer_address JSONB DEFAULT NULL,
  p_customer_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  booking_id UUID,
  booking_number TEXT,
  total_price DECIMAL(10,2),
  message TEXT
) AS $$
DECLARE
  v_booking_id UUID;
  v_booking_number TEXT;
  v_subtotal DECIMAL(10,2);
  v_service_fee DECIMAL(10,2);
  v_travel_fee DECIMAL(10,2);
  v_total_price DECIMAL(10,2);
  v_duration INTEGER;
  v_scheduled_datetime TIMESTAMPTZ;
BEGIN
  -- Generate booking number (e.g., MG20250109001)
  v_booking_number := 'MG' || TO_CHAR(NOW(), 'YYYYMMDD') || 
    LPAD((SELECT COUNT(*) + 1 FROM bookings WHERE created_at::date = CURRENT_DATE)::TEXT, 3, '0');
  
  -- Calculate pricing
  SELECT 
    SUM((service->>'price')::DECIMAL),
    SUM((service->>'duration')::INTEGER)
  INTO v_subtotal, v_duration
  FROM jsonb_array_elements(p_services) AS service;
  
  -- Service fee: RM 2.00 platform fee
  v_service_fee := 2.00;
  
  -- Travel fee calculation (if home service)
  IF p_service_type = 'home_service' THEN
    -- Base travel fee (can be calculated based on distance later)
    v_travel_fee := 5.00;
  ELSE
    v_travel_fee := 0.00;
  END IF;
  
  v_total_price := v_subtotal + v_service_fee + v_travel_fee;
  
  -- Create scheduled datetime
  v_scheduled_datetime := (p_scheduled_date || ' ' || p_scheduled_time)::TIMESTAMPTZ;
  
  -- Insert booking
  INSERT INTO bookings (
    customer_id,
    barber_id,
    barbershop_id,
    booking_number,
    status,
    services,
    scheduled_date,
    scheduled_time,
    scheduled_datetime,
    estimated_duration_minutes,
    service_type,
    customer_address,
    subtotal,
    service_fee,
    travel_fee,
    total_price,
    payment_status,
    customer_notes
  ) VALUES (
    p_customer_id,
    p_barber_id,
    p_barbershop_id,
    v_booking_number,
    'pending',
    p_services,
    p_scheduled_date,
    p_scheduled_time,
    v_scheduled_datetime,
    v_duration,
    p_service_type,
    p_customer_address,
    v_subtotal,
    v_service_fee,
    v_travel_fee,
    v_total_price,
    'pending',
    p_customer_notes
  )
  RETURNING id INTO v_booking_id;
  
  -- Return booking details
  RETURN QUERY
  SELECT 
    v_booking_id,
    v_booking_number,
    v_total_price,
    'Booking created successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. GET CUSTOMER BOOKINGS
-- =====================================================
CREATE OR REPLACE FUNCTION get_customer_bookings(
  p_customer_id UUID,
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  booking_number TEXT,
  status booking_status,
  barber_name TEXT,
  barber_avatar TEXT,
  barbershop_name TEXT,
  services JSONB,
  scheduled_date DATE,
  scheduled_time TIME,
  scheduled_datetime TIMESTAMPTZ,
  service_type TEXT,
  customer_address JSONB,
  subtotal DECIMAL(10,2),
  service_fee DECIMAL(10,2),
  travel_fee DECIMAL(10,2),
  total_price DECIMAL(10,2),
  payment_method payment_method,
  payment_status payment_status,
  customer_notes TEXT,
  barber_notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.booking_number,
    b.status,
    p.full_name AS barber_name,
    p.avatar_url AS barber_avatar,
    bs.name AS barbershop_name,
    b.services,
    b.scheduled_date,
    b.scheduled_time,
    b.scheduled_datetime,
    b.service_type,
    b.customer_address,
    b.subtotal,
    b.service_fee,
    b.travel_fee,
    b.total_price,
    b.payment_method,
    b.payment_status,
    b.customer_notes,
    b.barber_notes,
    b.created_at,
    b.updated_at
  FROM bookings b
  LEFT JOIN barbers bar ON b.barber_id = bar.id
  LEFT JOIN profiles p ON bar.user_id = p.id
  LEFT JOIN barbershops bs ON b.barbershop_id = bs.id
  WHERE b.customer_id = p_customer_id
    AND (p_status IS NULL OR b.status::TEXT = p_status)
  ORDER BY b.scheduled_datetime DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 3. UPDATE BOOKING STATUS
-- =====================================================
CREATE OR REPLACE FUNCTION update_booking_status(
  p_booking_id UUID,
  p_new_status booking_status,
  p_updated_by UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  v_current_status booking_status;
  v_updated_at TIMESTAMPTZ;
BEGIN
  -- Get current status
  SELECT status INTO v_current_status
  FROM bookings
  WHERE id = p_booking_id;
  
  IF v_current_status IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Booking not found'::TEXT, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  -- Update booking status
  UPDATE bookings
  SET 
    status = p_new_status,
    barber_notes = CASE WHEN p_notes IS NOT NULL THEN p_notes ELSE barber_notes END,
    accepted_at = CASE WHEN p_new_status = 'accepted' AND accepted_at IS NULL THEN NOW() ELSE accepted_at END,
    started_at = CASE WHEN p_new_status = 'in_progress' AND started_at IS NULL THEN NOW() ELSE started_at END,
    completed_at = CASE WHEN p_new_status = 'completed' AND completed_at IS NULL THEN NOW() ELSE completed_at END,
    cancelled_at = CASE WHEN p_new_status = 'cancelled' AND cancelled_at IS NULL THEN NOW() ELSE cancelled_at END,
    updated_at = NOW()
  WHERE id = p_booking_id
  RETURNING updated_at INTO v_updated_at;
  
  RETURN QUERY SELECT TRUE, 'Status updated successfully'::TEXT, v_updated_at;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. CANCEL BOOKING
-- =====================================================
CREATE OR REPLACE FUNCTION cancel_booking(
  p_booking_id UUID,
  p_customer_id UUID,
  p_cancellation_reason TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  refund_eligible BOOLEAN
) AS $$
DECLARE
  v_customer_id UUID;
  v_scheduled_datetime TIMESTAMPTZ;
  v_hours_until INTERVAL;
  v_refund_eligible BOOLEAN;
BEGIN
  -- Verify booking ownership and get details
  SELECT customer_id, scheduled_datetime
  INTO v_customer_id, v_scheduled_datetime
  FROM bookings
  WHERE id = p_booking_id;
  
  IF v_customer_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Booking not found'::TEXT, FALSE;
    RETURN;
  END IF;
  
  IF v_customer_id != p_customer_id THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized'::TEXT, FALSE;
    RETURN;
  END IF;
  
  -- Check if cancellation is more than 24 hours before booking
  v_hours_until := v_scheduled_datetime - NOW();
  v_refund_eligible := EXTRACT(EPOCH FROM v_hours_until) > 86400; -- 24 hours
  
  -- Update booking to cancelled
  UPDATE bookings
  SET 
    status = 'cancelled',
    cancellation_reason = p_cancellation_reason,
    cancelled_at = NOW(),
    updated_at = NOW()
  WHERE id = p_booking_id;
  
  RETURN QUERY SELECT 
    TRUE,
    CASE 
      WHEN v_refund_eligible THEN 'Booking cancelled. Refund will be processed.'
      ELSE 'Booking cancelled. No refund available (less than 24h notice).'
    END::TEXT,
    v_refund_eligible;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. CUSTOMER ADDRESS MANAGEMENT
-- =====================================================

-- Create addresses table if not exists
CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL, -- 'Home', 'Work', 'Other'
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT,
  country TEXT DEFAULT 'Malaysia',
  location GEOGRAPHY(POINT, 4326),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add customer address
CREATE OR REPLACE FUNCTION add_customer_address(
  p_user_id UUID,
  p_label TEXT,
  p_address_line1 TEXT,
  p_city TEXT,
  p_state TEXT,
  p_address_line2 TEXT DEFAULT NULL,
  p_postal_code TEXT DEFAULT NULL,
  p_latitude DOUBLE PRECISION DEFAULT NULL,
  p_longitude DOUBLE PRECISION DEFAULT NULL,
  p_is_default BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  address_id UUID,
  message TEXT
) AS $$
DECLARE
  v_address_id UUID;
  v_location GEOGRAPHY;
BEGIN
  -- If this is default, unset other defaults
  IF p_is_default THEN
    UPDATE customer_addresses
    SET is_default = FALSE
    WHERE user_id = p_user_id;
  END IF;
  
  -- Create location point if coordinates provided
  IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
    v_location := ST_MakePoint(p_longitude, p_latitude)::GEOGRAPHY;
  END IF;
  
  -- Insert address
  INSERT INTO customer_addresses (
    user_id, label, address_line1, address_line2,
    city, state, postal_code, location, is_default
  ) VALUES (
    p_user_id, p_label, p_address_line1, p_address_line2,
    p_city, p_state, p_postal_code, v_location, p_is_default
  )
  RETURNING id INTO v_address_id;
  
  RETURN QUERY SELECT v_address_id, 'Address added successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Get customer addresses
CREATE OR REPLACE FUNCTION get_customer_addresses(
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  label TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_default BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ca.id,
    ca.label,
    ca.address_line1,
    ca.address_line2,
    ca.city,
    ca.state,
    ca.postal_code,
    ST_Y(ca.location::geometry)::DOUBLE PRECISION AS latitude,
    ST_X(ca.location::geometry)::DOUBLE PRECISION AS longitude,
    ca.is_default,
    ca.created_at
  FROM customer_addresses ca
  WHERE ca.user_id = p_user_id
  ORDER BY ca.is_default DESC, ca.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_barber_id ON bookings(barber_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_datetime ON bookings(scheduled_datetime);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_status ON bookings(customer_id, status);

-- Customer addresses indexes
CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON customer_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_location ON customer_addresses USING GIST(location);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS on customer_addresses
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

-- Customers can view their own addresses
CREATE POLICY customer_addresses_select ON customer_addresses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Customers can insert their own addresses
CREATE POLICY customer_addresses_insert ON customer_addresses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Customers can update their own addresses
CREATE POLICY customer_addresses_update ON customer_addresses
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Customers can delete their own addresses
CREATE POLICY customer_addresses_delete ON customer_addresses
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION create_booking IS 'Creates a new booking with automatic pricing calculation';
COMMENT ON FUNCTION get_customer_bookings IS 'Retrieves customer bookings with optional status filter';
COMMENT ON FUNCTION update_booking_status IS 'Updates booking status and tracks timestamps';
COMMENT ON FUNCTION cancel_booking IS 'Cancels a booking with refund eligibility check';
COMMENT ON FUNCTION add_customer_address IS 'Adds a new address for a customer';
COMMENT ON FUNCTION get_customer_addresses IS 'Retrieves all addresses for a customer';
