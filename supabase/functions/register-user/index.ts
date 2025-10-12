/**
 * Supabase Edge Function: Register User
 * 
 * Handles user registration with service role permissions
 * This bypasses RLS issues in dev mode where sessions aren't created
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RegisterRequest {
  phoneNumber: string
  fullName: string
  email: string
  role: 'customer' | 'barber'
  avatarUrl?: string | null
  authUserId: string // The auth user ID from client
}

interface UpdateProfileRequest {
  userId: string
  updates: {
    avatar_url?: string
    full_name?: string
    email?: string
  }
}

// Handle profile updates with service role
async function handleProfileUpdate(req: Request) {
  try {
    const { userId, updates }: UpdateProfileRequest = await req.json()

    if (!userId || !updates) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing userId or updates' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client with SERVICE ROLE key (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Update profile using service role
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Profile update error:', error)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to update profile' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`✅ Profile updated successfully: ${userId}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        data
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Update profile error:', error)
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
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the URL path to determine which operation
    const url = new URL(req.url)
    const operation = url.searchParams.get('operation') || 'register'

    // Handle profile update
    if (operation === 'update') {
      return await handleProfileUpdate(req)
    }

    // Handle registration (default)
    // Parse request body
    const { phoneNumber, fullName, email, role, avatarUrl, authUserId }: RegisterRequest = await req.json()

    // Validation
    if (!phoneNumber || !fullName || !email || !role || !authUserId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing required fields' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client with SERVICE ROLE key (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if phone number already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone_number', phoneNumber)
      .maybeSingle()

    if (existingProfile) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'This phone number is already registered. Please log in instead.' 
        }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create profile using service role (bypasses RLS)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUserId,
        phone_number: phoneNumber,
        full_name: fullName,
        email: email,
        avatar_url: avatarUrl,
        role: role,
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to create user profile' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`✅ User registered successfully: ${profileData.id}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        data: profileData
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
