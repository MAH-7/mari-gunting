-- Add verification_documents column to barbershops table for storing uploaded documents
ALTER TABLE public.barbershops
ADD COLUMN IF NOT EXISTS verification_documents JSONB;

-- Add comment
COMMENT ON COLUMN public.barbershops.verification_documents IS 'JSONB containing uploaded documents: logo, cover_images, ssm_document, business_license';
