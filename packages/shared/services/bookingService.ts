/**
 * Booking Service - Real Supabase Integration
 * Replaces mock data with actual database RPC calls
 */

import { supabase } from '../config/supabase';
import { Booking, ApiResponse } from '../types';

export interface CreateBookingParams {
  customerId: string;
  barberId: string;
  services: Array<{
    name: string;
    price: number;
    duration: number;
  }>;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM
  serviceType: 'home_service' | 'walk_in';
  barbershopId?: string | null;
  customerAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode?: string;
  } | null;
  customerNotes?: string | null;
  paymentMethod?: string;
  travelFee?: number | null;
  discountAmount?: number | null; // NEW: For voucher/promo discounts
}

export interface BookingResult {
  booking_id: string;
  booking_number: string;
  total_price: number;
  message: string;
}

export const bookingService = {
  /**
   * Create a new booking
   */
  async createBooking(params: CreateBookingParams): Promise<ApiResponse<BookingResult>> {
    try {
      const { data, error } = await supabase.rpc('create_booking', {
        p_customer_id: params.customerId,
        p_barber_id: params.barberId,
        p_services: params.services,
        p_scheduled_date: params.scheduledDate,
        p_scheduled_time: params.scheduledTime,
        p_service_type: params.serviceType,
        p_barbershop_id: params.barbershopId || null,
        p_customer_address: params.customerAddress || null,
        p_customer_notes: params.customerNotes || null,
        p_payment_method: params.paymentMethod || 'cash',
        p_travel_fee: params.travelFee || null,
        p_discount_amount: params.discountAmount || null,
      });

      if (error) {
        console.error('❌ Create booking error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      // RPC returns array with single row
      const result = Array.isArray(data) ? data[0] : data;

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('❌ Create booking exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to create booking',
      };
    }
  },

  /**
   * Get customer bookings
   */
  async getCustomerBookings(
    customerId: string,
    status?: string | null,
    limit: number = 50,
    offset: number = 0
  ): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase.rpc('get_customer_bookings', {
        p_customer_id: customerId,
        p_status: status || null,
        p_limit: limit,
        p_offset: offset,
      });

      if (error) {
        console.error('❌ Get bookings error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log(`✅ Fetched ${data?.length || 0} bookings for customer`);

      return {
        success: true,
        data: data || [],
      };
    } catch (error: any) {
      console.error('❌ Get bookings exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch bookings',
      };
    }
  },

  /**
   * Update booking status
   */
  async updateBookingStatus(
    bookingId: string,
    newStatus: string,
    notes?: string
  ): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase.rpc('update_booking_status', {
        p_booking_id: bookingId,
        p_new_status: newStatus,
        p_notes: notes || null,
      });

      if (error) {
        console.error('❌ Update status error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      const result = Array.isArray(data) ? data[0] : data;

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('❌ Update status exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to update booking status',
      };
    }
  },

  /**
   * Cancel booking
   */
  async cancelBooking(
    bookingId: string,
    customerId: string,
    reason: string
  ): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase.rpc('cancel_booking', {
        p_booking_id: bookingId,
        p_customer_id: customerId,
        p_cancellation_reason: reason,
      });

      if (error) {
        console.error('❌ Cancel booking error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      const result = Array.isArray(data) ? data[0] : data;

      console.log('✅ Booking cancelled:', result);

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('❌ Cancel booking exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to cancel booking',
      };
    }
  },

  /**
   * Get barber bookings (for partner app)
   */
  async getBarberBookings(
    barberId: string,
    status?: string | null,
    limit: number = 50
  ): Promise<ApiResponse<any[]>> {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          customer:profiles!bookings_customer_id_fkey(
            id,
            full_name,
            avatar_url,
            phone_number
          ),
          barbershop:barbershops(
            id,
            name,
            address_line1,
            city
          )
        `)
        .eq('barber_id', barberId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Get barber bookings error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log(`✅ Fetched ${data?.length || 0} bookings for barber`);

      // Transform data to match frontend expectations (camelCase)
      const transformedData = (data || []).map((booking: any) => {
        // Transform customer data
        if (booking.customer && Array.isArray(booking.customer) && booking.customer.length > 0) {
          const customerData = booking.customer[0];
          booking.customer = {
            id: customerData.id,
            name: customerData.full_name,
            avatar: customerData.avatar_url,
            phone: customerData.phone_number,
          };
        }

        // Transform booking fields to camelCase
        booking.scheduledDate = booking.scheduled_date;
        booking.scheduledTime = booking.scheduled_time;
        booking.totalPrice = booking.total_price;
        booking.travelCost = booking.travel_fee;
        booking.duration = booking.estimated_duration_minutes;
        booking.createdAt = booking.created_at;
        booking.updatedAt = booking.updated_at;
        booking.completedAt = booking.completed_at;

        // Transform address from JSON to object with fullAddress
        if (booking.customer_address) {
          const addr = booking.customer_address;
          booking.address = {
            fullAddress: [
              addr.line1,
              addr.line2,
              addr.city,
              addr.state,
              addr.postalCode
            ].filter(Boolean).join(', '),
            ...addr
          };
        }

        return booking;
      });

      return {
        success: true,
        data: transformedData,
      };
    } catch (error: any) {
      console.error('❌ Get barber bookings exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch barber bookings',
      };
    }
  },

  /**
   * Confirm cash payment received (for barbers)
   * NOTE: With the new trigger, payment_status is auto-updated to 'completed' when booking completes
   * This function is kept for backwards compatibility but is mostly a no-op now
   */
  async confirmCashPayment(
    bookingId: string,
    barberId: string
  ): Promise<ApiResponse<any>> {
    try {
      // Check current booking status first
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('payment_status, status')
        .eq('id', bookingId)
        .eq('barber_id', barberId)
        .single();

      if (fetchError) {
        console.error('❌ Fetch booking error:', fetchError);
        return {
          success: false,
          error: fetchError.message,
        };
      }

      // If already completed, return success (trigger already handled it)
      if (booking.payment_status === 'completed') {
        console.log('✅ Payment already marked as completed (by trigger)');
        return {
          success: true,
          data: booking,
        };
      }

      // Otherwise, manually update (fallback for edge cases)
      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          payment_status: 'completed',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .eq('barber_id', barberId)
        .eq('payment_method', 'cash')
        .select()
        .single();

      if (error) {
        console.error('❌ Confirm cash payment error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log('✅ Cash payment confirmed manually');

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('❌ Confirm cash payment exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to confirm cash payment',
      };
    }
  },

  /**
   * Get booking by ID (direct table query)
   */
  async getBookingById(bookingId: string): Promise<ApiResponse<any>> {
    try {
      console.log('🔍 Fetching booking by ID:', bookingId);
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          barber:barbers(
            id,
            business_name,
            rating,
            completed_bookings,
            total_reviews,
            is_verified,
            barber_profile:profiles!barbers_user_id_fkey(
              full_name,
              avatar_url,
              phone_number
            )
          ),
          barbershop:barbershops(
            id,
            name,
            phone_number,
            address_line1,
            city
          ),
          review:reviews(
            id,
            rating,
            comment
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error) {
        console.error('❌ Get booking by ID error:', { bookingId, error, code: error.code, details: error.details, hint: error.hint });
        return {
          success: false,
          error: error.message,
        };
      }
      
      console.log('✅ Booking fetched successfully:', data?.id);

      // Transform barber data structure for frontend
      if (data && data.barber && data.barber.barber_profile) {
        data.barber = {
          id: data.barber.id,
          name: data.barber.barber_profile.full_name,
          avatar: data.barber.barber_profile.avatar_url,
          phone: data.barber.barber_profile.phone_number,
          businessName: data.barber.business_name,
          rating: data.barber.rating || 0,
          completedJobs: data.barber.completed_bookings || 0,
          totalReviews: data.barber.total_reviews || 0,
          isVerified: data.barber.is_verified || false,
        };
      }

      // Transform booking fields to camelCase for frontend
      if (data) {
        data.scheduledDate = data.scheduled_date;
        data.scheduledTime = data.scheduled_time;
        data.duration = data.estimated_duration_minutes;
        
        // Transform address from JSON to object with fullAddress
        if (data.customer_address) {
          const addr = data.customer_address;
          data.address = {
            fullAddress: [
              addr.line1,
              addr.line2,
              addr.city,
              addr.state,
              addr.postalCode
            ].filter(Boolean).join(', '),
            ...addr
          };
        }
        
        // Handle review - Supabase returns array, get first item
        if (data.review && Array.isArray(data.review)) {
          data.review = data.review.length > 0 ? data.review[0] : null;
        }
      }

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('❌ Get booking by ID exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch booking',
      };
    }
  },
};
