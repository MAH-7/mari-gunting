# Duplicate Prevention Deployment Guide
**Date**: 2025-02-11  
**Standard**: Grab/Uber Production Best Practices  
**Status**: Ready for Production Deployment

---

## 🎯 What We're Implementing

### **Solution #1: Idempotency Key** (MUST HAVE)
- Prevents: Network retries, API replays, payment duplicates
- Implementation: Database column + function check
- Standard: Stripe/Grab/Uber pattern

### **Solution #2: Time-Window Duplicate Check** (GRAB STYLE)
- Prevents: User confusion (soft warning only)
- Implementation: Logs duplicates but ALLOWS them
- Standard: Grab flexible approach (user has control)

### **Solution #3: Rate Limiting** (GRAB STANDARD)
- Prevents: Bot attacks, DDoS, spam
- Implementation: Edge Function (10 requests/minute)
- Standard: Grab lenient limits

---

## 📦 Files Created

### **Database Migrations**:
1. ✅ `supabase/migrations/20250211_add_idempotency_key.sql`
   - Adds `idempotency_key` column to bookings table
   - Creates unique index
   - Safe for production (nullable column)

2. ✅ `supabase/migrations/20250211_update_create_booking_v2_duplicate_prevention.sql`
   - Updates `create_booking_v2` function
   - Adds idempotency check (hard block)
   - Adds time-window check (soft warning)

### **Edge Function**:
3. ✅ `supabase/functions/create-booking-with-rate-limit/index.ts`
   - Rate limiting: 10 requests per minute
   - JWT validation
   - Calls create_booking_v2

### **Client Updates** (TO BE DONE):
4. ⏳ Update `packages/shared/services/bookingService.ts`
5. ⏳ Update `packages/shared/types/index.ts`

---

## 🚀 Deployment Steps

### **Step 1: Deploy Database Migrations** (5 min)

```bash
cd /Users/bos/Desktop/ProjectSideIncome/mari-gunting

# Apply migrations
npx supabase db push

# Expected output:
# ✓ Migration applied: 20250211_add_idempotency_key.sql
# ✓ Migration applied: 20250211_update_create_booking_v2_duplicate_prevention.sql
```

**Verify**:
```sql
-- Check column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'bookings' AND column_name = 'idempotency_key';

-- Should return: idempotency_key | text

-- Check function updated
SELECT proname, pronargs FROM pg_proc WHERE proname = 'create_booking_v2';
-- Should show: 14 parameters (added p_idempotency_key)
```

---

### **Step 2: Deploy Edge Function** (3 min)

```bash
# Deploy Edge Function
npx supabase functions deploy create-booking-with-rate-limit

# Expected output:
# ✓ Function deployed: create-booking-with-rate-limit
# ✓ URL: https://your-project.supabase.co/functions/v1/create-booking-with-rate-limit
```

**Test Edge Function**:
```bash
# Test with curl (replace YOUR_TOKEN and YOUR_PROJECT_URL)
curl -X POST \
  https://YOUR_PROJECT_URL.supabase.co/functions/v1/create-booking-with-rate-limit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "test-user-id",
    "p_barber_id": "test-barber-id",
    "p_service_ids": ["service-1"],
    "p_scheduled_datetime": "2025-02-15T14:00:00+08:00",
    "p_service_type": "home_service",
    "p_idempotency_key": "test_key_123"
  }'
```

---

### **Step 3: Update Client Code** (15 min)

#### **A. Update bookingService.ts**

Find this section in `packages/shared/services/bookingService.ts`:

```typescript
async createBookingV2(params: CreateBookingV2Params): Promise<ApiResponse<BookingResultV2>> {
  try {
    // OLD: Direct RPC call
    const { data, error } = await supabase.rpc('create_booking_v2', {
      p_customer_id: params.customerId,
      // ... other params
    });
```

**Replace with**:

