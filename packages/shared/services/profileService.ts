import { supabase } from '../config/supabase';
import { uploadImage } from './cloudinaryUpload';

// Development mode configuration
const IS_DEV_MODE = process.env.EXPO_PUBLIC_APP_ENV === 'development';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const UPDATE_PROFILE_URL = SUPABASE_URL + '/functions/v1/register-user?operation=update';

export interface UpdateProfileInput {
  full_name?: string;
  email?: string;
  avatar_url?: string;
}

export const profileService = {
  /**
   * Get user profile by ID
   */
  async getProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      // Map avatar_url to avatar for consistency
      if (data && data.avatar_url) {
        data.avatar = data.avatar_url;
      }
      
      return data;
    } catch (error) {
      console.error('[profileService] getProfile error:', error);
      throw error;
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: UpdateProfileInput) {
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
      
      if (error) throw error;
      
      // Map avatar_url to avatar for consistency
      if (data && data.avatar_url) {
        data.avatar = data.avatar_url;
      }
      
      return data;
    } catch (error) {
      console.error('[profileService] updateProfile error:', error);
      throw error;
    }
  },

  /**
   * Upload avatar and update profile (with Cloudinary + Supabase fallback)
   */
  async updateAvatar(userId: string, imageUri: string) {
    try {
      console.log('[profileService] Starting avatar upload for user:', userId);
      
      // 1. Upload image (tries Cloudinary first, falls back to Supabase)
      const uploadResult = await uploadImage(imageUri, 'AVATAR', userId);
      
      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Failed to upload avatar');
      }
      
      console.log('[profileService] Avatar uploaded successfully:', uploadResult.url);
      
      // 2. Update profile with new URL
      let updateSuccess = false;
      
      if (IS_DEV_MODE) {
        // Dev mode: Use edge function to bypass RLS
        console.log('[profileService] DEV MODE: Using edge function for update');
        
        const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
        if (!anonKey) {
          throw new Error('Configuration error: Missing anon key');
        }

        const response = await fetch(UPDATE_PROFILE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
            'apikey': anonKey,
          },
          body: JSON.stringify({
            userId,
            updates: {
              avatar_url: uploadResult.url,
            },
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          console.error('[profileService] Edge function update error:', result.error);
          throw new Error(result.error || 'Failed to update profile');
        }
        
        updateSuccess = true;
        console.log('[profileService] Profile updated via edge function');
      } else {
        // Production mode: Direct update
        const { error } = await supabase
          .from('profiles')
          .update({ 
            avatar_url: uploadResult.url,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
        
        if (error) {
          console.error('[profileService] Database update error:', error);
          throw error;
        }
        
        updateSuccess = true;
        console.log('[profileService] Profile updated in database');
      }
      
      // 3. Fetch the updated profile
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (fetchError) {
        console.error('[profileService] Fetch error:', fetchError);
      }
      
      if (!updatedProfile) {
        console.warn('[profileService] Could not fetch updated profile, returning URL only');
        // Return a minimal profile object with the new avatar
        return {
          id: userId,
          avatar_url: uploadResult.url,
          avatar: uploadResult.url,
        } as any;
      }
      
      console.log('[profileService] Fetched profile:', {
        id: updatedProfile.id,
        avatar_url: updatedProfile.avatar_url,
        full_name: updatedProfile.full_name,
      });
      
      // Map avatar_url to avatar for consistency
      if (updatedProfile.avatar_url) {
        updatedProfile.avatar = updatedProfile.avatar_url;
      }
      
      return updatedProfile;
    } catch (error) {
      console.error('[profileService] updateAvatar error:', error);
      throw error;
    }
  },

  /**
   * Refresh profile from database
   */
  async refreshProfile(userId: string) {
    return this.getProfile(userId);
  },

  /**
   * Check if email is verified
   */
  async checkEmailVerification(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('email_verified, email_verified_at')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data.email_verified;
    } catch (error) {
      console.error('[profileService] checkEmailVerification error:', error);
      return false;
    }
  },

  /**
   * Send email verification
   */
  async sendEmailVerification(email: string) {
    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[profileService] sendEmailVerification error:', error);
      throw error;
    }
  },
};
