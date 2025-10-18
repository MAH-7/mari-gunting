-- ============================================
-- EXTRACT ONLY COMPONENTS YOUR APP USES
-- ============================================
-- Based on code analysis of your mari-gunting app

-- ============================================
-- 1. FUNCTIONS YOUR APP ACTUALLY CALLS
-- ============================================
SELECT 
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace ns ON p.pronamespace = ns.oid
WHERE ns.nspname = 'public'
AND p.proname IN (
    -- These are the RPC functions found in your code
    'add_customer_address',
    'add_customer_credit',
    'apply_voucher_to_booking',
    'cancel_booking',
    'check_radius_cooldown',
    'create_booking',
    'deduct_customer_credit',
    'delete_customer_address_direct',
    'get_customer_addresses',
    'get_customer_bookings',
    'get_nearby_barbers',
    'get_recent_addresses',
    'mark_address_as_used',
    'redeem_voucher',
    'search_nearby_barbershops',
    'set_default_customer_address',
    'setup_barbershop_owner',
    'setup_freelance_barber',
    'submit_review',
    'update_booking_status',
    'update_customer_address',
    'update_service_radius',
    'update_tracking_metrics',
    'use_voucher'
)
ORDER BY p.proname;

-- ============================================
-- 2. TRIGGERS ON YOUR TABLES
-- ============================================
SELECT 
    'CREATE TRIGGER ' || t.tgname || 
    ' ' || 
    CASE 
        WHEN t.tgtype & 2 = 2 THEN 'BEFORE'
        ELSE 'AFTER'
    END || ' ' ||
    CASE 
        WHEN t.tgtype & 4 = 4 THEN 'INSERT'
        WHEN t.tgtype & 8 = 8 THEN 'DELETE'
        WHEN t.tgtype & 16 = 16 THEN 'UPDATE'
    END || 
    ' ON ' || c.relname ||
    ' FOR EACH ' ||
    CASE 
        WHEN t.tgtype & 1 = 1 THEN 'ROW'
        ELSE 'STATEMENT'
    END ||
    ' EXECUTE FUNCTION ' || p.proname || '();' as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE NOT t.tgisinternal
AND c.relname IN (
    -- Tables your app ACTUALLY uses (verified from code)
    'profiles',
    'barbers',
    'barbershops',
    'bookings',
    'services',
    'reviews',
    'active_tracking_sessions',
    'customer_addresses',
    'customer_credits',
    'credit_transactions',
    'points_transactions',
    'user_vouchers',
    'vouchers',
    'otp_requests'
    -- Note: Your app also uses these storage buckets:
    -- 'avatars', 'barber-portfolios', 'barbershop-media'
)
ORDER BY c.relname, t.tgname;

-- ============================================
-- 3. RLS POLICIES ON YOUR TABLES
-- ============================================
SELECT 
    'ALTER TABLE ' || c.relname || ' ENABLE ROW LEVEL SECURITY;' as enable_rls
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND c.relrowsecurity = true
AND c.relname IN (
    'profiles', 'barbers', 'barbershops', 'bookings', 'services',
    'reviews', 'active_tracking_sessions', 'customer_addresses',
    'customer_credits', 'credit_transactions', 'points_transactions',
    'user_vouchers', 'vouchers', 'otp_requests'
);

-- Get the actual policies
SELECT 
    'CREATE POLICY "' || pol.polname || '" ON ' || c.relname || 
    CASE pol.polcmd
        WHEN 'r' THEN ' FOR SELECT'
        WHEN 'a' THEN ' FOR INSERT'
        WHEN 'w' THEN ' FOR UPDATE'
        WHEN 'd' THEN ' FOR DELETE'
        WHEN '*' THEN ' FOR ALL'
    END ||
    ' TO ' || 
    CASE 
        WHEN pol.polroles = '{0}' THEN 'public'
        ELSE array_to_string(ARRAY(
            SELECT rolname FROM pg_roles WHERE oid = ANY(pol.polroles)
        ), ', ')
    END ||
    CASE 
        WHEN pol.polqual IS NOT NULL THEN 
            ' USING (' || pg_get_expr(pol.polqual, pol.polrelid) || ')'
        ELSE ''
    END ||
    CASE 
        WHEN pol.polwithcheck IS NOT NULL THEN 
            ' WITH CHECK (' || pg_get_expr(pol.polwithcheck, pol.polrelid) || ')'
        ELSE ''
    END || ';' as policy_definition
