import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const CURLEC_API_URL = 'https://api.razorpay.com/v1'

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      })
    }

    // Get Curlec credentials from environment
    const CURLEC_KEY_ID = Deno.env.get('CURLEC_KEY_ID')
    const CURLEC_KEY_SECRET = Deno.env.get('CURLEC_KEY_SECRET')
    const CURLEC_ACCOUNT_ID = Deno.env.get('CURLEC_ACCOUNT_ID')

    if (!CURLEC_KEY_ID || !CURLEC_KEY_SECRET || !CURLEC_ACCOUNT_ID) {
      throw new Error('Curlec credentials not configured')
    }

    // Parse request body
    const { payment_id, amount, currency = 'MYR', booking_id } = await req.json()

    if (!payment_id) {
      throw new Error('payment_id is required')
    }

    if (!amount || amount <= 0) {
      throw new Error('amount is required and must be positive')
    }

    console.log('[Curlec Capture] Capturing payment:', payment_id)
    console.log('[Curlec Capture] Amount:', amount, 'sen')

    // Call Curlec capture API
    const response = await fetch(`${CURLEC_API_URL}/payments/${payment_id}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${CURLEC_KEY_ID}:${CURLEC_KEY_SECRET}`)}`,
        'X-Razorpay-Account': CURLEC_ACCOUNT_ID,
      },
      body: JSON.stringify({
        amount: Math.round(amount), // Amount in smallest unit (sen)
        currency: currency,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Curlec Capture] Failed - Status:', response.status)
      console.error('[Curlec Capture] Error response:', errorText)
      
      // Try to parse error as JSON
      let errorDetail = errorText
      try {
        const errorJson = JSON.parse(errorText)
        errorDetail = errorJson.error?.description || errorJson.error || errorText
      } catch (e) {
        // Use raw text if not JSON
      }
      
      throw new Error(`Curlec capture failed (${response.status}): ${errorDetail}`)
    }

    const payment = await response.json()
    console.log('[Curlec Capture] Payment captured successfully')
    console.log('[Curlec Capture] Payment ID:', payment.id)
    console.log('[Curlec Capture] Status:', payment.status)
    console.log('[Curlec Capture] Amount captured:', payment.amount_refunded ? payment.amount - payment.amount_refunded : payment.amount)

    // Update booking payment_status in database (if booking_id provided)
    if (booking_id) {
      try {
        console.log('[Curlec Capture] Updating booking payment status...')
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        const { error: updateError } = await supabase
          .from('bookings')
          .update({ 
            payment_status: 'completed',
            paid_at: new Date().toISOString()
          })
          .eq('id', booking_id)
          .eq('curlec_payment_id', payment_id) // Safety check

        if (updateError) {
          console.error('[Curlec Capture] Failed to update booking:', updateError)
          // Don't fail the whole operation - capture succeeded
        } else {
          console.log('[Curlec Capture] Booking payment status updated to completed')
        }
      } catch (dbError) {
        console.error('[Curlec Capture] Database update exception:', dbError)
        // Don't fail the whole operation - capture succeeded
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        payment,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('[Curlec Capture] Error:', error)
    console.error('[Curlec Capture] Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: error.stack 
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})
