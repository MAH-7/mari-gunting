# Billplz Payment Integration Guide

> **Production-ready** Billplz payment gateway integration for Mari Gunting

## 📋 Overview

Complete integration with Billplz v3/v4 APIs including:
- ✅ Secure server-side bill creation (Supabase Edge Functions)
- ✅ FPX Online Banking (B2C/B2B)
- ✅ Credit/Debit Card payments
- ✅ E-wallet support (TNG, GrabPay, ShopeePay)
- ✅ Direct Payment Gateway (auto-select bank)
- ✅ X-Signature webhook verification (HMAC-SHA256)
- ✅ X-Signature redirect verification
- ✅ Idempotent bill creation
- ✅ Payment reconciliation
- ✅ Dynamic payment gateway listing
- ✅ Webhook rank monitoring
- ✅ Better error handling

---

## 🏗️ Architecture

```
┌─────────────┐
│ React Native│
│     App     │ (Client)
└──────┬──────┘
       │ 1. Request payment
       ▼
┌─────────────────────────┐
│  Supabase Edge Function │
│  billplz-create-bill    │ (Server)
└──────┬──────────────────┘
       │ 2. Create bill
       ▼
┌─────────────────────────┐
│    Billplz API v3/v4    │
│  (Sandbox/Production)   │
└──────┬──────────────────┘
       │ 3. Payment URL
       ▼
┌─────────────────────────┐
│   User pays via        │
│   FPX/Card/E-wallet    │
└──────┬──────────────────┘
       │ 4. Webhook callback (X-Signature)
       ▼
┌─────────────────────────┐
│  Supabase Edge Function │
│   billplz-webhook       │ (Server)
└──────┬──────────────────┘
       │ 5. Update booking
       ▼
┌─────────────────────────┐
│   Supabase Database     │
│   bookings, payments    │
└─────────────────────────┘
       │ 6. Redirect to app (X-Signature)
       ▼
┌─────────────────────────┐
│    User sees success    │
└─────────────────────────┘
```

---

## 🔐 Security

### Server-Side Only
- ✅ API keys never exposed to client
- ✅ Bill creation handled by Edge Function
- ✅ Webhook verification with HMAC-SHA256
- ✅ Redirect signature verification
- ✅ Amount mismatch detection

### X-Signature Verification
Both webhook callbacks and redirect URLs are verified using HMAC-SHA256 signatures to prevent fake payments.

---

## 📦 Environment Variables

### App (.env)
```bash
# Billplz Configuration
BILLPLZ_API_KEY=your_api_key_here
BILLPLZ_COLLECTION_ID=your_collection_id
BILLPLZ_X_SIGNATURE_KEY=your_x_signature_key  # Optional, defaults to API key
BILLPLZ_ENV=sandbox  # or 'production'
```

### Supabase Edge Functions
Set these in Supabase Dashboard → Edge Functions → Secrets:

```bash
BILLPLZ_API_KEY=your_api_key_here
BILLPLZ_COLLECTION_ID=your_collection_id
BILLPLZ_X_SIGNATURE_KEY=your_x_signature_key
BILLPLZ_ENV=sandbox  # or 'production'
```

---

## 🚀 Quick Start

### 1. Enable Payment Methods

**Sandbox:**
- Log into https://www.billplz-sandbox.com
- Go to Collections → Your Collection → Settings
- Enable: FPX (Faker), Card (Faker)

**Production:**
- Log into https://www.billplz.com
- Go to Collections → Your Collection → Settings
- Enable: FPX, Card, E-wallets
- Contact Billplz support to activate card gateways

### 2. Deploy Edge Functions

```bash
# Deploy create-bill function
supabase functions deploy billplz-create-bill

# Deploy webhook function
supabase functions deploy billplz-webhook

# Set secrets
supabase secrets set BILLPLZ_API_KEY=your_key
supabase secrets set BILLPLZ_COLLECTION_ID=your_collection
supabase secrets set BILLPLZ_X_SIGNATURE_KEY=your_signature_key
supabase secrets set BILLPLZ_ENV=sandbox
```

### 3. Configure Webhook URL

Set your webhook URL in Billplz Dashboard:
```
https://your-project.supabase.co/functions/v1/billplz-webhook
```

Enable **X Signature** in collection settings.

### 4. Test Payment

