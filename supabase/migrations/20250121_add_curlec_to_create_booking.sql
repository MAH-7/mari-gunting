-- Add Curlec payment parameters to create_booking function
-- This allows saving Curlec payment and order IDs when creating bookings

CREATE OR REPLACE FUNCTION create_booking(
  p_customer_id UUID,
  p_barber_id UUID,
  p_services JSONB,
  p_scheduled_date DATE,
  p_scheduled_time TIME,
  p_service_type TEXT,
  p_barbershop_id UUID DEFAULT NULL,
  p_customer_address JSONB DEFAULT NULL,
  p_customer_notes TEXT DEFAULT NULL,
  p_payment_method TEXT DEFAULT 'cash',
  p_travel_fee DECIMAL DEFAULT NULL,
  p_discount_amount DECIMAL DEFAULT NULL,
  p_curlec_payment_id TEXT DEFAULT NULL,
  p_curlec_order_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  booking_id UUID,
  booking_number TEXT,
  total_price DECIMAL,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking_id UUID;
  v_booking_number TEXT;
  v_subtotal DECIMAL := 0;
  v_service_fee DECIMAL := 2.00;
  v_total_price DECIMAL;
  v_service JSONB;
BEGIN
  -- Calculate subtotal from services
  FOR v_service IN SELECT * FROM jsonb_array_elements(p_services)
  LOOP
    v_subtotal := v_subtotal + (v_service->>'price')::DECIMAL;
  END LOOP;
  
  -- Calculate total price
  v_total_price := v_subtotal + v_service_fee + COALESCE(p_travel_fee, 0) - COALESCE(p_discount_amount, 0);
  
  -- Generate booking number (format: MG + YYYYMMDD + sequential)
  SELECT 'MG' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(
    (COUNT(*) + 1)::TEXT, 3, '0'
  )
  INTO v_booking_number
  FROM bookings
  WHERE DATE(created_at) = CURRENT_DATE;
  
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
    discount_amount,
    total_price,
    payment_method,
    payment_status,
    customer_notes,
    curlec_payment_id,
    curlec_order_id,
    created_at,
    updated_at
  ) VALUES (
    p_customer_id,
    p_barber_id,
    p_barbershop_id,
    v_booking_number,
    'pending',
    p_services,
    p_scheduled_date,
    p_scheduled_time,
    (p_scheduled_date::TEXT || ' ' || p_scheduled_time::TEXT)::TIMESTAMP,
    (SELECT SUM((service->>'duration')::INTEGER) FROM jsonb_array_elements(p_services) AS service),
    p_service_type,
    p_customer_address,
    v_subtotal,
    v_service_fee,
    COALESCE(p_travel_fee, 0),
    COALESCE(p_discount_amount, 0),
    v_total_price,
    p_payment_method::payment_method,
    (CASE 
      WHEN (p_payment_method LIKE 'curlec%') AND p_curlec_payment_id IS NOT NULL THEN 'completed'
      WHEN p_payment_method = 'credits' THEN 'completed'
      ELSE 'pending'
    END)::payment_status,
    p_customer_notes,
    p_curlec_payment_id,
    p_curlec_order_id,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_booking_id;
  
  -- Return result
  RETURN QUERY SELECT 
    v_booking_id,
    v_booking_number,
    v_total_price,
    'Booking created successfully'::TEXT;
END;
$$;
