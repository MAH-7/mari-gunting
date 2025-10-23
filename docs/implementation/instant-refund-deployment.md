# Instant Refund Deployment Guide

**Status**: Ready to deploy  
**Created**: 2025-01-23

---

## Summary

Implemented Curlec instant refund functionality for cancelled bookings with automatic capture and optimized refund speed.

### What Changed:
1. ✅ Created `refund-curlec-payment` Edge Function (instant refund API)
2. ✅ Updated `cancel_booking` RPC to call instant refund
3. ✅ Added refund webhook handlers (refund.created, refund.processed, refund.failed)
4. ✅ Added `curlec_refund_id` column to bookings table
5. ✅ Configured Curlec dashboard for automatic capture (12 mins)

---

## Deployment Steps

### 1. Deploy Edge Function

```bash
# Deploy the new refund function
supabase functions deploy refund-curlec-payment

# Verify deployment
supabase functions list
```

### 2. Run Database Migration

```bash
# Apply the new migration
supabase db push

# Or if using migration files
supabase migration up
```

**Migration includes:**
- New column: `bookings.curlec_refund_id`
- New payment statuses: `refund_initiated`, `refund_pending`, `refund_failed`
- Updated `cancel_booking()` function with instant refund

### 3. Update Webhook Configuration

**In Curlec Dashboard:**
1. Go to Settings → Webhooks
2. Add these events (if not already subscribed):
   - ✅ `refund.created`
   - ✅ `refund.processed`
   - ✅ `refund.failed`
3. Webhook URL: `https://your-project.supabase.co/functions/v1/curlec-webhook`

### 4. Verify Curlec Settings

**Capture Settings (should already be done):**
- ✅ Automatic Capture: 12 mins
- ✅ Manual Capture Duration: 1 hour
- ✅ Auto-refund after 1 hour: Normal speed

---

## Testing

### Test 1: Instant Refund (Happy Path)

1. **Create booking with card payment**
   ```typescript
   // Book a barber service
   // Pay with card
   // Payment will auto-capture
   ```

2. **Cancel booking**
   ```typescript
   // Call cancel_booking RPC
   // Should trigger instant refund
   ```

3. **Verify**:
   - Check booking `payment_status`: `refund_initiated`
   - Check booking `curlec_refund_id`: Should have value (rfnd_xxx)
   - Check Curlec dashboard: Refund created
   - Within hours: Customer receives refund

### Test 2: Refund Webhook

1. **Wait for refund webhook from Curlec**
   - Event: `refund.processed`
   - Should update `payment_status` to `refunded`

2. **Check Supabase logs**:
   ```bash
   supabase functions logs curlec-webhook --follow
   ```

3. **Look for**:
   - `[Curlec Webhook] Refund processed`
   - Refund amount logged
   - Speed: `optimum` or `instant`

### Test 3: Edge Cases

**Test A: Network failure during refund**
- Cancel booking
- If Edge Function fails → `payment_status` = `refund_pending`
- Customer sees: "Refund pending - contact support"
- Manual refund required

**Test B: Refund fails at Curlec**
- Rare case (e.g., payment too old)
- Webhook: `refund.failed`
- `payment_status` = `refund_failed`
- Alert admin for manual handling

---

## Monitoring

### Check Refund Status

```sql
-- Recent refunds
SELECT 
  id,
  booking_number,
  payment_method,
  payment_status,
  total_price,
  curlec_payment_id,
  curlec_refund_id,
  cancelled_at
FROM bookings
WHERE payment_status IN ('refund_initiated', 'refund_pending', 'refunded', 'refund_failed')
ORDER BY cancelled_at DESC
LIMIT 20;
```

### Check Refund Speed

```sql
-- Time from cancellation to refund completion
SELECT 
  booking_number,
  cancelled_at,
  updated_at,
  (updated_at - cancelled_at) AS refund_duration,
  payment_status
FROM bookings
WHERE payment_status = 'refunded'
  AND cancelled_at IS NOT NULL
ORDER BY cancelled_at DESC;
```

### Failed Refunds (Needs Manual Action)

```sql
-- Refunds that need attention
SELECT 
  id,
  booking_number,
  customer_id,
  total_price,
  curlec_payment_id,
  curlec_refund_id,
  payment_status,
  cancelled_at
FROM bookings
WHERE payment_status IN ('refund_pending', 'refund_failed')
ORDER BY cancelled_at DESC;
```

