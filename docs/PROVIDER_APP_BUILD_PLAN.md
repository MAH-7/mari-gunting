# Partner App Build Plan

**Date:** January 2025  
**Goal:** Build complete provider frontend before backend  
**Timeline:** 6-8 weeks  
**Approach:** Full-featured, production-ready

---

## 📋 **Your Decisions Summary**

✅ **Code Structure:** Option A (same project, new folder)  
✅ **Provider Type:** One app for both freelancers & shops  
✅ **Features:** Everything (complete feature set)  
✅ **Navigation:** 5-6 tabs (detailed)  
✅ **Design:** Same as customer (consistent branding)  
✅ **Components:** Shared folder (both apps use)  
✅ **Mock Data:** Connected to customer app data

---

## 🏗️ **Project Structure**

### New Folder Layout:
```
mari-gunting/
├── app/                        # Customer app (existing)
│   └── (tabs)/
│       ├── index.tsx
│       ├── bookings.tsx
│       ├── rewards.tsx
│       └── profile.tsx
│
├── app-provider/               # NEW Provider app
│   └── (tabs)/
│       ├── dashboard.tsx       # Home/stats
│       ├── jobs.tsx            # Incoming jobs
│       ├── schedule.tsx        # Calendar
│       ├── earnings.tsx        # Money/payouts
│       ├── customers.tsx       # Customer list
│       └── profile.tsx         # Settings
│
├── shared/                     # NEW Shared code
│   ├── components/             # Buttons, Modals, Cards
│   ├── types/                  # TypeScript types
│   ├── utils/                  # Helper functions
│   ├── services/               # API calls (shared)
│   └── constants/              # Colors, configs
│
├── components/                 # Customer-specific (keep)
├── services/                   # Move to shared/
├── types/                      # Move to shared/
├── utils/                      # Move to shared/
└── store/                      # Keep (state management)
```

---

## 📅 **8-Week Development Timeline**

### **Week 1: Setup & Architecture**
**Goal:** Set up project structure, shared folder, navigation

**Tasks:**
- [ ] Create `/app-provider` folder
- [ ] Create `/shared` folder structure
- [ ] Move common code to `/shared`
- [ ] Set up provider navigation (5-6 tabs)
- [ ] Create provider layout wrapper
- [ ] Set up provider routing
- [ ] Test navigation works

**Deliverable:** Provider app opens with empty tabs

---

### **Week 2: Dashboard & Core UI**
**Goal:** Build partner dashboard (main screen)

**Tasks:**
- [ ] Dashboard layout (stats cards)
- [ ] Today's earnings display
- [ ] Active jobs count
- [ ] Completed jobs count
- [ ] Quick actions (toggle availability, etc.)
- [ ] Welcome message
- [ ] Role-based view (freelancer vs shop)

**Screens:** 1 (Dashboard)

---

### **Week 3: Jobs Management (Part 1)**
**Goal:** Incoming jobs list and job details

**Tasks:**
- [ ] Jobs list screen (pending/active)
- [ ] Job card component (show job info)
- [ ] Filter by status (pending, accepted, in-progress)
- [ ] Job detail modal/screen
- [ ] Accept job button
- [ ] Reject job button
- [ ] Job status badges
- [ ] Empty state (no jobs)

**Screens:** 2 (Jobs List, Job Details)

---

### **Week 4: Jobs Management (Part 2)**
**Goal:** Job workflow (accept, start, complete)

**Tasks:**
- [ ] Start job flow
- [ ] Customer contact (call/message)
- [ ] Navigation to customer (maps)
- [ ] Mark as "On the way"
- [ ] Mark as "Arrived"
- [ ] Mark as "In progress"
- [ ] Complete job modal
- [ ] Job completion confirmation
- [ ] Customer signature/photo (optional)

**Screens:** 3-4 (Job workflow screens)

---

### **Week 5: Schedule & Availability**
**Goal:** Provider can manage their schedule

**Tasks:**
- [ ] Calendar view (monthly/weekly)
- [ ] Show scheduled jobs on calendar
- [ ] Availability toggle (online/offline)
- [ ] Set working hours
- [ ] Block dates (unavailable)
- [ ] Recurring availability (weekly schedule)
- [ ] Barbershop: Multiple barbers schedule
- [ ] Schedule overview

**Screens:** 2-3 (Calendar, Settings)

---

