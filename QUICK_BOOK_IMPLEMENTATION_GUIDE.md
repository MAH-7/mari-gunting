# Quick Book Implementation Guide

## For Developers

This guide provides code snippets and implementation details for the Quick Book feature.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     QUICK BOOK STACK                        │
├─────────────────────────────────────────────────────────────┤
│  Presentation Layer                                         │
│  • service.tsx (Entry Modal)                                │
│  • quick-book.tsx (Configuration Screen)                    │
│  • booking/[id].tsx (Service Selection)                     │
├─────────────────────────────────────────────────────────────┤
│  State Management                                           │
│  • React Query (API calls & caching)                        │
│  • Local State (useState for UI state)                      │
├─────────────────────────────────────────────────────────────┤
│  API Layer                                                  │
│  • services/api.ts (quickBook function)                     │
│  • In-memory storage (temporary bookings)                   │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                 │
│  • services/mockData.ts (Mock data)                         │
│  • types/index.ts (TypeScript types)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Entry Point Implementation

### File: `app/(tabs)/service.tsx`

#### Key Components:
```typescript
// Auto-show modal when tab is focused
useEffect(() => {
  const unsubscribe = navigation.addListener('focus', () => {
    setShowModal(true);
  });
  return unsubscribe;
}, [navigation]);

// Navigate to Quick Book flow
const handleQuickBook = () => {
  setShowModal(false);
  router.push('/quick-book');
};
```

#### Modal Structure:
```typescript
<Modal visible={showModal} transparent={true} animationType="fade">
  <View style={styles.modalOverlay}>
    <TouchableOpacity style={styles.backdrop} onPress={handleClose} />
    <View style={styles.modalContent}>
      {/* Quick Book Option */}
      <TouchableOpacity onPress={handleQuickBook}>
        {/* Icon + Title + Badge */}
      </TouchableOpacity>
      
      {/* Choose Barber Option */}
      <TouchableOpacity onPress={handleChooseBarber}>
        {/* ... */}
      </TouchableOpacity>
      
      {/* Barbershop Option */}
      <TouchableOpacity onPress={handleBarbershop}>
        {/* ... */}
      </TouchableOpacity>
    </View>
  </View>
</Modal>
```

---

## 2. Configuration Screen Implementation

### File: `app/quick-book.tsx`

#### State Management:
```typescript
const [selectedTime, setSelectedTime] = useState<string>('now');
const [radius, setRadius] = useState<number>(5);
const [maxPrice, setMaxPrice] = useState<number>(50);
const [isSearching, setIsSearching] = useState(false);
const [showErrorModal, setShowErrorModal] = useState(false);
```

#### React Query Mutation:
```typescript
const quickBookMutation = useMutation({
  mutationFn: (data: { time: string; radius: number; maxPrice: number }) => 
    api.quickBook('any', data.time),
  onSuccess: (response) => {
    setIsSearching(false);
    if (response.success && response.data?.id) {
      // Navigate to service selection with quickBook flag
      router.replace(`/booking/${response.data.id}?quickBook=true`);
    } else {
      setShowErrorModal(true);
    }
  },
  onError: (error) => {
    setIsSearching(false);
    setShowErrorModal(true);
  },
});
```

#### Search Handler with Animation:
```typescript
const handleQuickBook = () => {
  setIsSearching(true);
  
  // 2-second search animation before API call
  setTimeout(() => {
    quickBookMutation.mutate({
      time: selectedTime,
      radius,
      maxPrice,
    });
  }, 2000);
};
```

#### Dynamic Barber Estimation:
```typescript
// Estimate number of available barbers
const estimatedBarbers = Math.floor(radius * 2.5 + (maxPrice / 10));
```

#### Slider Components:
```typescript
{/* Radius Slider */}
<Slider
  style={styles.slider}
  minimumValue={1}
  maximumValue={20}
  step={1}
  value={radius}
  onValueChange={setRadius}
  minimumTrackTintColor="#00B14F"
  maximumTrackTintColor="#E5E7EB"
  thumbTintColor="#00B14F"
/>

{/* Price Slider */}
<Slider
  minimumValue={10}
  maximumValue={200}
  step={5}
  value={maxPrice}
  onValueChange={setMaxPrice}
  {...styles}
/>
```