---

## Rollback Plan

If instant refunds don't work:

### Option A: Revert to Credits-Only

```bash
# Re-apply old migration
supabase db push --file supabase/migrations/20250121_refund_to_credits_on_cancel.sql
```

### Option B: Manual Refunds

1. Keep cancellation working
2. Mark as `refund_pending`
3. Process refunds manually via Curlec dashboard

---

## Customer Communication

### Success Message (Instant Refund)
```
Booking cancelled. 
Refund of RM XX.XX initiated.
You should receive your refund within a few hours.
```

### Fallback Message (Pending)
```
Booking cancelled.
Refund pending - our team will process it shortly.
Please contact support if you don't receive it within 5-7 days.
```

---

## Expected Refund Timeline

| Scenario | Timeline | Status |
|----------|----------|--------|
| Instant refund (optimum) | 1-4 hours | Best case ✅ |
| Normal refund | 5-7 days | Fallback |
| Manual refund | 1-2 days | Manual intervention |

---

## Troubleshooting

### Issue: Refund not initiated

**Check:**
1. Edge Function deployed? `supabase functions list`
2. Edge Function working? Check logs
3. Payment ID exists? `curlec_payment_id` in bookings
4. Curlec credentials valid?

**Fix:**
```bash
# Check function logs
supabase functions logs refund-curlec-payment

# Redeploy if needed
supabase functions deploy refund-curlec-payment
```

### Issue: Webhook not received

**Check:**
1. Webhook URL correct in Curlec dashboard?
2. Webhook events enabled? (refund.*)
3. Webhook secret configured in Supabase?

**Fix:**
1. Verify webhook URL
2. Test webhook with Curlec dashboard test feature
3. Check webhook logs

### Issue: Refund stuck in "initiated"

**Possible reasons:**
1. Webhook not arriving (check Curlec logs)
2. Refund processing takes time (wait up to 24 hours)
3. Bank processing delay

**Action:**
- Check Curlec dashboard for refund status
- If `processed` in Curlec but not in app → Webhook issue
- If `pending` in Curlec → Bank processing

---

## Metrics to Track

### Key Metrics:
1. **Refund success rate**: % of refunds that complete successfully
2. **Average refund time**: Time from cancel to refund completed
3. **Instant refund rate**: % of refunds processed instantly vs normal
4. **Failed refund rate**: % requiring manual intervention

### Dashboard Query:
```sql
-- Refund metrics (last 30 days)
SELECT 
  COUNT(*) AS total_refunds,
  COUNT(*) FILTER (WHERE payment_status = 'refunded') AS successful,
  COUNT(*) FILTER (WHERE payment_status = 'refund_failed') AS failed,
  COUNT(*) FILTER (WHERE payment_status = 'refund_pending') AS pending,
  AVG(EXTRACT(EPOCH FROM (updated_at - cancelled_at))/3600) AS avg_hours_to_refund
FROM bookings
WHERE cancelled_at >= NOW() - INTERVAL '30 days'
  AND payment_method LIKE 'curlec%'
  AND payment_status IN ('refunded', 'refund_failed', 'refund_pending', 'refund_initiated');
```

---

## Next Steps (Future Enhancements)

### Phase 2:
1. **Admin dashboard** for failed refunds
2. **Customer notifications** when refund completes
3. **Automatic retry** for failed refunds
4. **Analytics** for refund performance

### Phase 3:
1. **Partial refunds** (if service partially completed)
2. **Refund vouchers** (option to convert to credits with bonus)
3. **Chargeback prevention** (track refund requests)

---

## Production Checklist

Before going live:

- [ ] Edge Function deployed successfully
- [ ] Migration applied to production database
- [ ] Webhook events configured in Curlec
- [ ] Tested successful refund flow
- [ ] Tested failed refund handling
- [ ] Monitoring queries ready
- [ ] Customer support trained on refund process
- [ ] Refund policy updated in T&Cs

---

**Deployment Date**: _____________  
**Tested By**: _____________  
**Production Ready**: ✅ Yes / ❌ No

---

_Last updated: 2025-01-23_
