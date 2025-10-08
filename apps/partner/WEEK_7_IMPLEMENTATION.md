# 🚀 Week 7: Customers & Profile Management

**Start Date:** January 2025  
**Status:** 🔄 IN PROGRESS  
**Focus:** Customer Management & Provider Profile Features

---

## 📋 **Overview**

Week 7 completes the Partner App by adding:
1. **Customer Management System** - View and manage customers who have booked services
2. **Provider Profile Management** - Edit profile, manage portfolio, services & pricing
3. **Critical Gap Fixes** - Photo viewing in customer app, phone formatting

This is the second-to-last week before final polish in Week 8.

---

## 🎯 **Goals & Deliverables**

### **Primary Goals:**
- ✅ Complete customer management features
- ✅ Full profile editing capabilities
- ✅ Portfolio and pricing management
- ✅ Fix critical gaps from Weeks 1-6

### **Screens to Build:**
1. Customers List Screen (Tab 5)
2. Customer Details Screen
3. Profile Edit Screen
4. Portfolio Management Screen
5. Services & Pricing Management Screen

### **Components to Build:**
- Customer card component
- Portfolio image grid
- Service editor modal
- Price input component
- Photo gallery viewer (for customer app)

---

## 📱 **Tab 5: Customers (Detailed Spec)**

### **5.1 Customers List Screen**

**Location:** `apps/partner/app/(tabs)/customers.tsx`

#### **UI Layout:**
```
┌─────────────────────────────────┐
│ 👥 Customers       [Search 🔍]  │
├─────────────────────────────────┤
│ Filters: All | Favorites | Recent│
├─────────────────────────────────┤
│ Stats Bar:                      │
│ 156 Total | 23 Favorites        │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 👤 Rina Susanti             │ │
│ │ 📱 +62 812-3456-7890        │ │
│ │ 📅 Last visit: 5 Jan 2025   │ │
│ │ ⭐ 5 bookings | ⭐ Favorite │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 👤 Ahmad Hidayat            │ │
│ │ 📱 +62 813-9876-5432        │ │
│ │ 📅 Last visit: 3 Jan 2025   │ │
│ │ 📊 3 bookings               │ │
│ └─────────────────────────────┘ │
│ ...more customers...            │
└─────────────────────────────────┘
```

#### **Features:**
- ✅ Search customers by name/phone
- ✅ Filter tabs: All | Favorites | Recent
- ✅ Sort options: Recent, Most bookings, Name A-Z
- ✅ Customer stats (total count, favorites)
- ✅ Pull to refresh
- ✅ Empty state when no customers

#### **Customer Card:**
```typescript
interface CustomerCardProps {
  customer: {
    id: string;
    name: string;
    phone: string;
    avatar?: string;
    lastVisit: Date;
    totalBookings: number;
    isFavorite: boolean;
  };
  onPress: () => void;
}
```

#### **State Management:**
```typescript
// Search & filter state
const [searchQuery, setSearchQuery] = useState('');
const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'recent'>('all');
const [sortBy, setSortBy] = useState<'recent' | 'bookings' | 'name'>('recent');

// Customers data
const customers = usePartnerStore(state => 
  state.customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  )
);
```

---

### **5.2 Customer Details Screen**

**Location:** `apps/partner/app/customer/[id].tsx`

