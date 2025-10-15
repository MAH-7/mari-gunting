
-- Step 1: Enable Realtime for profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Step 2: Verify it worked
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
-- You should see 'profiles' in the results

