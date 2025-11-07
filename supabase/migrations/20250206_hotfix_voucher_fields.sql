-- ============================================
-- HOTFIX: Voucher Booking Fields
-- Date: 2025-02-06
-- Issue: booking_vouchers requires voucher_code and voucher_title
-- ============================================

CREATE OR REPLACE FUNCTION create_booking_v2(
  p_customer_id UUID,
  p_barber_id UUID,
  p_service_ids UUID[],
  p_scheduled_datetime TIMESTAMPTZ,
  p_service_type TEXT,
  p_barbershop_id UUID DEFAULT NULL,
  p_customer_address JSONB DEFAULT NULL,
  p_customer_notes TEXT DEFAULT NULL,
  p_payment_method TEXT DEFAULT 'cash',
  p_user_voucher_id UUID DEFAULT NULL,
  p_curlec_payment_id TEXT DEFAULT NULL,
  p_curlec_order_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  booking_id UUID,
  booking_number TEXT,
  subtotal NUMERIC,
  service_fee NUMERIC,
  travel_fee NUMERIC,
  discount_amount NUMERIC,
  total_price NUMERIC,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking_id UUID;
  v_booking_number TEXT;
  v_subtotal NUMERIC(10,2) := 0;
  v_duration INTEGER := 0;
  v_service_fee NUMERIC(10,2) := 2.00;
  v_travel_fee NUMERIC(10,2) := 0;
  v_discount NUMERIC(10,2) := 0;
  v_total_price NUMERIC(10,2);
  v_services JSONB := '[]'::JSONB;
  v_service RECORD;
  v_payment_status payment_status;
  v_barber_location GEOGRAPHY;
  v_customer_location GEOGRAPHY;
  v_distance_km NUMERIC;
  v_voucher RECORD;
BEGIN
  -- SECURITY: Prevent self-booking
  IF EXISTS (
    SELECT 1 FROM barbers WHERE id = p_barber_id AND user_id = p_customer_id
  ) THEN
    RAISE EXCEPTION 'Cannot book yourself. Please choose another barber.';
  END IF;

  -- STEP 1: VALIDATE AND LOOKUP SERVICE PRICES
  FOR v_service IN
    SELECT s.id, s.name, s.price, s.duration_minutes, s.barber_id, s.barbershop_id
    FROM services s
    WHERE s.id = ANY(p_service_ids)
      AND s.is_active = TRUE
  LOOP
    IF v_service.barber_id IS NOT NULL AND v_service.barber_id != p_barber_id THEN
      RAISE EXCEPTION 'Service "%" does not belong to selected barber', v_service.name;
    END IF;
    
    IF v_service.barbershop_id IS NOT NULL AND v_service.barbershop_id != p_barbershop_id THEN
      RAISE EXCEPTION 'Service "%" does not belong to selected barbershop', v_service.name;
    END IF;

    v_subtotal := v_subtotal + v_service.price;
    v_duration := v_duration + v_service.duration_minutes;
    
    v_services := v_services || jsonb_build_object(
      'id', v_service.id,
      'name', v_service.name,
      'price', v_service.price,
      'duration', v_service.duration_minutes
    );
  END LOOP;

  IF jsonb_array_length(v_services) != array_length(p_service_ids, 1) THEN
    RAISE EXCEPTION 'One or more services not found or inactive';
  END IF;

  -- STEP 2: CALCULATE TRAVEL FEE SERVER-SIDE
  IF p_service_type = 'home_service' THEN
    SELECT p.location INTO v_barber_location
    FROM barbers b
    JOIN profiles p ON b.user_id = p.id
    WHERE b.id = p_barber_id;
    
    IF p_customer_address IS NOT NULL AND p_customer_address->>'lat' IS NOT NULL THEN
      v_customer_location := ST_SetSRID(
        ST_MakePoint(
          (p_customer_address->>'lng')::FLOAT,
          (p_customer_address->>'lat')::FLOAT
        ),
        4326
      )::GEOGRAPHY;
      
      v_distance_km := ST_Distance(v_barber_location, v_customer_location) / 1000.0;
      v_travel_fee := LEAST(GREATEST(v_distance_km * 0.50, 3.00), 20.00);
      
      RAISE NOTICE 'Travel fee: RM % for % km', v_travel_fee, ROUND(v_distance_km, 2);
    ELSE
      v_travel_fee := 5.00;
    END IF;
  ELSE
    v_travel_fee := 0.00;
  END IF;

  -- STEP 3: VALIDATE AND APPLY VOUCHER
  IF p_user_voucher_id IS NOT NULL THEN
    -- FIXED: SELECT voucher code and title
    SELECT 
      uv.id, uv.user_id, uv.status,
      v.code, v.title, v.type, v.value, v.min_spend, v.max_discount, v.valid_until
    INTO v_voucher
    FROM user_vouchers uv
    JOIN vouchers v ON uv.voucher_id = v.id
    WHERE uv.id = p_user_voucher_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Voucher not found';
    END IF;
    
    IF v_voucher.user_id != p_customer_id THEN
      RAISE EXCEPTION 'Voucher does not belong to this customer';
    END IF;
    
    IF v_voucher.status != 'active' THEN
      RAISE EXCEPTION 'Voucher is not active (status: %)', v_voucher.status;
    END IF;
    
    IF v_voucher.valid_until < NOW() THEN
      RAISE EXCEPTION 'Voucher has expired';
    END IF;
    
    IF (v_subtotal + v_service_fee + v_travel_fee) < v_voucher.min_spend THEN
      RAISE EXCEPTION 'Minimum spend of RM % required', v_voucher.min_spend;
    END IF;
    
    IF v_voucher.type = 'percentage' THEN
      v_discount := ROUND((v_subtotal * v_voucher.value / 100.0)::NUMERIC, 2);
    ELSIF v_voucher.type = 'fixed' THEN
      v_discount := v_voucher.value;
    END IF;
    
    IF v_voucher.max_discount IS NOT NULL THEN
      v_discount := LEAST(v_discount, v_voucher.max_discount);
    END IF;
    
    v_discount := LEAST(v_discount, v_subtotal);
    
    RAISE NOTICE 'Applied voucher: RM % discount', v_discount;
  END IF;

  -- STEP 4: CALCULATE FINAL TOTAL
  v_total_price := v_subtotal + v_service_fee + v_travel_fee - v_discount;
  v_total_price := GREATEST(v_total_price, 0);

  v_booking_number := 'MG' || TO_CHAR(NOW(), 'YYYYMMDD') || 
                      LPAD((SELECT COUNT(*) + 1 FROM bookings WHERE created_at::date = CURRENT_DATE)::TEXT, 3, '0');

  IF (p_payment_method LIKE 'curlec%') AND p_curlec_payment_id IS NOT NULL THEN
    v_payment_status := 'completed';
  ELSIF p_payment_method = 'credits' THEN
    v_payment_status := 'completed';
  ELSE
    v_payment_status := 'pending';
  END IF;

  -- STEP 5: INSERT BOOKING
  INSERT INTO bookings (
    customer_id, barber_id, barbershop_id, booking_number, status, services,
    scheduled_date, scheduled_time, scheduled_datetime, estimated_duration_minutes,
    service_type, customer_address, subtotal, service_fee, travel_fee, distance_km,
    discount_amount, total_price, payment_method, payment_status, customer_notes,
    curlec_payment_id, curlec_order_id
  ) VALUES (
    p_customer_id, p_barber_id, p_barbershop_id, v_booking_number, 'pending', v_services,
    p_scheduled_datetime::DATE, p_scheduled_datetime::TIME, p_scheduled_datetime, v_duration,
    p_service_type, p_customer_address, v_subtotal, v_service_fee, v_travel_fee, v_distance_km,
    v_discount, v_total_price, p_payment_method::payment_method, v_payment_status, p_customer_notes,
    p_curlec_payment_id, p_curlec_order_id
  )
  RETURNING id INTO v_booking_id;

  -- STEP 6: Mark voucher as used if applied
  IF p_user_voucher_id IS NOT NULL THEN
    UPDATE user_vouchers
    SET status = 'used', used_at = NOW()
    WHERE id = p_user_voucher_id;
    
    -- FIXED: Include voucher_code and voucher_title
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
    ) VALUES (
      v_booking_id, 
      p_user_voucher_id, 
      p_customer_id,
      v_voucher.code,
      v_voucher.title,
      CASE WHEN v_voucher.type = 'fixed' THEN v_voucher.value ELSE NULL END,
      CASE WHEN v_voucher.type = 'percentage' THEN v_voucher.value::INTEGER ELSE NULL END,
      v_subtotal + v_service_fee + v_travel_fee,
      v_discount,
      v_total_price
    );
  END IF;

  RETURN QUERY SELECT 
    v_booking_id,
    v_booking_number,
    v_subtotal,
    v_service_fee,
    v_travel_fee,
    v_discount,
    v_total_price,
    'Booking created successfully'::TEXT;
END;
$$;

COMMENT ON FUNCTION create_booking_v2 IS 
  'SECURITY: Validates service prices, calculates travel fees, applies vouchers server-side. HOTFIXED: voucher fields.';
