-- ============================================
-- MARI GUNTING STORAGE BUCKETS (COMPLETE LIST)
-- Total: 10 buckets
-- ============================================

-- All storage buckets from production Supabase
-- Note: These need to be created via Supabase Dashboard or Management API

-- 1. Avatars - User profile pictures
-- 2. Portfolios - General portfolio images
-- 3. Barbershops - Barbershop related media
-- 4. Services - Service images
-- 5. Reviews - Review images
-- 6. Documents - General documents
-- 7. Barber-documents - Barber verification documents
-- 8. Barber-portfolios - Barber work samples
-- 9. Barbershop-documents - Barbershop verification documents  
-- 10. Barbershop-media - Barbershop images and videos

-- SQL to recreate all buckets (requires service_role access):
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('portfolios', 'portfolios', true),
  ('barbershops', 'barbershops', true),
  ('services', 'services', true),
  ('reviews', 'reviews', true),
  ('documents', 'documents', false),  -- May not be public
  ('barber-documents', 'barber-documents', true),
  ('barber-portfolios', 'barber-portfolios', true),
  ('barbershop-documents', 'barbershop-documents', true),
  ('barbershop-media', 'barbershop-media', true)
ON CONFLICT (id) DO NOTHING;

-- Note: Your app code currently uses these 3 buckets:
-- - avatars (for profile pictures)
-- - barber-portfolios (for barber work samples)
-- - barbershop-media (for barbershop images)
-- 
-- The other buckets may be used for admin/future features
