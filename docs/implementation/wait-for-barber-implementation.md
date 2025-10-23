# Wait-for-Barber-Accept Implementation Guide

**Feature**: Customer pays ONLY after barber accepts

---

## Current State (What we just built):

```typescript
handleCurlecPayment() {
  1. Create booking
  2. Show payment popup IMMEDIATELY ← PROBLEM
  3. Customer pays
  4. Link payment to booking
  5. Wait for barber response
}
```

---

## Target State (What we need):

```typescript
handleCurlecPayment() {
  1. Create booking
  2. Show WAITING SCREEN ← NEW
  3. Listen for barber response (realtime)
  4. IF barber accepts → Show payment popup
  5. IF barber rejects → Show "Try another barber"
  6. IF timeout → Auto-cancel booking
}
```

---

## Changes Required in `payment-method.tsx`:

### 1. Add state for waiting screen

```typescript
const [showWaitingModal, setShowWaitingModal] = useState(false);
const [waitingBookingId, setWaitingBookingId] = useState<string | null>(null);
```

### 2. Import the waiting modal

```typescript
import { BarberResponseWaitingModal } from '../components/BarberResponseWaitingModal';
```

### 3. Refactor `handleCurlecPayment()`

**REMOVE THIS (lines ~336-370):**
```typescript
// STEP 2: Get user profile for payment prefill
const { data: { user } } = await supabase.auth.getUser();
const { data: profile } = await supabase...

// STEP 3: Create Curlec order (linked to booking)
const order = await curlecService.createOrder({...});

// STEP 4: Prepare checkout options
const checkoutOptions = curlecService.prepareCheckoutOptions...

// STEP 5: Open payment popup
RazorpayCheckout.open(checkoutOptions)...
```

**REPLACE WITH:**
```typescript
// STEP 2: Show waiting screen
console.log('[Wait-for-Barber] Showing waiting screen');
setWaitingBookingId(createdBookingId);
setShowWaitingModal(true);
setIsProcessing(false); // Stop spinner, waiting modal has its own

// Payment will be triggered by onBarberAccepted callback
```

### 4. Create `handleBarberAccepted()` function

