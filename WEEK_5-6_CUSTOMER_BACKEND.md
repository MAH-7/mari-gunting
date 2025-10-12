# Week 5-6: Customer App Backend Implementation

**Status**: 🔄 In Progress  
**Started**: January 9, 2025  
**Focus**: Customer App Backend APIs

---

## 📋 Overview

Implementing backend integration for the Customer app to replace mock data with real Supabase functions.

---

## ✅ Completed (Steps 1-3)

### 1. Database Functions Created ✅

#### **Booking Management** (`005_customer_booking_functions.sql`)
- ✅ `create_booking()` - Creates booking with auto pricing
- ✅ `get_customer_bookings()` - Fetches customer bookings with filters
- ✅ `update_booking_status()` - Updates booking status with timestamps
- ✅ `cancel_booking()` - Cancels with refund eligibility check

#### **Address Management**  
- ✅ `customer_addresses` table created
- ✅ `add_customer_address()` - Adds new address
- ✅ `get_customer_addresses()` - Retrieves all customer addresses
- ✅ RLS policies for secure access

#### **Review System** (`006_review_system.sql`)
- ✅ `submit_review()` - Submits review with validation
- ✅ `get_barber_reviews()` - Fetches barber reviews
- ✅ `get_barbershop_reviews()` - Fetches shop reviews
- ✅ `update_barber_rating()` - Auto-calculates ratings (trigger)
- ✅ `get_review_stats()` - Rating statistics
- ✅ `respond_to_review()` - Barber can respond

### 2. Indexes Created ✅
- Bookings: customer_id, status, scheduled_datetime
- Reviews: barber_id, rating, created_at
- Addresses: user_id, location (GIST for geo queries)

### 3. Security ✅
- RLS policies on customer_addresses table
- Auth checks in all functions
- Booking ownership validation
- Review verification (completed bookings only)

---

## 🚧 Next Steps (Steps 4-7)

### 4. Payment Integration (Stripe) ⏳

**What to build**:
```bash
# Install Stripe SDK
cd packages/shared
npm install @stripe/stripe-react-native stripe

# Create payment service
# packages/shared/services/payment.ts
```

**Functions needed**:
- `createPaymentIntent(amount, currency, bookingId)`
- `confirmPayment(paymentIntentId)`
- `handleWebhook(event)` - Supabase Edge Function

**Stripe Setup**:
1. Create Stripe account
2. Get API keys (test mode)
3. Set up webhook endpoint
4. Configure in `.env`:
   ```
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
   STRIPE_SECRET_KEY=sk_test_xxx
   ```

### 5. Wire Customer App to APIs ⏳

**Files to update**:

#### Booking Creation (`apps/customer/app/booking/create.tsx`)
```typescript
import { supabase } from '@/shared/config/supabase';

// Replace mock API
const { data, error } = await supabase.rpc('create_booking', {
  p_customer_id: userId,
  p_barber_id: barberId,
  p_services: services,
  p_scheduled_date: date,
  p_scheduled_time: time,
  p_service_type: 'home_service',
  p_customer_address: address
});
```

#### Bookings List (`apps/customer/app/(tabs)/bookings.tsx`)
```typescript
const { data: bookings } = await supabase.rpc('get_customer_bookings', {
  p_customer_id: userId,
  p_status: filter // 'pending', 'completed', null for all
});
```

#### Profile Updates
```typescript
// Update profile
const { error } = await supabase
  .from('profiles')
  .update({ full_name, phone_number })
  .eq('id', userId);
```

#### Review Submission
```typescript
const { data, error } = await supabase.rpc('submit_review', {
  p_booking_id: bookingId,
  p_customer_id: userId,
  p_rating: rating,
  p_comment: comment
});
```

### 6. Real-time Updates (Supabase Realtime) ⏳

**Subscribe to booking changes**:
```typescript
useEffect(() => {
  const subscription = supabase
    .channel('booking-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `customer_id=eq.${userId}`
      },
      (payload) => {
        console.log('Booking updated!', payload);
        // Update UI
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [userId]);
```

