-- =====================================================
-- MARI-GUNTING DATABASE SCHEMA
-- Version: 1.0.0
-- Description: Complete production database schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for location data
CREATE EXTENSION IF NOT EXISTS postgis;

-- =====================================================
-- ENUMS
-- =====================================================

-- User roles
CREATE TYPE user_role AS ENUM ('customer', 'barber', 'barbershop_owner', 'admin');

-- Booking status
CREATE TYPE booking_status AS ENUM (
  'pending',
  'accepted',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'rejected',
  'no_show'
);

-- Payment status
CREATE TYPE payment_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded',
  'cancelled'
);

-- Payment method
CREATE TYPE payment_method AS ENUM (
  'cash',
  'card',
  'fpx',
  'ewallet_tng',
  'ewallet_grab',
  'ewallet_boost',
  'ewallet_shopee'
);

-- Verification status
CREATE TYPE verification_status AS ENUM (
  'unverified',
  'pending',
  'verified',
  'rejected'
);

-- Notification type
CREATE TYPE notification_type AS ENUM (
  'booking',
  'payment',
  'review',
  'promotion',
  'system',
  'chat'
);

-- =====================================================
-- PROFILES TABLE
-- Extends Supabase auth.users
-- =====================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'customer',
  full_name TEXT NOT NULL,
  phone_number TEXT,
  phone_verified BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  date_of_birth DATE,
  gender TEXT,
  
  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Malaysia',
  
  -- Location (for geospatial queries)
  location GEOGRAPHY(POINT, 4326),
  
  -- Preferences
  language TEXT DEFAULT 'en',
  currency TEXT DEFAULT 'MYR',
  timezone TEXT DEFAULT 'Asia/Kuala_Lumpur',
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ,
  fcm_token TEXT, -- Firebase Cloud Messaging token for push notifications
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BARBERS TABLE
-- For freelance barbers/stylists
-- =====================================================
CREATE TABLE barbers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Business Information
  business_name TEXT,
  bio TEXT,
  experience_years INTEGER,
  specializations TEXT[], -- ['fade', 'beard', 'coloring']
  
  -- Portfolio
  portfolio_images TEXT[], -- Array of image URLs
  
  -- Verification
  verification_status verification_status DEFAULT 'unverified',
  verification_documents JSONB, -- Store document URLs and metadata
  ic_number TEXT, -- Malaysian IC
  ssm_number TEXT, -- Business registration (optional)
  
  -- Ratings & Stats
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  
  -- Availability
  is_available BOOLEAN DEFAULT TRUE,
  working_hours JSONB, -- Store schedule as JSON
  service_radius_km INTEGER DEFAULT 10, -- How far they travel
  
  -- Pricing
  base_price DECIMAL(10,2),
  travel_fee_per_km DECIMAL(10,2),
  
  -- Banking (for payouts)
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_name TEXT,
  
  -- Metadata
  is_featured BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  stripe_account_id TEXT, -- For payments
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_barber_user UNIQUE(user_id)
);

-- =====================================================
-- BARBERSHOPS TABLE
-- For physical barbershop locations
-- =====================================================
CREATE TABLE barbershops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Basic Information
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_images TEXT[],
  
  -- Contact
  phone_number TEXT,
  email TEXT,
  website_url TEXT,
  
  -- Address
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT,
  country TEXT DEFAULT 'Malaysia',
  
  -- Location (for geospatial queries)
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  
  -- Business Hours
  opening_hours JSONB, -- Store schedule as JSON
  is_open_now BOOLEAN DEFAULT FALSE,
  
  -- Verification
  verification_status verification_status DEFAULT 'unverified',
  ssm_number TEXT, -- Business registration
  
  -- Ratings & Stats
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  
  -- Features & Amenities
  amenities TEXT[], -- ['wifi', 'parking', 'air_conditioning']
  payment_methods TEXT[], -- ['cash', 'card', 'ewallet']
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SERVICES TABLE
-- Services offered by barbers/shops
-- =====================================================
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Owner (either barber or barbershop)
  barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE,
  
  -- Service Details
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'haircut', 'beard', 'styling', 'coloring'
  image_url TEXT,
  
  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER NOT NULL, -- Estimated duration
  
  -- Availability
  is_active BOOLEAN DEFAULT TRUE,
  is_popular BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: Service must belong to either barber OR barbershop
  CONSTRAINT service_owner_check CHECK (
    (barber_id IS NOT NULL AND barbershop_id IS NULL) OR
    (barber_id IS NULL AND barbershop_id IS NOT NULL)
  )
);

