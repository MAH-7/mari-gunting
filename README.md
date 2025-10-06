# Mari Gunting - On-Demand Barber Service App

A React Native mobile application built with Expo for connecting customers with professional barbers who provide services at customer locations.

## 🚀 Project Overview

**Mari Gunting** is a marketplace app similar to Foodpanda/Grab but specialized for barbering services. Customers can:
- Browse available barbers
- View barber profiles, ratings, and services
- Book appointments
- Track service status
- Review completed services

## 📱 Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Language**: TypeScript
- **Mock API**: Local mock data layer (ready for backend integration)

## 📁 Project Structure

```
mari-gunting/
├── app/                    # Expo Router screens (25 screens)
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── _layout.tsx    # Tab layout configuration
│   │   ├── index.tsx      # Home screen
│   │   ├── bookings.tsx   # Bookings screen
│   │   ├── profile.tsx    # Profile screen
│   │   ├── rewards.tsx    # Rewards/loyalty screen
│   │   └── service.tsx    # Service packages screen
│   ├── barber/            # Barber-related screens
│   │   ├── [id].tsx       # Barber detail
│   │   └── reviews/[id].tsx  # Barber reviews
│   ├── barbershop/        # Barbershop-related screens
│   │   ├── [id].tsx       # Barbershop detail
│   │   ├── barbers/[shopId].tsx  # Shop staff
│   │   ├── booking/[barberId].tsx  # Shop booking
│   │   └── reviews/[id].tsx  # Shop reviews
│   ├── booking/           # Booking flow
│   │   ├── [id].tsx       # Booking detail
│   │   └── create.tsx     # Create booking
│   ├── _layout.tsx        # Root layout
│   ├── login.tsx          # Login screen
│   ├── register.tsx       # Registration
│   ├── otp-verification.tsx  # OTP verification
│   ├── select-role.tsx    # Role selection
│   ├── barber-verification.tsx  # Barber verification
│   ├── barbers.tsx        # Freelance barbers list
│   ├── barbershops.tsx    # Barbershops list
│   ├── quick-book.tsx     # Quick booking
│   └── payment-method.tsx # Payment selection
├── components/            # Reusable components (14 files)
│   ├── Skeleton/          # Loading skeletons
│   ├── BookingFilterModal.tsx
│   ├── ConfirmationModal.tsx
│   ├── FilterModal.tsx
│   ├── ImageCarousel.tsx
│   ├── LocationGuard.tsx
│   ├── ServiceModal.tsx
│   ├── SplashScreen.tsx
│   └── SuccessModal.tsx
├── services/              # API and mock data
│   ├── api.ts            # API service layer
│   └── mockData.ts       # Mock data
├── store/                # Zustand stores
│   └── useStore.ts       # Global state management
├── types/                # TypeScript types
│   └── index.ts          # Type definitions
├── utils/                # Utility functions
│   └── format.ts         # Formatting helpers
└── docs/                 # Documentation
    ├── features/         # Feature guides (33 files)
    ├── business/         # Business docs (8 files)
    ├── testing/          # Testing guides (3 files)
    └── archive/          # Archived docs (12 files)
```

## 🎯 Current Features (Phase 2 - Advanced Frontend)

### ✅ Completed

#### Core Infrastructure
- [x] Project setup with Expo + TypeScript
- [x] File-based routing with Expo Router
- [x] Tab navigation (Home, Bookings, Profile, Rewards, Service)
- [x] Complete TypeScript type system
- [x] Mock data layer with realistic data
- [x] API service layer (using mock data)
- [x] State management with Zustand
- [x] Utility functions (currency, date, time formatting)
- [x] Responsive design with NativeWind

#### Authentication & Onboarding
- [x] Login screen with phone authentication
- [x] Registration screen
- [x] OTP verification
- [x] Role selection (Customer/Barber)
- [x] Barber verification process

