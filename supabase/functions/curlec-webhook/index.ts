import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

serve(async (req) => {
  try {
    // Get webhook signature from headers
    const signature = req.headers.get('x-razorpay-signature')
    
    if (!signature) {
      console.error('[Curlec Webhook] Missing signature')
      return new Response('Missing signature', { status: 400 })
    }

    // Get webhook secret
    const CURLEC_WEBHOOK_SECRET = Deno.env.get('CURLEC_WEBHOOK_SECRET')
    
    if (!CURLEC_WEBHOOK_SECRET) {
      throw new Error('Webhook secret not configured')
    }

    // Get raw body
    const rawBody = await req.text()
    
    // Verify webhook signature
    const hmac = createHmac('sha256', CURLEC_WEBHOOK_SECRET)
    hmac.update(rawBody)
    const generatedSignature = hmac.digest('hex')

    if (generatedSignature !== signature) {
      console.error('[Curlec Webhook] Invalid signature')
      return new Response('Invalid signature', { status: 401 })
    }

    // Parse webhook payload
    const payload = JSON.parse(rawBody)
    const event = payload.event
    const paymentEntity = payload.payload?.payment?.entity

    console.log('[Curlec Webhook] Received event:', event)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Handle different webhook events
    switch (event) {
      case 'payment.authorized':
        console.log('[Curlec Webhook] Payment authorized:', paymentEntity?.id)
        // Update booking/payment status
        await handlePaymentAuthorized(supabase, paymentEntity)
        break

      case 'payment.captured':
        console.log('[Curlec Webhook] Payment captured:', paymentEntity?.id)
        await handlePaymentCaptured(supabase, paymentEntity)
        break

      case 'payment.failed':
        console.log('[Curlec Webhook] Payment failed:', paymentEntity?.id)
        await handlePaymentFailed(supabase, paymentEntity)
        break

      case 'order.paid':
        console.log('[Curlec Webhook] Order paid:', payload.payload?.order?.entity?.id)
        break

      default:
        console.log('[Curlec Webhook] Unhandled event:', event)
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('[Curlec Webhook] Error:', error)
    return new Response('Error', { status: 500 })
  }
})

async function handlePaymentAuthorized(supabase: any, payment: any) {
  if (!payment) return

  try {
    // Find booking by payment ID
    const { data: booking } = await supabase
      .from('bookings')
      .select('id')
      .eq('curlec_payment_id', payment.id)
      .single()

    if (booking) {
      // Update booking status
      await supabase
        .from('bookings')
        .update({
          payment_status: 'processing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id)

      console.log('[Curlec Webhook] Updated booking:', booking.id)
    }
  } catch (error) {
    console.error('[Curlec Webhook] Error handling authorized:', error)
  }
}

async function handlePaymentCaptured(supabase: any, payment: any) {
  if (!payment) return

  try {
    // Find booking by payment ID
    const { data: booking } = await supabase
      .from('bookings')
      .select('id')
      .eq('curlec_payment_id', payment.id)
      .single()

    if (booking) {
      // Update booking status to confirmed
      await supabase
        .from('bookings')
        .update({
          payment_status: 'completed',
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id)

      console.log('[Curlec Webhook] Payment captured for booking:', booking.id)
    }
  } catch (error) {
    console.error('[Curlec Webhook] Error handling captured:', error)
  }
}

async function handlePaymentFailed(supabase: any, payment: any) {
  if (!payment) return

  try {
    // Find booking by payment ID
    const { data: booking } = await supabase
      .from('bookings')
      .select('id')
      .eq('curlec_payment_id', payment.id)
      .single()

    if (booking) {
      // Update booking status
      await supabase
        .from('bookings')
        .update({
          payment_status: 'failed',
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id)

      console.log('[Curlec Webhook] Payment failed for booking:', booking.id)
    }
  } catch (error) {
    console.error('[Curlec Webhook] Error handling failed:', error)
  }
}
