-- ============================================
-- MARI GUNTING RLS POLICIES (production)
-- Total: 75 policies
-- ============================================

-- BARBER_ONBOARDING policies
CREATE POLICY "Users can insert own barber application" ON barber_onboarding FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update own barber application" ON barber_onboarding FOR UPDATE TO public USING (((auth.uid() = user_id) AND ((status)::text = 'pending'::text)));
CREATE POLICY "Users can view own barber application" ON barber_onboarding FOR SELECT TO public USING ((auth.uid() = user_id));

-- BARBERS policies
CREATE POLICY "Active barbers viewable by all" ON barbers FOR SELECT TO public USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = barbers.user_id) AND (profiles.is_active = true)))));
CREATE POLICY "Barbers can insert own profile" ON barbers FOR INSERT TO public WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can view own barber record" ON barbers FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "barbers_update_debug" ON barbers FOR UPDATE TO authenticated USING (true) WITH CHECK ((auth.uid() = user_id));

-- BARBERSHOP_ONBOARDING policies
CREATE POLICY "Users can insert own barbershop application" ON barbershop_onboarding FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update own barbershop application" ON barbershop_onboarding FOR UPDATE TO public USING (((auth.uid() = user_id) AND ((status)::text = 'pending'::text)));
CREATE POLICY "Users can view own barbershop application" ON barbershop_onboarding FOR SELECT TO public USING ((auth.uid() = user_id));

-- BARBERSHOPS policies
CREATE POLICY "Active barbershops viewable by all" ON barbershops FOR SELECT TO public USING ((is_active = true));
CREATE POLICY "Owners can manage own barbershops" ON barbershops FOR ALL TO public USING ((owner_id = auth.uid()));
CREATE POLICY "Owners can update own barbershop record" ON barbershops FOR UPDATE TO authenticated USING ((auth.uid() = owner_id)) WITH CHECK ((auth.uid() = owner_id));
CREATE POLICY "Owners can view own barbershop record" ON barbershops FOR SELECT TO authenticated USING ((auth.uid() = owner_id));

-- BOOKING_VOUCHERS policies
CREATE POLICY "Users can insert own booking vouchers" ON booking_vouchers FOR INSERT TO public WITH CHECK ((auth.uid() = customer_id));
CREATE POLICY "Users can view own booking vouchers" ON booking_vouchers FOR SELECT TO public USING ((auth.uid() = customer_id));

-- BOOKINGS policies
CREATE POLICY "Barbers can update their bookings" ON bookings FOR UPDATE TO public USING ((barber_id IN ( SELECT barbers.id FROM barbers WHERE (barbers.user_id = auth.uid()))));
CREATE POLICY "Barbers can view assigned bookings" ON bookings FOR SELECT TO public USING ((barber_id IN ( SELECT barbers.id FROM barbers WHERE (barbers.user_id = auth.uid()))));
CREATE POLICY "Barbers can view their bookings" ON bookings FOR SELECT TO public USING ((barber_id IN ( SELECT barbers.id FROM barbers WHERE (barbers.user_id = auth.uid()))));
CREATE POLICY "Barbershop owners can update bookings" ON bookings FOR UPDATE TO public USING ((barbershop_id IN ( SELECT barbershops.id FROM barbershops WHERE (barbershops.owner_id = auth.uid()))));
CREATE POLICY "Customers can create bookings" ON bookings FOR INSERT TO public WITH CHECK ((customer_id = auth.uid()));
CREATE POLICY "Customers can update own bookings" ON bookings FOR UPDATE TO public USING ((customer_id = auth.uid())) WITH CHECK ((customer_id = auth.uid()));
CREATE POLICY "bookings_select_barber" ON bookings FOR SELECT TO authenticated USING ((barber_id IN ( SELECT barbers.id FROM barbers WHERE (barbers.user_id = auth.uid()))));
CREATE POLICY "bookings_select_barbershop" ON bookings FOR SELECT TO authenticated USING ((barbershop_id IN ( SELECT barbershops.id FROM barbershops WHERE (barbershops.owner_id = auth.uid()))));
CREATE POLICY "bookings_select_customer" ON bookings FOR SELECT TO authenticated USING ((customer_id = auth.uid()));

-- CREDIT_TRANSACTIONS policies
CREATE POLICY "Customers can view own transactions" ON credit_transactions FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "System can manage transactions" ON credit_transactions FOR ALL TO public USING (true) WITH CHECK (true);

-- CUSTOMER_ADDRESSES policies
CREATE POLICY "Users can delete own addresses" ON customer_addresses FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert own addresses" ON customer_addresses FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update own addresses" ON customer_addresses FOR UPDATE TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view own addresses" ON customer_addresses FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "customer_addresses_delete" ON customer_addresses FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "customer_addresses_delete_policy" ON customer_addresses FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "customer_addresses_insert" ON customer_addresses FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "customer_addresses_insert_policy" ON customer_addresses FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "customer_addresses_select" ON customer_addresses FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "customer_addresses_select_policy" ON customer_addresses FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "customer_addresses_update" ON customer_addresses FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "customer_addresses_update_policy" ON customer_addresses FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));

-- CUSTOMER_CREDITS policies
CREATE POLICY "Customers can view own credits" ON customer_credits FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "System can manage credits" ON customer_credits FOR ALL TO public USING (true) WITH CHECK (true);

-- FAVORITES policies
CREATE POLICY "Users can add favorites" ON favorites FOR INSERT TO public WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can remove favorites" ON favorites FOR DELETE TO public USING ((user_id = auth.uid()));
CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT TO public USING ((user_id = auth.uid()));

