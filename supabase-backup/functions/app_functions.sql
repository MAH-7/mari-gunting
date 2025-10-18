-- ============================================
-- MARI GUNTING APP FUNCTIONS
-- Extracted from production database
-- Total: 24 functions (with some overloads)
-- ============================================

-- 1. add_customer_address
CREATE OR REPLACE FUNCTION public.add_customer_address(p_user_id uuid, p_label text, p_address_line1 text, p_city text, p_state text, p_address_line2 text DEFAULT NULL::text, p_postal_code text DEFAULT NULL::text, p_latitude double precision DEFAULT NULL::double precision, p_longitude double precision DEFAULT NULL::double precision, p_is_default boolean DEFAULT false)
 RETURNS TABLE(address_id uuid, message text)
 LANGUAGE plpgsql
AS $function$
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
$function$;

-- 2. add_customer_credit
CREATE OR REPLACE FUNCTION public.add_customer_credit(p_user_id uuid, p_amount numeric, p_source text, p_description text, p_booking_id uuid DEFAULT NULL::uuid, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(success boolean, new_balance numeric, transaction_id uuid)
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_new_balance DECIMAL(10,2);
  v_transaction_id UUID;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN QUERY SELECT FALSE, 0.00::DECIMAL(10,2), NULL::UUID;
    RETURN;
  END IF;
  
  -- Ensure customer_credits record exists
  PERFORM get_or_create_customer_credits(p_user_id);
  
  -- Update balance
  UPDATE customer_credits
  SET 
    balance = balance + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;
  
  -- Log transaction
  INSERT INTO credit_transactions (
    user_id,
    type,
    source,
    amount,
    balance_after,
    description,
    booking_id,
    metadata
  ) VALUES (
    p_user_id,
    'add',
    p_source,
    p_amount,
    v_new_balance,
    p_description,
    p_booking_id,
    p_metadata
  ) RETURNING id INTO v_transaction_id;
  
  RETURN QUERY SELECT TRUE, v_new_balance, v_transaction_id;
END;
$function$;

-- 3. apply_voucher_to_booking
CREATE OR REPLACE FUNCTION public.apply_voucher_to_booking(p_booking_id uuid, p_user_voucher_id uuid, p_original_total numeric, p_discount_applied numeric, p_final_total numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_customer_id UUID;
  v_user_voucher RECORD;
  v_booking_voucher_id UUID;
  v_booking RECORD;
  v_new_total DECIMAL(10,2);
BEGIN
  -- Get booking details
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id;
  
  IF v_booking IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;
  
  v_customer_id := v_booking.customer_id;
  
  -- Verify the voucher belongs to this customer and is available/active
  SELECT uv.*, 
         v.code, 
         v.title, 
         v.value as discount_value,
         v.type as discount_type,
         v.valid_until as expiry_date
  INTO v_user_voucher
  FROM user_vouchers uv
  JOIN vouchers v ON uv.voucher_id = v.id
  WHERE uv.id = p_user_voucher_id
    AND uv.user_id = v_customer_id
    AND uv.status IN ('active', 'available');
  
  IF v_user_voucher IS NULL THEN
    RAISE EXCEPTION 'Voucher not available or does not belong to user';
  END IF;
  
  -- Check if voucher is expired
  IF v_user_voucher.expiry_date IS NOT NULL AND v_user_voucher.expiry_date < NOW() THEN
    RAISE EXCEPTION 'Voucher has expired';
  END IF;
  
  -- Calculate the new total price
  v_new_total := COALESCE(v_booking.subtotal, 0) + 
                 COALESCE(v_booking.service_fee, 0) + 
                 COALESCE(v_booking.travel_fee, 0) - 
                 COALESCE(p_discount_applied, 0);
                 
  IF v_new_total < 0 THEN
    v_new_total := 0;
  END IF;
  
  -- Mark voucher as used (WITHOUT trying to set booking_id)
  UPDATE user_vouchers
  SET 
    status = 'used',
    used_at = NOW()
    -- REMOVED: booking_id = p_booking_id (column doesn't exist)
  WHERE id = p_user_voucher_id;
  
  -- Create booking_voucher record (this is where booking linkage is tracked)
  INSERT INTO booking_vouchers (
    booking_id,        -- Booking linkage is HERE
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
    p_booking_id,      -- Booking linkage is HERE
    p_user_voucher_id,
    v_customer_id,
    v_user_voucher.code,
    v_user_voucher.title,
    CASE WHEN v_user_voucher.discount_type = 'fixed' 
         THEN v_user_voucher.discount_value 
         ELSE NULL END,
    CASE WHEN v_user_voucher.discount_type = 'percentage' 
         THEN v_user_voucher.discount_value::INTEGER 
         ELSE NULL END,
    p_original_total,
    p_discount_applied,
    v_new_total
  )
  RETURNING id INTO v_booking_voucher_id;
  
  -- Update booking with discount (if not already set)
  UPDATE bookings
  SET 
    discount_amount = GREATEST(COALESCE(discount_amount, 0), p_discount_applied),
    total_price = v_new_total
  WHERE id = p_booking_id;
  
  RAISE NOTICE 'Voucher % applied to booking %, discount: %, new total: %', 
    v_user_voucher.code, p_booking_id, p_discount_applied, v_new_total;
  
  RETURN jsonb_build_object(
    'success', true,
    'booking_voucher_id', v_booking_voucher_id,
    'discount_applied', p_discount_applied,
    'new_total', v_new_total,
    'message', 'Voucher applied successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in apply_voucher_to_booking: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;

-- 4. cancel_booking
CREATE OR REPLACE FUNCTION public.cancel_booking(p_booking_id uuid, p_customer_id uuid, p_cancellation_reason text)
 RETURNS TABLE(success boolean, message text, refund_eligible boolean)
 LANGUAGE plpgsql
AS $function$
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
$function$;

-- 5. check_radius_cooldown
CREATE OR REPLACE FUNCTION public.check_radius_cooldown(barber_id uuid)
 RETURNS TABLE(can_change boolean, hours_remaining integer, last_changed_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_last_changed TIMESTAMPTZ;
  v_hours_since_change NUMERIC;
BEGIN
  -- Fetch last radius change timestamp
  SELECT last_radius_change_at 
  INTO v_last_changed
  FROM barbers 
  WHERE id = barber_id;
  
  -- If barber not found, return cannot change
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  -- If never changed (NULL), can change anytime
  IF v_last_changed IS NULL THEN
    RETURN QUERY SELECT true, 0, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  -- Calculate hours since last change using server time (NOW())
  v_hours_since_change := EXTRACT(EPOCH FROM (NOW() - v_last_changed)) / 3600;
  
  -- Check if 24 hours have passed
  IF v_hours_since_change >= 24 THEN
    RETURN QUERY SELECT true, 0, v_last_changed;
  ELSE
    -- Calculate remaining hours (rounded up)
    RETURN QUERY SELECT 
      false, 
      CEIL(24 - v_hours_since_change)::INTEGER, 
      v_last_changed;
  END IF;
END;
$function$;

-- 6. create_booking (3 overloaded versions)
-- Version 1: Basic
CREATE OR REPLACE FUNCTION public.create_booking(p_customer_id uuid, p_barber_id uuid, p_services jsonb, p_scheduled_date date, p_scheduled_time time without time zone, p_service_type text, p_barbershop_id uuid DEFAULT NULL::uuid, p_customer_address jsonb DEFAULT NULL::jsonb, p_customer_notes text DEFAULT NULL::text, p_payment_method text DEFAULT 'cash'::text)
 RETURNS TABLE(booking_id uuid, booking_number text, total_price numeric, message text)
 LANGUAGE plpgsql
AS $function$
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
    payment_method,
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
    p_payment_method::payment_method,
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
$function$;

-- 7. deduct_customer_credit
CREATE OR REPLACE FUNCTION public.deduct_customer_credit(p_user_id uuid, p_amount numeric, p_source text, p_description text, p_booking_id uuid DEFAULT NULL::uuid, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(success boolean, new_balance numeric, transaction_id uuid, error_message text)
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_current_balance DECIMAL(10,2);
  v_new_balance DECIMAL(10,2);
  v_transaction_id UUID;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN QUERY SELECT FALSE, 0.00::DECIMAL(10,2), NULL::UUID, 'Invalid amount'::TEXT;
    RETURN;
  END IF;
  
  -- Get current balance
  SELECT balance INTO v_current_balance
  FROM customer_credits
  WHERE user_id = p_user_id;
  
  -- Check if user has credits record
  IF v_current_balance IS NULL THEN
    RETURN QUERY SELECT FALSE, 0.00::DECIMAL(10,2), NULL::UUID, 'No credits account found'::TEXT;
    RETURN;
  END IF;
  
  -- Check sufficient balance
  IF v_current_balance < p_amount THEN
    RETURN QUERY SELECT FALSE, v_current_balance, NULL::UUID, 'Insufficient credits'::TEXT;
    RETURN;
  END IF;
  
  -- Update balance
  UPDATE customer_credits
  SET 
    balance = balance - p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;
  
  -- Log transaction
  INSERT INTO credit_transactions (
    user_id,
    type,
    source,
    amount,
    balance_after,
    description,
    booking_id,
    metadata
  ) VALUES (
    p_user_id,
    'deduct',
    p_source,
    p_amount,
    v_new_balance,
    p_description,
    p_booking_id,
    p_metadata
  ) RETURNING id INTO v_transaction_id;
  
  RETURN QUERY SELECT TRUE, v_new_balance, v_transaction_id, NULL::TEXT;
END;
$function$;

-- 8. delete_customer_address_direct
CREATE OR REPLACE FUNCTION public.delete_customer_address_direct(p_address_id uuid, p_customer_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify the address belongs to the user
  IF NOT EXISTS (
    SELECT 1 FROM customer_addresses 
    WHERE id = p_address_id AND user_id = p_customer_id
  ) THEN
    RAISE EXCEPTION 'Address not found or unauthorized';
  END IF;

  -- Delete the address
  DELETE FROM customer_addresses
  WHERE id = p_address_id AND user_id = p_customer_id;

  RETURN TRUE;
END;
$function$;

-- 9. get_customer_addresses
CREATE OR REPLACE FUNCTION public.get_customer_addresses(p_user_id uuid)
 RETURNS TABLE(id uuid, label text, address_line1 text, address_line2 text, city text, state text, postal_code text, latitude double precision, longitude double precision, is_default boolean, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
AS $function$
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
$function$;

-- 10. get_customer_bookings  
CREATE OR REPLACE FUNCTION public.get_customer_bookings(p_customer_id uuid, p_status text DEFAULT NULL::text, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, booking_number text, status booking_status, barber_id uuid, barber_name text, barber_avatar text, barber_is_verified boolean, barber_rating numeric, barber_total_reviews integer, barber_completed_jobs integer, barbershop_name text, services jsonb, scheduled_date date, scheduled_time time without time zone, scheduled_datetime timestamp with time zone, service_type text, customer_address jsonb, subtotal numeric, service_fee numeric, travel_fee numeric, total_price numeric, payment_method payment_method, payment_status payment_status, customer_notes text, barber_notes text, review_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.booking_number,
    b.status,
    b.barber_id,
    p.full_name AS barber_name,
    p.avatar_url AS barber_avatar,
    COALESCE(bar.is_verified, false) AS barber_is_verified,
    COALESCE(bar.rating, 0::DECIMAL)::DECIMAL(3,2) AS barber_rating,
    COALESCE(bar.total_reviews, 0) AS barber_total_reviews,
    COALESCE(bar.completed_bookings, 0) AS barber_completed_jobs,
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
    r.id AS review_id,
    b.created_at,
    b.updated_at
  FROM bookings b
  LEFT JOIN barbers bar ON b.barber_id = bar.id
  LEFT JOIN profiles p ON bar.user_id = p.id
  LEFT JOIN barbershops bs ON b.barbershop_id = bs.id
  LEFT JOIN reviews r ON b.id = r.booking_id
  WHERE b.customer_id = p_customer_id
    AND (p_status IS NULL OR b.status::TEXT = p_status)
  ORDER BY b.scheduled_datetime DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

-- 11. get_nearby_barbers
CREATE OR REPLACE FUNCTION public.get_nearby_barbers(customer_lat double precision, customer_lng double precision, radius_km double precision, buffer_multiplier double precision DEFAULT 1.5)
 RETURNS TABLE(id uuid, user_id uuid, name text, email text, avatar_url text, phone_number text, bio text, experience_years integer, specializations text[], service_radius_km integer, base_price numeric, portfolio_urls text[], average_rating numeric, total_reviews integer, completed_bookings integer, total_bookings integer, is_online boolean, is_available boolean, location_lat double precision, location_lng double precision, straight_line_distance_km numeric, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.user_id,
    p.full_name AS name,
    p.email,
    p.avatar_url,
    p.phone_number,
    b.bio,
    b.experience_years,
    b.specializations,
    b.service_radius_km,
    b.base_price,
    b.portfolio_images AS portfolio_urls,
    COALESCE(b.rating, 0::DECIMAL)::DECIMAL(3,2) AS average_rating,
    COALESCE(b.total_reviews, 0) AS total_reviews,
    COALESCE(b.completed_bookings, 0) AS completed_bookings,  -- ADDED
    COALESCE(b.total_bookings, 0) AS total_bookings,          -- ADDED
    COALESCE(p.is_online, false) AS is_online,
    COALESCE(b.is_available, false) AS is_available,
    -- Extract lat/lng from PostGIS location
    ST_Y(p.location::geometry)::DOUBLE PRECISION AS location_lat,
    ST_X(p.location::geometry)::DOUBLE PRECISION AS location_lng,
    -- Calculate straight-line distance in km
    ROUND(
      (ST_Distance(
        ST_MakePoint(customer_lng, customer_lat)::geography,
        p.location
      ) / 1000)::numeric, 3
    )::DECIMAL(10,3) AS straight_line_distance_km,
    b.created_at
  FROM barbers b
  INNER JOIN profiles p ON b.user_id = p.id
  -- Check for active bookings
  LEFT JOIN bookings bk ON b.id = bk.barber_id 
    AND bk.status IN ('accepted', 'on_the_way', 'arrived', 'in_progress')
  WHERE 
    -- Only verified barbers
    b.is_verified = true
    -- Only online and available
    AND p.is_online = true
    AND b.is_available = true
    -- Exclude barbers with active bookings (busy with current job)
    AND bk.id IS NULL
    -- Filter by straight-line distance with buffer
    AND ST_DWithin(
      ST_MakePoint(customer_lng, customer_lat)::geography,
      p.location,
      (radius_km * buffer_multiplier * 1000)::integer  -- Convert km to meters
    )
    -- Barber must have valid location
    AND p.location IS NOT NULL
  ORDER BY straight_line_distance_km ASC;
END;
$function$;

-- 12. redeem_voucher
CREATE OR REPLACE FUNCTION public.redeem_voucher(p_user_id uuid, p_voucher_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

-- 13. set_default_customer_address
CREATE OR REPLACE FUNCTION public.set_default_customer_address(p_address_id uuid, p_customer_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify the address belongs to the user
  IF NOT EXISTS (
    SELECT 1 FROM customer_addresses 
    WHERE id = p_address_id AND user_id = p_customer_id
  ) THEN
    RAISE EXCEPTION 'Address not found or unauthorized';
  END IF;

  -- Unset all defaults for this user
  UPDATE customer_addresses
  SET is_default = FALSE
  WHERE user_id = p_customer_id;

  -- Set new default
  UPDATE customer_addresses
  SET is_default = TRUE
  WHERE id = p_address_id AND user_id = p_customer_id;

  RETURN TRUE;
END;
$function$;

-- 14. setup_barbershop_owner
CREATE OR REPLACE FUNCTION public.setup_barbershop_owner(p_user_id uuid, p_shop_name text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_barbershop_id UUID;
  v_result JSONB;
BEGIN
  -- Verify user exists
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_user_id 
    AND role IN ('barber', 'barbershop_owner')
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found or invalid role'
    );
  END IF;

  -- Update user role to barbershop_owner if not already
  UPDATE profiles
  SET 
    role = 'barbershop_owner',
    updated_at = NOW()
  WHERE id = p_user_id
  AND role != 'barbershop_owner';

  -- Check if barbershop already exists
  IF EXISTS (SELECT 1 FROM barbershops WHERE owner_id = p_user_id) THEN
    SELECT id INTO v_barbershop_id FROM barbershops WHERE owner_id = p_user_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'barbershop_id', v_barbershop_id,
      'message', 'Barbershop account already exists'
    );
  END IF;

  -- Create placeholder barbershop record
  -- Will be completed during onboarding
  INSERT INTO barbershops (
    owner_id,
    name,
    address_line1,
    city,
    state,
    location,
    verification_status
  ) VALUES (
    p_user_id,
    COALESCE(p_shop_name, 'My Barbershop'), -- Placeholder name
    'To be updated', -- Placeholder address
    'To be updated',
    'To be updated',
    ST_SetSRID(ST_MakePoint(101.6869, 3.1390), 4326), -- Default to KL
    'unverified'
  )
  RETURNING id INTO v_barbershop_id;

  RETURN jsonb_build_object(
    'success', true,
    'barbershop_id', v_barbershop_id,
    'message', 'Barbershop owner account created'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;

-- 15. setup_freelance_barber
CREATE OR REPLACE FUNCTION public.setup_freelance_barber(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_barber_id UUID;
  v_result JSONB;
BEGIN
  -- Verify user exists and has barber role
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_user_id 
    AND role = 'barber'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found or not a barber'
    );
  END IF;

  -- Check if barber record already exists
  IF EXISTS (SELECT 1 FROM barbers WHERE user_id = p_user_id) THEN
    -- Return existing barber
    SELECT id INTO v_barber_id FROM barbers WHERE user_id = p_user_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'barber_id', v_barber_id,
      'message', 'Barber account already exists'
    );
  END IF;

  -- Create barber record with defaults
  INSERT INTO barbers (
    user_id,
    verification_status,
    is_available,
    service_radius_km,
    rating,
    total_reviews,
    total_bookings,
    completed_bookings
  ) VALUES (
    p_user_id,
    'unverified',
    false, -- Not available until onboarding complete
    10,
    0.00,
    0,
    0,
    0
  )
  RETURNING id INTO v_barber_id;

  RETURN jsonb_build_object(
    'success', true,
    'barber_id', v_barber_id,
    'message', 'Freelance barber account created'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;

-- 16. submit_review
CREATE OR REPLACE FUNCTION public.submit_review(p_booking_id uuid, p_customer_id uuid, p_rating integer, p_comment text DEFAULT NULL::text, p_images text[] DEFAULT NULL::text[])
 RETURNS TABLE(review_id uuid, success boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- 17. update_booking_status
CREATE OR REPLACE FUNCTION public.update_booking_status(p_booking_id uuid, p_new_status booking_status, p_updated_by uuid DEFAULT NULL::uuid, p_notes text DEFAULT NULL::text)
 RETURNS TABLE(success boolean, message text, updated_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
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
  
  -- Update booking status with proper timestamp tracking
  UPDATE bookings
  SET 
    status = p_new_status,
    barber_notes = CASE WHEN p_notes IS NOT NULL THEN p_notes ELSE barber_notes END,
    accepted_at = CASE WHEN p_new_status = 'accepted' AND accepted_at IS NULL THEN NOW() ELSE accepted_at END,
    on_the_way_at = CASE WHEN p_new_status = 'on_the_way' AND on_the_way_at IS NULL THEN NOW() ELSE on_the_way_at END,
    arrived_at = CASE WHEN p_new_status = 'arrived' AND arrived_at IS NULL THEN NOW() ELSE arrived_at END,
    started_at = CASE WHEN p_new_status = 'in_progress' AND started_at IS NULL THEN NOW() ELSE started_at END,
    completed_at = CASE WHEN p_new_status = 'completed' AND completed_at IS NULL THEN NOW() ELSE completed_at END,
    cancelled_at = CASE WHEN p_new_status = 'cancelled' AND cancelled_at IS NULL THEN NOW() ELSE cancelled_at END,
    updated_at = NOW()
  WHERE id = p_booking_id
  RETURNING bookings.updated_at INTO v_updated_at;  -- Fix: Explicitly specify table name
  
  RETURN QUERY SELECT TRUE, 'Status updated successfully'::TEXT, v_updated_at;
END;
$function$;

-- 18. update_customer_address
CREATE OR REPLACE FUNCTION public.update_customer_address(p_address_id uuid, p_label text DEFAULT NULL::text, p_address_line1 text DEFAULT NULL::text, p_address_line2 text DEFAULT NULL::text, p_city text DEFAULT NULL::text, p_state text DEFAULT NULL::text, p_postal_code text DEFAULT NULL::text, p_latitude numeric DEFAULT NULL::numeric, p_longitude numeric DEFAULT NULL::numeric, p_is_default boolean DEFAULT NULL::boolean, p_building_name text DEFAULT NULL::text, p_floor text DEFAULT NULL::text, p_unit_number text DEFAULT NULL::text, p_delivery_instructions text DEFAULT NULL::text, p_contact_number text DEFAULT NULL::text, p_address_type text DEFAULT NULL::text, p_landmark text DEFAULT NULL::text)
 RETURNS customer_addresses
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_address customer_addresses;
  v_user_id UUID;
BEGIN
  -- Get user_id for this address
  SELECT user_id INTO v_user_id
  FROM customer_addresses
  WHERE id = p_address_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Address not found';
  END IF;

  -- If setting as default, unset other defaults
  IF p_is_default THEN
    UPDATE customer_addresses
    SET is_default = FALSE
    WHERE user_id = v_user_id
      AND is_default = TRUE
      AND id != p_address_id;
  END IF;

  -- Update address (WITHOUT latitude/longitude since they're generated columns)
  UPDATE customer_addresses
  SET
    label = COALESCE(p_label, label),
    address_line1 = COALESCE(p_address_line1, address_line1),
    address_line2 = COALESCE(p_address_line2, address_line2),
    city = COALESCE(p_city, city),
    state = COALESCE(p_state, state),
    postal_code = COALESCE(p_postal_code, postal_code),
    -- ❌ Removed latitude/longitude updates - they are generated columns!
    is_default = COALESCE(p_is_default, is_default),
    building_name = COALESCE(p_building_name, building_name),
    floor = COALESCE(p_floor, floor),
    unit_number = COALESCE(p_unit_number, unit_number),
    delivery_instructions = COALESCE(p_delivery_instructions, delivery_instructions),
    contact_number = COALESCE(p_contact_number, contact_number),
    address_type = COALESCE(p_address_type, address_type),
    landmark = COALESCE(p_landmark, landmark),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_address_id
  RETURNING * INTO v_address;

  RETURN v_address;
END;
$function$;

-- 19. update_service_radius
CREATE OR REPLACE FUNCTION public.update_service_radius(barber_id uuid, new_radius integer)
 RETURNS TABLE(success boolean, service_radius_km integer, last_radius_change_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_can_change BOOLEAN;
  v_hours_remaining INTEGER;
  v_last_changed TIMESTAMPTZ;
BEGIN
  -- Check cooldown using server-side function
  SELECT cc.can_change, cc.hours_remaining, cc.last_changed_at
  INTO v_can_change, v_hours_remaining, v_last_changed
  FROM check_radius_cooldown(barber_id) cc;
  
  -- If cooldown is still active, return failure
  IF NOT v_can_change THEN
    RETURN QUERY SELECT false, NULL::INTEGER, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  -- Validate radius range (1-20 km)
  IF new_radius < 1 OR new_radius > 20 THEN
    RETURN QUERY SELECT false, NULL::INTEGER, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  -- Update with server-side NOW() timestamp
  UPDATE barbers
  SET 
    service_radius_km = new_radius,
    last_radius_change_at = NOW(),  -- Server time, not client time!
    updated_at = NOW()
  WHERE id = barber_id;
  
  -- Return success with updated values
  RETURN QUERY 
    SELECT 
      true,
      new_radius,
      NOW()
    FROM barbers 
    WHERE id = barber_id;
END;
$function$;

-- 20. update_tracking_metrics
CREATE OR REPLACE FUNCTION public.update_tracking_metrics(p_booking_id uuid, p_distance_km numeric, p_eta_minutes integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE bookings
  SET
    tracking_last_updated_at = NOW(),
    current_distance_km = p_distance_km,
    current_eta_minutes = p_eta_minutes,
    estimated_arrival_time = NOW() + (p_eta_minutes || ' minutes')::INTERVAL
  WHERE id = p_booking_id
    AND status IN ('accepted', 'confirmed', 'in_progress');
END;
$function$;

-- 21. use_voucher
CREATE OR REPLACE FUNCTION public.use_voucher(p_user_voucher_id uuid, p_booking_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

-- Note: There are also overloaded versions of create_booking with different parameters
-- They handle travel_fee and discount_amount parameters