/**
 * Authentication Service
 * Handles all auth operations with Supabase
 */

import { supabase } from '../config/supabase';
import { UserRole, Profile } from '../types/database';

// =====================================================
// TYPES
// =====================================================

export interface SignUpWithEmailParams {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  phoneNumber?: string;
}

export interface SignInWithEmailParams {
  email: string;
  password: string;
}

export interface SignInWithPhoneParams {
  phone: string;
}

export interface VerifyOTPParams {
  phone: string;
  token: string;
}

export interface UpdateProfileParams {
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: any;
  session?: any;
}

// =====================================================
// EMAIL AUTHENTICATION
// =====================================================

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async ({
  email,
  password,
  fullName,
  role,
  phoneNumber,
}: SignUpWithEmailParams): Promise<AuthResponse> => {
  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    // 2. Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      full_name: fullName,
      role,
      phone_number: phoneNumber || null,
      is_active: true,
    });

    if (profileError) throw profileError;

    return {
      success: true,
      user: authData.user,
      session: authData.session,
    };
  } catch (error: any) {
    console.error('Sign up error:', error);
    return {
      success: false,
      error: error.message || 'Sign up failed',
    };
  }
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async ({
  email,
  password,
}: SignInWithEmailParams): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  } catch (error: any) {
    console.error('Sign in error:', error);
    return {
      success: false,
      error: error.message || 'Sign in failed',
    };
  }
};

// =====================================================
// PHONE AUTHENTICATION (OTP)
// =====================================================

/**
 * Send OTP to phone number
 */
export const signInWithPhone = async ({
  phone,
}: SignInWithPhoneParams): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (error) throw error;

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Phone sign in error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send OTP',
    };
  }
};

/**
 * Verify OTP code
 */
export const verifyOTP = async ({
  phone,
  token,
}: VerifyOTPParams): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (error) throw error;

    // Check if profile exists, create if not
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (!profile) {
        // Create profile for phone sign-in
        await supabase.from('profiles').insert({
          id: data.user.id,
          full_name: phone, // Placeholder, can be updated later
          role: 'customer',
          phone_number: phone,
          phone_verified: true,
          is_active: true,
        });
      }
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  } catch (error: any) {
    console.error('OTP verification error:', error);
    return {
      success: false,
      error: error.message || 'Invalid OTP code',
    };
  }
};

// =====================================================
// SOCIAL AUTHENTICATION
// =====================================================

/**
 * Sign in with Google
 */
export const signInWithGoogle = async (): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) throw error;

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Google sign in error:', error);
    return {
      success: false,
      error: error.message || 'Google sign in failed',
    };
  }
};

/**
 * Sign in with Apple
 */
export const signInWithApple = async (): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) throw error;

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Apple sign in error:', error);
    return {
      success: false,
      error: error.message || 'Apple sign in failed',
    };
  }
};

// =====================================================
// SESSION MANAGEMENT
// =====================================================

/**
 * Get current user session
 */
export const getCurrentSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
};

/**
 * Get current user profile
 */
export const getCurrentProfile = async (): Promise<Profile | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Get profile error:', error);
    return null;
  }
};

/**
 * Sign out
 */
export const signOut = async (): Promise<AuthResponse> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Sign out error:', error);
    return {
      success: false,
      error: error.message || 'Sign out failed',
    };
  }
};

// =====================================================
// PROFILE MANAGEMENT
// =====================================================

/**
 * Update user profile
 */
export const updateProfile = async (
  userId: string,
  updates: UpdateProfileParams
): Promise<AuthResponse> => {
  try {
    const updateData: any = {};

    if (updates.fullName) updateData.full_name = updates.fullName;
    if (updates.phoneNumber !== undefined) updateData.phone_number = updates.phoneNumber;
    if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl;
    if (updates.dateOfBirth !== undefined) updateData.date_of_birth = updates.dateOfBirth;
    if (updates.gender !== undefined) updateData.gender = updates.gender;
    if (updates.addressLine1 !== undefined) updateData.address_line1 = updates.addressLine1;
    if (updates.addressLine2 !== undefined) updateData.address_line2 = updates.addressLine2;
    if (updates.city !== undefined) updateData.city = updates.city;
    if (updates.state !== undefined) updateData.state = updates.state;
    if (updates.postalCode !== undefined) updateData.postal_code = updates.postalCode;

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (error) throw error;

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Update profile error:', error);
    return {
      success: false,
      error: error.message || 'Profile update failed',
    };
  }
};

/**
 * Update user avatar
 */
export const updateAvatar = async (
  userId: string,
  avatarUrl: string
): Promise<AuthResponse> => {
  return updateProfile(userId, { avatarUrl });
};

// =====================================================
// PASSWORD MANAGEMENT
// =====================================================

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<AuthResponse> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });

    if (error) throw error;

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: error.message || 'Password reset failed',
    };
  }
};

/**
 * Update password
 */
export const updatePassword = async (newPassword: string): Promise<AuthResponse> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Password update error:', error);
    return {
      success: false,
      error: error.message || 'Password update failed',
    };
  }
};

// =====================================================
// AUTH STATE LISTENER
// =====================================================

/**
 * Listen to auth state changes
 */
export const onAuthStateChange = (callback: (session: any) => void) => {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Check if user has specific role
 */
export const hasRole = async (role: UserRole): Promise<boolean> => {
  try {
    const profile = await getCurrentProfile();
    return profile?.role === role;
  } catch (error) {
    return false;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const session = await getCurrentSession();
  return !!session;
};

/**
 * Format phone number to E.164 format (Malaysia)
 * Example: 0123456789 -> +60123456789
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with +60
  if (cleaned.startsWith('0')) {
    return '+60' + cleaned.substring(1);
  }
  
  // If starts with 60, add +
  if (cleaned.startsWith('60')) {
    return '+' + cleaned;
  }
  
  // If doesn't have country code, add +60
  return '+60' + cleaned;
};
