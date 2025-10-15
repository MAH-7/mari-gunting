-- =====================================================
-- REWARDS SYSTEM SEED DATA
-- Initial vouchers for testing and launch
-- =====================================================

-- Insert platform vouchers
INSERT INTO vouchers (
  code,
  title,
  description,
  type,
  value,
  points_cost,
  min_spend,
  max_discount,
  valid_from,
  valid_until,
  is_active,
  is_featured
) VALUES
  -- Welcome voucher (5 RM off)
  (
    'WELCOME5',
    'RM 5 OFF',
    'Welcome bonus - Minimum spend RM 30',
    'fixed',
    5.00,
    500,
    30.00,
    NULL,
    NOW(),
    NOW() + INTERVAL '6 months',
    TRUE,
    TRUE
  ),
  
  -- Mid-tier voucher (10 RM off)
  (
    'SAVE10',
    'RM 10 OFF',
    'Save RM 10 - Minimum spend RM 50',
    'fixed',
    10.00,
    800,
    50.00,
    NULL,
    NOW(),
    NOW() + INTERVAL '6 months',
    TRUE,
    FALSE
  ),
  
  -- Premium voucher (20% off)
  (
    'GROOMING20',
    '20% OFF',
    'Hair treatment services - Max discount RM 20',
    'percentage',
    20.00,
    1000,
    40.00,
    20.00,
    NOW(),
    NOW() + INTERVAL '6 months',
    TRUE,
    FALSE
  ),
  
  -- High-value voucher (15 RM off)
  (
    'PREMIUM15',
    'RM 15 OFF',
    'Premium services - Minimum spend RM 80',
    'fixed',
    15.00,
    1200,
    80.00,
    NULL,
    NOW(),
    NOW() + INTERVAL '6 months',
    TRUE,
    FALSE
  ),
  
  -- Loyalty voucher (10% off)
  (
    'LOYALTY10',
    '10% OFF',
    'Loyalty reward - Max discount RM 15',
    'percentage',
    10.00,
    600,
    30.00,
    15.00,
    NOW(),
    NOW() + INTERVAL '6 months',
    TRUE,
    FALSE
  ),
  
  -- Special limited voucher (expiring soon for testing)
  (
    'FLASH7',
    'RM 7 OFF - FLASH SALE',
    'Limited time only - Minimum spend RM 40',
    'fixed',
    7.00,
    300,
    40.00,
    NULL,
    NOW(),
    NOW() + INTERVAL '15 days',
    TRUE,
    TRUE
  );

-- Log the seed data
DO $$
BEGIN
  RAISE NOTICE 'Rewards system seed data inserted successfully';
  RAISE NOTICE '6 vouchers created for testing and launch';
END $$;
