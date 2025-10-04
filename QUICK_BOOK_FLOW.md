# Quick Book Flow Documentation

## Overview
The **Quick Book** feature allows customers to instantly find and book the nearest available barber without manually browsing through profiles. This feature provides a streamlined, on-demand booking experience similar to ride-hailing apps like Grab.

---

## User Journey

### 1. Entry Point - Service Selection Modal
**File:** `app/(tabs)/service.tsx`

When users tap the "Service" tab in the bottom navigation, a modal appears with three booking options:

- **Quick Book** ⚡ - Fastest option for immediate booking
- **Choose Barber** ⭐ - Browse and select specific barbers
- **Barbershop** 🏢 - Visit professional barbershop locations

**Key Features:**
- Modal automatically opens when the service tab is focused
- Clean, card-based UI with icons and badges
- Clear descriptions for each booking type

```typescript
// Navigation handlers
handleQuickBook() → router.push('/quick-book')
handleChooseBarber() → router.push('/barbers')
handleBarbershop() → router.push('/barbershops')
```

---

### 2. Quick Book Configuration Screen
**File:** `app/quick-book.tsx`

This screen allows customers to configure their search preferences before finding a barber.

#### User Inputs:
1. **Search Radius** (1-20 km)
   - Interactive slider
   - Real-time display of radius value
   - Shows estimated number of available barbers based on radius and budget

2. **Maximum Price** (RM 10-200)
   - Interactive slider
   - Displays price range
   - Warning: "Final price may vary based on barber experience"

3. **Time Selection**
   - Now (immediate)
   - 15 minutes
   - 30 minutes
   - 1 hour

#### UI Components:
- **Hero Section:** Quick Book branding with features (Fast Match, Nearby, Best Price)
- **Summary Card:** Shows all selected preferences before search
- **Estimated Barbers:** Calculated as `Math.floor(radius * 2.5 + (maxPrice / 10))`
- **Bottom Button:** "Find Barber Now" with loading state

#### Search Flow:
```typescript
handleQuickBook() {
  setIsSearching(true);
  
  // 2-second search animation
  setTimeout(() => {
    quickBookMutation.mutate({
      time: selectedTime,
      radius,
      maxPrice,
    });
  }, 2000);
}
```

#### Loading States:
1. **Searching Overlay:**
   - Dark semi-transparent background
   - Card with spinner and progress text
   - Shows current search parameters

2. **Error Modal:**
   - Appears when no barbers are available
   - Displays helpful suggestions:
     - Increase search radius
     - Adjust budget
     - Try different time
   - "Try Again" button to modify search

---

### 3. API - Quick Book Matching
**File:** `services/api.ts`

#### Function: `api.quickBook(serviceId, time)`

