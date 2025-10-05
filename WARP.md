# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Mari Gunting** is a React Native mobile marketplace app for on-demand barbering services, built with Expo and TypeScript. Customers can browse barbers, book services at their location, and barbers can work as freelancers or at registered barbershops. Currently in Phase 1 with a complete frontend implementation using mock data, ready for backend integration.

## Essential Development Commands

### Running the App

```bash
# Start development server
npm start

# Start with cache cleared (if issues occur)
npm start -- --clear

# Run on iOS simulator (macOS only)
npm run ios

# Run on Android emulator
npm run android

# Run on web
npm run web
```

### Development Tools

```bash
# Type checking (crucial - run before committing)
npx tsc --noEmit

# Kill all node processes (if port conflicts)
killall -9 node

# Check for TypeScript errors in specific file
npx tsc --noEmit path/to/file.tsx
```

### Project Maintenance

```bash
# Reinstall dependencies (if package issues)
rm -rf node_modules package-lock.json
npm install

# Clear Expo cache
npx expo start --clear

# View project structure
find app -name "*.tsx" | grep -v node_modules
```

## Architecture Overview

### Tech Stack
- **Framework**: React Native 0.81.4 with Expo SDK 54
- **Navigation**: Expo Router (file-based routing with tabs and stacks)
- **State Management**: Zustand with AsyncStorage persistence
- **Data Fetching**: TanStack Query (React Query) v5
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Type System**: TypeScript with strict mode enabled
- **Data Layer**: Mock API service ready for backend swap

### Application Flow

```
1. App Launch → SplashScreen component (2s delay)
2. Auto-navigation based on currentUser state (Zustand)
3. Main Navigation:
   - Unauthenticated: login.tsx → register.tsx → otp-verification.tsx
   - Authenticated: (tabs)/ layout with 5 tabs (Home, Service, Bookings, Rewards, Profile)
```

### Key Architectural Patterns

#### 1. Data Fetching Pattern
All screens use React Query for data fetching with mock API:

```typescript
// Pattern used throughout the app
const { data, isLoading } = useQuery({
  queryKey: ['barbers', filters],
  queryFn: () => api.getBarbers(filters)
});
```

Mock API functions (`services/api.ts`) simulate network delays and return typed responses. To integrate real backend:
- Replace mock data imports with axios HTTP calls
- Update API base URL in api.ts
- Responses already match ApiResponse<T> format

#### 2. State Management Pattern
Zustand store (`store/useStore.ts`) manages:
- **Persistent**: currentUser, userPoints, myVouchers, activity
- **Session**: selectedBarber, selectedServices, selectedAddress, currentBooking, isLoading

Pattern for booking flow:
```typescript
1. User selects barber → setSelectedBarber()
2. User selects services → addService()
3. User confirms → createBooking() → API returns booking → setCurrentBooking()
4. Navigate to booking detail screen with booking.id
```

#### 3. Navigation Structure
File-based routing with Expo Router:

```
app/
├── _layout.tsx                    # Root: QueryClient provider + Stack navigator
├── login.tsx, register.tsx        # Auth screens
├── (tabs)/                        # Tab group (protected routes)
│   ├── _layout.tsx               # Tab navigator config
│   ├── index.tsx                 # Home tab (barber browsing)
│   ├── service.tsx               # Service selection
│   ├── bookings.tsx              # Booking list
│   ├── rewards.tsx               # Loyalty points
│   └── profile.tsx               # User profile
├── barber/[id].tsx               # Dynamic: Barber detail (freelance)
├── barbershop/[shopId].tsx       # Dynamic: Barbershop detail
├── booking/                       
│   ├── create.tsx                # Booking confirmation
│   └── [id].tsx                  # Booking detail/tracking
└── quick-book.tsx                # Fast booking flow
```

Navigation helpers:
```typescript
import { router } from 'expo-router';
router.push('/barber/123');              // Navigate with history
router.replace('/(tabs)');                // Replace stack (no back)
router.back();                            // Go back
```

## Critical Type System

### Core Types (`types/index.ts`)

**Dual Model System**: The app supports both freelance barbers and barbershop staff:

1. **Barber** (Freelance): Independent professionals with mobile service
   - Has `location`, `distance`, `isOnline`
   - Sets own prices via `services` array
   - Works from customer locations

2. **BarbershopStaff**: Employees at physical shop locations
   - References `barbershopId` (required)
   - Uses shop's service catalog and prices via `serviceIds`
   - Has `workSchedule` at the shop
   - NO `location` or `distance` (customers go to shop)

