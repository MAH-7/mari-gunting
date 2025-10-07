# Mari Gunting - Project Context for MCP

> **Purpose**: This file provides persistent context for AI assistants via Model Context Protocol (MCP)
> **Last Updated**: 2025-10-07
> **Project Status**: 50% Complete (Phase 2)

---

## 🎯 Project Overview

**Mari Gunting** is an on-demand barber marketplace mobile application (like Grab/Foodpanda but for barbers). It's a **monorepo** containing two separate React Native apps that share common code.

### Project Type
- **Platform**: Mobile (iOS & Android)
- **Framework**: React Native with Expo
- **Language**: TypeScript (100% typed)
- **Architecture**: Monorepo with shared packages
- **Current Phase**: Phase 2 - Advanced Frontend with Mock Data

### Business Model
- On-demand barber services at customer locations
- Two-sided marketplace: Customers book, Providers (barbers) fulfill
- Revenue: Commission (15-25%), subscriptions, ads, booking fees

---

## 📁 Project Structure

```
mari-gunting/
├── apps/
│   ├── customer/          ← Customer App (100% complete)
│   │   ├── app/           ← 25 screens (authentication, browse, booking)
│   │   ├── components/    ← Customer-specific UI components
│   │   └── package.json
│   │
│   └── provider/          ← Partner App (50% complete)
│       ├── app/           ← Partner screens (dashboard, jobs, earnings)
│       ├── components/    ← Provider-specific UI components
│       └── package.json
│
├── packages/
│   └── shared/            ← Shared code between apps
│       ├── components/    ← Reusable UI components
│       ├── constants/     ← Colors, typography, config
│       ├── types/         ← TypeScript type definitions
│       ├── services/      ← API layer & mock data
│       ├── store/         ← Zustand state management
│       └── utils/         ← Helper functions
│
├── docs/                  ← 71 documentation files
│   ├── features/
│   ├── business/
│   ├── testing/
│   └── archive/
│
└── [Root config files]    ← package.json, tsconfig.json, etc.
```

---

## 🚀 Two Apps in One Repo

### 1. **Customer App** (`apps/customer/`)
**Status**: ✅ 100% Complete

**Features**:
- Authentication (login, register, OTP, role selection)
- Browse barbers & barbershops (with filters, search)
- View detailed profiles (photos, reviews, services)
- Complete booking flow (create, track, history)
- Profile management (addresses, payment methods)
- Rewards & loyalty program
- 25 screens total

**Tech Stack**:
- Expo Router (file-based navigation)
- Zustand (state management)
- React Query (data fetching)
- NativeWind (Tailwind CSS for RN)
- Mock data for development

**How to Run**:
```bash
cd apps/customer
npm start
# Press 'i' for iOS, 'a' for Android
```

**Test Login**: `11-111 1111`

---

### 2. **Partner App** (`apps/partner/`)
**Status**: ⏳ 50% Complete

**Features Completed**:
- Dashboard with earnings stats
- Jobs management (accept, track, complete)
- Progress tracking with timeline UI
- Photo documentation for jobs
- Analytics visualization

**Features Pending** (Weeks 5-8):
- Schedule management (Week 5)
- Earnings & payouts (Week 6)
- Customer management (Week 7)
- Profile & settings (Week 8)

**How to Run**:
```bash
cd apps/partner
npm start
# Press 'i' for iOS, 'a' for Android
```

**Test Login**: `22-222 2222`

---

## 🛠 Tech Stack Details

### Core Technologies
- **React Native**: 0.81.4
- **Expo SDK**: ~54.0
- **TypeScript**: ~5.9.2
- **Node.js**: v20+

### Key Dependencies
- **Navigation**: `expo-router` (file-based routing)
- **State Management**: `zustand` (global state)
- **Data Fetching**: `@tanstack/react-query` (caching & sync)
- **HTTP Client**: `axios` (ready for API integration)
- **Styling**: `nativewind` + `tailwindcss` (Tailwind for RN)
- **Date Handling**: `date-fns`
- **Location**: `expo-location` (GPS services)

