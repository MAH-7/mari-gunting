-- =====================================================
-- HELPER FUNCTION: Mark all messages as read for a booking
-- =====================================================

CREATE OR REPLACE FUNCTION public.mark_booking_messages_read(
  p_booking_id UUID,
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark all unread messages for this booking where user is the receiver
  UPDATE public.messages
  SET read_at = NOW()
  WHERE booking_id = p_booking_id
    AND receiver_id = p_user_id
    AND read_at IS NULL;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.mark_booking_messages_read(UUID, UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.mark_booking_messages_read IS 'Mark all messages in a booking as read for a specific user';
