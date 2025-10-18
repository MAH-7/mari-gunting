-- ============================================
-- MARI GUNTING APP TRIGGERS (production)
-- ============================================

CREATE TRIGGER trigger_sync_barber_verification BEFORE INSERT ON barbers FOR EACH ROW EXECUTE FUNCTION sync_barber_verification();
CREATE TRIGGER update_barbers_updated_at BEFORE UPDATE ON barbers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_barbershops_updated_at BEFORE UPDATE ON barbershops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER bookings_calculate_distance BEFORE INSERT ON bookings FOR EACH ROW EXECUTE FUNCTION calculate_booking_distance();
CREATE TRIGGER set_booking_number_trigger BEFORE INSERT ON bookings FOR EACH ROW EXECUTE FUNCTION set_booking_number();
CREATE TRIGGER trigger_auto_credit_on_rejection AFTER UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION auto_credit_on_rejection();
CREATE TRIGGER trigger_award_booking_points AFTER UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION award_booking_points();
CREATE TRIGGER trigger_award_points_on_completion AFTER UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION award_points_on_completion();
CREATE TRIGGER trigger_set_tracking_started_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION set_tracking_started_at();
CREATE TRIGGER trigger_update_barber_stats_on_completion AFTER INSERT ON bookings FOR EACH ROW EXECUTE FUNCTION update_barber_stats_on_completion();
CREATE TRIGGER trigger_update_payment_on_completion BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_payment_status_on_completion();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER customer_addresses_location_updated BEFORE UPDATE ON customer_addresses FOR EACH ROW EXECUTE FUNCTION update_customer_address_location_timestamp();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_barber_rating AFTER INSERT ON reviews FOR EACH ROW EXECUTE FUNCTION update_barber_rating();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_vouchers_updated_at BEFORE UPDATE ON user_vouchers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vouchers_updated_at BEFORE UPDATE ON vouchers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
