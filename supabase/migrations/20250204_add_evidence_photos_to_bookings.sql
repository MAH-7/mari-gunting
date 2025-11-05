-- Add evidence_photos field to bookings table for storing before/after photos
-- Used for service completion verification and dispute resolution

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS evidence_photos JSONB DEFAULT '{"before": [], "after": []}'::jsonb;

COMMENT ON COLUMN bookings.evidence_photos IS 'Before/after photos for service evidence and quality verification. Structure: {"before": ["url1", "url2"], "after": ["url1", "url2"]}';
