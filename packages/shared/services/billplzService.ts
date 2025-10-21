/**
 * Billplz Payment Gateway Service
 * 
 * Production-ready integration with Billplz API
 * Docs: https://www.billplz.com/api
 * 
 * Note: Bills use v3 API, Collections use v4 API (per Billplz docs)
 * 
 * Features:
 * - FPX B2C/B2B support
 * - Bank pre-selection
 * - Auto-deliver receipts (via XSignature)
 * - Enhanced error handling
 * - Transaction ID tracking
 * - Better webhooks
 */

import { ENV } from '../config/env';

export interface BillplzConfig {
  apiKey: string;
  collectionId: string;
  isSandbox: boolean;
  xSignatureKey?: string; // For webhook verification
}

export type FPXType = 'FPX_B2C' | 'FPX_B2B';

export interface CreateBillParams {
  collectionId: string;
  email: string;
  name: string;
  amount: number; // in cents (e.g., RM 10.50 = 1050)
  callbackUrl: string;
  description: string;
  referenceId?: string; // Your booking ID
  barberId?: string; // Barber ID for tracking
  mobile?: string;
  redirectUrl?: string;
  fpxType?: FPXType; // Default: FPX_B2C
  bankCode?: string; // Pre-select gateway via reference_1 ('Bank Code'), e.g. 'MBB0227'
  deliver?: boolean; // Auto-send email/SMS receipt (default: true)
  dueAt?: string; // Payment expiry date (ISO 8601)
}

export interface BillResponse {
  id: string;
  collection_id: string;
  paid: boolean;
  state: 'due' | 'paid' | 'deleted';
  amount: number;
  paid_amount: number;
  due_at: string;
  email: string;
  mobile: string | null;
  name: string;
  url: string; // Payment URL to redirect user
  reference_1_label: string | null;
  reference_1: string | null;
  reference_2_label: string | null;
  reference_2: string | null;
  redirect_url: string | null;
  callback_url: string;
  description: string;
  // v4 specific fields
  transaction_id?: string | null;
  transaction_status?: string | null;
  paid_at?: string | null;
}

export interface BillCallbackData {
  id: string;
  collection_id: string;
  paid: boolean;
  state: 'paid' | 'due' | 'deleted';
  amount: number;
  paid_amount: number;
  paid_at: string;
  transaction_id: string;
  transaction_status: string;
  x_signature: string; // Used for verification
}

export interface BillplzError {
  type: 'invalid_request_error' | 'api_error' | 'authentication_error';
  message: string;
  code?: string;
  param?: string;
}

export interface PaymentGateway {
  code: string; // Bank code (e.g., 'MBB0227')
  active: boolean;
  category: 'fpx' | 'billplz' | 'paypal' | '2c2p' | 'ocbc' | string;
}

export interface WebhookRank {
  rank: number; // 0.0 (highest) to 10.0 (lowest)
}

export interface RedirectParams {
  'billplz[id]': string;
  'billplz[paid]': string; // 'true' | 'false'
  'billplz[paid_at]'?: string;
  'billplz[x_signature]'?: string;
}

class BillplzService {
  private config: BillplzConfig;
  private baseUrl: string;

  constructor() {
    console.log('[billplz] Initializing v4 API...');
    console.log('[billplz] ENV.BILLPLZ_API_KEY:', ENV.BILLPLZ_API_KEY ? 'SET (' + ENV.BILLPLZ_API_KEY.substring(0, 8) + '...)' : 'NOT SET');
    console.log('[billplz] ENV.BILLPLZ_COLLECTION_ID:', ENV.BILLPLZ_COLLECTION_ID || 'NOT SET');
    console.log('[billplz] ENV.APP_ENV:', ENV.APP_ENV);
    
    this.config = {
      apiKey: ENV.BILLPLZ_API_KEY || '',
      collectionId: ENV.BILLPLZ_COLLECTION_ID || '',
      isSandbox: ENV.APP_ENV !== 'production',
      xSignatureKey: ENV.BILLPLZ_API_KEY || '', // Use API key for signature verification
    };

    this.baseUrl = this.config.isSandbox
      ? 'https://www.billplz-sandbox.com/api'
      : 'https://www.billplz.com/api';
    
    if (!this.config.isSandbox) {
      console.warn('⚠️⚠️⚠️ BILLPLZ PRODUCTION MODE - REAL MONEY TRANSACTIONS! ⚠️⚠️⚠️');
      console.log('[billplz] 💳 Using LIVE API Base:', this.baseUrl);
    } else {
      console.log('[billplz] 🧪 Using SANDBOX mode for testing');
      console.log('[billplz] API Base:', this.baseUrl);
    }
    
    console.log('[billplz] Config loaded:', {
      hasApiKey: !!this.config.apiKey,
      hasCollectionId: !!this.config.collectionId,
      mode: this.config.isSandbox ? 'SANDBOX' : '🔴 PRODUCTION',
    });
  }