### **Week 6: Earnings & Payouts**
**Goal:** Financial tracking and payout requests

**Tasks:**
- [ ] Earnings summary (today, week, month)
- [ ] Earnings chart/graph
- [ ] Transaction history list
- [ ] Transaction details
- [ ] Payout balance display
- [ ] Request payout button
- [ ] Payout history
- [ ] Commission breakdown
- [ ] Tax information (if needed)

**Screens:** 3-4 (Earnings Dashboard, History, Payout)

---

### **Week 7: Customers & Profile**
**Goal:** Customer management and provider profile

**Tasks:**
- [ ] Customer list (who booked you)
- [ ] Customer details
- [ ] Booking history per customer
- [ ] Favorite customers
- [ ] Block customer (if needed)
- [ ] Provider profile screen
- [ ] Edit profile
- [ ] Portfolio photos (for barbers)
- [ ] Services offered management
- [ ] Pricing management
- [ ] Certifications/documents

**Screens:** 4-5 (Customers, Profile, Settings)

---

### **Week 8: Polish & Testing**
**Goal:** Final touches, testing, bug fixes

**Tasks:**
- [ ] Add all empty states
- [ ] Add all loading states
- [ ] Add all error messages
- [ ] Test all user flows
- [ ] Polish animations
- [ ] Add haptic feedback
- [ ] Fix any UI bugs
- [ ] Test on different screen sizes
- [ ] Create screenshots
- [ ] Write documentation

**Deliverable:** Production-ready provider frontend

---

## 🎨 **Design System (Shared)**

### Colors (Same as Customer)
```typescript
// shared/constants/colors.ts
export const COLORS = {
  primary: '#00B14F',        // Main green
  primaryDark: '#00A043',
  primaryLight: '#F0FDF4',
  
  secondary: '#1E293B',
  
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    disabled: '#9CA3AF',
    inverse: '#FFFFFF',
  },
  
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
  },
  
  border: {
    light: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#9CA3AF',
  }
};
```

### Typography
```typescript
// shared/constants/typography.ts
export const TYPOGRAPHY = {
  heading: {
    h1: { fontSize: 32, fontWeight: '700' },
    h2: { fontSize: 24, fontWeight: '700' },
    h3: { fontSize: 20, fontWeight: '600' },
  },
  body: {
    large: { fontSize: 16, fontWeight: '400' },
    regular: { fontSize: 14, fontWeight: '400' },
    small: { fontSize: 12, fontWeight: '400' },
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
  }
};
```

---

## 📱 **Partner App Screens (Complete List)**

### Tab 1: Dashboard (Home)
1. **Dashboard Home**
   - Today's earnings
   - Active jobs count
   - Completed jobs today
   - Quick actions (toggle availability)
   - Recent activity

### Tab 2: Jobs
2. **Jobs List** (Pending/Active/Completed)
   - Filter by status
   - Search jobs
   - Sort options

3. **Job Details**
   - Customer info
   - Service details
   - Location/address
   - Actions (accept, reject, start, complete)

4. **Job Actions**
   - Accept job confirmation
   - Reject job (with reason)
   - Start job
   - Complete job (with summary)

### Tab 3: Schedule
5. **Calendar View**
   - Monthly/weekly view
   - Jobs on calendar
   - Today's schedule

6. **Availability Settings**
   - Online/offline toggle
   - Working hours per day
   - Block dates

7. **Schedule Overview**
   - Upcoming jobs
   - Time slots

### Tab 4: Earnings
8. **Earnings Dashboard**
   - Summary (today, week, month)
   - Charts/graphs
   - Balance available

9. **Transaction History**
   - All transactions
   - Filter by date/type
   - Transaction details

10. **Payout**
    - Request payout
    - Payout history
    - Bank details

### Tab 5: Customers
11. **Customers List**
    - All customers who booked
    - Search customers
    - Sort by recent/frequent

12. **Customer Details**
    - Customer profile
    - Booking history
    - Notes

### Tab 6: Profile
13. **Profile Overview**
    - Provider info
    - Stats (rating, jobs completed)
    - Edit profile button

14. **Edit Profile**
    - Personal info
    - Photos/portfolio
    - Services & pricing
    - Certifications

15. **Settings**
    - Notifications
    - Payment info
    - Help & support
    - Logout

---

## 🔄 **Mock Data Strategy**

### Connect to Customer App Data