```bash
cd apps/customer
npm run ios  # or npm run android
```

1. Create a booking
2. Select payment method (Card/FPX)
3. Complete test payment
4. Verify webhook callback
5. Check booking status updated

---

## 🎯 Payment Flow

### Standard Flow (Without Direct Gateway)

1. Customer selects payment method (Card/FPX)
2. App calls `billplz-create-bill` Edge Function
3. Edge Function creates bill via Billplz v3 API
4. User redirected to Billplz payment page
5. User selects bank/card (if not pre-selected)
6. User completes payment
7. Billplz sends webhook to `billplz-webhook`
8. Webhook verifies signature, updates booking
9. Billplz redirects user back to app
10. App verifies redirect signature, shows success

### Direct Payment Gateway Flow (Auto-Submit)

1. Customer selects bank (e.g., Maybank)
2. App calls `billplz-create-bill` with `bankCode`
3. Edge Function creates bill with `reference_1` = bank code
4. App opens payment URL with `?auto_submit=true`
5. **User skips Billplz page, goes directly to bank**
6. User logs in to bank, authorizes payment
7. Webhook callback → Update booking
8. Redirect to app → Show success

---

## 💻 Code Examples

### Create Bill (Server-Side)

```typescript
// Edge Function: billplz-create-bill
const { data, error } = await supabase.functions.invoke('billplz-create-bill', {
  body: {
    bookingId: 'booking_123',
    amount: 5000, // RM 50.00 in cents
    email: '[email protected]',
    name: 'John Doe',
    description: 'Booking for Kid Haircut',
    mobile: '+60123456789',
    bankCode: 'MBB0227', // Optional: Pre-select Maybank
    redirectUrl: 'marigunting://payment-success',
  }
});

if (error) {
  console.error('Failed to create bill:', error);
} else {
  console.log('Bill created:', data.billId);
  console.log('Payment URL:', data.paymentUrl);
}
```

### Get Payment Gateways

```typescript
import { billplzService } from '@mari-gunting/shared/services/billplzService';

// Fetch available banks and payment methods
const { data: gateways } = await billplzService.getPaymentGateways();

// Filter FPX banks
const fpxBanks = gateways?.filter(g => g.category === 'fpx' && g.active);

// Filter card gateways
const cardGateways = gateways?.filter(g => 
  ['billplz', '2c2p', 'ocbc'].includes(g.category) && g.active
);

// Show in UI
fpxBanks?.forEach(bank => {
  console.log(bank.code, bank.active); // e.g., 'MBB0227', true
});
```

### Verify Redirect Signature

```typescript
// When user returns from payment
const url = new URL(redirectUrl);
const params: any = {};
url.searchParams.forEach((value, key) => {
  params[key] = value;
});

// Verify signature
const isValid = await billplzService.verifyRedirectSignature(params);

if (isValid) {
  // Signature verified, safe to proceed
  const isPaid = params['billplz[paid]'] === 'true';
  if (isPaid) {
    showSuccessModal();
  }
} else {
  // Invalid signature - possible tampering
  console.error('Invalid redirect signature');
}
```

### Check Webhook Rank

```typescript
// Monitor webhook priority (run periodically in production)
const { data: rank } = await billplzService.getWebhookRank();

console.log('Webhook rank:', rank?.rank); // 0.0 - 10.0

if (rank && rank.rank > 5.0) {
  console.warn('⚠️ High webhook rank - callbacks may be slower');
  // Alert your team
}
```

### Better Error Handling

```typescript
try {
  const result = await billplzService.createBill(params);
  
  if (!result.success) {
    // Get user-friendly error message
    const errorMessage = billplzService.formatErrorMessage(result.error);
    Alert.alert('Payment Error', errorMessage);
  }
} catch (error) {
  const errorMessage = billplzService.formatErrorMessage(error);
  Alert.alert('Error', errorMessage);
}
```

---

## 🔧 API Methods

### billplzService

