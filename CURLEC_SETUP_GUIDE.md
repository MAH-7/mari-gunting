# Razorpay Curlec (Malaysia) Setup Guide

## ✅ What's Been Completed

1. **SDK Installed** - react-native-razorpay
2. **Service Created** - `curlecService.ts` with Malaysian payment methods  
3. **Environment Variables** - Added to all config files
4. **Edge Functions** - Created 3 functions (create-order, verify-payment, webhook)
5. **Database Migration** - Ready to apply
6. **Payment Screen** - Integrated Curlec for Card & FPX

---

## 🔧 Configuration Steps

### Step 1: Get Curlec API Keys

1. **Sign up for Razorpay Curlec**
   - Go to: https://curlec.com/ or https://dashboard.curlec.com/
   - Create an account (Malaysian business)
   - Complete KYC verification

2. **Get API Keys**
   - Dashboard → Settings → API Keys
   - Copy **Test Key ID** (starts with `rzp_test_`)
   - Copy **Test Key Secret**

### Step 2: Add Keys to Environment

Add to `/Users/bos/Desktop/ProjectSideIncome/mari-gunting/apps/customer/.env`:

```bash
# Razorpay Curlec (Malaysia) - TEST MODE
EXPO_PUBLIC_CURLEC_KEY_ID=rzp_test_YOUR_KEY_HERE
EXPO_PUBLIC_CURLEC_CURRENCY=MYR
```

Add to Supabase Secrets (for Edge Functions):
```bash
supabase secrets set CURLEC_KEY_ID=rzp_test_YOUR_KEY_HERE --project-ref uufiyurcsldecspakneg
supabase secrets set CURLEC_KEY_SECRET=YOUR_SECRET_HERE --project-ref uufiyurcsldecspakneg
```

### Step 3: Deploy Edge Functions

```bash
cd /Users/bos/Desktop/ProjectSideIncome/mari-gunting

# Deploy all Curlec functions
supabase functions deploy create-curlec-order
supabase functions deploy verify-curlec-payment  
supabase functions deploy curlec-webhook
```

### Step 4: Apply Database Migration

```bash
supabase db push
```

Select the migration: `20251021_add_curlec_fields.sql`

### Step 5: Configure Curlec Dashboard

#### Enable Payment Methods:
1. Dashboard → Settings → Payment Methods
2. Enable:
   - ✅ **Cards** (Visa, Mastercard)
   - ✅ **FPX** (Malaysian Banks)
   - ✅ **E-Wallets** (TNG, GrabPay, ShopeePay) - Optional

#### Set up Webhook:
1. Dashboard → Settings → Webhooks
2. Click **Create Webhook**
3. **Webhook URL:**
   ```
   https://uufiyurcsldecspakneg.supabase.co/functions/v1/curlec-webhook
   ```
4. **Active Events** - Select:
   - ✅ payment.authorized
   - ✅ payment.captured
   - ✅ payment.failed
   - ✅ order.paid

5. **Secret** - Leave empty (Curlec auto-generates)
6. Click **Create**
7. **Copy the webhook secret** shown after creation

8. Add webhook secret to Supabase:
   ```bash
   supabase secrets set CURLEC_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET_HERE
   ```

---

## 🧪 Testing

### Test Card Numbers (Curlec Test Mode):

**Success:**
- Card: `4111 1111 1111 1111`
- Expiry: Any future date
- CVV: Any 3 digits

**Failure:**
- Card: `4000 0000 0000 0002`

### Test FPX:
In test mode, select any bank and it will simulate success/failure.

### Testing Steps:

1. **Rebuild the app:**
   ```bash
   cd apps/customer
   npx expo run:ios
   ```

2. **Test Card Payment:**
   - Navigate to payment screen
   - Select **Card** method
   - Click Continue
   - Enter test card: `4111 1111 1111 1111`
   - Complete payment

3. **Test FPX:**
   - Select **Online Banking** method
   - Click Continue
   - Choose any Malaysian bank
   - Complete test payment

4. **Check Logs:**
   ```bash
   # Curlec function logs
   supabase functions logs create-curlec-order --follow
   supabase functions logs verify-curlec-payment --follow
   supabase functions logs curlec-webhook --follow
   ```

---

## 🚀 Going Live

### When ready for production:

1. **Get Live Keys:**
   - Complete KYC in Curlec dashboard
   - Get Live Key ID & Secret

2. **Update Environment:**
   ```bash
   # Change to live keys
   EXPO_PUBLIC_CURLEC_KEY_ID=rzp_live_YOUR_LIVE_KEY
   ```

3. **Update Supabase Secrets:**
   ```bash
   supabase secrets set CURLEC_KEY_ID=rzp_live_YOUR_LIVE_KEY
   supabase secrets set CURLEC_KEY_SECRET=YOUR_LIVE_SECRET
   ```

4. **Test thoroughly** with small amounts first!

---

## 🔍 Troubleshooting

### "Payment Not Available" error:
- Check if `EXPO_PUBLIC_CURLEC_KEY_ID` is in `.env`
- Rebuild app after adding env vars
- Check Metro logs: `💳 Curlec: ✅`

### FPX not showing:
- FPX requires live/production mode in Curlec
- Or contact Curlec support to enable in test mode
- Check Dashboard → Settings → Payment Methods

### Webhook not working:
- Verify webhook URL is correct
- Check `CURLEC_WEBHOOK_SECRET` is set
- View webhook logs in Curlec dashboard

### Payment verification fails:
- Check `CURLEC_KEY_SECRET` matches dashboard
- Verify signature algorithm in verify function
- Check Edge Function logs

---

## 📚 Key Differences: Curlec vs Razorpay

| Feature | Razorpay (India) | Curlec (Malaysia) |
|---------|------------------|-------------------|
| API URL | api.razorpay.com | api.curlec.com |
| Primary Currency | INR | MYR |
| FPX Support | ❌ No | ✅ Yes |
| UPI Support | ✅ Yes | ❌ No |
| Malaysian Banks | ❌ No | ✅ Yes |
| SDK | react-native-razorpay | Same SDK, different keys |

---

## ✅ Checklist

- [ ] Signed up for Curlec account
- [ ] Got test API keys
- [ ] Added keys to `.env`
- [ ] Added secrets to Supabase
- [ ] Deployed Edge Functions
- [ ] Applied database migration
- [ ] Configured webhook in dashboard
- [ ] Enabled Card & FPX payment methods
- [ ] Rebuilt the app
- [ ] Tested card payment
- [ ] Tested FPX payment
- [ ] Verified webhook receives events

---

Need help? Check:
- Curlec Docs: https://docs.curlec.com/
- Razorpay Docs: https://razorpay.com/docs/
- Support: support@curlec.com
