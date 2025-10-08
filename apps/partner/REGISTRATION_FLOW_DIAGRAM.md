# Partner Registration Flow - Visual Diagram

## Complete Registration Journey

```
┌─────────────────────────────────────────────────────────────────────┐
│                         APP LAUNCH                                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Splash Screen  │
                    │   (2 seconds)  │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Check User     │
                    │ Authentication │
                    └────┬───────┬───┘
                         │       │
              No User ───┘       └─── User Exists
                    │                      │
                    ▼                      ▼
           ┌─────────────────┐    ┌──────────────┐
           │  Login Screen   │    │  Dashboard   │
           │   /login        │    │   (tabs)     │
           └────┬───────┬────┘    └──────────────┘
                │       │
    Login ◄─────┘       └────► Register
      │                            │
      │                            ▼
      │                   ┌──────────────────┐
      │                   │ Register Screen  │
      │                   │   /register      │
      │                   └────────┬─────────┘
      │                            │
      │                   ┌────────▼─────────┐
      │                   │ Enter Phone No.  │
      │                   │  +60 12-345 6789 │
      │                   └────────┬─────────┘
      │                            │
      │                   ┌────────▼─────────┐
      │                   │ Validate Phone   │
      │                   │  (9-10 digits)   │
      │                   └────────┬─────────┘
      │                            │
      │                   ┌────────▼─────────┐
      │                   │   Send OTP       │
      │                   │  (Simulated)     │
      │                   └────────┬─────────┘
      │                            │
      └────────────┬               │
                   │               ▼
                   │      ┌──────────────────────┐
                   │      │ Account Type Select  │
                   │      │ /select-account-type │
                   │      └────────┬─────────────┘
                   │               │
                   │      ┌────────┴─────────┐
                   │      │                  │
                   │      ▼                  ▼
                   │  ┌────────────┐   ┌──────────────┐
                   │  │ Freelance  │   │  Barbershop  │
                   │  │   Barber   │   │    Owner     │
                   │  │     🧔     │   │      🏪      │
                   │  └─────┬──────┘   └──────┬───────┘
                   │        │                  │
                   │        │ Save Account     │
                   │        │ Type to Storage  │
                   │        │                  │
                   │        └────────┬─────────┘
                   │                 │
                   │                 ▼
                   │        ┌─────────────────┐
                   └───────►│   Login User    │
                            │  Set currentUser│
                            └────────┬────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │   Dashboard     │
                            │  /(tabs)/...    │
                            └─────────────────┘
```

## Detailed Screen Flows

### 1. Login Screen (`/login`)

```
┌───────────────────────────────────┐
│         PARTNER LOGIN             │
├───────────────────────────────────┤
│                                   │
│  [Logo: Mari Gunting]            │
│                                   │
│  Phone Number                     │
│  ┌─────┬────────────────────┐   │
│  │🇲🇾 +60│ 22-222 2222      │   │
│  └─────┴────────────────────┘   │
│                                   │
│  ℹ️ We'll send an OTP to verify  │
│                                   │
│  [ Continue ]                     │
│                                   │
│  Don't have an account? Register │
│                                   │
│  Terms of Service | Privacy      │
└───────────────────────────────────┘
```

### 2. Registration Screen (`/register`)

```
┌───────────────────────────────────┐
│      BECOME A PARTNER             │
├───────────────────────────────────┤
│                                   │
│  [Logo: Mari Gunting]            │
│                                   │
│  Join our platform and grow       │
│  your business                    │
│                                   │
│  ┌─ Benefits ─────────────────┐ │
│  │ 👥 Reach more customers     │ │
│  │ 📅 Manage bookings easily   │ │
│  │ 📈 Grow your revenue        │ │
│  └─────────────────────────────┘ │
│                                   │
│  Phone Number                     │
│  ┌─────┬────────────────────┐   │
│  │🇲🇾 +60│ 12-345 6789      │   │
│  └─────┴────────────────────┘   │
│                                   │
│  ℹ️ We'll send an OTP to verify  │
│                                   │
│  [ Continue ]                     │
│                                   │
│  Already have an account? Login  │
│                                   │
│  Terms of Service | Privacy      │
└───────────────────────────────────┘
```

### 3. Account Type Selection (`/select-account-type`)

```
┌───────────────────────────────────────────────┐
│      CHOOSE YOUR ACCOUNT TYPE                 │
│  Select how you want to work with Mari Gunting│
├───────────────────────────────────────────────┤
│                                               │
│  ┌─── FREELANCE BARBER ───────────────────┐ │
│  │  🧔                                     │ │
│  │  Freelance Barber                 ✓    │ │
│  │  I'm an individual barber who travels  │ │
│  │  to customers' locations               │ │
│  │                                         │ │
│  │  ✓ Accept mobile bookings              │ │
│  │  ✓ Set your service area               │ │
│  │  ✓ Manage your schedule                │ │
│  └─────────────────────────────────────────┘ │
│                                               │
│  ┌─── BARBERSHOP OWNER ───────────────────┐ │
│  │  🏪                                     │ │
│  │  Barbershop Owner                      │ │
│  │  I own a barbershop where customers    │ │
│  │  come to my location                   │ │
│  │                                         │ │
│  │  ✓ Manage shop appointments            │ │
│  │  ✓ Add & manage staff                  │ │
│  │  ✓ Track shop analytics                │ │
│  └─────────────────────────────────────────┘ │
│                                               │
│  [ Continue → ]                               │
│                                               │
│  ⚠️ You can't change this later, so choose   │
│     carefully                                 │
└───────────────────────────────────────────────┘
```

