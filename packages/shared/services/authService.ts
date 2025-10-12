/**
 * Authentication Service - Real Supabase Integration
 * Handles user registration, login, and profile management
 */

import { supabase } from '../config/supabase';
import { ApiResponse } from '../types';
import Constants from 'expo-constants';

// Development mode configuration
// SECURITY: Only allow test OTP in actual development/local builds
// NOT in production or staging, even if APP_ENV is somehow set wrong
const IS_DEV_MODE = 
  process.env.EXPO_PUBLIC_APP_ENV === 'development' && 
  __DEV__; // React Native debug mode

const IS_PRODUCTION = process.env.EXPO_PUBLIC_APP_ENV === 'production';
const TEST_OTP = '123456';

// Debug logging for environment detection
console.log('🔧 Auth Service Config:', {
  IS_DEV_MODE,
  IS_PRODUCTION,
  APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
  __DEV__,
  appOwnership: Constants.appOwnership,
});
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const OTP_FUNCTION_URL = SUPABASE_URL + '/functions/v1/send-otp';
const REGISTER_FUNCTION_URL = SUPABASE_URL + '/functions/v1/register-user';

export interface RegisterParams {
  phoneNumber: string;
  fullName: string;
  email: string;
  role: 'customer' | 'barber';
  avatarUrl?: string | null;
}

export interface LoginParams {
  phoneNumber: string;
}

export interface UserProfile {
  id: string;
  phone_number: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: 'customer' | 'barber';
  created_at: string;
  updated_at: string;
}

