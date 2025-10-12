-- Configure RLS policies for Supabase Storage buckets
-- This allows users to upload and access files in storage

-- =====================================================
-- AVATARS BUCKET
-- =====================================================

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Allow public read access to avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow authenticated and anon users to upload avatars
CREATE POLICY "Anyone can upload avatar"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'avatars');

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'avatars');

-- =====================================================
-- PORTFOLIOS BUCKET (for barber portfolio images)
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolios', 'portfolios', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Portfolio images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Barbers can upload portfolio images" ON storage.objects;
DROP POLICY IF EXISTS "Barbers can update their portfolio" ON storage.objects;
DROP POLICY IF EXISTS "Barbers can delete their portfolio" ON storage.objects;

CREATE POLICY "Portfolio images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'portfolios');

CREATE POLICY "Barbers can upload portfolio images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'portfolios');

CREATE POLICY "Barbers can update their portfolio"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'portfolios');

CREATE POLICY "Barbers can delete their portfolio"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'portfolios');

-- =====================================================
-- BARBERSHOPS BUCKET (for barbershop images)
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('barbershops', 'barbershops', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Barbershop images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload barbershop images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update barbershop images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete barbershop images" ON storage.objects;

CREATE POLICY "Barbershop images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'barbershops');

CREATE POLICY "Anyone can upload barbershop images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'barbershops');

CREATE POLICY "Users can update barbershop images"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'barbershops');

CREATE POLICY "Users can delete barbershop images"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'barbershops');

-- =====================================================
-- SERVICES BUCKET (for service images)
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('services', 'services', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Service images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload service images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update service images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete service images" ON storage.objects;

CREATE POLICY "Service images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'services');

CREATE POLICY "Anyone can upload service images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'services');

CREATE POLICY "Users can update service images"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'services');

CREATE POLICY "Users can delete service images"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'services');

-- =====================================================
-- REVIEWS BUCKET (for review images)
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('reviews', 'reviews', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Review images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload review images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update review images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete review images" ON storage.objects;

CREATE POLICY "Review images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'reviews');

CREATE POLICY "Anyone can upload review images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'reviews');

CREATE POLICY "Users can update review images"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'reviews');

CREATE POLICY "Users can delete review images"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'reviews');

-- =====================================================
-- VERIFICATION
-- =====================================================

-- List all storage buckets
SELECT * FROM storage.buckets;

-- List all storage policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'storage'
ORDER BY cmd, policyname;
