-- Mari Gunting Database Schema Export
-- Generated from production database
-- Date: "13.0.5"

-- Table: barbershops
CREATE TABLE IF NOT EXISTS public.barbershops (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    owner_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    logo_url text,
    cover_images text,
    phone_number text,
    email text,
    website_url text,
    address_line1 text NOT NULL,
    address_line2 text,
    city text NOT NULL,
    state text NOT NULL,
    postal_code text,
    country text DEFAULT Malaysia,
    location text NOT NULL,
    opening_hours jsonb,
    is_open_now booleanFalse,
    verification_status text DEFAULT pending,
    ssm_number text,
    rating text0.0,
    total_reviews integer0,
    total_bookings integer0,
    amenities text,
    payment_methods text,
    is_active boolean DEFAULT True,
    is_featured booleanFalse,
    is_verified booleanFalse,
    created_at text DEFAULT now(),
    updated_at text DEFAULT now()
);

-- Table: payments
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    booking_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    amount text NOT NULL,
    currency text DEFAULT MYR,
    payment_method text NOT NULL,
    payment_status text DEFAULT pending,
    stripe_payment_id text,
    stripe_payment_intent_id text,
    billplz_bill_id text,
    receipt_url text,
    refund_amount text,
    refunded_at text,
    refund_reason text,
    metadata jsonb,
    created_at text DEFAULT now(),
    updated_at text DEFAULT now()
);

-- Table: payouts
CREATE TABLE IF NOT EXISTS public.payouts (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    barber_id uuid,
    barbershop_id uuid,
    amount text NOT NULL,
    currency text DEFAULT MYR,
    status text DEFAULT pending,
    bank_name text,
    bank_account_number text,
    bank_account_name text,
    stripe_payout_id text,
    stripe_transfer_id text,
    period_start date NOT NULL,
    period_end date NOT NULL,
    bookings_count integer,
    total_earnings text,
    platform_fee text,
    paid_at text,
    created_at text DEFAULT now(),
    updated_at text DEFAULT now()
);

-- Table: otp_requests
CREATE TABLE IF NOT EXISTS public.otp_requests (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    phone_number text NOT NULL,
    message_sid text,
    status text,
    created_at text DEFAULT now()
);

-- Table: barbershop_onboarding
CREATE TABLE IF NOT EXISTS public.barbershop_onboarding (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    phone text NOT NULL,
    email text NOT NULL,
    address text NOT NULL,
    city text,
    state text,
    postcode text,
    latitude text,
    longitude text,
    logo_url text NOT NULL,
    cover_urls text NOT NULL,
    ssm_url text NOT NULL,
    license_url text NOT NULL,
    operating_hours jsonb NOT NULL,
    staff jsonb NOT NULL,
    services jsonb NOT NULL,
    amenities text,
    bank_name text NOT NULL,
    bank_account_number text NOT NULL,
    bank_account_name text NOT NULL,
    status text DEFAULT pending,
    verification_notes text,
    reviewed_by uuid,
    created_at text DEFAULT now(),
    updated_at text DEFAULT now(),
    submitted_at text,
    approved_at text,
    rejected_at text,
    metadata jsonb
);

-- Table: barber_onboarding
CREATE TABLE IF NOT EXISTS public.barber_onboarding (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    experience_years integer NOT NULL,
    specializations text NOT NULL,
    bio text NOT NULL,
    ic_number text NOT NULL,
    ic_front_url text NOT NULL,
    ic_back_url text NOT NULL,
    selfie_url text NOT NULL,
    certificate_urls text,
    service_radius_km integer NOT NULL,
    portfolio_urls text,
    base_price text NOT NULL,
    availability jsonb NOT NULL,
    bank_name text NOT NULL,
    bank_account_number text NOT NULL,
    bank_account_name text NOT NULL,
    status text DEFAULT pending,
    verification_notes text,
    reviewed_by uuid,
    created_at text DEFAULT now(),
    updated_at text DEFAULT now(),
    submitted_at text,
    approved_at text,
    rejected_at text,
    metadata jsonb
);

-- Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL,
    role text NOT NULL DEFAULT customer,
    full_name text NOT NULL,
    phone_number text,
    phone_verified booleanFalse,
    avatar_url text,
    date_of_birth date,
    gender text,
    address_line1 text,
    address_line2 text,
    city text,
    state text,
    postal_code text,
    country text DEFAULT Malaysia,
    location text,
    language text DEFAULT en,
    currency text DEFAULT MYR,
    timezone text DEFAULT Asia/Kuala_Lumpur,
    is_active boolean DEFAULT True,
    is_online booleanFalse,
    last_seen_at text,
    fcm_token text,
    created_at text DEFAULT now(),
    updated_at text DEFAULT now(),
    email text,
    email_verified booleanFalse,
    email_verified_at timestamp without time zone,
    phone_verified_at timestamp without time zone DEFAULT now(),
    points_balance integer0
);