#### **UI Layout:**
```
┌─────────────────────────────────┐
│ ← Back                    [...] │
├─────────────────────────────────┤
│        👤 [Avatar]              │
│     Rina Susanti                │
│   ⭐ Remove from Favorites      │
├─────────────────────────────────┤
│ Contact Information             │
│ ┌─────────────────────────────┐ │
│ │ 📱 +62 812-3456-7890        │ │
│ │    [Call] [WhatsApp]        │ │
│ │ 📧 rina@email.com (if any)  │ │
│ │ 📍 Jl. Sudirman No. 45      │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Booking Statistics              │
│ ┌─────────────────────────────┐ │
│ │ Total Bookings: 5           │ │
│ │ Completed: 4 | Cancelled: 1 │ │
│ │ Total Spent: Rp 375,000     │ │
│ │ Member since: Oct 2024      │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Booking History                 │
│ ┌─────────────────────────────┐ │
│ │ ✅ Haircut + Shave          │ │
│ │ 5 Jan 2025 • Rp 75,000      │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ ✅ Premium Haircut          │ │
│ │ 20 Dec 2024 • Rp 100,000    │ │
│ └─────────────────────────────┘ │
│ ...more history...              │
├─────────────────────────────────┤
│ Notes (Private)                 │
│ ┌─────────────────────────────┐ │
│ │ Customer prefers short fade │ │
│ │ [Edit Notes]                │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

#### **Features:**
- ✅ Customer profile header with avatar
- ✅ Toggle favorite status
- ✅ Contact actions (call, WhatsApp)
- ✅ Booking statistics summary
- ✅ Full booking history with this customer
- ✅ Private notes (visible only to provider)
- ✅ Block customer option (optional)

#### **Actions Menu (...):**
- Add to favorites / Remove from favorites
- Edit notes
- Block customer (with confirmation)
- View on map (if address available)

---

## 👤 **Tab 6: Profile (Detailed Spec)**

### **6.1 Profile View Screen**

**Location:** `apps/partner/app/(tabs)/profile.tsx`

#### **UI Layout:**
```
┌─────────────────────────────────┐
│        👤 [Avatar]              │
│     Budi Santoso                │
│   ⭐⭐⭐⭐⭐ 4.8 (156 reviews)   │
│      [Edit Profile]             │
├─────────────────────────────────┤
│ Quick Stats                     │
│ ┌───────┬────────┬─────────┐   │
│ │ 248   │ 4.8    │ 95%     │   │
│ │ Jobs  │ Rating │ Accept  │   │
│ └───────┴────────┴─────────┘   │
├─────────────────────────────────┤
│ About                           │
│ Professional barber with 5+     │
│ years experience. Specialist    │
│ in modern cuts and styling.     │
├─────────────────────────────────┤
│ Portfolio (8 photos)            │
│ ┌───┬───┬───┬───┐              │
│ │📷│📷│📷│📷│ [Manage]         │
│ └───┴───┴───┴───┘              │
├─────────────────────────────────┤
│ Services Offered (5)            │
│ ✂️ Haircut - Rp 50,000          │
│ 🪒 Shave - Rp 25,000            │
│ 💇 Hair Wash - Rp 15,000        │
│             [Manage Services]   │
├─────────────────────────────────┤
│ Business Information            │
│ 📱 +62 812-3456-7890            │
│ 🏢 Freelance Barber             │
│ 📍 Jakarta Selatan              │
│ 🕒 Mon-Sat: 08:00 - 20:00      │
├─────────────────────────────────┤
│ Account Settings                │
│ 🔔 Notifications                │
│ 🌙 Dark Mode                    │
│ 🌐 Language: Bahasa Indonesia   │
│ 📄 Terms & Privacy              │
│ 🚪 Logout                       │
└─────────────────────────────────┘
```

#### **Features:**
- ✅ Profile photo with edit button
- ✅ Name and rating display
- ✅ Quick statistics cards
- ✅ About/bio section
- ✅ Portfolio preview with manage button
- ✅ Services list with prices
- ✅ Business information display
- ✅ Settings options
- ✅ Logout button

---

### **6.2 Edit Profile Screen**

**Location:** `apps/partner/app/profile/edit.tsx`

#### **UI Layout:**
```
┌─────────────────────────────────┐
│ ← Cancel          [Save]        │
├─────────────────────────────────┤
│     [Change Avatar Photo]       │
├─────────────────────────────────┤
│ Personal Information            │
│ ┌─────────────────────────────┐ │
│ │ Full Name *                 │ │
│ │ Budi Santoso                │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Phone Number *              │ │
│ │ +62 812-3456-7890           │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Email (optional)            │ │
│ │ budi@email.com              │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ About You                       │
│ ┌─────────────────────────────┐ │
│ │ Professional barber with... │ │
│ │                             │ │
│ │ (Max 500 characters)        │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Location                        │
│ ┌─────────────────────────────┐ │
│ │ Service Area *              │ │
│ │ Jakarta Selatan             │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Address (optional)          │ │
│ │ Jl. Sudirman No. 123        │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Experience & Skills             │
│ ┌─────────────────────────────┐ │
│ │ Years of Experience         │ │
│ │ [Dropdown: 5+ years]        │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Specializations             │ │
│ │ ☑ Modern Cuts               │ │
│ │ ☑ Traditional Shave         │ │
│ │ ☐ Hair Coloring             │ │
│ │ ☑ Beard Styling             │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

