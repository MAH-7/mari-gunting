# Customer App - Real Booking Integration

**Date:** January 2025  
**Feature:** Week 5-6 Customer App Backend Integration

## Overview
Replaced mock data in the Customer app's bookings screen with real Supabase database calls using the RPC functions created in migration `005_customer_booking_functions.sql`.

---

## Implementation Details

### 1. New Service Layer
**File:** `packages/shared/services/bookingService.ts`

Created a comprehensive booking service with the following functions:

#### `createBooking(params)`
- Creates a new booking in the database
- Automatically calculates total price
- Handles home service and walk-in bookings
- Returns booking ID and booking number

**Parameters:**
```typescript
{
  customerId: string;
  barberId: string;
  services: Array<{ name, price, duration }>;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM
  serviceType: 'home_service' | 'walk_in';
  barbershopId?: string | null;
  customerAddress?: object | null;
  customerNotes?: string | null;
}
```

#### `getCustomerBookings(customerId, status?, limit, offset)`
- Fetches customer bookings with optional filtering
- Supports pagination
- Returns enriched booking data with barber and service info

#### `updateBookingStatus(bookingId, newStatus, notes?)`
- Updates booking status
- Tracks status change timestamps automatically

#### `cancelBooking(bookingId, customerId, reason)`
- Cancels a booking
- Calculates refund eligibility
- Tracks cancellation reason

#### `getBookingById(bookingId)`
- Fetches single booking with related data
- Includes barber profile and barbershop info

---

### 2. Updated Bookings Screen
**File:** `apps/customer/app/(tabs)/bookings.tsx`

#### Changes Made:

1. **Replaced Mock API with Real Service**
   - Removed: `api.getBookings()`
   - Added: `bookingService.getCustomerBookings()`

2. **React Query Integration**
   - Query key: `['customer-bookings', userId, selectedTab]`
   - Enabled: Only when user is authenticated
   - Stale time: 30 seconds
   - Auto-refetch on window focus

3. **Data Mapping**
   - Maps database schema to UI format
   - Handles missing/optional fields gracefully
   - Converts field names (e.g., `booking_status` → `status`)

4. **Field Mappings:**
   ```typescript
   Database Field          → UI Field
   ─────────────────────────────────────
   booking_id              → id
   booking_status          → status
   total_price             → totalPrice
   scheduled_date          → scheduledDate
   scheduled_time          → scheduledTime
   barber_name             → barber.name
   barber_avatar           → barber.avatar
   customer_address        → address
   ```

5. **Enhanced Error Handling**
   - Loading state with skeleton UI
   - Error state with retry prompt
   - Empty states for no bookings

6. **Tab-Based Filtering**
   - Active tab: Shows pending, accepted, confirmed, ready, on-the-way, in-progress
   - History tab: Shows completed and cancelled

7. **Sorting & Filtering**
   - By date (scheduled date/time)
   - By price (total price)
   - By status (logical progression)
   - Status filter for active bookings

---

## Database Integration

### RPC Functions Used:

1. **`get_customer_bookings`**
   ```sql
   Parameters:
   - p_customer_id UUID
   - p_status TEXT (optional)
   - p_limit INT (default: 50)
   - p_offset INT (default: 0)
   
   Returns: JSON array of booking objects with:
   - Booking details
   - Barber information
   - Services array
   - Customer address (if home service)
   - Review status
   ```

### Data Flow:

```
User opens Bookings Screen
         ↓
React Query fires query
         ↓
bookingService.getCustomerBookings()
         ↓
Supabase RPC: get_customer_bookings
         ↓
Database returns enriched data
         ↓
Data mapped to UI format
         ↓
Rendered in BookingCard components
```

---

## Features Implemented

✅ Real-time booking data from Supabase  
✅ Automatic data refresh (30s stale time)  
✅ Skeleton loading states  
✅ Error handling with user feedback  
✅ Tab-based filtering (Active/History)  
✅ Sort by date, price, or status  
✅ Status-specific filtering  
✅ Proper TypeScript types  
✅ Optimized React Query caching  

---

## Next Steps

### Immediate:
1. Test with real booking data
2. Handle edge cases (missing barber info, etc.)
3. Add pull-to-refresh functionality
4. Implement booking cancellation flow

### Future:
1. **Booking Creation Flow**
   - Wire up `createBooking` service
   - Implement booking form validation
   - Handle payment integration

2. **Booking Details Screen**
   - Create `/booking/[id]` screen
   - Use `getBookingById` for detailed view
   - Add status update actions

3. **Customer Addresses**
   - Create address management screen
   - Wire up `add_customer_address` RPC
   - Implement address selection in booking flow

4. **Reviews System**
   - Create review submission screen
   - Wire up review RPC functions (to be created)
   - Display reviews in booking history

---

## Testing Checklist

- [ ] User with no bookings sees empty state
- [ ] User with bookings sees correct list
- [ ] Active tab shows only active bookings
- [ ] History tab shows completed/cancelled
- [ ] Skeleton appears during loading
- [ ] Error state shows on network failure
- [ ] Filters work correctly
- [ ] Sorting functions properly
- [ ] Tab switching preserves state
- [ ] Navigation to booking details works

---

## Related Files

- `packages/shared/services/bookingService.ts` - New service layer
- `apps/customer/app/(tabs)/bookings.tsx` - Updated screen
- `supabase/migrations/005_customer_booking_functions.sql` - Database functions
- `packages/shared/types/index.ts` - Shared TypeScript types

---

## Notes

- The `BookingCard` component now maps database fields to UI format internally
- Using React Query for automatic caching and refetching
- All database calls are type-safe with proper error handling
- Ready for production once backend is deployed and seeded with test data
