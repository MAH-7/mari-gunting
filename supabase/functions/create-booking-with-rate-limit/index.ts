// ============================================
// EDGE FUNCTION: Create Booking with Rate Limiting
// ============================================
// Date: 2025-02-11
// Standard: Grab rate limiting (10 requests per minute)
// Purpose: Prevent bot attacks and spam while allowing legitimate users
//
// RATE LIMIT:
// - 10 booking attempts per customer per 60 seconds
// - Checked by counting recent bookings in database
// - Simple, no Redis required
//
// SECURITY:
// - Uses service_role key (bypasses RLS)
// - Validates customer_id from JWT token
// - Calls create_booking_v2 with idempotency_key
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RATE_LIMIT = 10; // requests per minute (Grab standard)
const RATE_WINDOW = 60; // seconds

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Supabase client with service role (bypasses RLS for rate limit check)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get authenticated user from JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Parse request body
    const body = await req.json()
    const { customerId, ...bookingParams } = body

    // Validate customer_id matches authenticated user
    if (customerId !== user.id) {
      throw new Error('Customer ID mismatch')
    }

    // =============================================
    // RATE LIMITING: Check recent bookings
    // =============================================
    
    const cutoffTime = new Date(Date.now() - (RATE_WINDOW * 1000)).toISOString()
    
    const { data: recentBookings, error: countError } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', customerId)
      .gte('created_at', cutoffTime)

    if (countError) {
      console.error('Rate limit check error:', countError)
      throw new Error('Failed to check rate limit')
    }

    const recentCount = recentBookings?.length || 0
    
    if (recentCount >= RATE_LIMIT) {
      console.warn(`[RATE_LIMIT] Customer ${customerId} exceeded limit: ${recentCount}/${RATE_LIMIT} in ${RATE_WINDOW}s`)
      
      return new Response(
        JSON.stringify({
          error: 'Too many booking attempts. Please wait 1 minute and try again.',
          code: 'RATE_LIMIT_EXCEEDED',
          retry_after: 60
        }),
        {
          status: 429,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': '60'
          }
        }
      )
    }

    console.log(`[RATE_LIMIT] Customer ${customerId}: ${recentCount}/${RATE_LIMIT} requests in last ${RATE_WINDOW}s`)

    // =============================================
    // CREATE BOOKING: Call database function
    // =============================================
    
    // Add customer_id back to params (it was extracted earlier)
    const { data, error: bookingError } = await supabase.rpc('create_booking_v2', {
      p_customer_id: customerId,
      ...bookingParams
    })

    if (bookingError) {
      console.error('Booking creation error:', bookingError)
      throw new Error(bookingError.message || 'Failed to create booking')
    }

    // Return success
    return new Response(
      JSON.stringify({ 
        success: true,
        data: Array.isArray(data) ? data[0] : data
      }),
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        status: error.message === 'Unauthorized' ? 401 : 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    )
  }
})

// ============================================
// DEPLOYMENT
// ============================================
// Deploy: npx supabase functions deploy create-booking-with-rate-limit
// Test: npx supabase functions serve create-booking-with-rate-limit
//
// MONITORING:
// - Check Supabase Edge Function logs for [RATE_LIMIT] entries
// - Monitor 429 errors in app analytics
// - Adjust RATE_LIMIT if too strict/lenient
// ============================================
