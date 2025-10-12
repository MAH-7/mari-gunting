# Services Quick Reference Guide

## 📦 Import Statements

```typescript
// Booking Service
import { bookingService } from '@mari-gunting/shared/services/bookingService';

// Address Service
import { addressService } from '@mari-gunting/shared/services/addressService';

// Types
import type { CustomerAddress, AddAddressParams } from '@mari-gunting/shared/services/addressService';
```

---

## 🔖 Booking Service

### Get Customer Bookings
```typescript
const response = await bookingService.getCustomerBookings(
  userId,        // string (required)
  statusFilter,  // string | null (optional)
  limit,         // number (default: 50)
  offset         // number (default: 0)
);

if (response.success) {
  const bookings = response.data; // Array of booking objects
}
```

**React Query Example:**
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['customer-bookings', userId],
  queryFn: () => bookingService.getCustomerBookings(userId),
  enabled: !!userId,
});
```

---

### Get Booking By ID
```typescript
const response = await bookingService.getBookingById(bookingId);

if (response.success) {
  const booking = response.data;
  console.log(booking.barber, booking.services, booking.status);
}
```

---

### Create Booking
```typescript
const response = await bookingService.createBooking({
  customerId: userId,
  barberId: selectedBarber.id,
  services: [
    { name: 'Haircut', price: 25.00, duration: 30 },
    { name: 'Beard Trim', price: 10.00, duration: 15 }
  ],
  scheduledDate: '2025-01-15',
  scheduledTime: '14:00',
  serviceType: 'home_service', // or 'walk_in'
  customerAddress: {
    line1: '123 Main St',
    city: 'Kuala Lumpur',
    state: 'WP',
  },
  customerNotes: 'Please call when arriving',
});

if (response.success) {
  const { booking_id, booking_number, total_price } = response.data;
}
```

---

### Cancel Booking
```typescript
const response = await bookingService.cancelBooking(
  bookingId,
  customerId,
  'Customer requested cancellation'
);

if (response.success) {
  Alert.alert('Success', 'Booking cancelled');
}
```

**Mutation Example:**
```typescript
const cancelMutation = useMutation({
  mutationFn: (reason: string) =>
    bookingService.cancelBooking(bookingId, userId, reason),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['customer-bookings'] });
    Alert.alert('Success', 'Booking cancelled');
  },
});

// Usage
cancelMutation.mutate('Changed my mind');
```

---

### Update Booking Status
```typescript
const response = await bookingService.updateBookingStatus(
  bookingId,
  'in-progress',
  'Service started'
);
```

---

## 📍 Address Service

### Get All Addresses
```typescript
const response = await addressService.getCustomerAddresses(userId);

if (response.success) {
  const addresses = response.data; // Array of CustomerAddress
}
```

**React Query Example:**
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['customer-addresses', userId],
  queryFn: () => addressService.getCustomerAddresses(userId),
  enabled: !!userId,
});
```

---

### Add New Address
```typescript
const response = await addressService.addCustomerAddress({
  userId: currentUser.id,
  label: 'Home',
  addressLine1: '123 Main Street',
  addressLine2: 'Apt 4B',
  city: 'Kuala Lumpur',
  state: 'WP',
  postalCode: '50000',
  latitude: 3.1390,
  longitude: 101.6869,
  isDefault: true,
});

if (response.success) {
  const newAddress = response.data;
}
```

**Mutation Example:**
```typescript
const addMutation = useMutation({
  mutationFn: (params: AddAddressParams) =>
    addressService.addCustomerAddress(params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
    Alert.alert('Success', 'Address added');
  },
});
```

---

### Update Address
```typescript
const response = await addressService.updateAddress(addressId, {
  label: 'Office',
  city: 'Petaling Jaya',
});
```

---

### Delete Address
```typescript
const response = await addressService.deleteAddress(addressId);

if (response.success) {
  Alert.alert('Success', 'Address deleted');
}
```

---

### Set Default Address
```typescript
const response = await addressService.setDefaultAddress(
  userId,
  addressId
);
```

---

### Get Default Address
```typescript
const response = await addressService.getDefaultAddress(userId);

if (response.success && response.data) {
  const defaultAddress = response.data;
}
```

---

## 🎨 React Query Patterns

### Basic Query
```typescript
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['resource-name', id],
  queryFn: () => service.getData(id),
  enabled: !!id,
  staleTime: 30000, // 30 seconds
});
```

