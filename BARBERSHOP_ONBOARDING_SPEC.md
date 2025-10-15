# Barbershop Onboarding Implementation Spec

**Status:** 1/8 screens complete  
**Date:** 2025-10-12

---

## ✅ Completed (1/8)

### 1. Business Info ✅
**File:** `apps/partner/app/onboarding/barbershop/business-info.tsx` (356 lines)

**Fields:**
- Business name (required, min 3 chars)
- Description (required, min 20 chars, max 500)
- Phone number (formatted, 10-11 digits)
- Email (validated)
- SSM number (optional)

---

## ⏳ To Build (7 screens)

### 2. Location Screen
**File:** `apps/partner/app/onboarding/barbershop/location.tsx`

**Key Features:**
- Full address form (line1, line2, city, state, postal code)
- Map picker to get coordinates (latitude, longitude)
- "Use Current Location" button
- Address validation

**Tech Stack:**
- `expo-location` for current location
- `react-native-maps` for map picker
- Geocoding for address → coordinates

**Data Structure:**
```typescript
{
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}
```

---

### 3. Documents Screen
**File:** `apps/partner/app/onboarding/barbershop/documents.tsx`

**Uploads:**
- Logo (optional, 1 image)
- Cover images (required, 1-5 images)
- SSM document (optional if SSM number provided)
- Business license (optional)

**Similar to:** Barber eKYC screen (image picker + upload)

**Upload buckets:**
- `barbershop-logos`
- `barbershop-images`
- `barbershop-documents`

---

### 4. Operating Hours Screen
**File:** `apps/partner/app/onboarding/barbershop/operating-hours.tsx`

**Fields:**
- 7 days toggle (isOpen: boolean)
- Start time (time picker)
- End time (time picker)
- Break time (optional)

**Similar to:** Barber service-details working hours

**Data Structure:**
```typescript
{
  mon: { start: '09:00', end: '18:00', isOpen: true },
  tue: { start: '09:00', end: '18:00', isOpen: true },
  // ... rest of week
}
```

---

### 5. Staff & Services Screen
**File:** `apps/partner/app/onboarding/barbershop/staff-services.tsx`

**Two sections:**

**A. Staff Members:**
- Add staff button
- Name, role (barber/senior/junior), specializations
- Dynamic list (add/remove)
- Min 1 staff member required

**B. Services Offered:**
- Add service button
- Service name, price (RM), duration (minutes)
- Dynamic list (add/remove)
- Min 3 services required

**Data Structure:**
```typescript
{
  staff: [
    { name: 'Ahmad', role: 'Senior Barber', specializations: ['Fade', 'Beard'] }
  ],
  services: [
    { name: 'Haircut', price: 25, duration: 30 }
  ]
}
```

---

### 6. Amenities Screen
**File:** `apps/partner/app/onboarding/barbershop/amenities.tsx`

**Multi-select chips:**
- WiFi
- Air Conditioning
- Parking
- Wheelchair Accessible
- TV/Entertainment
- Refreshments
- Prayer Room
- Kids Play Area
- Waiting Area
- Card Payment
- E-Wallet Payment

**Simple:** Just an array of selected amenities

---

### 7. Payout Screen
**File:** `apps/partner/app/onboarding/barbershop/payout.tsx`

**SAME AS BARBER PAYOUT:**
- Bank name (dropdown)
- Account number (10-16 digits)
- Account holder name

**Can reuse most code from barber payout screen**

---

### 8. Review & Submit Screen
**File:** `apps/partner/app/onboarding/barbershop/review.tsx`

**Sections to display:**
1. Business Info (name, description, contact)
2. Location (full address, map preview)
3. Documents (uploaded count)
4. Operating Hours (days open)
5. Staff (count) & Services (count)
6. Amenities (list)
7. Payout (masked account)

**On Submit:**
- Calls `barbershopOnboardingService.submitOnboarding()`
- Creates PostGIS POINT from lat/lng
- Sets `verification_status = 'pending'`
- Redirects to `/pending-approval`