#### **Features:**
- ✅ Photo upload with camera/gallery picker
- ✅ Form validation
- ✅ Character counters
- ✅ Multi-select for specializations
- ✅ Save with loading state
- ✅ Cancel with unsaved changes warning

#### **Validation Rules:**
```typescript
const profileSchema = {
  fullName: { required: true, minLength: 3 },
  phone: { required: true, format: /^\+62\d{9,13}$/ },
  email: { format: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  bio: { maxLength: 500 },
  serviceArea: { required: true }
};
```

---

### **6.3 Portfolio Management**

**Location:** `apps/partner/app/profile/portfolio.tsx`

#### **UI Layout:**
```
┌─────────────────────────────────┐
│ ← Back            [Add Photos]  │
├─────────────────────────────────┤
│ My Portfolio (8/20 photos)      │
├─────────────────────────────────┤
│ ┌───────────┬───────────┐       │
│ │ [Photo 1] │ [Photo 2] │       │
│ │    [❌]   │    [❌]   │       │
│ └───────────┴───────────┘       │
│ ┌───────────┬───────────┐       │
│ │ [Photo 3] │ [Photo 4] │       │
│ │    [❌]   │    [❌]   │       │
│ └───────────┴───────────┘       │
│ ...more photos...               │
├─────────────────────────────────┤
│ Tips for Great Photos:          │
│ • Show your best work           │
│ • Clear, well-lit images        │
│ • Before & after shots          │
│ • Different styles              │
└─────────────────────────────────┘
```

#### **Features:**
- ✅ Grid view of portfolio photos
- ✅ Add photos (camera or gallery)
- ✅ Delete photos with confirmation
- ✅ Reorder photos (drag & drop)
- ✅ Photo viewer with zoom
- ✅ Maximum 20 photos limit
- ✅ Upload progress indicators

#### **Photo Requirements:**
- Format: JPEG/PNG
- Max size: 5MB per photo
- Recommended: 1080x1080px
- Limit: 20 photos total

---

### **6.4 Services & Pricing Management**

**Location:** `apps/partner/app/profile/services.tsx`

#### **UI Layout:**
```
┌─────────────────────────────────┐
│ ← Back          [Add Service]   │
├─────────────────────────────────┤
│ My Services (5)                 │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ ✂️ Haircut                  │ │
│ │ Rp 50,000 • 30 min          │ │
│ │ Standard haircut service    │ │
│ │         [Edit] [Delete]     │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 🪒 Shave & Beard Trim       │ │
│ │ Rp 25,000 • 20 min          │ │
│ │ Professional shaving        │ │
│ │         [Edit] [Delete]     │ │
│ └─────────────────────────────┘ │
│ ...more services...             │
└─────────────────────────────────┘
```

#### **Add/Edit Service Modal:**
```
┌─────────────────────────────────┐
│ Add New Service                 │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ Service Name *              │ │
│ │ Haircut                     │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Price (Rp) *                │ │
│ │ 50,000                      │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Duration (minutes) *        │ │
│ │ [Dropdown: 30]              │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Description                 │ │
│ │ Standard haircut service... │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Category                    │ │
│ │ [Dropdown: Hair Services]   │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│    [Cancel]         [Save]      │
└─────────────────────────────────┘
```

#### **Features:**
- ✅ List all services with details
- ✅ Add new service with form
- ✅ Edit existing services
- ✅ Delete services (with confirmation)
- ✅ Service categories
- ✅ Price and duration fields
- ✅ Service visibility toggle (active/inactive)