-- Table: favorites
CREATE TABLE IF NOT EXISTS public.favorites (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    barber_id uuid,
    barbershop_id uuid,
    created_at text DEFAULT now()
);

-- Table: services
CREATE TABLE IF NOT EXISTS public.services (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    barber_id uuid,
    barbershop_id uuid,
    name text NOT NULL,
    description text,
    category text,
    image_url text,
    price text NOT NULL,
    duration_minutes integer NOT NULL,
    is_active boolean DEFAULT True,
    is_popular booleanFalse,
    created_at text DEFAULT now(),
    updated_at text DEFAULT now()
);

-- Table: bookings
CREATE TABLE IF NOT EXISTS public.bookings (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    customer_id uuid NOT NULL,
    barber_id uuid,
    barbershop_id uuid,
    booking_number text NOT NULL,
    status text DEFAULT pending,
    services jsonb NOT NULL,
    scheduled_date date NOT NULL,
    scheduled_time text NOT NULL,
    scheduled_datetime text NOT NULL,
    estimated_duration_minutes integer NOT NULL,
    service_type text NOT NULL,
    customer_address jsonb,
    subtotal text NOT NULL,
    service_fee text0.0,
    travel_fee text0.0,
    discount_amount text0.0,
    total_price text NOT NULL,
    payment_method text,
    payment_status text DEFAULT pending,
    paid_at text,
    customer_notes text,
    barber_notes text,
    cancellation_reason text,
    accepted_at text,
    started_at text,
    completed_at text,
    cancelled_at text,
    created_at text DEFAULT now(),
    updated_at text DEFAULT now(),
    rating text,
    customer_location text,
    customer_address_text text,
    customer_location_accuracy text,
    barber_location_at_accept text,
    barber_location_at_start text,
    barber_location_at_complete text,
    distance_km text,
    estimated_travel_time_minutes integer,
    tracking_started_at text,
    tracking_last_updated_at text,
    estimated_arrival_time text,
    current_distance_km text,
    current_eta_minutes integer,
    barber_arrived_at text,
    on_the_way_at text,
    arrived_at text
);

-- Table: booking_vouchers
CREATE TABLE IF NOT EXISTS public.booking_vouchers (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    booking_id uuid NOT NULL,
    user_voucher_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    voucher_code text NOT NULL,
    voucher_title text NOT NULL,
    discount_amount text,
    discount_percent integer,
    original_total text NOT NULL,
    discount_applied text NOT NULL,
    final_total text NOT NULL,
    applied_at text DEFAULT now()
);

-- Table: active_tracking_sessions
CREATE TABLE IF NOT EXISTS public.active_tracking_sessions (
    booking_id uuid,
    customer_id uuid,
    barber_id uuid,
    status text,
    tracking_started_at text,
    tracking_last_updated_at text,
    current_distance_km text,
    current_eta_minutes integer,
    estimated_arrival_time text,
    barber_location text,
    barber_profile_updated_at text,
    minutes_since_last_update text
);

-- Table: barbers
CREATE TABLE IF NOT EXISTS public.barbers (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    business_name text,
    bio text,
    experience_years integer,
    specializations text,
    portfolio_images text,
    verification_status text DEFAULT pending,
    verification_documents jsonb,
    ic_number text,
    ssm_number text,
    rating text0.0,
    total_reviews integer0,
    total_bookings integer0,
    completed_bookings integer0,
    is_available boolean DEFAULT True,
    working_hours jsonb,
    service_radius_km integer DEFAULT 10,
    base_price text,
    travel_fee_per_km text,
    bank_name text,
    bank_account_number text,
    bank_account_name text,
    is_featured booleanFalse,
    is_verified booleanFalse,
    stripe_account_id text,
    created_at text DEFAULT now(),
    updated_at text DEFAULT now(),
    last_radius_change_at text
);

-- Table: user_vouchers
CREATE TABLE IF NOT EXISTS public.user_vouchers (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    voucher_id uuid NOT NULL,
    redeemed_at text DEFAULT now(),
    points_spent integer NOT NULL,
    status text NOT NULL DEFAULT active,
    used_at text,
    used_for_booking_id uuid,
    created_at text DEFAULT now(),
    updated_at text DEFAULT now()
);

-- Table: credit_transactions
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    type text NOT NULL,
    source text NOT NULL,
    amount text NOT NULL,
    balance_after text NOT NULL,
    description text NOT NULL,
    booking_id uuid,
    metadata jsonb,
    created_at text DEFAULT now()
);