3. **Barbershop**: Physical establishments with multiple staff
   - Contains `services[]` catalog with shop pricing
   - Has `operatingHours`, `isOpen` status
   - Staff members reference this catalog

**Key Relationships**:
```typescript
Booking → barberId → Barber OR BarbershopStaff
BarbershopStaff → barbershopId → Barbershop
BarbershopStaff → serviceIds → Barbershop.services[]
```

### Booking Status Flow
```
pending → accepted → on-the-way → in-progress → completed
                                               ↓
                                           cancelled
```

### Price Calculation Pattern
Bookings include automatic price breakdown:
```typescript
booking.price              // Base service price
booking.travelCost         // Distance-based (RM 0.50/km)
booking.platformFee        // Fixed RM 2.00
booking.serviceCommission  // 12% of service price
booking.totalPrice         // Sum for customer
```

## Common Development Tasks

### Adding a New Screen

1. Create file in `app/` directory following Expo Router conventions:
   ```bash
   # Static route
   touch app/new-screen.tsx
   
   # Dynamic route with parameter
   touch app/user/[id].tsx
   ```

2. Screen template:
   ```typescript
   import { View, Text, ScrollView } from 'react-native';
   import { SafeAreaView } from 'react-native-safe-area-context';
   import { useQuery } from '@tanstack/react-query';
   import { api } from '@/services/api';
   
   export default function NewScreen() {
     const { data, isLoading } = useQuery({
       queryKey: ['key'],
       queryFn: api.getData
     });
     
     return (
       <SafeAreaView className="flex-1 bg-white">
         <ScrollView className="flex-1">
           {/* Content */}
         </ScrollView>
       </SafeAreaView>
     );
   }
   ```

3. If screen needs tab navigation, add to `app/(tabs)/_layout.tsx`

### Creating Reusable Components

Components go in `components/` directory. Existing patterns:

```typescript
// Modal components: FilterModal, ServiceModal, ConfirmationModal, SuccessModal
// Utility: ImageCarousel, LocationGuard, SplashScreen
// Skeletons: Skeleton/BarberCardSkeleton, etc.
```

Component pattern:
```typescript
interface Props {
  // Always type props
  onPress: () => void;
  title: string;
}

export default function MyComponent({ onPress, title }: Props) {
  // Use NativeWind className for styling
  return <TouchableOpacity className="bg-blue-500 p-4" onPress={onPress}>
    <Text className="text-white font-bold">{title}</Text>
  </TouchableOpacity>;
}
```

### Working with Mock Data

Mock data is in `services/mockData.ts`. Contains:
- 4 freelance barbers (`mockBarbers`)
- 2 barbershops (`mockBarbershops`)
- 4 barbershop staff (`mockBarbershopStaff`)
- 7 services (`mockServices`)
- 3 sample bookings (`mockBookings`)
- Reviews, customer, addresses

To add mock data:
```typescript
// Add to mockData.ts
export const mockNewData = [/* ... */];

// Update api.ts
export const api = {
  getNewData: async () => {
    await delay(500);
    return { success: true, data: mockNewData };
  }
};

// Use in component
const { data } = useQuery({
  queryKey: ['newData'],
  queryFn: api.getNewData
});
```

### Backend Integration Checklist

When ready to connect real backend:

1. **API Service** (`services/api.ts`):
   ```typescript
   // Replace:
   import { mockBarbers } from './mockData';
   await delay(800);
   return { success: true, data: mockBarbers };
   
   // With:
   import axios from 'axios';
   const response = await axios.get(`${API_BASE_URL}/barbers`);
   return response.data; // Should match ApiResponse<T> format
   ```

2. **Environment Variables**:
   ```bash
   # Create .env file (add to .gitignore)
   API_BASE_URL=https://api.yourdomain.com
   ```

3. **Authentication**:
   - Add JWT token storage in Zustand
   - Include Authorization header in axios
   - Handle 401 responses (logout)

4. **Update React Query**:
   - Add proper refetch intervals
   - Configure staleTime and cacheTime
   - Add error handling UI

## Styling Guidelines

### NativeWind/Tailwind Usage

