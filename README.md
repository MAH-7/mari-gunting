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
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Home screen (barber listings)
│   │   ├── bookings.tsx   # Bookings screen
│   │   └── profile.tsx    # Profile screen
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Welcome/Splash screen
├── components/            # Reusable components (to be added)
├── services/              # API and mock data
│   ├── api.ts            # API service layer
│   └── mockData.ts       # Mock data
├── store/                # Zustand stores
│   └── useStore.ts       # Global state management
├── types/                # TypeScript types
│   └── index.ts          # Type definitions
├── utils/                # Utility functions
│   └── format.ts         # Formatting helpers
└── constants/            # App constants (to be added)
```

## 🎯 Current Features (Phase 1 - Frontend with Mock Data)

### ✅ Completed
- [x] Project setup with Expo + TypeScript
- [x] File-based routing with Expo Router
- [x] Tab navigation (Home, Bookings, Profile)
- [x] Complete TypeScript type system
- [x] Mock data layer with realistic data
- [x] API service layer (using mock data)
- [x] Home screen with barber listings
- [x] Search and filter functionality
- [x] Bookings screen (upcoming & history)
- [x] Profile screen
- [x] Responsive design with NativeWind
- [x] State management with Zustand
- [x] Utility functions (currency, date, time formatting)

### 🚧 To Be Added
- [ ] Barber detail screen
- [ ] Booking confirmation flow
- [ ] Service selection screen
- [ ] Address selection screen
- [ ] Real-time booking tracking
- [ ] Review/Rating system
- [ ] Payment integration screens
- [ ] Push notifications UI
- [ ] Chat/messaging feature

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

## 📊 Mock Data

The app uses comprehensive mock data including:
- **4 Barbers** with profiles, ratings, services, and availability
- **7 Services** across different categories
- **3 Sample Bookings** with different statuses
- **1 Customer** profile with saved addresses
- Realistic Indonesian addresses and pricing (IDR)

## 🎨 Design Features

- Modern, clean UI inspired by Grab/Foodpanda
- Primary color: Blue (#0ea5e9)
- Responsive layout with TailwindCSS utilities
- Smooth animations and transitions
- Emoji icons for visual appeal
- Status badges and indicators
- Card-based design system

## 🔄 Next Steps (Phase 2 - Backend Integration)

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

**Note**: This is Phase 1 with frontend and mock data. Backend integration and advanced features will be added in Phase 2.
