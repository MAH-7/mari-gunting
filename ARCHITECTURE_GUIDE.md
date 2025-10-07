# Mari Gunting - Architecture Guide

> **Comprehensive System Design Documentation**
> **Last Updated**: 2025-10-07
> **Version**: 2.0 (Monorepo with Two Apps)

---

## 🏗️ System Overview

Mari Gunting is a **two-sided marketplace** built as a **monorepo** containing two separate mobile applications that share common business logic, types, and utilities.

```
┌─────────────────────────────────────────────────────────┐
│                   MARI GUNTING PLATFORM                  │
│                  (On-Demand Barber Services)             │
└─────────────────────────────────────────────────────────┘
                           │
            ┌──────────────┴──────────────┐
            │                             │
    ┌───────▼───────┐             ┌──────▼──────┐
    │ CUSTOMER APP  │             │ PROVIDER APP │
    │  (React Native)│             │ (React Native)│
    └───────┬───────┘             └──────┬──────┘
            │                             │
            └──────────────┬──────────────┘
                           │
                ┌──────────▼──────────┐
                │   SHARED PACKAGES   │
                │ (Types, Services,   │
                │  Utils, Components) │
                └──────────┬──────────┘
                           │
                ┌──────────▼──────────┐
                │   MOCK DATA LAYER   │
                │  (Future: Backend   │
                │      API)           │
                └─────────────────────┘
```

---

## 📐 Monorepo Structure

### High-Level Organization

```
mari-gunting/
├── apps/                   ← Separate applications
│   ├── customer/          ← Customer-facing app
│   └── provider/          ← Barber/partner app
│
├── packages/              ← Shared code
│   └── shared/           ← Common business logic
│
├── docs/                  ← Documentation
└── [config files]        ← Root-level configs
```

### Why Monorepo?

**Advantages**:
1. **Code Sharing**: Types, services, utilities shared between apps
2. **Consistency**: Same business logic, no duplication
3. **Single Source of Truth**: One place for data models
4. **Easier Refactoring**: Changes propagate automatically
5. **Simplified CI/CD**: Single repo to manage

**Trade-offs**:
- Larger repository size
- Need npm workspaces configuration
- More complex initial setup

---

## 🎯 Application Architecture

### Customer App Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CUSTOMER APP                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │           PRESENTATION LAYER                     │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  React Native Screens (25 screens)         │  │  │
│  │  │  - Authentication (5 screens)              │  │  │
│  │  │  - Browse & Discovery (3 screens)          │  │  │
│  │  │  - Details (6 screens)                     │  │  │
│  │  │  - Booking (4 screens)                     │  │  │
│  │  │  - Profile & Settings (7 screens)          │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │                                                    │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  Customer-Specific Components              │  │  │
│  │  │  - Modals (Filter, Service, Booking)       │  │  │
│  │  │  - Carousels (Image galleries)             │  │  │
│  │  │  - Skeletons (Loading states)              │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                              │
│                          ▼                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │           STATE MANAGEMENT LAYER                 │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  React Query (Server State)                │  │  │
│  │  │  - Barbers, Services, Bookings (cached)    │  │  │
│  │  │  - Automatic refetching & invalidation     │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  Zustand (Client State)                    │  │  │
│  │  │  - Current user, selections, UI state      │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                              │
└──────────────────────────┼──────────────────────────────┘
                           │
                           ▼
          ┌────────────────────────────────┐
          │      SHARED PACKAGES           │
          │  (packages/shared/)            │
          └────────────────────────────────┘
