/**
 * Database Types for Mari-Gunting
 * Auto-generated from Supabase schema
 */

// =====================================================
// ENUMS
// =====================================================

export type UserRole = 'customer' | 'barber' | 'barbershop_owner' | 'admin';

export type BookingStatus = 
  | 'pending'
  | 'accepted'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'no_show';

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export type PaymentMethod = 
  | 'cash'
  | 'card'
  | 'fpx'
  | 'ewallet_tng'
  | 'ewallet_grab'
  | 'ewallet_boost'
  | 'ewallet_shopee';

export type VerificationStatus = 
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'rejected';

export type NotificationType = 
  | 'booking'
  | 'payment'
  | 'review'
  | 'promotion'
  | 'system'
  | 'chat';

export type ServiceType = 'home_service' | 'walk_in';

export type MessageType = 'text' | 'image' | 'location';

// =====================================================
// TABLE TYPES
// =====================================================

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone_number: string | null;
  phone_verified: boolean;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  
  // Address
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  
  // Location (PostGIS)
  location: string | null; // GeoJSON format
  
  // Preferences
  language: string;
  currency: string;
  timezone: string;
  
  // Metadata
  is_active: boolean;
  is_online: boolean;
  last_seen_at: string | null;
  fcm_token: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface Barber {
  id: string;
  user_id: string;
  
  // Business Information
  business_name: string | null;
  bio: string | null;
  experience_years: number | null;
  specializations: string[] | null;
  
  // Portfolio
  portfolio_images: string[] | null;
  
  // Verification
  verification_status: VerificationStatus;
  verification_documents: Record<string, any> | null;
  ic_number: string | null;
  ssm_number: string | null;
  
  // Ratings & Stats
  rating: number;
  total_reviews: number;
  total_bookings: number;
  completed_bookings: number;
  
  // Availability
  is_available: boolean;
  working_hours: Record<string, any> | null;
  service_radius_km: number;
  
  // Pricing
  base_price: number | null;
  travel_fee_per_km: number | null;
  
  // Banking
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  
  // Metadata
  is_featured: boolean;
  is_verified: boolean;
  stripe_account_id: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface Barbershop {
  id: string;
  owner_id: string;
  
  // Basic Information
  name: string;
  description: string | null;
  logo_url: string | null;
  cover_images: string[] | null;
  
  // Contact
  phone_number: string | null;
  email: string | null;
  website_url: string | null;
  
  // Address
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string | null;
  country: string;
  
  // Location
  location: string; // GeoJSON format
  
  // Business Hours
  opening_hours: Record<string, any> | null;
  is_open_now: boolean;
  
  // Verification
  verification_status: VerificationStatus;
  ssm_number: string | null;
  
  // Ratings & Stats
  rating: number;
  total_reviews: number;
  total_bookings: number;
  
  // Features
  amenities: string[] | null;
  payment_methods: string[] | null;
  
  // Metadata
  is_active: boolean;
  is_featured: boolean;
  is_verified: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  barber_id: string | null;
  barbershop_id: string | null;
  
  // Service Details
  name: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  
  // Pricing
  price: number;
  duration_minutes: number;
  
  // Availability
  is_active: boolean;
  is_popular: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  customer_id: string;
  barber_id: string | null;
  barbershop_id: string | null;
  
  // Booking Details
  booking_number: string;
  status: BookingStatus;
  
  // Services
  services: ServiceItem[];
  
  // Scheduling
  scheduled_date: string;
  scheduled_time: string;
  scheduled_datetime: string;
  estimated_duration_minutes: number;
  
  // Location
  service_type: ServiceType;
  customer_address: Address | null;
  
  // Pricing
  subtotal: number;
  service_fee: number;
  travel_fee: number;
  discount_amount: number;
  total_price: number;
  
  // Payment
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  paid_at: string | null;
  
  // Notes
  customer_notes: string | null;
  barber_notes: string | null;
  cancellation_reason: string | null;
  
  // Timestamps
  accepted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  customer_id: string;
  barber_id: string | null;
  barbershop_id: string | null;
  
  // Rating
  rating: number;
  
  // Review content
  comment: string | null;
  images: string[] | null;
  
  // Response
  response: string | null;
  response_at: string | null;
  
  // Moderation
  is_verified: boolean;
  is_flagged: boolean;
  is_visible: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  customer_id: string;
  
  // Payment info
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  
  // Payment gateway
  stripe_payment_id: string | null;
  stripe_payment_intent_id: string | null;
  billplz_bill_id: string | null;
  
  // Receipt
  receipt_url: string | null;
  
  // Refund
  refund_amount: number | null;
  refunded_at: string | null;
  refund_reason: string | null;
  
  // Metadata
  metadata: Record<string, any> | null;
  
  created_at: string;
  updated_at: string;
}

export interface Payout {
  id: string;
  barber_id: string | null;
  barbershop_id: string | null;
  
  // Payout details
  amount: number;
  currency: string;
  status: PaymentStatus;
  
  // Banking
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  
  // Payment gateway
  stripe_payout_id: string | null;
  stripe_transfer_id: string | null;
  
  // Period covered
  period_start: string;
  period_end: string;
  
  // Metadata
  bookings_count: number | null;
  total_earnings: number | null;
  platform_fee: number | null;
  
  paid_at: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  
  // Notification details
  type: NotificationType;
  title: string;
  body: string;
  image_url: string | null;
  
  // Action
  action_url: string | null;
  action_data: Record<string, any> | null;
  
  // Status
  is_read: boolean;
  read_at: string | null;
  
  // Delivery
  is_sent: boolean;
  sent_at: string | null;
  
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  booking_id: string | null;
  
  // Message content
  message_type: MessageType;
  content: string;
  image_url: string | null;
  location_data: Record<string, any> | null;
  
  // Status
  is_read: boolean;
  read_at: string | null;
  
  created_at: string;
}

export interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  
  // Discount
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_discount_amount: number | null;
  
  // Usage limits
  usage_limit: number | null;
  usage_count: number;
  per_user_limit: number;
  min_order_amount: number | null;
  
  // Validity
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  
  // Target
  applicable_to: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  barber_id: string | null;
  barbershop_id: string | null;
  
  created_at: string;
}