FROM pg_policy pol
JOIN pg_class c ON pol.polrelid = c.oid
WHERE c.relname IN (
    'profiles', 'barbers', 'barbershops', 'bookings', 'booking_vouchers',
    'services', 'reviews', 'review_likes', 'payments', 'payouts',
    'customer_addresses', 'customer_credits', 'credit_transactions',
    'user_points', 'points_transactions', 'user_vouchers', 'vouchers',
    'promotions', 'messages', 'notifications', 'favorites',
    'active_tracking_sessions', 'tracking_history', 'barber_onboarding',
    'barbershop_onboarding', 'onboarding_verification_logs', 'otp_requests'
)
ORDER BY c.relname, pol.polname;

-- ============================================
-- 4. INDEXES ON YOUR TABLES
-- ============================================
SELECT 
    indexdef || ';' as index_definition
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
    'profiles', 'barbers', 'barbershops', 'bookings', 'booking_vouchers',
    'services', 'reviews', 'review_likes', 'payments', 'payouts',
    'customer_addresses', 'customer_credits', 'credit_transactions',
    'user_points', 'points_transactions', 'user_vouchers', 'vouchers',
    'promotions', 'messages', 'notifications', 'favorites',
    'active_tracking_sessions', 'tracking_history', 'barber_onboarding',
    'barbershop_onboarding', 'onboarding_verification_logs', 'otp_requests'
)
AND indexname NOT LIKE '%_pkey'  -- Exclude primary keys
ORDER BY tablename, indexname;

-- ============================================
-- 5. REQUIRED EXTENSIONS
-- ============================================
SELECT 
    'CREATE EXTENSION IF NOT EXISTS "' || extname || '";' as extension
FROM pg_extension
WHERE extname IN (
    'uuid-ossp',      -- For UUID generation
    'postgis',        -- For location features
    'pg_trgm',        -- For text search
    'pgcrypto',       -- For encryption
    'plpgsql'         -- For functions
)
ORDER BY extension;

-- ============================================
-- 6. FOREIGN KEY CONSTRAINTS
-- ============================================
SELECT 
    'ALTER TABLE ' || tc.table_name || 
    ' ADD CONSTRAINT ' || tc.constraint_name || 
    ' FOREIGN KEY (' || kcu.column_name || ')' ||
    ' REFERENCES ' || ccu.table_name || 
    '(' || ccu.column_name || ')' ||
    CASE 
        WHEN rc.delete_rule != 'NO ACTION' THEN ' ON DELETE ' || rc.delete_rule
        ELSE ''
    END ||
    CASE 
        WHEN rc.update_rule != 'NO ACTION' THEN ' ON UPDATE ' || rc.update_rule
        ELSE ''
    END || ';' as foreign_key
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name IN (
    'profiles', 'barbers', 'barbershops', 'bookings', 'services',
    'reviews', 'active_tracking_sessions', 'customer_addresses',
    'customer_credits', 'credit_transactions', 'points_transactions',
    'user_vouchers', 'vouchers', 'otp_requests'
);

-- ============================================
-- 7. STORAGE BUCKETS YOUR APP USES
-- ============================================
-- Your app uses these storage buckets (create manually in dashboard):
-- 1. 'avatars' - for user profile pictures
-- 2. 'barber-portfolios' - for barber work samples
-- 3. 'barbershop-media' - for barbershop images
-- Run this to check existing buckets:
SELECT id, name, public, created_at 
FROM storage.buckets 
WHERE name IN ('avatars', 'barber-portfolios', 'barbershop-media');
