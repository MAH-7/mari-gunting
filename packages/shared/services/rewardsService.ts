import { supabase } from '@mari-gunting/shared';

// Types
export interface Voucher {
  id: string;
  code: string;
  title: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  points_cost: number;
  min_spend: number;
  max_discount?: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserVoucher {
  id: string;
  user_id: string;
  voucher_id: string;
  voucher: Voucher;
  redeemed_at: string;
  points_spent: number;
  status: 'active' | 'used' | 'expired';
  used_at?: string;
  used_for_booking_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PointsTransaction {
  id: string;
  user_id: string;
  type: 'earn' | 'redeem' | 'refund' | 'admin_adjustment';
  amount: number;
  balance_after: number;
  description: string;
  booking_id?: string;
  voucher_id?: string;
  user_voucher_id?: string;
  created_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  type: 'add' | 'deduct';
  source: 'refund' | 'compensation' | 'promo' | 'booking_payment' | 'admin' | 'referral' | 'welcome_bonus';
  amount: number;
  balance_after: number;
  description: string;
  booking_id?: string;
  metadata?: any;
  created_at: string;
}

export const rewardsService = {
  /**
   * Get all available vouchers (active and not expired)
   */
  async getAvailableVouchers(): Promise<Voucher[]> {
    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('is_active', true)
        .gt('valid_until', new Date().toISOString())
        .order('is_featured', { ascending: false })
        .order('points_cost', { ascending: true });

      if (error) {
        console.error('[rewardsService] getAvailableVouchers error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[rewardsService] getAvailableVouchers error:', error);
      throw error;
    }
  },

  /**
   * Get user's current points balance
   */
  async getUserPoints(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('points_balance')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[rewardsService] getUserPoints error:', error);
        throw error;
      }

      return data?.points_balance || 0;
    } catch (error) {
      console.error('[rewardsService] getUserPoints error:', error);
      throw error;
    }
  },

