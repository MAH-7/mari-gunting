# Mari Gunting - Project Structure

## 📂 Complete File Structure

```
mari-gunting/
│
├── 📄 Configuration Files
│   ├── app.json              # Expo configuration
│   ├── babel.config.js       # Babel configuration for NativeWind
│   ├── package.json          # Dependencies and scripts
│   ├── tsconfig.json         # TypeScript configuration
│   ├── tailwind.config.js    # Tailwind CSS configuration
│   └── global.css            # Global CSS imports
│
├── 📚 Documentation
│   ├── README.md             # Main documentation
│   ├── QUICKSTART.md         # Quick start guide
│   ├── PROJECT_SUMMARY.md    # Detailed project overview
│   └── STRUCTURE.md          # This file
│
├── 📱 App Screens (app/)
│   ├── _layout.tsx           # Root layout with navigation
│   ├── index.tsx             # Welcome/Splash screen
│   │
│   └── (tabs)/               # Tab navigation group
│       ├── _layout.tsx       # Tab layout configuration
│       ├── index.tsx         # 🏠 Home (barber listings)
│       ├── bookings.tsx      # 📋 Bookings screen
│       └── profile.tsx       # 👤 Profile screen
│
├── 🧩 Components (components/)
│   └── [Future reusable components]
│
├── 🔧 Services (services/)
│   ├── api.ts                # API service layer
│   └── mockData.ts           # Mock data (4 barbers, 7 services, 3 bookings)
│
├── 💾 State Management (store/)
│   └── useStore.ts           # Zustand global store
│
├── 📝 Types (types/)
│   └── index.ts              # TypeScript type definitions
│
├── 🛠 Utils (utils/)
│   └── format.ts             # Formatting helpers (currency, date, time)
│
├── 🎨 Assets (assets/)
│   └── [Expo default assets]
│
└── 📦 Dependencies
    └── node_modules/         # Installed packages
```

## 📱 Screen Flow

```
┌─────────────────┐
│  Welcome Screen │  (app/index.tsx)
│   Auto-login    │  → 2 seconds delay
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│         Tab Navigation              │
│  ┌──────────────────────────────┐  │
│  │                              │  │
│  │    🏠 Home (index.tsx)      │◄─┼─ Default tab
│  │    - Search barbers         │  │
│  │    - Filter (All/Online)    │  │
│  │    - Barber cards           │  │
│  │    - Quick services         │  │
│  │                              │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │                              │  │
│  │  📋 Bookings (bookings.tsx) │  │
│  │    - Upcoming bookings      │  │
│  │    - History                 │  │
│  │    - Booking details        │  │
│  │    - Status tracking        │  │
│  │                              │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │                              │  │
│  │   👤 Profile (profile.tsx)  │  │
│  │    - User info              │  │
│  │    - Addresses              │  │
│  │    - Settings               │  │
│  │    - Stats                  │  │
│  │                              │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

## 🔄 Data Flow Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    React Native UI                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │  Screen  │→ │  Screen  │→ │  Screen  │               │
│  │  Logic   │  │  Logic   │  │  Logic   │               │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘               │
└───────┼─────────────┼─────────────┼────────────────────┘
        │             │             │
        ▼             ▼             ▼
┌──────────────────────────────────────────────────────────┐
│              React Query (Data Fetching)                  │
│  ┌────────────────────────────────────────────────────┐  │
│  │ useQuery(['barbers']) ──→ Cache ──→ Return Data   │  │
│  │ useQuery(['bookings']) ──→ Cache ──→ Return Data  │  │
│  └────────────────────────────────────────────────────┘  │
└───────────────────────┬──────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│                  Zustand (Global State)                   │
│  ┌────────────────────────────────────────────────────┐  │
│  │ currentUser, selectedBarber, selectedServices      │  │
│  │ selectedAddress, currentBooking, isLoading         │  │
│  └────────────────────────────────────────────────────┘  │
└───────────────────────┬──────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│                   API Service Layer                       │
│  ┌────────────────────────────────────────────────────┐  │
│  │ api.getBarbers(), api.getBookings()                │  │
│  │ api.createBooking(), api.updateBookingStatus()     │  │
│  └────────────────────────────────────────────────────┘  │
└───────────────────────┬──────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│               Mock Data (Current Phase)                   │
│  ┌────────────────────────────────────────────────────┐  │
│  │ mockBarbers (4), mockServices (7)                  │  │
│  │ mockBookings (3), mockCustomer (1)                 │  │
│  │ Simulated delays (500-1000ms)                      │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                        │
                        ▼ (Future: Phase 2)
┌──────────────────────────────────────────────────────────┐
│                    Backend API                            │
│  REST API / GraphQL / Firebase / Supabase                │
└──────────────────────────────────────────────────────────┘
```

