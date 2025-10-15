# 🚀 Complete Onboarding Implementation Plan

**Date:** 2025-10-12  
**Status:** In Progress  
**Goal:** Build production-ready onboarding for Freelance Barbers & Barbershop Owners

---

## 📁 Folder Structure

```
apps/partner/app/onboarding/
├── _layout.tsx                    # ✅ Exists
├── welcome.tsx                    # ✅ Exists - Update routing
├── barber/                        # 🆕 NEW - Freelance Barber Flow
│   ├── basic-info.tsx            # Step 1: Bio, experience, specializations
│   ├── ekyc.tsx                  # Step 2: IC photos + selfie
│   ├── service-details.tsx       # Step 3: Radius, hours, portfolio, pricing
│   ├── payout.tsx                # Step 4: Bank account
│   └── review.tsx                # Step 5: Review & submit
└── barbershop/                    # 🆕 NEW - Barbershop Owner Flow
    ├── business-info.tsx          # Step 1: Name, SSM, description, logo
    ├── location.tsx               # Step 2: Address, coordinates, photos
    ├── documents.tsx              # Step 3: SSM cert, license, IC
    ├── operating-hours.tsx        # Step 4: Schedule, holidays
    ├── staff-services.tsx         # Step 5: Staff, services, pricing
    ├── amenities.tsx              # Step 6: Features, payment methods
    ├── payout.tsx                 # Step 7: Business bank account
    └── review.tsx                 # Step 8: Review & submit
```

---

## 🎯 Freelance Barber Onboarding (5 Screens)

### Screen 1: Basic Info
**File:** `onboarding/barber/basic-info.tsx`

**Fields:**
- Bio (textarea, 50-500 chars)
- Years of Experience (picker: 0-30+)
- Specializations (multi-select chips)
  - Haircut
  - Beard Trim
  - Shaving
  - Hair Coloring
  - Kids Haircut
  - Styling
  - Other

**Validation:**
- Bio: Required, min 50 chars
- Experience: Required
- Specializations: At least 1 selected

**Save to:** AsyncStorage + Zustand state

---

### Screen 2: eKYC (Identity Verification)
**File:** `onboarding/barber/ekyc.tsx`  
**Note:** Already exists at `onboarding/ekyc.tsx` - can reuse or move

**Fields:**
- IC Number (format: XXXXXX-XX-XXXX)
- IC Front Photo (camera/gallery)
- IC Back Photo (camera/gallery)
- Selfie Photo (camera only)
- Certificates (optional, multiple)

**Validation:**
- IC number: Required, valid format
- IC photos: Required, both sides
- Selfie: Required
- Photo size: Max 5MB each

**Upload to:** Supabase Storage `barber-documents/`

---

### Screen 3: Service Details
**File:** `onboarding/barber/service-details.tsx`

**Fields:**
- Service Radius (slider: 5-50 km)
- Current Location (map picker)
- Working Hours (day/time picker)
  - Monday-Sunday
  - Start/End time for each day
  - Toggle for days off
- Portfolio Photos (min 3, max 10)
- Base Price (MYR 20-200)
- Travel Fee per km (MYR 0-10)

**Validation:**
- Radius: Required
- At least 3 working days
- At least 3 portfolio photos
- Prices: Required

**Upload:** Portfolio to `barber-portfolio/`

---

### Screen 4: Payout
**File:** `onboarding/barber/payout.tsx`  
**Note:** Already exists - can reuse

**Fields:**
- Bank Name (dropdown)
- Account Number (10-16 digits)
- Account Holder Name
- Confirm Account Number

**Validation:**
- All fields required
- Account numbers must match
- Name validation

---

### Screen 5: Review & Submit
**File:** `onboarding/barber/review.tsx`

**Shows:**
- Summary of all entered data
- Preview of photos
- Terms & Conditions checkbox
- Submit button

**On Submit:**
1. Validate all data
2. Upload all documents
3. Create/update barber record
4. Set `verification_status = 'pending'`
5. Navigate to pending approval screen

---

## 🏪 Barbershop Owner Onboarding (8 Screens)

### Screen 1: Business Info
**File:** `onboarding/barbershop/business-info.tsx`

**Fields:**
- Business Name * (required)
- SSM Registration Number * (required)
- Business Description (textarea)
- Business Logo (upload)
- Cover Photos (min 1, max 5)