  /**
   * Create a new bill for payment (v4)
   */
  async createBill(params: CreateBillParams): Promise<{ success: boolean; data?: BillResponse; error?: string }> {
    try {
      if (!this.config.apiKey) {
        throw new Error('Billplz API key not configured');
      }

      const formData = new URLSearchParams();
      formData.append('collection_id', params.collectionId);
      formData.append('email', params.email);
      formData.append('name', params.name);
      formData.append('amount', params.amount.toString());
      formData.append('callback_url', params.callbackUrl);
      formData.append('description', params.description);

      // v4: FPX type (default to consumer banking)
      formData.append('fpx_type', params.fpxType || 'FPX_B2C');

      // v4: Auto-deliver receipts (default: true for better UX)
      formData.append('deliver', params.deliver !== false ? 'true' : 'false');

      // Reference fields and bank preselection (per Billplz docs)
      if (params.bankCode) {
        // Use reference_1 to pass Bank Code for direct payment gateway
        formData.append('reference_1_label', 'Bank Code');
        formData.append('reference_1', params.bankCode);
        // Put booking ID into reference_2 to keep reconciliation
        if (params.referenceId) {
          formData.append('reference_2_label', 'Booking ID');
          formData.append('reference_2', params.referenceId);
        }
      } else if (params.referenceId) {
        formData.append('reference_1_label', 'Booking ID');
        formData.append('reference_1', params.referenceId);
      }

      if (params.barberId) {
        // Only set if not already used by booking ID above
        if (!params.referenceId || params.bankCode) {
          formData.append('reference_2_label', 'Barber ID');
          formData.append('reference_2', params.barberId);
        } else {
          // Otherwise, add as description suffix for traceability
          formData.append('description', `${params.description} (Barber: ${params.barberId})`);
        }
      }

      if (params.mobile) {
        formData.append('mobile', params.mobile);
      }

      if (params.redirectUrl) {
        formData.append('redirect_url', params.redirectUrl);
      }

      // Note: bank pre-selection handled via reference_1_label / reference_1

      // v4: Payment expiry
      if (params.dueAt) {
        formData.append('due_at', params.dueAt);
      }

      const authHeader = 'Basic ' + btoa(this.config.apiKey + ':');

      if (!this.config.isSandbox) {
        console.warn('[billplz] 💰 Creating PRODUCTION bill - Real money will be charged!');
      }
      
      console.log('[billplz] Creating bill with v3 API...');
      const response = await fetch(`${this.baseUrl}/v3/bills`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[billplz] API Error Response:', errorText);
        console.error('[billplz] Status Code:', response.status);
        console.error('[billplz] Collection ID used:', params.collectionId);
        console.error('[billplz] API URL:', `${this.baseUrl}/v3/bills`);
        console.error('[billplz] API Key (first 8):', this.config.apiKey.substring(0, 8));
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData && errorData.error) {
            const error: BillplzError = errorData.error;
            throw new Error(`Billplz v4 error: ${error.message} (${error.code || 'unknown'})`);
          }
        } catch (e) {
          // Not JSON, use raw text
        }
        
        throw new Error(`Billplz API error: ${response.status} - ${errorText}`);
      }

      const data: BillResponse = await response.json();