#### Time Slot Selection:
```typescript
const TIME_SLOTS = [
  { id: 'now', label: 'Now', icon: 'flash' },
  { id: '15min', label: '15 min', icon: 'time-outline' },
  { id: '30min', label: '30 min', icon: 'time-outline' },
  { id: '1hour', label: '1 hour', icon: 'time-outline' },
];

<View style={styles.timeRow}>
  {TIME_SLOTS.map((slot) => (
    <TouchableOpacity
      key={slot.id}
      style={[
        styles.timePill,
        selectedTime === slot.id && styles.timePillActive,
      ]}
      onPress={() => setSelectedTime(slot.id)}
    >
      <Text>{slot.label}</Text>
    </TouchableOpacity>
  ))}
</View>
```

#### Searching Overlay:
```typescript
{isSearching && (
  <View style={styles.searchingOverlay}>
    <View style={styles.searchingCard}>
      <ActivityIndicator size="large" color="#00B14F" />
      <Text>Searching...</Text>
      <Text>Finding available barbers within {radius}km</Text>
      <View>
        <Text>Radius: {radius}km</Text>
        <Text>Max: RM {maxPrice}</Text>
      </View>
    </View>
  </View>
)}
```

#### Error Modal:
```typescript
<Modal visible={showErrorModal} transparent={true}>
  <View style={styles.errorOverlay}>
    <View style={styles.errorCard}>
      <Ionicons name="sad-outline" size={64} color="#EF4444" />
      <Text style={styles.errorTitle}>No Barbers Available</Text>
      <Text>
        Unfortunately, we couldn't find any available barbers 
        within {radius}km at your budget.
      </Text>
      
      {/* Suggestions */}
      <View style={styles.errorSuggestions}>
        <View style={styles.suggestionItem}>
          <Ionicons name="location" size={20} color="#6B7280" />
          <Text>Try increasing your search radius</Text>
        </View>
        <View style={styles.suggestionItem}>
          <Ionicons name="cash" size={20} color="#6B7280" />
          <Text>Consider adjusting your budget</Text>
        </View>
        <View style={styles.suggestionItem}>
          <Ionicons name="time" size={20} color="#6B7280" />
          <Text>Try booking for a different time</Text>
        </View>
      </View>
      
      <TouchableOpacity onPress={() => setShowErrorModal(false)}>
        <Text>Try Again</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
```

---

## 3. API Implementation

### File: `services/api.ts`

#### In-Memory Storage:
```typescript
// Store temporary bookings created via Quick Book
const createdBookings: Map<string, Booking> = new Map();
```

#### Quick Book Function:
```typescript
quickBook: async (
  serviceId: string,
  time: string
): Promise<ApiResponse<Booking>> => {
  // Simulate network delay
  await delay(1500);
  
  // Find first available online barber
  const availableBarber = mockBarbers.find(b => b.isOnline);
  
  if (!availableBarber) {
    return {
      success: false,
      error: 'No available barbers at the moment',
    };
  }
  
  // Use first service from barber
  const service = availableBarber.services[0];
  
  // Calculate scheduled time based on user selection
  const scheduledTime = time === 'now' 
    ? new Date().toISOString()
    : new Date(Date.now() + 30 * 60000).toISOString();
  
  // Create temporary booking
  const newBooking: Booking = {
    id: `bk${Date.now()}`,
    barberId: availableBarber.id,
    barberName: availableBarber.name,
    barberAvatar: availableBarber.avatar,
    customerId: 'customer1', // TODO: Get from auth context
    customerName: 'John Doe',
    serviceId: service?.id,
    serviceName: service?.name,
    price: service?.price,
    duration: service?.duration,
    scheduledAt: scheduledTime,
    status: 'pending',
    location: availableBarber.location,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  // Store in memory
  createdBookings.set(newBooking.id, newBooking);
  
  return {
    success: true,
    data: newBooking,
    message: 'Barber found! Booking created',
  };
},
```

