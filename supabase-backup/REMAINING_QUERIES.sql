-- ============================================
-- REMAINING QUERIES TO COMPLETE YOUR BACKUP
-- ============================================

-- Query A: EXTRACT CUSTOM TYPES/ENUMS (if any)
SELECT 
    'CREATE TYPE ' || n.nspname || '.' || t.typname || ' AS ENUM (' ||
    string_agg(quote_literal(e.enumlabel), ', ' ORDER BY e.enumsortorder) || ');' as enum_definition
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
GROUP BY n.nspname, t.typname;

-- Query B: EXTRACT SEQUENCES (for auto-increment)
SELECT 
    'CREATE SEQUENCE IF NOT EXISTS ' || sequence_schema || '.' || sequence_name ||
    ' START WITH ' || start_value ||
    ' INCREMENT BY ' || increment ||
    ' MINVALUE ' || minimum_value ||
    ' MAXVALUE ' || maximum_value ||
    ' CACHE 1;' as sequence_definition
FROM information_schema.sequences
WHERE sequence_schema = 'public';

-- Query C: EXTRACT VIEWS (if any)
SELECT 
    'CREATE OR REPLACE VIEW ' || table_schema || '.' || table_name || ' AS ' ||
    view_definition as view_definition
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- Query D: TABLES WITH RLS ENABLED
SELECT 
    'ALTER TABLE ' || schemaname || '.' || tablename || ' ENABLE ROW LEVEL SECURITY;' as enable_rls
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;