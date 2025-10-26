-- Add expo push token to profiles for silent push
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS expo_push_token TEXT;