### Development Tools
- **Package Manager**: npm (workspaces for monorepo)
- **Linting**: ESLint (if configured)
- **Type Checking**: TypeScript compiler

---

## 📊 Current Progress

### Completed (Customer App) ✅
- [x] 25 screens with full UI
- [x] Authentication flow
- [x] Browse & search functionality
- [x] Booking system (create, view, track)
- [x] Profile management
- [x] Mock data integration
- [x] 14 reusable components
- [x] Skeleton loaders
- [x] Modal system
- [x] Location services

### In Progress (Partner App) ⏳
- [x] Dashboard (Week 1-2)
- [x] Jobs management (Week 3-4)
- [ ] Schedule management (Week 5)
- [ ] Earnings & payouts (Week 6)
- [ ] Customer management (Week 7)
- [ ] Profile & settings (Week 8)

### Not Started (Backend) ⏸️
- [ ] REST API development
- [ ] Database setup (PostgreSQL/MongoDB)
- [ ] Authentication (JWT)
- [ ] Real-time updates (WebSockets)
- [ ] Payment gateway (Midtrans/Xendit)
- [ ] Push notifications
- [ ] File storage (S3/Cloudinary)
- [ ] Admin dashboard

---

## 🎨 Design System

### Color Palette
```
Primary:   #0ea5e9 (Blue)
Success:   #22c55e (Green)
Warning:   #f59e0b (Amber)
Danger:    #ef4444 (Red)
Neutral:   Gray scale (#f9fafb to #111827)
```

### Typography
- **Headers**: 24-32px, bold
- **Body**: 14-16px, regular
- **Labels**: 12-14px, semibold
- **Captions**: 10-12px, gray

### Component Patterns
- Cards with rounded corners (16px)
- Status badges with color coding
- Emoji icons (placeholder for icon libraries)
- Consistent spacing (px-6, py-4, mt-4, etc.)

---

## 🗂️ Key File Locations

### Configuration Files
- `package.json` (root) - Monorepo workspace config
- `apps/customer/package.json` - Customer app dependencies
- `apps/partner/package.json` - Provider app dependencies
- `packages/shared/package.json` - Shared package config
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS config

### Shared Code (`packages/shared/`)
- `types/index.ts` - All TypeScript types
- `services/api.ts` - API service layer
- `services/mockData.ts` - Mock data (4 barbers, 7 services, 3 bookings)
- `store/useStore.ts` - Zustand global store
- `utils/format.ts` - Formatting helpers (currency, date, time)
- `constants/` - Colors, typography, config values

### Documentation
- `README.md` - Main project documentation
- `START_HERE.md` - Quick start guide
- `PROJECT_SUMMARY.md` - Detailed overview
- `STRUCTURE.md` - File structure explanation
- `README_MONOREPO.md` - Monorepo setup guide
- `docs/` - 71 additional doc files

---

## 🔑 Important Conventions

### Code Style
- **Files**: PascalCase for components, camelCase for utilities
- **Components**: Functional components with TypeScript
- **Styling**: Tailwind CSS classes via `className`
- **State**: Zustand for global, useState for local
- **Data Fetching**: React Query for server state
- **Types**: Explicit typing, avoid `any`
- **Exports**: Named exports preferred

### Folder Organization
- Each app has its own `app/` directory (Expo Router screens)
- Shared code lives in `packages/shared/`
- Symlinks used to share code between apps
- Documentation organized in `docs/` by category

### Mock Data Structure
```typescript
// All data in packages/shared/services/mockData.ts
mockBarbers: Barber[]      // 4 barbers
mockServices: Service[]    // 7 services
mockBookings: Booking[]    // 3 bookings
mockCustomer: Customer     // Test customer
mockAddresses: Address[]   // 2 addresses
```

---

## 🚦 Development Workflow

### Running Apps
```bash
# Customer App
cd apps/customer && npm start

# Partner App
cd apps/partner && npm start

# Both simultaneously (use 2 terminals)
```

### Installing Dependencies
```bash
# Root dependencies
npm install

# Customer app dependencies
cd apps/customer && npm install

# Provider app dependencies
cd apps/partner && npm install

# Shared package dependencies
cd packages/shared && npm install
```

