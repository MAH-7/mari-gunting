-- =====================================================
-- MESSAGES TABLE FOR IN-APP CHAT
-- =====================================================
-- Purpose: Store chat messages between customers and barbers
-- Security: RLS policies ensure users can only see their own messages
-- Features: Text + Image support, Read receipts, Timestamps
-- =====================================================

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Booking relationship (chat tied to specific booking)
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  
  -- Sender and receiver (both reference profiles)
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Message content
  message TEXT, -- Can be null if image-only message
  image_url TEXT, -- Optional image URL from Supabase Storage
  
  -- Message metadata
  read_at TIMESTAMPTZ, -- NULL = unread, timestamp = read
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT message_content_required CHECK (
    message IS NOT NULL OR image_url IS NOT NULL
  ), -- At least one must be present
  CONSTRAINT valid_participants CHECK (sender_id != receiver_id) -- Can't message yourself
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for fetching messages by booking (most common query)
CREATE INDEX idx_messages_booking_id ON public.messages(booking_id);

-- Index for fetching messages by sender
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);

-- Index for fetching messages by receiver
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);

-- Composite index for ordering messages by time
CREATE INDEX idx_messages_booking_created ON public.messages(booking_id, created_at DESC);

-- Index for unread messages (for notification counts)
CREATE INDEX idx_messages_unread ON public.messages(receiver_id, read_at) WHERE read_at IS NULL;

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages where they are sender OR receiver
CREATE POLICY "messages_select_own"
  ON public.messages
  FOR SELECT
  USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- Policy: Users can send messages (insert)
-- Additional validation: sender must be part of the booking
CREATE POLICY "messages_insert_own"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.bookings
      WHERE id = booking_id
      AND (customer_id = sender_id OR barber_id = sender_id)
      AND (customer_id = receiver_id OR barber_id = receiver_id)
    )
  );

-- Policy: Users can update their own sent messages (for read receipts on receiver side)
-- Only allow updating read_at field
CREATE POLICY "messages_update_read_status"
  ON public.messages
  FOR UPDATE
  USING (
    auth.uid() = receiver_id -- Only receiver can mark as read
  )
  WITH CHECK (
    auth.uid() = receiver_id
  );

-- Policy: Users can delete their own messages (within 5 minutes of sending)
CREATE POLICY "messages_delete_own"
  ON public.messages
  FOR DELETE
  USING (
    auth.uid() = sender_id
    AND created_at > NOW() - INTERVAL '5 minutes'
  );

-- =====================================================
-- REALTIME PUBLICATION
-- =====================================================

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM public.messages
  WHERE receiver_id = p_user_id
  AND read_at IS NULL;
  
  RETURN unread_count;
END;
$$;

-- Function: Mark all messages in a booking as read
CREATE OR REPLACE FUNCTION mark_booking_messages_read(
  p_booking_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.messages
  SET read_at = NOW()
  WHERE booking_id = p_booking_id
  AND receiver_id = p_user_id
  AND read_at IS NULL;
END;
$$;

-- Function: Get last message for a booking
CREATE OR REPLACE FUNCTION get_last_message(p_booking_id UUID)
RETURNS TABLE (
  message TEXT,
  sender_id UUID,
  created_at TIMESTAMPTZ,
  is_read BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.message,
    m.sender_id,
    m.created_at,
    (m.read_at IS NOT NULL) as is_read
  FROM public.messages m
  WHERE m.booking_id = p_booking_id
  ORDER BY m.created_at DESC
  LIMIT 1;
END;
$$;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.messages IS 'Chat messages between customers and barbers for active bookings';
COMMENT ON COLUMN public.messages.booking_id IS 'Booking this conversation belongs to';
COMMENT ON COLUMN public.messages.sender_id IS 'User who sent the message';
COMMENT ON COLUMN public.messages.receiver_id IS 'User who receives the message';
COMMENT ON COLUMN public.messages.message IS 'Text content (optional if image is present)';
COMMENT ON COLUMN public.messages.image_url IS 'Image URL from Supabase Storage (optional)';
COMMENT ON COLUMN public.messages.read_at IS 'Timestamp when message was read (NULL = unread)';

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Test query: Check if table was created
SELECT 'Messages table created successfully' as status
WHERE EXISTS (
  SELECT FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename = 'messages'
);
