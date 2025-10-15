# 🚀 Onboarding Implementation - Quick Start

**Status:** Ready to implement  
**Estimated Time:** 12-15 hours  
**Priority:** Start with Freelance Barber flow (simpler)

---

## ✅ What's Done

- [x] Folder structure created
  - `apps/partner/app/onboarding/barber/`
  - `apps/partner/app/onboarding/barbershop/`
- [x] Implementation plan documented
- [x] Database schema ready (barbers & barbershops tables exist)

---

## 📋 Implementation Order

### **Step 1: Build Services** (1-2 hours)
These are needed by all screens, so build them first.

**Files to create:**
1. `packages/shared/services/onboardingService.ts` - Save/load onboarding data
2. Update `packages/shared/services/storage.ts` - File upload handling (might already exist)

**What they do:**
- Save progress at each step (AsyncStorage + Zustand)
- Upload photos/documents to Supabase Storage
- Submit complete onboarding data to database
- Update verification_status to 'pending'

---

### **Step 2: Barber Onboarding** (3-4 hours)
Start with freelance barbers - simpler flow, 5 screens.

**Build in this order:**

#### 2.1 Basic Info (`barber/basic-info.tsx`)
- Bio textarea
- Experience years picker
- Specializations multi-select
- Save & Continue button

#### 2.2 eKYC (`barber/ekyc.tsx`)
- IC number input
- Upload IC front/back photos
- Selfie camera
- Optional certificates
- Upload to Supabase Storage

#### 2.3 Service Details (`barber/service-details.tsx`)
- Service radius slider
- Working hours picker (7 days)
- Portfolio photos (3-10)
- Base price input (minimum haircut rate)
- ⚠️ **NO travel fee** - Platform sets this: RM 5 base (0-4km) + RM 1/km after 4km

#### 2.4 Payout (`barber/payout.tsx`)
- Bank dropdown
- Account number
- Account holder name
- Confirmation

#### 2.5 Review & Submit (`barber/review.tsx`)
- Summary of all data
- Photo previews
- Terms checkbox
- Submit button → Changes status to 'pending'

---

### **Step 3: Update Routing** (30 min)

#### 3.1 Update Welcome Screen
```typescript
// onboarding/welcome.tsx
const handleGetStarted = async () => {
  const accountType = await AsyncStorage.getItem('partnerAccountType');
  
  if (accountType === 'freelance') {
    router.push('/onboarding/barber/basic-info');
  } else {
    router.push('/onboarding/barbershop/business-info');
  }
};
```

#### 3.2 Update Index Routing
```typescript
// app/index.tsx
// Check if onboarding is complete before showing pending
if (!hasCompletedOnboarding) {
  router.replace('/onboarding/welcome');
  return;
}
```

---

### **Step 4: Test Barber Flow** (30 min)
- Register new partner
- Select "Freelance Barber"
- Complete all 5 steps
- Verify data in Supabase
- Check verification_status = 'pending'
- Confirm pending approval screen shows

---

### **Step 5: Barbershop Onboarding** (5-6 hours)
Once Barber flow works, build Barbershop flow (8 screens).

**Build in this order:**
1. Business Info
2. Location (with map)
3. Documents
4. Operating Hours
5. Staff & Services
6. Amenities
7. Payout
8. Review & Submit

---

### **Step 6: Final Testing** (1 hour)
- Test both flows end-to-end
- Test validation
- Test file uploads
- Test error handling
- Test resume after interruption

---

## 🎯 Priority Today

**Start with these 3 files:**

### 1. Onboarding Service
**File:** `packages/shared/services/onboardingService.ts`

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

