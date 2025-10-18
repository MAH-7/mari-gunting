export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      barber_onboarding: {
        Row: {
          approved_at: string | null
          availability: Json
          bank_account_name: string
          bank_account_number: string
          bank_name: string
          base_price: number
          bio: string
          certificate_urls: string[] | null
          created_at: string | null
          experience_years: number
          ic_back_url: string
          ic_front_url: string
          ic_number: string
          id: string
          metadata: Json | null
          portfolio_urls: string[] | null
          rejected_at: string | null
          reviewed_by: string | null
          selfie_url: string
          service_radius_km: number
          specializations: string[]
          status: string | null
          submitted_at: string | null
          updated_at: string | null
          user_id: string
          verification_notes: string | null
        }
        Insert: {
          approved_at?: string | null
          availability: Json
          bank_account_name: string
          bank_account_number: string
          bank_name: string
          base_price: number
          bio: string
          certificate_urls?: string[] | null
          created_at?: string | null
          experience_years: number
          ic_back_url: string
          ic_front_url: string
          ic_number: string
          id?: string
          metadata?: Json | null
          portfolio_urls?: string[] | null
          rejected_at?: string | null
          reviewed_by?: string | null
          selfie_url: string
          service_radius_km: number
          specializations?: string[]
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id: string
          verification_notes?: string | null
        }
        Update: {
          approved_at?: string | null
          availability?: Json
          bank_account_name?: string
          bank_account_number?: string
          bank_name?: string
          base_price?: number
          bio?: string
          certificate_urls?: string[] | null
          created_at?: string | null
          experience_years?: number
          ic_back_url?: string
          ic_front_url?: string
          ic_number?: string
          id?: string
          metadata?: Json | null
          portfolio_urls?: string[] | null
          rejected_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string
          service_radius_km?: number
          specializations?: string[]
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string
          verification_notes?: string | null
        }
        Relationships: []
      }
      barbers: {
        Row: {
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          base_price: number | null
          bio: string | null
          business_name: string | null
          completed_bookings: number | null
          created_at: string | null
          experience_years: number | null
          ic_number: string | null
          id: string
          is_available: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          last_radius_change_at: string | null
          portfolio_images: string[] | null
          rating: number | null
          service_radius_km: number | null
          specializations: string[] | null
          ssm_number: string | null
          stripe_account_id: string | null
          total_bookings: number | null
          total_reviews: number | null
          travel_fee_per_km: number | null
          updated_at: string | null
          user_id: string
          verification_documents: Json | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          working_hours: Json | null
        }
        Insert: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          base_price?: number | null
          bio?: string | null
          business_name?: string | null
          completed_bookings?: number | null
          created_at?: string | null
          experience_years?: number | null
          ic_number?: string | null
          id?: string
          is_available?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          last_radius_change_at?: string | null
          portfolio_images?: string[] | null
          rating?: number | null
          service_radius_km?: number | null
          specializations?: string[] | null
          ssm_number?: string | null
          stripe_account_id?: string | null
          total_bookings?: number | null
          total_reviews?: number | null
          travel_fee_per_km?: number | null
          updated_at?: string | null
          user_id: string
          verification_documents?: Json | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          working_hours?: Json | null
        }
        Update: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          base_price?: number | null
          bio?: string | null
          business_name?: string | null
          completed_bookings?: number | null
          created_at?: string | null
          experience_years?: number | null
          ic_number?: string | null
          id?: string
          is_available?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          last_radius_change_at?: string | null
          portfolio_images?: string[] | null
          rating?: number | null
          service_radius_km?: number | null
          specializations?: string[] | null
          ssm_number?: string | null
          stripe_account_id?: string | null
          total_bookings?: number | null
          total_reviews?: number | null
          travel_fee_per_km?: number | null
          updated_at?: string | null
          user_id?: string
          verification_documents?: Json | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "barbers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      barbershop_onboarding: {
        Row: {
          address: string
          amenities: string[] | null
          approved_at: string | null
          bank_account_name: string
          bank_account_number: string
          bank_name: string
          city: string | null
          cover_urls: string[]
          created_at: string | null
          description: string
          email: string
          id: string
          latitude: number | null
          license_url: string
          logo_url: string
          longitude: number | null
          metadata: Json | null
          name: string
          operating_hours: Json
          phone: string
          postcode: string | null
          rejected_at: string | null
          reviewed_by: string | null
          services: Json
          ssm_url: string
          staff: Json
          state: string | null
          status: string | null
          submitted_at: string | null
          updated_at: string | null
          user_id: string
          verification_notes: string | null
        }
        Insert: {
          address: string
          amenities?: string[] | null
          approved_at?: string | null
          bank_account_name: string
          bank_account_number: string
          bank_name: string
          city?: string | null
          cover_urls?: string[]
          created_at?: string | null
          description: string
          email: string
          id?: string
          latitude?: number | null
          license_url: string
          logo_url: string
          longitude?: number | null
          metadata?: Json | null
          name: string
          operating_hours: Json
          phone: string
          postcode?: string | null
          rejected_at?: string | null
          reviewed_by?: string | null
          services?: Json
          ssm_url: string
          staff?: Json
          state?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id: string
          verification_notes?: string | null
        }
        Update: {
          address?: string
          amenities?: string[] | null
          approved_at?: string | null
          bank_account_name?: string
          bank_account_number?: string
          bank_name?: string
          city?: string | null
          cover_urls?: string[]
          created_at?: string | null
          description?: string
          email?: string
          id?: string
          latitude?: number | null
          license_url?: string
          logo_url?: string
          longitude?: number | null
          metadata?: Json | null
          name?: string
          operating_hours?: Json
          phone?: string
          postcode?: string | null
          rejected_at?: string | null
          reviewed_by?: string | null
          services?: Json
          ssm_url?: string
          staff?: Json
          state?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string
          verification_notes?: string | null
        }
        Relationships: []
      }
      barbershops: {
        Row: {
          address_line1: string
          address_line2: string | null
          amenities: string[] | null
          city: string
          country: string | null
          cover_images: string[] | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          is_open_now: boolean | null
          is_verified: boolean | null
          location: unknown
          logo_url: string | null
          name: string
          opening_hours: Json | null
          owner_id: string
          payment_methods: string[] | null
          phone_number: string | null
          postal_code: string | null
          rating: number | null
          ssm_number: string | null
          state: string
          total_bookings: number | null
          total_reviews: number | null
          updated_at: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          website_url: string | null
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          amenities?: string[] | null
          city: string
          country?: string | null
          cover_images?: string[] | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_open_now?: boolean | null
          is_verified?: boolean | null
          location: unknown
          logo_url?: string | null
          name: string
          opening_hours?: Json | null
          owner_id: string
          payment_methods?: string[] | null
          phone_number?: string | null
          postal_code?: string | null
          rating?: number | null
          ssm_number?: string | null
          state: string
          total_bookings?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          website_url?: string | null
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          amenities?: string[] | null
          city?: string
          country?: string | null
          cover_images?: string[] | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_open_now?: boolean | null
          is_verified?: boolean | null
          location?: unknown
          logo_url?: string | null
          name?: string
          opening_hours?: Json | null
          owner_id?: string
          payment_methods?: string[] | null
          phone_number?: string | null
          postal_code?: string | null
          rating?: number | null
          ssm_number?: string | null
          state?: string
          total_bookings?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barbershops_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_vouchers: {
        Row: {
          applied_at: string | null
          booking_id: string
          customer_id: string
          discount_amount: number | null
          discount_applied: number
          discount_percent: number | null
          final_total: number
          id: string
          original_total: number
          user_voucher_id: string
          voucher_code: string
          voucher_title: string
        }
        Insert: {
          applied_at?: string | null
          booking_id: string
          customer_id: string
          discount_amount?: number | null
          discount_applied: number
          discount_percent?: number | null
          final_total: number
          id?: string
          original_total: number
          user_voucher_id: string
          voucher_code: string
          voucher_title: string
        }
        Update: {
          applied_at?: string | null
          booking_id?: string
          customer_id?: string
          discount_amount?: number | null
          discount_applied?: number
          discount_percent?: number | null
          final_total?: number
          id?: string
          original_total?: number
          user_voucher_id?: string
          voucher_code?: string
          voucher_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_vouchers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "active_tracking_sessions"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_vouchers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_vouchers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_vouchers_user_voucher_id_fkey"
            columns: ["user_voucher_id"]
            isOneToOne: false
            referencedRelation: "user_vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          accepted_at: string | null
          arrived_at: string | null
          barber_arrived_at: string | null
          barber_id: string | null
          barber_location_at_accept: unknown | null
          barber_location_at_complete: unknown | null
          barber_location_at_start: unknown | null
          barber_notes: string | null
          barbershop_id: string | null
          booking_number: string
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string | null
          current_distance_km: number | null
          current_eta_minutes: number | null
          customer_address: Json | null
          customer_address_text: string | null
          customer_id: string
          customer_location: unknown | null
          customer_location_accuracy: number | null
          customer_notes: string | null
          discount_amount: number | null
          distance_km: number | null
          estimated_arrival_time: string | null
          estimated_duration_minutes: number
          estimated_travel_time_minutes: number | null
          id: string
          on_the_way_at: string | null
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          rating: number | null
          scheduled_date: string
          scheduled_datetime: string
          scheduled_time: string
          service_fee: number | null
          service_type: string
          services: Json
          started_at: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          subtotal: number
          total_price: number
          tracking_last_updated_at: string | null
          tracking_started_at: string | null
          travel_fee: number | null
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          arrived_at?: string | null
          barber_arrived_at?: string | null
          barber_id?: string | null
          barber_location_at_accept?: unknown | null
          barber_location_at_complete?: unknown | null
          barber_location_at_start?: unknown | null
          barber_notes?: string | null
          barbershop_id?: string | null
          booking_number: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_distance_km?: number | null
          current_eta_minutes?: number | null
          customer_address?: Json | null
          customer_address_text?: string | null
          customer_id: string
          customer_location?: unknown | null
          customer_location_accuracy?: number | null
          customer_notes?: string | null
          discount_amount?: number | null
          distance_km?: number | null
          estimated_arrival_time?: string | null
          estimated_duration_minutes: number
          estimated_travel_time_minutes?: number | null
          id?: string
          on_the_way_at?: string | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          rating?: number | null
          scheduled_date: string
          scheduled_datetime: string
          scheduled_time: string
          service_fee?: number | null
          service_type: string
          services: Json
          started_at?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          subtotal: number
          total_price: number
          tracking_last_updated_at?: string | null
          tracking_started_at?: string | null
          travel_fee?: number | null
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          arrived_at?: string | null
          barber_arrived_at?: string | null
          barber_id?: string | null
          barber_location_at_accept?: unknown | null
          barber_location_at_complete?: unknown | null
          barber_location_at_start?: unknown | null
          barber_notes?: string | null
          barbershop_id?: string | null
          booking_number?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_distance_km?: number | null
          current_eta_minutes?: number | null
          customer_address?: Json | null
          customer_address_text?: string | null
          customer_id?: string
          customer_location?: unknown | null
          customer_location_accuracy?: number | null
          customer_notes?: string | null
          discount_amount?: number | null
          distance_km?: number | null
          estimated_arrival_time?: string | null
          estimated_duration_minutes?: number
          estimated_travel_time_minutes?: number | null
          id?: string
          on_the_way_at?: string | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          rating?: number | null
          scheduled_date?: string
          scheduled_datetime?: string
          scheduled_time?: string
          service_fee?: number | null
          service_type?: string
          services?: Json
          started_at?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          subtotal?: number
          total_price?: number
          tracking_last_updated_at?: string | null
          tracking_started_at?: string | null
          travel_fee?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          booking_id: string | null
          created_at: string | null
          description: string
          id: string
          metadata: Json | null
          source: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          booking_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          metadata?: Json | null
          source: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          booking_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          source?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "active_tracking_sessions"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "credit_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          address_type: string | null
          building_name: string | null
          city: string
          contact_number: string | null
          country: string | null
          created_at: string | null
          delivery_instructions: string | null
          floor: string | null
          gps_accuracy: number | null
          id: string
          is_default: boolean | null
          label: string
          landmark: string | null
          last_used_at: string | null
          latitude: string | null
          location: unknown | null
          location_updated_at: string | null
          longitude: string | null
          postal_code: string | null
          state: string
          unit_number: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          address_type?: string | null
          building_name?: string | null
          city: string
          contact_number?: string | null
          country?: string | null
          created_at?: string | null
          delivery_instructions?: string | null
          floor?: string | null
          gps_accuracy?: number | null
          id?: string
          is_default?: boolean | null
          label: string
          landmark?: string | null
          last_used_at?: string | null
          latitude?: string | null
          location?: unknown | null
          location_updated_at?: string | null
          longitude?: string | null
          postal_code?: string | null
          state: string
          unit_number?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          address_type?: string | null
          building_name?: string | null
          city?: string
          contact_number?: string | null
          country?: string | null
          created_at?: string | null
          delivery_instructions?: string | null
          floor?: string | null
          gps_accuracy?: number | null
          id?: string
          is_default?: boolean | null
          label?: string
          landmark?: string | null
          last_used_at?: string | null
          latitude?: string | null
          location?: unknown | null
          location_updated_at?: string | null
          longitude?: string | null
          postal_code?: string | null
          state?: string
          unit_number?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_credits: {
        Row: {
          balance: number
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          barber_id: string | null
          barbershop_id: string | null
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          barber_id?: string | null
          barbershop_id?: string | null
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          barber_id?: string | null
          barbershop_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          booking_id: string | null
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          is_read: boolean | null
          location_data: Json | null
          message_type: string | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          booking_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          location_data?: Json | null
          message_type?: string | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          booking_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          location_data?: Json | null
          message_type?: string | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "active_tracking_sessions"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_data: Json | null
          action_url: string | null
          body: string
          created_at: string | null
          id: string
          image_url: string | null
          is_read: boolean | null
          is_sent: boolean | null
          read_at: string | null
          sent_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          action_data?: Json | null
          action_url?: string | null
          body: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          is_sent?: boolean | null
          read_at?: string | null
          sent_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          action_data?: Json | null
          action_url?: string | null
          body?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          is_sent?: boolean | null
          read_at?: string | null
          sent_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_verification_logs: {
        Row: {
          action: string
          application_id: string
          application_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          notes: string | null
          reviewer_id: string | null
          status: string | null
        }
        Insert: {
          action: string
          application_id: string
          application_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          reviewer_id?: string | null
          status?: string | null
        }
        Update: {
          action?: string
          application_id?: string
          application_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          reviewer_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      otp_requests: {
        Row: {
          created_at: string | null
          id: string
          message_sid: string | null
          phone_number: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_sid?: string | null
          phone_number: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message_sid?: string | null
          phone_number?: string
          status?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          billplz_bill_id: string | null
          booking_id: string
          created_at: string | null
          currency: string | null
          customer_id: string
          id: string
          metadata: Json | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          receipt_url: string | null
          refund_amount: number | null
          refund_reason: string | null
          refunded_at: string | null
          stripe_payment_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          billplz_bill_id?: string | null
          booking_id: string
          created_at?: string | null
          currency?: string | null
          customer_id: string
          id?: string
          metadata?: Json | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          receipt_url?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          stripe_payment_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          billplz_bill_id?: string | null
          booking_id?: string
          created_at?: string | null
          currency?: string | null
          customer_id?: string
          id?: string
          metadata?: Json | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          receipt_url?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          stripe_payment_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "active_tracking_sessions"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          barber_id: string | null
          barbershop_id: string | null
          bookings_count: number | null
          created_at: string | null
          currency: string | null
          id: string
          paid_at: string | null
          period_end: string
          period_start: string
          platform_fee: number | null
          status: Database["public"]["Enums"]["payment_status"] | null
          stripe_payout_id: string | null
          stripe_transfer_id: string | null
          total_earnings: number | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          barber_id?: string | null
          barbershop_id?: string | null
          bookings_count?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          paid_at?: string | null
          period_end: string
          period_start: string
          platform_fee?: number | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          stripe_payout_id?: string | null
          stripe_transfer_id?: string | null
          total_earnings?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          barber_id?: string | null
          barbershop_id?: string | null
          bookings_count?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          paid_at?: string | null
          period_end?: string
          period_start?: string
          platform_fee?: number | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          stripe_payout_id?: string | null
          stripe_transfer_id?: string | null
          total_earnings?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      points_transactions: {
        Row: {
          admin_id: string | null
          admin_notes: string | null
          amount: number
          balance_after: number
          booking_id: string | null
          created_at: string | null
          description: string
          id: string
          type: string
          user_id: string
          user_voucher_id: string | null
          voucher_id: string | null
        }
        Insert: {
          admin_id?: string | null
          admin_notes?: string | null
          amount: number
          balance_after: number
          booking_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          type: string
          user_id: string
          user_voucher_id?: string | null
          voucher_id?: string | null
        }
        Update: {
          admin_id?: string | null
          admin_notes?: string | null
          amount?: number
          balance_after?: number
          booking_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          type?: string
          user_id?: string
          user_voucher_id?: string | null
          voucher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "points_transactions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "active_tracking_sessions"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "points_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_transactions_user_voucher_id_fkey"
            columns: ["user_voucher_id"]
            isOneToOne: false
            referencedRelation: "user_vouchers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_transactions_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          date_of_birth: string | null
          email: string | null
          email_verified: boolean | null
          email_verified_at: string | null
          fcm_token: string | null
          full_name: string
          gender: string | null
          id: string
          is_active: boolean | null
          is_online: boolean | null
          language: string | null
          last_seen_at: string | null
          location: unknown | null
          phone_number: string | null
          phone_verified: boolean | null
          phone_verified_at: string | null
          points_balance: number | null
          postal_code: string | null
          role: Database["public"]["Enums"]["user_role"]
          state: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          date_of_birth?: string | null
          email?: string | null
          email_verified?: boolean | null
          email_verified_at?: string | null
          fcm_token?: string | null
          full_name: string
          gender?: string | null
          id: string
          is_active?: boolean | null
          is_online?: boolean | null
          language?: string | null
          last_seen_at?: string | null
          location?: unknown | null
          phone_number?: string | null
          phone_verified?: boolean | null
          phone_verified_at?: string | null
          points_balance?: number | null
          postal_code?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          state?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          date_of_birth?: string | null
          email?: string | null
          email_verified?: boolean | null
          email_verified_at?: string | null
          fcm_token?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          is_online?: boolean | null
          language?: string | null
          last_seen_at?: string | null
          location?: unknown | null
          phone_number?: string | null
          phone_verified?: boolean | null
          phone_verified_at?: string | null
          points_balance?: number | null
          postal_code?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          state?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          applicable_to: string | null
          code: string
          created_at: string | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          min_order_amount: number | null
          per_user_limit: number | null
          updated_at: string | null
          usage_count: number | null
          usage_limit: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applicable_to?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_order_amount?: number | null
          per_user_limit?: number | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applicable_to?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_order_amount?: number | null
          per_user_limit?: number | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          barber_id: string | null
          barbershop_id: string | null
          booking_id: string
          comment: string | null
          created_at: string | null
          customer_id: string
          id: string
          images: string[] | null
          is_flagged: boolean | null
          is_verified: boolean | null
          is_visible: boolean | null
          rating: number
          response: string | null
          response_at: string | null
          updated_at: string | null
        }
        Insert: {
          barber_id?: string | null
          barbershop_id?: string | null
          booking_id: string
          comment?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          images?: string[] | null
          is_flagged?: boolean | null
          is_verified?: boolean | null
          is_visible?: boolean | null
          rating: number
          response?: string | null
          response_at?: string | null
          updated_at?: string | null
        }
        Update: {
          barber_id?: string | null
          barbershop_id?: string | null
          booking_id?: string
          comment?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          images?: string[] | null
          is_flagged?: boolean | null
          is_verified?: boolean | null
          is_visible?: boolean | null
          rating?: number
          response?: string | null
          response_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "active_tracking_sessions"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      route_cache: {
        Row: {
          created_at: string | null
          destination_lat: number
          destination_lng: number
          distance_km: number
          duration_minutes: number
          expires_at: string | null
          hit_count: number | null
          id: string
          last_used_at: string | null
          origin_lat: number
          origin_lng: number
          profile: string | null
          traffic_profile: string | null
        }
        Insert: {
          created_at?: string | null
          destination_lat: number
          destination_lng: number
          distance_km: number
          duration_minutes: number
          expires_at?: string | null
          hit_count?: number | null
          id?: string
          last_used_at?: string | null
          origin_lat: number
          origin_lng: number
          profile?: string | null
          traffic_profile?: string | null
        }
        Update: {
          created_at?: string | null
          destination_lat?: number
          destination_lng?: number
          distance_km?: number
          duration_minutes?: number
          expires_at?: string | null
          hit_count?: number | null
          id?: string
          last_used_at?: string | null
          origin_lat?: number
          origin_lng?: number
          profile?: string | null
          traffic_profile?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          barber_id: string | null
          barbershop_id: string | null
          category: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number
          id: string
          image_url: string | null
          is_active: boolean | null
          is_popular: boolean | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          barber_id?: string | null
          barbershop_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_popular?: boolean | null
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          barber_id?: string | null
          barbershop_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_popular?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      user_vouchers: {
        Row: {
          created_at: string | null
          id: string
          points_spent: number
          redeemed_at: string | null
          status: string
          updated_at: string | null
          used_at: string | null
          used_for_booking_id: string | null
          user_id: string
          voucher_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          points_spent: number
          redeemed_at?: string | null
          status?: string
          updated_at?: string | null
          used_at?: string | null
          used_for_booking_id?: string | null
          user_id: string
          voucher_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          points_spent?: number
          redeemed_at?: string | null
          status?: string
          updated_at?: string | null
          used_at?: string | null
          used_for_booking_id?: string | null
          user_id?: string
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_vouchers_used_for_booking_id_fkey"
            columns: ["used_for_booking_id"]
            isOneToOne: false
            referencedRelation: "active_tracking_sessions"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "user_vouchers_used_for_booking_id_fkey"
            columns: ["used_for_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_vouchers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_vouchers_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          applicable_services: string[] | null
          code: string
          created_at: string | null
          created_by: string | null
          current_redemptions: number | null
          description: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          max_discount: number | null
          max_per_user: number | null
          max_redemptions: number | null
          min_spend: number | null
          points_cost: number
          title: string
          type: string
          updated_at: string | null
          valid_from: string | null
          valid_until: string
          value: number
        }
        Insert: {
          applicable_services?: string[] | null
          code: string
          created_at?: string | null
          created_by?: string | null
          current_redemptions?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          max_discount?: number | null
          max_per_user?: number | null
          max_redemptions?: number | null
          min_spend?: number | null
          points_cost: number
          title: string
          type: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until: string
          value: number
        }
        Update: {
          applicable_services?: string[] | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          current_redemptions?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          max_discount?: number | null
          max_per_user?: number | null
          max_redemptions?: number | null
          min_spend?: number | null
          points_cost?: number
          title?: string
          type?: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_tracking_sessions: {
        Row: {
          barber_id: string | null
          barber_location: unknown | null
          barber_profile_updated_at: string | null
          booking_id: string | null
          current_distance_km: number | null
          current_eta_minutes: number | null
          customer_id: string | null
          estimated_arrival_time: string | null
          minutes_since_last_update: number | null
          status: Database["public"]["Enums"]["booking_status"] | null
          tracking_last_updated_at: string | null
          tracking_started_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown | null
          f_table_catalog: unknown | null
          f_table_name: unknown | null
          f_table_schema: unknown | null
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown | null
          f_table_catalog: string | null
          f_table_name: unknown | null
          f_table_schema: unknown | null
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown | null
          f_table_catalog?: string | null
          f_table_name?: unknown | null
          f_table_schema?: unknown | null
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown | null
          f_table_catalog?: string | null
          f_table_name?: unknown | null
          f_table_schema?: unknown | null
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      user_booking_stats: {
        Row: {
          avg_rating: number | null
          cancelled_bookings: number | null
          completed_bookings: number | null
          total_bookings: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _postgis_scripts_pgsql_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_bestsrid: {
        Args: { "": unknown }
        Returns: number
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_covers: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_pointoutside: {
        Args: { "": unknown }
        Returns: unknown
      }
      _st_sortablehash: {
        Args: { geom: unknown }
        Returns: number
      }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      add_customer_address: {
        Args: {
          p_address_line1: string
          p_address_line2?: string
          p_city: string
          p_is_default?: boolean
          p_label: string
          p_latitude?: number
          p_longitude?: number
          p_postal_code?: string
          p_state: string
          p_user_id: string
        }
        Returns: {
          address_id: string
          message: string
        }[]
      }
      add_customer_credit: {
        Args: {
          p_amount: number
          p_booking_id?: string
          p_description: string
          p_metadata?: Json
          p_source: string
          p_user_id: string
        }
        Returns: {
          new_balance: number
          success: boolean
          transaction_id: string
        }[]
      }
      addauth: {
        Args: { "": string }
        Returns: boolean
      }
      addgeometrycolumn: {
        Args:
          | {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
          | {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
          | {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
        Returns: string
      }
      apply_voucher_to_booking: {
        Args: {
          p_booking_id: string
          p_discount_applied: number
          p_final_total: number
          p_original_total: number
          p_user_voucher_id: string
        }
        Returns: Json
      }
      approve_barber_application: {
        Args: { application_id: string }
        Returns: undefined
      }
      award_points: {
        Args: {
          p_amount: number
          p_metadata?: Json
          p_type: string
          p_user_id: string
        }
        Returns: Json
      }
      box: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box2d: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box2d_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2d_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2df_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2df_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3d: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box3d_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3d_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3dtobox: {
        Args: { "": unknown }
        Returns: unknown
      }
      bytea: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      cache_route: {
        Args: {
          p_cache_duration_days?: number
          p_destination_lat: number
          p_destination_lng: number
          p_distance_km: number
          p_duration_minutes: number
          p_origin_lat: number
          p_origin_lng: number
          p_profile?: string
        }
        Returns: string
      }
      cancel_booking: {
        Args: {
          p_booking_id: string
          p_cancellation_reason: string
          p_customer_id: string
        }
        Returns: {
          message: string
          refund_eligible: boolean
          success: boolean
        }[]
      }
      check_radius_cooldown: {
        Args: { barber_id: string }
        Returns: {
          can_change: boolean
          hours_remaining: number
          last_changed_at: string
        }[]
      }
      cleanup_expired_route_cache: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_otp_requests: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_booking: {
        Args:
          | {
              p_barber_id: string
              p_barbershop_id: string
              p_customer_address: Json
              p_customer_id: string
              p_customer_notes: string
              p_discount_amount: number
              p_payment_method: string
              p_scheduled_date: string
              p_scheduled_time: string
              p_service_type: string
              p_services: Json
              p_travel_fee: number
            }
          | {
              p_barber_id: string
              p_barbershop_id?: string
              p_customer_address?: Json
              p_customer_id: string
              p_customer_notes?: string
              p_payment_method?: string
              p_scheduled_date: string
              p_scheduled_time: string
              p_service_type: string
              p_services: Json
            }
          | {
              p_barber_id: string
              p_barbershop_id?: string
              p_customer_address?: Json
              p_customer_id: string
              p_customer_notes?: string
              p_payment_method?: string
              p_scheduled_date: string
              p_scheduled_time: string
              p_service_type: string
              p_services: Json
              p_travel_fee?: number
            }
        Returns: {
          booking_id: string
          booking_number: string
          message: string
          total_price: number
        }[]
      }
      deduct_customer_credit: {
        Args: {
          p_amount: number
          p_booking_id?: string
          p_description: string
          p_metadata?: Json
          p_source: string
          p_user_id: string
        }
        Returns: {
          error_message: string
          new_balance: number
          success: boolean
          transaction_id: string
        }[]
      }
      delete_customer_address_direct: {
        Args: { p_address_id: string; p_customer_id: string }
        Returns: boolean
      }
      disablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      dropgeometrycolumn: {
        Args:
          | {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
          | { column_name: string; schema_name: string; table_name: string }
          | { column_name: string; table_name: string }
        Returns: string
      }
      dropgeometrytable: {
        Args:
          | { catalog_name: string; schema_name: string; table_name: string }
          | { schema_name: string; table_name: string }
          | { table_name: string }
        Returns: string
      }
      enablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      generate_booking_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      geography: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      geography_analyze: {
        Args: { "": unknown }
        Returns: boolean
      }
      geography_gist_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_gist_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_send: {
        Args: { "": unknown }
        Returns: string
      }
      geography_spgist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      geography_typmod_out: {
        Args: { "": number }
        Returns: unknown
      }
      geometry: {
        Args:
          | { "": string }
          | { "": string }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
        Returns: unknown
      }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_analyze: {
        Args: { "": unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gist_compress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_decompress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_decompress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_sortsupport_2d: {
        Args: { "": unknown }
        Returns: undefined
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_hash: {
        Args: { "": unknown }
        Returns: number
      }
      geometry_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_recv: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_send: {
        Args: { "": unknown }
        Returns: string
      }
      geometry_sortsupport: {
        Args: { "": unknown }
        Returns: undefined
      }
      geometry_spgist_compress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_spgist_compress_3d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_spgist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      geometry_typmod_out: {
        Args: { "": number }
        Returns: unknown
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometrytype: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      geomfromewkb: {
        Args: { "": string }
        Returns: unknown
      }
      geomfromewkt: {
        Args: { "": string }
        Returns: unknown
      }
      get_barber_reviews: {
        Args: { p_barber_id: string; p_limit?: number; p_offset?: number }
        Returns: {
          comment: string
          created_at: string
          customer_avatar: string
          customer_name: string
          id: string
          images: string[]
          is_verified: boolean
          rating: number
          response: string
          response_at: string
          services: Json
        }[]
      }
      get_barbershop_reviews: {
        Args: { p_barbershop_id: string; p_limit?: number; p_offset?: number }
        Returns: {
          comment: string
          created_at: string
          customer_avatar: string
          customer_name: string
          id: string
          images: string[]
          is_verified: boolean
          rating: number
          response: string
          response_at: string
          services: Json
        }[]
      }
      get_cached_route: {
        Args: {
          p_destination_lat: number
          p_destination_lng: number
          p_origin_lat: number
          p_origin_lng: number
          p_profile?: string
        }
        Returns: {
          cache_age_hours: number
          distance_km: number
          duration_minutes: number
          is_cached: boolean
        }[]
      }
      get_customer_addresses: {
        Args: { p_user_id: string }
        Returns: {
          address_line1: string
          address_line2: string
          city: string
          created_at: string
          id: string
          is_default: boolean
          label: string
          latitude: number
          longitude: number
          postal_code: string
          state: string
        }[]
      }
      get_customer_bookings: {
        Args: {
          p_customer_id: string
          p_limit?: number
          p_offset?: number
          p_status?: string
        }
        Returns: {
          barber_avatar: string
          barber_completed_jobs: number
          barber_id: string
          barber_is_verified: boolean
          barber_name: string
          barber_notes: string
          barber_rating: number
          barber_total_reviews: number
          barbershop_name: string
          booking_number: string
          created_at: string
          customer_address: Json
          customer_notes: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          review_id: string
          scheduled_date: string
          scheduled_datetime: string
          scheduled_time: string
          service_fee: number
          service_type: string
          services: Json
          status: Database["public"]["Enums"]["booking_status"]
          subtotal: number
          total_price: number
          travel_fee: number
          updated_at: string
        }[]
      }
      get_nearby_barbers: {
        Args: {
          buffer_multiplier?: number
          customer_lat: number
          customer_lng: number
          radius_km: number
        }
        Returns: {
          avatar_url: string
          average_rating: number
          base_price: number
          bio: string
          completed_bookings: number
          created_at: string
          email: string
          experience_years: number
          id: string
          is_available: boolean
          is_online: boolean
          location_lat: number
          location_lng: number
          name: string
          phone_number: string
          portfolio_urls: string[]
          service_radius_km: number
          specializations: string[]
          straight_line_distance_km: number
          total_bookings: number
          total_reviews: number
          user_id: string
        }[]
      }
      get_or_create_customer_credits: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_proj4_from_srid: {
        Args: { "": number }
        Returns: string
      }
      get_review_stats: {
        Args: { p_barber_id?: string; p_barbershop_id?: string }
        Returns: {
          average_rating: number
          rating_1_count: number
          rating_2_count: number
          rating_3_count: number
          rating_4_count: number
          rating_5_count: number
          total_reviews: number
        }[]
      }
      gettransactionid: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      gidx_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gidx_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_barber: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      json: {
        Args: { "": unknown }
        Returns: Json
      }
      jsonb: {
        Args: { "": unknown }
        Returns: Json
      }
      longtransactionsenabled: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      owns_barbershop: {
        Args: { shop_id: string }
        Returns: boolean
      }
      path: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_asflatgeobuf_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asgeobuf_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asmvt_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asmvt_serialfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_geometry_clusterintersecting_finalfn: {
        Args: { "": unknown }
        Returns: unknown[]
      }
      pgis_geometry_clusterwithin_finalfn: {
        Args: { "": unknown }
        Returns: unknown[]
      }
      pgis_geometry_collect_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_makeline_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_polygonize_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_union_parallel_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_union_parallel_serialfn: {
        Args: { "": unknown }
        Returns: string
      }
      point: {
        Args: { "": unknown }
        Returns: unknown
      }
      polygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      populate_geometry_columns: {
        Args:
          | { tbl_oid: unknown; use_typmod?: boolean }
          | { use_typmod?: boolean }
        Returns: string
      }
      postgis_addbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_dropbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_extensions_upgrade: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_full_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_geos_noop: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_geos_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_getbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_hasbbox: {
        Args: { "": unknown }
        Returns: boolean
      }
      postgis_index_supportfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_lib_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_lib_revision: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_lib_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libjson_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_liblwgeom_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libprotobuf_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libxml_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_noop: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_proj_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_installed: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_released: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_svn_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_typmod_dims: {
        Args: { "": number }
        Returns: number
      }
      postgis_typmod_srid: {
        Args: { "": number }
        Returns: number
      }
      postgis_typmod_type: {
        Args: { "": number }
        Returns: string
      }
      postgis_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_wagyu_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      redeem_voucher: {
        Args: { p_user_id: string; p_voucher_id: string }
        Returns: string
      }
      respond_to_review: {
        Args: {
          p_barber_user_id: string
          p_response: string
          p_review_id: string
        }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      round_coordinate: {
        Args: { coord: number; decimals?: number }
        Returns: number
      }
      set_default_customer_address: {
        Args: { p_address_id: string; p_customer_id: string }
        Returns: boolean
      }
      setup_barbershop_owner: {
        Args: { p_shop_name?: string; p_user_id: string }
        Returns: Json
      }
      setup_freelance_barber: {
        Args: { p_user_id: string }
        Returns: Json
      }
      spheroid_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      spheroid_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlength: {
        Args: { "": unknown }
        Returns: number
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dperimeter: {
        Args: { "": unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle: {
        Args:
          | { line1: unknown; line2: unknown }
          | { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
        Returns: number
      }
      st_area: {
        Args:
          | { "": string }
          | { "": unknown }
          | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_area2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_asbinary: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_asewkt: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_asgeojson: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; options?: number }
          | { geom: unknown; maxdecimaldigits?: number; options?: number }
          | {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
        Returns: string
      }
      st_asgml: {
        Args:
          | { "": string }
          | {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
          | {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
          | {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
          | { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_ashexewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_askml: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
          | { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
        Returns: string
      }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: {
        Args: { format?: string; geom: unknown }
        Returns: string
      }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; rel?: number }
          | { geom: unknown; maxdecimaldigits?: number; rel?: number }
        Returns: string
      }
      st_astext: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_astwkb: {
        Args:
          | {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
          | {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
        Returns: string
      }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_boundary: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer: {
        Args:
          | { geom: unknown; options?: string; radius: number }
          | { geom: unknown; quadsegs: number; radius: number }
        Returns: unknown
      }
      st_buildarea: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_centroid: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      st_cleangeometry: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_clusterintersecting: {
        Args: { "": unknown[] }
        Returns: unknown[]
      }
      st_collect: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collectionextract: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_collectionhomogenize: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_convexhull: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_coorddim: {
        Args: { geometry: unknown }
        Returns: number
      }
      st_coveredby: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_covers: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_dimension: {
        Args: { "": unknown }
        Returns: number
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance: {
        Args:
          | { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
          | { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_distancesphere: {
        Args:
          | { geom1: unknown; geom2: unknown }
          | { geom1: unknown; geom2: unknown; radius: number }
        Returns: number
      }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dump: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumppoints: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumprings: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumpsegments: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_endpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_envelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_expand: {
        Args:
          | { box: unknown; dx: number; dy: number }
          | { box: unknown; dx: number; dy: number; dz?: number }
          | { dm?: number; dx: number; dy: number; dz?: number; geom: unknown }
        Returns: unknown
      }
      st_exteriorring: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_flipcoordinates: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_force2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_force3d: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_forcecollection: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcecurve: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcepolygonccw: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcepolygoncw: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcerhr: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcesfs: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_generatepoints: {
        Args:
          | { area: unknown; npoints: number }
          | { area: unknown; npoints: number; seed: number }
        Returns: unknown
      }
      st_geogfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geogfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geographyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geohash: {
        Args:
          | { geog: unknown; maxchars?: number }
          | { geom: unknown; maxchars?: number }
        Returns: string
      }
      st_geomcollfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomcollfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geometrytype: {
        Args: { "": unknown }
        Returns: string
      }
      st_geomfromewkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromewkt: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromgeojson: {
        Args: { "": Json } | { "": Json } | { "": string }
        Returns: unknown
      }
      st_geomfromgml: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromkml: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfrommarc21: {
        Args: { marc21xml: string }
        Returns: unknown
      }
      st_geomfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromtwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_gmltosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_hasarc: {
        Args: { geometry: unknown }
        Returns: boolean
      }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_isclosed: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_iscollection: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isempty: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_ispolygonccw: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_ispolygoncw: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isring: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_issimple: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isvalid: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
      }
      st_isvalidreason: {
        Args: { "": unknown }
        Returns: string
      }
      st_isvalidtrajectory: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_length: {
        Args:
          | { "": string }
          | { "": unknown }
          | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_length2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_letters: {
        Args: { font?: Json; letters: string }
        Returns: unknown
      }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefrommultipoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_linefromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_linefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linemerge: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_linestringfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_linetocurve: {
        Args: { geometry: unknown }
        Returns: unknown
      }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_m: {
        Args: { "": unknown }
        Returns: number
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makepolygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { "": unknown } | { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_maximuminscribedcircle: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_memsize: {
        Args: { "": unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_minimumboundingradius: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_minimumclearance: {
        Args: { "": unknown }
        Returns: number
      }
      st_minimumclearanceline: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_mlinefromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mlinefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpolyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpolyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multi: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_multilinefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multilinestringfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipolyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipolygonfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_ndims: {
        Args: { "": unknown }
        Returns: number
      }
      st_node: {
        Args: { g: unknown }
        Returns: unknown
      }
      st_normalize: {
        Args: { geom: unknown }
        Returns: unknown
      }
      st_npoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_nrings: {
        Args: { "": unknown }
        Returns: number
      }
      st_numgeometries: {
        Args: { "": unknown }
        Returns: number
      }
      st_numinteriorring: {
        Args: { "": unknown }
        Returns: number
      }
      st_numinteriorrings: {
        Args: { "": unknown }
        Returns: number
      }
      st_numpatches: {
        Args: { "": unknown }
        Returns: number
      }
      st_numpoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_orientedenvelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { "": unknown } | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_perimeter2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_pointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_pointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointonsurface: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_points: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_polyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonize: {
        Args: { "": unknown[] }
        Returns: unknown
      }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: string
      }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_reverse: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid: {
        Args: { geog: unknown; srid: number } | { geom: unknown; srid: number }
        Returns: unknown
      }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shiftlongitude: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid: {
        Args: { geog: unknown } | { geom: unknown }
        Returns: number
      }
      st_startpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_summary: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_transform: {
        Args:
          | { from_proj: string; geom: unknown; to_proj: string }
          | { from_proj: string; geom: unknown; to_srid: number }
          | { geom: unknown; to_proj: string }
        Returns: unknown
      }
      st_triangulatepolygon: {
        Args: { g1: unknown }
        Returns: unknown
      }
      st_union: {
        Args:
          | { "": unknown[] }
          | { geom1: unknown; geom2: unknown }
          | { geom1: unknown; geom2: unknown; gridsize: number }
        Returns: unknown
      }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_wkbtosql: {
        Args: { wkb: string }
        Returns: unknown
      }
      st_wkttosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      st_x: {
        Args: { "": unknown }
        Returns: number
      }
      st_xmax: {
        Args: { "": unknown }
        Returns: number
      }
      st_xmin: {
        Args: { "": unknown }
        Returns: number
      }
      st_y: {
        Args: { "": unknown }
        Returns: number
      }
      st_ymax: {
        Args: { "": unknown }
        Returns: number
      }
      st_ymin: {
        Args: { "": unknown }
        Returns: number
      }
      st_z: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmax: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmflag: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmin: {
        Args: { "": unknown }
        Returns: number
      }
      submit_review: {
        Args: {
          p_booking_id: string
          p_comment?: string
          p_customer_id: string
          p_images?: string[]
          p_rating: number
        }
        Returns: {
          message: string
          review_id: string
          success: boolean
        }[]
      }
      text: {
        Args: { "": unknown }
        Returns: string
      }
      toggle_online_status: {
        Args: { account_type?: string; new_status: boolean; p_user_id: string }
        Returns: {
          is_online: boolean
          last_seen_at: string
          message: string
          success: boolean
        }[]
      }
      unlockrows: {
        Args: { "": string }
        Returns: number
      }
      update_booking_status: {
        Args: {
          p_booking_id: string
          p_new_status: Database["public"]["Enums"]["booking_status"]
          p_notes?: string
          p_updated_by?: string
        }
        Returns: {
          message: string
          success: boolean
          updated_at: string
        }[]
      }
      update_customer_address: {
        Args: {
          p_address_id: string
          p_address_line1?: string
          p_address_line2?: string
          p_address_type?: string
          p_building_name?: string
          p_city?: string
          p_contact_number?: string
          p_delivery_instructions?: string
          p_floor?: string
          p_is_default?: boolean
          p_label?: string
          p_landmark?: string
          p_latitude?: number
          p_longitude?: number
          p_postal_code?: string
          p_state?: string
          p_unit_number?: string
        }
        Returns: {
          address_line1: string
          address_line2: string | null
          address_type: string | null
          building_name: string | null
          city: string
          contact_number: string | null
          country: string | null
          created_at: string | null
          delivery_instructions: string | null
          floor: string | null
          gps_accuracy: number | null
          id: string
          is_default: boolean | null
          label: string
          landmark: string | null
          last_used_at: string | null
          latitude: string | null
          location: unknown | null
          location_updated_at: string | null
          longitude: string | null
          postal_code: string | null
          state: string
          unit_number: string | null
          updated_at: string | null
          user_id: string
        }
      }
      update_customer_address_direct: {
        Args: {
          p_address_id: string
          p_address_line1: string
          p_address_line2: string
          p_city: string
          p_customer_id: string
          p_is_default: boolean
          p_label: string
          p_latitude: number
          p_longitude: number
          p_postal_code: string
          p_state: string
        }
        Returns: {
          address_line1: string
          address_line2: string | null
          address_type: string | null
          building_name: string | null
          city: string
          contact_number: string | null
          country: string | null
          created_at: string | null
          delivery_instructions: string | null
          floor: string | null
          gps_accuracy: number | null
          id: string
          is_default: boolean | null
          label: string
          landmark: string | null
          last_used_at: string | null
          latitude: string | null
          location: unknown | null
          location_updated_at: string | null
          longitude: string | null
          postal_code: string | null
          state: string
          unit_number: string | null
          updated_at: string | null
          user_id: string
        }
      }
      update_service_radius: {
        Args: { barber_id: string; new_radius: number }
        Returns: {
          last_radius_change_at: string
          service_radius_km: number
          success: boolean
        }[]
      }
      update_tracking_metrics: {
        Args: {
          p_booking_id: string
          p_distance_km: number
          p_eta_minutes: number
        }
        Returns: undefined
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      use_voucher: {
        Args: { p_booking_id: string; p_user_voucher_id: string }
        Returns: boolean
      }
    }
    Enums: {
      booking_status:
        | "pending"
        | "accepted"
        | "on_the_way"
        | "arrived"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "rejected"
        | "no_show"
      notification_type:
        | "booking"
        | "payment"
        | "review"
        | "promotion"
        | "system"
        | "chat"
      payment_method:
        | "cash"
        | "card"
        | "fpx"
        | "ewallet_tng"
        | "ewallet_grab"
        | "ewallet_boost"
        | "ewallet_shopee"
      payment_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "refunded"
        | "cancelled"
      user_role: "customer" | "barber" | "barbershop_owner" | "admin"
      verification_status: "unverified" | "pending" | "verified" | "rejected"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown | null
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      booking_status: [
        "pending",
        "accepted",
        "on_the_way",
        "arrived",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "rejected",
        "no_show",
      ],
      notification_type: [
        "booking",
        "payment",
        "review",
        "promotion",
        "system",
        "chat",
      ],
      payment_method: [
        "cash",
        "card",
        "fpx",
        "ewallet_tng",
        "ewallet_grab",
        "ewallet_boost",
        "ewallet_shopee",
      ],
      payment_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
        "cancelled",
      ],
      user_role: ["customer", "barber", "barbershop_owner", "admin"],
      verification_status: ["unverified", "pending", "verified", "rejected"],
    },
  },
} as const
