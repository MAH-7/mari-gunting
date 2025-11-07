-- ============================================
-- FIX: Use client-calculated Mapbox distance
-- ============================================
-- ISSUE: Server uses PostGIS (5 km straight-line)
--        Customer uses Mapbox (8.2 km driving route)
--        Result: Price mismatch (customer sees RM 9.50, charged RM 6)
-- 
-- FIX: Accept pre-calculated distance from client
--      Client already called Mapbox API and showed price to customer
--      Server uses that distance to match customer expectation
--      Keeps PostGIS as fallback if distance not provided
-- 
-- SAFETY: Backward compatible - adds 1 optional parameter at end
--         Old calls without distance still work (use PostGIS fallback)
-- ============================================

BEGIN;

-- Drop old function first (12 parameters)
DROP FUNCTION IF EXISTS public.create_booking_v2(
  uuid, uuid, uuid[], timestamp with time zone, text, 
  uuid, jsonb, text, text, uuid, text, text
);

-- Create new function with 13 parameters (adds p_distance_km)
CREATE OR REPLACE FUNCTION public.create_booking_v2(
  p_customer_id uuid, 
  p_barber_id uuid, 
  p_service_ids uuid[], 
  p_scheduled_datetime timestamp with time zone, 
  p_service_type text, 
  p_barbershop_id uuid DEFAULT NULL::uuid, 
  p_customer_address jsonb DEFAULT NULL::jsonb, 
  p_customer_notes text DEFAULT NULL::text, 
  p_payment_method text DEFAULT 'cash'::text, 
  p_user_voucher_id uuid DEFAULT NULL::uuid, 
  p_curlec_payment_id text DEFAULT NULL::text, 
  p_curlec_order_id text DEFAULT NULL::text,
  p_distance_km numeric DEFAULT NULL::numeric  -- NEW: Pre-calculated distance from client
)
RETURNS TABLE(booking_id uuid, booking_number text, subtotal numeric, service_fee numeric, travel_fee numeric, discount_amount numeric, total_price numeric, message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
  v_distance_km NUMERIC := 0;
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

  -- STEP 2: CALCULATE TRAVEL FEE
  IF p_service_type = 'home_service' THEN
    -- NEW: Use client-provided distance if available (Mapbox driving route)
    IF p_distance_km IS NOT NULL AND p_distance_km > 0 THEN
      v_distance_km := p_distance_km;
      RAISE NOTICE 'Using client-calculated distance: % km (Mapbox)', ROUND(v_distance_km, 2);
    ELSE
      -- Fallback: Calculate using PostGIS (straight-line)
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
        RAISE NOTICE 'Calculated distance (PostGIS fallback): % km', ROUND(v_distance_km, 2);
      ELSE
        -- No distance and no coordinates
        v_distance_km := 10.0;
        RAISE NOTICE 'Missing coordinates, using estimated 10 km';
      END IF;
    END IF;
    
    -- Calculate travel fee using standard formula
    IF v_distance_km <= 4 THEN
      v_travel_fee := 5.00;
    ELSE
      v_travel_fee := 5.00 + (v_distance_km - 4);
    END IF;
    
    -- Round UP to nearest RM 0.50 (Grab standard)
    v_travel_fee := CEIL(v_travel_fee * 2) / 2;
    
    RAISE NOTICE 'Travel fee: RM % for % km', v_travel_fee, ROUND(v_distance_km, 2);
  ELSE
    -- Walk-in service: 0 distance, 0 travel fee
    v_distance_km := 0.0;
    v_travel_fee := 0.00;
  END IF;

  -- STEP 3: VALIDATE AND APPLY VOUCHER
  IF p_user_voucher_id IS NOT NULL THEN
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
    
    INSERT INTO booking_vouchers (
      booking_id, user_voucher_id, customer_id, voucher_code, voucher_title,
      original_total, discount_applied, final_total
    ) VALUES (
      v_booking_id, p_user_voucher_id, p_customer_id, v_voucher.code, v_voucher.title,
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
$function$;

COMMENT ON FUNCTION create_booking_v2 IS 
  'SECURITY: Uses client-calculated Mapbox distance for consistency. Falls back to PostGIS if not provided.';

COMMIT;

-- ============================================
-- DEPLOYMENT NOTES
-- ============================================
-- ✅ Fixed distance mismatch issue
--
-- NEW PARAMETER:
-- - p_distance_km (optional) - Pre-calculated distance from client Mapbox API
--
-- BEHAVIOR:
-- 1. If client provides distance → Use it (Mapbox driving route)
-- 2. If not provided → Calculate with PostGIS (straight-line fallback)
-- 3. Travel fee formula: 0-4km = RM5, after = RM5 + RM1/km, round up to RM0.50
--
-- RESULT:
-- - Customer sees: 8.2 km, RM 9.50
-- - Server stores: 8.2 km, RM 9.50
-- - Partner sees: 8.2 km
-- - All consistent! ✅
