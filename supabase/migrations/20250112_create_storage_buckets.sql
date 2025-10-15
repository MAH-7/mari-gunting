-- =====================================================
-- Create Storage Buckets for Mari Gunting
-- =====================================================
-- This migration creates all the necessary storage buckets
-- for the Mari Gunting partner app.
-- Run this in your Supabase SQL Editor.

-- =====================================================
-- 1. BARBER DOCUMENTS BUCKET
-- =====================================================
-- For IC photos, selfies, certificates
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'barber-documents',
  'barber-documents',
  true,  -- Public bucket for serving images
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Set storage policies for barber-documents
CREATE POLICY "Barbers can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'barber-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Barbers can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'barber-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Barbers can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'barber-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view barber documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'barber-documents');

-- =====================================================
-- 2. BARBER PORTFOLIO BUCKET
-- =====================================================
-- For portfolio images showcasing work
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'barber-portfolio',
  'barber-portfolio',
  true,  -- Public bucket
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Set storage policies for barber-portfolio
CREATE POLICY "Barbers can upload their own portfolio images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'barber-portfolio' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Barbers can update their own portfolio images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'barber-portfolio' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Barbers can delete their own portfolio images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'barber-portfolio' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view portfolio images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'barber-portfolio');

-- =====================================================
-- 3. BARBERSHOP IMAGES BUCKET
-- =====================================================
-- For barbershop logos and cover images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'barbershop-images',
  'barbershop-images',
  true,  -- Public bucket
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Set storage policies for barbershop-images
CREATE POLICY "Barbershop owners can upload their images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'barbershop-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Barbershop owners can update their images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'barbershop-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Barbershop owners can delete their images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'barbershop-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view barbershop images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'barbershop-images');

-- =====================================================
-- 4. BARBERSHOP DOCUMENTS BUCKET
-- =====================================================
-- For SSM documents and business licenses
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'barbershop-documents',
  'barbershop-documents',
  true,  -- Public bucket
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Set storage policies for barbershop-documents
CREATE POLICY "Barbershop owners can upload their documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'barbershop-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Barbershop owners can update their documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'barbershop-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Barbershop owners can delete their documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'barbershop-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view barbershop documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'barbershop-documents');

-- =====================================================
-- 5. AVATARS BUCKET
-- =====================================================
-- For user profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,  -- Public bucket
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Set storage policies for avatars
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- =====================================================
-- 6. PORTFOLIOS BUCKET (LEGACY - for backward compatibility)
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolios',
  'portfolios',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload portfolios"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'portfolios' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update portfolios"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'portfolios' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete portfolios"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'portfolios' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view portfolios"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'portfolios');

-- =====================================================
-- 7. BARBERSHOPS BUCKET (LEGACY - for backward compatibility)
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'barbershops',
  'barbershops',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload barbershop images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'barbershops');

CREATE POLICY "Users can update barbershop images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'barbershops');

CREATE POLICY "Users can delete barbershop images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'barbershops');

CREATE POLICY "Anyone can view barbershop images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'barbershops');

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check that all buckets were created
DO $$
DECLARE
  bucket_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bucket_count
  FROM storage.buckets
  WHERE id IN (
    'barber-documents',
    'barber-portfolio',
    'barbershop-images',
    'barbershop-documents',
    'avatars',
    'portfolios',
    'barbershops'
  );
  
  RAISE NOTICE 'Created % storage buckets successfully', bucket_count;
END $$;