export const onboardingService = {
  // Save barber progress
  async saveBarberProgress(step: string, data: any) {
    const key = `onboarding_barber_${step}`;
    await AsyncStorage.setItem(key, JSON.stringify(data));
  },

  // Get all barber progress
  async getBarberProgress() {
    const steps = ['basicInfo', 'ekyc', 'serviceDetails', 'payout'];
    const data: any = {};
    
    for (const step of steps) {
      const saved = await AsyncStorage.getItem(`onboarding_barber_${step}`);
      if (saved) data[step] = JSON.parse(saved);
    }
    
    return data;
  },

  // Submit complete barber onboarding
  async submitBarberOnboarding(userId: string, data: any) {
    try {
      // Upload verification documents to JSONB
      const documents = {
        ic_front: data.ekyc.icFrontUrl,
        ic_back: data.ekyc.icBackUrl,
        selfie: data.ekyc.selfieUrl,
        certificates: data.ekyc.certificateUrls || []
      };

      // Update barber record
      const { error } = await supabase
        .from('barbers')
        .update({
          bio: data.basicInfo.bio,
          experience_years: data.basicInfo.experience,
          specializations: data.basicInfo.specializations,
          service_radius_km: data.serviceDetails.radius,
          working_hours: data.serviceDetails.hours,
          portfolio_images: data.serviceDetails.portfolioUrls,
          base_price: data.serviceDetails.basePrice,
          bank_name: data.payout.bankName,
          bank_account_number: data.payout.accountNumber,
          bank_account_name: data.payout.accountName,
          ic_number: data.ekyc.icNumber,
          verification_documents: documents,
          verification_status: 'pending', // ✅ Now ready for review
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Clear saved progress
      await AsyncStorage.multiRemove([
        'onboarding_barber_basicInfo',
        'onboarding_barber_ekyc',
        'onboarding_barber_serviceDetails',
        'onboarding_barber_payout'
      ]);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};
```

### 2. First Screen: Basic Info
**File:** `apps/partner/app/onboarding/barber/basic-info.tsx`

I can provide the full implementation, but it's ~300 lines. Would you like me to create it now?

---

## 📖 Resources

**Full Documentation:**
- `ONBOARDING_IMPLEMENTATION_PLAN.md` - Complete spec
- `ADMIN_PARTNER_APPROVAL_GUIDE.md` - Admin workflow
- `APPROVAL_FLOW_COMPLETE.md` - Technical details

**Database Reference:**
- `supabase/migrations/001_initial_schema.sql` - Tables structure
- barbers table fields
- barbershops table fields

---

## 🆘 Need Help?

### Common Issues:

**1. File Upload**
- Use Supabase Storage buckets: `barber-documents`, `barber-portfolio`
- Compress images before upload (max 5MB)
- Get public URLs after upload

**2. Form Validation**
- Validate on blur (immediate feedback)
- Block navigation if invalid
- Show clear error messages

**3. Navigation**
- Use `router.push()` for forward
- Use `router.back()` for back (saves progress first)
- Use `router.replace()` for final submission

**4. State Management**
- Save to AsyncStorage (persistent)
- Update Zustand (in-memory, fast)
- Both stay in sync

---

## ✅ Definition of Done

### Barber Onboarding Complete When:
- [ ] All 5 screens built
- [ ] Data saves at each step
- [ ] Photos upload to Supabase
- [ ] Can resume after closing app
- [ ] Submit creates 'pending' status
- [ ] Routes to pending approval screen
- [ ] Admin can see data in Supabase

### Barbershop Onboarding Complete When:
- [ ] All 8 screens built
- [ ] Same as above but for barbershop data
- [ ] barbershops table populated
- [ ] Location coordinates saved
- [ ] Services array populated

---

## 🚀 Let's Start!

**I recommend starting with:**

1. Create `onboardingService.ts` (30 min)
2. Create `barber/basic-info.tsx` (1 hour)
3. Test it works end-to-end
4. Then build remaining screens

**Want me to generate the code for these files?** I can create them one by one, starting with the service. 

Just say:
- "Create onboarding service" → I'll generate the full service file
- "Create basic info screen" → I'll generate the UI component
- "Create all barber screens" → I'll generate all 5 screens

**Ready when you are!** 🎯

Last updated: 2025-10-12 06:55 UTC
