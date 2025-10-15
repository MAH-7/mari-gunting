# 🚨 PRODUCTION MIGRATION: Params → Context

## Status: CRITICAL - Production System Needs Upgrade

### Current Issues (Production)
- ❌ Params passing through 4+ screens
- ❌ Easy to lose state (map picker bug we just fixed)
- ❌ Hard to add new features (promo codes, tips, etc)
- ❌ Not scalable for multiple booking types
- ❌ Difficult to debug state issues

### Target: Grab-Grade Architecture
- ✅ Single source of truth (BookingContext)
- ✅ Type-safe, compile-time errors
- ✅ Easy to extend with new features
- ✅ Testable, maintainable
- ✅ No param drilling

## Migration Steps

### ✅ Phase 1: Foundation (COMPLETED)
- [x] Create `BookingContext.tsx`
- [x] Add `BookingProvider` to `_layout.tsx`
- [x] Context available throughout app

### 🔄 Phase 2: Core Screens (IN PROGRESS)
Files to migrate:

1. **Booking Create Screen** (`/booking/create.tsx`)
   - Remove: `fromBooking`, `barberId` params logic
   - Add: `useBooking()` hook
   - Update: Address selection to use context

2. **Address Screen** (`/profile/addresses.tsx`)
   - Remove: `fromBooking`, `barberId` param checking
   - Add: `useBookingIfActive()` hook
   - Update: Save/select to use context

3. **Map Picker** (`/profile/map-picker.tsx`)
   - Remove: Param passing for booking context
   - Keep: Location params only
   - Benefit: Automatically works with context!

4. **Barber Profile** (wherever "Book Now" is)
   - Add: `startBookingFlow()` call
   - Start: Booking context when user clicks "Book Now"

### 📋 Phase 3: Testing Checklist
- [ ] Add address WITHOUT map → Returns to booking
- [ ] Add address WITH map → Returns to booking
- [ ] Select existing address → Returns to booking
- [ ] Back button works correctly
- [ ] No duplicate screens
- [ ] Context persists through navigation
- [ ] Can add promo code (test extensibility)

### 🚀 Phase 4: Cleanup
- [ ] Remove all `fromBooking` param logic
- [ ] Remove all `barberId` param passing
- [ ] Remove debug console.logs
- [ ] Update documentation

## Code Changes Required

### 1. Booking Create Screen

**BEFORE** (Params):
```typescript
const { barberId, returnFromAddresses, selectedAddressId } = useLocalSearchParams();
const [selectedAddress, setSelectedAddress] = useState<string>('');

useEffect(() => {
  if (returnFromAddresses === 'true' && selectedAddressId) {
    setSelectedAddress(selectedAddressId);
  }
}, [returnFromAddresses, selectedAddressId]);
```

**AFTER** (Context):
```typescript
const { barberId } = useLocalSearchParams(); // Only for screen data
const booking = useBooking();

// selectedAddress comes from context!
const selectedAddressObj = booking.selectedAddress;

// To select address:
<TouchableOpacity onPress={booking.goToAddressSelection}>
  <Text>+ Add Address</Text>
</TouchableOpacity>
```

### 2. Address Screen

**BEFORE** (Params):
```typescript
const params = useLocalSearchParams<{
  fromBooking?: string;
  barberId?: string;
}>();
const isFromBooking = params.fromBooking === 'true';

if (isFromBooking && params.barberId) {
  router.setParams({ returnFromAddresses: 'true', selectedAddressId });
  router.back();
}
```

**AFTER** (Context):
```typescript
const booking = useBookingIfActive();

if (booking) {
  // We're in booking flow!
  booking.setSelectedAddress(addressObj);
  booking.returnToBooking();
}
```

### 3. Map Picker

**BEFORE** (Params):
```typescript
router.replace({
  pathname: '/profile/addresses',
  params: {
    selectedLatitude,
    selectedLongitude,
    selectedAddress,
    fromBooking: params.fromBooking,  // ❌ Manual
    barberId: params.barberId,        // ❌ Manual
  }
});
```

**AFTER** (Context):
```typescript
router.replace({
  pathname: '/profile/addresses',
  params: {
    selectedLatitude,
    selectedLongitude,
    selectedAddress,
    // ✅ No booking params needed!
  }
});
```

## Benefits After Migration

### Maintainability
```typescript
// Add new feature (e.g., promo code):
// BEFORE: Change 5+ files
// AFTER: Change only BookingContext

interface BookingContextState {
  // ... existing fields
  promoCode: string | null;  // ✅ Add once!
  estimatedTotal: number;
  tipAmount: number;
}
```

### Type Safety
```typescript
// Compile-time checks
const { barberId, promoCode } = useBooking();  // ✅ TypeScript knows

// Can't typo or use wrong field
const { barbarId } = useBooking();  // ❌ Compile error!
```

### Debugging
```typescript
// Easy to debug state
const booking = useBooking();
console.log('Current booking state:', {
  barberId: booking.barberId,
  selectedAddress: booking.selectedAddress,
  selectedServices: booking.selectedServices,
});
```

## Testing Strategy

### Unit Tests
```typescript
describe('BookingContext', () => {
  it('should start booking flow', () => {
    const { result } = renderHook(() => useBooking(), {
      wrapper: BookingProvider
    });
    
    act(() => {
      result.current.startBookingFlow('123', 'Ahmad');
    });
    
    expect(result.current.isInBookingFlow).toBe(true);
    expect(result.current.barberId).toBe('123');
  });
});
```

### Integration Tests
```typescript
// Test full booking flow
test('complete booking flow', async () => {
  render(
    <BookingProvider>
      <BookingScreen />
    </BookingProvider>
  );
  
  // Start booking
  fireEvent.press(screen.getByText('Book Now'));
  
  // Select address
  fireEvent.press(screen.getByText('Add Address'));
  
  // Context should have address
  expect(bookingContext.selectedAddress).toBeDefined();
});
```

## Rollback Plan

If issues occur:
1. All param-based code still exists (commented)
2. Can disable BookingProvider temporarily
3. Revert commit: `git revert <commit-hash>`
4. Fix issues before re-enabling

## Timeline

- **Day 1**: Migrate booking create screen
- **Day 2**: Migrate address screen
- **Day 3**: Testing & bug fixes
- **Day 4**: Production deployment

## Success Criteria

✅ No params passed for booking context
✅ All navigation flows work correctly
✅ Can add new booking features easily
✅ Type-safe throughout
✅ Clean, maintainable code

## Next Features (Easy to Add)

With context in place:
1. **Promo Codes**: Add `promoCode` field
2. **Tips**: Add `tipAmount` field
3. **Scheduling**: Add `scheduledTime` field
4. **Multiple Services**: Already have `selectedServices`
5. **Package Deals**: Easy to extend

## Notes

- Context persists across navigation automatically
- No need to pass params through intermediate screens
- Map picker becomes simpler
- New developers can understand flow easily
- Aligns with Grab/Gojek best practices

## Questions?

See `/docs/booking-context-architecture.md` for detailed examples.
