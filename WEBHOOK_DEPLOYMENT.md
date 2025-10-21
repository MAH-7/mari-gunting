# 🔐 Billplz Webhook Deployment Guide

## Critical Security Fix - Deploy This BEFORE Launch!

This guide will set up secure server-side payment verification to prevent fake payment confirmations.

---

## Step 1: Run Database Migration

### Option A: Via Supabase Dashboard (Easiest)

1. Go to: https://supabase.com/dashboard/project/uufiyurcsldecspakneg
2. Click "SQL Editor" in the sidebar
3. Click "New Query"
4. Copy and paste the entire contents of:
   ```
   supabase/migrations/20250118_payment_security.sql
   ```
5. Click "Run" button
6. Verify success: You should see "Success. No rows returned"

### Option B: Via Supabase CLI

```bash
cd /Users/bos/Desktop/ProjectSideIncome/mari-gunting

# Install Supabase CLI (if not installed)
brew install supabase/tap/supabase

# Login
supabase login

# Link to your project
supabase link --project-ref uufiyurcsldecspakneg

# Run migration
supabase db push
```

### What This Migration Does:
✅ Creates `payment_logs` table for audit trail  
✅ Adds `bill_id`, `transaction_id`, `paid_at` to `bookings` table  
✅ Sets up Row Level Security (RLS) policies  
✅ Prevents clients from faking payment_status updates  
✅ Creates helper functions for payment tracking  

---

## Step 2: Deploy Edge Function

### Via Supabase Dashboard:

1. Go to: https://supabase.com/dashboard/project/uufiyurcsldecspakneg
2. Click "Edge Functions" in the sidebar
3. Click "Create a new function"
4. Function name: `billplz-webhook`
5. Copy and paste the contents of:
   ```
   supabase/functions/billplz-webhook/index.ts
   ```
6. Click "Deploy function"

### Via Supabase CLI:

```bash
cd /Users/bos/Desktop/ProjectSideIncome/mari-gunting

# Deploy function
supabase functions deploy billplz-webhook
```

---

## Step 3: Set Environment Variables

### In Supabase Dashboard:

1. Go to: https://supabase.com/dashboard/project/uufiyurcsldecspakneg
2. Click "Edge Functions" → "billplz-webhook" → "Settings"
3. Add these secrets:

```bash
SUPABASE_URL = https://uufiyurcsldecspakneg.supabase.co
SUPABASE_SERVICE_ROLE_KEY = <your-service-role-key>
BILLPLZ_API_KEY = e43b6fb0-bf85-4bc6-ada7-210aa52aec14
```

**Where to find Service Role Key:**
1. Go to Project Settings → API
2. Copy "service_role" key (NOT the anon key!)
3. ⚠️ NEVER expose this key in your app - it has admin access!

---

## Step 4: Get Your Webhook URL

After deploying, your webhook URL will be:

```
https://uufiyurcsldecspakneg.supabase.co/functions/v1/billplz-webhook
```

---

## Step 5: Configure Billplz to Use Your Webhook

### In Billplz Dashboard:

1. Go to: https://www.billplz.com/enterprise (or sandbox for testing)
2. Login to your account
3. Go to "Collections"
4. Click on collection: `1b_g1m_i`
5. Set "Callback URL" to:
   ```
   https://uufiyurcsldecspakneg.supabase.co/functions/v1/billplz-webhook
   ```
6. Enable "Send callback on payment completion"
7. Save changes

### For Testing (Sandbox):
Use the same URL but configure it in:
https://www.billplz-sandbox.com/enterprise

---

## Step 6: Update Your App Code

Your app should now use the webhook URL as the callback:

```typescript
// When creating a bill
const billResponse = await billplzService.createBill({
  // ... other params
  callbackUrl: 'https://uufiyurcsldecspakneg.supabase.co/functions/v1/billplz-webhook',
  redirectUrl: 'marigunting://payment-success', // Deep link back to app
})
```

---

## Step 7: Test the Webhook

### Test with Sandbox:

1. Create a test booking in your app
2. Go through payment flow
3. Use Billplz sandbox credentials to complete payment
4. Check Supabase logs:
   - Go to Edge Functions → billplz-webhook → Logs
   - You should see:
     ```
     [webhook] Received callback for bill: xxx
     [webhook] ✅ Signature verified
     [webhook] 💰 Processing successful payment
     [webhook] ✅ Payment processed successfully
     ```

5. Verify in database:
   ```sql
   SELECT * FROM payment_logs ORDER BY created_at DESC LIMIT 10;
   SELECT * FROM bookings WHERE payment_status = 'paid' ORDER BY created_at DESC LIMIT 5;
   ```

### Test Signature Verification:

