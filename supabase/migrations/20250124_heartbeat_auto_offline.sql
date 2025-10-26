-- Add last_heartbeat column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMPTZ;

-- Create function to mark stale online users as offline
CREATE OR REPLACE FUNCTION check_and_offline_stale_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark users as offline if:
  -- 1. They are currently online (is_online = true)
  -- 2. Their last heartbeat was more than 90 seconds ago
  -- 3. They have a last_heartbeat timestamp (not null)
  -- 
  -- PRODUCTION SETTINGS (Grab/Foodpanda standard):
  -- - Foreground: Continuous tracking → heartbeat every 10s
  -- - Background (moving): Real-time updates → heartbeat every 10-15s
  -- - Background (stationary): Significant location changes → heartbeat every 15-30s
  -- - Force closed: Connection drops instantly → offline after 90s
  -- 
  -- 90 second threshold ensures:
  -- - Force close detected within 90s (production standard)
  -- - Background tracking has time to send 2-3 heartbeats
  -- - Fast enough for real-time customer experience
  UPDATE profiles
  SET 
    is_online = false,
    updated_at = NOW()
  WHERE 
    is_online = true
    AND last_heartbeat IS NOT NULL
    AND last_heartbeat < NOW() - INTERVAL '90 seconds';
    
  -- Log how many users were marked offline
  RAISE NOTICE 'Auto-offline check completed at %', NOW();
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_and_offline_stale_users() TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_offline_stale_users() TO service_role;

-- Create a pg_cron job to run this check every minute
-- Note: pg_cron needs to be enabled in Supabase project settings
-- Run in Supabase SQL Editor:
-- SELECT cron.schedule(
--   'auto-offline-stale-users',
--   '* * * * *', -- Every minute
--   $$SELECT check_and_offline_stale_users();$$
-- );

-- For manual testing, you can run:
-- SELECT check_and_offline_stale_users();
