import { ENV } from '../config/env';
import { supabase } from '../config/supabase';

export interface CurlecOrderRequest {
  amount: number; // in MYR (will be converted to smallest currency unit)
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface CurlecOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string | null;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export interface CurlecPaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface CurlecCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
    method?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
    backdrop_color?: string;
    hide_topbar?: boolean;
  };
  modal?: {
    backdropclose?: boolean;
    escape?: boolean;
    handleback?: boolean;
    confirm_close?: boolean;
    ondismiss?: () => void;
    animation?: boolean;
  };
  method?: {
    card?: boolean;
    netbanking?: boolean;
    wallet?: boolean;
    upi?: boolean;
    fpx?: boolean;
  };
  readonly?: {
    contact?: boolean;
    email?: boolean;
    name?: boolean;
  };
  hidden?: {
    contact?: boolean;
    email?: boolean;
  };
  send_sms_hash?: boolean;
  allow_rotation?: boolean;
  retry?: {
    enabled?: boolean;
    max_count?: number;
  };
}

class CurlecService {
  private keyId: string;
  private currency: string;

  constructor() {
    this.keyId = ENV.CURLEC_KEY_ID || '';
    this.currency = ENV.CURLEC_CURRENCY || 'MYR';
    console.log('[CurlecService] Initialized with key:', this.keyId ? `${this.keyId.substring(0, 10)}...` : 'NOT SET');
    console.log('[CurlecService] Currency:', this.currency);
  }

  /**
   * Check if Curlec is configured
   */
  isConfigured(): boolean {
    const configured = !!this.keyId;
    console.log('[CurlecService] isConfigured:', configured, '- keyId:', this.keyId ? 'SET' : 'NOT SET');
    return configured;
  }

  /**
   * Convert amount from MYR to smallest unit (sen)
   * Curlec expects amount in smallest currency unit
   * For MYR: 1 MYR = 100 sen
   */
  private convertToSmallestUnit(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Convert amount from smallest unit (sen) to MYR
   */
  private convertToMainUnit(amount: number): number {
    return amount / 100;
  }

  /**
   * Create a Curlec order via Supabase Edge Function
   * This must be done server-side to keep the secret key secure
   */
  async createOrder(request: CurlecOrderRequest): Promise<CurlecOrder> {
    try {
      const { data, error } = await supabase.functions.invoke('create-curlec-order', {
        body: {
          amount: this.convertToSmallestUnit(request.amount),
          currency: request.currency || this.currency,
          receipt: request.receipt,
          notes: request.notes,
        },
      });

      if (error) {
        console.error('[Curlec] Order creation error:', error);
        throw new Error(error.message || 'Failed to create Curlec order');
      }

      if (!data || !data.order) {
        throw new Error('Invalid response from Curlec order creation');
      }

      return data.order;
    } catch (error) {
      console.error('[Curlec] Order creation failed:', error);
      throw error;
    }
  }

  /**
   * Verify payment signature via Supabase Edge Function
   * This must be done server-side to keep the secret key secure
   */
  async verifyPayment(verification: CurlecPaymentVerification): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('verify-curlec-payment', {
        body: verification,
      });

      if (error) {
        console.error('[Curlec] Payment verification error:', error);
        throw new Error(error.message || 'Failed to verify Curlec payment');
      }

      return data?.verified === true;
    } catch (error) {
      console.error('[Curlec] Payment verification failed:', error);
      throw error;
    }
  }

  /**
   * Prepare checkout options for React Native Razorpay SDK
   * Note: Uses same SDK, but with Curlec API keys
   */
  prepareCheckoutOptions(
    order: CurlecOrder,
    options: {
      customerName?: string;
      customerEmail?: string;
      customerContact?: string;
      description?: string;
      bookingId?: string;
      barberId?: string;
      customerId?: string;
      serviceName?: string;
    }
  ): CurlecCheckoutOptions {
    return {
      key: this.keyId,
      amount: order.amount,
      currency: order.currency,
      name: 'Mari Gunting',
      description: options.description || 'Barber Service Booking',
      // image: removed - using dashboard logo instead
      order_id: order.id,
      prefill: {
        name: options.customerName,
        email: options.customerEmail,
        contact: options.customerContact,
      },
      notes: {
        customer_id: options.customerId || '',
        barber_id: options.barberId || '',
        service_name: options.serviceName || '',
        platform: 'react-native',
      },
      theme: {
        color: '#00B14F', // Mari Gunting green color
        backdrop_color: '#FFFFFF',
      },
      modal: {
        backdropclose: false,
        escape: true,
        handleback: true,
        confirm_close: true,
      },
      readonly: {
        contact: true, // Lock phone number (user already verified)
        email: true, // Lock email (shows but can't edit)
        name: false, // Allow name edit in case of typos
      },
      hidden: {
        email: false, // Don't hide email field
      },
      send_sms_hash: true, // Auto-read OTP from SMS (Android)
      retry: {
        enabled: true, // Allow retry on payment failure
        max_count: 2, // Maximum 2 retry attempts
      },
      // Enable Malaysian payment methods
      method: {
        card: true, // Credit/Debit cards
        netbanking: true, // FPX (Malaysian banks)
        wallet: true, // E-wallets (TNG, GrabPay, etc.)
        upi: false, // Disable UPI (India only)
        fpx: true, // Explicitly enable FPX
      },
    };
  }

  /**
   * Get payment status from Curlec via Edge Function
   */
  async getPaymentStatus(paymentId: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('get-curlec-payment', {
        body: { paymentId },
      });

      if (error) {
        console.error('[Curlec] Get payment status error:', error);
        throw new Error(error.message || 'Failed to get payment status');
      }

      return data?.payment;
    } catch (error) {
      console.error('[Curlec] Get payment status failed:', error);
      throw error;
    }
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number, includeSymbol: boolean = true): string {
    const formatted = amount.toFixed(2);
    return includeSymbol ? `RM ${formatted}` : formatted;
  }

  /**
   * Get supported payment methods for Malaysia
   */
  getSupportedMethods(): string[] {
    return [
      'card', // Credit/Debit cards
      'fpx', // FPX (Malaysian online banking)
      'wallet', // E-wallets (TNG, GrabPay, ShopeePay)
    ];
  }
}

export const curlecService = new CurlecService();
