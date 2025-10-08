# Partner Registration Guide

## How Barbers & Barbershops Register

This guide explains the complete registration flow for barbers and barbershop owners to join the Mari Gunting partner platform.

---

## Registration Flow Overview

```
Splash Screen → Login Screen → [Register] → Account Type Selection → Dashboard
```

### Step-by-Step Process

#### 1. **Initial Access**
When a new partner opens the app:
- App shows **Splash Screen** with branding
- Redirects to **Login Screen** (`/login`)
- Login screen shows "Don't have an account? **Register**" link

#### 2. **Registration Screen** (`/register`)

**Route:** `/register`

**Features:**
- **Logo & Branding** display
- **Phone Number Input** with Malaysian format
  - Country code: `+60` (Malaysia) 🇲🇾
  - Format: `12-345 6789`
  - Validation: 9-10 digits
- **Benefits Section** showing:
  - 👥 Reach more customers
  - 📅 Manage bookings easily
  - 📈 Grow your revenue

**What Happens:**
1. Partner enters their Malaysian phone number
2. App validates the format
3. OTP is sent to verify the number (simulated in current implementation)
4. After validation, redirects to **Account Type Selection**

#### 3. **Account Type Selection** (`/select-account-type`)

**Route:** `/select-account-type`

Partners choose between **TWO account types**:

##### Option A: **Freelance Barber** 🧔
*"I'm an individual barber who travels to customers' locations"*

**Features:**
- ✅ Accept mobile bookings
- ✅ Set your service area
- ✅ Manage your schedule

**Best for:**
- Independent barbers
- Mobile service providers
- Barbers who visit clients' homes/offices

##### Option B: **Barbershop Owner** 🏪
*"I own a barbershop where customers come to my location"*

**Features:**
- ✅ Manage shop appointments
- ✅ Add & manage staff
- ✅ Track shop analytics

**Best for:**
- Barbershop owners
- Salon proprietors
- Business with physical location and staff

**Important Note:**
> ⚠️ "You can't change this later, so choose carefully"

#### 4. **Account Creation & Dashboard Access**

After selecting account type:
1. Account type is saved to `AsyncStorage` as `partnerAccountType`
2. Partner is redirected to appropriate dashboard:
   - **Freelance Barber** → Freelance Dashboard (`/dashboard`)
   - **Barbershop Owner** → Shop Dashboard (`/dashboard-shop`)

---

## Technical Implementation

### File Structure
```
apps/partner/
├── app/
│   ├── index.tsx                      # Entry point & routing logic
│   ├── login.tsx                      # Login screen
│   ├── register.tsx                   # Registration screen
│   ├── select-account-type.tsx        # Account type selection
│   └── (tabs)/
│       ├── dashboard.tsx              # Freelance barber dashboard
│       └── dashboard-shop.tsx         # Barbershop dashboard
```

### Data Flow

```javascript
// 1. Registration
register.tsx
  ↓ (phone number entered)
  → Sends OTP (simulated)
  → Navigate to: /select-account-type?phoneNumber=xxx

// 2. Account Type Selection
select-account-type.tsx
  ↓ (account type selected)
  → Save to AsyncStorage: 'partnerAccountType' = 'freelance' | 'barbershop'
  → Navigate to: /(tabs)/dashboard

// 3. Dashboard Routing
index.tsx / _layout.tsx
  → Checks currentUser
  → Loads appropriate dashboard based on account type
```

### Storage Keys
- **`partnerAccountType`**: Stores `'freelance'` or `'barbershop'`
- **`mari-gunting-storage`**: Zustand persist store (user data)

---

## Testing the Registration Flow

### Test Credentials

For development/testing:

**Login:**
- Phone: `22-222 2222` (mock partner login)
- OTP: Any code (simulated)

**Registration:**
1. Enter any valid Malaysian phone number (e.g., `12-345 6789`)
2. Click "Continue"
3. Choose account type
4. Access dashboard

---

## User Interface Details

### Registration Screen UI
- **Clean, modern design** with green primary color (`#00B14F`)
- **Malaysian flag emoji** 🇲🇾 next to country code
- **Auto-formatting** phone number as user types
- **Real-time validation** with disabled state for invalid inputs
- **Loading states** with activity indicator
- **Helper text** explaining OTP process

### Account Type Selection UI
- **Card-based selection** with visual feedback
- **Icon differentiation**: Person icon vs Business icon
- **Feature lists** for each account type
- **Checkmark indicator** for selected option
- **Disabled state** until selection is made
- **Warning message** about permanent choice

---

## Features by Account Type

### Freelance Barber Dashboard
- **Jobs Management**: Accept/reject booking requests
- **Earnings Tracker**: View daily/weekly/monthly earnings
- **Schedule**: Manage availability and appointments
- **Profile**: Update services, specializations, portfolio
- **Reports**: Performance analytics

### Barbershop Dashboard
- **Shop Overview**: Daily appointments, revenue, customers
- **Bookings Management**: Schedule for all staff
- **Staff Management**: Add/edit/remove barbers
- **Shop Profile**: Update shop info, hours, services
- **Reports**: Shop-wide analytics and performance

---

## Future Enhancements

### Potential Additions:
1. **OTP Verification Screen**: Actual SMS OTP verification
2. **Document Upload**: Business license, certifications
3. **Profile Setup Wizard**: Complete profile during registration
4. **Bank Account Setup**: For payment processing
5. **Service Configuration**: Set services and pricing during setup
6. **Photo Upload**: Profile and portfolio images
7. **Location Setup**: Map integration for service area (freelance) or shop location (barbershop)
8. **Email Verification**: Optional email for account recovery

### Backend Integration Requirements:
- SMS gateway for OTP (e.g., Twilio, AWS SNS)
- User authentication API
- Partner account creation endpoint
- Profile data storage
- Document/image upload service

---

## Marketing & Onboarding

### Registration Landing Page Ideas:
- Showcase partner success stories
- Display potential earnings
- Highlight platform benefits
- Show app interface screenshots
- Include testimonials from existing partners

### Onboarding Flow:
After registration, guide new partners through:
1. ✅ Complete profile setup
2. ✅ Add services and pricing
3. ✅ Set availability/operating hours
4. ✅ Upload portfolio images
5. ✅ Take platform tutorial
6. ✅ First booking walkthrough

---

## Support & Help

### Common Questions:

**Q: Can I change my account type later?**
A: Currently, no. Choose carefully during registration. (Could be enhanced in future)

**Q: What documents do I need?**
A: Currently just phone number. Business license verification may be added later.

**Q: How do I get paid?**
A: Payment setup will be added during profile completion.

**Q: Can I have multiple locations?**
A: Barbershop owners can manage one location currently. Multi-location support may be added.

**Q: What's the commission structure?**
A: Freelance barbers keep 88% of service fees + 100% of travel fees. (12% platform fee)

---

## Status

✅ **Current Implementation:**
- Phone-based registration
- Account type selection
- Basic profile setup
- Dashboard access

🚧 **Planned:**
- OTP verification
- Document upload
- Payment setup
- Enhanced onboarding

---

## Contact & Resources

For technical questions about the registration flow:
- Review code in `/apps/partner/app/`
- Check documentation in `/apps/partner/README.md`
- Test with mock credentials provided above
