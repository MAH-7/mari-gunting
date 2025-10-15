# Production-Grade Booking Architecture (Grab-Style)

## Current Approach vs Best Practice

### ❌ Current: URL Params Everywhere
```typescript
// Problem: Params everywhere, fragile, hard to maintain

// Booking screen
router.push({
  pathname: '/profile/addresses',
  params: { fromBooking: 'true', barberId: '123' }  // ❌ Manual
});

// Address screen
const { fromBooking, barberId } = useLocalSearchParams();  // ❌ Props drilling

// Map picker
router.replace({
  params: {
    ...locationParams,
    fromBooking: params.fromBooking,  // ❌ Must remember to pass
    barberId: params.barberId,         // ❌ Easy to forget
  }
});

// What if we add more booking data? 
// → Change EVERY screen!
```

### ✅ Best Practice: React Context
```typescript
// Solution: Global state, type-safe, clean

// Booking screen - Start flow
const { startBookingFlow, goToAddressSelection } = useBooking();
startBookingFlow(barber.id, barber.name);
goToAddressSelection();  // ✅ No params!

// Address screen - Auto-detect flow
const booking = useBookingIfActive();
if (booking) {
  // We're in booking flow!
  // Access: booking.barberId, booking.barberName, etc
}

// Save address
booking.setSelectedAddress(address);
booking.returnToBooking();  // ✅ Clean!

// Add more data later?
// → Change ONLY the context!
```

## Architecture Comparison

### Current Approach (Params)
```
┌─────────────────────────────────────────────────┐
│ Booking Screen                                  │
│ ├─ Has: barberId                                │
│ └─ Navigate with params ────────┐               │
└─────────────────────────────────│───────────────┘
                                  │
                                  ▼ Pass params
┌─────────────────────────────────────────────────┐
│ Address Screen                                  │
│ ├─ Receive: fromBooking, barberId               │
│ └─ Navigate with params ────────┐               │
└─────────────────────────────────│───────────────┘
                                  │
                                  ▼ Pass params again!
┌─────────────────────────────────────────────────┐
│ Map Picker                                      │
│ ├─ Receive: fromBooking, barberId               │
│ └─ Navigate with params ────────┐               │
└─────────────────────────────────│───────────────┘
                                  │
                                  ▼ Pass params AGAIN!
                                  
❌ Params at every level
❌ Easy to lose params
❌ Hard to add new data
```

### Best Practice (Context)
```
┌─────────────────────────────────────────────────┐
│                BookingContext                   │
│  ┌──────────────────────────────────────────┐  │
│  │ • isInBookingFlow: true                   │  │
│  │ • barberId: "123"                         │  │
│  │ • barberName: "Ahmad"                     │  │
│  │ • selectedAddress: null → Address object  │  │
│  │ • selectedServices: []                    │  │
│  └──────────────────────────────────────────┘  │
│              ▲           ▲           ▲          │
│              │           │           │          │
└──────────────│───────────│───────────│──────────┘
               │           │           │
      ┌────────┴────┐ ┌───┴────┐ ┌───┴─────┐
      │  Booking    │ │Address │ │   Map   │
      │   Screen    │ │ Screen │ │ Picker  │
      └─────────────┘ └────────┘ └─────────┘

✅ Single source of truth
✅ No param drilling
✅ Easy to extend
```

## Code Examples

### 1. Setup (Once in _layout.tsx)

```typescript
// apps/customer/app/_layout.tsx
import { BookingProvider } from '@/contexts/BookingContext';

export default function Layout() {
  return (
    <BookingProvider>
      <Stack />
    </BookingProvider>
  );
}
```

### 2. Start Booking Flow

```typescript
// apps/customer/app/barbers/[id].tsx
import { useBooking } from '@/contexts/BookingContext';

export default function BarberProfileScreen() {
  const { startBookingFlow } = useBooking();
  const { id } = useLocalSearchParams();
  
  const handleBookNow = () => {
    // Start the booking flow
    startBookingFlow(barber.id, barber.name);
    
    // Navigate to booking screen (clean!)
    router.push({
      pathname: '/booking/create',
      params: { barberId: barber.id }  // Only need this for screen data
    });
  };
  
  return (
    <TouchableOpacity onPress={handleBookNow}>
      <Text>Book Now</Text>
    </TouchableOpacity>
  );
}
```

### 3. Booking Confirmation Screen