---

## 📊 Progress Dots Pattern

All screens use 8 dots:
```typescript
// Screen 1 (Business Info)
<View style={styles.progressDot, styles.progressActive} />
<View style={styles.progressDot} /> // 7 more

// Screen 2 (Location)
<View style={styles.progressDotCompleted} />
<View style={styles.progressDot, styles.progressActive} />
<View style={styles.progressDot} /> // 6 more

// ... etc
```

---

## 🎨 UI/UX Guidelines

### Consistent with Barber Flow
- Same colors (#4CAF50 primary)
- Same validation patterns
- Same loading states
- Same back button behavior

### Barbershop-Specific
- More emphasis on location (map)
- Multiple images (cover photos)
- Staff management (dynamic list)
- Business hours (more detailed)

---

## 🔧 Technical Requirements

### Dependencies
```json
{
  "expo-location": "^16.x",
  "react-native-maps": "^1.x"
}
```

### Supabase Storage Buckets
Create these buckets:
```sql
-- In Supabase dashboard
CREATE barbershop-logos
CREATE barbershop-images  
CREATE barbershop-documents
```

### PostGIS for Location
Already enabled in schema:
```sql
location GEOGRAPHY(POINT, 4326)
```

Save as:
```typescript
const locationPoint = `POINT(${longitude} ${latitude})`;
```

---

## 📁 Implementation Order

### Phase 1: Simple Screens (2-3 hours)
1. ✅ Business Info (done)
2. Operating Hours (similar to barber working hours)
3. Amenities (simple multi-select)
4. Payout (reuse barber code)

### Phase 2: Complex Screens (4-5 hours)
5. Location (map integration)
6. Documents (multiple image uploads)
7. Staff & Services (dynamic lists)

### Phase 3: Final Screen (1-2 hours)
8. Review & Submit

---

## 🚀 Quick Implementation Strategy

### Option A: Generate All Now
I can create all 7 remaining screens right now (will take 5-10 minutes to generate all files).

### Option B: Build in Phases
- Phase 1 first (simple screens)
- Test them
- Then Phase 2
- Finally Phase 3

### Option C: Most Critical First
1. Location (customers need to find you)
2. Documents (verification needed)
3. Staff & Services (core business info)
4. Operating Hours
5. Amenities
6. Payout
7. Review

---

## 💡 Code Reuse Opportunities

### From Barber Flow
- Payout screen (99% same)
- Image upload logic (eKYC → Documents)
- Working hours picker (service-details → operating-hours)
- Progress indicator (all screens)
- Form validation patterns (all screens)

### New Components Needed
- MapPicker component (location screen)
- DynamicList component (staff & services)
- AmenitiesSelector component (amenities)

---

## 🧪 Testing Considerations

### Location Screen
- Test on real device (for GPS)
- Handle permission denials
- Validate coordinates are within Malaysia

### Documents Screen
- Test multiple image uploads
- Handle large file sizes
- Verify Supabase storage works

### Staff & Services
- Test add/remove functionality
- Validate minimum requirements
- Test form persistence

---

## 📦 Expected File Sizes

Based on barber screens:
- Location: ~500 lines (map adds complexity)
- Documents: ~600 lines (multiple uploads)
- Operating Hours: ~400 lines
- Staff & Services: ~700 lines (most complex)
- Amenities: ~350 lines (simplest)
- Payout: ~420 lines (reuse barber)
- Review: ~600 lines

**Total estimated:** ~3,570 lines for 7 screens

---

## 🎯 Which Approach?

**Recommend:** Option A - Generate all now

**Reasoning:**
1. Maintains consistency across all screens
2. Complete flow ready for testing
3. Similar patterns to barber (faster to generate)
4. You can test incrementally even if all exist

**Would you like me to:**
- ✅ Generate all 7 remaining screens now?
- ⏳ Build them in phases?
- 🎯 Start with most critical 3-4?

**Ready when you are!** Just say "generate all barbershop screens" and I'll create all 7 files.