## Data Storage Flow

```
┌─────────────────────────────────────────────────────────┐
│                    DATA PERSISTENCE                      │
└─────────────────────────────────────────────────────────┘

Registration Data:
─────────────────
Phone Number ──────────► Temporary (for OTP)
                         └─► Not stored (yet)

Account Selection:
──────────────────
Account Type ──────────► AsyncStorage
                         Key: 'partnerAccountType'
                         Value: 'freelance' | 'barbershop'

User Session:
─────────────
User Data ─────────────► Zustand Store (with persist)
                         Key: 'mari-gunting-storage'
                         Contains: currentUser object
```

## Account Type Comparison

```
╔═══════════════════════════════════════════════════════════════════╗
║                 FREELANCE BARBER vs BARBERSHOP                    ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  FEATURE              │ FREELANCE BARBER │ BARBERSHOP OWNER      ║
║  ─────────────────────┼──────────────────┼──────────────────────║
║  Mobile Service       │       ✓         │         ✗            ║
║  Shop Location        │       ✗         │         ✓            ║
║  Staff Management     │       ✗         │         ✓            ║
║  Travel to Customers  │       ✓         │         ✗            ║
║  Service Area         │       ✓         │    (Fixed Location)  ║
║  Personal Schedule    │       ✓         │         ✓            ║
║  Shop Hours           │       ✗         │         ✓            ║
║  Portfolio            │       ✓         │         ✓            ║
║  Analytics            │   Personal      │    Shop-wide         ║
║  Bookings             │   Individual    │    Staff + Shop      ║
║  Revenue Split        │   88% + 100%*   │    To be defined     ║
║                       │   *service+travel│                       ║
╚═══════════════════════════════════════════════════════════════════╝
```

## Navigation Map

```
Root Routes:
├── /                          (index - routing logic)
├── /login                     (partner login)
├── /register                  (partner registration)
├── /select-account-type       (account type selection)
│
├── /(tabs)                    (main app - authenticated)
│   ├── /dashboard            (freelance barber dashboard)
│   ├── /dashboard-shop       (barbershop dashboard)
│   ├── /jobs                 (freelance: job requests)
│   ├── /bookings             (barbershop: appointments)
│   ├── /schedule             (calendar & availability)
│   ├── /earnings             (revenue tracking)
│   ├── /staff                (barbershop: staff management)
│   ├── /shop                 (barbershop: shop profile)
│   ├── /reports              (analytics & insights)
│   └── /profile              (user profile)
│
└── /profile/edit             (edit profile details)
```

## Success Metrics

```
Registration Funnel:
────────────────────

100% │ ██████████████████████  Landing
     │ 
 85% │ ████████████████        Phone Entry
     │ 
 75% │ ██████████████          OTP Verification
     │ 
 95% │ ███████████████████     Account Type Selection
     │ 
 90% │ ██████████████████      Complete Registration
     │
     └──────────────────────────────────────────────────
       Step 1   Step 2   Step 3   Step 4   Step 5
```

## Error Handling

```
Potential Issues:
─────────────────

Invalid Phone Format
    ↓
Show inline validation error
"Please enter a valid Malaysian phone number (9-10 digits)"

OTP Failed
    ↓
Alert with retry option
"Unable to send OTP. Please try again."

Network Error
    ↓
Show error message with refresh
"Connection failed. Check your internet."

Account Already Exists
    ↓
Redirect to login
"Account exists. Please login instead."
```

## Testing Checklist

```
✓ Registration Flow
  □ Enter valid phone number
  □ Enter invalid phone number (error shown)
  □ OTP sending simulation works
  □ Navigation to account type selection
  
✓ Account Type Selection
  □ Select Freelance Barber
  □ Select Barbershop Owner
  □ Verify selection highlighting
  □ Continue button disabled until selection
  □ Account type saved correctly
  
✓ Dashboard Access
  □ Freelance barber sees correct dashboard
  □ Barbershop owner sees correct dashboard
  □ User session persists after app restart
  □ Logout clears session properly
```

---

## Quick Reference

**Test Phone:** `22-222 2222`  
**Storage Key:** `partnerAccountType`  
**Values:** `freelance` | `barbershop`  
**Primary Color:** `#00B14F` (Green)  
**Country Code:** `+60` (Malaysia 🇲🇾)
