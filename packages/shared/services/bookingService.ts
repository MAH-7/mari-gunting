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
   * Get booking by ID (direct table query)
   */
  async getBookingById(bookingId: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          barber:barbers(
            id,
            business_name,
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
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error) {
        console.error('❌ Get booking by ID error:', error);
        return {
          success: false,
          error: error.message,
        };
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
