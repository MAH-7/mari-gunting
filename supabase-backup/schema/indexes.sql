-- ============================================
-- MARI GUNTING DATABASE INDEXES (production)
-- Total: 103 indexes
-- ============================================

-- BARBER_ONBOARDING indexes
CREATE UNIQUE INDEX barber_onboarding_user_id_key ON public.barber_onboarding USING btree (user_id);
CREATE INDEX idx_barber_onboarding_created_at ON public.barber_onboarding USING btree (created_at DESC);
CREATE INDEX idx_barber_onboarding_status ON public.barber_onboarding USING btree (status);
CREATE INDEX idx_barber_onboarding_submitted_at ON public.barber_onboarding USING btree (submitted_at DESC);
CREATE INDEX idx_barber_onboarding_user_id ON public.barber_onboarding USING btree (user_id);

-- BARBERS indexes
CREATE UNIQUE INDEX fk_barber_user ON public.barbers USING btree (user_id);
CREATE INDEX idx_barbers_available ON public.barbers USING btree (is_available);
CREATE INDEX idx_barbers_is_available ON public.barbers USING btree (is_available);
CREATE INDEX idx_barbers_last_radius_change ON public.barbers USING btree (last_radius_change_at);
CREATE INDEX idx_barbers_rating ON public.barbers USING btree (rating DESC);
CREATE INDEX idx_barbers_user ON public.barbers USING btree (user_id);
CREATE INDEX idx_barbers_verified ON public.barbers USING btree (is_verified);
CREATE INDEX idx_barbers_verified_availability ON public.barbers USING btree (is_verified, is_available) WHERE ((is_verified = true) AND (is_available = true));

-- BARBERSHOP_ONBOARDING indexes
CREATE UNIQUE INDEX barbershop_onboarding_user_id_key ON public.barbershop_onboarding USING btree (user_id);
CREATE INDEX idx_barbershop_onboarding_created_at ON public.barbershop_onboarding USING btree (created_at DESC);
CREATE INDEX idx_barbershop_onboarding_status ON public.barbershop_onboarding USING btree (status);
CREATE INDEX idx_barbershop_onboarding_submitted_at ON public.barbershop_onboarding USING btree (submitted_at DESC);
CREATE INDEX idx_barbershop_onboarding_user_id ON public.barbershop_onboarding USING btree (user_id);

-- BARBERSHOPS indexes
CREATE INDEX idx_barbershops_location ON public.barbershops USING gist (location);
CREATE INDEX idx_barbershops_owner ON public.barbershops USING btree (owner_id);
CREATE INDEX idx_barbershops_rating ON public.barbershops USING btree (rating DESC);

-- BOOKING_VOUCHERS indexes
CREATE INDEX idx_booking_vouchers_booking ON public.booking_vouchers USING btree (booking_id);
CREATE INDEX idx_booking_vouchers_customer ON public.booking_vouchers USING btree (customer_id);
CREATE INDEX idx_booking_vouchers_user_voucher ON public.booking_vouchers USING btree (user_voucher_id);
CREATE UNIQUE INDEX unique_booking_voucher ON public.booking_vouchers USING btree (booking_id);