**Validation:**
- Name: Required, 3-100 chars
- SSM: Required, format validation
- Description: Min 50 chars
- Logo: Required
- At least 1 cover photo

---

### Screen 2: Location
**File:** `onboarding/barbershop/location.tsx`

**Fields:**
- Address Line 1 * (required)
- Address Line 2 (optional)
- City * (required)
- State * (dropdown, required)
- Postal Code * (required)
- Map Picker (coordinates)
- Shop Photos (interior/exterior, min 3)

**Validation:**
- All required fields
- Coordinates from map
- At least 3 shop photos

---

### Screen 3: Documents
**File:** `onboarding/barbershop/documents.tsx`

**Fields:**
- SSM Certificate * (upload)
- Business License (upload)
- Owner IC Front * (upload)
- Owner IC Back * (upload)
- Owner Selfie * (upload)
- Premise Photos (min 2, max 5)

**Validation:**
- All marked * required
- File size limits
- Format validation

---

### Screen 4: Operating Hours
**File:** `onboarding/barbershop/operating-hours.tsx`

**Fields:**
- Monday-Sunday hours
  - Open time
  - Close time
  - Closed toggle
- Public Holiday Schedule
  - Open/Closed
  - Special hours

**Validation:**
- At least 3 days open
- Valid time ranges
- Close time after open time

---

### Screen 5: Staff & Services
**File:** `onboarding/barbershop/staff-services.tsx`

**Fields:**
- **Staff Members** (optional)
  - Name
  - Role
  - Photo
  - Add/Remove buttons
  
- **Services** (required, min 3)
  - Service name
  - Description
  - Price
  - Duration
  - Category
  - Add/Remove buttons

**Validation:**
- At least 3 services
- All service fields required
- Valid pricing

---

### Screen 6: Amenities
**File:** `onboarding/barbershop/amenities.tsx`

**Fields:**
- **Amenities** (multi-select)
  - WiFi
  - Air Conditioning
  - Parking
  - Wheelchair Access
  - Kids Play Area
  - Coffee/Tea
  
- **Payment Methods** (multi-select, min 1)
  - Cash
  - Card
  - Touch 'n Go eWallet
  - Boost
  - GrabPay
  - ShopeePay

**Validation:**
- At least 1 payment method

---

### Screen 7: Payout
**File:** `onboarding/barbershop/payout.tsx`

**Fields:**
- Business Bank Name (dropdown)
- Account Number (10-16 digits)
- Account Holder Name (business name)
- Confirm Account Number

**Validation:**
- All required
- Accounts match
- Business name validation

---

### Screen 8: Review & Submit
**File:** `onboarding/barbershop/review.tsx`

**Shows:**
- Complete summary
- All photos preview
- Business info recap
- Location map
- Services list
- Terms checkbox

**On Submit:**
1. Validate complete data
2. Upload all documents
3. Create barbershop record
4. Set `verification_status = 'pending'`
5. Navigate to pending approval

---

## 🔧 Services to Create

### 1. Onboarding Service
**File:** `packages/shared/services/onboardingService.ts`

```typescript
export const onboardingService = {
  // Save progress at each step
  saveBarberProgress(step: string, data: any): Promise<void>
  
  // Get saved progress
  getBarberProgress(): Promise<BarberOnboardingData>
  
  // Submit complete barber onboarding
  submitBarberOnboarding(data: BarberOnboardingData): Promise<ApiResponse>
  
  // Save barbershop progress
  saveBarbershopProgress(step: string, data: any): Promise<void>
  
  // Submit complete barbershop onboarding
  submitBarbershopOnboarding(data: BarbershopOnboardingData): Promise<ApiResponse>
  
  // Check completion status
  isOnboardingComplete(type: 'barber' | 'barbershop'): Promise<boolean>
}
```

### 2. Storage Service
**File:** `packages/shared/services/storageService.ts`

```typescript
export const storageService = {
  // Upload single file
  uploadFile(file: File, path: string): Promise<string>
  
  // Upload multiple files
  uploadMultiple(files: File[], basePath: string): Promise<string[]>
  
  // Delete file
  deleteFile(path: string): Promise<void>
  
  // Get public URL
  getPublicUrl(path: string): string
}
```