-- =====================================================
-- BOOKINGS TABLE
-- Customer bookings/appointments
-- =====================================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Parties involved
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  barber_id UUID REFERENCES barbers(id) ON DELETE SET NULL,
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE SET NULL,
  
  -- Booking Details
  booking_number TEXT UNIQUE NOT NULL, -- Human-readable booking number
  status booking_status DEFAULT 'pending',
  
  -- Services
  services JSONB NOT NULL, -- Array of {service_id, name, price, duration}
  
  -- Scheduling
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  scheduled_datetime TIMESTAMPTZ NOT NULL, -- Computed for easier queries
  estimated_duration_minutes INTEGER NOT NULL,
  
  -- Location
  service_type TEXT NOT NULL, -- 'home_service' or 'walk_in'
  customer_address JSONB, -- {line1, line2, city, state, postal_code, location}
  
  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL,
  service_fee DECIMAL(10,2) DEFAULT 0.00, -- Platform fee
  travel_fee DECIMAL(10,2) DEFAULT 0.00,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  total_price DECIMAL(10,2) NOT NULL,
  
  -- Payment
  payment_method payment_method,
  payment_status payment_status DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  
  -- Notes
  customer_notes TEXT,
  barber_notes TEXT,
  cancellation_reason TEXT,
  
  -- Timestamps
  accepted_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: Booking must be with either barber OR barbershop
  CONSTRAINT booking_provider_check CHECK (
    (barber_id IS NOT NULL AND barbershop_id IS NULL) OR
    (barber_id IS NULL AND barbershop_id IS NOT NULL)
  )
);

-- =====================================================
-- REVIEWS TABLE
-- Customer reviews and ratings
-- =====================================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Review details
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE,
  
  -- Rating
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- Review content
  comment TEXT,
  images TEXT[], -- Optional review images
  
  -- Response from barber/shop
  response TEXT,
  response_at TIMESTAMPTZ,
  
  -- Moderation
  is_verified BOOLEAN DEFAULT FALSE, -- Verified purchase
  is_flagged BOOLEAN DEFAULT FALSE,
  is_visible BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One review per booking
  CONSTRAINT unique_review_per_booking UNIQUE(booking_id)
);

-- =====================================================
-- PAYMENTS TABLE
-- Payment transactions
-- =====================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Transaction details
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Payment info
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'MYR',
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  
  -- Payment gateway
  stripe_payment_id TEXT,
  stripe_payment_intent_id TEXT,
  billplz_bill_id TEXT,
  
  -- Receipt
  receipt_url TEXT,
  
  -- Refund
  refund_amount DECIMAL(10,2),
  refunded_at TIMESTAMPTZ,
  refund_reason TEXT,
  
  -- Metadata
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PAYOUTS TABLE
-- Payouts to barbers/shops
-- =====================================================
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Recipient
  barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE,
  
  -- Payout details
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'MYR',
  status payment_status DEFAULT 'pending',
  
  -- Banking
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_name TEXT,
  
  -- Payment gateway
  stripe_payout_id TEXT,
  stripe_transfer_id TEXT,
  
  -- Period covered
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Metadata
  bookings_count INTEGER,
  total_earnings DECIMAL(10,2),
  platform_fee DECIMAL(10,2),
  
  paid_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATIONS TABLE
-- Push notifications and in-app notifications
-- =====================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Recipient
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Notification details
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  
  -- Action
  action_url TEXT, -- Deep link URL
  action_data JSONB, -- Additional data for the action
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Delivery
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MESSAGES TABLE
-- In-app chat messages
-- =====================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Conversation parties
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Message content
  message_type TEXT DEFAULT 'text', -- 'text', 'image', 'location'
  content TEXT NOT NULL,
  image_url TEXT,
  location_data JSONB,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PROMO CODES TABLE
