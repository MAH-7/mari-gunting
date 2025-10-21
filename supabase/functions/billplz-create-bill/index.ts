/**
 * Billplz Create Bill - Supabase Edge Function
 *
 * Creates a Billplz bill securely on the server and returns the payment URL.
 * Implements idempotency by reusing an existing pending bill for the same booking.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const BILLPLZ_API_KEY = Deno.env.get('BILLPLZ_API_KEY')!
const BILLPLZ_COLLECTION_ID = Deno.env.get('BILLPLZ_COLLECTION_ID')!
const BILLPLZ_ENV = Deno.env.get('BILLPLZ_ENV') || 'sandbox'
const BILLPLZ_BASE_URL = Deno.env.get('BILLPLZ_BASE_URL')
  || (BILLPLZ_ENV === 'production' ? 'https://www.billplz.com/api' : 'https://www.billplz-sandbox.com/api')

interface CreateBillBody {
  bookingId: string
  amount: number // in cents
  email: string
  name: string
  description: string
  mobile?: string
  bankCode?: string // e.g. 'MBB0227' for Maybank
  redirectUrl: string // deep link back to app
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!BILLPLZ_API_KEY || !BILLPLZ_COLLECTION_ID) {
      return new Response(JSON.stringify({ error: 'Billplz is not configured on server' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = (await req.json()) as CreateBillBody

    // Basic validation
    if (!body?.bookingId || !body?.amount || !body?.email || !body?.name || !body?.redirectUrl) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 1) Idempotency: reuse existing pending bill for this booking
    const { data: existingPayments, error: paymentsErr } = await supabase
      .from('payments')
      .select('id, billplz_bill_id, payment_status, created_at')
      .eq('booking_id', body.bookingId)
      .eq('payment_method', 'billplz')
      .in('payment_status', ['created', 'pending'])
      .order('created_at', { ascending: false })
      .limit(1)

    if (paymentsErr) {
      console.error('[create-bill] Failed to query payments:', paymentsErr)
    }

    if (existingPayments && existingPayments.length > 0 && existingPayments[0].billplz_bill_id) {
      const existingBillId = existingPayments[0].billplz_bill_id as string
      // Return the existing bill payment URL
      const authHeader = 'Basic ' + btoa(BILLPLZ_API_KEY + ':')
      const res = await fetch(`${BILLPLZ_BASE_URL}/v3/bills/${existingBillId}`, {
        headers: { Authorization: authHeader },
      })
      if (res.ok) {
        const bill = await res.json()
        return new Response(JSON.stringify({ success: true, billId: bill.id, paymentUrl: bill.url, reused: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // 2) Create a new bill
    const form = new URLSearchParams()
    form.append('collection_id', BILLPLZ_COLLECTION_ID)
    form.append('email', body.email)
    form.append('name', body.name)
    form.append('amount', String(body.amount))
    form.append('description', body.description)

    // Callback to our secure webhook
    const webhookUrl = `${SUPABASE_URL}/functions/v1/billplz-webhook`
    form.append('callback_url', webhookUrl)

    // Redirect back to app
    form.append('redirect_url', body.redirectUrl)

    // Bank preselection (Direct Payment Gateway): use reference_1_label + reference_1
    if (body.bankCode) {
      form.append('reference_1_label', 'Bank Code')
      form.append('reference_1', body.bankCode)
      form.append('reference_2_label', 'Booking ID')
      form.append('reference_2', body.bookingId)
    } else {
      form.append('reference_1_label', 'Booking ID')
      form.append('reference_1', body.bookingId)
    }

    if (body.mobile) form.append('mobile', body.mobile)

    const authHeader = 'Basic ' + btoa(BILLPLZ_API_KEY + ':')
    const res = await fetch(`${BILLPLZ_BASE_URL}/v3/bills`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[create-bill] Billplz error:', res.status, text)
      return new Response(JSON.stringify({ error: `Billplz error ${res.status}`, details: text }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const bill = await res.json()

    // 3) Insert payment record (created/pending)
    const { error: insertErr } = await supabase.from('payments').insert({
      booking_id: body.bookingId,
      amount: body.amount / 100,
      currency: 'MYR',
      payment_method: 'billplz',
      payment_status: 'pending',
      billplz_bill_id: bill.id,
    })
    if (insertErr) {
      console.error('[create-bill] Failed to insert payment:', insertErr)
    }

    return new Response(JSON.stringify({ success: true, billId: bill.id, paymentUrl: bill.url }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (e) {
    console.error('[create-bill] Error:', e)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
