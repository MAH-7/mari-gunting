# 🚨 DEPLOY WEBHOOK NOW - Quick Guide

## What I Created For You:

1. ✅ **Secure Webhook Handler**
   - File: `supabase/functions/billplz-webhook/index.ts`
   - HMAC-SHA256 signature verification
   - Amount validation
   - Duplicate payment prevention
   - Audit logging

2. ✅ **Database Security**
   - File: `supabase/migrations/20250118_payment_security.sql`
   - `payment_logs` table for audit trail
   - Row Level Security (RLS) policies
   - Prevents client-side payment manipulation

3. ✅ **Full Documentation**
   - `WEBHOOK_DEPLOYMENT.md` - Complete deployment guide
   - `PRODUCTION_SECURITY.md` - Security best practices

---

## 🎯 Deploy in 5 Minutes:

### 1. Run Database Migration (2 min)
```
1. Go to: https://supabase.com/dashboard/project/uufiyurcsldecspakneg
2. SQL Editor → New Query
3. Copy/paste: supabase/migrations/20250118_payment_security.sql
4. Click "Run"
```

### 2. Deploy Edge Function (2 min)
```
1. Edge Functions → Create new function
2. Name: billplz-webhook
3. Copy/paste: supabase/functions/billplz-webhook/index.ts
4. Deploy
```

### 3. Set Secrets (1 min)
```
In Edge Function settings, add:
- SUPABASE_URL = https://uufiyurcsldecspakneg.supabase.co
- SUPABASE_SERVICE_ROLE_KEY = <from Project Settings → API>
- BILLPLZ_API_KEY = e43b6fb0-bf85-4bc6-ada7-210aa52aec14
```

### 4. Configure Billplz
```
In Billplz Dashboard:
- Collection callback URL:
  https://uufiyurcsldecspakneg.supabase.co/functions/v1/billplz-webhook
```

---

## ⚡ Test It:

1. Make a test payment (RM 1.00)
2. Check logs in Supabase → Edge Functions → Logs
3. Should see: `[webhook] ✅ Payment processed successfully`
4. Verify: `SELECT * FROM payment_logs;`

---

## 🔴 CRITICAL: Do This Before Accepting Real Payments

Your payment system is NOT SECURE until webhook is deployed!

**Why?**
- Right now: Payment verification happens in the app (can be hacked)
- After webhook: Verification happens on server (secure)

---

## 📞 Need Help?

Read: `WEBHOOK_DEPLOYMENT.md` for complete step-by-step guide

**Quick Links:**
- Supabase: https://supabase.com/dashboard/project/uufiyurcsldecspakneg
- Billplz: https://www.billplz.com/enterprise

---

## What Happens After Deployment:

✅ Payments verified server-side (secure)  
✅ Payment manipulation prevented  
✅ Audit trail for all transactions  
✅ Automatic fraud detection  
✅ Production-ready security  

---

**⏰ Time to deploy: ~5 minutes**  
**⚠️ Urgency: CRITICAL - Do before launch**
