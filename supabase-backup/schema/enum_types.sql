-- ============================================
-- MARI GUNTING CUSTOM ENUM TYPES
-- ============================================

CREATE TYPE public.booking_status AS ENUM ('pending', 'accepted', 'on_the_way', 'arrived', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected', 'no_show');
CREATE TYPE public.notification_type AS ENUM ('booking', 'payment', 'review', 'promotion', 'system', 'chat');
CREATE TYPE public.payment_method AS ENUM ('cash', 'card', 'fpx', 'ewallet_tng', 'ewallet_grab', 'ewallet_boost', 'ewallet_shopee');
CREATE TYPE public.payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled');
CREATE TYPE public.user_role AS ENUM ('customer', 'barber', 'barbershop_owner', 'admin');
CREATE TYPE public.verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');