-- Table: points_transactions
CREATE TABLE IF NOT EXISTS public.points_transactions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    type text NOT NULL,
    amount integer NOT NULL,
    balance_after integer NOT NULL,
    description text NOT NULL,
    booking_id uuid,
    voucher_id uuid,
    user_voucher_id uuid,
    admin_id uuid,
    admin_notes text,
    created_at text DEFAULT now()
);

-- Table: messages
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    sender_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    booking_id uuid,
    message_type text DEFAULT text,
    content text NOT NULL,
    image_url text,
    location_data jsonb,
    is_read booleanFalse,
    read_at text,
    created_at text DEFAULT now()
);

-- Table: vouchers
CREATE TABLE IF NOT EXISTS public.vouchers (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    code text NOT NULL,
    title text NOT NULL,
    description text,
    type text NOT NULL,
    value text NOT NULL,
    points_cost integer NOT NULL,
    max_redemptions integer,
    current_redemptions integer0,
    max_per_user integer DEFAULT 1,
    min_spend text0,
    max_discount text,
    applicable_services text,
    valid_from text DEFAULT now(),
    valid_until text NOT NULL,
    created_by uuid,
    is_active boolean DEFAULT True,
    is_featured booleanFalse,
    created_at text DEFAULT now(),
    updated_at text DEFAULT now()
);

-- Table: customer_addresses
CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    label text NOT NULL,
    address_line1 text NOT NULL,
    address_line2 text,
    city text NOT NULL,
    state text NOT NULL,
    postal_code text,
    country text DEFAULT Malaysia,
    is_default booleanFalse,
    created_at text DEFAULT now(),
    updated_at text DEFAULT now(),
    building_name text,
    floor text,
    unit_number text,
    delivery_instructions text,
    contact_number text,
    address_type text DEFAULT other,
    landmark text,
    gps_accuracy text,
    last_used_at timestamp without time zone,
    location text,
    latitude text,
    longitude text,
    location_updated_at text DEFAULT now()
);

-- Table: customer_credits
CREATE TABLE IF NOT EXISTS public.customer_credits (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    balance text NOT NULL0.0,
    created_at text DEFAULT now(),
    updated_at text DEFAULT now()
);

-- Table: route_cache
CREATE TABLE IF NOT EXISTS public.route_cache (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    origin_lat text NOT NULL,
    origin_lng text NOT NULL,
    destination_lat text NOT NULL,
    destination_lng text NOT NULL,
    distance_km text NOT NULL,
    duration_minutes text NOT NULL,
    profile text DEFAULT driving,
    traffic_profile text DEFAULT normal,
    created_at text DEFAULT now(),
    last_used_at text DEFAULT now(),
    hit_count integer DEFAULT 1,
    expires_at text DEFAULT (now() + '7 days'::interval)
);

-- Table: reviews
CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    booking_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    barber_id uuid,
    barbershop_id uuid,
    rating integer NOT NULL,
    comment text,
    images text,
    response text,
    response_at text,
    is_verified booleanFalse,
    is_flagged booleanFalse,
    is_visible boolean DEFAULT True,
    created_at text DEFAULT now(),
    updated_at text DEFAULT now()
);

-- Table: onboarding_verification_logs
CREATE TABLE IF NOT EXISTS public.onboarding_verification_logs (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    application_id uuid NOT NULL,
    application_type text NOT NULL,
    action text NOT NULL,
    status text,
    notes text,
    reviewer_id uuid,
    created_at text DEFAULT now(),
    metadata jsonb
);

-- Table: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    image_url text,
    action_url text,
    action_data jsonb,
    is_read booleanFalse,
    read_at text,
    is_sent booleanFalse,
    sent_at text,
    created_at text DEFAULT now()
);

-- Table: user_booking_stats
CREATE TABLE IF NOT EXISTS public.user_booking_stats (
    user_id uuid,
    total_bookings bigint,
    completed_bookings bigint,
    cancelled_bookings bigint,
    avg_rating text
);

-- Table: promo_codes
CREATE TABLE IF NOT EXISTS public.promo_codes (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    code text NOT NULL,
    description text,
    discount_type text NOT NULL,
    discount_value text NOT NULL,
    max_discount_amount text,
    usage_limit integer,
    usage_count integer0,
    per_user_limit integer DEFAULT 1,
    min_order_amount text,
    is_active boolean DEFAULT True,
    valid_from text,
    valid_until text,
    applicable_to text,
    created_at text DEFAULT now(),
    updated_at text DEFAULT now()
);
