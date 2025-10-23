# Booking-First Payment Flow - Implementation Guide

**Status**: In Progress  
**Branch**: feat/booking-first-payment-flow

---

## Database Changes (✅ Complete)

1. ✅ Added `pending_payment` payment status
2. ✅ Added `payment_timeout` booking status  
3. ✅ Created `link_payment_to_booking()` RPC function
4. ✅ Updated `create_booking()` to support optional payment IDs
5. ✅ Added `linkPaymentToBooking()` service function

---

## App Code Changes (⏳ In Progress)

### File: `apps/customer/app/payment-method.tsx`

#### Current Flow (OLD):
```typescript
handleCurlecPayment() {
  1. Create Curlec order
  2. Open payment popup
  3. Customer pays
  4. Verify payment
  5. Create booking WITH payment_id
  6. Show success
}
```

#### New Flow (BOOKING-FIRST):
```typescript
handleCurlecPayment() {
  1. Create booking WITHOUT payment_id
     → booking_id returned
     → payment_status: 'pending_payment'
  
  2. Create Curlec order (with booking_id in notes)
  
  3. Open payment popup
  
  4. Customer pays
  
  5. Verify payment
  
  6. Link payment to booking
     → Call linkPaymentToBooking(booking_id, payment_id)
     → payment_status: 'authorized'
  
  7. Show success
}
```

---

## Key Changes Required

### Change 1: Create booking FIRST (before payment)

**OLD (line 342):**
```typescript
// Create booking after successful payment
await createBookingWithCurlecPayment(
  data.razorpay_payment_id,
  data.razorpay_order_id
);
```

**NEW:**
```typescript
// Step 1: Create booking FIRST (before payment popup)
const bookingResponse = await bookingService.createBooking({
  customerId: currentUserId,
  barberId: params.barberId,
  services: services,
  scheduledDate: scheduledDate,
  scheduledTime: scheduledTime,
  serviceType: isBarbershop ? 'walk_in' : 'home_service',
  barbershopId: params.shopId || null,
  customerAddress: customerAddress,
  customerNotes: params.serviceNotes || null,
  paymentMethod: selectedMethod === 'fpx' ? 'curlec_fpx' : 'curlec_card',
  travelFee: parseFloat(params.travelCost || '0'),
  discountAmount: discount,
  // NO payment IDs - booking created without payment
});

const createdBookingId = bookingResponse.data.booking_id;

// Step 2: Create Curlec order (after booking created)
const order = await curlecService.createOrder({
  amount: totalAmount,
  receipt: `booking_${bookingResponse.data.booking_number}`,
  notes: {
    customer_id: currentUserId,
    barber_id: params.barberId,
    booking_id: createdBookingId, // Link to booking
    payment_method: selectedMethod || 'card',
  },
});

// Step 3: Open payment popup
RazorpayCheckout.open(checkoutOptions).then(async (data) => {
  // Step 4: Link payment to booking
  await bookingService.linkPaymentToBooking(
    createdBookingId,
    currentUserId,
    data.razorpay_payment_id,
    data.razorpay_order_id
  );
  
  // Apply voucher if needed
  if (selectedVoucher && discount > 0) {
    await rewardsService.applyVoucherToBooking(...);
  }
  
  // Show success
  setBookingId(createdBookingId);
  setShowSuccessModal(true);
});
```

---

### Change 2: Handle payment failures

**NEW error handling:**
```typescript
.catch((error: any) => {
  // Payment failed or cancelled
  
  if (error.code === RazorpayCheckout.PAYMENT_CANCELLED) {
    // Mark booking as cancelled
    await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        cancellation_reason: 'Payment cancelled by customer'
      })
      .eq('id', createdBookingId);
      
    Alert.alert('Payment Cancelled', 'Your booking has been cancelled.');
  } else {
    // Payment failed - booking stays as pending_payment
    Alert.alert(
      'Payment Failed',
      'Your booking is saved. You can retry payment from your bookings.',
      [{ text: 'OK' }]
    );
  }
  
  setIsProcessing(false);
});
```

---

### Change 3: Remove `createBookingWithCurlecPayment` function

**This function is no longer needed!**

Booking creation happens BEFORE payment, not after.

---

## Benefits

### Before (payment-first):
```
User books → Payment charged immediately
  ↓
Barber rejects → Refund takes 5-7 days
  ↓
Customer has RM 0 → Can't book again
```

### After (booking-first):
```
User books → Booking created (no charge)
  ↓
Payment popup → Customer pays (authorized)
  ↓
Barber accepts → Payment captured
Barber rejects → Payment auto-released (1-3 days, NOT charged)
  ↓
Customer still has money → Can book again immediately
```

---

## Testing Plan

### Test 1: Happy path (barber accepts)
1. Create booking
2. Pay with card
3. Check booking: `payment_status = 'authorized'`
4. Barber accepts
5. Check booking: `payment_status = 'completed'`
6. Service completed

### Test 2: Barber rejects before payment
1. Create booking (`payment_status = 'pending_payment'`)
2. Barber rejects (booking cancelled)
3. Customer never sees payment popup
4. No money held ✅

### Test 3: Customer cancels payment
1. Create booking
2. Payment popup opens
3. Customer clicks cancel
4. Booking cancelled
5. No money held ✅

### Test 4: Payment fails
1. Create booking
2. Payment popup opens
3. Payment fails (insufficient funds)
4. Booking stays as `pending_payment`
5. Customer can retry payment later

### Test 5: Barber rejects after payment
1. Create booking
2. Pay (`payment_status = 'authorized'`)
3. Barber rejects
4. Authorization releases (1-3 days)
5. Faster than full refund ✅

---

## Migration Strategy

### For Existing Users:

**No migration needed!**

- Old bookings already have payments
- New bookings use new flow
- Both flows coexist

### Rollback Plan:

If booking-first causes issues:

```bash
git checkout main
git merge --no-ff feat/booking-first-payment-flow --strategy-option theirs
```

Or revert specific commits.

---

## Next Steps

1. ⏳ **Implement changes in payment-method.tsx**
2. ⏳ **Test locally with Curlec test mode**
3. ⏳ **Deploy to staging**
4. ⏳ **Test end-to-end**
5. ⏳ **Deploy to production**

---

## Files Modified

- ✅ `supabase/migrations/20250123_add_pending_payment_status.sql`
- ✅ `supabase/migrations/20250123_link_payment_to_booking.sql`
- ✅ `supabase/migrations/20250123_update_create_booking_optional_payment.sql`
- ✅ `packages/shared/services/bookingService.ts`
- ⏳ `apps/customer/app/payment-method.tsx` (IN PROGRESS)

---

_Last updated: 2025-01-23_
