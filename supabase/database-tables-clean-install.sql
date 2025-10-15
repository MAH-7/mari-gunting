-- ============================================================================
-- MARI GUNTING - CLEAN DATABASE INSTALL
-- ============================================================================
-- This script will DROP existing tables and create fresh ones
-- USE WITH CAUTION - This will delete existing data!
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 1: DROP ALL EXISTING TABLES (in correct order)
-- ============================================================================
DROP TABLE IF EXISTS partner_verification_logs CASCADE;
DROP TABLE IF EXISTS barbershop_services CASCADE;
DROP TABLE IF EXISTS barbershop_staff CASCADE;
DROP TABLE IF EXISTS barbershop_hours CASCADE;
DROP TABLE IF EXISTS barbershops CASCADE;
DROP TABLE IF EXISTS barber_availability CASCADE;
DROP TABLE IF EXISTS barbers CASCADE;

-- Drop the update function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================================
-- STEP 2: CREATE TABLES
-- ============================================================================

-- 1. BARBERS TABLE
CREATE TABLE barbers (
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
  
  -- Payout
  bank_name TEXT NOT NULL,
  bank_account_number TEXT NOT NULL,
  bank_account_name TEXT NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  verification_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. BARBER AVAILABILITY TABLE
CREATE TABLE barber_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  
  day_of_week INTEGER NOT NULL,
  is_available BOOLEAN DEFAULT true,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(barber_id, day_of_week)
);

-- 3. BARBERSHOPS TABLE
CREATE TABLE barbershops (
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
  
  -- Amenities
  amenities TEXT[] DEFAULT '{}',
  
  -- Payout
  bank_name TEXT NOT NULL,
  bank_account_number TEXT NOT NULL,
  bank_account_name TEXT NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  verification_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 4. BARBERSHOP OPERATING HOURS TABLE
CREATE TABLE barbershop_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  
  day VARCHAR(3) NOT NULL,
  is_open BOOLEAN DEFAULT true,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(barbershop_id, day)
);

-- 5. BARBERSHOP STAFF TABLE
CREATE TABLE barbershop_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  role VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. BARBERSHOP SERVICES TABLE
CREATE TABLE barbershop_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. PARTNER VERIFICATION LOGS TABLE
CREATE TABLE partner_verification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  partner_type VARCHAR(20) NOT NULL,
  
  action VARCHAR(50) NOT NULL,
  status VARCHAR(50),
  notes TEXT,
  reviewer_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- STEP 3: CREATE INDEXES
-- ============================================================================

-- Barbers indexes
CREATE INDEX idx_barbers_user_id ON barbers(user_id);
CREATE INDEX idx_barbers_status ON barbers(status);
CREATE INDEX idx_barbers_created_at ON barbers(created_at DESC);

-- Barber availability indexes
CREATE INDEX idx_barber_availability_barber_id ON barber_availability(barber_id);

-- Barbershops indexes
CREATE INDEX idx_barbershops_user_id ON barbershops(user_id);
CREATE INDEX idx_barbershops_status ON barbershops(status);
CREATE INDEX idx_barbershops_created_at ON barbershops(created_at DESC);
CREATE INDEX idx_barbershops_latitude ON barbershops(latitude);
CREATE INDEX idx_barbershops_longitude ON barbershops(longitude);

-- Barbershop hours indexes
CREATE INDEX idx_barbershop_hours_barbershop_id ON barbershop_hours(barbershop_id);

-- Barbershop staff indexes
CREATE INDEX idx_barbershop_staff_barbershop_id ON barbershop_staff(barbershop_id);

-- Barbershop services indexes
CREATE INDEX idx_barbershop_services_barbershop_id ON barbershop_services(barbershop_id);

-- Verification logs indexes
CREATE INDEX idx_verification_logs_user_id ON partner_verification_logs(user_id);
CREATE INDEX idx_verification_logs_partner_type ON partner_verification_logs(partner_type);
CREATE INDEX idx_verification_logs_created_at ON partner_verification_logs(created_at DESC);

-- ============================================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershop_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershop_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershop_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_verification_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: CREATE POLICIES
-- ============================================================================

-- Barbers policies
CREATE POLICY "Users can view own barber profile" ON barbers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own barber profile" ON barbers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own barber profile" ON barbers FOR UPDATE USING (auth.uid() = user_id);

-- Barber availability policies
CREATE POLICY "Users can manage own availability" ON barber_availability FOR ALL 
  USING (EXISTS (SELECT 1 FROM barbers WHERE barbers.id = barber_availability.barber_id AND barbers.user_id = auth.uid()));

-- Barbershops policies
CREATE POLICY "Users can view own barbershop" ON barbershops FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own barbershop" ON barbershops FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own barbershop" ON barbershops FOR UPDATE USING (auth.uid() = user_id);

-- Barbershop hours policies
CREATE POLICY "Users can manage shop hours" ON barbershop_hours FOR ALL
  USING (EXISTS (SELECT 1 FROM barbershops WHERE barbershops.id = barbershop_hours.barbershop_id AND barbershops.user_id = auth.uid()));

-- Barbershop staff policies
CREATE POLICY "Users can manage shop staff" ON barbershop_staff FOR ALL
  USING (EXISTS (SELECT 1 FROM barbershops WHERE barbershops.id = barbershop_staff.barbershop_id AND barbershops.user_id = auth.uid()));

-- Barbershop services policies
CREATE POLICY "Users can manage shop services" ON barbershop_services FOR ALL
  USING (EXISTS (SELECT 1 FROM barbershops WHERE barbershops.id = barbershop_services.barbershop_id AND barbershops.user_id = auth.uid()));

-- Verification logs policies
CREATE POLICY "Users can view own logs" ON partner_verification_logs FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 6: CREATE UPDATE TRIGGERS
-- ============================================================================

-- Create update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER trg_barbers_updated_at BEFORE UPDATE ON barbers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_barber_availability_updated_at BEFORE UPDATE ON barber_availability 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_barbershops_updated_at BEFORE UPDATE ON barbershops 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_barbershop_hours_updated_at BEFORE UPDATE ON barbershop_hours 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_barbershop_staff_updated_at BEFORE UPDATE ON barbershop_staff 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_barbershop_services_updated_at BEFORE UPDATE ON barbershop_services 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 7: VERIFY INSTALLATION
-- ============================================================================

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = t.table_name AND table_schema = 'public') as columns
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'barbers', 'barber_availability', 'barbershops',
    'barbershop_hours', 'barbershop_staff', 'barbershop_services',
    'partner_verification_logs'
  )
ORDER BY table_name;

-- ============================================================================
-- SUCCESS!
-- ============================================================================
SELECT '✅ All tables created successfully! Ready for onboarding!' as status;
