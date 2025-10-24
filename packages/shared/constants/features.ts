/**
 * Feature Flags Configuration
 * 
 * Centralized feature toggles for the Mari-Gunting application.
 * Change these values and rebuild the app to enable/disable features.
 */

export const FEATURE_FLAGS = {
  /**
   * Cash Payment Toggle
   * 
   * When DISABLED (false):
   * - Cash payment option hidden from customers
   * - Only online payments (Card/FPX) accepted
   * - Prevents no-show/ghosting risks
   * 
   * When to ENABLE (true):
   * - After establishing user base (1000+ users recommended)
   * - When reputation system is implemented
   * - When ready to handle no-show risks (5-10% expected)
   * - Consider per-user restrictions (good reputation only)
   * 
   * Current Status: DISABLED
   * Reason: Protect barbers from customer ghosting during MVP phase
   */
  CASH_PAYMENT_ENABLED: false,

  /**
   * E-Wallet Payment Toggle
   * 
   * When DISABLED (false):
   * - E-wallet payment option hidden from customers
   * - Only Card and FPX available
   * 
   * When to ENABLE (true):
   * - After implementing e-wallet payment screen (/payment-ewallet route)
   * - After integrating with e-wallet providers (TNG, GrabPay, ShopeePay)
   * - After testing e-wallet payment flow end-to-end
   * 
   * Current Status: DISABLED
   * Reason: E-wallet payment flow not yet implemented
   */
  EWALLET_PAYMENT_ENABLED: false,
  
  // Future feature flags can be added here
  // Example:
  // PROMO_CODES_ENABLED: true,
  // SCHEDULING_ENABLED: true,
} as const;

/**
 * Helper function to check if a feature is enabled
 */
export const isFeatureEnabled = (feature: keyof typeof FEATURE_FLAGS): boolean => {
  return FEATURE_FLAGS[feature];
};
