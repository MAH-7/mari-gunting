# 🚀 Week 7 Quick Start Guide

**Status:** Ready to Begin  
**Timeline:** 7 Days  
**Completion Target:** 87.5% (7 of 8 weeks)

---

## 📝 **What You'll Build This Week**

### **Main Features:**
1. **Customers Tab** - Manage customers who have booked services
2. **Profile Editing** - Edit provider profile, portfolio, and services
3. **Critical Fixes** - Photo viewing in customer app + phone formatting

### **Key Screens:**
- Customers list with search/filter (Tab 5)
- Customer details with booking history
- Profile edit form
- Portfolio management (photo upload/delete)
- Services & pricing management

---

## 🎯 **Day-by-Day Breakdown**

### **Days 1-2: Customer Management** ⭐ START HERE
**Goal:** Build customer list and details screens

**To-Do:**
```bash
# 1. Create customers tab screen
touch apps/partner/app/(tabs)/customers.tsx

# 2. Create customer details screen
mkdir -p apps/partner/app/customer
touch apps/partner/app/customer/[id].tsx

# 3. Create customer card component
touch apps/partner/components/CustomerCard.tsx
```

**Features to Implement:**
- [ ] Search customers by name/phone
- [ ] Filter tabs (All, Favorites, Recent)
- [ ] Customer card with avatar, stats
- [ ] Customer details with contact info
- [ ] Booking history per customer
- [ ] Private notes feature
- [ ] Favorite toggle

---

### **Days 3-4: Profile Management**
**Goal:** Build profile editing capabilities

**To-Do:**
```bash
# 1. Update profile tab
# Edit: apps/partner/app/(tabs)/profile.tsx

# 2. Create profile edit screen
mkdir -p apps/partner/app/profile
touch apps/partner/app/profile/edit.tsx
```

**Features to Implement:**
- [ ] View profile screen with stats
- [ ] Edit profile form
- [ ] Photo upload (avatar)
- [ ] Bio/about editing
- [ ] Location/service area
- [ ] Form validation
- [ ] Save/cancel logic

---

### **Day 5: Portfolio & Services**
**Goal:** Manage portfolio photos and service pricing

**To-Do:**
```bash
# 1. Portfolio screen
touch apps/partner/app/profile/portfolio.tsx

# 2. Services screen
touch apps/partner/app/profile/services.tsx

# 3. Components
touch apps/partner/components/PortfolioGrid.tsx
touch apps/partner/components/ServiceEditor.tsx
```

**Features to Implement:**
- [ ] Portfolio photo grid
- [ ] Add/delete photos (max 20)
- [ ] Services list with prices
- [ ] Add/edit/delete services
- [ ] Service categories

---

### **Day 6: Critical Fixes**
**Goal:** Fix gaps from previous weeks

**To-Do:**
```bash
# 1. Phone utilities
mkdir -p shared/utils
touch shared/utils/phone.ts

# 2. Photo gallery for customer app
touch apps/customer/components/PhotoGallery.tsx
```

**Features to Implement:**
- [ ] Phone formatting utility functions
- [ ] Update all phone displays
- [ ] Photo gallery in customer booking details
- [ ] Image viewer with zoom

---

### **Day 7: Testing & Polish**
**Goal:** Test everything and fix bugs

**Checklist:**
- [ ] Test all customer features
- [ ] Test all profile features  
- [ ] Test phone formatting everywhere
- [ ] Test photo viewing in customer app
- [ ] Add loading states
- [ ] Add empty states
- [ ] Fix any bugs
- [ ] Update documentation

---

## 🎨 **Design Reference**

### **Color Scheme (Consistent with Week 1-6):**
```typescript
const COLORS = {
  primary: '#00B14F',      // Green
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  text: {
    primary: '#111827',
    secondary: '#6B7280',
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
  }
};
```

### **Common Patterns:**
- Section headers: 16px bold
- Card padding: 16px
- Border radius: 12px
- Icon size: 20px
- Button height: 48px

---

## 📊 **Mock Data to Add**

You'll need to add these to `shared/services/mockData.ts`:

```typescript
// 1. Customer data
export const mockCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Rina Susanti',
    phone: '+62 812-3456-7890',
    totalBookings: 5,
    lastVisit: new Date('2025-01-05'),
    isFavorite: true,
    notes: 'Prefers short fade'
  },
  // Add 10-15 more customers
];

// 2. Provider profile
export const mockProviderProfile = {
  id: 'barber-1',
  name: 'Budi Santoso',
  rating: 4.8,
  totalJobs: 248,
  bio: 'Professional barber...',
  portfolioPhotos: [...],
  services: [...]
};
```

---

## 🔧 **Technical Notes**

### **State Management:**
Use Zustand store (already set up):
```typescript
// Add to apps/partner/store/usePartnerStore.ts
interface PartnerState {
  // Existing state...
  
  // New for Week 7:
  customers: Customer[];
  providerProfile: ProviderProfile;
  
  // Actions:
  toggleFavoriteCustomer: (customerId: string) => void;
  updateCustomerNotes: (customerId: string, notes: string) => void;
  updateProfile: (profile: Partial<ProviderProfile>) => void;
  addPortfolioPhoto: (photo: Photo) => void;
  deletePortfolioPhoto: (photoId: string) => void;
  addService: (service: Service) => void;
  updateService: (serviceId: string, data: Partial<Service>) => void;
  deleteService: (serviceId: string) => void;
}
```

### **Navigation:**
Already set up in `apps/partner/app/_layout.tsx`. Just add screens to existing structure.

### **Image Upload:**
Use Expo's ImagePicker:
```typescript
import * as ImagePicker from 'expo-image-picker';

const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  
  if (!result.canceled) {
    // Handle image upload
  }
};
```

---

## ✅ **Success Metrics**

By end of Week 7, you should have:
- [ ] 5 new screens working
- [ ] 3 new components created
- [ ] Customer management fully functional
- [ ] Profile editing complete
- [ ] Portfolio management working
- [ ] Service pricing editable
- [ ] Photo gallery in customer app
- [ ] Phone formatting consistent everywhere

---

## 📚 **Reference Documents**

**Detailed Specs:**
- Full plan: `apps/partner/WEEK_7_IMPLEMENTATION.md`
- Previous weeks: `apps/partner/WEEK_5_IMPLEMENTATION.md`, `WEEK_6_IMPLEMENTATION.md`

**Related Docs:**
- Project status: `PROJECT_STATUS_WEEKS_1-6.md`
- Architecture: `docs/ARCHITECTURE_DECISION_SEPARATE_APPS.md`
- Review: `docs/WEEKS_1_5_REVIEW.md`

---

## 🚀 **Let's Begin!**

**First Step:** Start with Day 1-2 (Customer Management)

```bash
# Navigate to project
cd /Users/bos/Desktop/ProjectSideIncome/mari-gunting

# Start development server
npm start

# Open implementation doc
code apps/partner/WEEK_7_IMPLEMENTATION.md

# Create first screen
code apps/partner/app/(tabs)/customers.tsx
```

---

**Remember:**
- Follow existing design patterns from Weeks 1-6
- Use shared components where possible
- Test on both iOS and Android
- Keep code clean and documented
- Commit frequently

**You've got this! 💪**

---

**Last Updated:** January 2025  
**Next:** Begin Day 1 - Customer List Screen