```

### Partner App Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PROVIDER APP                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │           PRESENTATION LAYER                     │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  React Native Screens (7+ screens)         │  │  │
│  │  │  - Dashboard (stats, analytics)            │  │  │
│  │  │  - Jobs Management (accept, track)         │  │  │
│  │  │  - Schedule (calendar, availability)       │  │  │
│  │  │  - Earnings (payouts, history)             │  │  │
│  │  │  - Customers (CRM)                         │  │  │
│  │  │  - Profile (settings, portfolio)           │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │                                                    │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  Provider-Specific Components              │  │  │
│  │  │  - Job Cards (timeline UI)                 │  │  │
│  │  │  - Stats Widgets (analytics)               │  │  │
│  │  │  - Photo Documentation                     │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                              │
│                          ▼                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │           STATE MANAGEMENT LAYER                 │  │
│  │  (Same as Customer: React Query + Zustand)       │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                              │
└──────────────────────────┼──────────────────────────────┘
                           │
                           ▼
          ┌────────────────────────────────┐
          │      SHARED PACKAGES           │
          │  (packages/shared/)            │
          └────────────────────────────────┘
```

---

## 📦 Shared Packages Architecture

### Package Structure

```
packages/shared/
├── components/          ← Shared UI components
│   └── (empty for now, can add common components)
│
├── constants/           ← Shared constants
│   ├── Colors.ts       ← Color palette
│   ├── Typography.ts   ← Font sizes, weights
│   └── Config.ts       ← App configuration
│
├── types/              ← TypeScript definitions
│   └── index.ts        ← All type definitions
│
├── services/           ← Business logic & API
│   ├── api.ts         ← API service layer
│   └── mockData.ts    ← Mock data (development)
│
├── store/              ← State management
│   └── useStore.ts    ← Zustand store
│
├── utils/              ← Helper functions
│   └── format.ts      ← Formatting utilities
│
├── index.ts            ← Main exports
└── package.json        ← Package config
```

### Type System

**Central Type Definitions** (`packages/shared/types/index.ts`):

```typescript
// User Types
- User (base)
  ├── Customer
  └── Barber

// Business Logic Types
- Service
- ServiceCategory
- Booking
- BookingStatus
- Payment
- PaymentMethod
- Address
- Location
- Review
- Notification

// API Types
- ApiResponse<T>
- PaginatedResponse<T>
```

**Benefits**:
- Single source of truth
- Both apps use same types
- TypeScript catches mismatches
- Easy to update across apps

---

## 🔄 Data Flow Architecture

### Request-Response Flow

```
┌─────────────┐
│   UI Layer  │  User interacts with screen
└──────┬──────┘
       │ (1) User action (e.g., "Load barbers")
       ▼
┌─────────────┐
│ React Query │  Checks cache, determines if fetch needed
└──────┬──────┘
       │ (2) Cache miss → Fetch data
       ▼
┌─────────────┐
│ API Service │  api.getBarbers()
│   Layer     │
└──────┬──────┘
       │ (3) HTTP request (future) / Mock data (current)
       ▼
┌─────────────┐
│  Mock Data  │  Returns mockBarbers array
│   Layer     │  (Simulates 500-1000ms delay)
└──────┬──────┘
       │ (4) Data returned
       ▼
┌─────────────┐
│ React Query │  Caches response, returns to UI
└──────┬──────┘
       │ (5) Data available
       ▼
┌─────────────┐
│   UI Layer  │  Renders data, shows to user
└─────────────┘
```

### State Management Strategy

**Two-Layer State**:

1. **Server State** (React Query)
   - Data from backend (currently mock)
   - Cached automatically
   - Auto-refetching
   - Examples: barbers, bookings, services

2. **Client State** (Zustand)
   - UI-specific state
   - User selections
   - Navigation state
   - Examples: selected barber, current filters

**Why Two Layers?**
- Separation of concerns
- React Query handles caching/sync
- Zustand handles local UI state
- Best practice for modern React apps

---

## 🚀 Navigation Architecture

### Expo Router (File-Based)

Both apps use **Expo Router** for navigation:

```
app/
├── _layout.tsx              ← Root layout
│
├── (tabs)/                  ← Tab navigator group
│   ├── _layout.tsx         ← Tab configuration
│   ├── index.tsx           ← Tab 1 (Home/Dashboard)
│   ├── bookings.tsx        ← Tab 2 (Bookings/Jobs)
│   └── profile.tsx         ← Tab 3 (Profile)
│
├── barber/                  ← Stack routes
│   └── [id].tsx            ← Dynamic route
│
└── login.tsx               ← Modal/screen route
```

