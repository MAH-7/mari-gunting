-- ============================================
-- EXTRACT MISSING PRODUCTION DATABASE COMPONENTS
-- ============================================
-- Run these queries in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/uufiyurcsldecspakneg/sql/new
-- 
-- Copy and save each result!

-- ============================================
-- 1. EXTRACT ALL FUNCTIONS AND PROCEDURES
-- ============================================
SELECT 
    'CREATE OR REPLACE FUNCTION ' || ns.nspname || '.' || p.proname || '(' || 
    pg_get_function_arguments(p.oid) || ')' || 
    ' RETURNS ' || pg_get_function_result(p.oid) || 
    ' LANGUAGE ' || l.lanname || 
    ' AS $function$' || p.prosrc || '$function$;' as function_definition
FROM pg_proc p
JOIN pg_namespace ns ON p.pronamespace = ns.oid
JOIN pg_language l ON p.prolang = l.oid
WHERE ns.nspname IN ('public', 'auth')
AND p.proname NOT LIKE 'pgp_%'
ORDER BY ns.nspname, p.proname;

-- ============================================
-- 2. EXTRACT ALL TRIGGERS
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
    ' ON ' || ns.nspname || '.' || c.relname ||
    ' FOR EACH ' ||
    CASE 
        WHEN t.tgtype & 1 = 1 THEN 'ROW'
        ELSE 'STATEMENT'
    END ||
    ' EXECUTE FUNCTION ' || p.proname || '();' as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace ns ON c.relnamespace = ns.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE NOT t.tgisinternal
AND ns.nspname = 'public'
ORDER BY c.relname, t.tgname;

-- ============================================
-- 3. EXTRACT ALL RLS POLICIES
-- ============================================
SELECT 
    'CREATE POLICY "' || pol.polname || '" ON ' || 
    n.nspname || '.' || c.relname || 
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
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY c.relname, pol.polname;

-- Also check if RLS is enabled on tables
SELECT 
    'ALTER TABLE ' || schemaname || '.' || tablename || ' ENABLE ROW LEVEL SECURITY;' as enable_rls
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;

-- ============================================
-- 4. EXTRACT ALL INDEXES
-- ============================================
SELECT 
    indexdef || ';' as index_definition
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname NOT LIKE '%_pkey'  -- Exclude primary keys (they're in table definitions)
ORDER BY tablename, indexname;

-- ============================================
-- 5. EXTRACT CUSTOM TYPES/ENUMS
-- ============================================
SELECT 
    'CREATE TYPE ' || n.nspname || '.' || t.typname || ' AS ENUM (' ||
    string_agg(quote_literal(e.enumlabel), ', ' ORDER BY e.enumsortorder) || ');' as enum_definition
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
GROUP BY n.nspname, t.typname;

-- ============================================
-- 6. EXTRACT SEQUENCES (for auto-increment)
-- ============================================
SELECT 
    'CREATE SEQUENCE IF NOT EXISTS ' || sequence_schema || '.' || sequence_name ||
    ' START WITH ' || start_value ||
    ' INCREMENT BY ' || increment ||
    ' MINVALUE ' || minimum_value ||
    ' MAXVALUE ' || maximum_value ||
    ' CACHE 1;' as sequence_definition
FROM information_schema.sequences
WHERE sequence_schema = 'public';

-- ============================================
-- 7. EXTRACT VIEWS
-- ============================================
SELECT 
    'CREATE OR REPLACE VIEW ' || table_schema || '.' || table_name || ' AS ' ||
    view_definition as view_definition
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================
-- 8. CHECK FOR EXTENSIONS
-- ============================================
SELECT 
    'CREATE EXTENSION IF NOT EXISTS "' || extname || '";' as extension
FROM pg_extension
WHERE extname NOT IN ('plpgsql')
ORDER BY extname;

-- ============================================
-- 9. EXTRACT FOREIGN KEY CONSTRAINTS
-- ============================================
SELECT 
    'ALTER TABLE ' || tc.table_schema || '.' || tc.table_name || 
    ' ADD CONSTRAINT ' || tc.constraint_name || 
    ' FOREIGN KEY (' || kcu.column_name || ')' ||
    ' REFERENCES ' || ccu.table_schema || '.' || ccu.table_name || 
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
AND tc.table_schema = 'public';

-- ============================================
-- 10. EXTRACT DEFAULT PRIVILEGES
-- ============================================
SELECT 
    'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ' || 
    privilege_type || ' ON TABLES TO ' || grantee || ';' as default_privilege
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
GROUP BY grantee, privilege_type;