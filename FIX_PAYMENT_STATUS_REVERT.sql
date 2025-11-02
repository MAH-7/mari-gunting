-- URGENT FIX: Revert payment status logic to original (working) version
-- Run this in Supabase Dashboard SQL Editor

DROP FUNCTION IF EXISTS create_booking;

CREATE OR REPLACE FUNCTION create_booking(
  p_customer_id UUID,
  p_barber_id UUID,
  p_services JSONB,
  p_scheduled_datetime TIMESTAMPTZ,
  p_service_type TEXT,
  p_barbershop_id UUID DEFAULT NULL,
  p_customer_address JSONB DEFAULT NULL,
  p_customer_notes TEXT DEFAULT NULL,
  p_payment_method TEXT DEFAULT 'cash',
  p_travel_fee NUMERIC DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT NULL,
  p_distance_km NUMERIC DEFAULT NULL,
  p_curlec_payment_id TEXT DEFAULT NULL,
  p_curlec_order_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  booking_id UUID,
  booking_number TEXT,
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
  v_travel_fee NUMERIC(10,2);
  v_discount NUMERIC(10,2) := 0;
  v_total_price NUMERIC(10,2);
  v_service JSONB;
  v_payment_status payment_status;
  v_scheduled_date DATE;
  v_scheduled_time TIME;
BEGIN
  FOR v_service IN SELECT * FROM jsonb_array_elements(p_services)
  LOOP
    v_subtotal := v_subtotal + (v_service->>'price')::NUMERIC;
    v_duration := v_duration + (v_service->>'duration')::INTEGER;
  END LOOP;
  
  IF p_discount_amount IS NOT NULL AND p_discount_amount > 0 THEN
    v_discount := p_discount_amount;
  END IF;
  
  IF p_travel_fee IS NOT NULL THEN
    v_travel_fee := p_travel_fee;
  ELSIF p_service_type = 'home_service' THEN
    v_travel_fee := 5.00;
  ELSE
    v_travel_fee := 0.00;
  END IF;
  
  v_total_price := v_subtotal + v_service_fee + v_travel_fee - v_discount;
  
  v_booking_number := 'MG' || TO_CHAR(NOW(), 'YYYYMMDD') || 
                      LPAD((SELECT COUNT(*) + 1 FROM bookings WHERE created_at::date = CURRENT_DATE)::TEXT, 3, '0');
  
  v_scheduled_date := p_scheduled_datetime::DATE;
  v_scheduled_time := p_scheduled_datetime::TIME;
  
  -- ✅ REVERTED TO ORIGINAL PAYMENT LOGIC
  -- Only 2 statuses: 'pending' or 'completed'
  -- No 'pending_payment' or 'authorized'
  IF (p_payment_method LIKE 'curlec%') AND p_curlec_payment_id IS NOT NULL THEN
    v_payment_status := 'completed';
  ELSIF p_payment_method = 'credits' THEN
    v_payment_status := 'completed';
  ELSE
    v_payment_status := 'pending';
  END IF;
  
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
    distance_km,
    total_price,
    payment_method,
    payment_status,
    customer_notes,
    curlec_payment_id,
    curlec_order_id
  ) VALUES (
    p_customer_id,
    p_barber_id,
    p_barbershop_id,
    v_booking_number,
    'pending',
    p_services,
    v_scheduled_date,
    v_scheduled_time,
    p_scheduled_datetime,
    v_duration,
    p_service_type,
    p_customer_address,
    v_subtotal,
    v_service_fee,
    v_travel_fee,
    p_distance_km,
    v_total_price,
    p_payment_method::payment_method,
    v_payment_status,
    p_customer_notes,
    p_curlec_payment_id,
    p_curlec_order_id
  )
  RETURNING id INTO v_booking_id;
  
  RETURN QUERY
  SELECT 
    v_booking_id,
    v_booking_number,
    v_total_price,
    'Booking created successfully'::TEXT;
END;
$$;

COMMENT ON FUNCTION create_booking IS 'Creates a booking - timezone-aware with ORIGINAL payment status logic (pending or completed only)';

-- ✅ Fixed! Payment status now back to your original logic:
-- - Curlec with payment ID → 'completed'
-- - Credits → 'completed'  
-- - Everything else → 'pending'
-- No more 'pending_payment' or 'authorized'