**Navigation Patterns**:
- `router.push('/path')` - Navigate to screen
- `router.back()` - Go back
- `router.replace('/path')` - Replace current screen
- `href="/path"` - Link component

**Benefits**:
- File system = route structure
- Type-safe navigation
- No manual route configuration
- Easy to understand

---

## 💾 Data Layer Architecture

### Current: Mock Data

```
┌──────────────────────────────────────────────────┐
│              MOCK DATA LAYER                     │
│          (packages/shared/services/)             │
│                                                  │
│  mockData.ts:                                    │
│  ┌────────────────────────────────────────────┐ │
│  │  mockBarbers: Barber[]    (4 barbers)     │ │
│  │  mockServices: Service[]  (7 services)    │ │
│  │  mockBookings: Booking[]  (3 bookings)    │ │
│  │  mockCustomer: Customer   (test user)     │ │
│  │  mockAddresses: Address[] (2 addresses)   │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  api.ts:                                         │
│  ┌────────────────────────────────────────────┐ │
│  │  async getBarbers() {                      │ │
│  │    await delay(800);  // Simulate network │ │
│  │    return mockBarbers;                     │ │
│  │  }                                         │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Future: Backend API

```
┌──────────────────────────────────────────────────┐
│                BACKEND API                       │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  REST API Endpoints:                       │ │
│  │  - GET  /api/barbers                       │ │
│  │  - GET  /api/barbers/:id                   │ │
│  │  - POST /api/bookings                      │ │
│  │  - GET  /api/bookings/:id                  │ │
│  │  - PUT  /api/bookings/:id/status           │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  Database (PostgreSQL/MongoDB):            │ │
│  │  - users                                   │ │
│  │  - barbers                                 │ │
│  │  - services                                │ │
│  │  - bookings                                │ │
│  │  - reviews                                 │ │
│  │  - transactions                            │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

**Migration Path** (Mock → Real API):

```typescript
// BEFORE (Mock):
export const api = {
  getBarbers: async () => {
    await delay(800);
    return { success: true, data: mockBarbers };
  }
}

// AFTER (Real API):
export const api = {
  getBarbers: async () => {
    const response = await axios.get('/api/barbers');
    return response.data;
  }
}
```

**Only 1 file needs updating**: `packages/shared/services/api.ts`

---

## 🎨 UI/Component Architecture

### Component Hierarchy

```
App Root
│
├── Navigation Container (Expo Router)
│   │
│   ├── Stack Navigator
│   │   │
│   │   ├── Tab Navigator
│   │   │   ├── Home Screen
│   │   │   │   ├── Header
│   │   │   │   ├── SearchBar
│   │   │   │   ├── QuickServices
│   │   │   │   └── BarberList
│   │   │   │       └── BarberCard (x N)
│   │   │   │
│   │   │   ├── Bookings Screen
│   │   │   │   └── BookingCard (x N)
│   │   │   │
│   │   │   └── Profile Screen
│   │   │       └── MenuItems
│   │   │
│   │   ├── Barber Detail Screen
│   │   ├── Booking Create Screen
│   │   └── ...other screens
│   │
│   └── Modals
│       ├── FilterModal
│       ├── ServiceModal
│       └── ConfirmationModal
```

### Component Patterns

**Screen Components** (in `app/`):
- Full-screen views
- Use React Query for data
- Use Zustand for UI state
- Contain layout & business logic

**Reusable Components** (in `components/`):
- Presentational components
- Accept props for data
- No direct data fetching
- Highly reusable

**Shared Components** (in `packages/shared/components/`):
- Used by both apps
- No app-specific logic
- Pure UI components

---

## 🔐 Authentication Architecture

### Auth Flow (Both Apps)

```
┌────────────┐
│  Welcome   │
│   Screen   │
└─────┬──────┘
      │
      ▼
┌────────────┐     ┌──────────────┐
│   Login    │────>│ OTP Verify   │
└────────────┘     └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │  Set User    │ (Zustand)
                   │  in Store    │
                   └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ Navigate to  │
                   │  Main App    │
                   └──────────────┘
```