### 7. Testing ⏳

**Test scenarios**:
- [ ] Create booking → Success
- [ ] Cancel booking within 24h → Refund eligible
- [ ] Cancel booking < 24h → No refund
- [ ] Submit review → Rating updates automatically
- [ ] Add address → Saves with geolocation
- [ ] Real-time booking status update → UI updates

---

## 📁 Migration Files

### Apply Migrations to Supabase

**Option A: Supabase CLI** (Recommended)
```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Link to project
supabase link --project-ref YOUR_PROJECT_ID

# Apply migrations
supabase db push
```

**Option B: Manual via Dashboard**
1. Go to Supabase Dashboard → SQL Editor
2. Copy content of `005_customer_booking_functions.sql`
3. Run query
4. Repeat for `006_review_system.sql`

---

## 🧪 Testing the Functions

### Test Booking Creation
```sql
SELECT * FROM create_booking(
  'customer-uuid-here'::UUID,
  'barber-uuid-here'::UUID,
  NULL,
  '[{"name":"Haircut","price":30,"duration":60}]'::JSONB,
  '2025-01-15'::DATE,
  '14:00'::TIME,
  'home_service',
  '{"line1":"123 Main St","city":"KL"}'::JSONB,
  'Please be punctual'
);
```

### Test Get Bookings
```sql
SELECT * FROM get_customer_bookings(
  'customer-uuid-here'::UUID,
  NULL, -- All statuses
  10,   -- Limit
  0     -- Offset
);
```

### Test Submit Review
```sql
SELECT * FROM submit_review(
  'booking-uuid-here'::UUID,
  'customer-uuid-here'::UUID,
  5,
  'Great service!',
  NULL
);
```

---

## 🔧 Environment Variables

**Add to `.env`**:
```bash
# Stripe
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx

# Optional: FPX (Malaysian payments)
EXPO_PUBLIC_FPX_MERCHANT_ID=xxx
FPX_MERCHANT_SECRET=xxx
```

---

## 📊 API Endpoints Summary

### Booking APIs
| Function | Purpose | Parameters |
|----------|---------|------------|
| `create_booking` | Create new booking | customer_id, barber_id, services, date, time, address |
| `get_customer_bookings` | List bookings | customer_id, status (optional), limit, offset |
| `update_booking_status` | Update status | booking_id, new_status, notes |
| `cancel_booking` | Cancel booking | booking_id, customer_id, reason |

### Address APIs
| Function | Purpose | Parameters |
|----------|---------|------------|
| `add_customer_address` | Add address | user_id, label, address fields, lat/lng |
| `get_customer_addresses` | List addresses | user_id |

### Review APIs
| Function | Purpose | Parameters |
|----------|---------|------------|
| `submit_review` | Submit review | booking_id, customer_id, rating, comment, images |
| `get_barber_reviews` | Get reviews | barber_id, limit, offset |
| `get_review_stats` | Rating stats | barber_id or barbershop_id |

---

## 🎯 Success Criteria

Week 5-6 Customer Backend is complete when:

- [x] All database functions created
- [x] Indexes and RLS policies set up
- [ ] Stripe integration working
- [ ] Customer app using real APIs (not mock data)
- [ ] Real-time booking updates working
- [ ] End-to-end booking flow tested
- [ ] Payment processing tested
- [ ] Review system tested

**Current Progress**: 40% (Steps 1-3 done, Steps 4-7 pending)

---

## 📚 Next Actions

1. **Apply migrations** to your Supabase project
2. **Set up Stripe** account and get API keys
3. **Update Customer app** screens to call Supabase RPC functions
4. **Test** booking creation end-to-end
5. **Implement** real-time subscriptions

---

## 🤝 Related Documents

- `BACKEND_10_WEEK_PLAN.md` - Full 10-week backend plan
- `supabase/migrations/` - All migration files
- `packages/shared/services/api.ts` - API service layer
- `.env.example` - Environment variable template

---

**Created**: January 9, 2025  
**Last Updated**: January 9, 2025  
**Status**: Backend functions ready, app integration pending
