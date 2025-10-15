-- ============================================================================
-- MARI GUNTING - ONBOARDING TABLES (Separate from Production)
-- ============================================================================
-- These tables are ONLY for the onboarding process
-- Once approved, data will be copied to the main barbers/barbershops tables
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ONBOARDING TABLES
-- ============================================================================

-- 1. BARBER ONBOARDING APPLICATIONS
CREATE TABLE IF NOT EXISTS barber_onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  
  -- Basic Info
  experience_years INTEGER NOT NULL,
  specializations TEXT[] NOT NULL DEFAULT '{}',
  bio TEXT NOT NULL,
  
  -- eKYC
  ic_number VARCHAR(12) NOT NULL,
  ic_front_url TEXT NOT NULL,
  ic_back_url TEXT NOT NULL,
  selfie_url TEXT NOT NULL,
  certificate_urls TEXT[] DEFAULT '{}',
  
  -- Service Details
  service_radius_km INTEGER NOT NULL,
  portfolio_urls TEXT[] DEFAULT '{}',
  base_price DECIMAL(10,2) NOT NULL,
  
  -- Working Hours (stored as JSONB)
  availability JSONB NOT NULL,
  
  -- Payout
  bank_name TEXT NOT NULL,
  bank_account_number TEXT NOT NULL,
  bank_account_name TEXT NOT NULL,
  
  -- Application Status
  status VARCHAR(50) DEFAULT 'pending',
  verification_notes TEXT,
  reviewed_by UUID,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. BARBERSHOP ONBOARDING APPLICATIONS
CREATE TABLE IF NOT EXISTS barbershop_onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  
  -- Business Info
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  
  -- Location
  address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(100),
  postcode VARCHAR(10),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Documents
  logo_url TEXT NOT NULL,
  cover_urls TEXT[] NOT NULL DEFAULT '{}',
  ssm_url TEXT NOT NULL,
  license_url TEXT NOT NULL,
  
  -- Operating Hours (stored as JSONB)
  operating_hours JSONB NOT NULL,
  
  -- Staff (stored as JSONB array)
  staff JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Services (stored as JSONB array)
  services JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Amenities
  amenities TEXT[] DEFAULT '{}',
  
  -- Payout
  bank_name TEXT NOT NULL,
  bank_account_number TEXT NOT NULL,
  bank_account_name TEXT NOT NULL,
  
  -- Application Status
  status VARCHAR(50) DEFAULT 'pending',
  verification_notes TEXT,
  reviewed_by UUID,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. ONBOARDING VERIFICATION LOGS
CREATE TABLE IF NOT EXISTS onboarding_verification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL,
  application_type VARCHAR(20) NOT NULL CHECK (application_type IN ('barber', 'barbershop')),
  
  -- Log data
  action VARCHAR(50) NOT NULL,
  status VARCHAR(50),
  notes TEXT,
  reviewer_id UUID,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Barber onboarding indexes
CREATE INDEX IF NOT EXISTS idx_barber_onboarding_user_id ON barber_onboarding(user_id);
CREATE INDEX IF NOT EXISTS idx_barber_onboarding_status ON barber_onboarding(status);
CREATE INDEX IF NOT EXISTS idx_barber_onboarding_created_at ON barber_onboarding(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_barber_onboarding_submitted_at ON barber_onboarding(submitted_at DESC);

-- Barbershop onboarding indexes
CREATE INDEX IF NOT EXISTS idx_barbershop_onboarding_user_id ON barbershop_onboarding(user_id);
CREATE INDEX IF NOT EXISTS idx_barbershop_onboarding_status ON barbershop_onboarding(status);
CREATE INDEX IF NOT EXISTS idx_barbershop_onboarding_created_at ON barbershop_onboarding(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_barbershop_onboarding_submitted_at ON barbershop_onboarding(submitted_at DESC);

-- Verification logs indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_logs_application_id ON onboarding_verification_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_logs_type ON onboarding_verification_logs(application_type);
CREATE INDEX IF NOT EXISTS idx_onboarding_logs_created_at ON onboarding_verification_logs(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE barber_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershop_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_verification_logs ENABLE ROW LEVEL SECURITY;

-- Barber onboarding policies
CREATE POLICY "Users can view own barber application" 
  ON barber_onboarding FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own barber application" 
  ON barber_onboarding FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own barber application" 
  ON barber_onboarding FOR UPDATE 
  USING (auth.uid() = user_id AND status = 'pending');

-- Barbershop onboarding policies
CREATE POLICY "Users can view own barbershop application" 
  ON barbershop_onboarding FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own barbershop application" 
  ON barbershop_onboarding FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own barbershop application" 
  ON barbershop_onboarding FOR UPDATE 
  USING (auth.uid() = user_id AND status = 'pending');

-- Verification logs policies
CREATE POLICY "Users can view own application logs" 
  ON onboarding_verification_logs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM barber_onboarding 
      WHERE id = application_id AND user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM barbershop_onboarding 
      WHERE id = application_id AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_barber_onboarding_updated_at 
  BEFORE UPDATE ON barber_onboarding 
  FOR EACH ROW EXECUTE FUNCTION update_onboarding_updated_at();

CREATE TRIGGER trg_barbershop_onboarding_updated_at 
  BEFORE UPDATE ON barbershop_onboarding 
  FOR EACH ROW EXECUTE FUNCTION update_onboarding_updated_at();

-- ============================================================================
-- HELPER FUNCTION: Copy approved application to production
-- ============================================================================

-- Function to approve barber and copy to production table
CREATE OR REPLACE FUNCTION approve_barber_application(application_id UUID)
RETURNS void AS $$
DECLARE
  app_record RECORD;
BEGIN
  -- Get the application
  SELECT * INTO app_record FROM barber_onboarding WHERE id = application_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found';
  END IF;
  
  IF app_record.status != 'pending' THEN
    RAISE EXCEPTION 'Application is not pending';
  END IF;
  
  -- Update application status
  UPDATE barber_onboarding 
  SET status = 'approved', approved_at = NOW()
  WHERE id = application_id;
  
  -- TODO: Copy to main barbers table when ready
  -- This is where you'd insert into your main barbers table
  
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = t.table_name AND table_schema = 'public') as columns
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'barber_onboarding',
    'barbershop_onboarding',
    'onboarding_verification_logs'
  )
ORDER BY table_name;

-- ============================================================================
-- SUCCESS!
-- ============================================================================
SELECT '✅ Onboarding tables created successfully! Your production tables are safe!' as status;