export const authService = {
  /**
   * Register a new user
   * Creates auth user and profile in one transaction
   */
  async register(params: RegisterParams): Promise<ApiResponse<UserProfile>> {
    try {
      // STEP 1: Check if this phone number already has a profile
      console.log('🔍 Checking if phone number already registered:', params.phoneNumber);
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone_number', params.phoneNumber)
        .maybeSingle();
      
      if (existingProfile) {
        console.error('❌ Phone number already registered:', params.phoneNumber);
        return {
          success: false,
          error: 'This phone number is already registered. Please log in instead.',
        };
      }
      
      // STEP 2: Check if user already has an auth account (from OTP verification)
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      let userId: string;
      let newlyCreated = false;
      
      if (currentUser) {
        // User already authenticated via OTP, just create profile
        console.log('ℹ️ User already authenticated, creating profile');
        console.log('ℹ️ Current user ID:', currentUser.id);
        console.log('ℹ️ Current user phone:', currentUser.phone);
        
        // IMPORTANT: Verify the authenticated user matches the registration phone
        if (currentUser.phone && currentUser.phone !== params.phoneNumber) {
          console.error('❌ Phone mismatch! Auth:', currentUser.phone, 'Registering:', params.phoneNumber);
          // Sign out the mismatched user
          await supabase.auth.signOut();
          return {
            success: false,
            error: 'Session mismatch. Please try logging in again.',
          };
        }
        
        userId = currentUser.id;
      } else {
        // DEV MODE: Skip Supabase auth, use deterministic UUID
        if (IS_DEV_MODE) {
          console.log('✅ DEV MODE: Skipping auth user creation, using deterministic UUID');
          // Generate a deterministic UUID from phone number
          userId = generateDevUUID(params.phoneNumber);
          console.log('🆔 Generated dev UUID:', userId);
          newlyCreated = true;
        } else {
          // PRODUCTION: Create real auth user
          console.log('ℹ️ No authenticated user, creating new auth user');
          
          const tempPassword = generateTemporaryPassword();
          const { data: authData, error: authError } = await supabase.auth.signUp({
            phone: params.phoneNumber,
            password: tempPassword,
            options: {
              data: {
                full_name: params.fullName,
                email: params.email,
                role: params.role,
              },
            },
          });

          if (authError) {
            console.error('❌ Auth registration error:', authError);
            return {
              success: false,
              error: authError.message,
            };
          }

          if (!authData.user) {
            return {
              success: false,
              error: 'Failed to create user account',
            };
          }
          
          userId = authData.user.id;
          newlyCreated = true;
          console.log('✅ Created new auth user:', userId);
        }
      }
      
      // 2. Create user profile
      console.log('ℹ️ Attempting to insert profile with ID:', userId);
      console.log('ℹ️ Phone number:', params.phoneNumber);
      
      let profileData;
      
      // In dev mode, insert directly to database (RLS won't block mock user IDs)
      if (IS_DEV_MODE) {
        console.log('🔧 DEV MODE: Inserting profile directly to database');
        
        // Direct insert - RLS should allow for dev mock IDs
        const { data, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            phone_number: params.phoneNumber,
            full_name: params.fullName,
            email: params.email,
            avatar_url: params.avatarUrl,
            role: params.role,
          })
          .select()
          .single();

        if (profileError) {
          console.error('❌ DEV MODE: Profile creation error:', profileError);
          
          // If RLS blocks it, provide helpful error
          if (profileError.code === '42501') {
            console.error('❌ RLS is blocking profile insert. You need to:');
            console.error('   1. Deploy edge function: supabase functions deploy register-user');
            console.error('   2. Or adjust RLS policies to allow dev mode inserts');
          }
          
          return {
            success: false,
            error: `Failed to create profile: ${profileError.message}`,
          };
        }

        profileData = data;
      } else {
        // Production mode: Direct insert (session should exist)
        const { data, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            phone_number: params.phoneNumber,
            full_name: params.fullName,
            email: params.email,
            avatar_url: params.avatarUrl,
            role: params.role,
          })
          .select()
          .single();

        if (profileError) {
          console.error('❌ Profile creation error:', profileError);
          return {
            success: false,
            error: 'Failed to create user profile',
          };
        }
        
        profileData = data;
      }

      console.log('✅ User registered successfully:', profileData.id);

      return {
        success: true,
        data: profileData,
      };
    } catch (error: any) {
      console.error('❌ Registration exception:', error);
      return {
        success: false,
        error: error.message || 'Registration failed',
      };
    }
  },

  /**
   * Send OTP to phone number for login
   * DEV MODE: Uses test OTP 123456
   * PRODUCTION: Sends real SMS via Twilio edge function
   */
  async sendOTP(params: LoginParams): Promise<ApiResponse<{ sent: boolean }>> {
    // DEV MODE: Skip real OTP, use test OTP
    if (IS_DEV_MODE) {
      console.log(`🔐 DEV MODE: OTP for ${params.phoneNumber} is: ${TEST_OTP}`);
      console.log('📱 SMS would be sent via Twilio in production');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return {
        success: true,
        data: { sent: true },
      };
    }

    // PRODUCTION MODE: Send real OTP via Twilio edge function
    try {
      // Generate a random 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Get the anon key for edge function authentication
      const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!anonKey) {
        console.error('❌ Missing Supabase anon key');
        return {
          success: false,
          error: 'Configuration error',
        };
      }

      // Call the edge function to send OTP via Twilio
      const response = await fetch(OTP_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({
          phoneNumber: params.phoneNumber,
          otp,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('❌ OTP send error:', result.error);
        return {
          success: false,
          error: result.error || 'Failed to send OTP',
        };
      }

      // Store OTP temporarily in Supabase auth for verification
      // We use signUp with the OTP as password to create/update auth user
      const { error: authError } = await supabase.auth.signUp({
        phone: params.phoneNumber,
        password: otp, // Temporary password that matches the OTP
      });

      if (authError && !authError.message.includes('already registered')) {
        console.error('❌ Auth OTP storage error:', authError);
        // Don't fail - SMS was sent successfully
      }

      console.log('✅ OTP sent successfully to:', params.phoneNumber);

      return {
        success: true,
        data: { sent: true },
      };
    } catch (error: any) {
      console.error('❌ OTP send exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to send OTP',
      };
    }
  },

  /**
   * Verify OTP and login
   */
  async verifyOTP(
    phoneNumber: string,
    otp: string
  ): Promise<ApiResponse<{ user: UserProfile; session: any }>> {
    console.log('🔍 verifyOTP called with:', { phoneNumber, otp, IS_DEV_MODE, IS_PRODUCTION, TEST_OTP });
    console.log('🔍 Comparison:', { otpMatch: otp === TEST_OTP, devMode: IS_DEV_MODE, combined: IS_DEV_MODE && otp === TEST_OTP });
    
    // DEV MODE: Accept test OTP and create authenticated session
    // SECURITY: Extra check to ensure NOT in production
    if (IS_DEV_MODE && otp === TEST_OTP && !IS_PRODUCTION) {
      console.log(`✅ DEV MODE: Accepting test OTP ${TEST_OTP}`);
      
      try {
        // Check if auth user exists
        let authUserId: string | undefined;
        
        // Try to get existing session first
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (existingSession?.user) {
          console.log('ℹ️ Found existing auth session');
          authUserId = existingSession.user.id;
          
          // Check if this session has a profile
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', existingSession.user.id)
            .maybeSingle();
          
          if (!existingProfile) {
            console.log('⚠️ Session has no profile, signing out old session');
            await supabase.auth.signOut();
            authUserId = undefined; // Force new auth user creation
          }
        }
        
        if (!authUserId) {
          // DEV MODE: Skip Supabase auth entirely, just use profile IDs
          console.log('ℹ️ DEV MODE: Skipping Supabase auth, checking profile directly...');
          
          // Check if user profile exists
          const { data: existingProfileByPhone } = await supabase
            .from('profiles')
            .select('id')
            .eq('phone_number', phoneNumber)
            .maybeSingle();
          
          if (existingProfileByPhone?.id) {
            console.log('✅ DEV MODE: Found existing profile:', existingProfileByPhone.id);
            authUserId = existingProfileByPhone.id;
          } else {
            console.log('ℹ️ DEV MODE: No profile found, will need registration');
            // Generate a deterministic UUID for dev mode
            authUserId = generateDevUUID(phoneNumber);
          }
        }
        
        console.log('ℹ️ Auth user ID:', authUserId);
        
        // Now check if profile exists
        console.log('ℹ️ Checking for profile with phone:', phoneNumber);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('phone_number', phoneNumber)
          .maybeSingle();

        if (profileError) {
          console.error('❌ Profile check error:', profileError);
        }
        
        console.log('🔍 Profile query result:', { found: !!profileData, role: profileData?.role });

        if (profileData) {
          // Existing user with profile
          console.log('✅ Found existing user:', profileData.full_name, '| Role:', profileData.role);
          return {
            success: true,
            data: {
              user: profileData,
              session: { mock: true }, // Mock session for dev
            },
          };
        } else {
          // New user - needs to complete registration
          console.log('ℹ️ New user - will need to register');
          return {
            success: true,
            data: {
              user: null as any,
              session: { mock: true },
              needsRegistration: true,
            } as any,
          };
        }
      } catch (error: any) {
        console.error('❌ DEV MODE error:', error);
        return {
          success: false,
          error: error.message || 'Dev mode authentication failed',
        };
      }
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otp,
        type: 'sms',
      });

      if (error) {
        console.error('❌ OTP verification error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'Invalid OTP',
        };
      }

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('❌ Profile fetch error:', profileError);
        return {
          success: false,
          error: 'Failed to fetch user profile',
        };
      }

      // If no profile exists, this is a new user - need to register
      if (!profile) {
        console.log('ℹ️ New user verified - needs to complete registration');
        return {
          success: true,
          data: {
            user: null as any,
            session: data.session,
            needsRegistration: true,
          } as any,
        };
      }

      console.log('✅ User logged in:', profile.id);

      return {
        success: true,
        data: {
          user: profile,
          session: data.session,
        },
      };
    } catch (error: any) {
      console.error('❌ OTP verification exception:', error);
      return {
        success: false,
        error: error.message || 'OTP verification failed',
      };
    }
  },

  /**
   * Check if phone number is registered
   */
  async checkPhoneExists(phoneNumber: string): Promise<ApiResponse<{ exists: boolean; role?: string }>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('phone_number', phoneNumber)
        .maybeSingle();

      if (error) {
        console.error('❌ Phone check error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: {
          exists: !!data,
          role: data?.role,
        },
      };
    } catch (error: any) {
      console.error('❌ Phone check exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to check phone number',
      };
    }
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<ApiResponse<UserProfile | null>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error('❌ Get user error:', authError);
        return {
          success: false,
          error: authError.message,
        };
      }

      if (!user) {
        return {
          success: true,
          data: null,
        };
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('❌ Profile fetch error:', profileError);
        return {
          success: false,
          error: profileError.message,
        };
      }

      return {
        success: true,
        data: profile,
      };
    } catch (error: any) {
      console.error('❌ Get current user exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to get current user',
      };
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<ApiResponse<UserProfile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Profile update error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log('✅ Profile updated:', userId);

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('❌ Profile update exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to update profile',
      };
    }
  },

  /**
   * Logout user
   */
  async logout(): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('❌ Logout error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log('✅ User logged out');

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('❌ Logout exception:', error);
      return {
        success: false,
        error: error.message || 'Logout failed',
      };
    }
  },

  /**
   * Delete user account
   */
  async deleteAccount(userId: string): Promise<ApiResponse<void>> {
    try {
      // Delete profile first
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('❌ Profile deletion error:', profileError);
        return {
          success: false,
          error: profileError.message,
        };
      }

      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
        console.error('❌ Auth deletion error:', authError);
        return {
          success: false,
          error: authError.message,
        };
      }

      console.log('✅ Account deleted:', userId);

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('❌ Account deletion exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete account',
      };
    }
  },
};

/**
 * Generate a random temporary password for phone auth
 * (Supabase requires a password even for phone auth)
 */
function generateTemporaryPassword(): string {
  return Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
}

/**
 * Generate a deterministic UUID from phone number for dev mode
 * Always returns the same UUID for the same phone number
 */
function generateDevUUID(phoneNumber: string): string {
  // Extract digits only
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Pad to ensure we have enough digits
  const paddedDigits = digits.padEnd(32, '0');
  
  // Format as UUID (8-4-4-4-12)
  const uuid = [
    paddedDigits.substring(0, 8),
    paddedDigits.substring(8, 12),
    paddedDigits.substring(12, 16),
    paddedDigits.substring(16, 20),
    paddedDigits.substring(20, 32),
  ].join('-');
  
  return uuid;
}
