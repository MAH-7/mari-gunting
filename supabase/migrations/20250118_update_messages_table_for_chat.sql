-- =====================================================
-- UPDATE MESSAGES TABLE FOR CHAT FEATURE
-- =====================================================
-- This migration updates the existing messages table to match
-- the chatService.ts expectations while preserving any existing data

-- Step 1: Add new columns
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS message TEXT, -- Rename from 'content'
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Step 2: Copy existing data from 'content' to 'message'
UPDATE public.messages
SET message = content
WHERE message IS NULL AND content IS NOT NULL;

-- Step 3: Drop old columns we don't need
ALTER TABLE public.messages
DROP COLUMN IF EXISTS content,
DROP COLUMN IF EXISTS message_type,
DROP COLUMN IF EXISTS location_data;

-- Step 4: Update is_read to use read_at properly
-- Set read_at based on is_read boolean (for any existing data)
UPDATE public.messages
SET read_at = created_at
WHERE is_read = true AND read_at IS NULL;

-- Drop is_read column (we only use read_at now)
ALTER TABLE public.messages
DROP COLUMN IF EXISTS is_read;

-- Step 5: Create index on read_at for performance
CREATE INDEX IF NOT EXISTS idx_messages_read_at 
ON public.messages(read_at) 
WHERE read_at IS NULL;

-- Step 6: Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS messages_updated_at_trigger ON public.messages;
CREATE TRIGGER messages_updated_at_trigger
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_messages_updated_at();

-- Step 7: Update RLS policies if needed
-- (Assuming RLS policies exist, we'll recreate them with correct field names)

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own sent messages" ON public.messages;

-- Recreate policies
CREATE POLICY "Users can view their own messages" ON public.messages
  FOR SELECT
  USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id
  );

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own received messages" ON public.messages
  FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Step 8: Add comment
COMMENT ON TABLE public.messages IS 'Chat messages between customers and barbers for active bookings';
COMMENT ON COLUMN public.messages.message IS 'Text content of the message (nullable for image-only messages)';
COMMENT ON COLUMN public.messages.image_url IS 'URL of shared image (nullable for text-only messages)';
COMMENT ON COLUMN public.messages.read_at IS 'Timestamp when message was read (null = unread)';