## 🎯 Key Files Explained

### Configuration Files

#### `app.json`
- Expo app configuration
- App name, icons, splash screen
- Platform-specific settings (iOS/Android)
- Plugins configuration

#### `babel.config.js`
- Enables NativeWind (Tailwind CSS)
- Configures JSX transform

#### `tsconfig.json`
- TypeScript compiler options
- Path aliases (`@/*` → project root)
- Strict type checking enabled

#### `tailwind.config.js`
- Custom color palette (primary, secondary)
- Content paths for style purging
- Theme extensions

### App Screens

#### `app/_layout.tsx` (Root Layout)
```tsx
- QueryClientProvider wrapper
- Stack navigation setup
- Global StatusBar
```

#### `app/index.tsx` (Welcome)
```tsx
- Splash screen
- Auto-login logic
- Redirect to tabs
```

#### `app/(tabs)/_layout.tsx` (Tab Layout)
```tsx
- Tab bar configuration
- Tab icons and labels
- Navigation structure
```

#### `app/(tabs)/index.tsx` (Home)
```tsx
Components:
- Header with search
- Quick service filters
- Barber list
- Filter tabs

Features:
- Real-time search
- Online/offline filter
- React Query data fetching
```

#### `app/(tabs)/bookings.tsx`
```tsx
Components:
- Upcoming/History tabs
- Booking cards
- Status badges

Features:
- Filter by status
- Format dates/times
- Empty states
```

#### `app/(tabs)/profile.tsx`
```tsx
Components:
- User info card
- Menu items
- Stats section
- Logout button

Features:
- Display user data
- Formatted phone
- Role-based content
```

### Services Layer

#### `services/api.ts`
```typescript
Functions:
- getBarbers(filters)
- getBarberById(id)
- searchBarbers(query)
- getServices()
- getBookings(params)
- createBooking(data)
- updateBookingStatus(id, status)
- cancelBooking(id, reason)

All functions:
- Return ApiResponse<T>
- Simulate network delays
- Use mock data
- Ready for real API swap
```

#### `services/mockData.ts`
```typescript
Exports:
- mockBarbers (4 barbers)
- mockServices (7 services)
- mockCustomer (1 customer)
- mockAddresses (2 addresses)
- mockBookings (3 bookings)
- mockReviews (2 reviews)

Data includes:
- Realistic names (Indonesian)
- Proper pricing (IDR)
- Jakarta addresses
- Complete relationships
```

### State Management

#### `store/useStore.ts`
```typescript
State:
- currentUser (Customer | Barber)
- selectedBarber (Barber)
- selectedServices (Service[])
- selectedAddress (Address)
- currentBooking (Booking)
- isLoading (boolean)

Actions:
- setCurrentUser()
- setSelectedBarber()
- addService() / removeService()
- clearServices()
- setSelectedAddress()
- setCurrentBooking()
- setIsLoading()
```

### Types

#### `types/index.ts`
```typescript
Main Types:
- User, Customer, Barber
- Service, ServiceCategory
- Booking, BookingStatus
- Payment, PaymentMethod
- Address, Location
- Review, Notification
- ApiResponse<T>
- PaginatedResponse<T>
```

### Utilities