#### **Service Categories:**
- Hair Services (haircut, styling, coloring)
- Facial Services (shave, beard trim, facial treatment)
- Package Services (combo deals)
- Other Services

---

## 🔧 **Critical Gap Fixes**

### **Fix 1: Photo Gallery in Customer App**

**Problem:** Customers can't view provider's completion photos from their booking details.

**Solution:**
- Add photo gallery section in customer booking detail screen
- Show before/after photos taken by provider
- Image viewer with zoom and swipe
- Photo timestamp display

**Files to Modify:**
- `apps/customer/app/booking/[id].tsx`
- Create: `apps/customer/components/PhotoGallery.tsx`

```typescript
// apps/customer/components/PhotoGallery.tsx
export function PhotoGallery({ photos }: { photos: BookingPhoto[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  
  return (
    <View>
      <Text style={styles.sectionTitle}>Service Photos</Text>
      <ScrollView horizontal>
        {photos.map((photo, index) => (
          <TouchableOpacity 
            key={photo.id}
            onPress={() => setSelectedIndex(index)}
          >
            <Image source={{ uri: photo.url }} style={styles.thumbnail} />
            <Text style={styles.photoLabel}>{photo.type}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {selectedIndex !== null && (
        <ImageViewer
          images={photos.map(p => ({ uri: p.url }))}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </View>
  );
}
```

---

### **Fix 2: Phone Number Format Normalization**

**Problem:** Inconsistent phone formatting across apps (login accepts "+62 812-3456-7890" but displays differently).

**Solution:**
- Create utility functions for phone formatting
- Normalize phone input in login
- Display consistent format everywhere

**Files to Create:**
```typescript
// shared/utils/phone.ts
export const PhoneUtils = {
  // Remove all non-digits except leading +
  normalize: (phone: string): string => {
    return phone.replace(/[^\d+]/g, '');
  },
  
  // Format for display: +62 812-3456-7890
  formatDisplay: (phone: string): string => {
    const normalized = PhoneUtils.normalize(phone);
    if (normalized.startsWith('+62')) {
      const number = normalized.substring(3);
      return `+62 ${number.substring(0, 3)}-${number.substring(3, 7)}-${number.substring(7)}`;
    }
    return phone;
  },
  
  // Format for calling: +628123456789
  formatCall: (phone: string): string => {
    return PhoneUtils.normalize(phone);
  },
  
  // Validate Indonesian phone
  isValid: (phone: string): boolean => {
    const normalized = PhoneUtils.normalize(phone);
    return /^\+62\d{9,13}$/.test(normalized);
  }
};
```

**Files to Modify:**
- `shared/utils/phone.ts` (new file)
- Update all phone displays across both apps
- Update login phone input

---

## 📊 **Mock Data Additions**

### **New Mock Data Needed:**

```typescript
// shared/services/mockData.ts

// Add customer list data
export const mockCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Rina Susanti',
    phone: '+62 812-3456-7890',
    avatar: 'https://i.pravatar.cc/150?img=1',
    email: 'rina@email.com',
    totalBookings: 5,
    completedBookings: 4,
    cancelledBookings: 1,
    totalSpent: 375000,
    memberSince: new Date('2024-10-15'),
    lastVisit: new Date('2025-01-05'),
    isFavorite: true,
    notes: 'Customer prefers short fade. Always on time.',
    address: {
      street: 'Jl. Sudirman No. 45',
      city: 'Jakarta',
      district: 'Jakarta Selatan',
    }
  },
  // ...more customers
];

// Add provider profile data
export const mockProviderProfile: ProviderProfile = {
  id: 'barber-1',
  name: 'Budi Santoso',
  phone: '+62 812-3456-7890',
  email: 'budi@email.com',
  avatar: 'https://i.pravatar.cc/150?img=12',
  rating: 4.8,
  totalReviews: 156,
  totalJobs: 248,
  acceptanceRate: 95,
  bio: 'Professional barber with 5+ years experience. Specialist in modern cuts and styling.',
  yearsExperience: 5,
  serviceArea: 'Jakarta Selatan',
  address: 'Jl. Sudirman No. 123',
  specializations: ['Modern Cuts', 'Traditional Shave', 'Beard Styling'],
  portfolioPhotos: [
    { id: 'p1', url: 'https://example.com/photo1.jpg', uploadedAt: new Date() },
    // ...more photos
  ],
  services: [
    {
      id: 'svc-1',
      name: 'Haircut',
      price: 50000,
      duration: 30,
      description: 'Standard haircut service',
      category: 'Hair Services',
      isActive: true
    },
    // ...more services
  ]
};
```

