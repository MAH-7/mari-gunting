# Complete Booking & Payment Flow

## Overview

The Mari Gunting app now has a complete booking and payment flow that guides users from service selection to payment completion.

---

## Full User Journey

### Path 1: Quick Book Flow
```
Home
  → Quick Book Screen
    - Set search radius (1-20 km)
    - Set max budget (RM 10-200)
    - Click "Find Barber Now"
  → System finds nearest available barber (2 sec)
  → Confirm Booking Screen
    - View barber info
    - Select multiple services ✓
    - Select service address ✓
    - Review price breakdown
    - Click "Request Barber Now"
  → Payment Method Screen
    - Select payment method:
      • Card (recommended)
      • Online Banking (FPX)
      • E-Wallet (TNG, GrabPay, etc.)
      • Cash (pay after service)
    - Click "Continue"
  → Payment Processing
    - For Card/FPX/E-Wallet: Payment gateway
    - For Cash: Confirmation only
  → Success
    - Booking confirmed
    - Navigate to Bookings tab
```

### Path 2: Choose Barber Flow
```
Home
  → Browse/Search Barbers
  → Barber Profile Screen
    - View barber details
    - View services (read-only)
    - View reviews & portfolio
    - Click "Book Now"
  → Confirm Booking Screen
    - View barber info
    - Select multiple services ✓
    - Select service address ✓
    - Review price breakdown
    - Click "Request Barber Now"
  → Payment Method Screen
    - Select payment method
    - Click "Continue"
  → Payment Processing
  → Success
    - Booking confirmed
    - Navigate to Bookings tab
```

---

## Screen-by-Screen Breakdown

### 1. Confirm Booking Screen
**Purpose:** Final confirmation before payment

**User Inputs:**
- ✓ Service selection (multiple allowed)
- ✓ Service location (from saved addresses)

**Displays:**
- Barber information (avatar, name, rating)
- On-Demand Service banner
- Service list with checkboxes
- Address selection with radio buttons
- Price breakdown:
  - Services subtotal
  - Travel fee (distance × RM 2/km)
  - Total amount
  - Estimated duration

**Validation:**
- At least 1 service must be selected
- Address must be selected

**Button:** "Request Barber Now"

---

### 2. Payment Method Screen
**Purpose:** Select how to pay for the service

**User Inputs:**
- ✓ Payment method selection (radio buttons)

**Displays:**
- Total amount (large, prominent)
- Payment options:
  1. **Card** (recommended)
     - Visa, Mastercard
     - Pre-authorization (charged after service)
  2. **Online Banking**
     - FPX
     - Immediate payment
  3. **E-Wallet**
     - Touch 'n Go, GrabPay, ShopeePay
     - Instant confirmation
  4. **Cash**
     - Pay after service
     - No upfront payment

**Info Banner:**
"Card payments are pre-authorized and charged after service completion"

**Validation:**
- Payment method must be selected

**Button:** "Continue"

---

### 3. Payment Processing Screens
**Depends on selected method:**

#### Card Payment (`/payment-card`)
- Card number input
- Expiry date
- CVV
- Cardholder name
- 3D Secure authentication

#### FPX (`/payment-fpx`)
- Bank selection
- Redirect to bank portal
- Confirm payment

#### E-Wallet (`/payment-ewallet`)
- Wallet provider selection
- Redirect to app/web
- Confirm payment

#### Cash
- No additional screen
- Immediate confirmation
- Alert: "Prepare cash payment after service"

---

## Data Flow

### Booking Data Structure
```typescript
{
  bookingId: string,           // Generated ID
  barberId: string,            // Selected barber
  barberName: string,          // For display
  serviceIds: string[],        // Selected services
  services: string,            // Comma-separated names
  addressId: string,           // Selected address
  address: string,             // Full address text
  subtotal: number,            // Services total
  travelCost: number,          // Distance × rate
  total: number,               // Final amount
  totalDuration: number,       // Sum of service durations
  scheduledAt: string,         // ISO timestamp (ASAP = now)
  paymentMethod?: string,      // Selected payment method
  status: 'pending'            // Initial status
}
```

### Navigation Parameters

**To Payment Method:**
```typescript
{
  bookingId: string,
  amount: string,              // Total as string
  serviceName: string,         // Comma-separated
  barberName: string,
}
```

**To Payment Processing:**
```typescript
// Same as above, plus:
{
  paymentMethod: 'card' | 'fpx' | 'ewallet' | 'cash'
}
```

---

## Payment Methods Explained

### 1. Card (Recommended) ⭐
**How it works:**
1. Card is pre-authorized (amount is held)
2. No charge until service is completed
3. After service, amount is captured automatically
4. More secure for both parties

**Pros:**
- No money leaves account until service done
- Protection for customer
- Secure for platform

**Flow:**
1. Enter card details
2. Bank verifies (3D Secure)
3. Amount is held (not charged)
4. Service happens
5. Amount is captured after completion

---

### 2. Online Banking (FPX)
**How it works:**
1. You pay now via your bank
2. Money is transferred immediately
3. Barber gets notified and accepts job
4. Auto-refund if barber cancels

