-- Schedule the auto-offline check to run every minute
SELECT cron.schedule(
  'auto-offline-stale-users',
  '* * * * *',
  $$SELECT check_and_offline_stale_users();$$
);

-- Verify it was scheduled
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'auto-offline-stale-users';
