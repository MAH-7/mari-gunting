import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

serve(async (req) => {
  try {
    console.log('[Curlec Webhook] 🔔 Incoming webhook request')
    
    // Get webhook signature from headers
    const signature = req.headers.get('x-razorpay-signature')
    
    if (!signature) {
      console.error('[Curlec Webhook] ❌ Missing signature')
      return new Response('Missing signature', { status: 400 })
    }
    
    console.log('[Curlec Webhook] ✅ Signature present')

    // Get webhook secret from environment
    const CURLEC_WEBHOOK_SECRET = Deno.env.get('CURLEC_WEBHOOK_SECRET')
    
    if (!CURLEC_WEBHOOK_SECRET) {
      console.error('[Curlec Webhook] ❌ CURLEC_WEBHOOK_SECRET not set in environment')
      throw new Error('Webhook secret not configured')
    }
    
    console.log('[Curlec Webhook] ✅ Using secret from environment')

    // Get raw body
    const rawBody = await req.text()
    
    // Verify webhook signature
    const hmac = createHmac('sha256', CURLEC_WEBHOOK_SECRET)
    hmac.update(rawBody)
    const generatedSignature = hmac.digest('hex')

    if (generatedSignature !== signature) {
      console.error('[Curlec Webhook] ❌ Invalid signature')
      return new Response('Invalid signature', { status: 401 })
    }
    
    console.log('[Curlec Webhook] ✅ Signature verified')

    // Parse webhook payload
    const payload = JSON.parse(rawBody)
    const event = payload.event
    const paymentEntity = payload.payload?.payment?.entity
    const refundEntity = payload.payload?.refund?.entity

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

      case 'refund.created':
        console.log('[Curlec Webhook] Refund created:', refundEntity?.id)
        await handleRefundCreated(supabase, refundEntity)
        break

      case 'refund.processed':
        console.log('[Curlec Webhook] Refund processed:', refundEntity?.id)
        await handleRefundProcessed(supabase, refundEntity)
        break

      case 'refund.failed':
        console.log('[Curlec Webhook] Refund failed:', refundEntity?.id)
        await handleRefundFailed(supabase, refundEntity)
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
      // Update payment status to authorized (payment held, not captured yet)
      await supabase
        .from('bookings')
        .update({
          payment_status: 'authorized',
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id)

      console.log('[Curlec Webhook] Payment authorized for booking:', booking.id)
      console.log('[Curlec Webhook] Waiting for barber to accept before capture')
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
      .select('id, status')
      .eq('curlec_payment_id', payment.id)
      .single()

    if (booking) {
      // Update payment status to completed (captured)
      // Only update booking status to confirmed if barber has accepted
      const updates: any = {
        payment_status: 'completed',
        updated_at: new Date().toISOString(),
      }
      
      // If barber already accepted, confirm the booking
      if (booking.status === 'accepted' || booking.status === 'pending') {
        updates.status = 'confirmed'
      }
      
      await supabase
        .from('bookings')
        .update(updates)
        .eq('id', booking.id)

      console.log('[Curlec Webhook] Payment captured for booking:', booking.id)
      console.log('[Curlec Webhook] Booking status:', booking.status, '→', updates.status || booking.status)
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

async function handleRefundCreated(supabase: any, refund: any) {
  if (!refund) return

  try {
    // Find booking by refund ID
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, curlec_payment_id')
      .eq('curlec_refund_id', refund.id)
      .single()

    if (booking) {
      console.log('[Curlec Webhook] Refund created for booking:', booking.id)
      // Status already set to refund_initiated by cancel_booking function
    } else {
      // Try to find by payment_id (in case refund_id not yet set)
      const { data: bookingByPayment } = await supabase
        .from('bookings')
        .select('id')
        .eq('curlec_payment_id', refund.payment_id)
        .single()

      if (bookingByPayment) {
        await supabase
          .from('bookings')
          .update({
            curlec_refund_id: refund.id,
            payment_status: 'refund_initiated',
            updated_at: new Date().toISOString(),
          })
          .eq('id', bookingByPayment.id)

        console.log('[Curlec Webhook] Linked refund to booking:', bookingByPayment.id)
      }
    }
  } catch (error) {
    console.error('[Curlec Webhook] Error handling refund created:', error)
  }
}

async function handleRefundProcessed(supabase: any, refund: any) {
  if (!refund) return

  try {
    // Find booking by refund ID or payment ID
    let booking = null
    
    const { data: bookingByRefund } = await supabase
      .from('bookings')
      .select('id')
      .eq('curlec_refund_id', refund.id)
      .single()

    if (bookingByRefund) {
      booking = bookingByRefund
    } else {
      const { data: bookingByPayment } = await supabase
        .from('bookings')
        .select('id')
        .eq('curlec_payment_id', refund.payment_id)
        .single()
      
      booking = bookingByPayment
    }

    if (booking) {
      // Update booking status to refunded
      await supabase
        .from('bookings')
        .update({
          payment_status: 'refunded',
          curlec_refund_id: refund.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id)

      console.log('[Curlec Webhook] Refund processed for booking:', booking.id)
      console.log('[Curlec Webhook] Refund amount:', refund.amount / 100, 'MYR')
      console.log('[Curlec Webhook] Speed:', refund.speed_processed || refund.speed_requested)
    }
  } catch (error) {
    console.error('[Curlec Webhook] Error handling refund processed:', error)
  }
}

async function handleRefundFailed(supabase: any, refund: any) {
  if (!refund) return

  try {
    // Find booking by refund ID or payment ID
    let booking = null
    
    const { data: bookingByRefund } = await supabase
      .from('bookings')
      .select('id')
      .eq('curlec_refund_id', refund.id)
      .single()

    if (bookingByRefund) {
      booking = bookingByRefund
    } else {
      const { data: bookingByPayment } = await supabase
        .from('bookings')
        .select('id')
        .eq('curlec_payment_id', refund.payment_id)
        .single()
      
      booking = bookingByPayment
    }

    if (booking) {
      // Update booking status - refund failed
      await supabase
        .from('bookings')
        .update({
          payment_status: 'refund_failed',
          curlec_refund_id: refund.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id)

      console.error('[Curlec Webhook] Refund FAILED for booking:', booking.id)
      console.error('[Curlec Webhook] Refund error:', refund.error_description || 'Unknown error')
      
      // TODO: Alert admin or create support ticket for manual refund
    }
  } catch (error) {
    console.error('[Curlec Webhook] Error handling refund failed:', error)
  }
}
