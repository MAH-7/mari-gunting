-- =====================================================
-- ENABLE REALTIME FOR MESSAGES TABLE
-- =====================================================
-- This allows real-time subscriptions to work for chat

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Verify realtime is enabled
COMMENT ON TABLE public.messages IS 'Chat messages with real-time updates enabled';