| Method | Description |
|--------|-------------|
| `createBill()` | ❌ Client-side (deprecated) - Use Edge Function |
| `getBill()` | Get bill status (use sparingly - webhooks are better) |
| `deleteBill()` | Cancel unpaid bill |
| `getPaymentGateways()` | ✅ Get available FPX banks, card gateways |
| `getFPXBanks()` | Get FPX banks only (legacy) |
| `getWebhookRank()` | ✅ Monitor webhook priority (0.0-10.0) |
| `verifyCallbackSignature()` | ✅ Verify webhook X-Signature (server-side) |
| `verifyRedirectSignature()` | ✅ Verify redirect X-Signature |
| `formatErrorMessage()` | ✅ Get user-friendly error messages |
| `formatAmount()` | Convert RM to cents |
| `parseAmount()` | Convert cents to RM |

---

## 🧪 Testing

### Sandbox Test Cards

When Card (Faker) is enabled:

| Card Type | Test Number | CVV | Expiry | Result |
|-----------|-------------|-----|--------|--------|
| Visa | 4242 4242 4242 4242 | 123 | Future | Success |
| Mastercard | 5555 5555 5555 4444 | 123 | Future | Success |

### Sandbox FPX Banks

All FPX banks in sandbox are simulators (Faker). Select any bank → Enter any credentials → Choose success/failure.

---

## 🐛 Troubleshooting

### Payment Not Updating

**Issue:** Payment successful but booking still pending

**Fix:**
1. Check webhook is deployed: `supabase functions list`
2. Check webhook URL set in Billplz Dashboard
3. Check webhook logs: `supabase functions logs billplz-webhook`
4. Verify X-Signature enabled in collection settings
5. Check `BILLPLZ_X_SIGNATURE_KEY` environment variable

### 401 Unauthorized

**Issue:** API returns 401

**Fix:**
- Verify API key and collection ID match (same account)
- Sandbox keys only work with sandbox collections
- Production keys only work with production collections

### 404 Not Found

**Issue:** Collection not found

**Fix:**
- Log into Billplz Dashboard
- Check collection ID is correct
- Ensure collection exists on correct environment (sandbox/production)

### Direct Payment Gateway Not Working

**Issue:** User sees bank selection page instead of going directly to bank

**Fix:**
- Ensure `reference_1_label` = "Bank Code"
- Ensure `reference_1` = valid bank code (e.g., 'MBB0227')
- Add `?auto_submit=true` to payment URL
- Check bank code is active: `billplzService.getPaymentGateways()`

---

## 📊 Monitoring

### Production Checklist

- [ ] X-Signature enabled on collection
- [ ] Webhook URL set correctly
- [ ] Environment variables set
- [ ] Webhook rank < 5.0
- [ ] Error alerts configured
- [ ] Payment logs monitored
- [ ] Refund process tested

### Webhook Rank Monitoring

```typescript
// Run this hourly in production
async function monitorWebhookRank() {
  const { data } = await billplzService.getWebhookRank();
  
  if (data && data.rank > 5.0) {
    // Alert your team
    await sendSlackAlert(`⚠️ Billplz webhook rank high: ${data.rank}/10.0`);
  }
}
```

---

## 🚀 Going Production

### 1. Get Production Credentials
- Sign up at https://www.billplz.com
- Complete verification
- Get production API key
- Get X-Signature key
- Create production collection

### 2. Update Environment Variables
```bash
BILLPLZ_ENV=production
BILLPLZ_API_KEY=prod_key
BILLPLZ_COLLECTION_ID=prod_collection
BILLPLZ_X_SIGNATURE_KEY=prod_signature
```

### 3. Enable Payment Methods
- Contact Billplz support for card gateway approval
- Enable FPX (free, instant)
- Enable e-wallets (TNG, GrabPay, etc.)

### 4. Update Webhook URL
- Use production Supabase URL
- Test webhook with real payment
- Monitor webhook logs

### 5. Test Everything
- [ ] Small test payment (RM 0.10)
- [ ] Verify webhook callback
- [ ] Verify booking updated
- [ ] Verify receipt sent
- [ ] Test refund process

---

## 📚 Resources

- [Billplz API Docs](https://www.billplz.com/api)
- [Billplz Sandbox](https://www.billplz-sandbox.com)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [X-Signature Guide](https://www.billplz.com/api#x-signature)

---

## 🆘 Support

### Billplz Support
- Email: support@billplz.com
- WhatsApp: +60 18-213 9775

### Internal Support
- Check Edge Function logs
- Review payment_logs table
- Check Supabase realtime logs

---

**Last Updated:** 2025-10-20
**Version:** 2.0.0 (Production-ready)
