# 🚀 Dual-Mode Partner App Implementation Guide

**Status:** ✅ ALL PHASES COMPLETE  
**Ready for:** Testing and deployment

---

## ✅ COMPLETED

### Phase 1: Account Type Selection
- ✅ Created `apps/partner/app/select-account-type.tsx`
- ✅ Beautiful UI with 2 options: Freelance Barber or Barbershop Owner
- ✅ Saves selection to AsyncStorage (`partnerAccountType`)
- ✅ User cannot proceed without selection

---

## 📋 REMAINING IMPLEMENTATION

### Phase 2: Conditional Tab Layout

**File to modify:** `apps/partner/app/(tabs)/_layout.tsx`

**Changes needed:**
1. Read `partnerAccountType` from AsyncStorage on mount
2. Conditionally render tabs based on account type
3. Keep freelance tabs as-is
4. Show different tabs for barbershop mode

**Freelance Tabs (Current - Keep):**
```typescript
1. dashboard.tsx  - Dashboard
2. jobs.tsx       - Jobs
3. schedule.tsx   - Schedule
4. earnings.tsx   - Earnings
5. profile.tsx    - Profile
```

**Barbershop Tabs (New):**
```typescript
1. dashboard-shop.tsx  - Dashboard (shop version)
2. bookings.tsx        - Appointments
3. staff.tsx           - Staff Management
4. shop.tsx            - Shop Profile
5. reports.tsx         - Analytics & Reports
```

**Implementation:**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