#### Retrieve Booking:
```typescript
getBookingById: async (id: string): Promise<ApiResponse<Booking>> => {
  await delay(500);
  
  // Check in-memory storage first
  const createdBooking = createdBookings.get(id);
  if (createdBooking) {
    return {
      success: true,
      data: createdBooking,
    };
  }
  
  // Then check mock bookings
  const booking = mockBookings.find(b => b.id === id);
  
  if (!booking) {
    return {
      success: false,
      error: 'Booking not found',
    };
  }
  
  return {
    success: true,
    data: booking,
  };
},
```

---

## 4. Service Selection Screen Implementation

### File: `app/booking/[id].tsx`

#### Detect Quick Book Flow:
```typescript
const { id, quickBook } = useLocalSearchParams<{ 
  id: string; 
  quickBook?: string 
}>();

const isQuickBookFlow = quickBook === 'true';
```

#### State for Service Selection:
```typescript
const [selectedService, setSelectedService] = useState<string | null>(null);
```

#### Mock Available Services:
```typescript
const availableServices = [
  { id: '1', name: 'Haircut', duration: 30, price: 15 },
  { id: '2', name: 'Haircut + Shave', duration: 45, price: 25 },
  { id: '3', name: 'Hair Color', duration: 60, price: 50 },
  { id: '4', name: 'Hair Treatment', duration: 45, price: 35 },
  { id: '5', name: 'Kids Haircut', duration: 20, price: 12 },
  { id: '6', name: 'Beard Trim', duration: 20, price: 10 },
];
```

#### Travel Fee Calculation:
```typescript
const distance = 2.3; // Mock distance in km
const travelFee = Math.round(distance * 2 * 10) / 10; // RM 2 per km
```

#### Service Selection UI:
```typescript
{availableServices.map((service) => (
  <TouchableOpacity
    key={service.id}
    style={[
      styles.serviceSelectionCard,
      selectedService === service.id && styles.serviceSelectionCardActive,
    ]}
    onPress={() => setSelectedService(service.id)}
  >
    <View style={styles.serviceSelectionLeft}>
      {/* Radio Button */}
      <View style={[
        styles.serviceRadio,
        selectedService === service.id && styles.serviceRadioActive,
      ]}>
        {selectedService === service.id && (
          <View style={styles.serviceRadioInner} />
        )}
      </View>
      
      {/* Service Details */}
      <View>
        <Text style={styles.serviceSelectionName}>{service.name}</Text>
        <Text style={styles.serviceSelectionDuration}>{service.duration} min</Text>
      </View>
    </View>
    
    {/* Price */}
    <Text style={styles.serviceSelectionPrice}>RM {service.price}</Text>
  </TouchableOpacity>
))}
```

#### Booking Summary:
```typescript
{selectedService && (
  <View style={styles.quickBookSummary}>
    <Text style={styles.summaryTitle}>Booking Summary</Text>
    {(() => {
      const service = availableServices.find(s => s.id === selectedService);
      if (!service) return null;
      
      const total = service.price + travelFee;
      
      return (
        <>
          <View style={styles.summaryRow}>
            <Text>Barber</Text>
            <Text>{booking?.barberName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Service</Text>
            <Text>{service.name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Duration</Text>
            <Text>{service.duration} min</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Service Price</Text>
            <Text>RM {service.price}</Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.travelFeeLabel}>
              <Ionicons name="car" size={16} />
              <Text>Travel Fee ({distance} km)</Text>
            </View>
            <Text>RM {travelFee.toFixed(1)}</Text>
          </View>
          <View style={styles.dividerLine} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>RM {total.toFixed(1)}</Text>
          </View>
        </>
      );
    })()}
  </View>
)}
```

