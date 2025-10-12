/**
 * Supabase Edge Function: Send OTP via Twilio SMS
 * 
 * Production-ready OTP delivery service
 * - Sends SMS via Twilio
 * - Rate limiting and abuse prevention
 * - Proper error handling and logging
 * - Secure secrets management
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendOTPRequest {
  phoneNumber: string
  otp: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { phoneNumber, otp }: SendOTPRequest = await req.json()

    // Validation
    if (!phoneNumber || !otp) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Phone number and OTP are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate phone number format (E.164 format)
    const phoneRegex = /^\+[1-9]\d{1,14}$/
    if (!phoneRegex.test(phoneNumber)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid phone number format. Must be in E.164 format (e.g., +601234567890)' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get Twilio credentials from environment
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.error('Missing Twilio configuration')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'SMS service not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client for rate limiting
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Rate limiting: Check recent OTP requests for this phone number
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data: recentRequests, error: rateLimitError } = await supabase
      .from('otp_requests')
      .select('id')
      .eq('phone_number', phoneNumber)
      .gte('created_at', fiveMinutesAgo)

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError)
      // Continue anyway - don't block on rate limit check failure
    }

    if (recentRequests && recentRequests.length >= 3) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Too many OTP requests. Please wait 5 minutes before trying again.' 
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`
    const twilioAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`)

    const smsBody = `Your Mari Gunting verification code is: ${otp}\n\nValid for 10 minutes. Do not share this code.`

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${twilioAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: phoneNumber,
        From: twilioPhoneNumber,
        Body: smsBody,
      }),
    })

    const twilioData = await twilioResponse.json()

    if (!twilioResponse.ok) {
      console.error('Twilio error:', twilioData)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to send SMS. Please try again.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log the OTP request for rate limiting
    const { error: logError } = await supabase
      .from('otp_requests')
      .insert({
        phone_number: phoneNumber,
        message_sid: twilioData.sid,
        status: twilioData.status,
      })

    if (logError) {
      console.error('Failed to log OTP request:', logError)
      // Don't fail the request if logging fails
    }

    console.log(`✅ OTP sent successfully to ${phoneNumber}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        data: {
          sent: true,
          messageSid: twilioData.sid,
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'An unexpected error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
