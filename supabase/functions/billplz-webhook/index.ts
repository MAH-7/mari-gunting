/**
 * Billplz Webhook Handler - Supabase Edge Function
 * 
 * SECURITY: This function verifies Billplz payment callbacks server-side
 * to prevent fake payment confirmations from malicious clients.
 * 
 * Endpoint: https://your-project.supabase.co/functions/v1/billplz-webhook
 * 
 * Billplz will POST to this endpoint when payment is completed.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Environment variables (set in Supabase Dashboard)
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Service role for admin access
const BILLPLZ_X_SIGNATURE_KEY = Deno.env.get('BILLPLZ_X_SIGNATURE_KEY') || Deno.env.get('BILLPLZ_API_KEY')! // Use XSignature key from Billplz settings

interface BillplzCallback {
  id: string
  collection_id: string
  paid: boolean
  state: 'paid' | 'due' | 'deleted'
  amount: number
  paid_amount: number
  paid_at: string
  transaction_id: string
  transaction_status: string
  reference_1: string // Booking ID
  reference_2: string // Barber ID
  x_signature: string
}

/**
 * Verify Billplz X-Signature (HMAC-SHA256)
 * This prevents fake payment callbacks from hackers
 */
async function verifyXSignature(
  callbackData: BillplzCallback,
  key: string
): Promise<boolean> {
  try {
    // Build string to sign (v4 format)
    const stringToSign = [
      'billplzamount' + callbackData.amount,
      'billplzcollection_id' + callbackData.collection_id,
      'billplzid' + callbackData.id,
      'billplzpaid' + (callbackData.paid ? 'true' : 'false'),
      'billplzpaid_at' + callbackData.paid_at,
      'billplzstate' + callbackData.state,
      'billplztransaction_id' + callbackData.transaction_id,
      'billplztransaction_status' + callbackData.transaction_status,
    ].join('|')

    // Calculate HMAC-SHA256
    const encoder = new TextEncoder()
    const keyData = encoder.encode(key)
    const messageData = encoder.encode(stringToSign)

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
    
    // Convert to hex
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    const isValid = expectedSignature === callbackData.x_signature

    if (!isValid) {
      console.error('[webhook] X-Signature verification FAILED!')
      console.error('[webhook] Expected:', expectedSignature)
      console.error('[webhook] Received:', callbackData.x_signature)
    }

    return isValid
  } catch (error) {
    console.error('[webhook] Signature verification error:', error)
    return false
  }
}

serve(async (req) => {
  // CORS headers (if needed)
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Parse callback data
    const callbackData: BillplzCallback = await req.json()
    
    console.log('[webhook] Received callback for bill:', callbackData.id)
    console.log('[webhook] Booking ID:', callbackData.reference_1)
    console.log('[webhook] Paid:', callbackData.paid)
    console.log('[webhook] State:', callbackData.state)
    console.log('[webhook] Amount:', callbackData.amount / 100, 'MYR')

    // 2. Verify X-Signature (CRITICAL SECURITY CHECK)
    const isValidSignature = await verifyXSignature(
      callbackData,
      BILLPLZ_X_SIGNATURE_KEY
    )

    if (!isValidSignature) {
      console.error('[webhook] ❌ Invalid signature - Possible attack!')
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('[webhook] ✅ Signature verified')

    // 3. Initialize Supabase admin client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const bookingId = callbackData.reference_1
    const barberId = callbackData.reference_2

    // 4. Get current booking status
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, payment_status, status, customer_id, barber_id, total_amount')
      .eq('id', bookingId)
      .single()

    if (fetchError || !booking) {
      console.error('[webhook] Booking not found:', bookingId)
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 5. Check if already processed (prevent double-processing)
    if (booking.payment_status === 'paid') {
      console.log('[webhook] ⚠️ Payment already processed for booking:', bookingId)
      return new Response(
        JSON.stringify({ message: 'Already processed' }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 6. Verify amount matches (prevent payment manipulation)
    const expectedAmount = Math.round(booking.total_amount * 100) // Convert to cents
    if (callbackData.amount !== expectedAmount) {
      console.error('[webhook] ❌ Amount mismatch!')
      console.error('[webhook] Expected:', expectedAmount, 'cents')
      console.error('[webhook] Received:', callbackData.amount, 'cents')
      
      // Log suspicious activity
      await supabase.from('payment_logs').insert({
        booking_id: bookingId,
        bill_id: callbackData.id,
        event: 'amount_mismatch',
        expected_amount: expectedAmount,
        received_amount: callbackData.amount,
        callback_data: callbackData,
      })

      return new Response(
        JSON.stringify({ error: 'Amount mismatch' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 7. Process payment based on state
    if (callbackData.paid && callbackData.state === 'paid') {
      console.log('[webhook] 💰 Processing successful payment')

      // Update booking status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          payment_status: 'paid',
          status: 'confirmed', // Move booking to confirmed
          paid_at: callbackData.paid_at,
          bill_id: callbackData.id,
          transaction_id: callbackData.transaction_id,
          transaction_status: callbackData.transaction_status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)

      if (updateError) {
        console.error('[webhook] Failed to update booking:', updateError)
        throw updateError
      }

      // Log successful payment
      await supabase.from('payment_logs').insert({
        booking_id: bookingId,
        bill_id: callbackData.id,
        event: 'payment_success',
        amount: callbackData.amount,
        transaction_id: callbackData.transaction_id,
        callback_data: callbackData,
      })

      // TODO: Send push notification to customer
      // TODO: Send push notification to barber
      // TODO: Send confirmation email/SMS

      console.log('[webhook] ✅ Payment processed successfully')

      return new Response(
        JSON.stringify({ 
          message: 'Payment processed',
          booking_id: bookingId 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else if (callbackData.state === 'deleted') {
      // Payment was cancelled/expired
      console.log('[webhook] ❌ Payment cancelled/deleted')

      await supabase
        .from('bookings')
        .update({
          payment_status: 'cancelled',
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)

      await supabase.from('payment_logs').insert({
        booking_id: bookingId,
        bill_id: callbackData.id,
        event: 'payment_cancelled',
        callback_data: callbackData,
      })

      return new Response(
        JSON.stringify({ message: 'Payment cancelled' }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      // Payment pending or other state
      console.log('[webhook] ⏳ Payment pending:', callbackData.state)

      return new Response(
        JSON.stringify({ message: 'Payment pending' }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('[webhook] Error processing callback:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})