-- Promotional discount codes
-- =====================================================
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Discount
  discount_type TEXT NOT NULL, -- 'percentage' or 'fixed'
  discount_value DECIMAL(10,2) NOT NULL,
  max_discount_amount DECIMAL(10,2), -- Cap for percentage discounts
  
  -- Usage limits
  usage_limit INTEGER, -- Total number of times code can be used
  usage_count INTEGER DEFAULT 0,
  per_user_limit INTEGER DEFAULT 1,
  min_order_amount DECIMAL(10,2),
  
  -- Validity
  is_active BOOLEAN DEFAULT TRUE,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  
  -- Target
  applicable_to TEXT, -- 'all', 'new_users', 'specific_services'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FAVORITES TABLE
-- Users can favorite barbers/shops
-- =====================================================
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One favorite per user per provider
  CONSTRAINT unique_favorite UNIQUE(user_id, barber_id, barbershop_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Profiles
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_phone ON profiles(phone_number);
CREATE INDEX idx_profiles_location ON profiles USING GIST(location);

-- Barbers
CREATE INDEX idx_barbers_user ON barbers(user_id);
CREATE INDEX idx_barbers_rating ON barbers(rating DESC);
CREATE INDEX idx_barbers_verified ON barbers(is_verified);
CREATE INDEX idx_barbers_available ON barbers(is_available);

-- Barbershops
CREATE INDEX idx_barbershops_owner ON barbershops(owner_id);
CREATE INDEX idx_barbershops_location ON barbershops USING GIST(location);
CREATE INDEX idx_barbershops_rating ON barbershops(rating DESC);

-- Services
CREATE INDEX idx_services_barber ON services(barber_id);
CREATE INDEX idx_services_barbershop ON services(barbershop_id);
CREATE INDEX idx_services_active ON services(is_active);

-- Bookings
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_barber ON bookings(barber_id);
CREATE INDEX idx_bookings_barbershop ON bookings(barbershop_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(scheduled_date);
CREATE INDEX idx_bookings_datetime ON bookings(scheduled_datetime);
CREATE INDEX idx_bookings_number ON bookings(booking_number);

-- Reviews
CREATE INDEX idx_reviews_booking ON reviews(booking_id);
CREATE INDEX idx_reviews_customer ON reviews(customer_id);
CREATE INDEX idx_reviews_barber ON reviews(barber_id);
CREATE INDEX idx_reviews_barbershop ON reviews(barbershop_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Payments
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_status ON payments(payment_status);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Messages
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_booking ON messages(booking_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- Favorites
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_barber ON favorites(barber_id);
CREATE INDEX idx_favorites_barbershop ON favorites(barbershop_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to generate booking number
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
BEGIN
  new_number := 'MG' || TO_CHAR(NOW(), 'YYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at for all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_barbers_updated_at BEFORE UPDATE ON barbers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_barbershops_updated_at BEFORE UPDATE ON barbershops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate booking number
CREATE OR REPLACE FUNCTION set_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_number IS NULL THEN
    NEW.booking_number := generate_booking_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_number_trigger BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_booking_number();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth';
COMMENT ON TABLE barbers IS 'Freelance barbers/stylists';
COMMENT ON TABLE barbershops IS 'Physical barbershop locations';
COMMENT ON TABLE services IS 'Services offered by barbers/shops';
COMMENT ON TABLE bookings IS 'Customer bookings/appointments';
COMMENT ON TABLE reviews IS 'Customer reviews and ratings';
COMMENT ON TABLE payments IS 'Payment transactions';
COMMENT ON TABLE payouts IS 'Payouts to barbers/shops';
COMMENT ON TABLE notifications IS 'Push and in-app notifications';
COMMENT ON TABLE messages IS 'In-app chat messages';
COMMENT ON TABLE promo_codes IS 'Promotional discount codes';
COMMENT ON TABLE favorites IS 'User favorites (barbers/shops)';
