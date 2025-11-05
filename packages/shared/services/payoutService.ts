import { supabase } from '../config/supabase';

export interface PayoutRequest {
  id: string;
  barber_id: string;
  amount: number;
  requested_amount?: number;
  available_balance?: number;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  period_start: string;
  period_end: string;
  requested_at: string;
  processed_at?: string;
  processed_by?: string;
  rejection_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AvailableBalanceResponse {
  available: number;
  totalEarnings: number;
  totalWithdrawn: number;
  pendingWithdrawals: number;
}

export const payoutService = {
  /**
   * Check if barber has a pending payout request
   */
  async hasPendingPayout(barberId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('check_pending_payout', {
      p_barber_id: barberId,
    });

    if (error) {
      console.error('Error checking pending payout:', error);
      throw new Error('Failed to check pending payout status');
    }

    return data as boolean;
  },

  /**
   * Get available balance for withdrawal
   */
  async getAvailableBalance(barberId: string): Promise<number> {
    const { data, error } = await supabase.rpc('get_available_balance', {
      p_barber_id: barberId,
    });

    if (error) {
      console.error('Error getting available balance:', error);
      throw new Error('Failed to get available balance');
    }

    return parseFloat(data as string) || 0;
  },

  /**
   * Get barber's payout history
   */
  async getPayoutHistory(barberId: string): Promise<PayoutRequest[]> {
    const { data, error } = await supabase
      .from('payouts')
      .select('*')
      .eq('barber_id', barberId)
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Error fetching payout history:', error);
      throw new Error('Failed to fetch payout history');
    }

    return data || [];
  },

  /**
   * Request a payout with custom amount
   */
  async requestPayout(params: {
    barberId: string;
    amount: number; // Custom amount to withdraw
    bankName: string;
    bankAccountNumber: string;
    bankAccountName: string;
  }): Promise<PayoutRequest> {
    const MIN_PAYOUT = 50;

    // Validate minimum amount
    if (params.amount < MIN_PAYOUT) {
      throw new Error(`Minimum payout amount is RM ${MIN_PAYOUT}`);
    }

    // Check for pending payout
    const hasPending = await this.hasPendingPayout(params.barberId);
    if (hasPending) {
      throw new Error('You already have a pending payout request. Please wait for it to be processed.');
    }

    // Check available balance
    const availableBalance = await this.getAvailableBalance(params.barberId);
    if (params.amount > availableBalance) {
      throw new Error(`Insufficient balance. Available: RM ${availableBalance.toFixed(2)}`);
    }

    // Create payout request
    const { data, error } = await supabase
      .from('payouts')
      .insert({
        barber_id: params.barberId,
        amount: params.amount,
        requested_amount: params.amount,
        available_balance: availableBalance,
        status: 'pending',
        bank_name: params.bankName,
        bank_account_number: params.bankAccountNumber,
        bank_account_name: params.bankAccountName,
        period_start: new Date(0).toISOString().split('T')[0], // All time
        period_end: new Date().toISOString().split('T')[0],
        currency: 'MYR',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payout request:', error);
      throw new Error('Failed to create payout request');
    }

    return data as PayoutRequest;
  },

  /**
   * Get pending payout (if exists)
   */
  async getPendingPayout(barberId: string): Promise<PayoutRequest | null> {
    const { data, error } = await supabase
      .from('payouts')
      .select('*')
      .eq('barber_id', barberId)
      .in('status', ['pending', 'processing'])
      .order('requested_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching pending payout:', error);
      return null;
    }

    return data as PayoutRequest | null;
  },
};
