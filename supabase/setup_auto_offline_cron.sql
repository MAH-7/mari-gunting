-- ============================================
-- Auto-Offline Cron Job Setup
-- ============================================
-- Run this in Supabase SQL Editor to complete production setup
-- ============================================

-- Step 1: Enable pg_cron extension (if not already enabled)
-- This can also be done in Dashboard → Database → Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 2: Remove existing job if it exists (to avoid duplicates)
SELECT cron.unschedule('auto-offline-stale-users');

-- Step 3: Schedule the auto-offline check to run every minute
SELECT cron.schedule(
  'auto-offline-stale-users',      -- Job name
  '* * * * *',                      -- Cron schedule: every minute
  $$SELECT check_and_offline_stale_users();$$  -- Function call
);

-- Step 4: Verify the job is scheduled
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'auto-offline-stale-users';

-- Expected output:
-- jobid | jobname                  | schedule    | active | command
-- ------|--------------------------|-------------|--------|----------------------------------
-- 1     | auto-offline-stale-users | * * * * *   | true   | SELECT check_and_offline_stale...

-- ============================================
-- Optional: Manual Testing
-- ============================================

-- Test the function manually (safe to run anytime)
SELECT check_and_offline_stale_users();

-- Check execution history (see if it's running)
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname = 'auto-offline-stale-users')
ORDER BY start_time DESC
LIMIT 10;

-- ============================================
-- Optional: Debug Queries
-- ============================================

-- See which partners are currently online
SELECT 
  id,
  full_name,
  is_online,
  last_heartbeat,
  NOW() - last_heartbeat as time_since_heartbeat
FROM profiles
WHERE is_online = true
ORDER BY last_heartbeat DESC;

-- See stale partners (would be auto-offlined next run)
SELECT 
  id,
  full_name,
  is_online,
  last_heartbeat,
  NOW() - last_heartbeat as time_since_heartbeat
FROM profiles
WHERE is_online = true
  AND last_heartbeat IS NOT NULL
  AND last_heartbeat < NOW() - INTERVAL '90 seconds'
ORDER BY last_heartbeat DESC;

-- ============================================
-- Optional: Unschedule (if needed)
-- ============================================

-- To stop the cron job (for maintenance/debugging):
-- SELECT cron.unschedule('auto-offline-stale-users');

-- To reschedule after stopping:
-- SELECT cron.schedule(
--   'auto-offline-stale-users',
--   '* * * * *',
--   $$SELECT check_and_offline_stale_users();$$
-- );