**Process:**
1. Simulates 1.5 second search delay
2. Finds first available online barber from mock data
3. Creates a temporary booking with:
   - Auto-generated booking ID: `bk${Date.now()}`
   - Matched barber details (name, avatar, location)
   - Customer details (currently hardcoded)
   - Service details (uses barber's first available service)
   - Scheduled time based on user selection
   - Status: 'pending'

4. Stores booking in-memory Map for retrieval
5. Returns success response with booking data

**Response Structure:**
```typescript
{
  success: true,
  data: {
    id: string,
    barberId: string,
    barberName: string,
    barberAvatar: string,
    customerId: string,
    customerName: string,
    serviceId: string,
    serviceName: string,
    price: number,
    duration: number,
    scheduledAt: string,
    status: 'pending',
    location: object,
    createdAt: string,
    updatedAt: string
  },
  message: 'Barber found! Booking created'
}
```

**Error Handling:**
- Returns failure response if no online barbers are available
- Triggers error modal on the Quick Book screen

---

### 4. Service Selection Screen
**File:** `app/booking/[id].tsx` (Quick Book Flow)

After a barber is matched, customers are navigated to this screen with `quickBook=true` parameter.

#### URL Pattern:
```
/booking/{bookingId}?quickBook=true
```

#### Screen Components:

**1. Success Banner**
- Green checkmark icon
- "Barber Found!" message
- "Select a service to continue" subtitle

**2. Barber Card**
- Avatar image
- Barber name
- Rating (4.9 stars with job count)
- Distance from customer (2.3 km)

**3. Service Selection**
Available services with radio button selection:
- Haircut (30 min) - RM 15
- Haircut + Shave (45 min) - RM 25
- Hair Color (60 min) - RM 50
- Hair Treatment (45 min) - RM 35
- Kids Haircut (20 min) - RM 12
- Beard Trim (20 min) - RM 10

Each service card shows:
- Radio button (active state when selected)
- Service name and duration
- Price

**4. Booking Summary**
Appears after service selection, displays:
- Barber name
- Selected service
- Duration
- Service price
- Travel fee (calculated as RM 2 per km)
- **Total price** (service + travel fee)

Example calculation:
- Distance: 2.3 km
- Travel Fee: RM 4.6
- Service: Haircut (RM 15)
- **Total: RM 19.6**

**5. Bottom Action Bar**
- "Confirm Booking" button
- Disabled until service is selected
- Shows loading spinner during confirmation
- Includes checkmark icon

#### Confirmation Flow:
```typescript
handleConfirmService() {
  if (!selectedService) {
    Alert.alert('Required', 'Please select a service');
    return;
  }
  
  // Navigate to payment method selection
  router.push('/payment-method', {
    bookingId: booking.id,
    amount: total.toFixed(2),
    serviceName: service.name,
    barberName: booking.barberName,
  });
}
```

---

## Data Flow Diagram

```
┌─────────────────────┐
│  Service Tab Modal  │
│  (service.tsx)      │
└──────────┬──────────┘
           │ User taps "Quick Book"
           ▼
┌─────────────────────┐
│  Quick Book Screen  │
│  (quick-book.tsx)   │
│                     │
│  - Set radius       │
│  - Set max price    │
│  - Select time      │
└──────────┬──────────┘
           │ Tap "Find Barber Now"
           ▼
┌─────────────────────┐
│  Searching Overlay  │
│  (2 sec animation)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   API: quickBook()  │
│   (api.ts)          │
│                     │
│  1. Find available  │
│     barber          │
│  2. Create booking  │
│  3. Store in-memory │
└──────────┬──────────┘
           │
           ├─── Success ───────┐
           │                   ▼
           │         ┌─────────────────────┐
           │         │  Service Selection  │
           │         │  (booking/[id].tsx) │
           │         │                     │
           │         │  1. Show barber     │
           │         │  2. Select service  │
           │         │  3. Review summary  │
           │         └──────────┬──────────┘
           │                    │ Confirm
           │                    ▼
           │         ┌─────────────────────┐
           │         │  Payment Method     │
           │         │  Selection          │
           │         └─────────────────────┘
           │
           └─── Failure ──────┐
                              ▼
                    ┌─────────────────────┐
                    │   Error Modal       │
                    │                     │
                    │  - Suggestions      │
                    │  - Try Again btn    │
                    └─────────────────────┘
```

---

## Key Features & UX Patterns

### 1. **Grab-Style Instant Matching**
- Automatic barber matching without manual browsing
- Shows searching animation for feedback
- Quick results within 2 seconds

### 2. **Progressive Disclosure**
- Service selection happens AFTER barber is matched
- Prevents overwhelming users with too many choices upfront
- Focuses on speed and convenience

### 3. **Transparent Pricing**
- Clear breakdown of service cost vs. travel fee
- Travel fee calculated based on actual distance
- Total shown before confirmation

### 4. **Flexible Search Parameters**
- Adjustable radius (1-20 km)
- Budget control (RM 10-200)
- Time preferences (now to 1 hour)

### 5. **Error Recovery**
- Helpful suggestions when no barbers available
- Easy retry mechanism
- Non-blocking error handling

### 6. **Visual Feedback**
- Loading states for all async operations
- Success animations for completed steps
- Status indicators (badges, icons)
- Active/inactive states for selections

---

## Technical Implementation Details

### State Management
- Uses React Query (`@tanstack/react-query`) for API calls
- Local state management with `useState`
- Mutations for booking creation and updates

### Navigation
- Expo Router for file-based routing
- Deep linking support with query parameters
- Back navigation handling

### Mock Data
Currently uses mock data stored in `services/mockData.ts`:
- Mock barbers with availability status
- Mock services with pricing
- Mock bookings with various statuses

### In-Memory Storage
Temporary bookings created via Quick Book are stored in a Map:
```typescript
const createdBookings: Map<string, Booking> = new Map();
```
This allows retrieval when navigating to the booking detail screen.

---

## Future Enhancements

### 1. **Real-Time Barber Matching**
- Integrate with live barber availability API
- Consider barber's current location and route
- Real-time price quotes based on demand

### 2. **Advanced Matching Algorithm**
- Factor in barber ratings and reviews
- Consider past booking history
- Personalized barber recommendations

### 3. **Location Services**
- Get customer's real-time location
- Calculate accurate distances
- Show barber's route on map

### 4. **Service Customization**
- Allow multiple service selection
- Service add-ons and upgrades
- Special requests or notes

### 5. **Payment Integration**
- Complete payment method implementation
- Support multiple payment providers
- Split payment options

### 6. **Push Notifications**
- Notify when barber is matched
- Alert when barber is on the way
- Service reminders

### 7. **Booking Tracking**
- Real-time barber location tracking
- ETA updates
- Direct in-app messaging

---

## Related Files

### Core Quick Book Files:
- `app/(tabs)/service.tsx` - Entry point modal
- `app/quick-book.tsx` - Configuration screen
- `app/booking/[id].tsx` - Service selection (Quick Book flow)
- `services/api.ts` - API implementation with quickBook function

### Supporting Files:
- `services/mockData.ts` - Mock data for testing
- `types/index.ts` - TypeScript type definitions
- `utils/format.ts` - Formatting utilities

### Related Screens:
- `app/barbers/index.tsx` - Full barber browsing
- `app/barbershops/index.tsx` - Barbershop listings
- `app/booking/create.tsx` - Regular booking flow (from barber profile)

---

## Differences: Quick Book vs Regular Booking

| Feature | Quick Book | Regular Booking |
|---------|------------|-----------------|
| **Barber Selection** | Automatic | Manual (browse profiles) |
| **Service Selection** | After matching | Before booking |
| **Date/Time** | Preset options (now, 15m, 30m, 1h) | Full calendar with 7-day range |
| **Location** | Uses barber's location | Customer selects address |
| **Priority** | Speed & convenience | Choice & customization |
| **Steps** | 2 steps (config → select service) | 3 steps (select barber → configure → confirm) |

---

## Testing Scenarios

### Happy Path:
1. ✅ User opens service modal
2. ✅ User taps "Quick Book"
3. ✅ User adjusts radius to 10 km
4. ✅ User sets max price to RM 100
5. ✅ User selects "Now"
6. ✅ User taps "Find Barber Now"
7. ✅ System finds available barber
8. ✅ User views barber details
9. ✅ User selects "Haircut + Shave" service
10. ✅ User reviews summary (price breakdown)
11. ✅ User confirms booking
12. ✅ Navigate to payment method screen

### Error Path:
1. ❌ User sets very low radius (1 km)
2. ❌ User sets very low budget (RM 10)
3. ❌ No barbers available
4. ❌ Error modal appears with suggestions
5. ✅ User taps "Try Again"
6. ✅ User increases radius to 15 km
7. ✅ Retry search

---

## Summary

The Quick Book feature provides a streamlined, Grab-inspired booking experience that prioritizes speed and convenience. By automatically matching customers with nearby available barbers and deferring service selection until after the match, the flow reduces friction and decision fatigue while maintaining transparency in pricing and service details.

The implementation uses modern React patterns with proper loading states, error handling, and user feedback at every step. While currently using mock data, the architecture is designed to easily integrate with real APIs and services in production.
