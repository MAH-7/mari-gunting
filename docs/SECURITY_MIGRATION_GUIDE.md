# Security Migration Guide - create_booking_v2

**Date:** 2025-02-06  
**Status:** ✅ Database updated, 🔄 Client apps need updating  
**Priority:** High (for full security)

---

## ✅ What's Already Fixed

1. **Profile RLS Policy** - ✅ Users can only read their own profiles
2. **Voucher Validation** - ✅ Discounts calculated server-side
3. **Payment Verification** - ✅ Function added (need to integrate)
4. **Service Functions** - ✅ `create_booking_v2` deployed to production

---

## 🔄 What Needs Updating (Client Apps)

### Current Booking Flow (INSECURE)
```typescript
// ❌ OLD: Client sends full service objects with prices
const services = [
  { name: "Haircut", price: 50, duration: 30 },
  { name: "Shave", price: 15, duration: 15 }
];

await bookingService.createBooking({
  services: services,  // Client-controlled prices!
  travelFee: travelCost,  // Client-controlled!
  discountAmount: discount  // Client-controlled!
});
```

### New Secure Flow (SECURE)
```typescript
// ✅ NEW: Client sends only service IDs
const serviceIds = [
  "uuid-of-haircut-service",
  "uuid-of-shave-service"
];

await bookingService.createBookingV2({
  serviceIds: serviceIds,  // Server looks up prices
  customerAddress: {
    ...address,
    lat: 3.1234,  // For travel fee calculation
    lng: 101.5678
  },
  userVoucherId: selectedVoucher?.id,  // Server validates discount
  // NO travelFee, NO discountAmount - server calculates everything!
});
```

---

## 📝 Step-by-Step Migration

### 1. Update Service Selection (Customer App)

**File:** `apps/customer/app/barber-services.tsx` (or wherever services are selected)

**Change From:**
```typescript
const selectedServices = services.map(s => ({
  name: s.name,
  price: s.price,
  duration: s.duration
}));
```

**Change To:**
```typescript
const selectedServiceIds = services.map(s => s.id); // Just IDs!
```

---

### 2. Update Booking Creation (payment-method.tsx)

**File:** `apps/customer/app/payment-method.tsx`

**Lines to Update:** 304, 418, 749, 875

**Example (Cash Payment - Line 875):**

**OLD CODE:**
```typescript
const createBookingResponse = await bookingService.createBooking({
  customerId: currentUserId,
  barberId: params.barberId,
  services: services,  // Full objects
  scheduledDate: scheduledDate,
  scheduledTime: scheduledTime,
  serviceType: isBarbershop ? 'walk_in' : 'home_service',
  barbershopId: params.shopId || null,
  customerAddress: customerAddress,
  customerNotes: params.serviceNotes || null,
  paymentMethod: 'cash',
  travelFee: parseFloat(params.travelCost || '0'),
  discountAmount: discount,
});
```

**NEW CODE:**
```typescript
// Extract service IDs from services array
const serviceIds = services.map((s: any) => s.id);

const createBookingResponse = await bookingService.createBookingV2({
  customerId: currentUserId,
  barberId: params.barberId,
  serviceIds: serviceIds,  // Only IDs!
  scheduledDate: scheduledDate,
  scheduledTime: scheduledTime,
  serviceType: isBarbershop ? 'walk_in' : 'home_service',
  barbershopId: params.shopId || null,
  customerAddress: {
    ...customerAddress,
    lat: address.lat,  // Add for travel calculation
    lng: address.lng
  },
  customerNotes: params.serviceNotes || null,
  paymentMethod: 'cash',
  userVoucherId: selectedVoucher?.id || null,  // Server validates
  // REMOVED: travelFee (server calculates)
  // REMOVED: discountAmount (server calculates)
});
```

**Response Changes:**
```typescript
// OLD: { booking_id, booking_number, total_price, message }
// NEW: { booking_id, booking_number, subtotal, service_fee, travel_fee, discount_amount, total_price, message }

const createdBookingId = createBookingResponse.data.booking_id;
const totalPrice = createBookingResponse.data.total_price;
const breakdown = {
  subtotal: createBookingResponse.data.subtotal,
  service_fee: createBookingResponse.data.service_fee,
  travel_fee: createBookingResponse.data.travel_fee,
  discount: createBookingResponse.data.discount_amount,
};
```

---

### 3. Add Payment Verification (Curlec Flow)

**File:** `apps/customer/app/payment-method.tsx`  
**Function:** `handleBarberAccepted` (around line 481)

**Add BEFORE linking payment:**