**Pros:**
- Direct bank transfer
- No card needed
- Immediate confirmation

**Flow:**
1. Select bank
2. Redirect to bank portal
3. Login and authorize
4. Payment completed
5. Return to app

---

### 3. E-Wallet
**How it works:**
1. Pay now from your e-wallet balance
2. Instant payment confirmation
3. Barber accepts your booking
4. Auto-refund if barber cancels

**Supported:**
- Touch 'n Go
- GrabPay
- ShopeePay

**Flow:**
1. Select wallet
2. Redirect to wallet app/web
3. Confirm payment
4. Return to app

---

### 4. Cash
**How it works:**
1. No payment needed now
2. Prepare exact amount in cash
3. Pay barber directly after service
4. Confirm payment in app

**Pros:**
- No upfront payment
- Simple and traditional
- No payment processing fees

**Flow:**
1. Select cash
2. Booking confirmed immediately
3. Alert to prepare cash
4. Pay barber after service

---

## Success States

### After Payment
1. **Booking Status:** Changes to 'confirmed' or 'pending_barber'
2. **Notification:** Push notification sent to barber
3. **Navigation:** Redirect to Bookings tab
4. **Display:** Booking appears in "Active" section

### Booking Details Screen
From Bookings tab, users can:
- View booking details
- See barber location (live tracking)
- Chat with barber
- Cancel booking (with reason)
- Rate service (after completion)

---

## Error Handling

### Validation Errors
| Error | Message | Solution |
|-------|---------|----------|
| No services selected | "Please select at least one service" | Select 1+ services |
| No address selected | "Please select a service location" | Select an address |
| No payment method | "Please select a payment method" | Select payment option |

### Payment Errors
| Error | Action |
|-------|--------|
| Card declined | Show error, allow retry |
| Insufficient balance | Show error, suggest another method |
| Network timeout | Allow retry |
| 3D Secure failed | Return to payment screen |

---

## Business Logic

### Pricing Calculation
```typescript
subtotal = sum of selected service prices
travelCost = distance (km) × RM 2.00 per km
total = subtotal + travelCost
```

### Travel Fee
- Based on distance to customer location
- Rate: **RM 2.00 per kilometer**
- Rounded to 2 decimal places
- Displayed separately in breakdown

### Service Duration
- Sum of all selected service durations
- Displayed in minutes
- Helps customer plan their time

---

## Testing Checklist

### Confirm Booking Screen
- [ ] Loads barber data correctly
- [ ] Shows all services with checkboxes
- [ ] Multiple service selection works
- [ ] Shows saved addresses
- [ ] Address selection works
- [ ] Price calculation is correct
- [ ] Travel fee calculates properly
- [ ] Validation works (services + address)
- [ ] "Request Barber Now" button works

### Payment Method Screen
- [ ] Total amount displays correctly
- [ ] All 4 payment methods shown
- [ ] Radio button selection works
- [ ] "Recommended" badge shows on Card
- [ ] Info banner displays
- [ ] Validation works (method required)
- [ ] "Continue" button navigates correctly

### Payment Processing
- [ ] Card flow works (if implemented)
- [ ] FPX flow works (if implemented)
- [ ] E-wallet flow works (if implemented)
- [ ] Cash flow confirms immediately
- [ ] Success messages show
- [ ] Navigation to bookings works

### Edge Cases
- [ ] Back button navigation
- [ ] Network errors handled
- [ ] Empty states handled
- [ ] Loading states work
- [ ] Payment timeout handling

---

## Future Enhancements

### Payment Features
1. **Save card for future use**
2. **Split payment** (multiple payment methods)
3. **Promo codes/vouchers**
4. **Wallet/credits system**
5. **Subscription plans**

### Booking Features
1. **Tip barber option**
2. **Service packages/bundles**
3. **Schedule for later** (in addition to ASAP)
4. **Recurring bookings**
5. **Group bookings**

### UX Improvements
1. **Booking summary PDF**
2. **Email confirmation**
3. **SMS notifications**
4. **Payment receipt**
5. **Booking history export**

---

## API Integration TODO

Currently using mock data. Need to integrate:

1. **Create Booking API**
   ```typescript
   POST /api/bookings
   Body: booking data
   Returns: { bookingId, status }
   ```

2. **Payment Gateway Integration**
   - Stripe/iPay88 for card payments
   - FPX integration
   - E-wallet APIs

3. **Real-time Updates**
   - WebSocket for barber acceptance
   - Push notifications
   - Location tracking

---

## Summary

✅ **Complete booking flow implemented**
- Both Quick Book and Choose Barber paths work
- Unified confirm booking screen
- Multiple service selection
- Address selection
- Price breakdown with travel fee

✅ **Payment flow integrated**
- Payment method selection screen
- 4 payment options available
- Proper navigation flow
- Data passing between screens

✅ **Ready for testing**
- All screens connected
- Validation in place
- Error handling ready
- Success paths defined

The app now provides a complete, professional booking and payment experience! 🎉