---

## 📊 State Management

### Zustand Store Structure
```typescript
interface OnboardingState {
  // Common
  accountType: 'barber' | 'barbershop' | null;
  currentStep: number;
  totalSteps: number;
  
  // Barber
  barberData: {
    basicInfo: { bio, experience, specializations };
    ekyc: { icNumber, icFront, icBack, selfie, certificates };
    serviceDetails: { radius, location, hours, portfolio, pricing };
    payout: { bank, account, name };
  };
  
  // Barbershop
  barbershopData: {
    businessInfo: { name, ssm, description, logo, covers };
    location: { address, city, state, postal, coordinates, photos };
    documents: { ssmCert, license, ownerIC, premisePhotos };
    operatingHours: { schedule, holidays };
    staffServices: { staff, services };
    amenities: { amenities, paymentMethods };
    payout: { bank, account, name };
  };
  
  // Actions
  updateBarberData: (step, data) => void;
  updateBarbershopData: (step, data) => void;
  resetOnboarding: () => void;
}
```

---

## ✅ Implementation Checklist

### Phase 1: Setup (30 min)
- [x] Create folder structure
- [ ] Create onboarding service
- [ ] Create storage service
- [ ] Update Zustand store

### Phase 2: Barber Onboarding (3-4 hours)
- [ ] Basic Info screen
- [ ] Move/update eKYC screen
- [ ] Service Details screen
- [ ] Move/update Payout screen
- [ ] Review & Submit screen

### Phase 3: Barbershop Onboarding (5-6 hours)
- [ ] Business Info screen
- [ ] Location screen
- [ ] Documents screen
- [ ] Operating Hours screen
- [ ] Staff & Services screen
- [ ] Amenities screen
- [ ] Payout screen
- [ ] Review & Submit screen

### Phase 4: Integration (1-2 hours)
- [ ] Update welcome.tsx routing
- [ ] Connect to services
- [ ] Test data submission
- [ ] Update index.tsx routing

### Phase 5: Testing (1 hour)
- [ ] Test barber flow end-to-end
- [ ] Test barbershop flow end-to-end
- [ ] Test validation
- [ ] Test file uploads
- [ ] Test pending approval flow

---

## 🎨 UI/UX Guidelines

### Progress Indicator
```typescript
// Show at top of each screen
<ProgressBar current={3} total={5} />
```

### Navigation
- Back button: Save progress
- Next button: Validate + proceed
- Skip button: Only for optional fields

### Form Validation
- Real-time validation
- Clear error messages
- Highlight invalid fields
- Block proceed if invalid

### Photo Upload
- Camera + Gallery options
- Preview before upload
- Compression (max 5MB)
- Delete/retake options

### Saving Progress
- Auto-save on each step
- Manual save button
- "Resume onboarding" option
- Clear abandonment after 30 days

---

## 📱 User Experience Flow

### Barber Journey
```
Register → Select "Freelance" → Welcome → Basic Info (2 min) 
→ eKYC (3 min) → Service Details (4 min) → Payout (2 min) 
→ Review (1 min) → Submit → Pending Approval
Total: ~12 minutes
```

### Barbershop Journey
```
Register → Select "Barbershop" → Welcome → Business Info (3 min)
→ Location (3 min) → Documents (4 min) → Hours (2 min)
→ Staff/Services (5 min) → Amenities (2 min) → Payout (2 min)
→ Review (2 min) → Submit → Pending Approval
Total: ~23 minutes
```

---

## 🔐 Security & Validation

### Document Upload Security
- Validate file types (jpg, png, pdf)
- Scan for malware
- Compress images
- Store in private buckets
- Signed URLs for admin review

### Data Validation
- Frontend validation (immediate)
- Backend validation (submission)
- Sanitize all inputs
- SQL injection prevention
- XSS protection

---

## 🚀 Next Steps

1. **Start with services** - Build onboardingService & storageService
2. **Build Barber flow first** - Simpler, fewer screens
3. **Test thoroughly** - Before building Barbershop flow
4. **Build Barbershop flow** - More complex, more screens
5. **Integration & Testing** - End-to-end validation

---

**Estimated Total Time:** 12-15 hours of focused development

**Ready to start?** Let's begin with the services! 🎯

Last updated: 2025-10-12 06:52 UTC
