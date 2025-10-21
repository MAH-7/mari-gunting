import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

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

    // Get Curlec secret from environment
    const CURLEC_KEY_SECRET = Deno.env.get('CURLEC_KEY_SECRET')

    if (!CURLEC_KEY_SECRET) {
      throw new Error('Curlec secret not configured')
    }

    // Parse request body
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new Error('Missing required fields')
    }

    // Verify signature
    // Curlec/Razorpay signature = HMAC-SHA256(order_id + "|" + payment_id, secret)
    const text = `${razorpay_order_id}|${razorpay_payment_id}`
    
    const hmac = createHmac('sha256', CURLEC_KEY_SECRET)
    hmac.update(text)
    const generatedSignature = hmac.digest('hex')

    const verified = generatedSignature === razorpay_signature

    console.log('[Curlec] Payment verification:', {
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      verified,
    })

    return new Response(
      JSON.stringify({ verified }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('[Curlec] Verification error:', error)
    return new Response(
      JSON.stringify({ error: error.message, verified: false }),
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