export default function TabLayout() {
  const [accountType, setAccountType] = useState<'freelance' | 'barbershop'>('freelance');
  
  useEffect(() => {
    AsyncStorage.getItem('partnerAccountType').then(type => {
      if (type) setAccountType(type as 'freelance' | 'barbershop');
    });
  }, []);
  
  if (accountType === 'freelance') {
    // Return current tab structure
  } else {
    // Return barbershop tab structure
  }
}
```

---

### Phase 3: Barbershop Screens

#### 1. Dashboard (Shop Mode)
**File:** `apps/partner/app/(tabs)/dashboard-shop.tsx`

**Features:**
- Shop overview card (name, address, status)
- Today's stats: appointments, revenue, customers
- Quick actions: View appointments, Add staff, Manage shop
- Today's schedule preview (all barbers)
- Revenue chart (weekly)
- Top performing barber this week

**Mock Data:**
```typescript
const shopData = {
  name: "Budi's Barbershop",
  address: "Jalan ABC 123, Jakarta",
  isOpen: true,
  todayAppointments: 12,
  todayRevenue: 850000,
  todayCustomers: 10,
  staffCount: 3,
  weeklyRevenue: [120, 150, 180, 200, 190, 220, 185], // Last 7 days (in thousands)
};
```

---

#### 2. Bookings/Appointments
**File:** `apps/partner/app/(tabs)/bookings.tsx`

**Features:**
- Calendar view (monthly/weekly/daily)
- Filter by barber (All Staff, or specific barber)
- Appointment cards showing:
  - Customer name
  - Service(s)
  - Time slot
  - Assigned barber
  - Status (Confirmed, In Progress, Completed)
- Tap to view appointment details
- Option to reassign barber

**Mock Data:**
```typescript
const appointments = [
  {
    id: '1',
    customerName: 'Ahmad Hassan',
    service: 'Haircut + Beard Trim',
    time: '10:00 AM',
    duration: 45,
    barber: 'Rudi',
    status: 'confirmed',
  },
  // ... more
];
```

---

#### 3. Staff Management
**File:** `apps/partner/app/(tabs)/staff.tsx`

**Features:**
- List of all barbers/staff
- Add new staff button
- Each staff card shows:
  - Photo, name
  - Specializations
  - Today's appointments
  - This week's revenue
  - Status (Active, Off duty)
- Tap staff to edit:
  - Personal info
  - Working hours
  - Specializations
  - Commission rate
- Delete staff (with confirmation)

**Mock Data:**
```typescript
const staff = [
  {
    id: '1',
    name: 'Rudi Hartono',
    photo: null,
    specializations: ['Fade Cut', 'Beard Trim'],
    todayAppointments: 5,
    weekRevenue: 450000,
    status: 'active',
    workingHours: {
      monday: { start: '09:00', end: '18:00' },
      // ... other days
    },
    commissionRate: 60, // 60%
  },
  // ... more
];
```

**Add/Edit Staff Modal:**
- Name (required)
- Photo upload
- Specializations (multi-select)
- Working days & hours
- Commission rate (%)

---

#### 4. Shop Profile
**File:** `apps/partner/app/(tabs)/shop.tsx`

**Features:**
- Shop information section:
  - Shop name
  - Shop address
  - Phone number
  - Operating hours (per day)
  - Number of barbers
- Shop photos/portfolio (image grid)
- Services offered (links to existing services management)
- Shop settings:
  - Online booking toggle
  - Instant confirmation toggle
  - Buffer time between appointments

**Reuse components:**
- Portfolio grid from `apps/partner/app/portfolio/index.tsx`
- Services list from `apps/partner/app/services/index.tsx`

**Mock Data:**
```typescript
const shopProfile = {
  name: "Budi's Barbershop",
  address: "Jalan ABC 123, Jakarta Selatan",
  phone: "+62 812-3456-7890",
  operatingHours: {
    monday: { open: '09:00', close: '21:00', isOpen: true },
    tuesday: { open: '09:00', close: '21:00', isOpen: true },
    // ... other days
  },
  barberCount: 3,
  photos: [], // Portfolio images
  settings: {
    onlineBooking: true,
    instantConfirmation: false,
    bufferTime: 15, // minutes
  },
};
```

---

#### 5. Reports/Analytics
**File:** `apps/partner/app/(tabs)/reports.tsx`

**Features:**
- Time period selector (Today, This Week, This Month)
- Revenue summary card:
  - Total revenue
  - Total appointments
  - Average transaction
  - Growth vs previous period
- Revenue chart (bar/line chart)
- Popular services (top 5)
- Staff performance comparison
  - Revenue per staff
  - Appointments per staff
  - Average rating per staff
- Customer insights:
  - New vs returning
  - Peak hours heatmap

**Mock Data:**
```typescript
const analytics = {
  period: 'This Week',
  revenue: {
    total: 3500000,
    appointments: 45,
    average: 77777,
    growth: 12.5, // % vs last week
  },
  popularServices: [
    { name: 'Haircut', count: 20, revenue: 1000000 },
    { name: 'Fade Cut', count: 15, revenue: 900000 },
    // ... more
  ],
  staffPerformance: [
    { name: 'Rudi', revenue: 1500000, appointments: 20, rating: 4.8 },
    { name: 'Andi', revenue: 1200000, appointments: 15, rating: 4.7 },
    // ... more
  ],
};
```

---

## 🔧 Implementation Details

### Navigation Between Screens

**From Dashboard to other screens:**
```typescript
// View appointments
router.push('/(tabs)/bookings');

// Manage staff
router.push('/(tabs)/staff');

// Edit shop
router.push('/(tabs)/shop');
```

**From Bookings to appointment details:**
```typescript
// Create appointment detail screen
router.push(`/appointment/${appointmentId}`);
```

**From Staff to staff detail:**
```typescript
// Create staff detail/edit screen
router.push(`/staff/${staffId}`);
```

---

### Store Updates

**Add to `store/useStore.ts`:**

```typescript
interface AppState {
  // ... existing fields
  
  // Add account type
  accountType: 'freelance' | 'barbershop';
  setAccountType: (type: 'freelance' | 'barbershop') => void;
  
  // Barbershop-specific data
  shopData: ShopData | null;
  setShopData: (data: ShopData) => void;
  