-- BOOKINGS indexes
CREATE UNIQUE INDEX bookings_booking_number_key ON public.bookings USING btree (booking_number);
CREATE INDEX idx_bookings_barber ON public.bookings USING btree (barber_id);
CREATE INDEX idx_bookings_barber_id ON public.bookings USING btree (barber_id);
CREATE INDEX idx_bookings_barber_location_at_accept ON public.bookings USING gist (barber_location_at_accept);
CREATE INDEX idx_bookings_barbershop ON public.bookings USING btree (barbershop_id);
CREATE INDEX idx_bookings_customer ON public.bookings USING btree (customer_id);
CREATE INDEX idx_bookings_customer_id ON public.bookings USING btree (customer_id);
CREATE INDEX idx_bookings_customer_location ON public.bookings USING gist (customer_location);
CREATE INDEX idx_bookings_customer_status ON public.bookings USING btree (customer_id, status);
CREATE INDEX idx_bookings_date ON public.bookings USING btree (scheduled_date);
CREATE INDEX idx_bookings_datetime ON public.bookings USING btree (scheduled_datetime);
CREATE INDEX idx_bookings_number ON public.bookings USING btree (booking_number);
CREATE INDEX idx_bookings_rating ON public.bookings USING btree (rating);
CREATE INDEX idx_bookings_scheduled_datetime ON public.bookings USING btree (scheduled_datetime);
CREATE INDEX idx_bookings_status ON public.bookings USING btree (status);
CREATE INDEX idx_bookings_status_tracking ON public.bookings USING btree (status, tracking_started_at) WHERE (status = ANY (ARRAY['accepted'::booking_status, 'confirmed'::booking_status, 'in_progress'::booking_status]));
CREATE INDEX idx_bookings_status_updated ON public.bookings USING btree (status, updated_at DESC);
CREATE INDEX idx_bookings_tracking_started ON public.bookings USING btree (tracking_started_at) WHERE (tracking_started_at IS NOT NULL);

-- CREDIT_TRANSACTIONS indexes
CREATE INDEX idx_credit_transactions_booking_id ON public.credit_transactions USING btree (booking_id);
CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions USING btree (created_at DESC);
CREATE INDEX idx_credit_transactions_type ON public.credit_transactions USING btree (type);
CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions USING btree (user_id);

-- CUSTOMER_ADDRESSES indexes
CREATE INDEX idx_customer_addresses_last_used ON public.customer_addresses USING btree (user_id, last_used_at DESC NULLS LAST);
CREATE INDEX idx_customer_addresses_location ON public.customer_addresses USING gist (location);
CREATE INDEX idx_customer_addresses_type ON public.customer_addresses USING btree (user_id, address_type) WHERE (address_type = ANY (ARRAY['home'::text, 'work'::text]));
CREATE INDEX idx_customer_addresses_user_id ON public.customer_addresses USING btree (user_id);

-- CUSTOMER_CREDITS indexes
CREATE INDEX idx_customer_credits_user_id ON public.customer_credits USING btree (user_id);
CREATE UNIQUE INDEX unique_user_credits ON public.customer_credits USING btree (user_id);

-- FAVORITES indexes
CREATE INDEX idx_favorites_barber ON public.favorites USING btree (barber_id);
CREATE INDEX idx_favorites_barbershop ON public.favorites USING btree (barbershop_id);
CREATE INDEX idx_favorites_user ON public.favorites USING btree (user_id);
CREATE UNIQUE INDEX unique_favorite ON public.favorites USING btree (user_id, barber_id, barbershop_id);

-- MESSAGES indexes
CREATE INDEX idx_messages_booking ON public.messages USING btree (booking_id);
CREATE INDEX idx_messages_created ON public.messages USING btree (created_at DESC);
CREATE INDEX idx_messages_receiver ON public.messages USING btree (receiver_id);
CREATE INDEX idx_messages_sender ON public.messages USING btree (sender_id);

-- NOTIFICATIONS indexes
CREATE INDEX idx_notifications_created ON public.notifications USING btree (created_at DESC);
CREATE INDEX idx_notifications_read ON public.notifications USING btree (is_read);
CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);

-- ONBOARDING_VERIFICATION_LOGS indexes
CREATE INDEX idx_onboarding_logs_application_id ON public.onboarding_verification_logs USING btree (application_id);
CREATE INDEX idx_onboarding_logs_created_at ON public.onboarding_verification_logs USING btree (created_at DESC);
CREATE INDEX idx_onboarding_logs_type ON public.onboarding_verification_logs USING btree (application_type);