#### `utils/format.ts`
```typescript
Functions:
- formatCurrency(amount) → "Rp 50.000"
- formatDate(date) → "Senin, 1 Januari 2025"
- formatShortDate(date) → "01 Jan 2025"
- formatTime(time) → "2:00 PM"
- formatDuration(mins) → "1h 30m"
- formatDistance(km) → "2.5 km"
- formatPhoneNumber(phone) → "+62 812-3456-7890"
- calculateDistance(lat1, lon1, lat2, lon2)
- truncate(text, length)
```

## 📊 Component Hierarchy

```
App
└── RootLayout (_layout.tsx)
    ├── QueryClientProvider
    └── Stack
        ├── WelcomeScreen (index.tsx)
        └── TabLayout ((tabs)/_layout.tsx)
            ├── Tabs
            │   ├── HomeScreen (index.tsx)
            │   │   ├── SafeAreaView
            │   │   ├── Header
            │   │   ├── SearchBar
            │   │   ├── QuickServices
            │   │   ├── FilterTabs
            │   │   └── BarberList
            │   │       └── BarberCard (multiple)
            │   │
            │   ├── BookingsScreen (bookings.tsx)
            │   │   ├── SafeAreaView
            │   │   ├── Header
            │   │   ├── TabSelector
            │   │   └── BookingList
            │   │       └── BookingCard (multiple)
            │   │
            │   └── ProfileScreen (profile.tsx)
            │       ├── SafeAreaView
            │       ├── UserCard
            │       ├── MenuItems
            │       ├── Stats
            │       └── LogoutButton
```

## 🔐 Type Safety Flow

```
1. Define Type
   types/index.ts
   ↓
2. Create Mock Data
   services/mockData.ts
   ↓
3. API Function
   services/api.ts (returns ApiResponse<Type>)
   ↓
4. React Query Hook
   useQuery<ApiResponse<Type>>
   ↓
5. UI Component
   Props typed, data.data accessed safely
```

## 📦 Dependencies Map

```
Production Dependencies:
├── expo (~54.0)
├── react (19.1.0)
├── react-native (0.81.4)
├── expo-router (^6.0) ──→ Navigation
├── @tanstack/react-query (^5.90) ──→ Data fetching
├── zustand (^5.0) ──→ State management
├── axios (^1.12) ──→ HTTP client
├── date-fns (^4.1) ──→ Date utilities
├── expo-font, expo-splash-screen, expo-status-bar
└── react-native-safe-area-context, react-native-screens

Dev Dependencies:
├── typescript (~5.9)
├── @types/react (~19.1)
├── nativewind (^4.2) ──→ Tailwind CSS
├── tailwindcss (^4.1)
└── babel-preset-expo ──→ Babel config
```

## 🎨 Styling Convention

```typescript
// Tailwind classes via className
<View className="flex-1 bg-white">
  <Text className="text-xl font-bold text-gray-800">
    Title
  </Text>
</View>

// Common patterns:
- Spacing: px-6, py-4, mt-4, mb-2
- Colors: bg-primary-500, text-gray-600
- Rounded: rounded-xl, rounded-full
- Borders: border border-gray-200
- Flex: flex-row, items-center, justify-between
```

## 🚀 Getting Started Paths

### Path 1: Continue Building Frontend
1. Add Barber Detail screen
2. Add Booking Flow screens
3. Build reusable components
4. Add animations
5. Improve UX/UI

### Path 2: Start Backend
1. Design database schema
2. Build REST API
3. Implement authentication
4. Create admin panel
5. Deploy to cloud

### Path 3: Add Features
1. Maps integration
2. Real-time updates
3. Payment gateway
4. Push notifications
5. Chat system

## 📝 Code Conventions

- **Files**: PascalCase for components, camelCase for utilities
- **Components**: Functional components with TypeScript
- **Styling**: Tailwind CSS classes
- **State**: Zustand for global, useState for local
- **Data**: React Query for server state
- **Types**: Explicit typing, no `any`
- **Exports**: Named exports preferred

---

**Ready to build? Check QUICKSTART.md to run the app!**