#### Confirm Booking Mutation:
```typescript
const confirmServiceMutation = useMutation({
  mutationFn: (serviceId: string) => {
    // TODO: Update booking with selected service
    return Promise.resolve({ success: true });
  },
  onSuccess: () => {
    const service = availableServices.find(s => s.id === selectedService);
    const total = (service?.price || 0) + travelFee;
    
    // Navigate to payment method
    router.push({
      pathname: '/payment-method',
      params: {
        bookingId: booking?.id || '',
        amount: total.toFixed(2),
        serviceName: service?.name || '',
        barberName: booking?.barberName || '',
      },
    } as any);
  },
});

const handleConfirmService = () => {
  if (!selectedService) {
    Alert.alert('Required', 'Please select a service');
    return;
  }
  confirmServiceMutation.mutate(selectedService);
};
```

#### Bottom Action Bar:
```typescript
<View style={styles.bottomActionBar}>
  <TouchableOpacity
    style={[
      styles.confirmServiceButton,
      !selectedService && styles.confirmServiceButtonDisabled,
    ]}
    onPress={handleConfirmService}
    disabled={!selectedService || confirmServiceMutation.isPending}
  >
    {confirmServiceMutation.isPending ? (
      <ActivityIndicator size="small" color="#FFFFFF" />
    ) : (
      <>
        <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
        <Text style={styles.confirmServiceButtonText}>Confirm Booking</Text>
      </>
    )}
  </TouchableOpacity>
</View>
```

---

## 5. TypeScript Types

### File: `types/index.ts`

```typescript
export interface Booking {
  id: string;
  barberId: string;
  barberName: string;
  barberAvatar?: string;
  customerId: string;
  customerName: string;
  serviceId?: string;
  serviceName?: string;
  price?: number;
  duration?: number;
  scheduledAt: string;
  status: BookingStatus;
  location?: {
    address: string;
    lat: number;
    lng: number;
  };
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
  review?: Review;
}

export type BookingStatus = 
  | 'pending' 
  | 'accepted' 
  | 'on-the-way' 
  | 'in-progress' 
  | 'completed' 
  | 'cancelled';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

---

## 6. Styling Patterns

### Quick Book Brand Colors:
```typescript
const QUICK_BOOK_COLORS = {
  primary: '#00B14F',      // Green (main brand)
  secondary: '#F59E0B',    // Amber (Quick Book accent)
  background: '#F0FDF4',   // Light green
  success: '#10B981',      // Success green
  error: '#EF4444',        // Error red
  warning: '#FEF3C7',      // Warning yellow
  text: '#111827',         // Dark gray
  textLight: '#6B7280',    // Medium gray
  border: '#E5E7EB',       // Light gray
  white: '#FFFFFF',
};
```

### Common Style Patterns:
```typescript
// Card Style
card: {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  padding: 20,
  marginBottom: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 3,
}

// Button Style
button: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#00B14F',
  borderRadius: 16,
  paddingVertical: 18,
  gap: 10,
  shadowColor: '#00B14F',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 6,
}

// Disabled State
buttonDisabled: {
  backgroundColor: '#D1D5DB',
  shadowOpacity: 0,
}

// Active Selection
activeSelection: {
  backgroundColor: '#00B14F',
  borderColor: '#00B14F',
}
```

---

## 7. Error Handling Best Practices

### API Error Handling:
```typescript
try {
  const response = await api.quickBook(serviceId, time);
  
  if (!response.success) {
    // Handle API error
    setShowErrorModal(true);
    console.error('Quick book failed:', response.error);
    return;
  }
  
  // Success handling
  router.replace(`/booking/${response.data.id}?quickBook=true`);
  
} catch (error) {
  // Handle network error
  console.error('Network error:', error);
  setShowErrorModal(true);
}
```

### User Input Validation:
```typescript
const handleConfirmService = () => {
  // Validate service selection
  if (!selectedService) {
    Alert.alert('Required', 'Please select a service');
    return;
  }
  
  // Validate booking data
  if (!booking?.id) {
    Alert.alert('Error', 'Booking data not found');
    return;
  }
  
  // Proceed with confirmation
  confirmServiceMutation.mutate(selectedService);
};
```

---

## 8. Navigation Flow

### Router Configuration:
```typescript
// From Service Modal → Quick Book
router.push('/quick-book');