// =====================================================
// HELPER TYPES
// =====================================================

export interface ServiceItem {
  service_id: string;
  name: string;
  price: number;
  duration: number;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface WorkingHours {
  monday?: TimeSlot;
  tuesday?: TimeSlot;
  wednesday?: TimeSlot;
  thursday?: TimeSlot;
  friday?: TimeSlot;
  saturday?: TimeSlot;
  sunday?: TimeSlot;
}

export interface TimeSlot {
  start: string; // HH:mm format
  end: string;
  is_enabled: boolean;
}

// =====================================================
// DATABASE TYPES (Supabase)
// =====================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      barbers: {
        Row: Barber;
        Insert: Omit<Barber, 'id' | 'created_at' | 'updated_at' | 'rating' | 'total_reviews' | 'total_bookings' | 'completed_bookings'>;
        Update: Partial<Omit<Barber, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
      };
      barbershops: {
        Row: Barbershop;
        Insert: Omit<Barbershop, 'id' | 'created_at' | 'updated_at' | 'rating' | 'total_reviews' | 'total_bookings'>;
        Update: Partial<Omit<Barbershop, 'id' | 'owner_id' | 'created_at' | 'updated_at'>>;
      };
      services: {
        Row: Service;
        Insert: Omit<Service, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Service, 'id' | 'created_at' | 'updated_at'>>;
      };
      bookings: {
        Row: Booking;
        Insert: Omit<Booking, 'id' | 'booking_number' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Booking, 'id' | 'booking_number' | 'customer_id' | 'created_at'>>;
      };
      reviews: {
        Row: Review;
        Insert: Omit<Review, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Review, 'id' | 'booking_id' | 'customer_id' | 'created_at'>>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Payment, 'id' | 'booking_id' | 'customer_id' | 'created_at'>>;
      };
      payouts: {
        Row: Payout;
        Insert: Omit<Payout, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Payout, 'id' | 'created_at'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Partial<Omit<Notification, 'id' | 'user_id' | 'created_at'>>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at'>;
        Update: Partial<Omit<Message, 'id' | 'sender_id' | 'receiver_id' | 'created_at'>>;
      };
      promo_codes: {
        Row: PromoCode;
        Insert: Omit<PromoCode, 'id' | 'usage_count' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PromoCode, 'id' | 'code' | 'created_at'>>;
      };
      favorites: {
        Row: Favorite;
        Insert: Omit<Favorite, 'id' | 'created_at'>;
        Update: never; // Favorites are insert/delete only
      };
    };
  };
}