### Common Issues & Fixes
```bash
# Module not found
npm start -- --clear

# Cached data issues
rm -rf node_modules && npm install

# TypeScript errors
npx tsc --noEmit
```

---

## 📱 Testing

### Test Users
- **Customer**: Phone `11-111 1111` (apps/customer)
- **Provider**: Phone `22-222 2222` (apps/partner)

### Testing Setup
- **MacBook Simulator**: Test Customer app (iOS/Android simulator)
- **Physical Phone**: Test Provider app (via Expo Go - scan QR)
- Both apps share same mock data
- Changes to `packages/shared/` affect both apps

---

## 🎯 Next Steps

### Immediate (Partner App)
1. Complete Schedule Management (Week 5)
2. Build Earnings & Payouts (Week 6)
3. Add Customer Management (Week 7)
4. Finish Profile & Settings (Week 8)

### Phase 3 (Backend Integration)
1. Design database schema
2. Build REST API (Node.js/Express or NestJS)
3. Implement authentication (JWT)
4. Replace mock data with real API calls
5. Add real-time features (Socket.io/Pusher)
6. Integrate payment gateway (Midtrans for Indonesia)
7. Implement push notifications
8. Deploy to production

### Polish & Optimization
1. Add unit tests & integration tests
2. Optimize performance (lazy loading, memoization)
3. Improve accessibility
4. Add dark mode
5. Internationalization (i18n)
6. Error tracking (Sentry)
7. Analytics (Mixpanel/Amplitude)

---

## 💡 Key Insights for AI Assistants

### When User Asks About...

**"How do I run the app?"**
- Ask which app: Customer or Provider?
- Navigate to appropriate app directory
- Run `npm start`
- Remind about test login credentials

**"The app won't start"**
- Clear cache: `npm start -- --clear`
- Check node_modules are installed
- Verify in correct directory
- Kill existing node processes if needed

**"I want to add a feature"**
- Determine if it's customer-only, provider-only, or shared
- Place code in appropriate location
- Use existing patterns from similar features
- Update TypeScript types if needed

**"How does data flow?"**
- UI → React Query → API Service → Mock Data
- State: Zustand for global, useState for local
- Navigation: Expo Router (file-based)

**"How do I share code between apps?"**
- Add to `packages/shared/`
- Import from `@/shared/...` (path alias)
- Both apps automatically get updates

**"Context is full / Can't remember"**
- This file should help maintain context
- Key info: Monorepo, 2 apps, Customer 100% done, Provider 50% done
- Mock data in `packages/shared/services/mockData.ts`
- All types in `packages/shared/types/index.ts`

---

## 📚 Reference Documentation

### Must-Read Files
1. `PROJECT_CONTEXT.md` (this file) - Overall context
2. `DEVELOPMENT_STATUS.md` - Current progress
3. `ARCHITECTURE_GUIDE.md` - System design
4. `COMMON_TASKS.md` - Quick commands
5. `README.md` - Main documentation

### When You Need Details
- **Types**: `packages/shared/types/index.ts`
- **Mock Data**: `packages/shared/services/mockData.ts`
- **API Layer**: `packages/shared/services/api.ts`
- **State**: `packages/shared/store/useStore.ts`
- **Utilities**: `packages/shared/utils/format.ts`

---

## 🔄 Version History

- **2025-10-07**: Project at 50% completion
- **2025-10-06**: Customer app completed (Phase 2)
- **2025-10-04**: Provider app started (Week 1)
- **2025-10-03**: Monorepo structure implemented
- Earlier: Initial Customer app development (Phase 1)

---

## 🎉 Success Metrics

### Code Quality
- ~10,000+ lines of TypeScript code
- 100% type coverage (no `any` types)
- 25 screens in Customer app
- 14 reusable components
- 71 documentation files

### Completeness
- Customer App: 100% ✅
- Partner App: 50% ⏳
- Backend: 0% ⏸️
- Testing: Manual testing only
- Deployment: Not yet

---

**This context file helps AI assistants maintain memory of your project even when context limits are reached. Always refer back to this file for project overview and current status.**