-- OTP_REQUESTS indexes
CREATE INDEX idx_otp_requests_created_at ON public.otp_requests USING btree (created_at);
CREATE INDEX idx_otp_requests_phone_number ON public.otp_requests USING btree (phone_number);

-- PAYMENTS indexes
CREATE INDEX idx_payments_booking ON public.payments USING btree (booking_id);
CREATE INDEX idx_payments_customer ON public.payments USING btree (customer_id);
CREATE INDEX idx_payments_status ON public.payments USING btree (payment_status);

-- POINTS_TRANSACTIONS indexes
CREATE INDEX idx_points_transactions_booking ON public.points_transactions USING btree (booking_id) WHERE (booking_id IS NOT NULL);
CREATE INDEX idx_points_transactions_type ON public.points_transactions USING btree (type, created_at DESC);
CREATE INDEX idx_points_transactions_user ON public.points_transactions USING btree (user_id, created_at DESC);

-- PROFILES indexes
CREATE INDEX idx_profiles_email_verified ON public.profiles USING btree (email_verified);
CREATE INDEX idx_profiles_is_online ON public.profiles USING btree (is_online);
CREATE INDEX idx_profiles_last_seen ON public.profiles USING btree (last_seen_at);
CREATE INDEX idx_profiles_location ON public.profiles USING gist (location);
CREATE INDEX idx_profiles_location_gist ON public.profiles USING gist (location);
CREATE INDEX idx_profiles_online_status ON public.profiles USING btree (is_online) WHERE (is_online = true);
CREATE INDEX idx_profiles_phone ON public.profiles USING btree (phone_number);
CREATE INDEX idx_profiles_phone_number ON public.profiles USING btree (phone_number);
CREATE INDEX idx_profiles_phone_verified ON public.profiles USING btree (phone_verified);
CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);
CREATE UNIQUE INDEX profiles_phone_number_unique ON public.profiles USING btree (phone_number);

-- REVIEWS indexes
CREATE INDEX idx_reviews_barber ON public.reviews USING btree (barber_id);
CREATE INDEX idx_reviews_barber_id ON public.reviews USING btree (barber_id);
CREATE INDEX idx_reviews_barbershop ON public.reviews USING btree (barbershop_id);
CREATE INDEX idx_reviews_barbershop_id ON public.reviews USING btree (barbershop_id);
CREATE INDEX idx_reviews_booking ON public.reviews USING btree (booking_id);
CREATE INDEX idx_reviews_created_at ON public.reviews USING btree (created_at DESC);
CREATE INDEX idx_reviews_customer ON public.reviews USING btree (customer_id);
CREATE INDEX idx_reviews_customer_id ON public.reviews USING btree (customer_id);
CREATE INDEX idx_reviews_rating ON public.reviews USING btree (rating);
CREATE INDEX idx_reviews_visible ON public.reviews USING btree (is_visible) WHERE (is_visible = true);
CREATE UNIQUE INDEX unique_review_per_booking ON public.reviews USING btree (booking_id);

-- SERVICES indexes
CREATE INDEX idx_services_active ON public.services USING btree (is_active);
CREATE INDEX idx_services_barber ON public.services USING btree (barber_id);
CREATE INDEX idx_services_barbershop ON public.services USING btree (barbershop_id);

-- USER_VOUCHERS indexes
CREATE INDEX idx_user_vouchers_booking ON public.user_vouchers USING btree (used_for_booking_id) WHERE (used_for_booking_id IS NOT NULL);
CREATE INDEX idx_user_vouchers_user ON public.user_vouchers USING btree (user_id, status);

-- VOUCHERS indexes
CREATE INDEX idx_vouchers_active ON public.vouchers USING btree (is_active, valid_until) WHERE (is_active = true);
CREATE INDEX idx_vouchers_code ON public.vouchers USING btree (code);
CREATE UNIQUE INDEX vouchers_code_key ON public.vouchers USING btree (code);