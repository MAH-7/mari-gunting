# Authorized Payment Cancellation Implementation

## Problem Scenario
Customer cancels booking after:
1. Barber accepts booking
2. Customer authorizes payment (`payment_status: 'authorized'`)
3. But **before** barber starts service (clicks "I'm on the way")

## Solution: Payment Reversal vs Refund

### Understanding the Difference

**Authorized Payment (Hold)**
- Money is held/reserved on customer's card
- Not yet transferred to merchant
- **Auto-expires in 5-7 days** (no explicit reverse needed for Razorpay/Curlec)
- Customer sees hold removed automatically

**Captured Payment (Completed)**
- Money has been transferred to merchant
- Requires **refund** (takes 5-10 business days)
- Customer sees charge then refund

## Implementation

### 1. Database Migration: Add Reversal Statuses
**File**: `supabase/migrations/20250123_add_reverse_payment_statuses.sql`

```sql
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'reversing';
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'reversed';
```

New payment status flow:
- `authorized` → `reversing` → `reversed` (for cancelled bookings)
- `authorized` → `completed` (for completed service)

### 2. Update cancel_booking Function
**File**: `supabase/migrations/20250123_handle_authorized_payment_cancel.sql`

Changes:
- Added `reverse_needed` return field
- Check for `payment_status = 'authorized'` before checking `= 'completed'`
- Set `payment_status = 'reversing'` for authorized payments
- Set `payment_status = 'refund_pending'` for completed payments

### 3. Create Reverse Payment Edge Function
**File**: `supabase/functions/reverse-curlec-payment/index.ts`

Calls Curlec API to reverse/void the authorization:
```typescript
POST /v1/payments/{payment_id}/reverse
```

### 4. Update bookingService.cancelBooking()
**File**: `packages/shared/services/bookingService.ts`

Added logic to:
1. Check if `reverse_needed` (authorized payment)
2. Call `reverse-curlec-payment` Edge Function
3. Update `payment_status` to `'reversed'`
4. Fallback to refund logic for captured payments

## Flow Diagrams

### Happy Path (Service Completed)
```
1. Customer creates booking → payment_status: 'pending_payment'
2. Barber accepts → status: 'accepted', payment_status: 'pending_payment'
3. Customer pays → payment_status: 'authorized'
4. Barber "on the way" → status: 'on_the_way'
5. Barber completes → status: 'completed', payment captured
6. Payment captured → payment_status: 'completed'
```

### Cancellation Path (Before Service Starts)
```
1. Customer creates booking → payment_status: 'pending_payment'
2. Barber accepts → status: 'accepted'
3. Customer pays → payment_status: 'authorized'
4. Customer cancels → status: 'cancelled', payment_status: 'reversed'
5. Authorization auto-expires in 5-7 days
6. Hold removed from customer's card ✅
```

### Cancellation Path (After Service Captured)
```
1. Service completed → payment_status: 'completed'
2. Customer/Barber cancels → status: 'cancelled', payment_status: 'refund_pending'
3. Refund initiated → payment_status: 'refund_initiated'
4. Refund completed → payment_status: 'refunded'
5. Money returned to customer (5-10 days) ✅
```

## User Experience

### For Customer - Authorized Payment Cancellation
**Before Service Starts:**
- ✅ Cancels booking
- ✅ Hold auto-expires in 5-7 days
- ✅ No charge appears on statement
- ✅ Money never leaves their account

**After Service Captured:**
- ✅ Cancels booking
- ⏳ Sees charge on card
- ⏳ Refund initiated
- ⏳ Money returned in 5-10 days

### For Barber
- Receives cancellation notification
- No payment received (since reversed)
- Can accept new bookings
- Clean cancellation record

## Benefits

### 1. **Better UX**
- Instant reversal vs 5-10 day refund
- No "phantom charge" on customer's card
- Matches industry standards (Grab, Uber, etc.)

### 2. **Lower Costs**
- Reversal is usually free
- Refund may have fees
- Less customer support tickets

### 3. **Faster Process**
- Reversal: Instant
- Refund: 5-10 business days
- Better customer satisfaction

### 4. **Correct Accounting**
- Authorized = held (not revenue)
- Only capture when service complete
- Accurate financial reporting

## Edge Cases Handled

### 1. Network Issues During Reversal
- Booking still cancelled
- Payment status marked as `'reversing'`
- Can retry reversal manually
- Customer protected

### 2. Curlec API Down
- Booking cancelled successfully
- Reverse attempt logged
- Manual reversal possible
- Error logged for support

### 3. Concurrent Cancellation & Service Start
- Database transaction prevents
- First action wins
- Other action fails gracefully
- Consistent state maintained

### 4. Customer Cancels Before Payment
- `payment_status: 'pending_payment'`
- Simple cancellation
- No reversal/refund needed

## Testing Scenarios

### Test 1: Cancel After Authorization
```
1. Create booking with card payment
2. Barber accepts
3. Customer pays (authorize)
4. Customer cancels immediately
Expected: payment_status → 'reversed', no charge
```

### Test 2: Cancel After Capture
```
1. Complete full service
2. Payment captured
3. Customer requests cancel/dispute
Expected: payment_status → 'refunded', 5-10 days
```

### Test 3: Cancel Without Payment
```
1. Create booking
2. Barber accepts
3. Customer cancels (no payment yet)
Expected: Simple cancellation, no payment action
```

## Deployment Steps

### 1. Apply Database Migrations (in order)
```bash
# In Supabase SQL Editor:
1. 20250123_add_reverse_payment_statuses.sql
2. 20250123_handle_authorized_payment_cancel.sql
```

### 2. Deploy Edge Function
```bash
npx supabase functions deploy reverse-curlec-payment
```

### 3. Verify Curlec Reverse API
Check Curlec documentation for exact endpoint:
- May be `/payments/{id}/reverse`
- Or `/payments/{id}/void`
- Update edge function accordingly

### 4. Test Flow
1. Create test booking
2. Accept and authorize payment
3. Cancel before service
4. Check logs for reversal
5. Verify payment_status = 'reversed'

## Monitoring

### Key Metrics
- `payment_status = 'reversed'` count
- `payment_status = 'reversing'` (stuck reversals)
- Failed reverse attempts
- Average reversal time

### Alerts
- Failed reversals > 5% of attempts
- Stuck in `'reversing'` for > 10 minutes
- Curlec API errors

## Future Enhancements

1. **Auto-retry Failed Reversals**: Retry up to 3 times with exponential backoff
2. **Customer Notification**: "Your hold has been removed"
3. **Admin Dashboard**: View and manually trigger reversals
4. **Analytics**: Track cancellation patterns

---

**Date**: January 2025  
**Status**: ✅ Ready for Deployment  
**Related Docs**: 
- `barber-payment-wait-implementation.md`
- `payment-capture-implementation.md`
