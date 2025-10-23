# Auth-Capture Payment Flow Deployment Guide

**Status**: Ready to deploy  
**Created**: 2025-01-23

---

## Summary

Implemented authorize-then-capture payment flow for better customer experience:
- Payment **authorized** (held) when booking created
- Payment **captured** (taken) when barber accepts
- Payment **auto-released** (refunded instantly) if barber rejects/ignores

### Benefits:
✅ **Instant "refunds"** - Authorization release is instant, not 5-7 days  
✅ **Better UX** - Customer only charged when barber confirms  
✅ **Less refund complexity** - No refund API needed for early rejections  
✅ **Industry standard** - How Grab/Uber work  

---

## What Changed:

1. ✅ Created `capture-curlec-payment` Edge Function
2. ✅ Added `authorized` payment status to database
3. ✅ Updated webhook to set status to `authorized` (not `processing`)
4. ✅ Updated barber accept flow to capture payment
5. ✅ Kept refund system for post-acceptance cancellations

---

## Deployment Steps

### 1. Update Curlec Dashboard Settings

**IMPORTANT: Do this FIRST**

Go to **Curlec Dashboard → Settings → Payment Capture**

**Change from:**
- ✅ Automatic Capture: 12 mins

**Change to:**
- ✅ **Manual Capture Only**
- ✅ Manual Capture Duration: **7 days** (max allowed)
- ✅ Auto-release after 7 days: Enabled

**What this does:**
- Payments will be **authorized** but not captured automatically
- You must manually capture via API when barber accepts
- If not captured within 7 days, automatically released to customer

---

### 2. Deploy Edge Function

```bash
# Deploy capture function
supabase functions deploy capture-curlec-payment

# Verify
supabase functions list
```

---

### 3. Run Database Migration

```sql
-- Run this in Supabase SQL Editor
-- File: supabase/migrations/20250123_add_authorized_payment_status.sql

DO $$ BEGIN
  ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'authorized';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
```

---

### 4. Deploy Updated Webhook Function

```bash
# Redeploy webhook with new authorized handler
supabase functions deploy curlec-webhook
```

---

### 5. Deploy App Code

Push the updated code to production:
- Updated `bookingService.ts` (capture on accept)
- Updated webhook handler (set authorized status)

---

## New Payment Flow

### Scenario 1: Barber accepts ✅

1. Customer books → Payment **authorized** (RM 50 held on card)
2. Booking status: `pending`, Payment status: `authorized`
3. Barber accepts → **Capture API called**
4. Booking status: `accepted` → `confirmed`, Payment status: `completed`
5. Money taken from customer's card

### Scenario 2: Barber rejects ❌

1. Customer books → Payment **authorized** (RM 50 held)
2. Booking status: `pending`, Payment status: `authorized`
3. Barber rejects → Booking status: `rejected`
4. Authorization **auto-expires** (instant release)
5. Money returned to customer **instantly** (no refund needed)

### Scenario 3: Barber ignores ⏰

1. Customer books → Payment **authorized** (RM 50 held)
2. Booking status: `pending`, Payment status: `authorized`
3. No action for 7 days
4. Authorization **expires automatically**
5. Money returned to customer (Curlec handles this)

### Scenario 4: Cancel after accept (still need refund) 💸

1. Customer books → Authorized → Barber accepts → **Captured**
2. Customer/barber cancels later → **Refund API called**
3. Refund takes 5-7 days (normal refund flow)

---

## Testing

### Test 1: Authorize → Accept → Capture

1. Create booking with card payment
2. **Check webhook logs:**
   ```bash
   supabase functions logs curlec-webhook
   ```
   Should see: "Payment authorized for booking"

3. **Check database:**
   ```sql
   SELECT status, payment_status, curlec_payment_id 
   FROM bookings 
   WHERE booking_number = 'MG20251023XXX';
   ```
   Expected: `status='pending'`, `payment_status='authorized'`

4. **Barber accepts booking**
5. **Check logs:**
   ```bash
   supabase functions logs capture-curlec-payment
   ```
   Should see: "Payment captured successfully"

