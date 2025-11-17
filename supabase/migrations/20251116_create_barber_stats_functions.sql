-- Migration: Create RPC functions for barber earnings statistics
-- Purpose: Calculate accurate earnings from all completed bookings (not limited by client fetch)
-- Date: 2025-11-16

-- =====================================================
-- Function 1: Get Daily Stats
-- =====================================================
CREATE OR REPLACE FUNCTION get_barber_daily_stats(
  p_barber_id UUID,
  p_date DATE
)
RETURNS TABLE (
  earnings NUMERIC,
  jobs_count INTEGER,
  service_total NUMERIC,
  travel_total NUMERIC,
  commission NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Barber earnings = (service_total * 0.85) + travel_fee
    COALESCE(
      SUM(
        (
          -- Extract service prices from JSONB and sum them
          (
            SELECT COALESCE(SUM((svc->>'price')::NUMERIC), 0)
            FROM jsonb_array_elements(b.services) AS svc
          ) * 0.85  -- Barber gets 85%
        ) + COALESCE(b.travel_fee, 0)  -- Plus full travel fee
      ), 0
    )::NUMERIC AS earnings,
    
    COUNT(*)::INTEGER AS jobs_count,
    
    -- Service total (before commission)
    COALESCE(
      SUM(
        (
          SELECT COALESCE(SUM((svc->>'price')::NUMERIC), 0)
          FROM jsonb_array_elements(b.services) AS svc
        )
      ), 0
    )::NUMERIC AS service_total,
    
    -- Travel fee total
    COALESCE(SUM(b.travel_fee), 0)::NUMERIC AS travel_total,
    
    -- Commission (15% of services)
    COALESCE(
      SUM(
        (
          SELECT COALESCE(SUM((svc->>'price')::NUMERIC), 0)
          FROM jsonb_array_elements(b.services) AS svc
        ) * 0.15
      ), 0
    )::NUMERIC AS commission
    
  FROM bookings b
  WHERE b.barber_id = p_barber_id
    AND b.status = 'completed'
    AND DATE(b.scheduled_datetime) = p_date;
END;
$$;

-- =====================================================
-- Function 2: Get Monthly Stats
-- =====================================================
CREATE OR REPLACE FUNCTION get_barber_monthly_stats(
  p_barber_id UUID,
  p_month INTEGER,  -- 1-12
  p_year INTEGER
)
RETURNS TABLE (
  earnings NUMERIC,
  jobs_count INTEGER,
  service_total NUMERIC,
  travel_total NUMERIC,
  commission NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Barber earnings = (service_total * 0.85) + travel_fee
    COALESCE(
      SUM(
        (
          -- Extract service prices from JSONB and sum them
          (
            SELECT COALESCE(SUM((svc->>'price')::NUMERIC), 0)
            FROM jsonb_array_elements(b.services) AS svc
          ) * 0.85  -- Barber gets 85%
        ) + COALESCE(b.travel_fee, 0)  -- Plus full travel fee
      ), 0
    )::NUMERIC AS earnings,
    
    COUNT(*)::INTEGER AS jobs_count,
    
    -- Service total (before commission)
    COALESCE(
      SUM(
        (
          SELECT COALESCE(SUM((svc->>'price')::NUMERIC), 0)
          FROM jsonb_array_elements(b.services) AS svc
        )
      ), 0
    )::NUMERIC AS service_total,
    
    -- Travel fee total
    COALESCE(SUM(b.travel_fee), 0)::NUMERIC AS travel_total,
    
    -- Commission (15% of services)
    COALESCE(
      SUM(
        (
          SELECT COALESCE(SUM((svc->>'price')::NUMERIC), 0)
          FROM jsonb_array_elements(b.services) AS svc
        ) * 0.15
      ), 0
    )::NUMERIC AS commission
    
  FROM bookings b
  WHERE b.barber_id = p_barber_id
    AND b.status = 'completed'
    AND EXTRACT(MONTH FROM b.scheduled_datetime) = p_month
    AND EXTRACT(YEAR FROM b.scheduled_datetime) = p_year;
END;
$$;

-- =====================================================
-- Function 3: Get Period Stats (Week, All Time, Custom)
-- =====================================================
CREATE OR REPLACE FUNCTION get_barber_period_stats(
  p_barber_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  earnings NUMERIC,
  jobs_count INTEGER,
  service_total NUMERIC,
  travel_total NUMERIC,
  commission NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Barber earnings = (service_total * 0.85) + travel_fee
    COALESCE(
      SUM(
        (
          -- Extract service prices from JSONB and sum them
          (
            SELECT COALESCE(SUM((svc->>'price')::NUMERIC), 0)
            FROM jsonb_array_elements(b.services) AS svc
          ) * 0.85  -- Barber gets 85%
        ) + COALESCE(b.travel_fee, 0)  -- Plus full travel fee
      ), 0
    )::NUMERIC AS earnings,
    
    COUNT(*)::INTEGER AS jobs_count,
    
    -- Service total (before commission)
    COALESCE(
      SUM(
        (
          SELECT COALESCE(SUM((svc->>'price')::NUMERIC), 0)
          FROM jsonb_array_elements(b.services) AS svc
        )
      ), 0
    )::NUMERIC AS service_total,
    
    -- Travel fee total
    COALESCE(SUM(b.travel_fee), 0)::NUMERIC AS travel_total,
    
    -- Commission (15% of services)
    COALESCE(
      SUM(
        (
          SELECT COALESCE(SUM((svc->>'price')::NUMERIC), 0)
          FROM jsonb_array_elements(b.services) AS svc
        ) * 0.15
      ), 0
    )::NUMERIC AS commission
    
  FROM bookings b
  WHERE b.barber_id = p_barber_id
    AND b.status = 'completed'
    AND DATE(b.scheduled_datetime) >= p_start_date
    AND DATE(b.scheduled_datetime) <= p_end_date;
END;
$$;

-- =====================================================
-- Grant Execute Permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION get_barber_daily_stats(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_barber_monthly_stats(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_barber_period_stats(UUID, DATE, DATE) TO authenticated;

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON FUNCTION get_barber_daily_stats IS 'Calculate barber earnings for a specific day from all completed bookings';
COMMENT ON FUNCTION get_barber_monthly_stats IS 'Calculate barber earnings for a specific month from all completed bookings';
COMMENT ON FUNCTION get_barber_period_stats IS 'Calculate barber earnings for a date range (week, all time, custom) from all completed bookings';
