# 📋 Week 7 Quick Reference Card

**Keep this open while coding!**

---

## 🎯 What Am I Building?

**Week 7 Focus:** Customer Management + Provider Profile

---

## 📱 Screens Checklist

### Tab 5: Customers
- [ ] `apps/partner/app/(tabs)/customers.tsx` - List screen
- [ ] `apps/partner/app/customer/[id].tsx` - Details screen

### Tab 6: Profile
- [ ] `apps/partner/app/(tabs)/profile.tsx` - View (update existing)
- [ ] `apps/partner/app/profile/edit.tsx` - Edit form
- [ ] `apps/partner/app/profile/portfolio.tsx` - Portfolio photos
- [ ] `apps/partner/app/profile/services.tsx` - Services pricing

---

## 🧩 Components Checklist

- [ ] `apps/partner/components/CustomerCard.tsx`
- [ ] `apps/partner/components/PortfolioGrid.tsx`
- [ ] `apps/partner/components/ServiceEditor.tsx`
- [ ] `apps/customer/components/PhotoGallery.tsx` (critical fix)

---

## 🔧 Utilities Checklist

- [ ] `shared/utils/phone.ts` - Phone formatting

---

## 📊 Mock Data to Add

Add to `shared/services/mockData.ts`:

```typescript
// 1. Customer list (10-15 customers)
export const mockCustomers: Customer[];

// 2. Provider profile
export const mockProviderProfile: ProviderProfile;
```

---

## 🎨 Design System (Consistent with Weeks 1-6)

```typescript
const COLORS = {
  primary: '#00B14F',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
};

const SPACING = {
  cardPadding: 16,
  borderRadius: 12,
  iconSize: 20,
  buttonHeight: 48,
};
```

---

## ⚡ Common Code Patterns

### Search & Filter
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'recent'>('all');

const filteredData = data.filter(item =>
  item.name.toLowerCase().includes(searchQuery.toLowerCase())
);
```

### Image Upload
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
    // Handle image
  }
};
```

### Phone Actions
```typescript
import { Linking } from 'react-native';

const callCustomer = (phone: string) => {
  Linking.openURL(`tel:${phone}`);
};

const openWhatsApp = (phone: string) => {
  Linking.openURL(`whatsapp://send?phone=${phone}`);
};
```

---

## ✅ Daily Checklist

### Day 1: Customer List
- [ ] Screen layout
- [ ] Search bar
- [ ] Filter tabs
- [ ] Customer cards
- [ ] Empty state

### Day 2: Customer Details
- [ ] Header with avatar
- [ ] Contact section
- [ ] Booking stats
- [ ] Booking history
- [ ] Notes section
- [ ] Favorite toggle

### Day 3: Profile View
- [ ] Profile header
- [ ] Stats cards
- [ ] Bio section
- [ ] Portfolio preview
- [ ] Services preview
- [ ] Edit button

### Day 4: Profile Edit
- [ ] Form fields
- [ ] Photo upload
- [ ] Validation
- [ ] Save/cancel
- [ ] Loading states

### Day 5: Portfolio & Services
- [ ] Portfolio grid
- [ ] Photo CRUD
- [ ] Services list
- [ ] Service editor
- [ ] Service CRUD

### Day 6: Critical Fixes
- [ ] Phone utils
- [ ] Update phone displays
- [ ] Photo gallery component
- [ ] Test everything

### Day 7: Polish
- [ ] Test all features
- [ ] Add missing states
- [ ] Fix bugs
- [ ] Update docs
- [ ] Git commit

---

## 🚨 Common Pitfalls to Avoid

1. **Don't** create new design patterns - use existing ones
2. **Don't** forget loading states
3. **Don't** forget empty states
4. **Don't** skip TypeScript types
5. **Do** test on both iOS and Android
6. **Do** commit frequently
7. **Do** update progress tracker daily

---

## 🆘 If You Get Stuck

1. Check the detailed spec: `apps/partner/WEEK_7_IMPLEMENTATION.md`
2. Look at similar screens from Weeks 5-6
3. Check existing components for patterns
4. Review the acceptance criteria

---

## 📍 File Locations Quick Reference

```
apps/partner/
├── app/
│   ├── (tabs)/
│   │   ├── customers.tsx      ← NEW
│   │   └── profile.tsx        ← UPDATE
│   ├── customer/
│   │   └── [id].tsx           ← NEW
│   └── profile/
│       ├── edit.tsx           ← NEW
│       ├── portfolio.tsx      ← NEW
│       └── services.tsx       ← NEW
└── components/
    ├── CustomerCard.tsx       ← NEW
    ├── PortfolioGrid.tsx      ← NEW
    └── ServiceEditor.tsx      ← NEW

apps/customer/
└── components/
    └── PhotoGallery.tsx       ← NEW

shared/
└── utils/
    └── phone.ts               ← NEW
```

---

## 🎯 Success Criteria

By end of Week 7:
- ✅ All 5 screens working
- ✅ All 4 components created
- ✅ Phone formatting consistent
- ✅ Photo gallery in customer app
- ✅ All acceptance criteria met
- ✅ 0 TypeScript errors
- ✅ 0 console warnings

---

## 📚 Full Documentation

- **Detailed Specs:** `apps/partner/WEEK_7_IMPLEMENTATION.md`
- **Quick Start:** `WEEK_7_START.md`
- **Progress Tracker:** `WEEK_7_PROGRESS.md`

---

**Remember:** You're 75% done! Just one more major week after this! 💪

---

**Last Updated:** January 2025
