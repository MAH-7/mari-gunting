-- Create table for tracking OTP requests (rate limiting & abuse prevention)
CREATE TABLE IF NOT EXISTS public.otp_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  message_sid TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_otp_requests_phone_number ON public.otp_requests(phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_requests_created_at ON public.otp_requests(created_at);

-- Add RLS policies
ALTER TABLE public.otp_requests ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write OTP requests
CREATE POLICY "Service role full access on otp_requests"
  ON public.otp_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add cleanup function to delete old OTP requests (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_otp_requests()
RETURNS void AS $$
BEGIN
  DELETE FROM public.otp_requests
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup to run daily (requires pg_cron extension)
-- Run this separately after enabling pg_cron extension:
-- SELECT cron.schedule('cleanup-otp-requests', '0 2 * * *', 'SELECT cleanup_old_otp_requests()');

COMMENT ON TABLE public.otp_requests IS 'Tracks OTP SMS requests for rate limiting and abuse prevention';
COMMENT ON COLUMN public.otp_requests.phone_number IS 'Phone number that received the OTP';
COMMENT ON COLUMN public.otp_requests.message_sid IS 'Twilio message SID for tracking';
COMMENT ON COLUMN public.otp_requests.status IS 'Twilio message status';
