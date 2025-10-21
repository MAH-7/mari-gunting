-- ============================================
-- PRE-MIGRATION VERIFICATION
-- Run this BEFORE the migration to understand your data
-- ============================================

-- 1. Check column types
-- Note: active_tracking_sessions is a VIEW, not a table
SELECT 
  table_name,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name IN ('profiles', 'barbershops', 'bookings', 'customer_addresses', 'active_tracking_sessions')
  AND column_name LIKE '%location%'
ORDER BY table_name, column_name;

-- 2. Check existing indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('profiles', 'barbershops', 'bookings', 'customer_addresses')
  AND indexname LIKE '%location%';

-- 3. Sample location data (see format)
SELECT 'profiles' as source, location, pg_typeof(location) as type
FROM profiles 
WHERE location IS NOT NULL 
LIMIT 3;

SELECT 'barbershops' as source, location, pg_typeof(location) as type
FROM barbershops 
WHERE location IS NOT NULL 
LIMIT 3;

SELECT 'customer_addresses' as source, location, pg_typeof(location) as type
FROM customer_addresses 
WHERE location IS NOT NULL 
LIMIT 3;

-- 4. Count records with location data
SELECT 
  'profiles' as table_name,
  COUNT(*) as total_records,
  COUNT(location) as with_location,
  COUNT(*) - COUNT(location) as null_location
FROM profiles
UNION ALL
SELECT 
  'barbershops',
  COUNT(*),
  COUNT(location),
  COUNT(*) - COUNT(location)
FROM barbershops
UNION ALL
SELECT 
  'bookings',
  COUNT(*),
  COUNT(customer_location),
  COUNT(*) - COUNT(customer_location)
FROM bookings
UNION ALL
SELECT 
  'customer_addresses',
  COUNT(*),
  COUNT(location),
  COUNT(*) - COUNT(location)
FROM customer_addresses;

-- 5. Check if PostGIS is enabled
SELECT 
  extname as extension_name,
  extversion as version
FROM pg_extension
WHERE extname = 'postgis';