```typescript
async createBookingV2(params: CreateBookingV2Params): Promise<ApiResponse<BookingResultV2>> {
  try {
    // Generate idempotency key
    const idempotencyKey = `${params.customerId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Convert date + time to ISO timestamp
    const scheduledDatetime = createScheduledDateTime(
      params.scheduledDate,
      params.scheduledTime
    );
    
    // Prepare customer address
    const customerAddress = params.customerAddress ? {
      line1: params.customerAddress.line1,
      line2: params.customerAddress.line2,
      city: params.customerAddress.city,
      state: params.customerAddress.state,
      postalCode: params.customerAddress.postalCode,
      lat: params.customerAddress.lat?.toString(),
      lng: params.customerAddress.lng?.toString(),
    } : null;

    // NEW: Call Edge Function with rate limiting
    const { data, error } = await supabase.functions.invoke('create-booking-with-rate-limit', {
      body: {
        customerId: params.customerId,
        p_barber_id: params.barberId,
        p_service_ids: params.serviceIds,
        p_scheduled_datetime: scheduledDatetime,
        p_service_type: params.serviceType,
        p_barbershop_id: params.barbershopId || null,
        p_customer_address: customerAddress,
        p_customer_notes: params.customerNotes || null,
        p_payment_method: params.paymentMethod || 'cash',
        p_user_voucher_id: params.userVoucherId || null,
        p_curlec_payment_id: params.curlecPaymentId || null,
        p_curlec_order_id: params.curlecOrderId || null,
        p_distance_km: params.distanceKm || null,
        p_idempotency_key: idempotencyKey,  // NEW
      },
    });

    if (error) {
      console.error('❌ Create booking v2 error:', error);
      
      // Handle rate limit error specifically
      if (error.message?.includes('Too many booking attempts')) {
        return {
          success: false,
          error: 'Too many booking attempts. Please wait 1 minute and try again.',
        };
      }
      
      return {
        success: false,
        error: error.message,
      };
    }

    const result = data?.data || data;
    console.log('✅ Secure booking created:', result);

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error('❌ Create booking v2 exception:', error);
    return {
      success: false,
      error: error.message || 'Failed to create booking',
    };
  }
}
```

#### **B. Update types (Optional)**

Add to `packages/shared/types/index.ts`:

```typescript
export interface Booking {
  // ... existing fields
  idempotency_key?: string;  // NEW: For duplicate prevention
}
```

---

### **Step 4: Test All 3 Solutions** (15 min)

#### **Test #1: Idempotency Key**
```typescript
// In React Native app:
// 1. Create booking
const result1 = await bookingService.createBookingV2({ ...params });
console.log('First booking:', result1.data.booking_id);

// 2. Immediately create with SAME idempotency_key (simulate retry)
// Manually set idempotency key for testing:
const testKey = 'test_duplicate_123';
// Call function twice with same key
// Expected: 2nd call returns SAME booking_id
```

#### **Test #2: Time-Window Warning**
```typescript
// 1. Create booking for Barber A @ 2:00 PM
await bookingService.createBookingV2({
  barberId: 'barber-123',
  scheduledDate: '2025-02-15',
  scheduledTime: '14:00',
  ...
});

// 2. Immediately create ANOTHER booking for Barber A @ 2:05 PM
await bookingService.createBookingV2({
  barberId: 'barber-123',  // SAME barber
  scheduledDate: '2025-02-15',
  scheduledTime: '14:05',   // 5 minutes later
  ...
});

// Expected: Both bookings succeed, 2nd shows warning in Supabase logs
```

**Check Supabase Logs**:
```
Supabase Dashboard → Database → Logs → Filter: "DUPLICATE"
Should see: [DUPLICATE] Customer xxx has 1 similar booking(s) within 5 minutes
```

#### **Test #3: Rate Limiting**
```typescript
// Create 11 bookings rapidly (within 1 minute)
for (let i = 0; i < 11; i++) {
  const result = await bookingService.createBookingV2({ ... });
  console.log(`Booking ${i+1}:`, result.success);
}

// Expected:
// Bookings 1-10: Success
// Booking 11: Error "Too many booking attempts"
```

---

## 📊 Monitoring After Deployment

### **Check Idempotency**:
```sql
-- How many bookings have idempotency keys?
SELECT 
  COUNT(*) as total_bookings,
  COUNT(idempotency_key) as with_key,
  COUNT(*) - COUNT(idempotency_key) as without_key
