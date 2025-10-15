/**
 * Barber Service
 * Handles fetching and updating barber profile data
 */

import { supabase } from '../config/supabase';
import { Barber as BarberDB } from '../types/database';

export interface BarberProfile {
  // User profile data
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  isOnline: boolean;
  
  // Barber-specific data
  barberId: string;
  bio: string;
  rating: number;
  totalReviews: number;
  completedJobs: number;
  experience: number;
  specializations: string[];
  photos: string[];
  isVerified: boolean;
  isAvailable: boolean;
  joinedDate: string;
  
  // Bank/Payout fields
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  
  // Verification documents
  verificationDocuments?: {
    ic_front?: string;
    ic_back?: string;
    selfie?: string;
    certificates?: string[];
  };
  
  // Additional fields
  verificationStatus?: string;
  serviceRadiusKm?: number;
  workingHours?: any;
}

export const barberService = {
  /**
   * Get barber profile by user ID
   * Combines data from profiles and barbers tables
   */
  async getBarberProfileByUserId(userId: string): Promise<BarberProfile | null> {
    try {
      // Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error('[barberService] Profile fetch error:', profileError);
        throw profileError;
      }
      
      if (!profile) {
        console.error('[barberService] Profile not found');
        return null;
      }
      
      // Fetch barber data
      const { data: barber, error: barberError } = await supabase
        .from('barbers')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (barberError) {
        console.error('[barberService] Barber fetch error:', barberError);
        throw barberError;
      }
      
      if (!barber) {
        console.error('[barberService] Barber record not found');
        return null;
      }
      
      // Combine the data
      const barberProfile: BarberProfile = {
        // Profile data
        id: profile.id,
        name: profile.full_name || 'Unknown',
        email: profile.email || '',
        phone: profile.phone_number || '',
        avatar: profile.avatar_url || undefined,
        isOnline: profile.is_online || false,
        
        // Barber data
        barberId: barber.id,
        bio: barber.bio || '',
        rating: barber.rating || 0,
        totalReviews: barber.total_reviews || 0,
        completedJobs: barber.completed_bookings || 0,
        experience: barber.experience_years || 0,
        specializations: barber.specializations || [],
        photos: barber.portfolio_images || [],
        isVerified: barber.is_verified || false,
        isAvailable: barber.is_available || false,
        joinedDate: barber.created_at,
        
        // Bank/Payout data
        bankName: barber.bank_name || undefined,
        bankAccountNumber: barber.bank_account_number || undefined,
        bankAccountName: barber.bank_account_name || undefined,
        
        // Verification documents (parse JSON string if needed)
        verificationDocuments: typeof barber.verification_documents === 'string' 
          ? JSON.parse(barber.verification_documents)
          : barber.verification_documents || undefined,
        
        verificationStatus: barber.verification_status,
        serviceRadiusKm: barber.service_radius_km || 0,
        workingHours: barber.working_hours,
      };
      
      return barberProfile;
    } catch (error) {
      console.error('[barberService] Error fetching barber profile:', error);
      return null;
    }
  },
  
  /**
   * Update barber's online status
   */
  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_online: isOnline,
          last_seen_at: new Date().toISOString(),
        })
        .eq('id', userId);
      
      if (error) {
        console.error('[barberService] Error updating online status:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[barberService] Exception updating online status:', error);
      return false;
    }
  },
  
  /**
   * Get barber stats (earnings, jobs, etc.)
   */
  async getBarberStats(userId: string, period: 'week' | 'month' | 'all' = 'week') {
    try {
      // TODO: Implement real stats fetching from bookings/payments tables
      // For now, return mock data
      return {
        earnings: 'RM 1,240',
        jobs: 12,
        rating: 4.9,
      };
    } catch (error) {
      console.error('[barberService] Error fetching stats:', error);
      return {
        earnings: 'RM 0',
        jobs: 0,
        rating: 0,
      };
    }
  },
  
  /**
   * Update barber profile
   */
  async updateBarberProfile(barberId: string, data: Partial<BarberDB>): Promise<boolean> {
    try {
      const { data: result, error, count } = await supabase
        .from('barbers')
        .update(data)
        .eq('id', barberId)
        .select();
      
      if (error) {
        console.error('[barberService] Error updating barber profile:', error);
        return false;
      }
      
      if (!result || result.length === 0) {
        console.error('[barberService] No rows were updated. Barber ID might not exist:', barberId);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[barberService] Exception updating barber profile:', error);
      return false;
    }
  },
  
  /**
   * Check if barber can change service radius (24-hour cooldown)
   * Uses server-side time to prevent client-side clock manipulation
   */
  async canChangeServiceRadius(barberId: string): Promise<{
    canChange: boolean;
    hoursRemaining: number;
    lastChangedAt: string | null;
  }> {
    try {
      // Use Supabase RPC to calculate time difference on server side
      // This prevents client-side clock manipulation
      const { data, error } = await supabase.rpc('check_radius_cooldown', {
        barber_id: barberId,
      });
      
      if (error) {
        console.error('[barberService] Error checking radius cooldown:', error);
        return { canChange: false, hoursRemaining: 0, lastChangedAt: null };
      }
      
      // RPC returns an array, get the first row
      if (!data || data.length === 0) {
        return { canChange: false, hoursRemaining: 0, lastChangedAt: null };
      }
      
      const result = data[0];
      
      return {
        canChange: result.can_change || false,
        hoursRemaining: result.hours_remaining || 0,
        lastChangedAt: result.last_changed_at || null,
      };
    } catch (error) {
      console.error('[barberService] Exception checking radius cooldown:', error);
      return { canChange: false, hoursRemaining: 0, lastChangedAt: null };
    }
  },
  
  /**
   * Update service radius with 24-hour cooldown enforcement
   */
  async updateServiceRadius(
    barberId: string,
    newRadius: number
  ): Promise<{
    success: boolean;
    message: string;
    hoursRemaining?: number;
  }> {
    try {
      // Validate radius
      if (!Number.isInteger(newRadius) || newRadius < 1 || newRadius > 20) {
        return {
          success: false,
          message: 'Invalid radius. Must be between 1 and 20 km.',
        };
      }
      
      // Check cooldown
      const cooldownCheck = await this.canChangeServiceRadius(barberId);
      
      if (!cooldownCheck.canChange) {
        return {
          success: false,
          message: `You can change your service radius again in ${cooldownCheck.hoursRemaining} hours.`,
          hoursRemaining: cooldownCheck.hoursRemaining,
        };
      }
      
      // Update radius with cooldown timestamp using server time
      // Using NOW() function ensures server-side timestamp
      const { data, error } = await supabase.rpc('update_service_radius', {
        barber_id: barberId,
        new_radius: newRadius,
      });
      
      if (error) {
        console.error('[barberService] Error updating service radius:', error);
        return {
          success: false,
          message: 'Failed to update service radius. Please try again.',
        };
      }
      
      // RPC function returns array with single row
      if (!data || data.length === 0) {
        return {
          success: false,
          message: 'Barber not found.',
        };
      }
      
      const result = data[0];
      
      // Check if the server-side validation failed
      if (!result.success) {
        // This means cooldown is still active (server rejected the change)
        // Re-check cooldown to get accurate remaining hours
        const cooldownCheck = await this.canChangeServiceRadius(barberId);
        return {
          success: false,
          message: `You can change your service radius again in ${cooldownCheck.hoursRemaining} hours.`,
          hoursRemaining: cooldownCheck.hoursRemaining,
        };
      }
      
      console.log(`[barberService] Service radius updated to ${newRadius}km for barber ${barberId}`);
      
      return {
        success: true,
        message: `Service radius updated to ${newRadius}km successfully!`,
      };
    } catch (error) {
      console.error('[barberService] Exception updating service radius:', error);
      return {
        success: false,
        message: 'An error occurred. Please try again.',
      };
    }
  },
};
