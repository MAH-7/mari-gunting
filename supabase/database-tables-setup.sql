-- ============================================================================
-- MARI GUNTING - DATABASE TABLES FOR ONBOARDING
-- ============================================================================
-- This script creates all required database tables for partner onboarding
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. BARBERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS barbers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Basic Info
  experience_years INTEGER NOT NULL CHECK (experience_years >= 1),
  specializations TEXT[] NOT NULL DEFAULT '{}',
  bio TEXT NOT NULL CHECK (char_length(bio) >= 50 AND char_length(bio) <= 500),
  
  -- eKYC
  ic_number VARCHAR(12) NOT NULL,
  ic_front_url TEXT NOT NULL,
  ic_back_url TEXT NOT NULL,
  selfie_url TEXT NOT NULL,
  certificate_urls TEXT[] DEFAULT '{}',
  
  -- Service Details
  service_radius_km INTEGER NOT NULL CHECK (service_radius_km >= 1 AND service_radius_km <= 50),
  portfolio_urls TEXT[] DEFAULT '{}',
  base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 20),
  
  -- Payout
  bank_name TEXT NOT NULL,
  bank_account_number TEXT NOT NULL,
  bank_account_name TEXT NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  verification_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for barbers
CREATE INDEX IF NOT EXISTS idx_barbers_user_id ON barbers(user_id);
CREATE INDEX IF NOT EXISTS idx_barbers_status ON barbers(status);
CREATE INDEX IF NOT EXISTS idx_barbers_created_at ON barbers(created_at DESC);

-- ============================================================================
-- 2. BARBER AVAILABILITY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS barber_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE NOT NULL,
  
  -- Day of week (0=Sunday, 6=Saturday)
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  
  -- Availability
  is_available BOOLEAN DEFAULT true,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one record per barber per day
  UNIQUE(barber_id, day_of_week)
);

-- Add indexes for barber_availability
CREATE INDEX IF NOT EXISTS idx_barber_availability_barber_id ON barber_availability(barber_id);

-- ============================================================================
-- 3. BARBERSHOPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS barbershops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Business Info
  name VARCHAR(100) NOT NULL CHECK (char_length(name) >= 3),
  description TEXT NOT NULL CHECK (char_length(description) >= 50 AND char_length(description) <= 500),
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
  cover_urls TEXT[] NOT NULL DEFAULT '{}' CHECK (array_length(cover_urls, 1) >= 2),
  ssm_url TEXT NOT NULL,
  license_url TEXT NOT NULL,
  
  -- Amenities
  amenities TEXT[] DEFAULT '{}',
  
  -- Payout
  bank_name TEXT NOT NULL,
  bank_account_number TEXT NOT NULL,
  bank_account_name TEXT NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  verification_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for barbershops
CREATE INDEX IF NOT EXISTS idx_barbershops_user_id ON barbershops(user_id);
CREATE INDEX IF NOT EXISTS idx_barbershops_status ON barbershops(status);
CREATE INDEX IF NOT EXISTS idx_barbershops_created_at ON barbershops(created_at DESC);
-- Location index for proximity searches (requires PostGIS extension)
-- CREATE INDEX IF NOT EXISTS idx_barbershops_location ON barbershops USING GIST (
--   ll_to_earth(latitude::double precision, longitude::double precision)
-- );
-- Simple lat/lng indexes for now:
CREATE INDEX IF NOT EXISTS idx_barbershops_latitude ON barbershops(latitude);
CREATE INDEX IF NOT EXISTS idx_barbershops_longitude ON barbershops(longitude);

-- ============================================================================
-- 4. BARBERSHOP OPERATING HOURS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS barbershop_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE NOT NULL,
  
  -- Day of week (mon, tue, wed, thu, fri, sat, sun)
  day VARCHAR(3) NOT NULL CHECK (day IN ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun')),
  
  -- Operating hours
  is_open BOOLEAN DEFAULT true,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one record per shop per day
  UNIQUE(barbershop_id, day)
);

-- Add indexes for barbershop_hours
CREATE INDEX IF NOT EXISTS idx_barbershop_hours_barbershop_id ON barbershop_hours(barbershop_id);

-- ============================================================================
-- 5. BARBERSHOP STAFF TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS barbershop_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE NOT NULL,
  
  -- Staff Info
  name VARCHAR(100) NOT NULL,
  role VARCHAR(100) NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for barbershop_staff
CREATE INDEX IF NOT EXISTS idx_barbershop_staff_barbershop_id ON barbershop_staff(barbershop_id);