**Current Implementation**:
- Mock authentication
- Phone number input
- OTP simulation
- User stored in Zustand

**Future Implementation**:
- Real phone verification (Twilio, AWS SNS)
- JWT tokens
- Refresh tokens
- Secure storage (expo-secure-store)

---

## 📱 Platform-Specific Considerations

### iOS vs Android

**Handled by Expo/React Native**:
- Navigation gestures
- Status bar styling
- Safe area handling
- Permissions

**Our Responsibility**:
- Test on both platforms
- Handle platform-specific bugs
- Optimize for each platform

### Device Sizes

**Responsive Design**:
- Use flex layout (flexbox)
- Relative units (%, flex)
- Tailwind responsive classes
- Safe area insets

---

## 🚦 Performance Architecture

### Optimization Strategies

1. **Lazy Loading**
   - React.lazy for heavy screens
   - Image lazy loading

2. **Memoization**
   - React.memo for components
   - useMemo for expensive computations
   - useCallback for functions

3. **Caching**
   - React Query automatic caching
   - Image caching (expo-image)

4. **Code Splitting**
   - Separate bundles per app
   - Dynamic imports

---

## 🧪 Testing Architecture (Future)

### Test Pyramid

```
        ┌─────────────┐
        │   E2E Tests │  ← Few (critical flows)
        │   (Detox)   │
        └─────────────┘
       ┌───────────────┐
       │ Integration   │  ← Some (screen + logic)
       │    Tests      │
       └───────────────┘
      ┌─────────────────┐
      │   Unit Tests    │  ← Many (utils, services)
      │    (Jest)       │
      └─────────────────┘
```

**Test Types**:
1. **Unit**: Pure functions, utils
2. **Integration**: Screens with data
3. **E2E**: Full user flows

---

## 🔄 CI/CD Architecture (Future)

### Pipeline

```
Code Push
    │
    ▼
┌─────────────┐
│ GitHub      │
│ Actions     │
└──────┬──────┘
       │
       ├──> Lint & Type Check
       ├──> Unit Tests
       ├──> Build Customer App
       ├──> Build Partner App
       ├──> E2E Tests (Detox)
       │
       ▼
┌─────────────┐
│ EAS Build   │
│  (Expo)     │
└──────┬──────┘
       │
       ├──> iOS Build
       └──> Android Build
              │
              ▼
       ┌─────────────┐
       │ App Store   │
       │   Deploy    │
       └─────────────┘
```

---

## 💡 Key Architecture Decisions

### 1. Monorepo vs Multi-Repo
**Decision**: Monorepo
**Reason**: Code sharing, consistency, easier maintenance

### 2. State Management
**Decision**: React Query + Zustand
**Reason**: Best practices, separation of server/client state

### 3. Navigation
**Decision**: Expo Router
**Reason**: File-based, type-safe, modern approach

### 4. Styling
**Decision**: NativeWind (Tailwind for RN)
**Reason**: Familiar DX, utility-first, responsive

### 5. Type System
**Decision**: TypeScript (strict mode)
**Reason**: Catch bugs early, better DX, self-documenting

---

## 📊 Scalability Considerations

### Horizontal Scaling
- Backend API can scale independently
- Multiple frontend instances (web, tablet)
- Microservices architecture (future)

### Vertical Scaling
- Code splitting per feature
- Lazy loading heavy screens
- Optimize bundle size

### Data Scaling
- Pagination for lists
- Infinite scroll
- Virtual lists (FlatList)

---

## 🎯 Future Architecture Evolution

### Phase 3: Backend Integration
- Replace mock data with real API
- Add authentication layer
- Implement real-time updates

### Phase 4: Advanced Features
- In-app chat (WebSockets)
- Push notifications
- Payment integration
- Maps integration

### Phase 5: Scale
- Admin dashboard (web app)
- Analytics platform
- Multi-language support
- Multi-region deployment

---

**This architecture is designed to scale from prototype to production while maintaining clean separation of concerns and code reusability.**
