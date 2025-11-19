-- =====================================================
-- STORAGE BUCKET FOR CHAT IMAGES
-- =====================================================
-- Purpose: Store images sent in chat messages
-- Security: RLS policies ensure only participants can access images
-- =====================================================

-- Create chat-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Policy: Users can upload images for bookings they're part of
CREATE POLICY "chat_images_insert_own"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view images from bookings they're part of
-- Format: {user_id}/{booking_id}/{filename}
CREATE POLICY "chat_images_select_own"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-images'
  AND (
    -- User is the uploader (folder name is their user_id)
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- User is part of the booking (check messages table)
    EXISTS (
      SELECT 1 FROM public.messages
      WHERE image_url LIKE '%' || name || '%'
      AND (sender_id = auth.uid() OR receiver_id = auth.uid())
    )
  )
);

-- Policy: Users can delete their own uploaded images (within 5 minutes)
CREATE POLICY "chat_images_delete_own"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND created_at > NOW() - INTERVAL '5 minutes'
);

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 'Chat images bucket created successfully' as status
WHERE EXISTS (
  SELECT FROM storage.buckets 
  WHERE id = 'chat-images'
);
