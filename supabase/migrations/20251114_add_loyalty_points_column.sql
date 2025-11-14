-- Add loyalty_points column to bookings table (if not exists)
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS loyalty_points integer DEFAULT 0;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_loyalty_points ON public.bookings(loyalty_points) WHERE loyalty_points > 0;

-- Add comment
COMMENT ON COLUMN public.bookings.loyalty_points IS 'Loyalty points awarded to customer for this booking (calculated when payment is captured)';