**ADD THIS NEW FUNCTION:**
```typescript
const handleBarberAccepted = async (bookingId: string) => {
  try {
    console.log('[Wait-for-Barber] Barber accepted! Opening payment...');
    
    // Close waiting modal
    setShowWaitingModal(false);
    setIsProcessing(true);
    
    if (!currentUserId) {
      throw new Error('User not authenticated');
    }

    // Get booking details
    const { data: booking } = await supabase
      .from('bookings')
      .select('booking_number, total_price')
      .eq('id', bookingId)
      .single();

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Get user profile for payment prefill
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email, phone_number')
      .eq('id', currentUserId)
      .single();

    // Create Curlec order
    console.log('[Curlec] Creating order for booking:', booking.booking_number);
    const order = await curlecService.createOrder({
      amount: booking.total_price,
      receipt: `booking_${booking.booking_number}`,
      notes: {
        customer_id: currentUserId,
        barber_id: params.barberId,
        booking_id: bookingId,
        payment_method: selectedMethod || 'card',
      },
    });

    // Prepare checkout options
    const checkoutOptions = curlecService.prepareCheckoutOptions(order, {
      customerName: profile?.full_name,
      customerEmail: profile?.email || user?.email,
      customerContact: profile?.phone_number,
      description: `Booking #${booking.booking_number}`,
      bookingId: bookingId,
      barberId: params.barberId,
      customerId: currentUserId,
      serviceName: params.serviceName || 'Barber Services',
    });

    // Open payment popup (barber already accepted!)
    RazorpayCheckout.open(checkoutOptions)
      .then(async (data: any) => {
        // Payment successful - link to booking
        const verified = await curlecService.verifyPayment({
          razorpay_order_id: data.razorpay_order_id,
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_signature: data.razorpay_signature,
        });

        if (!verified) {
          throw new Error('Payment verification failed');
        }

        // Link payment
        await bookingService.linkPaymentToBooking(
          bookingId,
          currentUserId,
          data.razorpay_payment_id,
          data.razorpay_order_id
        );

        // Apply voucher/credits if needed
        // ... (same as before)

        // Success!
        setBookingId(bookingId);
        setShowSuccessModal(true);
        setIsProcessing(false);
      })
      .catch(async (error: any) => {
        // Payment failed AFTER barber accepted
        // This is a problem - barber accepted but customer didn't pay
        
        console.error('[Payment] Failed after barber accepted:', error);
        
        // Cancel the booking
        await supabase
          .from('bookings')
          .update({ 
            status: 'cancelled',
            cancellation_reason: 'Payment failed after acceptance'
          })
          .eq('id', bookingId);
        
        Alert.alert(
          'Payment Failed',
          'Your payment failed. The booking has been cancelled. Please try again.',
          [{ text: 'OK' }]
        );
        setIsProcessing(false);
      });
  } catch (error: any) {
    console.error('[Wait-for-Barber] Error opening payment:', error);
    Alert.alert('Error', error.message || 'Failed to process payment');
    setIsProcessing(false);
  }
};
```

### 5. Handle barber rejection

**ADD THIS FUNCTION:**
```typescript
const handleBarberRejected = async () => {
  console.log('[Wait-for-Barber] Barber rejected');
  
  setShowWaitingModal(false);
  setIsProcessing(false);
  
  Alert.alert(
    'Barber Unavailable',
    'Sorry, the barber is not available right now. Would you like to try another barber?',
    [
      { text: 'OK', onPress: () => router.back() },
      { text: 'Try Another', onPress: () => {
        // Navigate to barber list or search
        router.replace('/');
      }},
    ]
  );
};
```

### 6. Handle timeout

**ADD THIS FUNCTION:**
```typescript
const handleBarberTimeout = async () => {
  console.log('[Wait-for-Barber] Timeout - no response');
  
  setShowWaitingModal(false);
  setIsProcessing(false);
  
  // Cancel the booking
  if (waitingBookingId) {
    await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        cancellation_reason: 'No barber response (timeout)'
      })
      .eq('id', waitingBookingId);
  }
  
  Alert.alert(
    'No Response',
    'The barber hasn\'t responded yet. Your booking has been cancelled. Please try another barber.',
    [{ text: 'OK', onPress: () => router.back() }]
  );
};
```

### 7. Handle customer cancels waiting

**ADD THIS FUNCTION:**
```typescript
const handleCancelWaiting = async () => {
  console.log('[Wait-for-Barber] Customer cancelled while waiting');
  
  setShowWaitingModal(false);
  setIsProcessing(false);
  
  // Cancel the booking
  if (waitingBookingId) {
    await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        cancellation_reason: 'Customer cancelled before barber response'
      })
      .eq('id', waitingBookingId);
  }
  
  router.back();
};
```

### 8. Add the modal to JSX

**ADD BEFORE THE SUCCESS MODAL:**
```typescript
{/* Waiting for barber response */}
<BarberResponseWaitingModal
  visible={showWaitingModal}
  bookingId={waitingBookingId || ''}
  barberName={params.barberName}
  onBarberAccepted={() => handleBarberAccepted(waitingBookingId!)}
  onBarberRejected={handleBarberRejected}
  onTimeout={handleBarberTimeout}
  onCancel={handleCancelWaiting}
  timeoutSeconds={180} // 3 minutes
/>
```

---

## The New Flow:

```
1. Customer clicks "Book & Pay"
   ↓
2. Booking created (status: pending, payment_status: pending_payment)
   ↓
3. Waiting modal appears ("Finding your barber...")
   ↓
4. Real-time listener starts (watching booking status)
   ↓
┌──────────┴──────────┐
│                     │
Barber accepts    Barber rejects    Timeout (3 mins)
│                     │                   │
↓                     ↓                   ↓
Payment popup     "Try another"      "No response"
opens             barber msg          Auto-cancel
│                     │                   │
Customer pays     Customer can        Customer can
│                 rebook              rebook
↓                                     
Service                               
confirmed                             
```

---

## Benefits:

✅ **Customer ONLY pays if barber confirms**  
✅ **No wasted payments/authorizations**  
✅ **Fast rejection = Customer never pays**  
✅ **Clear UX - customer knows booking is confirmed when payment appears**  
✅ **Exactly like Grab/Uber**  

---

## Edge Cases Handled:

1. **Barber rejects quickly** → Customer never pays ✅
2. **Barber doesn't respond** → Auto-cancel after 3 mins ✅
3. **Customer cancels while waiting** → Booking cancelled, no charge ✅
4. **Payment fails after acceptance** → Booking cancelled, barber notified ✅
5. **Network issues** → Timeout handles it ✅

---

## Files to Modify:

- ✅ `apps/customer/components/BarberResponseWaitingModal.tsx` (created)
- ⏳ `apps/customer/app/payment-method.tsx` (needs refactoring above)

---

_This is the final piece to make Mari Gunting work exactly like Grab!_
