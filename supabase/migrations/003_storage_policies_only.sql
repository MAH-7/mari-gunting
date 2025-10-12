-- =====================================================
-- STORAGE POLICIES ONLY
-- Note: Create buckets via Supabase UI first
-- =====================================================

-- =====================================================
-- STORAGE POLICIES - AVATARS
-- =====================================================

-- Anyone can view avatars (public bucket)
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(storage.objects.name))[1]
);

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(storage.objects.name))[1]
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(storage.objects.name))[1]
);

-- =====================================================
-- STORAGE POLICIES - PORTFOLIOS
-- =====================================================

-- Anyone can view portfolio images
CREATE POLICY "Portfolios are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolios');

-- Barbers can upload portfolio images
CREATE POLICY "Barbers can upload portfolio images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'portfolios' AND
  EXISTS (
    SELECT 1 FROM barbers
    WHERE barbers.user_id = auth.uid()
    AND barbers.user_id::text = (storage.foldername(storage.objects.name))[1]
  )
);

-- Barbers can update their portfolio images
CREATE POLICY "Barbers can update own portfolio"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'portfolios' AND
  EXISTS (
    SELECT 1 FROM barbers
    WHERE barbers.user_id = auth.uid()
    AND barbers.user_id::text = (storage.foldername(storage.objects.name))[1]
  )
);

-- Barbers can delete their portfolio images
CREATE POLICY "Barbers can delete own portfolio"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'portfolios' AND
  EXISTS (
    SELECT 1 FROM barbers
    WHERE barbers.user_id = auth.uid()
    AND barbers.user_id::text = (storage.foldername(storage.objects.name))[1]
  )
);

-- =====================================================
-- STORAGE POLICIES - BARBERSHOPS
-- =====================================================

-- Anyone can view barbershop images
CREATE POLICY "Barbershop images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'barbershops');

-- Barbershop owners can upload images
CREATE POLICY "Owners can upload barbershop images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'barbershops' AND
  EXISTS (
    SELECT 1 FROM barbershops
    WHERE barbershops.owner_id = auth.uid()
    AND barbershops.id::text = (storage.foldername(storage.objects.name))[1]
  )
);

-- Barbershop owners can update their images
CREATE POLICY "Owners can update barbershop images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'barbershops' AND
  EXISTS (
    SELECT 1 FROM barbershops
    WHERE barbershops.owner_id = auth.uid()
    AND barbershops.id::text = (storage.foldername(storage.objects.name))[1]
  )
);

-- Barbershop owners can delete their images
CREATE POLICY "Owners can delete barbershop images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'barbershops' AND
  EXISTS (
    SELECT 1 FROM barbershops
    WHERE barbershops.owner_id = auth.uid()
    AND barbershops.id::text = (storage.foldername(storage.objects.name))[1]
  )
);

-- =====================================================
-- STORAGE POLICIES - SERVICES
-- =====================================================

-- Anyone can view service images
CREATE POLICY "Service images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'services');

-- Service owners can upload images
CREATE POLICY "Owners can upload service images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'services' AND
  (
    EXISTS (
      SELECT 1 FROM services s
      JOIN barbers b ON s.barber_id = b.id
      WHERE b.user_id = auth.uid()
      AND s.id::text = (storage.foldername(storage.objects.name))[1]
    )
    OR
    EXISTS (
      SELECT 1 FROM services s
      JOIN barbershops bs ON s.barbershop_id = bs.id
      WHERE bs.owner_id = auth.uid()
      AND s.id::text = (storage.foldername(storage.objects.name))[1]
    )
  )
);

-- Service owners can update their images
CREATE POLICY "Owners can update service images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'services' AND
  (
    EXISTS (
      SELECT 1 FROM services s
      JOIN barbers b ON s.barber_id = b.id
      WHERE b.user_id = auth.uid()
      AND s.id::text = (storage.foldername(storage.objects.name))[1]
    )
    OR
    EXISTS (
      SELECT 1 FROM services s
      JOIN barbershops bs ON s.barbershop_id = bs.id
      WHERE bs.owner_id = auth.uid()
      AND s.id::text = (storage.foldername(storage.objects.name))[1]
    )
  )
);

-- Service owners can delete their images
CREATE POLICY "Owners can delete service images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'services' AND
  (
    EXISTS (
      SELECT 1 FROM services s
      JOIN barbers b ON s.barber_id = b.id
      WHERE b.user_id = auth.uid()
      AND s.id::text = (storage.foldername(storage.objects.name))[1]
    )
    OR
    EXISTS (
      SELECT 1 FROM services s
      JOIN barbershops bs ON s.barbershop_id = bs.id
      WHERE bs.owner_id = auth.uid()
      AND s.id::text = (storage.foldername(storage.objects.name))[1]
    )
  )
);

-- =====================================================
-- STORAGE POLICIES - REVIEWS
-- =====================================================

-- Anyone can view review images
CREATE POLICY "Review images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'reviews');

-- Customers can upload review images
CREATE POLICY "Customers can upload review images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'reviews' AND
  EXISTS (
    SELECT 1 FROM reviews
    WHERE reviews.customer_id = auth.uid()
    AND reviews.id::text = (storage.foldername(storage.objects.name))[1]
  )
);

-- Customers can delete their review images
CREATE POLICY "Customers can delete review images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'reviews' AND
  EXISTS (
    SELECT 1 FROM reviews
    WHERE reviews.customer_id = auth.uid()
    AND reviews.id::text = (storage.foldername(storage.objects.name))[1]
  )
);

-- =====================================================
-- STORAGE POLICIES - DOCUMENTS (PRIVATE)
-- =====================================================

-- Only document owners can view their documents
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(storage.objects.name))[1]
);

-- Users can upload their own documents
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(storage.objects.name))[1]
);

-- Users can update their own documents
CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(storage.objects.name))[1]
);

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(storage.objects.name))[1]
);
