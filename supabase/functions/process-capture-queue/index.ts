import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const CURLEC_API_URL = 'https://api.razorpay.com/v1'
const MAX_RETRY_COUNT = 3
const BATCH_SIZE = 10 // Process 10 captures per run

interface CaptureQueueItem {
  id: string
  booking_id: string
  curlec_payment_id: string
  amount: number
  scheduled_at: string
  retry_count: number
}

interface CaptureResult {
  queue_id: string
  success: boolean
  error?: string
}

serve(async (req) => {
  try {
    console.log('[Queue Processor] Starting capture queue processing...')

    // Initialize Supabase client with service role (bypass RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Curlec credentials
    const CURLEC_KEY_ID = Deno.env.get('CURLEC_KEY_ID')
    const CURLEC_KEY_SECRET = Deno.env.get('CURLEC_KEY_SECRET')
    const CURLEC_ACCOUNT_ID = Deno.env.get('CURLEC_ACCOUNT_ID')

    if (!CURLEC_KEY_ID || !CURLEC_KEY_SECRET || !CURLEC_ACCOUNT_ID) {
      throw new Error('Curlec credentials not configured')
    }

    // Fetch pending capture jobs that are ready to process
    const { data: pendingCaptures, error: fetchError } = await supabase
      .from('capture_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString()) // Due for processing
      .lt('retry_count', MAX_RETRY_COUNT) // Not exhausted retries
      .order('scheduled_at', { ascending: true })
      .limit(BATCH_SIZE)

    if (fetchError) {
      console.error('[Queue Processor] Error fetching queue:', fetchError)
      throw fetchError
    }

    if (!pendingCaptures || pendingCaptures.length === 0) {
      console.log('[Queue Processor] No pending captures to process')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No pending captures',
          processed: 0 
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[Queue Processor] Found ${pendingCaptures.length} pending captures`)

    // Process each capture
    const results: CaptureResult[] = []
    
    for (const capture of pendingCaptures as CaptureQueueItem[]) {
      console.log(`[Queue Processor] Processing capture ${capture.id} for booking ${capture.booking_id}`)
      
      try {
        // Mark as processing
        await supabase
          .from('capture_queue')
          .update({ status: 'processing' })
          .eq('id', capture.id)

        // Verify booking hasn't been disputed
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .select('disputed_at, completion_confirmed_at, payment_status')
          .eq('id', capture.booking_id)
          .single()

        if (bookingError) {
          throw new Error(`Failed to fetch booking: ${bookingError.message}`)
        }

        if (booking.disputed_at) {
          console.log(`[Queue Processor] Booking ${capture.booking_id} was disputed - cancelling capture`)
          await supabase
            .from('capture_queue')
            .update({
              status: 'cancelled',
              processed_at: new Date().toISOString(),
              last_error: 'Booking disputed by customer'
            })
            .eq('id', capture.id)
          
          results.push({ queue_id: capture.id, success: true })
          continue
        }

        if (booking.payment_status === 'completed') {
          console.log(`[Queue Processor] Payment already captured for booking ${capture.booking_id}`)
          await supabase
            .from('capture_queue')
            .update({
              status: 'completed',
              processed_at: new Date().toISOString()
            })
            .eq('id', capture.id)
          
          results.push({ queue_id: capture.id, success: true })
          continue
        }

        // Call Curlec capture API
        console.log(`[Queue Processor] Capturing payment ${capture.curlec_payment_id}`)
        const captureResponse = await fetch(
          `${CURLEC_API_URL}/payments/${capture.curlec_payment_id}/capture`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${btoa(`${CURLEC_KEY_ID}:${CURLEC_KEY_SECRET}`)}`,
              'X-Razorpay-Account': CURLEC_ACCOUNT_ID,
            },
            body: JSON.stringify({
              amount: Math.round(capture.amount * 100), // Convert to sen
              currency: 'MYR',
            }),
          }
        )

        if (!captureResponse.ok) {
          const errorText = await captureResponse.text()
          throw new Error(`Curlec API error (${captureResponse.status}): ${errorText}`)
        }

        const payment = await captureResponse.json()
        console.log(`[Queue Processor] Payment captured successfully: ${payment.id}`)

        // Update queue status to completed
        await supabase
          .from('capture_queue')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
            last_error: null
          })
          .eq('id', capture.id)

        // Update booking payment status
        await supabase
          .from('bookings')
          .update({ 
            payment_status: 'completed',
            paid_at: new Date().toISOString()
          })
          .eq('id', capture.booking_id)

        console.log(`[Queue Processor] Booking ${capture.booking_id} payment status updated to completed`)

        results.push({ queue_id: capture.id, success: true })

      } catch (error: any) {
        console.error(`[Queue Processor] Error processing capture ${capture.id}:`, error)

        const newRetryCount = capture.retry_count + 1
        const isFinalFailure = newRetryCount >= MAX_RETRY_COUNT

        // Update queue with error and retry count
        await supabase
          .from('capture_queue')
          .update({
            status: isFinalFailure ? 'failed' : 'pending',
            retry_count: newRetryCount,
            last_error: error.message || 'Unknown error',
            processed_at: isFinalFailure ? new Date().toISOString() : null
          })
          .eq('id', capture.id)

        if (isFinalFailure) {
          console.error(`[Queue Processor] Capture ${capture.id} failed permanently after ${MAX_RETRY_COUNT} retries`)
          // TODO: Send alert to admin
        } else {
          console.log(`[Queue Processor] Capture ${capture.id} will be retried (attempt ${newRetryCount}/${MAX_RETRY_COUNT})`)
        }

        results.push({ 
          queue_id: capture.id, 
          success: false, 
          error: error.message 
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    console.log(`[Queue Processor] Completed processing: ${successCount} successful, ${failureCount} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        successful: successCount,
        failed: failureCount,
        results
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    console.error('[Queue Processor] Fatal error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