```typescript
// apps/customer/app/booking/create.tsx
import { useBooking } from '@/contexts/BookingContext';

export default function CreateBookingScreen() {
  const { barberId } = useLocalSearchParams();
  const {
    isInBookingFlow,
    selectedAddress,
    selectedServices,
    setSelectedAddress,
    goToAddressSelection,
  } = useBooking();
  
  // Check if we're in booking flow
  if (!isInBookingFlow) {
    // Redirect or show error
    return <Text>Invalid booking flow</Text>;
  }
  
  const handleSelectAddress = () => {
    // No params needed! Context knows we're in booking flow
    goToAddressSelection();
  };
  
  return (
    <View>
      {selectedAddress ? (
        <Text>{selectedAddress.fullAddress}</Text>
      ) : (
        <TouchableOpacity onPress={handleSelectAddress}>
          <Text>+ Add Address</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
```

### 4. Address Selection Screen

```typescript
// apps/customer/app/profile/addresses.tsx
import { useBookingIfActive } from '@/contexts/BookingContext';

export default function AddressesScreen() {
  // Automatically detects if we're in booking flow
  const booking = useBookingIfActive();
  
  const handleSelectAddress = (address: CustomerAddress) => {
    if (booking) {
      // We're in booking flow!
      booking.setSelectedAddress({
        id: address.id,
        label: address.label,
        fullAddress: `${address.address_line1}, ${address.city}`,
        latitude: address.latitude,
        longitude: address.longitude,
      });
      
      // Return to booking (clean navigation!)
      booking.returnToBooking();
    } else {
      // Normal address management
      // Do nothing or show actions
    }
  };
  
  return (
    <View>
      {/* Header shows different title based on context */}
      <Text>{booking ? 'Select Address' : 'My Addresses'}</Text>
      
      {addresses.map(addr => (
        <AddressCard
          key={addr.id}
          address={addr}
          onSelect={() => handleSelectAddress(addr)}
          // Show different UI based on context
          isSelecting={!!booking}
        />
      ))}
    </View>
  );
}
```

### 5. Map Picker (No Changes Needed!)

```typescript
// apps/customer/app/profile/map-picker.tsx
// No changes needed! Just navigate back normally
// Context persists automatically

export default function MapPickerScreen() {
  const handleConfirmLocation = () => {
    router.replace({
      pathname: '/profile/addresses',
      params: {
        selectedLatitude: lat.toString(),
        selectedLongitude: lng.toString(),
        selectedAddress: address,
        // NO NEED FOR fromBooking or barberId!
      }
    });
  };
}
```

## Benefits

### 1. **Maintainability** 
```typescript
// Add new booking data?
// BEFORE: Change 5+ files
// AFTER: Change only BookingContext

interface BookingContextState {
  // ... existing
  estimatedPrice: number;  // ✅ Add here only!
  promoCode: string | null;
}
```

### 2. **Type Safety**
```typescript
// Compile-time errors if you forget something
const { barberId } = useBooking();  // ✅ TypeScript knows all fields
const { invalidField } = useBooking();  // ❌ Compile error!
```

### 3. **Testing**
```typescript
// Easy to test with mock context
<BookingProvider>
  <MockBookingContext value={{ isInBookingFlow: true, ... }}>
    <AddressScreen />
  </MockBookingContext>
</BookingProvider>
```

### 4. **No Param Bugs**
```typescript
// BEFORE: Forgot to pass params? Silent bug
// AFTER: Context always available

const booking = useBookingIfActive();
if (!booking) {
  // Not in booking flow - clear!
}
```

## Migration Strategy

### Phase 1: Add Context (No Breaking Changes)
```typescript
// Add BookingProvider
// Keep existing param-based code working
```

### Phase 2: Use Context in New Features
```typescript
// New screens use context
// Old screens still use params (for now)
```

### Phase 3: Gradually Migrate
```typescript
// Migrate one screen at a time
// Remove param passing
```

### Phase 4: Remove Old Code
```typescript
// All screens use context
// Clean, maintainable codebase!
```

## Real-World Grab Example

```typescript
// This is similar to how Grab handles ride booking:

interface RideBookingContext {
  pickupLocation: Location;
  dropoffLocation: Location;
  selectedVehicle: VehicleType;
  paymentMethod: PaymentMethod;
  promoCode: string | null;
  estimatedFare: number;
  // ... etc
}

// Screens:
// - Location picker → Sets location in context
// - Vehicle selection → Sets vehicle in context  
// - Payment screen → Reads all context data
// - Confirmation → Reads all context data

// NO PARAMS passed between screens!
// Clean, maintainable, scalable
```

## Recommendation

**For Mari Gunting:**

1. **Short-term**: Current param approach works for MVP
2. **Medium-term**: Implement BookingContext for new features
3. **Long-term**: Migrate all booking flows to context

**If starting fresh**: Use context from day 1!

## Key Takeaway

```typescript
❌ Params: Quick but messy, hard to scale
✅ Context: More setup but clean, maintainable, production-grade

Grab uses context for all complex flows:
- Ride booking
- Food delivery
- Payment flows
- Multi-step forms
```

This is the **professional, scalable** way! 🚀