// From Quick Book → Booking Detail (Quick Book mode)
router.replace(`/booking/${bookingId}?quickBook=true`);

// From Service Selection → Payment
router.push({
  pathname: '/payment-method',
  params: {
    bookingId: string,
    amount: string,
    serviceName: string,
    barberName: string,
  },
});

// Back Navigation
router.back();
```

### Deep Linking Support:
```typescript
// URL Pattern
/booking/[id]?quickBook=true

// Parsing
const { id, quickBook } = useLocalSearchParams();
const isQuickBookFlow = quickBook === 'true';
```

---

## 9. Testing Checklist

### Unit Tests:
- [ ] Quick Book mutation success
- [ ] Quick Book mutation failure
- [ ] Service selection state management
- [ ] Travel fee calculation
- [ ] Total price calculation
- [ ] In-memory booking storage/retrieval

### Integration Tests:
- [ ] Complete Quick Book flow
- [ ] Error modal displays on no barbers
- [ ] Service selection persists
- [ ] Navigation between screens
- [ ] Payment method navigation

### E2E Tests:
- [ ] User opens service modal
- [ ] User selects Quick Book
- [ ] User adjusts search parameters
- [ ] User finds barber successfully
- [ ] User selects service
- [ ] User confirms booking
- [ ] Navigate to payment

### Edge Cases:
- [ ] No barbers online
- [ ] Network timeout
- [ ] Invalid booking ID
- [ ] Missing service data
- [ ] Concurrent bookings
- [ ] Back navigation handling

---

## 10. Performance Optimization

### React Query Configuration:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
```

### Memoization:
```typescript
// Memoize expensive calculations
const estimatedBarbers = useMemo(
  () => Math.floor(radius * 2.5 + (maxPrice / 10)),
  [radius, maxPrice]
);

// Memoize callbacks
const handleSliderChange = useCallback((value: number) => {
  setRadius(value);
}, []);
```

### Debouncing:
```typescript
import { debounce } from 'lodash';

const debouncedSearch = useMemo(
  () => debounce((params) => {
    quickBookMutation.mutate(params);
  }, 300),
  []
);
```

---

## 11. Future Production Enhancements

### Real-Time Features:
```typescript
// WebSocket connection for live updates
const ws = new WebSocket('wss://api.marigunting.com/quick-book');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  if (update.type === 'barber_matched') {
    // Update UI with matched barber
  }
};
```

### Location Services:
```typescript
import * as Location from 'expo-location';

const getUserLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  
  if (status !== 'granted') {
    Alert.alert('Permission denied', 'Location access is required');
    return null;
  }
  
  const location = await Location.getCurrentPositionAsync({});
  return {
    lat: location.coords.latitude,
    lng: location.coords.longitude,
  };
};
```

### Push Notifications:
```typescript
import * as Notifications from 'expo-notifications';

const sendBookingNotification = async (bookingId: string) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Barber Found! 🎉",
      body: "Ahmad Rahman is ready to serve you.",
      data: { bookingId },
    },
    trigger: { seconds: 1 },
  });
};
```

### Analytics Tracking:
```typescript
import analytics from '@/services/analytics';

// Track Quick Book usage
analytics.track('quick_book_initiated', {
  radius,
  maxPrice,
  time: selectedTime,
});

analytics.track('quick_book_success', {
  barberId: booking.barberId,
  serviceId: selectedService,
  totalPrice: total,
});
```

---

## Summary

This implementation guide provides all the essential code patterns and best practices for the Quick Book feature. Key takeaways:

1. **State Management:** Use React Query for API calls and local state for UI
2. **Error Handling:** Always provide fallbacks and helpful error messages
3. **User Feedback:** Show loading states and success animations
4. **Type Safety:** Use TypeScript interfaces for all data structures
5. **Performance:** Optimize with memoization and proper caching
6. **Testing:** Cover happy paths, error cases, and edge cases
7. **Future-Ready:** Architecture supports real-time features and production APIs

The code is currently using mock data but is structured to easily swap in real API endpoints when backend is ready.