Try sending a fake webhook (should be rejected):

```bash
curl -X POST https://uufiyurcsldecspakneg.supabase.co/functions/v1/billplz-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": "fake-bill",
    "paid": true,
    "x_signature": "fake-signature",
    "amount": 10000
  }'
```

Expected response: `401 Unauthorized - Invalid signature` ✅

---

## Step 8: Monitor in Production

### Check Webhook Delivery:

**In Billplz Dashboard:**
1. Go to "Bills" → Click on any bill
2. Scroll to "Callback History"
3. Check if webhook was delivered successfully
4. Status should be "200 OK"

**In Supabase:**
1. Edge Functions → billplz-webhook → Logs
2. Monitor for errors
3. Set up alerts for failures

### Check Payment Logs:

```sql
-- Get recent payment events
SELECT 
  pl.event,
  pl.amount / 100.0 as amount_myr,
  pl.transaction_id,
  b.id as booking_id,
  pl.created_at
FROM payment_logs pl
JOIN bookings b ON b.id = pl.booking_id
ORDER BY pl.created_at DESC
LIMIT 20;

-- Check for suspicious activity
SELECT * FROM payment_logs 
WHERE event = 'amount_mismatch' 
ORDER BY created_at DESC;

-- Verify payment consistency
SELECT * FROM check_payment_consistency();
```

---

## Troubleshooting

### Webhook Not Receiving Callbacks

**Check 1: Verify URL is correct**
```bash
curl https://uufiyurcsldecspakneg.supabase.co/functions/v1/billplz-webhook
# Should return: Method not allowed (POST required)
```

**Check 2: Check Edge Function logs**
- Go to Supabase Dashboard → Edge Functions → Logs
- Look for any errors

**Check 3: Verify Billplz configuration**
- Callback URL must be publicly accessible
- URL must start with `https://` (not `http://`)
- No authentication required on the endpoint

### Signature Verification Fails

**Check 1: Verify API key is correct**
```bash
# In Supabase Edge Function secrets
echo $BILLPLZ_API_KEY
# Should match your .env: e43b6fb0-bf85-4bc6-ada7-210aa52aec14
```

**Check 2: Check for webhook format changes**
- Billplz may update their webhook format
- Check their docs: https://www.billplz.com/api#callbacks

### Payment Not Updating

**Check 1: Verify booking exists**
```sql
SELECT * FROM bookings WHERE id = '<booking-id>';
```

**Check 2: Check RLS policies**
```sql
-- Service role should have full access
SELECT * FROM bookings WHERE id = '<booking-id>';
```

**Check 3: Check payment_logs for errors**
```sql
SELECT * FROM payment_logs 
WHERE booking_id = '<booking-id>' 
ORDER BY created_at DESC;
```

---

## Security Checklist

Before going live:

- [x] Database migration deployed
- [x] Edge Function deployed
- [x] Environment variables set
- [x] Webhook URL configured in Billplz
- [x] Signature verification tested
- [x] RLS policies enabled
- [x] Test payment completed successfully
- [ ] Webhook monitoring set up
- [ ] Error alerts configured
- [ ] Payment logs reviewed

---

## Emergency Procedures

### If Webhook Goes Down:

1. Check Billplz Dashboard → Bills → Recent bills
2. Look for bills that were paid but not updated in your database
3. Manually verify and update:
   ```sql
   -- Check unpaid bills that might be paid
   SELECT * FROM bookings 
   WHERE payment_status = 'pending' 
   AND bill_id IS NOT NULL;
   
   -- Manually verify each in Billplz dashboard
   -- Then update if paid:
   UPDATE bookings 
   SET 
     payment_status = 'paid',
     status = 'confirmed',
     paid_at = '2025-10-18T12:00:00Z',
     transaction_id = '<from-billplz>'
   WHERE id = '<booking-id>';
   ```

### If Suspicious Activity Detected:

1. Check `payment_logs` for `amount_mismatch` events
2. Investigate the booking
3. Contact Billplz support if needed
4. Refund if fraudulent

---

## Next Steps

After deploying:

1. ✅ Test with RM 1.00 payment
2. ✅ Monitor logs for 24 hours
3. ✅ Set up Sentry for error tracking
4. ✅ Document refund process
5. ✅ Train support team on payment issues

---

## Support

**Supabase:**
- Dashboard: https://supabase.com/dashboard
- Docs: https://supabase.com/docs/guides/functions
- Support: support@supabase.io

**Billplz:**
- Dashboard: https://www.billplz.com/enterprise
- Docs: https://www.billplz.com/api
- Support: support@billplz.com / +603-7732 2999

---

**🎯 Once deployed, your payment system will be production-ready and secure! 🔐**
