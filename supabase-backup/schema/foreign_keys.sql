-- ============================================
-- MARI GUNTING FOREIGN KEY CONSTRAINTS
-- Total: 24 foreign keys
-- ============================================

-- BARBERS foreign keys
ALTER TABLE barbers ADD CONSTRAINT barbers_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- BARBERSHOPS foreign keys
ALTER TABLE barbershops ADD CONSTRAINT barbershops_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- BOOKINGS foreign keys
ALTER TABLE bookings ADD CONSTRAINT bookings_barber_id_fkey FOREIGN KEY (barber_id) REFERENCES barbers(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD CONSTRAINT bookings_barbershop_id_fkey FOREIGN KEY (barbershop_id) REFERENCES barbershops(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD CONSTRAINT bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- CREDIT_TRANSACTIONS foreign keys
ALTER TABLE credit_transactions ADD CONSTRAINT credit_transactions_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
ALTER TABLE credit_transactions ADD CONSTRAINT credit_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- CUSTOMER_ADDRESSES foreign keys
ALTER TABLE customer_addresses ADD CONSTRAINT customer_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- CUSTOMER_CREDITS foreign keys
ALTER TABLE customer_credits ADD CONSTRAINT customer_credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- POINTS_TRANSACTIONS foreign keys
ALTER TABLE points_transactions ADD CONSTRAINT points_transactions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES profiles(id);
ALTER TABLE points_transactions ADD CONSTRAINT points_transactions_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id);
ALTER TABLE points_transactions ADD CONSTRAINT points_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE points_transactions ADD CONSTRAINT points_transactions_user_voucher_id_fkey FOREIGN KEY (user_voucher_id) REFERENCES user_vouchers(id);
ALTER TABLE points_transactions ADD CONSTRAINT points_transactions_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES vouchers(id);

-- REVIEWS foreign keys
ALTER TABLE reviews ADD CONSTRAINT reviews_barber_id_fkey FOREIGN KEY (barber_id) REFERENCES barbers(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD CONSTRAINT reviews_barbershop_id_fkey FOREIGN KEY (barbershop_id) REFERENCES barbershops(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD CONSTRAINT reviews_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD CONSTRAINT reviews_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- SERVICES foreign keys
ALTER TABLE services ADD CONSTRAINT services_barber_id_fkey FOREIGN KEY (barber_id) REFERENCES barbers(id) ON DELETE CASCADE;
ALTER TABLE services ADD CONSTRAINT services_barbershop_id_fkey FOREIGN KEY (barbershop_id) REFERENCES barbershops(id) ON DELETE CASCADE;

-- USER_VOUCHERS foreign keys
ALTER TABLE user_vouchers ADD CONSTRAINT user_vouchers_used_for_booking_id_fkey FOREIGN KEY (used_for_booking_id) REFERENCES bookings(id);
ALTER TABLE user_vouchers ADD CONSTRAINT user_vouchers_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE user_vouchers ADD CONSTRAINT user_vouchers_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE;

-- VOUCHERS foreign keys
ALTER TABLE vouchers ADD CONSTRAINT vouchers_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id);