/**
 * Partner Account Service
 * Handles partner account type setup (freelance barber vs barbershop owner)
 */

import { supabase } from '../config/supabase';

export type AccountType = 'freelance' | 'barbershop';

export interface SetupAccountResponse {
  success: boolean;
  barber_id?: string;
  barbershop_id?: string;
  message?: string;
  error?: string;
}

export const partnerAccountService = {
  /**
   * Setup freelance barber account
   * - Keeps role as 'barber'
   * - Creates record in barbers table
   */
  async setupFreelanceBarber(userId: string): Promise<SetupAccountResponse> {
    try {
      console.log('🔧 Setting up freelance barber account for:', userId);

      const { data, error } = await supabase.rpc('setup_freelance_barber', {
        p_user_id: userId,
      });

      if (error) {
        console.error('❌ Freelance barber setup error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log('✅ Freelance barber setup result:', data);
      return data as SetupAccountResponse;
    } catch (error: any) {
      console.error('❌ Freelance barber setup exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to setup freelance barber account',
      };
    }
  },

  /**
   * Setup barbershop owner account
   * - Updates role to 'barbershop_owner'
   * - Creates record in barbershops table
   */
  async setupBarbershopOwner(
    userId: string,
    shopName?: string
  ): Promise<SetupAccountResponse> {
    try {
      console.log('🔧 Setting up barbershop owner account for:', userId);

      const { data, error } = await supabase.rpc('setup_barbershop_owner', {
        p_user_id: userId,
        p_shop_name: shopName || null,
      });

      if (error) {
        console.error('❌ Barbershop owner setup error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log('✅ Barbershop owner setup result:', data);
      return data as SetupAccountResponse;
    } catch (error: any) {
      console.error('❌ Barbershop owner setup exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to setup barbershop owner account',
      };
    }
  },

  /**
   * Setup partner account based on selected type
   * Convenience method that calls the appropriate setup function
   */
  async setupAccount(
    userId: string,
    accountType: AccountType,
    shopName?: string
  ): Promise<SetupAccountResponse> {
    if (accountType === 'freelance') {
      return this.setupFreelanceBarber(userId);
    } else {
      return this.setupBarbershopOwner(userId, shopName);
    }
  },

  /**
   * Check if user has completed account type setup
   */
  async hasCompletedSetup(userId: string): Promise<boolean> {
    try {
      // Check if user has barber or barbershop record
      const { data: barber } = await supabase
        .from('barbers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (barber) return true;

      const { data: barbershop } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle();

      return !!barbershop;
    } catch (error) {
      console.error('❌ Check setup error:', error);
      return false;
    }
  },

  /**
   * Get account type for user
   */
  async getAccountType(userId: string): Promise<AccountType | null> {
    try {
      const { data: barber } = await supabase
        .from('barbers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (barber) return 'freelance';

      const { data: barbershop } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle();

      if (barbershop) return 'barbershop';

      return null;
    } catch (error) {
      console.error('❌ Get account type error:', error);
      return null;
    }
  },
};
