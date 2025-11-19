-- Verify and create barber-portfolios bucket for evidence photos
-- Run this in Supabase SQL Editor

-- Check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'barber-portfolios';

-- If bucket doesn't exist, create it (uncomment below)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('barber-portfolios', 'barber-portfolios', true)
-- ON CONFLICT (id) DO UPDATE SET public = true;

-- Verify bucket is public
SELECT id, name, public FROM storage.buckets WHERE id = 'barber-portfolios';

-- Expected result:
-- id: barber-portfolios
-- name: barber-portfolios
-- public: true

-- If bucket exists but is private, make it public:
-- UPDATE storage.buckets SET public = true WHERE id = 'barber-portfolios';
