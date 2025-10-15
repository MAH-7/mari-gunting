-- ============================================================================
-- MARI GUNTING - STORAGE BUCKETS SETUP
-- ============================================================================
-- This script creates all required storage buckets for partner onboarding
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. CREATE BARBER DOCUMENTS BUCKET
-- For IC photos, selfie, certificates
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'barber-documents',
  'barber-documents',
  false,  -- Private bucket, requires authentication
  10485760,  -- 10MB limit per file
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. CREATE BARBER PORTFOLIOS BUCKET
-- For portfolio/work showcase photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'barber-portfolios',
  'barber-portfolios',
  true,  -- Public bucket, customers can view
  5242880,  -- 5MB limit per file
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 3. CREATE BARBERSHOP DOCUMENTS BUCKET
-- For SSM, business license, certificates
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'barbershop-documents',
  'barbershop-documents',
  false,  -- Private bucket, requires authentication
  10485760,  -- 10MB limit per file
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 4. CREATE BARBERSHOP MEDIA BUCKET
-- For logo and cover photos (public-facing)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'barbershop-media',
  'barbershop-media',
  true,  -- Public bucket, customers can view
  5242880,  -- 5MB limit per file
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- BARBER DOCUMENTS POLICIES
-- Allow authenticated users to upload their own documents
CREATE POLICY "Users can upload their own barber documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'barber-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own documents
CREATE POLICY "Users can view their own barber documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'barber-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own documents
CREATE POLICY "Users can update their own barber documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'barber-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete their own barber documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'barber-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- BARBER PORTFOLIOS POLICIES (PUBLIC)
-- Allow authenticated users to upload their portfolios
CREATE POLICY "Users can upload their barber portfolios"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'barber-portfolios' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow anyone to view portfolio images
CREATE POLICY "Anyone can view barber portfolios"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'barber-portfolios');

-- Allow users to update their own portfolios
CREATE POLICY "Users can update their barber portfolios"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'barber-portfolios' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own portfolios
CREATE POLICY "Users can delete their barber portfolios"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'barber-portfolios' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- BARBERSHOP DOCUMENTS POLICIES
-- Allow authenticated users to upload their shop documents
CREATE POLICY "Users can upload their barbershop documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'barbershop-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own shop documents
CREATE POLICY "Users can view their own barbershop documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'barbershop-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own shop documents
CREATE POLICY "Users can update their barbershop documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'barbershop-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own shop documents
CREATE POLICY "Users can delete their barbershop documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'barbershop-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- BARBERSHOP MEDIA POLICIES (PUBLIC)
-- Allow authenticated users to upload shop media
CREATE POLICY "Users can upload their barbershop media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'barbershop-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow anyone to view shop media (logos, covers)
CREATE POLICY "Anyone can view barbershop media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'barbershop-media');

-- Allow users to update their own shop media
CREATE POLICY "Users can update their barbershop media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'barbershop-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own shop media
CREATE POLICY "Users can delete their barbershop media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'barbershop-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this query to verify all buckets are created:
SELECT 
  id,
  name,
  public,
  file_size_limit / 1048576 as size_limit_mb,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id IN (
  'barber-documents',
  'barber-portfolios',
  'barbershop-documents',
  'barbershop-media'
)
ORDER BY name;

-- ============================================================================
-- NOTES
-- ============================================================================
/*
FOLDER STRUCTURE:

barber-documents/
  └── {user_id}/
      ├── ic-front.jpg
      ├── ic-back.jpg
      ├── selfie.jpg
      └── certificates/
          ├── cert1.jpg
          └── cert2.pdf

barber-portfolios/
  └── {user_id}/
      ├── portfolio1.jpg
      ├── portfolio2.jpg
      └── portfolio3.jpg

barbershop-documents/
  └── {user_id}/
      ├── ssm.pdf
      └── license.pdf

barbershop-media/
  └── {user_id}/
      ├── logo.jpg
      ├── cover1.jpg
      ├── cover2.jpg
      └── cover3.jpg

USAGE IN CODE:
const filePath = `${userId}/ic-front.jpg`;
await supabase.storage
  .from('barber-documents')
  .upload(filePath, file);
*/