6. **Check database again:**
   Expected: `status='confirmed'`, `payment_status='completed'`

---

### Test 2: Authorize → Reject (No Capture)

1. Create booking with card payment
2. Payment status should be `authorized`
3. Barber rejects booking
4. **No capture happens** - authorization just expires
5. Customer money returned instantly by bank
6. No refund API called ✅

---

### Test 3: Capture Failure Handling

1. Create booking
2. Manually cancel the payment in Curlec dashboard (simulate failure)
3. Barber accepts
4. **Capture should fail gracefully**
5. Check logs for error message
6. Booking still accepted but payment needs manual processing

---

## Monitoring Queries

### Check authorized payments waiting for capture

```sql
SELECT 
  booking_number,
  status,
  payment_status,
  curlec_payment_id,
  total_price,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/3600 AS hours_since_created
FROM bookings
WHERE payment_status = 'authorized'
  AND status = 'pending'
ORDER BY created_at DESC;
```

### Check capture success rate

```sql
-- Payments that went from authorized to completed
SELECT 
  COUNT(*) FILTER (WHERE payment_status = 'completed') AS captured,
  COUNT(*) FILTER (WHERE payment_status = 'authorized') AS still_authorized,
  COUNT(*) AS total
FROM bookings
WHERE payment_method LIKE 'curlec%'
  AND created_at >= NOW() - INTERVAL '7 days';
```

### Failed captures (need manual processing)

```sql
SELECT 
  booking_number,
  status,
  payment_status,
  curlec_payment_id,
  total_price,
  created_at
FROM bookings
WHERE status = 'accepted'
  AND payment_status = 'authorized'
  AND created_at < NOW() - INTERVAL '1 hour'; -- Accepted but not captured
```

---

## Rollback Plan

If auth-capture doesn't work:

### Option 1: Re-enable auto-capture

1. Go to Curlec Dashboard → Settings → Payment Capture
2. Enable "Automatic Capture: 12 mins"
3. Existing code will still work (capture on accept becomes redundant)

### Option 2: Revert code changes

```bash
git revert <commit-hash>
git push
```

---

## Common Issues

### Issue: Payment stuck in "authorized"

**Cause:** Capture function not called or failed  
**Check:**
```bash
supabase functions logs capture-curlec-payment
```
**Fix:**
- Manually capture in Curlec dashboard
- Or wait 7 days for auto-release

### Issue: Capture fails with "payment already captured"

**Cause:** Webhook already captured it (auto-capture still enabled)  
**Fix:**
- Verify Curlec dashboard has auto-capture DISABLED
- Code will handle this gracefully (logs error but continues)

### Issue: Customer complains money held but booking cancelled

**Cause:** Barber rejected but authorization hasn't expired yet  
**Timeline:** Authorization can take 1-7 days to expire depending on bank  
**Fix:**
- Explain to customer: "Hold will be released within 24-48 hours"
- Or manually release in Curlec dashboard

---

## Customer Communication

### When payment authorized (booking pending):
```
Booking created!
Payment of RM XX.XX is on hold.
You'll only be charged when the barber accepts.
```

### When barber accepts (payment captured):
```
Booking confirmed!
Payment of RM XX.XX charged to your card.
Your barber is on the way!
```

### When barber rejects (auto-release):
```
Booking cancelled.
The RM XX.XX hold on your card will be released within 24-48 hours.
No charges applied.
```

---

## Production Checklist

- [ ] Curlec dashboard: Auto-capture DISABLED
- [ ] Curlec dashboard: Manual capture duration set to 7 days
- [ ] Edge Function `capture-curlec-payment` deployed
- [ ] Database migration applied (authorized status)
- [ ] Webhook function redeployed
- [ ] App code deployed (capture on accept)
- [ ] Test: Authorize → Accept → Capture works
- [ ] Test: Authorize → Reject → No capture works
- [ ] Customer support trained on new flow
- [ ] Monitoring queries ready

---

**Deployment Date**: _____________  
**Tested By**: _____________  
**Production Ready**: ✅ Yes / ❌ No

---

_Last updated: 2025-01-23_