FROM bookings
WHERE created_at > NOW() - INTERVAL '24 hours';
```

### **Check Duplicates**:
```sql
-- Find potential duplicates (time-window)
SELECT 
  customer_id,
  barber_id,
  scheduled_datetime,
  COUNT(*) as duplicate_count
FROM bookings
WHERE status NOT IN ('cancelled', 'rejected')
AND created_at > NOW() - INTERVAL '7 days'
GROUP BY customer_id, barber_id, scheduled_datetime
HAVING COUNT(*) > 1;
```

### **Check Rate Limits**:
```sql
-- Find users hitting rate limits
SELECT 
  customer_id,
  COUNT(*) as bookings_count,
  MIN(created_at) as first_booking,
  MAX(created_at) as last_booking,
  EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) as time_span_seconds
FROM bookings
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY customer_id
HAVING COUNT(*) >= 8  -- Close to rate limit
ORDER BY bookings_count DESC;
```

### **Check Edge Function Logs**:
```
Supabase Dashboard → Edge Functions → create-booking-with-rate-limit → Logs

Look for:
- [RATE_LIMIT] entries (rate limit checks)
- 429 errors (rate limit exceeded)
- Booking creation errors
```

---

## 🔄 Rollback Plan (If Something Breaks)

### **Rollback Step 1: Revert Client to Direct RPC**
```typescript
// In bookingService.ts, change back to:
const { data, error } = await supabase.rpc('create_booking_v2', {
  p_customer_id: params.customerId,
  // ... (without Edge Function)
});
```

### **Rollback Step 2: Keep Database Changes**
- ✅ Keep idempotency_key column (harmless, nullable)
- ✅ Keep function updates (backward compatible)
- ⚠️ Only rollback client code if issues

### **Rollback Step 3: Disable Edge Function**
```bash
# Don't delete, just stop using it
# Client falls back to direct RPC call
```

---

## ✅ Success Criteria

After deployment, you should see:
- ✅ No duplicate bookings with same idempotency_key
- ✅ Rate limit warnings in logs (if users spam)
- ✅ Duplicate warnings in logs (if users book same slot twice)
- ✅ No errors in production
- ✅ Normal booking flow works

---

## 📝 Next Steps (Post-Deployment)

1. **Week 1**: Monitor logs daily for:
   - `[IDEMPOTENT]` entries (retries caught)
   - `[DUPLICATE]` warnings (user patterns)
   - `[RATE_LIMIT]` warnings (potential abuse)

2. **Week 2**: Analyze patterns:
   - Are rate limits too strict? (Increase to 15/min if needed)
   - Are duplicate warnings frequent? (Consider UI warning)
   - Any idempotency key conflicts? (Should be zero)

3. **Month 1**: Fine-tune:
   - Adjust rate limits based on real usage
   - Add analytics for duplicate patterns
   - Consider UI improvements (show "You already have a booking")

---

## ❓ FAQ

**Q: What if idempotency_key is NULL?**  
A: That's fine! New bookings will have keys, old ones are NULL. The system works for both.

**Q: Can users still book multiple times?**  
A: Yes! We log warnings but don't block (Grab standard). Idempotency only blocks technical duplicates.

**Q: What if rate limit is too strict?**  
A: Easy fix - change `RATE_LIMIT = 10` to `15` or `20` in Edge Function, redeploy.

**Q: Do we need Redis for rate limiting?**  
A: No! We use database queries. Simple and works well for moderate traffic.

**Q: Is this safe for production?**  
A: Yes! All changes are backward compatible, nullable columns, and proven patterns from Grab/Uber.

---

## 🎉 Deployment Checklist

- [ ] Run database migrations (`npx supabase db push`)
- [ ] Deploy Edge Function (`npx supabase functions deploy`)
- [ ] Update bookingService.ts (add idempotency_key + Edge Function call)
- [ ] Test idempotency (retry with same key)
- [ ] Test time-window (2 bookings same time)
- [ ] Test rate limit (11 rapid bookings)
- [ ] Monitor logs for 24 hours
- [ ] Check for errors in production
- [ ] Celebrate! 🎊

---

**STATUS**: ✅ Ready to Deploy  
**RISK LEVEL**: Low (backward compatible, proven patterns)  
**ESTIMATED DOWNTIME**: 0 minutes (zero-downtime deployment)