-- MESSAGES policies
CREATE POLICY "Users can send messages" ON messages FOR INSERT TO public WITH CHECK ((sender_id = auth.uid()));
CREATE POLICY "Users can update messages" ON messages FOR UPDATE TO public USING (((sender_id = auth.uid()) OR (receiver_id = auth.uid())));
CREATE POLICY "Users can view own messages" ON messages FOR SELECT TO public USING (((sender_id = auth.uid()) OR (receiver_id = auth.uid())));

-- NOTIFICATIONS policies
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE TO public USING ((user_id = auth.uid()));
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT TO public USING ((user_id = auth.uid()));

-- ONBOARDING_VERIFICATION_LOGS policies
CREATE POLICY "Users can view own application logs" ON onboarding_verification_logs FOR SELECT TO public USING (((EXISTS ( SELECT 1 FROM barber_onboarding WHERE ((barber_onboarding.id = onboarding_verification_logs.application_id) AND (barber_onboarding.user_id = auth.uid())))) OR (EXISTS ( SELECT 1 FROM barbershop_onboarding WHERE ((barbershop_onboarding.id = onboarding_verification_logs.application_id) AND (barbershop_onboarding.user_id = auth.uid()))))));

-- OTP_REQUESTS policies
CREATE POLICY "Service role full access on otp_requests" ON otp_requests FOR ALL TO service_role USING (true) WITH CHECK (true);

-- PAYMENTS policies
CREATE POLICY "Users can view own payments" ON payments FOR SELECT TO public USING ((customer_id = auth.uid()));

-- PAYOUTS policies
CREATE POLICY "Barbers can view own payouts" ON payouts FOR SELECT TO public USING ((barber_id IN ( SELECT barbers.id FROM barbers WHERE (barbers.user_id = auth.uid()))));
CREATE POLICY "Barbershop owners can view payouts" ON payouts FOR SELECT TO public USING ((barbershop_id IN ( SELECT barbershops.id FROM barbershops WHERE (barbershops.owner_id = auth.uid()))));

-- POINTS_TRANSACTIONS policies
CREATE POLICY "System can insert transactions" ON points_transactions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Users can view own transactions" ON points_transactions FOR SELECT TO public USING ((auth.uid() = user_id));

-- PROFILES policies
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO public WITH CHECK ((auth.uid() = id));
CREATE POLICY "profiles_select_authenticated" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_select_barbers_for_discovery" ON profiles FOR SELECT TO public USING (((is_active = true) AND (role = 'barber'::user_role)));
CREATE POLICY "profiles_select_barbershop_owners_for_discovery" ON profiles FOR SELECT TO public USING (((is_active = true) AND (role = 'barbershop_owner'::user_role)));
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO public USING ((auth.uid() = id));
CREATE POLICY "profiles_update_debug" ON profiles FOR UPDATE TO authenticated USING (true) WITH CHECK ((auth.uid() = id));

-- REVIEWS policies
CREATE POLICY "Barbers can respond to reviews" ON reviews FOR UPDATE TO public USING ((barber_id IN ( SELECT barbers.id FROM barbers WHERE (barbers.user_id = auth.uid())))) WITH CHECK ((barber_id IN ( SELECT barbers.id FROM barbers WHERE (barbers.user_id = auth.uid()))));
CREATE POLICY "Barbershop owners can respond to reviews" ON reviews FOR UPDATE TO public USING ((barbershop_id IN ( SELECT barbershops.id FROM barbershops WHERE (barbershops.owner_id = auth.uid())))) WITH CHECK ((barbershop_id IN ( SELECT barbershops.id FROM barbershops WHERE (barbershops.owner_id = auth.uid()))));
CREATE POLICY "Customers can create reviews" ON reviews FOR INSERT TO public WITH CHECK (((customer_id = auth.uid()) AND (EXISTS ( SELECT 1 FROM bookings WHERE ((bookings.id = reviews.booking_id) AND (bookings.customer_id = auth.uid()) AND (bookings.status = 'completed'::booking_status))))));
CREATE POLICY "Customers can update own reviews" ON reviews FOR UPDATE TO public USING ((customer_id = auth.uid()));
CREATE POLICY "Visible reviews viewable by all" ON reviews FOR SELECT TO public USING ((is_visible = true));
CREATE POLICY "reviews_select_visible" ON reviews FOR SELECT TO authenticated USING ((is_visible = true));

-- SERVICES policies
CREATE POLICY "Active services viewable by all" ON services FOR SELECT TO public USING ((is_active = true));
CREATE POLICY "Barbers can manage own services" ON services FOR ALL TO public USING ((barber_id IN ( SELECT barbers.id FROM barbers WHERE (barbers.user_id = auth.uid()))));
CREATE POLICY "Barbershop owners can manage services" ON services FOR ALL TO public USING ((barbershop_id IN ( SELECT barbershops.id FROM barbershops WHERE (barbershops.owner_id = auth.uid()))));

-- USER_VOUCHERS policies
CREATE POLICY "Users can insert own vouchers via function" ON user_vouchers FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update own vouchers via function" ON user_vouchers FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view own vouchers" ON user_vouchers FOR SELECT TO public USING ((auth.uid() = user_id));

-- VOUCHERS policies
CREATE POLICY "Anyone can view active vouchers" ON vouchers FOR SELECT TO public USING (((is_active = true) AND (valid_until > now())));