---

## 🎯 **Implementation Steps**

### **Day 1-2: Customer Management**
- [ ] Create customers list screen
- [ ] Implement search and filter
- [ ] Add customer card component
- [ ] Create customer details screen
- [ ] Add favorite toggle functionality
- [ ] Implement private notes feature

### **Day 3-4: Profile Management**
- [ ] Build profile view screen
- [ ] Create profile edit form
- [ ] Add photo upload functionality
- [ ] Implement form validation
- [ ] Add save/cancel logic

### **Day 5: Portfolio & Services**
- [ ] Create portfolio management screen
- [ ] Add photo grid with delete
- [ ] Build services management screen
- [ ] Create service editor modal
- [ ] Add service CRUD operations

### **Day 6: Critical Fixes**
- [ ] Add photo gallery to customer app
- [ ] Create phone utility functions
- [ ] Update all phone displays
- [ ] Test phone formatting

### **Day 7: Testing & Polish**
- [ ] Test all customer features
- [ ] Test all profile features
- [ ] Fix bugs
- [ ] Add loading states
- [ ] Add empty states
- [ ] Update documentation

---

## ✅ **Acceptance Criteria**

### **Customer Management:**
- [ ] Can view list of all customers
- [ ] Can search customers by name/phone
- [ ] Can filter by favorites/recent
- [ ] Can view customer details
- [ ] Can see customer booking history
- [ ] Can toggle favorite status
- [ ] Can add/edit private notes
- [ ] Can call customer from details

### **Profile Management:**
- [ ] Can view own profile
- [ ] Can edit personal information
- [ ] Can upload/change profile photo
- [ ] Can update bio/about
- [ ] Can manage service area

### **Portfolio:**
- [ ] Can view portfolio photos
- [ ] Can add new photos (max 20)
- [ ] Can delete photos
- [ ] Photos display in grid
- [ ] Image viewer with zoom works

### **Services & Pricing:**
- [ ] Can view all services
- [ ] Can add new service
- [ ] Can edit existing service
- [ ] Can delete service (with confirmation)
- [ ] Services show on customer app
- [ ] Price and duration are accurate

### **Critical Fixes:**
- [ ] Customer app shows provider's completion photos
- [ ] Phone numbers format consistently everywhere
- [ ] Phone validation works correctly

---

## 📁 **New Files to Create**

### **Partner App:**
```
apps/partner/
├── app/
│   ├── (tabs)/
│   │   └── customers.tsx          # NEW
│   ├── customer/
│   │   └── [id].tsx                # NEW
│   ├── profile/
│   │   ├── edit.tsx                # NEW
│   │   ├── portfolio.tsx           # NEW
│   │   └── services.tsx            # NEW
├── components/
│   ├── CustomerCard.tsx            # NEW
│   ├── ServiceEditor.tsx           # NEW
│   └── PortfolioGrid.tsx           # NEW
```

### **Customer App:**
```
apps/customer/
├── components/
│   └── PhotoGallery.tsx            # NEW
```

### **Shared:**
```
shared/
├── utils/
│   └── phone.ts                    # NEW
├── types/
│   └── customer.ts                 # NEW (if not exists)
```

---

## 🚀 **Ready to Start!**

Week 7 is the final major feature week. After this, Week 8 will focus on polish, testing, and final touches.

**Next Action:** Start with customer management (Day 1-2)

---

**Last Updated:** January 2025  
**Status:** Ready for implementation
