import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CURLEC_API_URL = 'https://api.razorpay.com/v1' // Razorpay Curlec uses same API base

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
    const { amount, currency = 'MYR', receipt, notes } = await req.json()

    if (!amount || amount <= 0) {
      throw new Error('Invalid amount')
    }

    // Create Curlec order
    // Note: customer field is NOT supported in order creation API
    // Customer details should be passed in checkout options instead
    const orderData = {
      amount: Math.round(amount), // Amount in smallest unit (sen)
      currency,
      receipt,
      notes,
    }

    console.log('[Curlec] Creating order:', orderData)

    const response = await fetch(`${CURLEC_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${CURLEC_KEY_ID}:${CURLEC_KEY_SECRET}`)}`,
        'X-Razorpay-Account': CURLEC_ACCOUNT_ID,
      },
      body: JSON.stringify(orderData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Curlec] Order creation failed - Status:', response.status)
      console.error('[Curlec] Error response:', errorText)
      console.error('[Curlec] Request data:', JSON.stringify(orderData))
      console.error('[Curlec] Account ID:', CURLEC_ACCOUNT_ID)
      
      // Try to parse error as JSON
      let errorDetail = errorText
      try {
        const errorJson = JSON.parse(errorText)
        errorDetail = errorJson.error?.description || errorJson.error || errorText
      } catch (e) {
        // Use raw text if not JSON
      }
      
      throw new Error(`Curlec API error (${response.status}): ${errorDetail}`)
    }

    const order = await response.json()
    console.log('[Curlec] Order created successfully:', order.id)

    return new Response(
      JSON.stringify({ order }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('[Curlec] Error:', error)
    console.error('[Curlec] Error stack:', error.stack)
    return new Response(
      JSON.stringify({ 
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