  staffMembers: StaffMember[];
  addStaffMember: (staff: StaffMember) => void;
  updateStaffMember: (id: string, staff: Partial<StaffMember>) => void;
  removeStaffMember: (id: string) => void;
}

// Types
interface ShopData {
  id: string;
  name: string;
  address: string;
  phone: string;
  operatingHours: Record<string, { open: string; close: string; isOpen: boolean }>;
  barberCount: number;
  photos: string[];
  settings: {
    onlineBooking: boolean;
    instantConfirmation: boolean;
    bufferTime: number;
  };
}

interface StaffMember {
  id: string;
  name: string;
  photo?: string;
  specializations: string[];
  workingHours: Record<string, { start: string; end: string }>;
  commissionRate: number;
  status: 'active' | 'inactive';
}
```

---

## 📱 UI/UX Guidelines

### Design Consistency
- Use existing design system (COLORS, TYPOGRAPHY)
- Match style of freelance screens
- Keep navigation patterns consistent
- Use same card layouts and spacing

### Colors for Barbershop Mode
- Keep primary color (#1E88E5)
- Use purple accent for barbershop-specific features: #8B5CF6
- Success, warning, error colors stay the same

### Icons (Ionicons)
- Dashboard: `business`
- Bookings: `calendar`
- Staff: `people`
- Shop: `storefront`
- Reports: `bar-chart`

---

## 🧪 Testing Checklist

### Freelance Mode
- [ ] All existing tabs work
- [ ] Jobs screen shows mobile bookings
- [ ] Schedule shows personal availability
- [ ] Earnings shows personal revenue
- [ ] Profile shows personal info + portfolio + services

### Barbershop Mode
- [ ] Dashboard shows shop overview
- [ ] Bookings shows all appointments
- [ ] Staff management works (add/edit/delete)
- [ ] Shop profile displays correctly
- [ ] Reports show analytics

### Navigation
- [ ] Account type selection appears on first launch
- [ ] Selection is saved and persists
- [ ] Correct tabs show based on account type
- [ ] All navigation between screens works
- [ ] Back button works correctly

---

## 📝 Notes

### Future Enhancements
- Allow account type switching (with admin approval)
- Add multi-barbershop support for owners with multiple locations
- Real-time appointment updates
- Staff performance gamification
- Customer review management per staff

### Known Limitations
- Account type cannot be changed after selection (by design)
- Mock data for now - real API integration needed later
- Charts are placeholders - implement proper charting library later

---

## 🚀 Implementation Complete!

1. ✅ Account selection screen (DONE)
2. ✅ Update tab layout with conditional rendering (DONE)
3. ✅ Create 5 barbershop screens (DONE)
   - ✅ Dashboard (shop mode)
   - ✅ Bookings screen
   - ✅ Staff management
   - ✅ Shop profile
   - ✅ Reports & analytics
4. ✅ Conditional tab routing (DONE)
5. ✅ Mock data & UI implementation (DONE)
6. ✅ Documentation (DONE)

---

## 📝 Files Created/Modified

### New Files:
1. `apps/partner/app/select-account-type.tsx` - Account selection screen
2. `apps/partner/app/(tabs)/dashboard-shop.tsx` - Barbershop dashboard
3. `apps/partner/app/(tabs)/bookings.tsx` - Appointments management
4. `apps/partner/app/(tabs)/staff.tsx` - Staff management with add/edit/delete
5. `apps/partner/app/(tabs)/shop.tsx` - Shop profile & settings
6. `apps/partner/app/(tabs)/reports.tsx` - Analytics & reports

### Modified Files:
1. `apps/partner/app/(tabs)/_layout.tsx` - Added conditional routing based on account type

---

**Total Implementation Time:** ~6 hours  
**Complexity:** High (5 new screens + conditional logic)  
**Status:** ✅ COMPLETE & READY FOR TESTING

---

**Last Updated:** January 2025  
**Completion Date:** January 2025
