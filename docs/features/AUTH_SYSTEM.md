# Authentication System Documentation

## Overview
Production-ready phone number authentication system following Grab's design principles and best practices.

## Features

### ✅ Login Screen (`/app/login.tsx`)
- **Phone Number Input**
  - Indonesian phone number format (+62)
  - Auto-formatting: 812-3456-7890
  - Real-time validation (10-13 digits)
  - Country code selector (currently ID only)
  
- **User Experience**
  - Auto-focus on phone input
  - Disabled state while loading
  - Clear validation messages
  - Loading indicator during API calls

- **Alternative Login Options**
  - Google Sign-In (UI ready)
  - Apple Sign-In (UI ready)
  
- **Legal Compliance**
  - Terms of Service link
  - Privacy Policy link

### ✅ OTP Verification Screen (`/app/otp-verification.tsx`)
- **6-Digit OTP Input**
  - Individual input boxes for each digit
  - Auto-focus next input on entry
  - Backspace navigation
  - Number-only keyboard
  
- **Features**
  - 60-second countdown timer
  - Resend OTP functionality
  - Visual feedback (filled state)
  - Help button for support

- **User Experience**
  - Back button to return to login
  - Loading state during verification
  - Error handling with clear messages
  - Auto-submit when OTP complete (optional)

### ✅ Authentication Flow

```
Splash Screen
    ↓
Index (Auth Check)
    ↓
  ┌─────────────┐
  │             │
  ↓             ↓
Login    →   Home (if authenticated)
  ↓
OTP Verification (optional)
  ↓
Home (Tabs)
```

### ✅ State Management
- **Zustand Store** (`/store/useStore.ts`)
  - `currentUser`: Customer | Barber | null
  - `setCurrentUser`: Update user state
  - Persists across app sessions (can add AsyncStorage)

### ✅ Logout Functionality
- **Profile Screen** has logout button
- Confirmation dialog before logout
- Clears user state and redirects to login

## Implementation Details

### Phone Number Validation
```typescript
// Indonesian format: +62 812-3456-7890
// Validates 10-13 digits (without country code)
const validatePhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 13;
};
```

### Auto-Formatting
```typescript
// Input: 81234567890
// Output: 812-3456-7890
const formatPhoneNumber = (text: string) => {
  const cleaned = text.replace(/\D/g, '');
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 7) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
};
```

## API Integration (TODO)

### Send OTP
```typescript
// POST /api/auth/send-otp
interface SendOtpRequest {
  phoneNumber: string; // +628123456789
}

interface SendOtpResponse {
  success: boolean;
  message: string;
  expiresIn: number; // seconds
}
```

### Verify OTP
```typescript
// POST /api/auth/verify-otp
interface VerifyOtpRequest {
  phoneNumber: string;
  otp: string; // 6 digits
}

interface VerifyOtpResponse {
  success: boolean;
  token: string; // JWT token
  user: Customer | Barber;
}
```

### Resend OTP
```typescript
// POST /api/auth/resend-otp
interface ResendOtpRequest {
  phoneNumber: string;
}
```

## Security Best Practices

### ✅ Implemented
- Phone number validation
- OTP length validation (6 digits)
- Rate limiting (60s between resend)
- Input sanitization (numeric only)
- Secure navigation (replace, not push)

### 🔄 TODO for Production
- [ ] Add reCAPTCHA to prevent bots
- [ ] Implement rate limiting on backend
- [ ] Hash phone numbers in logs
- [ ] Use HTTPS for all API calls
- [ ] Store JWT tokens securely (Keychain/Keystore)
- [ ] Implement refresh token flow
- [ ] Add biometric authentication option
- [ ] Session timeout handling
- [ ] Device fingerprinting

## Testing Checklist

### Login Screen
- [ ] Phone number validation works correctly
- [ ] Formatting updates in real-time
- [ ] Button disables for invalid input
- [ ] Loading state shows during API call
- [ ] Error messages display properly
- [ ] Navigation works after successful login
- [ ] Back button on Android works

### OTP Screen
- [ ] All 6 inputs work correctly
- [ ] Auto-focus progresses forward
- [ ] Backspace navigates backward
- [ ] Countdown timer counts down correctly
- [ ] Resend enables after countdown
- [ ] Verify button disabled until complete
- [ ] Loading state shows during verify
- [ ] Back button returns to login

### Auth Flow
- [ ] First time users see login screen
- [ ] Logged in users bypass login
- [ ] Logout clears state properly
- [ ] App restarts show correct screen

## Design Specifications

### Colors
- Primary Green: `#00B14F` (Grab green)
- Success: `#F0FDF4` (light green background)
- Error: `#EF4444`
- Text Primary: `#111827`
- Text Secondary: `#6B7280`
- Border: `#E5E7EB`
- Background: `#FFFFFF`

### Typography
- Title: 28px, Bold (-0.5 letter-spacing)
- Subtitle: 15px, Regular
- Input: 16px, Medium
- Button: 16px, Bold (0.3 letter-spacing)

### Spacing
- Screen Padding: 24px
- Section Margin: 32px
- Element Gap: 12-16px
- Button Height: 56px

### Animations
- Button Active Opacity: 0.8
- Input Focus: Border color transition
- Loading: Smooth spinner

## Next Steps for Production

1. **Backend Integration**
   - Connect to SMS gateway (Twilio, AWS SNS)
   - Implement OTP generation and validation
   - Set up authentication endpoints
   - Add JWT token management

2. **Enhanced Security**
   - Add Firebase Auth or Supabase
   - Implement proper token storage
   - Add refresh token flow
   - Rate limiting on attempts

3. **User Experience**
   - Add "Remember Me" option
   - Implement biometric login
   - Add social login (Google, Apple)
   - Phone number auto-detection

4. **Analytics**
   - Track login success/failure rates
   - Monitor OTP delivery times
   - Track authentication errors
   - User journey analytics

5. **Testing**
   - Unit tests for validation
   - Integration tests for API calls
   - E2E tests for auth flow
   - Load testing for auth endpoints

## Files Structure

```
app/
├── login.tsx                 # Phone login screen
├── otp-verification.tsx      # OTP verification screen
├── index.tsx                 # Auth check & routing
├── _layout.tsx              # Root layout
└── (tabs)/
    └── profile.tsx          # Logout functionality

store/
└── useStore.ts              # Auth state management

docs/
└── AUTH_SYSTEM.md           # This file
```

## Support

For production deployment questions, contact the development team or refer to the main project documentation.
