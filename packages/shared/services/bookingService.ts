/**
 * Booking Service - Real Supabase Integration
 * Replaces mock data with actual database RPC calls
 */

import { supabase } from '../config/supabase';
import { Booking, ApiResponse } from '../types';
import { createScheduledDateTime } from '../utils/format';

export interface CreateBookingParams {
  customerId: string;
  barberId: string;
  services: Array<{
    name: string;
    price: number;
    duration: number;
  }>;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM (will be converted to ISO timestamp)
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
  distanceKm?: number | null;
  discountAmount?: number | null; // NEW: For voucher/promo discounts
  curlecPaymentId?: string | null; // Curlec payment ID
  curlecOrderId?: string | null; // Curlec order ID
}

// SECURE V2: Service IDs only, server calculates everything
export interface CreateBookingV2Params {
  customerId: string;
  barberId: string;
  serviceIds: string[]; // SECURITY: Only IDs, not prices
  scheduledDate: string;
  scheduledTime: string;
  serviceType: 'home_service' | 'walk_in';
  barbershopId?: string | null;
  customerAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode?: string;
    lat?: number;  // For travel fee calculation
    lng?: number;
  } | null;
  customerNotes?: string | null;
  paymentMethod?: string;
  userVoucherId?: string | null; // Voucher applied (server validates)
  curlecPaymentId?: string | null;
  curlecOrderId?: string | null;
  distanceKm?: number | null; // NEW: Pre-calculated Mapbox distance from client
}

export interface BookingResult {
  booking_id: string;
  booking_number: string;
  total_price: number;
  message: string;
}

// V2 Result with breakdown
export interface BookingResultV2 {
  booking_id: string;
  booking_number: string;
  subtotal: number;
  service_fee: number;
  travel_fee: number;
  discount_amount: number;
  total_price: number;
  message: string;
}

