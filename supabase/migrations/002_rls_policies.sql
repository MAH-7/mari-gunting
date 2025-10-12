-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Mari-Gunting Database
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (during signup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Public profiles visible to authenticated users (limited fields)
CREATE POLICY "Public profiles viewable by authenticated users"
  ON profiles FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    is_active = TRUE
  );

-- =====================================================
-- BARBERS POLICIES
-- =====================================================

-- Anyone can view active barbers (for discovery)
CREATE POLICY "Active barbers viewable by all"
  ON barbers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = barbers.user_id
      AND profiles.is_active = TRUE
    )
  );

-- Barbers can update their own profile
CREATE POLICY "Barbers can update own profile"
  ON barbers FOR UPDATE
  USING (user_id = auth.uid());

-- Barbers can insert their own profile
CREATE POLICY "Barbers can insert own profile"
  ON barbers FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- BARBERSHOPS POLICIES
-- =====================================================

-- Anyone can view active barbershops
CREATE POLICY "Active barbershops viewable by all"
  ON barbershops FOR SELECT
  USING (is_active = TRUE);

-- Owners can manage their barbershops
CREATE POLICY "Owners can manage own barbershops"
  ON barbershops FOR ALL
  USING (owner_id = auth.uid());

-- =====================================================
-- SERVICES POLICIES
-- =====================================================

-- Anyone can view active services
CREATE POLICY "Active services viewable by all"
  ON services FOR SELECT
  USING (is_active = TRUE);

-- Barbers can manage their own services
CREATE POLICY "Barbers can manage own services"
  ON services FOR ALL
  USING (
    barber_id IN (
      SELECT id FROM barbers WHERE user_id = auth.uid()
    )
  );

-- Barbershop owners can manage their services
CREATE POLICY "Barbershop owners can manage services"
  ON services FOR ALL
  USING (
    barbershop_id IN (
      SELECT id FROM barbershops WHERE owner_id = auth.uid()
    )
  );

-- =====================================================
-- BOOKINGS POLICIES
-- =====================================================

-- Customers can view their own bookings
CREATE POLICY "Customers can view own bookings"
  ON bookings FOR SELECT
  USING (customer_id = auth.uid());

-- Customers can create bookings
CREATE POLICY "Customers can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- Customers can update their pending bookings
CREATE POLICY "Customers can update pending bookings"
  ON bookings FOR UPDATE
  USING (
    customer_id = auth.uid() AND
    status = 'pending'
  );

-- Barbers can view their bookings
CREATE POLICY "Barbers can view their bookings"
  ON bookings FOR SELECT
  USING (
    barber_id IN (
      SELECT id FROM barbers WHERE user_id = auth.uid()
    )
  );

-- Barbers can update their bookings
CREATE POLICY "Barbers can update their bookings"
  ON bookings FOR UPDATE
  USING (
    barber_id IN (
      SELECT id FROM barbers WHERE user_id = auth.uid()
    )
  );

-- Barbershop owners can view their bookings
CREATE POLICY "Barbershop owners can view bookings"
  ON bookings FOR SELECT
  USING (
    barbershop_id IN (
      SELECT id FROM barbershops WHERE owner_id = auth.uid()
    )
  );

-- Barbershop owners can update their bookings
CREATE POLICY "Barbershop owners can update bookings"
  ON bookings FOR UPDATE
  USING (
    barbershop_id IN (
      SELECT id FROM barbershops WHERE owner_id = auth.uid()
    )
  );

-- =====================================================
-- REVIEWS POLICIES
-- =====================================================

-- Anyone can view visible reviews
CREATE POLICY "Visible reviews viewable by all"
  ON reviews FOR SELECT
  USING (is_visible = TRUE);

-- Customers can create reviews for their completed bookings
CREATE POLICY "Customers can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (
    customer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_id
      AND bookings.customer_id = auth.uid()
      AND bookings.status = 'completed'
    )
  );

-- Customers can update their own reviews
CREATE POLICY "Customers can update own reviews"
  ON reviews FOR UPDATE
  USING (customer_id = auth.uid());

-- Barbers can add responses to reviews
CREATE POLICY "Barbers can respond to reviews"
  ON reviews FOR UPDATE
  USING (
    barber_id IN (
      SELECT id FROM barbers WHERE user_id = auth.uid()
    ) AND
    response IS NULL
  );

-- Barbershop owners can respond to reviews
CREATE POLICY "Barbershop owners can respond to reviews"
  ON reviews FOR UPDATE
  USING (
    barbershop_id IN (
      SELECT id FROM barbershops WHERE owner_id = auth.uid()
    ) AND
    response IS NULL
  );

-- =====================================================
-- PAYMENTS POLICIES
-- =====================================================

-- Users can view their own payments
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (customer_id = auth.uid());

-- System can create payments (service_role only)
-- No public INSERT policy

-- =====================================================
-- PAYOUTS POLICIES
-- =====================================================

-- Barbers can view their payouts
CREATE POLICY "Barbers can view own payouts"
  ON payouts FOR SELECT
  USING (
    barber_id IN (
      SELECT id FROM barbers WHERE user_id = auth.uid()
    )
  );

-- Barbershop owners can view their payouts
CREATE POLICY "Barbershop owners can view payouts"
  ON payouts FOR SELECT
  USING (
    barbershop_id IN (
      SELECT id FROM barbershops WHERE owner_id = auth.uid()
    )
  );

-- =====================================================
-- NOTIFICATIONS POLICIES
-- =====================================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- System can create notifications (service_role only)
-- No public INSERT policy

-- =====================================================
-- MESSAGES POLICIES
-- =====================================================

-- Users can view messages they sent or received
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (
    sender_id = auth.uid() OR
    receiver_id = auth.uid()
  );

-- Users can send messages
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Users can update their sent messages (mark as read)
CREATE POLICY "Users can update messages"
  ON messages FOR UPDATE
  USING (
    sender_id = auth.uid() OR
    receiver_id = auth.uid()
  );

-- =====================================================
-- PROMO CODES POLICIES
-- =====================================================

-- Active promo codes viewable by authenticated users
CREATE POLICY "Active promo codes viewable"
  ON promo_codes FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    is_active = TRUE AND
    (valid_until IS NULL OR valid_until > NOW())
  );

-- Admin only can manage promo codes (handled via service_role)

-- =====================================================
-- FAVORITES POLICIES
-- =====================================================

-- Users can view their own favorites
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (user_id = auth.uid());

-- Users can add favorites
CREATE POLICY "Users can add favorites"
  ON favorites FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can remove their favorites
CREATE POLICY "Users can remove favorites"
  ON favorites FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- HELPER FUNCTIONS FOR POLICIES
-- =====================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is barber
CREATE OR REPLACE FUNCTION is_barber()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'barber'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns barbershop
CREATE OR REPLACE FUNCTION owns_barbershop(shop_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM barbershops
    WHERE id = shop_id
    AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on all tables to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant select on all tables to authenticated
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Service role has full access (already default in Supabase)
