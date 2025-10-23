import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
    const { payment_id, amount, notes, receipt } = await req.json()

    if (!payment_id) {
      throw new Error('payment_id is required')
    }

    // Prepare refund data
    const refundData: any = {
      speed: 'optimum', // Instant refund when possible, fallback to normal
    }

    // Optional: partial refund (if amount specified)
    if (amount) {
      refundData.amount = Math.round(amount) // Amount in smallest unit (sen)
    }

    // Optional: notes for tracking
    if (notes) {
      refundData.notes = notes
    }

    // Optional: receipt for reference
    if (receipt) {
      refundData.receipt = receipt
    }

    console.log('[Curlec Refund] Creating refund for payment:', payment_id)
    console.log('[Curlec Refund] Refund data:', refundData)

    // Call Curlec refund API
    const response = await fetch(`${CURLEC_API_URL}/payments/${payment_id}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${CURLEC_KEY_ID}:${CURLEC_KEY_SECRET}`)}`,
        'X-Razorpay-Account': CURLEC_ACCOUNT_ID,
      },
      body: JSON.stringify(refundData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Curlec Refund] Failed - Status:', response.status)
      console.error('[Curlec Refund] Error response:', errorText)
      
      // Try to parse error as JSON
      let errorDetail = errorText
      try {
        const errorJson = JSON.parse(errorText)
        errorDetail = errorJson.error?.description || errorJson.error || errorText
      } catch (e) {
        // Use raw text if not JSON
      }
      
      throw new Error(`Curlec refund failed (${response.status}): ${errorDetail}`)
    }

    const refund = await response.json()
    console.log('[Curlec Refund] Refund created successfully:', refund.id)
    console.log('[Curlec Refund] Status:', refund.status)
    console.log('[Curlec Refund] Speed requested:', refund.speed_requested)
    console.log('[Curlec Refund] Speed processed:', refund.speed_processed)

    return new Response(
      JSON.stringify({ 
        success: true,
        refund,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('[Curlec Refund] Error:', error)
    console.error('[Curlec Refund] Error stack:', error.stack)
    
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