#### Browse & Discovery
- [x] Home screen with barber listings
- [x] Barbershops listing screen
- [x] Freelance barbers listing screen
- [x] Search and filter functionality
- [x] Filter modal with advanced options
- [x] Online/offline status indicators

#### Barber & Barbershop Details
- [x] Barber detail screen with full profile
- [x] Barbershop detail screen
- [x] Reviews listing screen
- [x] Service listings with pricing
- [x] Photo galleries with carousel
- [x] Rating & review display

#### Booking System
- [x] Bookings screen (upcoming & history)
- [x] Quick book feature
- [x] Full booking creation flow
- [x] Booking detail screen
- [x] Service selection modal
- [x] Booking filter modal
- [x] Booking confirmation modal

#### Payment & Rewards
- [x] Payment method selection screen
- [x] Rewards/loyalty program screen
- [x] Service packages screen

#### Reusable Components
- [x] Skeleton loading system (5 components)
- [x] Modal system (Filter, Service, Booking, Confirmation, Success)
- [x] Image carousel component
- [x] Location guard component
- [x] Splash screen component

#### Location Features
- [x] GPS location integration
- [x] Location permissions handling
- [x] Distance calculation

### 🚧 To Be Added (Phase 3 - Backend Integration)
- [ ] Real backend API integration
- [ ] Real-time booking tracking
- [ ] Push notifications
- [ ] In-app chat/messaging
- [ ] Payment gateway integration (Midtrans/Xendit)
- [ ] File upload for photos
- [ ] Admin dashboard

## 🏃 Getting Started

### Prerequisites
- Node.js (v20+)
- npm or yarn
- Expo Go app (for mobile testing)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on your device:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app for physical device

## 📊 Project Statistics

- **Total Screens**: 25 (up from 4 in Phase 1)
- **Reusable Components**: 14 (including 6 skeleton loaders)
- **Lines of Code**: ~10,000+ (estimated)
- **Documentation Files**: 37 across docs/ folders (consolidated from 56+)
- **Mock Data**: 4 barbers, 7 services, 3 bookings, realistic Indonesian data
- **Dependencies**: 26 production packages

## 🎨 Design Features

- Modern, clean UI inspired by Grab/Foodpanda
- Primary color: Blue (#0ea5e9)
- Responsive layout with TailwindCSS utilities
- Smooth animations and transitions
- Emoji icons for visual appeal
- Status badges and indicators
- Card-based design system

## 🔄 Next Steps (Phase 3 - Backend Integration)

1. **Backend Development**:
   - API endpoints design
   - Database schema (PostgreSQL/MongoDB)
   - Authentication (JWT)
   - Real-time updates (WebSockets/Pusher)

2. **Integration**:
   - Replace mock data with real API calls
   - Add authentication flow
   - Implement real-time tracking
   - Payment gateway integration
   - Push notifications
   - File upload (photos)

3. **Advanced Features**:
   - Maps integration (Google Maps/Mapbox)
   - Location tracking
   - In-app chat
   - Analytics
   - Admin dashboard

## 📝 Key TypeScript Types

### Main Types
- `User`, `Customer`, `Barber` - User entities
- `Service` - Service definitions
- `Booking` - Booking with status tracking
- `Address` - Location data
- `Payment` - Payment information
- `Review` - Rating and reviews

### Status Types
- `BookingStatus`: pending, accepted, on-the-way, in-progress, completed, cancelled
- `PaymentStatus`: pending, paid, refunded
- `PaymentMethod`: cash, card, e-wallet

## 🛠 Development Tips

### Running Tests
```bash
npm test
```

### Type Checking
```bash
npx tsc --noEmit
```

### Build for Production
```bash
# iOS
npm run ios

# Android
npm run android
```

## 📄 License

This project is for educational/commercial purposes.

## 👥 Team

- Developer: [Your Name]
- Project: Side Income Project

---

**Last updated**: 2025-10-06 02:38 UTC

**Note**: This is Phase 2 with advanced frontend features and mock data. Backend integration will be added in Phase 3.
