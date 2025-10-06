# Mari Gunting - Provider App

**Status:** In Development  
**Started:** January 2025

---

## 📱 **Overview**

The provider app is for barbers (freelance) and barbershop owners to manage their business on the Mari Gunting platform.

---

## 🗂️ **Structure**

```
app-provider/
├── _layout.tsx              # Root layout
└── (tabs)/                  # Main navigation
    ├── _layout.tsx          # Tab navigation
    ├── dashboard.tsx        # Dashboard (home)
    ├── jobs.tsx             # Jobs management
    ├── schedule.tsx         # Schedule & availability
    ├── earnings.tsx         # Earnings & payouts
    ├── customers.tsx        # Customer management
    └── profile.tsx          # Profile & settings
```

---

## 🎨 **Design System**

Uses shared design system from `/shared/constants`:
- **Colors:** `COLORS` from `@/shared/constants`
- **Typography:** `TYPOGRAPHY` from `@/shared/constants`
- **Spacing:** `SPACING` from `@/shared/constants`
- **Border Radius:** `RADIUS` from `@/shared/constants`

---

## 📋 **Features**

### Tab 1: Dashboard
- Today's earnings
- Active jobs count
- Quick actions (toggle availability)
- Recent activity

### Tab 2: Jobs
- Incoming job requests
- Accept/reject jobs
- Job details
- Mark progress (on the way, arrived, in progress, completed)

### Tab 3: Schedule
- Calendar view
- Availability settings
- Block dates
- Working hours

### Tab 4: Earnings
- Earnings summary
- Transaction history
- Payout requests
- Commission breakdown

### Tab 5: Customers
- Customer list
- Booking history per customer
- Customer details

### Tab 6: Profile
- Provider profile
- Edit profile
- Services & pricing
- Settings & logout

---

## 🚀 **Development Status**

### Week 1: Setup ✅
- [x] Folder structure
- [x] Navigation (6 tabs)
- [x] Placeholder screens
- [x] Shared constants

### Week 2: Dashboard (In Progress)
- [ ] Dashboard layout
- [ ] Stats cards
- [ ] Quick actions
- [ ] Recent activity

### Week 3-8: Feature Development
- See `/docs/PROVIDER_APP_BUILD_PLAN.md` for full timeline

---

## 🧪 **Testing**

To test the provider app:

1. Update current user role to 'barber' in the store
2. Navigate to provider routes
3. Test navigation between tabs

---

## 📝 **Notes**

- Uses same design as customer app (consistent branding)
- Shares components with customer app (`/shared`)
- Mock data connected to customer app data
- Ready for backend integration

---

**Next:** Build Dashboard screen (Week 2)