-- ============================================================================
-- 6. BARBERSHOP SERVICES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS barbershop_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE NOT NULL,
  
  -- Service Info
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  duration_minutes INTEGER DEFAULT 30 CHECK (duration_minutes > 0),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for barbershop_services
CREATE INDEX IF NOT EXISTS idx_barbershop_services_barbershop_id ON barbershop_services(barbershop_id);

-- ============================================================================
-- 7. PARTNER VERIFICATION LOGS TABLE (Optional - for tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS partner_verification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  partner_type VARCHAR(20) NOT NULL CHECK (partner_type IN ('barber', 'barbershop')),
  
  -- Log data
  action VARCHAR(50) NOT NULL,
  status VARCHAR(50),
  notes TEXT,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for verification logs
CREATE INDEX IF NOT EXISTS idx_verification_logs_user_id ON partner_verification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_partner_type ON partner_verification_logs(partner_type);
CREATE INDEX IF NOT EXISTS idx_verification_logs_created_at ON partner_verification_logs(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershop_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershop_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershop_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_verification_logs ENABLE ROW LEVEL SECURITY;

-- BARBERS POLICIES
CREATE POLICY "Users can view their own barber profile"
  ON barbers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own barber profile"
  ON barbers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own barber profile"
  ON barbers FOR UPDATE
  USING (auth.uid() = user_id);

-- BARBER AVAILABILITY POLICIES
CREATE POLICY "Users can view their own availability"
  ON barber_availability FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM barbers WHERE barbers.id = barber_availability.barber_id AND barbers.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own availability"
  ON barber_availability FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM barbers WHERE barbers.id = barber_availability.barber_id AND barbers.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own availability"
  ON barber_availability FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM barbers WHERE barbers.id = barber_availability.barber_id AND barbers.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own availability"
  ON barber_availability FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM barbers WHERE barbers.id = barber_availability.barber_id AND barbers.user_id = auth.uid()
  ));

-- BARBERSHOPS POLICIES
CREATE POLICY "Users can view their own barbershop profile"
  ON barbershops FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own barbershop profile"
  ON barbershops FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own barbershop profile"
  ON barbershops FOR UPDATE
  USING (auth.uid() = user_id);

-- BARBERSHOP HOURS POLICIES
CREATE POLICY "Users can view their shop hours"
  ON barbershop_hours FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM barbershops WHERE barbershops.id = barbershop_hours.barbershop_id AND barbershops.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their shop hours"
  ON barbershop_hours FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM barbershops WHERE barbershops.id = barbershop_hours.barbershop_id AND barbershops.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their shop hours"
  ON barbershop_hours FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM barbershops WHERE barbershops.id = barbershop_hours.barbershop_id AND barbershops.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their shop hours"
  ON barbershop_hours FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM barbershops WHERE barbershops.id = barbershop_hours.barbershop_id AND barbershops.user_id = auth.uid()
  ));

-- BARBERSHOP STAFF POLICIES
CREATE POLICY "Users can manage their shop staff"
  ON barbershop_staff FOR ALL
  USING (EXISTS (
    SELECT 1 FROM barbershops WHERE barbershops.id = barbershop_staff.barbershop_id AND barbershops.user_id = auth.uid()
  ));

-- BARBERSHOP SERVICES POLICIES
CREATE POLICY "Users can manage their shop services"
  ON barbershop_services FOR ALL
  USING (EXISTS (
    SELECT 1 FROM barbershops WHERE barbershops.id = barbershop_services.barbershop_id AND barbershops.user_id = auth.uid()
  ));

-- VERIFICATION LOGS POLICIES
CREATE POLICY "Users can view their own verification logs"
  ON partner_verification_logs FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to all tables
CREATE TRIGGER update_barbers_updated_at
  BEFORE UPDATE ON barbers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_barber_availability_updated_at
  BEFORE UPDATE ON barber_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_barbershops_updated_at
  BEFORE UPDATE ON barbershops
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_barbershop_hours_updated_at
  BEFORE UPDATE ON barbershop_hours
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_barbershop_staff_updated_at
  BEFORE UPDATE ON barbershop_staff
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_barbershop_services_updated_at
  BEFORE UPDATE ON barbershop_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify all tables are created:
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'barbers',
    'barber_availability',
    'barbershops',
    'barbershop_hours',
    'barbershop_staff',
    'barbershop_services',
    'partner_verification_logs'
  )
ORDER BY table_name;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
-- If you see this message, all tables were created successfully! 🎉
SELECT '✅ All onboarding tables created successfully!' as status;
