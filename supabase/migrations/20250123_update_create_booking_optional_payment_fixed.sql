-- Update create_booking to support booking-first payment flow
-- Payment IDs are now optional - booking can be created without payment

-- Drop ALL existing versions of create_booking function
DROP FUNCTION IF EXISTS create_booking(UUID, UUID, JSONB, DATE, TIME, TEXT, UUID, JSONB, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_booking(UUID, UUID, JSONB, DATE, TIME, TEXT, UUID, JSONB, TEXT, TEXT, NUMERIC, NUMERIC);
DROP FUNCTION IF EXISTS create_booking(UUID, UUID, JSONB, DATE, TIME, TEXT, UUID, JSONB, TEXT, TEXT, NUMERIC);
DROP FUNCTION IF EXISTS create_booking(UUID, UUID, JSONB, DATE, TIME, TEXT, UUID, JSONB, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_booking CASCADE;

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
  p_travel_fee NUMERIC DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT NULL,
  p_curlec_payment_id TEXT DEFAULT NULL, -- NOW OPTIONAL
  p_curlec_order_id TEXT DEFAULT NULL     -- NOW OPTIONAL
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
  v_scheduled_datetime TIMESTAMPTZ;
  v_service JSONB;
  v_payment_status payment_status;
BEGIN
  -- Calculate total from services
  FOR v_service IN SELECT * FROM jsonb_array_elements(p_services)
  LOOP
    v_subtotal := v_subtotal + (v_service->>'price')::NUMERIC;
    v_duration := v_duration + (v_service->>'duration')::INTEGER;
  END LOOP;
  
  -- Apply discount if provided
  IF p_discount_amount IS NOT NULL AND p_discount_amount > 0 THEN
    v_discount := p_discount_amount;
  END IF;
  
  -- Calculate travel fee
  IF p_travel_fee IS NOT NULL THEN
    v_travel_fee := p_travel_fee;
  ELSIF p_service_type = 'home_service' THEN
    v_travel_fee := 5.00; -- Default travel fee
  ELSE
    v_travel_fee := 0.00;
  END IF;
  
  -- Calculate total price
  v_total_price := v_subtotal + v_service_fee + v_travel_fee - v_discount;
  
  -- Generate booking number
  v_booking_number := 'MG' || TO_CHAR(NOW(), 'YYYYMMDD') || 
                      LPAD((SELECT COUNT(*) + 1 FROM bookings WHERE created_at::date = CURRENT_DATE)::TEXT, 3, '0');
  
  -- Combine date and time for scheduled_datetime
  v_scheduled_datetime := (p_scheduled_date || ' ' || p_scheduled_time)::TIMESTAMPTZ;
  
  -- Determine payment status based on payment method and payment IDs
  IF p_payment_method = 'cash' THEN
    v_payment_status := 'pending'; -- Cash payment pending
  ELSIF p_curlec_payment_id IS NOT NULL THEN
    v_payment_status := 'authorized'; -- Payment provided, authorized
  ELSE
    v_payment_status := 'pending_payment'; -- Online payment but not paid yet
  END IF;
  
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
    v_payment_status,
    p_customer_notes,
    p_curlec_payment_id,
    p_curlec_order_id
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
$$;

COMMENT ON FUNCTION create_booking IS 'Creates a booking - payment IDs are optional for booking-first flow';