export const bookingService = {
  /**
   * Link payment to existing booking (booking-first flow)
   */
  async linkPaymentToBooking(
    bookingId: string,
    customerId: string,
    paymentId: string,
    orderId: string
  ): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase.rpc('link_payment_to_booking', {
        p_booking_id: bookingId,
        p_customer_id: customerId,
        p_curlec_payment_id: paymentId,
        p_curlec_order_id: orderId,
      });

      if (error) {
        console.error('❌ Link payment error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      const result = Array.isArray(data) ? data[0] : data;
      console.log('✅ Payment linked to booking:', result);

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('❌ Link payment exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to link payment to booking',
      };
    }
  },
  /**
   * SECURE: Verify payment amount matches booking total
   * Call this BEFORE linking Curlec payment to booking
   */
  async verifyPaymentAmount(
    bookingId: string,
    paymentAmount: number
  ): Promise<ApiResponse<{valid: boolean; message: string; difference?: number}>> {
    try {
      const { data, error } = await supabase.rpc('verify_payment_amount', {
        p_booking_id: bookingId,
        p_payment_amount: paymentAmount,
      });

      if (error) {
        console.error('❌ Payment verification error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      const result = Array.isArray(data) ? data[0] : data;
      
      if (!result.valid) {
        console.error('❌ Payment amount mismatch:', result);
      } else {
        console.log('✅ Payment amount verified:', result);
      }

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('❌ Payment verification exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to verify payment amount',
      };
    }
  },

  /**
   * SECURE V2: Create booking with service IDs only
   * Server validates prices, calculates travel fees, applies vouchers
   * NOW WITH: Idempotency key + Rate limiting (Grab standard)
   */
  async createBookingV2(params: CreateBookingV2Params): Promise<ApiResponse<BookingResultV2>> {
    try {
      // Generate idempotency key (prevents duplicate bookings)
      const idempotencyKey = `${params.customerId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Convert date + time to ISO timestamp
      const scheduledDatetime = createScheduledDateTime(
        params.scheduledDate,
        params.scheduledTime
      );

      console.log('📅 Creating secure booking:', {
        serviceIds: params.serviceIds,
        datetime: scheduledDatetime,
        voucher: params.userVoucherId,
        idempotencyKey,
      });

      // Prepare customer address with lat/lng for travel fee calculation
      const customerAddress = params.customerAddress ? {
        line1: params.customerAddress.line1,
        line2: params.customerAddress.line2,
        city: params.customerAddress.city,
        state: params.customerAddress.state,
        postalCode: params.customerAddress.postalCode,
        lat: params.customerAddress.lat?.toString(),
        lng: params.customerAddress.lng?.toString(),
      } : null;

      // NEW: Call Edge Function with rate limiting (10 req/min - Grab standard)
      const { data, error } = await supabase.functions.invoke('create-booking-with-rate-limit', {
        body: {
          customerId: params.customerId,
          p_barber_id: params.barberId,
          p_service_ids: params.serviceIds,
          p_scheduled_datetime: scheduledDatetime,
          p_service_type: params.serviceType,
          p_barbershop_id: params.barbershopId || null,
          p_customer_address: customerAddress,
          p_customer_notes: params.customerNotes || null,
          p_payment_method: params.paymentMethod || 'cash',
          p_user_voucher_id: params.userVoucherId || null,
          p_curlec_payment_id: params.curlecPaymentId || null,
          p_curlec_order_id: params.curlecOrderId || null,
          p_distance_km: params.distanceKm || null,
          p_idempotency_key: idempotencyKey, // Prevents duplicates
        },
      });

      if (error) {
        console.error('❌ Create booking v2 error:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        
        // Handle rate limit error specifically
        if (error.message?.includes('Too many booking attempts')) {
          return {
            success: false,
            error: 'Too many booking attempts. Please wait 1 minute and try again.',
          };
        }
        
        return {
          success: false,
          error: error.message || 'Failed to create booking via Edge Function',
        };
      }

      // Log success response for debugging
      console.log('📦 Edge Function response:', { data, hasData: !!data, dataKeys: data ? Object.keys(data) : [] });

      // Edge Function returns { success, data }
      const result = data?.data || data;
      console.log('✅ Secure booking created:', result);

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('❌ Create booking v2 exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to create booking',
      };
    }
  },

  /**
   * Create a new booking (OLD VERSION - Use createBookingV2 for new code)
   * @deprecated Use createBookingV2 for secure price validation
   */
  async createBooking(params: CreateBookingParams): Promise<ApiResponse<BookingResult>> {
    try {
      // GRAB-STYLE: Prevent self-booking (customer booking their own barber account)
      if (params.customerId && params.barberId) {
        // Fetch barber's user_id to check if it matches customer
        const { data: barberData, error: barberError } = await supabase
          .from('barbers')
          .select('user_id')
          .eq('id', params.barberId)
          .single();
        
        if (!barberError && barberData?.user_id === params.customerId) {
          console.error('❌ Self-booking prevented:', params.customerId);
          return {
            success: false,
            error: 'You cannot book yourself. Please choose another barber.',
          };
        }
      }

      // PRODUCTION FIX: Convert date + time to ISO timestamp with device timezone
      // This ensures bookings are scheduled correctly regardless of user's location
      const scheduledDatetime = createScheduledDateTime(
        params.scheduledDate,
        params.scheduledTime
      );

      console.log('📅 Booking scheduled for:', {
        input: `${params.scheduledDate} ${params.scheduledTime}`,
        iso: scheduledDatetime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      const { data, error } = await supabase.rpc('create_booking', {
        p_customer_id: params.customerId,
        p_barber_id: params.barberId,
        p_services: params.services,
        p_scheduled_datetime: scheduledDatetime, // CHANGED: Send ISO timestamp
        p_service_type: params.serviceType,
        p_barbershop_id: params.barbershopId || null,
        p_customer_address: params.customerAddress || null,
        p_customer_notes: params.customerNotes || null,
        p_payment_method: params.paymentMethod || 'cash',
        p_travel_fee: params.travelFee || null,
        p_discount_amount: params.discountAmount || null,
        p_distance_km: params.distanceKm || null,
        p_curlec_payment_id: params.curlecPaymentId || null,
        p_curlec_order_id: params.curlecOrderId || null,
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
   * Get customer booking counts by tab (for filter badges)
   * @param customerId - Customer's ID
   */
  async getCustomerBookingCounts(customerId: string): Promise<ApiResponse<{
    active: number;
    completed: number;
  }>> {
    try {
      // Fetch counts in parallel
      const [activeResult, completedResult] = await Promise.all([
        supabase.from('bookings').select('id', { count: 'exact', head: true })
          .eq('customer_id', customerId)
          .in('status', ['pending', 'accepted', 'confirmed', 'ready', 'on_the_way', 'arrived', 'in_progress']),
        supabase.from('bookings').select('id', { count: 'exact', head: true })
          .eq('customer_id', customerId)
          .in('status', ['completed', 'cancelled', 'rejected', 'expired']),
      ]);

      return {
        success: true,
        data: {
          active: activeResult.count || 0,
          completed: completedResult.count || 0,
        },
      };
    } catch (error: any) {
      console.error('❌ Get customer booking counts error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch booking counts',
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
        // Only log if error has actual content (avoid race condition noise)
        if (error.message || error.details || error.hint || error.code) {
          console.error('❌ Get bookings error:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
        }
        return {
          success: false,
          error: error.message || error.details || 'Failed to fetch bookings',
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

      // RPC returns payment_status as 'returned_payment_status' to avoid SQL ambiguity
      const paymentStatus = result?.returned_payment_status || result?.payment_status;
      
      console.log('[Queue Debug] New status:', newStatus);
      console.log('[Queue Debug] Result payment_status:', paymentStatus);

      // If status is 'completed' and payment is authorized, queue capture (2-hour delay)
      if (newStatus === 'completed' && paymentStatus === 'authorized') {
        console.log('⏰ Service completed - queueing payment capture (2-hour delay)');
        
        try {
          // Queue payment capture with 2-hour delay (Grab standard)
          const { data: queueData, error: queueError } = await supabase.rpc(
            'queue_payment_capture',
            { p_booking_id: bookingId }
          );

          if (queueError) {
            console.error('❌ Failed to queue capture:', queueError);
            console.error('⚠️ Payment capture NOT queued - manual processing required');
          } else {
            console.log('✅ Payment capture queued:', queueData);
            console.log(`📅 Scheduled for: ${queueData.scheduled_at}`);
            console.log('ℹ️ Customer can confirm early or dispute within 2 hours');
          }
        } catch (queueException: any) {
          console.error('❌ Queue exception:', queueException);
        }
      }

      // If refund is needed (booking cancelled with payment), call refund Edge Function
      if (result?.refund_needed && result?.payment_id) {
        console.log('💰 Processing instant refund for cancelled booking:', result.payment_id);
        
        try {
          const { data: refundData, error: refundError } = await supabase.functions.invoke(
            'refund-curlec-payment',
            {
              body: {
                payment_id: result.payment_id,
                amount: Math.round(result.refund_amount * 100), // Convert to sen
                notes: {
                  booking_id: bookingId,
                  reason: notes || 'Booking cancelled',
                },
                receipt: `refund_${bookingId.substring(0, 8)}`,
              },
            }
          );

          if (refundError) {
            console.error('❌ Refund failed:', refundError);
          } else if (refundData?.success) {
            console.log('✅ Instant refund initiated:', refundData.refund?.id);
            
            // Update booking with refund ID
            await supabase
              .from('bookings')
              .update({
                payment_status: 'refund_initiated',
                curlec_refund_id: refundData.refund?.id,
              })
              .eq('id', bookingId);
          }
        } catch (refundException: any) {
          console.error('❌ Refund exception:', refundException);
        }
      }

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

      // If reversal is needed (authorized but not captured)
      // Note: Razorpay/Curlec doesn't have explicit reverse API for authorized payments
      // The authorization will automatically expire in 5-7 days
      if (result?.reverse_needed && result?.payment_id) {
        console.log('🔄 Authorized payment will auto-expire:', result.payment_id);
        console.log('ℹ️ Authorization holds expire automatically in 5-7 days');
        
        // Update payment status to indicate it will be reversed
        try {
          await supabase
            .from('bookings')
            .update({
              payment_status: 'reversed', // Will auto-expire
            })
            .eq('id', bookingId);
          
          console.log('✅ Payment marked as reversed (will auto-expire)');
        } catch (updateException: any) {
          console.error('❌ Failed to update payment status:', updateException);
        }
      }
      // If refund is needed (captured payment), call the refund Edge Function
      else if (result?.refund_needed && result?.payment_id) {
        console.log('💰 Processing instant refund for payment:', result.payment_id);
        
        try {
          const { data: refundData, error: refundError } = await supabase.functions.invoke(
            'refund-curlec-payment',
            {
              body: {
                payment_id: result.payment_id,
                amount: Math.round(result.refund_amount * 100), // Convert to sen
                notes: {
                  booking_id: bookingId,
                  reason: reason,
                },
                receipt: `refund_${bookingId.substring(0, 8)}`,
              },
            }
          );

          if (refundError) {
            console.error('❌ Refund failed:', refundError);
            // Don't fail the cancellation, just log the refund error
          } else if (refundData?.success) {
            console.log('✅ Instant refund initiated:', refundData.refund?.id);
            
            // Update booking with refund ID
            await supabase
              .from('bookings')
              .update({
                payment_status: 'refund_initiated',
                curlec_refund_id: refundData.refund?.id,
              })
              .eq('id', bookingId);
          }
        } catch (refundException: any) {
          console.error('❌ Refund exception:', refundException);
          // Continue - cancellation was successful even if refund failed
        }
      }

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
   * Get barber booking counts by status (for filter badges)
   * @param barberId - Barber's ID
   */
  async getBarberBookingCounts(barberId: string): Promise<ApiResponse<{
    all: number;
    pending: number;
    active: number;
    completed: number;
  }>> {
    try {
      // Fetch all counts in parallel
      const [allResult, pendingResult, activeResult, completedResult] = await Promise.all([
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('barber_id', barberId),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('barber_id', barberId).eq('status', 'pending'),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('barber_id', barberId).in('status', ['accepted', 'on_the_way', 'arrived', 'in_progress']),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('barber_id', barberId).eq('status', 'completed'),
      ]);

      return {
        success: true,
        data: {
          all: allResult.count || 0,
          pending: pendingResult.count || 0,
          active: activeResult.count || 0,
          completed: completedResult.count || 0,
        },
      };
    } catch (error: any) {
      console.error('❌ Get barber booking counts error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch booking counts',
      };
    }
  },

  /**
   * Get barber bookings (for partner app)
   * @param barberId - Barber's ID
   * @param status - Filter by status (single or comma-separated: 'pending' or 'accepted,in_progress')
   * @param limit - Number of bookings to fetch (default 20 for pagination)
   * @param offset - Number of bookings to skip (for pagination)
   */
  async getBarberBookings(
    barberId: string,
    status?: string | null,
    limit: number = 20,
    offset: number = 0
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
        .range(offset, offset + limit - 1); // Pagination support

      // Support comma-separated status filter (e.g., "pending" or "accepted,on_the_way,in_progress")
      if (status) {
        const statuses = status.split(',').map(s => s.trim());
        if (statuses.length === 1) {
          query = query.eq('status', statuses[0]);
        } else {
          query = query.in('status', statuses);
        }
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
        if (booking.customer) {
          // Handle both array and object formats
          const customerData = Array.isArray(booking.customer) 
            ? booking.customer[0] 
            : booking.customer;
          
          if (customerData) {
            booking.customer = {
              id: customerData.id,
              name: customerData.full_name,
              avatar: customerData.avatar_url,
              phone: customerData.phone_number,
            };
          } else {
            console.warn('⚠️  No customer data found in booking:', booking.id);
          }
        } else {
          console.warn('⚠️  booking.customer is null/undefined for booking:', booking.id);
        }

        // Transform booking fields to camelCase
        booking.scheduledDate = booking.scheduled_date;
        booking.scheduledTime = booking.scheduled_time;
        booking.totalPrice = booking.total_price;
        booking.travelCost = booking.travel_fee;
        booking.distance = booking.distance_km;
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
          customer:profiles!bookings_customer_id_fkey(
            id,
            full_name,
            avatar_url,
            phone_number
          ),
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

      // Transform customer data structure for frontend
      if (data && data.customer) {
        data.customer = {
          id: data.customer.id,
          name: data.customer.full_name,
          full_name: data.customer.full_name,
          avatar: data.customer.avatar_url,
          phone: data.customer.phone_number,
        };
      }
      
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

  /**
   * Confirm service completion (Customer action)
   * Triggers immediate payment capture and cancels any pending queue jobs
   */
  async confirmServiceCompletion(
    bookingId: string,
    customerId: string
  ): Promise<ApiResponse<any>> {
    try {
      console.log('✅ Customer confirming service completion:', bookingId);

      const { data, error } = await supabase.rpc('confirm_service_completion', {
        p_booking_id: bookingId,
        p_customer_id: customerId,
      });

      if (error) {
        console.error('❌ Confirm service error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log('✅ Service confirmed by customer:', data);

      // If function returns trigger_immediate_capture = true, capture payment now
      if (data?.trigger_immediate_capture) {
        console.log('💳 Triggering immediate payment capture');

        try {
          const { data: captureData, error: captureError } = await supabase.functions.invoke(
            'capture-curlec-payment',
            {
              body: {
                payment_id: data.curlec_payment_id,
                amount: Math.round(data.amount * 100), // Convert to sen
                booking_id: bookingId, // Pass booking_id so Edge Function can update DB
              },
            }
          );

          if (captureError) {
            console.error('❌ Immediate capture failed:', captureError);
            return {
              success: false,
              error: 'Service confirmed but payment capture failed',
            };
          }

          if (captureData?.success) {
            console.log('✅ Payment captured immediately');
            console.log('✅ Payment status updated by Edge Function');

            return {
              success: true,
              data: {
                ...data,
                payment_captured: true,
              },
            };
          }
        } catch (captureException: any) {
          console.error('❌ Capture exception:', captureException);
          return {
            success: false,
            error: 'Service confirmed but payment capture failed',
          };
        }
      }

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('❌ Confirm service exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to confirm service completion',
      };
    }
  },

  /**
   * Report service issue (Customer action)
   * Cancels pending payment capture and flags booking for admin review
   */
  async reportServiceIssue(
    bookingId: string,
    customerId: string,
    disputeReason: string
  ): Promise<ApiResponse<any>> {
    try {
      console.log('🚨 Customer reporting service issue:', bookingId);

      if (!disputeReason || disputeReason.trim().length < 10) {
        return {
          success: false,
          error: 'Please provide a detailed reason (at least 10 characters)',
        };
      }

      const { data, error } = await supabase.rpc('report_service_issue', {
        p_booking_id: bookingId,
        p_customer_id: customerId,
        p_dispute_reason: disputeReason.trim(),
      });

      if (error) {
        console.error('❌ Report issue error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log('✅ Service issue reported:', data);

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('❌ Report issue exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to report service issue',
      };
    }
  },
};