      console.log('[billplz] Bill created successfully (v4):', data.id);
      console.log('[billplz] Payment URL:', data.url);
      return { success: true, data };
    } catch (error) {
      console.error('[billplz] Failed to create bill:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create bill',
      };
    }
  }

  /**
   * Get bill details (v4)
   */
  async getBill(billId: string): Promise<{ success: boolean; data?: BillResponse; error?: string }> {
    try {
      if (!this.config.apiKey) {
        throw new Error('Billplz API key not configured');
      }

      const authHeader = 'Basic ' + btoa(this.config.apiKey + ':');

      const response = await fetch(`${this.baseUrl}/v3/bills/${billId}`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (errorData && errorData.error) {
          const error: BillplzError = errorData.error;
          throw new Error(`Billplz v4 error: ${error.message}`);
        }
        throw new Error(`Billplz API error: ${response.status}`);
      }

      const data: BillResponse = await response.json();

      console.log('[billplz] Bill fetched (v4):', billId, '- Paid:', data.paid);
      return { success: true, data };
    } catch (error) {
      console.error('[billplz] Failed to get bill:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get bill',
      };
    }
  }

  /**
   * Verify callback signature (v4 - PRODUCTION READY)
   * 
   * ⚠️ SECURITY: This verification should be done on your BACKEND, not in the app!
   * Client-side verification can be bypassed. This is just for basic validation.
   * 
   * IMPORTANT: In production, verify webhooks on your server/Supabase Edge Function!
   * 
   * Formula: HMAC-SHA256(key, string_to_sign)
   * string_to_sign = "billplzamount|billplzcollection_id|billplzid|billplzpaid|billplzpaid_at|billplzstate|billplztransaction_id|billplztransaction_status"
   */
  async verifyCallbackSignature(callbackData: BillCallbackData): Promise<boolean> {
    try {
      if (!this.config.xSignatureKey) {
        console.error('[billplz] X-Signature key not configured!');
        return false;
      }

      // Build string to sign (v4 format)
      const stringToSign = [
        'billplzamount' + callbackData.amount,
        'billplzcollection_id' + callbackData.collection_id,
        'billplzid' + callbackData.id,
        'billplzpaid' + (callbackData.paid ? 'true' : 'false'),
        'billplzpaid_at' + callbackData.paid_at,
        'billplzstate' + callbackData.state,
        'billplztransaction_id' + callbackData.transaction_id,
        'billplztransaction_status' + callbackData.transaction_status,
      ].join('|');

      // Use Web Crypto API (works in React Native)
      const encoder = new TextEncoder();
      const keyData = encoder.encode(this.config.xSignatureKey);
      const messageData = encoder.encode(stringToSign);

      // Import key for HMAC
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      // Sign the message
      const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

      // Convert to hex string
      const expectedSignature = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const isValid = expectedSignature === callbackData.x_signature;
      
      if (!isValid) {
        console.error('[billplz] X-Signature verification FAILED!');
        console.error('[billplz] Expected:', expectedSignature);
        console.error('[billplz] Received:', callbackData.x_signature);
        console.warn('[billplz] ⚠️ RECOMMENDATION: Verify signatures on your backend server!');
      } else {
        console.log('[billplz] X-Signature verified successfully');
      }

      return isValid;
    } catch (error) {
      console.error('[billplz] Signature verification error:', error);
      console.error('[billplz] Web Crypto API may not be available. Verify on backend instead!');
      return false;
    }
  }

  /**
   * Format amount to cents (Billplz uses cents)
   */
  formatAmount(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Format amount from cents to RM
   */
  parseAmount(amountInCents: number): number {
    return amountInCents / 100;
  }

  /**
   * Get payment URL for a bill
   */
  getPaymentUrl(billId: string): string {
    return this.config.isSandbox
      ? `https://www.billplz-sandbox.com/bills/${billId}`
      : `https://www.billplz.com/bills/${billId}`;
  }

  /**
   * Delete a bill (cancel before payment) - v4
   */
  async deleteBill(billId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.config.apiKey) {
        throw new Error('Billplz API key not configured');
      }

      const authHeader = 'Basic ' + btoa(this.config.apiKey + ':');

      const response = await fetch(`${this.baseUrl}/v3/bills/${billId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': authHeader,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (errorData && errorData.error) {
          const error: BillplzError = errorData.error;
          throw new Error(`Billplz v4 error: ${error.message}`);
        }
        throw new Error(`Billplz API error: ${response.status}`);
      }

      console.log('[billplz] Bill deleted successfully (v4):', billId);
      return { success: true };
    } catch (error) {
      console.error('[billplz] Failed to delete bill:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete bill',
      };
    }
  }

  /**
   * Get available FPX banks (v4)
   * Useful for showing bank selection UI
   */
  async getFPXBanks(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      if (!this.config.apiKey) {
        throw new Error('Billplz API key not configured');
      }

      const authHeader = 'Basic ' + btoa(this.config.apiKey + ':');

      const response = await fetch(`${this.baseUrl}/v4/fpx_banks`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch FPX banks: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data: data.banks || [] };
    } catch (error) {
      console.error('[billplz] Failed to fetch FPX banks:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch banks',
      };
    }
  }

  /**
   * Get all available payment gateways (v4)
   * Returns FPX banks, card gateways, e-wallets, etc.
   * Pull this list hourly in production
   */
  async getPaymentGateways(): Promise<{ success: boolean; data?: PaymentGateway[]; error?: string }> {
    try {
      if (!this.config.apiKey) {
        throw new Error('Billplz API key not configured');
      }

      const authHeader = 'Basic ' + btoa(this.config.apiKey + ':');

      const response = await fetch(`${this.baseUrl}/v4/payment_gateways`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch payment gateways: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data: data.payment_gateways || [] };
    } catch (error) {
      console.error('[billplz] Failed to fetch payment gateways:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch gateways',
      };
    }
  }

  /**
   * Get webhook rank (v4)
   * Monitor this in production - higher rank = slower callback execution
   * 0.0 = highest priority (default), 10.0 = lowest
   * Rank resets daily at 17:00
   */
  async getWebhookRank(): Promise<{ success: boolean; data?: WebhookRank; error?: string }> {
    try {
      if (!this.config.apiKey) {
        throw new Error('Billplz API key not configured');
      }

      const authHeader = 'Basic ' + btoa(this.config.apiKey + ':');

      const response = await fetch(`${this.baseUrl}/v4/webhook_rank`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch webhook rank: ${response.status}`);
      }

      const data: WebhookRank = await response.json();
      
      if (data.rank > 5.0) {
        console.warn(`[billplz] ⚠️ Webhook rank is high: ${data.rank}/10.0 - Callbacks may be slower`);
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('[billplz] Failed to fetch webhook rank:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch rank',
      };
    }
  }

  /**
   * Verify redirect signature (X-Signature)
   * When user returns from payment, Billplz redirects with signature
   * Verify this server-side for security
   */
  async verifyRedirectSignature(params: RedirectParams): Promise<boolean> {
    try {
      const xSignature = params['billplz[x_signature]'];
      if (!xSignature) {
        console.warn('[billplz] No x_signature in redirect params - X-Signature not enabled');
        return false;
      }

      if (!this.config.xSignatureKey) {
        console.error('[billplz] X-Signature key not configured!');
        return false;
      }

      // Build string to sign for redirect (simpler than callback)
      const stringToSign = [
        'billplzid' + params['billplz[id]'],
        'billplzpaid' + params['billplz[paid]'],
        params['billplz[paid_at]'] ? 'billplzpaid_at' + params['billplz[paid_at]'] : '',
      ].filter(Boolean).join('|');

      // Use Web Crypto API
      const encoder = new TextEncoder();
      const keyData = encoder.encode(this.config.xSignatureKey);
      const messageData = encoder.encode(stringToSign);

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
      
      const expectedSignature = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const isValid = expectedSignature === xSignature;
      
      if (!isValid) {
        console.error('[billplz] Redirect X-Signature verification FAILED!');
        console.error('[billplz] Expected:', expectedSignature);
        console.error('[billplz] Received:', xSignature);
      } else {
        console.log('[billplz] Redirect X-Signature verified ✓');
      }

      return isValid;
    } catch (error) {
      console.error('[billplz] Redirect signature verification error:', error);
      return false;
    }
  }

  /**
   * Get user-friendly error message from Billplz error
   */
  formatErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    
    if (error?.error) {
      const billplzError = error.error as BillplzError;
      
      // Map common errors to user-friendly messages
      switch (billplzError.code) {
        case 'invalid_collection':
          return 'Payment service configuration error. Please contact support.';
        case 'invalid_amount':
          return 'Invalid payment amount. Please try again.';
        case 'invalid_email':
          return 'Invalid email address. Please update your profile.';
        case 'rate_limit_exceeded':
          return 'Too many requests. Please try again in a moment.';
        case 'authentication_failed':
          return 'Payment service authentication failed. Please contact support.';
        default:
          return billplzError.message || 'Payment failed. Please try again.';
      }
    }
    
    return error?.message || 'An unexpected error occurred. Please try again.';
  }
}

export const billplzService = new BillplzService();