### Mutation with Invalidation
```typescript
const mutation = useMutation({
  mutationFn: (params) => service.mutateData(params),
  onSuccess: () => {
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: ['resource-name'] });
  },
  onError: (error) => {
    Alert.alert('Error', error.message);
  },
});

// Usage
mutation.mutate(data);
```

### Pull-to-Refresh
```typescript
const [refreshing, setRefreshing] = useState(false);

const onRefresh = async () => {
  setRefreshing(true);
  try {
    await refetch();
  } finally {
    setRefreshing(false);
  }
};

// In ScrollView
<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="#00B14F"
    />
  }
>
```

---

## 🚨 Error Handling

### Standard Pattern
```typescript
const response = await service.someFunction();

if (!response.success) {
  Alert.alert('Error', response.error || 'Something went wrong');
  return;
}

// Success - use response.data
const data = response.data;
```

### With Try-Catch
```typescript
try {
  const response = await service.someFunction();
  
  if (response.success) {
    // Handle success
    console.log(response.data);
  } else {
    // Handle API error
    Alert.alert('Error', response.error);
  }
} catch (error: any) {
  // Handle exception
  Alert.alert('Error', error.message || 'Network error');
}
```

---

## 📊 Common Patterns

### Fetch & Display List
```typescript
function MyScreen() {
  const currentUser = useStore((state) => state.currentUser);
  
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['items', currentUser?.id],
    queryFn: () => service.getItems(currentUser?.id!),
    enabled: !!currentUser?.id,
  });

  const items = response?.data || [];

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorView />;
  if (items.length === 0) return <EmptyState />;

  return (
    <FlatList
      data={items}
      renderItem={({ item }) => <ItemCard item={item} />}
    />
  );
}
```

---

### Add Item with Form
```typescript
function AddItemModal() {
  const [formData, setFormData] = useState({...});
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (data) => service.addItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      Alert.alert('Success', 'Item added');
      closeModal();
    },
  });

  const handleSubmit = () => {
    if (!validateForm(formData)) {
      Alert.alert('Error', 'Please fill required fields');
      return;
    }
    addMutation.mutate(formData);
  };

  return (
    <Modal>
      <Form />
      <Button
        onPress={handleSubmit}
        loading={addMutation.isPending}
      >
        Save
      </Button>
    </Modal>
  );
}
```

---

### Delete with Confirmation
```typescript
const handleDelete = (item) => {
  Alert.alert(
    'Confirm Delete',
    'Are you sure you want to delete this item?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(item.id),
      },
    ]
  );
};

const deleteMutation = useMutation({
  mutationFn: (id) => service.deleteItem(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['items'] });
  },
});
```

---

## 🔑 Type Reference

### ApiResponse
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

### CustomerAddress
```typescript
interface CustomerAddress {
  id: string;
  user_id: string;
  label: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}
```

---

## 💡 Tips & Best Practices

1. **Always check `response.success` before accessing `response.data`**
2. **Use React Query for data fetching (caching, refetching, etc.)**
3. **Invalidate queries after mutations**
4. **Provide user feedback (loading, success, error)**
5. **Enable queries conditionally (`enabled` flag)**
6. **Use appropriate stale times (default: 30s)**
7. **Handle empty states gracefully**
8. **Show loading skeletons instead of spinners**
9. **Implement pull-to-refresh where appropriate**
10. **Log errors for debugging**

---

## 📱 Example Screens

### Bookings List Screen
```typescript
export default function BookingsScreen() {
  const currentUser = useStore((state) => state.currentUser);
  const [refreshing, setRefreshing] = useState(false);

  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['customer-bookings', currentUser?.id],
    queryFn: () => bookingService.getCustomerBookings(currentUser?.id!),
    enabled: !!currentUser?.id,
    staleTime: 30000,
  });

  const bookings = response?.data || [];

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {isLoading ? (
        <LoadingSkeleton />
      ) : bookings.length === 0 ? (
        <EmptyState />
      ) : (
        bookings.map(booking => <BookingCard key={booking.id} booking={booking} />)
      )}
    </ScrollView>
  );
}
```

---

## 🔗 Related Files

- `packages/shared/services/bookingService.ts`
- `packages/shared/services/addressService.ts`
- `packages/shared/types/index.ts`
- `docs/customer-booking-integration.md`
- `docs/customer-app-week5-6-complete.md`

---

**Last Updated:** January 2025