```typescript
// Spacing: Use consistent scale (px-4, py-2, mt-6, mb-4)
<View className="px-6 py-4 mt-2">

// Colors: Primary is blue-500 (#0ea5e9)
<Text className="text-blue-500">    // Primary
<Text className="text-gray-600">    // Secondary text
<View className="bg-white">          // Backgrounds

// Layout patterns
<View className="flex-row items-center justify-between">  // Horizontal flex
<ScrollView className="flex-1">                           // Fill space
<SafeAreaView className="flex-1 bg-white">                // Top-level wrapper

// Cards
<View className="bg-white rounded-2xl border border-gray-200 p-4">

// Status badges (see existing patterns in bookings.tsx)
className={`px-3 py-1 rounded-full ${statusColors[status]}`}
```

### Responsive Design
App is mobile-first. Test on multiple device sizes:
- iPhone SE (small)
- iPhone 14 Pro (standard)
- iPad (tablet)

## Critical Code Patterns

### Error Handling
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['data'],
  queryFn: api.getData
});

if (error) {
  return <View className="p-4">
    <Text className="text-red-500">Error: {error.message}</Text>
  </View>;
}
```

### Loading States
Use existing Skeleton components:
```typescript
import { BarberCardSkeleton } from '@/components/Skeleton/BarberCardSkeleton';

if (isLoading) {
  return <View className="p-6">
    <BarberCardSkeleton />
    <BarberCardSkeleton />
  </View>;
}
```

### Path Aliases
```typescript
// tsconfig.json configures "@/*" to point to project root
import { api } from '@/services/api';
import { useStore } from '@/store/useStore';
import { formatCurrency } from '@/utils/format';
import { Barber } from '@/types';
```

### Date/Time Formatting
Always use utility functions from `utils/format.ts`:
```typescript
formatCurrency(50000)           // "RM 50"
formatPrice(50.99)              // "RM 50.99"
formatTime("14:30")             // "2:30 PM"
formatTimeRange("09:00", "21:00")  // "9:00 AM - 9:00 PM"
formatDistance(2.5)             // "2.5 km"
formatDuration(90)              // "1h 30m"
```

## Testing Before Committing

```bash
# Always run before committing
npx tsc --noEmit

# Check specific changes
npx tsc --noEmit app/new-screen.tsx

# Test on device
npm start
# Press 'i' for iOS or 'a' for Android
```

## Common Pitfalls

1. **Dynamic Routes**: Use `[id].tsx` not `{id}.tsx`
2. **State Updates**: Zustand actions must be called, not assigned: `setUser(newUser)` ✓, `currentUser = newUser` ✗
3. **Query Keys**: Must be arrays: `queryKey: ['barbers']` ✓, `queryKey: 'barbers'` ✗
4. **SafeAreaView**: Always wrap tab screens for proper spacing
5. **Tailwind Classes**: Use hyphens not camelCase: `className="flex-row"` ✓, `className="flexRow"` ✗
6. **Type Imports**: Import types from `@/types` not inline definitions
7. **Dual Model**: Check if using Barber or BarbershopStaff - they have different fields
8. **API Responses**: All API functions return `ApiResponse<T>`, access data via `response.data`

## Documentation References

- README.md - Project overview and quick start
- PROJECT_SUMMARY.md - Detailed architecture and decisions
- STRUCTURE.md - Complete file structure breakdown
- START_HERE.md - Phase 1 completion and next steps

## Future Phase 2 Features

When backend is ready, priority features to implement:
1. Real-time booking status updates (WebSockets/Pusher)
2. Payment gateway integration (Stripe/Razorpay for Malaysia)
3. Push notifications (Expo Notifications)
4. Image upload for barber portfolios (S3/Cloudinary)
5. Live location tracking during "on-the-way" status
6. In-app chat between customer and barber
7. Admin dashboard for platform management

## Key Files to Understand First

1. `types/index.ts` - All TypeScript types (read first!)
2. `services/api.ts` - API layer (understand mock → real API pattern)
3. `services/mockData.ts` - Sample data structure
4. `store/useStore.ts` - Global state shape and actions
5. `app/(tabs)/index.tsx` - Example screen implementation
6. `utils/format.ts` - Formatting utilities

## Quick Commands Reference

```bash
# Development
npm start                    # Start dev server
npm start -- --clear         # Clear cache and start
npx tsc --noEmit            # Type check

# iOS
npm run ios                 # Build and run on iOS

# Android  
npm run android             # Build and run on Android

# Troubleshooting
killall -9 node             # Kill all node processes
rm -rf node_modules && npm install  # Fresh install
npx expo start --clear      # Nuclear option

# Code Quality
find app -name "*.tsx" -exec npx tsc --noEmit {} \;  # Check all files
```