**How it works:**
```typescript
// Shared store (Zustand)
// Both apps read/write from same store

// Customer app creates booking:
useStore.getState().createBooking({
  customerId: '123',
  providerId: '456',  // ← Provider will see this
  status: 'pending',
  // ...
});

// Provider app reads same booking:
const pendingJobs = useStore((state) => 
  state.bookings.filter(b => 
    b.providerId === currentUser.id && 
    b.status === 'pending'
  )
);
```

### Mock Provider Users
```typescript
// Add to mockData.ts
export const mockProviders = [
  {
    id: 'provider1',
    name: 'Ahmad (Freelance Barber)',
    type: 'freelance',
    email: 'ahmad@example.com',
    phone: '+60123456789',
    avatar: 'https://...',
    rating: 4.8,
    completedJobs: 234,
    // ...
  },
  {
    id: 'provider2',
    name: 'Ali\'s Barbershop',
    type: 'shop',
    email: 'shop@example.com',
    phone: '+60198765432',
    avatar: 'https://...',
    rating: 4.9,
    completedJobs: 1205,
    // ...
  }
];
```

---

## 🧩 **Shared Components to Create**

### Week 1: Create these in `/shared/components/`

1. **Button.tsx**
   - Primary button
   - Secondary button
   - Outline button
   - Loading state
   - Disabled state

2. **Card.tsx**
   - Base card component
   - With shadow/elevation
   - Customizable padding

3. **Modal.tsx**
   - Bottom sheet modal
   - Full screen modal
   - Confirmation modal

4. **StatusBadge.tsx**
   - Booking status badges
   - Color-coded by status
   - Different sizes

5. **Avatar.tsx**
   - User avatar
   - Placeholder if no image
   - Different sizes

6. **EmptyState.tsx**
   - Reusable empty state
   - Icon, message, action button

7. **LoadingSpinner.tsx**
   - Consistent loading UI
   - Different sizes

8. **Input.tsx**
   - Text input
   - With label
   - With error message

---

## 🎯 **Key Features by Provider Type**

### Freelance Barber Features:
- ✅ See incoming job requests
- ✅ Accept/reject jobs
- ✅ Navigate to customer location
- ✅ Mark job progress (on the way, arrived, in progress, done)
- ✅ Track earnings
- ✅ Set availability (online/offline)
- ✅ Manage schedule
- ✅ View customer history
- ✅ Update services & pricing

### Barbershop Owner Features:
- ✅ All above +
- ✅ Manage multiple barbers/staff
- ✅ Assign jobs to specific barbers
- ✅ View shop-level analytics
- ✅ Manage shop schedule
- ✅ Set per-barber availability
- ✅ Track shop performance
- ✅ Bulk job management

---

## ✅ **Completion Checklist**

### By End of Week 8:

**Core Functionality:**
- [ ] Provider can see incoming jobs
- [ ] Provider can accept/reject jobs
- [ ] Provider can start/complete jobs
- [ ] Provider can see earnings
- [ ] Provider can manage schedule
- [ ] Provider can update profile
- [ ] Provider can see customer list

**UI/UX:**
- [ ] All screens designed
- [ ] All navigation works
- [ ] All empty states added
- [ ] All loading states added
- [ ] All error messages added
- [ ] Animations smooth
- [ ] Consistent design with customer app

**Technical:**
- [ ] Shared components working
- [ ] Mock data connected
- [ ] TypeScript types defined
- [ ] No crashes or errors
- [ ] Works on iOS
- [ ] Works on Android (if needed)

**Documentation:**
- [ ] Screen descriptions written
- [ ] Component documentation
- [ ] Mock data documented
- [ ] Navigation flow documented

---

## 🚀 **Next Steps**

### Immediate (This Week):
1. I'll create the folder structure
2. Set up shared components folder
3. Create provider navigation
4. Start dashboard screen

### Question for You:

**Should I start building now?** Or do you want to:
- Review the plan first?
- Make any changes?
- Add/remove features?

Let me know and I'll begin! 😊

---

## 📝 **Notes**

- **Timeline:** 6-8 weeks (ambitious but doable)
- **Full-time equivalent:** ~40-50 hours/week
- **Part-time:** 10-15 hours/week = 12-16 weeks
- **Backend:** Start after all frontend complete
- **Testing:** Test as you build, not all at end

**Ready to start?** 🚀
