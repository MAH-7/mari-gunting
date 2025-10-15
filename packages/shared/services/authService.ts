/**
 * Authentication Service - Real Supabase Integration
 * Handles user registration, login, and profile management
 */

import { supabase } from '../config/supabase';
import { ApiResponse } from '../types';
import Constants from 'expo-constants';

// Production mode - no test OTP, real SMS only
const IS_PRODUCTION = true;

// Debug logging
console.log('🔧 Auth Service Config:', {
  IS_PRODUCTION,
  APP_ENV: process.env.EXPO_PUBLIC_APP_ENV || 'production',
});

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
        // Normalize both phone numbers (remove +, spaces, dashes for comparison)
        const normalizePhone = (phone: string) => phone.replace(/[^0-9]/g, '');
        const authPhone = normalizePhone(currentUser.phone || '');
        const regPhone = normalizePhone(params.phoneNumber);
        
        if (currentUser.phone && authPhone !== regPhone) {
          console.error('❌ Phone mismatch! Auth:', currentUser.phone, 'Registering:', params.phoneNumber);
          console.error('   Normalized - Auth:', authPhone, 'Reg:', regPhone);
          // Sign out the mismatched user
          await supabase.auth.signOut();
          return {
            success: false,
            error: 'Session mismatch. Please try logging in again.',
          };
        }
        
        console.log('✅ Phone numbers match (normalized):', authPhone);
        
        userId = currentUser.id;
      } else {
        // Create real auth user (both dev and production)
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
      
      // 2. Create user profile
      console.log('ℹ️ Attempting to insert profile with ID:', userId);
      console.log('ℹ️ Phone number:', params.phoneNumber);
      
      // Insert profile (auth user exists now, so foreign key will work)
      const { data: profileData, error: profileError } = await supabase
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
        
        // If RLS blocks it, provide helpful error
        if (profileError.code === '42501') {
          console.error('❌ RLS is blocking profile insert. You need to:');
          console.error('   1. Deploy edge function: supabase functions deploy register-user');
          console.error('   2. Or adjust RLS policies to allow authenticated inserts');
        }
        
        // If foreign key error, something is wrong with auth
        if (profileError.code === '23503') {
          console.error('❌ Foreign key constraint error - auth user does not exist');
          console.error('   User ID:', userId);
        }
        
        return {
          success: false,
          error: `Failed to create profile: ${profileError.message}`,
        };
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
   * Uses Supabase built-in OTP (SMS via Twilio)
   */
  async sendOTP(params: LoginParams): Promise<ApiResponse<{ sent: boolean }>> {
    try {
      console.log('📱 Sending OTP to:', params.phoneNumber);
      
      // Use Supabase's built-in signInWithOtp
      // This automatically sends SMS via Twilio if configured in Supabase
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: params.phoneNumber,
        options: {
          // Optional: customize the OTP message
          // channel: 'sms', // or 'whatsapp' if configured
        },
      });

      if (error) {
        console.error('❌ OTP send error:', error);
        return {
          success: false,
          error: error.message || 'Failed to send OTP',
        };
      }

      console.log('✅ OTP sent successfully to:', params.phoneNumber);
      console.log('ℹ️ Supabase response:', data);

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
    console.log('🔍 verifyOTP called with:', { phoneNumber });

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
