# Role-Based Authentication Flow

## Overview
MariGunting uses a **unified login system** where both customers and barbers log in through the same flow. The backend determines the user's role and serves the appropriate interface.

## 📱 User Flow

### For New Users (Registration)
```
1. Launch App
   ↓
2. Splash Screen (3s)
   ↓
3. Login Screen
   - Enter Malaysian phone number (+60)
   - Tap "Continue"
   ↓
4. OTP Verification (optional)
   - Enter 6-digit OTP
   - Verify code
   ↓
5. Backend Check: User exists?
   ├─ NO → New User
   │   ↓
   │   6a. Role Selection Screen ⭐ NEW
   │       - Choose: Customer or Barber
   │       ↓
   │   7a. Complete Profile
   │       - Name, email, photo
   │       - Additional info based on role
   │       ↓
   │   8a. Navigate to appropriate app
   │       ├─ Customer → Customer Home
   │       └─ Barber → Barber Dashboard
   │
   └─ YES → Existing User
       ↓
       6b. Backend returns user data with role
       ↓
       7b. Navigate to appropriate app
           ├─ Customer → Customer Home
           └─ Barber → Barber Dashboard
```

### For Returning Users (Login)
```
1. Launch App
   ↓
2. Splash Screen (3s)
   ↓
3. Check Auth State
   ├─ Logged In → Navigate to appropriate home
   └─ Not Logged In → Login Screen
```

## 🎭 Two Different Apps in One

### Customer App
**Features:**
- Browse barbers (freelance & barbershop)
- Book appointments
- Track bookings
- Rate & review
- Manage addresses
- Payment methods

**Screens:**
- Home (browse barbers)
- Service (filtered view)
- Bookings (appointments)
- Rewards (loyalty)
- Profile

### Barber App
**Features:**
- Manage availability
- Accept/reject bookings
- Track earnings
- Update services & pricing
- Navigate to customer location
- Receive ratings

**Screens:**
- Dashboard (bookings & earnings)
- Schedule (calendar)
- Services (manage offerings)
- Earnings (financial overview)
- Profile

## 🔐 Backend API Structure

### 1. Send OTP
```typescript
POST /api/auth/send-otp
Request:
{
  phoneNumber: "+60123456789"
}

Response:
{
  success: true,
  message: "OTP sent successfully"
}
```

### 2. Verify OTP (Existing User)
```typescript
POST /api/auth/verify-otp
Request:
{
  phoneNumber: "+60123456789",
  otp: "123456"
}

Response (Existing User):
{
  success: true,
  token: "jwt_token_here",
  user: {
    id: "usr_123",
    name: "Ahmad Abdullah",
    email: "ahmad@email.com",
    phone: "+60123456789",
    role: "customer", // or "barber"
    avatar: "https://...",
    // Additional fields based on role
  },
  isNewUser: false
}

Response (New User):
{
  success: true,
  token: "jwt_token_here",
  isNewUser: true,
  phoneNumber: "+60123456789"
}
```

### 3. Complete Profile (New Users)
```typescript
POST /api/auth/complete-profile
Request:
{
  phoneNumber: "+60123456789",
  name: "Ahmad Abdullah",
  email: "ahmad@email.com",
  role: "customer", // or "barber"
  avatar?: "base64_image_or_url",
  // Additional fields for barbers:
  bio?: "Professional barber with 5 years experience",
  specializations?: ["haircut", "beard-trim"],
  services?: [...],
}

Response:
{
  success: true,
  user: { /* full user object */ }
}
```

## 🎨 UI Components Created

### 1. **Login Screen** (`app/login.tsx`)
- Malaysian phone format (+60)
- Real-time validation
- Professional design

### 2. **OTP Verification** (`app/otp-verification.tsx`)
- 6-digit input
- Countdown timer
- Resend functionality

### 3. **Role Selection** (`app/select-role.tsx`) ⭐ NEW
- Beautiful gradient cards
- Customer card (green)
- Barber card (dark)
- Feature highlights
- Can switch role later

## 💡 Implementation Strategy

### Current Demo Flow (Simplified)
```typescript
// In login.tsx after OTP verification:
if (response.isNewUser) {
  // Navigate to role selection
  router.push('/select-role');
} else {
  // Set user and navigate to app
  setCurrentUser(response.user);
  if (response.user.role === 'customer') {
    router.replace('/(tabs)'); // Customer app
  } else {
    router.replace('/barber/(tabs)'); // Barber app
  }
}
```

### Production Flow
1. **Backend determines role** from database
2. **Frontend shows appropriate interface** based on role
3. **Separate navigation stacks** for customer vs barber
4. **Shared components** (login, profile basics)
5. **Role-specific features** completely separated

## 🚀 Next Steps

### Phase 1: Complete Customer App ✅
- [x] Login system
- [x] Role selection UI
- [x] Customer home screen
- [ ] Booking flow
- [ ] Payment integration

### Phase 2: Build Barber App
- [ ] Create `/barber` directory
- [ ] Barber dashboard
- [ ] Booking management
- [ ] Earnings tracking
- [ ] Availability calendar

### Phase 3: Backend Integration
- [ ] Authentication API
- [ ] Role management
- [ ] User profiles
- [ ] Booking system
- [ ] Payment processing

### Phase 4: Advanced Features
- [ ] Push notifications
- [ ] Real-time location tracking
- [ ] In-app chat
- [ ] Rating system
- [ ] Loyalty program

## 🔄 Role Switching (Future Feature)

Some users might want to be BOTH customer and barber:
```typescript
// Store both roles
interface User {
  id: string;
  roles: ('customer' | 'barber')[];
  activeRole: 'customer' | 'barber';
}

// Allow switching in profile
const switchRole = (newRole: 'customer' | 'barber') => {
  setActiveRole(newRole);
  // Navigate to appropriate app
};
```

## 📊 Metrics to Track

### Authentication
- Login success rate
- OTP delivery time
- New user registration rate
- Role selection distribution

### Usage
- Customer vs Barber ratio
- Active users by role
- Session duration by role
- Feature usage by role

## 🎯 Best Practices

1. **Single Source of Truth**: Backend determines role
2. **Graceful Degradation**: Handle API failures
3. **Security**: JWT tokens, secure storage
4. **UX**: Fast navigation, clear feedback
5. **Scalability**: Easy to add new roles (admin, support, etc.)

## 📱 App Structure

```
app/
├── login.tsx                    # Single login for all
├── otp-verification.tsx         # OTP verification
├── select-role.tsx              # Role selection for new users ⭐
├── complete-profile.tsx         # Profile completion (TODO)
├── (tabs)/                      # Customer app
│   ├── index.tsx               # Browse barbers
│   ├── service.tsx             # Filtered services
│   ├── bookings.tsx            # My bookings
│   ├── rewards.tsx             # Loyalty rewards
│   └── profile.tsx             # Profile & settings
└── barber/                      # Barber app (TODO)
    └── (tabs)/
        ├── dashboard.tsx        # Bookings & earnings
        ├── schedule.tsx         # Calendar
        ├── services.tsx         # Manage services
        ├── earnings.tsx         # Financial overview
        └── profile.tsx          # Profile & settings
```

---

**Note**: This is a production-level architecture that scales well and provides clear separation between customer and barber experiences while maintaining a unified authentication system.