```typescript
// After Curlec payment success, BEFORE booking confirmation

// Verify payment amount matches booking total
const verification = await bookingService.verifyPaymentAmount(
  bookingId,
  order.amount / 100 // Convert sen to MYR
);

if (!verification.success || !verification.data?.valid) {
  // SECURITY: Payment mismatch detected!
  console.error('❌ Payment verification failed:', verification);
  
  // Cancel booking
  await supabase
    .from('bookings')
    .update({ status: 'cancelled', cancellation_reason: 'Payment amount mismatch' })
    .eq('id', bookingId);
  
  throw new Error('Payment amount does not match booking total');
}

console.log('✅ Payment amount verified');

// Now safe to link payment
await bookingService.linkPaymentToBooking(...);
```

---

### 4. Remove Client-Side Calculations

**Files to Update:**
- `payment-method.tsx` (lines 243-259)
- Any other files that calculate prices/discounts

**Remove:**
```typescript
// ❌ DELETE: Client-side discount calculation
const calculateDiscount = (): number => {
  if (!selectedVoucher) return 0;
  return rewardsService.calculateDiscount(selectedVoucher.voucher, subtotal);
};

// ❌ DELETE: Client-side total calculation
const totalAmount = subtotal + travelCost + bookingFee - discount;
```

**Replace With:**
```typescript
// ✅ Server returns everything
// Just pass voucher ID, let server calculate
```

---

### 5. Update Voucher Application

**OLD (after booking):**
```typescript
if (selectedVoucher && discount > 0) {
  await rewardsService.applyVoucherToBooking(
    createdBookingId,
    selectedVoucher.id,
    originalTotal,
    discount,  // Client-calculated
    finalTotal
  );
}
```

**NEW (during booking):**
```typescript
// Voucher applied during create_booking_v2
// Just pass userVoucherId - server handles everything
await bookingService.createBookingV2({
  // ... other params
  userVoucherId: selectedVoucher?.id || null,
});

// NO need to call applyVoucherToBooking separately!
```

---

## 🧪 Testing Checklist

After updating, test these scenarios:

### Cash Payments
- [ ] Book with service selection (verify prices from server)
- [ ] Book with voucher (verify server calculates discount)
- [ ] Book home service (verify server calculates travel fee)
- [ ] Book walk-in (verify no travel fee)

### Card/FPX Payments
- [ ] Create booking → Barber accepts → Payment verification → Success
- [ ] Verify payment amount check catches mismatches
- [ ] Test booking cancellation if payment verification fails

### Vouchers
- [ ] Apply 10% voucher (verify server calculates 10%, not client value)
- [ ] Apply fixed RM10 voucher
- [ ] Try expired voucher (should fail)
- [ ] Try voucher on booking below min_spend (should fail)

### Travel Fees
- [ ] Book at 5km distance (verify ~RM2.50 calculated)
- [ ] Book at 1km distance (verify minimum RM3.00)
- [ ] Book at 50km distance (verify maximum RM20.00)

---

## 📊 Migration Progress

- [x] Database migration applied
- [x] bookingService.ts updated with v2 methods
- [ ] Customer app - Cash booking flow
- [ ] Customer app - Card/FPX booking flow
- [ ] Customer app - Credits booking flow
- [ ] Customer app - Service selection (collect IDs)
- [ ] Customer app - Payment verification
- [ ] Partner app - Check if creates bookings
- [ ] End-to-end testing
- [ ] Remove old create_booking (2 weeks after stable)

---

## 🚨 Common Issues & Solutions

### Issue: "Service not found"
**Cause:** Sending service name instead of ID  
**Fix:** Ensure you're passing UUID service IDs, not names

### Issue: "Voucher does not belong to customer"
**Cause:** Wrong user_voucher_id  
**Fix:** Pass `user_vouchers.id`, not `vouchers.id`

### Issue: Travel fee is 0 for home service
**Cause:** Missing lat/lng in customer address  
**Fix:** Include `lat` and `lng` in `customerAddress` object

### Issue: Payment verification fails
**Cause:** Curlec amount in sen (cents), verification expects MYR  
**Fix:** Divide by 100: `amount / 100`

---

## 📞 Need Help?

Check the implementation in:
- `packages/shared/services/bookingService.ts` - Reference implementation
- `supabase/migrations/20250206_security_fixes_grab_standard.sql` - SQL functions

Test queries:
```sql
-- Test create_booking_v2
SELECT * FROM create_booking_v2(
  'customer-uuid'::uuid,
  'barber-uuid'::uuid,
  ARRAY['service-uuid-1'::uuid, 'service-uuid-2'::uuid],
  NOW() + interval '2 hours',
  'home_service',
  NULL,
  '{"line1": "123 Street", "lat": "3.1234", "lng": "101.5678"}'::jsonb,
  NULL,
  'cash',
  NULL,
  NULL,
  NULL
);

-- Test verify_payment_amount
SELECT * FROM verify_payment_amount('booking-uuid'::uuid, 52.50);
```

---

**Last Updated:** 2025-02-06  
**Next Review:** After client app migration complete