  /**
   * Get user's redeemed vouchers
   */
  async getUserVouchers(userId: string): Promise<UserVoucher[]> {
    try {
      const { data, error } = await supabase
        .from('user_vouchers')
        .select(`
          *,
          voucher:vouchers(*)
        `)
        .eq('user_id', userId)
        .order('redeemed_at', { ascending: false });

      if (error) {
        console.error('[rewardsService] getUserVouchers error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[rewardsService] getUserVouchers error:', error);
      throw error;
    }
  },

  /**
   * Get user's points transaction history
   */
  async getPointsHistory(userId: string): Promise<PointsTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[rewardsService] getPointsHistory error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[rewardsService] getPointsHistory error:', error);
      throw error;
    }
  },

  /**
   * Redeem a voucher using points
   */
  async redeemVoucher(userId: string, voucherId: string): Promise<string> {
    try {
      // Call the database function
      const { data, error } = await supabase.rpc('redeem_voucher', {
        p_user_id: userId,
        p_voucher_id: voucherId,
      });

      if (error) {
        console.error('[rewardsService] redeemVoucher error:', error);
        
        // Parse error message for user-friendly display
        if (error.message.includes('Insufficient points')) {
          throw new Error('You don\'t have enough points to redeem this voucher');
        } else if (error.message.includes('already redeemed')) {
          throw new Error('You have already redeemed this voucher');
        } else if (error.message.includes('not found or expired')) {
          throw new Error('This voucher is no longer available');
        } else if (error.message.includes('redemption limit reached')) {
          throw new Error('This voucher has reached its redemption limit');
        }
        
        throw error;
      }

      console.log('[rewardsService] Voucher redeemed successfully:', data);
      return data; // Returns user_voucher_id
    } catch (error) {
      console.error('[rewardsService] redeemVoucher error:', error);
      throw error;
    }
  },

  /**
   * Mark a voucher as used for a booking
   */
  async useVoucher(userVoucherId: string, bookingId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('use_voucher', {
        p_user_voucher_id: userVoucherId,
        p_booking_id: bookingId,
      });

      if (error) {
        console.error('[rewardsService] useVoucher error:', error);
        
        if (error.message.includes('expired')) {
          throw new Error('This voucher has expired');
        } else if (error.message.includes('already used')) {
          throw new Error('This voucher has already been used');
        }
        
        throw error;
      }

      console.log('[rewardsService] Voucher marked as used successfully');
      return data;
    } catch (error) {
      console.error('[rewardsService] useVoucher error:', error);
      throw error;
    }
  },

  /**
   * Apply voucher to a booking (creates booking_voucher record)
   */
  async applyVoucherToBooking(
    bookingId: string,
    userVoucherId: string,
    originalTotal: number,
    discountApplied: number,
    finalTotal: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('apply_voucher_to_booking', {
        p_booking_id: bookingId,
        p_user_voucher_id: userVoucherId,
        p_original_total: originalTotal,
        p_discount_applied: discountApplied,
        p_final_total: finalTotal,
      });

      if (error) {
        console.error('[rewardsService] applyVoucherToBooking error:', error);
        throw error;
      }

      if (data && !data.success) {
        console.error('[rewardsService] applyVoucherToBooking failed:', data.error);
        return { success: false, error: data.error };
      }

      console.log('[rewardsService] Voucher applied to booking successfully');
      return { success: true };
    } catch (error: any) {
      console.error('[rewardsService] applyVoucherToBooking error:', error);
      return {
        success: false,
        error: error.message || 'Failed to apply voucher to booking',
      };
    }
  },

  /**
   * Check if user has already redeemed a specific voucher
   */
  async hasRedeemedVoucher(userId: string, voucherId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_vouchers')
        .select('id')
        .eq('user_id', userId)
        .eq('voucher_id', voucherId)
        .limit(1);

      if (error) {
        console.error('[rewardsService] hasRedeemedVoucher error:', error);
        return false;
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('[rewardsService] hasRedeemedVoucher error:', error);
      return false;
    }
  },

  /**
   * Get active vouchers that user can use (not expired, status = active)
   */
  async getActiveUserVouchers(userId: string): Promise<UserVoucher[]> {
    try {
      const { data, error } = await supabase
        .from('user_vouchers')
        .select(`
          *,
          voucher:vouchers(*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('redeemed_at', { ascending: false });

      if (error) {
        console.error('[rewardsService] getActiveUserVouchers error:', error);
        throw error;
      }

      // Filter out vouchers that have expired
      const now = new Date();
      const activeVouchers = (data || []).filter((uv) => {
        const validUntil = new Date(uv.voucher.valid_until);
        return validUntil > now;
      });

      return activeVouchers;
    } catch (error) {
      console.error('[rewardsService] getActiveUserVouchers error:', error);
      throw error;
    }
  },

  /**
   * Calculate discount from a voucher
   */
  calculateDiscount(voucher: Voucher, subtotal: number): number {
    if (subtotal < voucher.min_spend) {
      return 0;
    }

    let discount = 0;

    if (voucher.type === 'fixed') {
      discount = Math.min(voucher.value, subtotal);
    } else if (voucher.type === 'percentage') {
      discount = subtotal * (voucher.value / 100);
      
      // Apply max discount cap if exists
      if (voucher.max_discount && discount > voucher.max_discount) {
        discount = voucher.max_discount;
      }
    }

    return Math.round(discount * 100) / 100; // Round to 2 decimal places
  },

  /**
   * Check if voucher can be applied to booking
   */
  canApplyVoucher(voucher: Voucher, subtotal: number): {
    canApply: boolean;
    reason?: string;
  } {
    // Check validity
    const now = new Date();
    const validUntil = new Date(voucher.valid_until);
    
    if (!voucher.is_active) {
      return { canApply: false, reason: 'Voucher is no longer active' };
    }

    if (validUntil < now) {
      return { canApply: false, reason: 'Voucher has expired' };
    }

    // Check minimum spend
    if (subtotal < voucher.min_spend) {
      return {
        canApply: false,
        reason: `Minimum spend of RM ${voucher.min_spend.toFixed(2)} required`,
      };
    }

    return { canApply: true };
  },

  /**
   * Format voucher expiry date
   */
  formatExpiryDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  },

  /**
   * Get days until expiry
   */
  getDaysUntilExpiry(dateString: string): number {
    const expiry = new Date(dateString);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  },

  /**
   * Check if voucher is expiring soon (within 7 days)
   */
  isExpiringSoon(dateString: string): boolean {
    const days = this.getDaysUntilExpiry(dateString);
    return days >= 0 && days <= 7;
  },

  /**
   * Check if voucher is expired
   */
  isExpired(dateString: string): boolean {
    return this.getDaysUntilExpiry(dateString) < 0;
  },

  // =====================================================
  // CREDITS SYSTEM
  // =====================================================

  /**
   * Get user's credit balance
   */
  async getUserCredits(userId: string): Promise<number> {
    try {
      // Read from cached customer_credits table (O(1) lookup)
      const { data, error } = await supabase
        .from('customer_credits')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If no record exists, return 0
        if (error.code === 'PGRST116') {
          return 0;
        }
        console.error('[rewardsService] getUserCredits error:', error);
        return 0;
      }

      return Number(data?.balance || 0);
    } catch (error) {
      console.error('[rewardsService] getUserCredits error:', error);
      return 0;
    }
  },

  /**
   * Get user's credit transaction history
   */
  async getCreditTransactions(userId: string, limit: number = 50): Promise<CreditTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[rewardsService] getCreditTransactions error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[rewardsService] getCreditTransactions error:', error);
      throw error;
    }
  },

  /**
   * Add credits to customer account
   */
  async addCredit(
    userId: string,
    amount: number,
    source: CreditTransaction['source'],
    description: string,
    bookingId?: string,
    metadata?: any
  ): Promise<{ success: boolean; newBalance: number; transactionId?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('add_customer_credit', {
        p_user_id: userId,
        p_amount: amount,
        p_source: source,
        p_description: description,
        p_booking_id: bookingId || null,
        p_metadata: metadata || {},
      });

      if (error) {
        console.error('[rewardsService] addCredit error:', error);
        return { success: false, newBalance: 0, error: error.message };
      }

      const result = Array.isArray(data) ? data[0] : data;
      
      return {
        success: result.success,
        newBalance: result.new_balance,
        transactionId: result.transaction_id,
      };
    } catch (error: any) {
      console.error('[rewardsService] addCredit error:', error);
      return {
        success: false,
        newBalance: 0,
        error: error.message || 'Failed to add credits',
      };
    }
  },

  /**
   * Deduct credits from customer account
   */
  async deductCredit(
    userId: string,
    amount: number,
    source: CreditTransaction['source'],
    description: string,
    bookingId?: string,
    metadata?: any
  ): Promise<{ success: boolean; newBalance: number; transactionId?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('deduct_customer_credit', {
        p_user_id: userId,
        p_amount: amount,
        p_source: source,
        p_description: description,
        p_booking_id: bookingId || null,
        p_metadata: metadata || {},
      });

      if (error) {
        console.error('[rewardsService] deductCredit error:', error);
        return { success: false, newBalance: 0, error: error.message };
      }

      const result = Array.isArray(data) ? data[0] : data;
      
      if (!result.success) {
        return {
          success: false,
          newBalance: result.new_balance,
          error: result.error_message || 'Failed to deduct credits',
        };
      }

      return {
        success: true,
        newBalance: result.new_balance,
        transactionId: result.transaction_id,
      };
    } catch (error: any) {
      console.error('[rewardsService] deductCredit error:', error);
      return {
        success: false,
        newBalance: 0,
        error: error.message || 'Failed to deduct credits',
      };
    }
  },

  /**
   * Format credit amount for display
   */
  formatCreditAmount(amount: number): string {
    return `RM ${amount.toFixed(2)}`;
  },
};
