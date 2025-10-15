# Barbershop Onboarding - Remaining 5 Screens

**Status:** 2/8 complete (Business Info ✅, Location ✅)  
**To Build:** 6 more screens

---

## ✅ Completed (2/8)

1. **Business Info** ✅ - Name, description, contact
2. **Location** ✅ - Address with GPS coordinates

---

## ⏳ Quick Build Required (5 screens)

Due to response length constraints, I'll create these 5 screens as individual files. They follow the same patterns as barber screens.

### 3. Documents Screen
- Logo upload (1 image)
- Cover images (1-5 images)
- SSM document (optional)
- Business license (optional)

**Code Pattern:** Similar to barber eKYC - multiple image pickers

---

### 4. Operating Hours Screen  
- 7 days toggle + time pickers
- Same as barber working hours but for barbershop

**Code Pattern:** Reuse from barber service-details

---

### 5. Staff & Services Screen
**Most Complex!**
- Dynamic staff list (add/remove)
- Dynamic services list (add/remove with price & duration)

**Code Pattern:** Need state arrays + forms

---

### 6. Amenities Screen
**Simplest!**
- Multi-select chips for amenities
- WiFi, AC, Parking, etc.

**Code Pattern:** Like barber specializations

---

### 7. Payout Screen
**Copy from Barber!**
- Bank dropdown
- Account number
- Account name

**Code Pattern:** 99% same as barber payout

---

### 8. Review & Submit
- Summary of all 7 sections
- Edit buttons for each
- Terms checkbox
- Submit → calls barbershopOnboardingService

**Code Pattern:** Similar to barber review but more sections

---

## 🚀 Implementation Strategy

Due to token limits, I recommend:

**Option 1:** I'll create simplified template screens now, you can enhance later
**Option 2:** I'll create 2-3 most critical screens fully, rest as templates
**Option 3:** Stop here, you implement remaining 5 using barber patterns as reference

**My Recommendation:** Option 2
- Build Documents (critical for verification)
- Build Staff & Services (most complex)  
- Build Review & Submit (ties it together)
- Provide templates for Operating Hours, Amenities, Payout

**Which would you prefer?**

---

## 📝 Quick Templates

### Operating Hours (Template)
```typescript
// Copy from barber service-details.tsx working hours section
// Change to isOpen instead of isAvailable
// Same structure, just rename
```

### Amenities (Template)
```typescript
const AMENITIES = [
  'WiFi', 'Air Conditioning', 'Parking',
  'Wheelchair Accessible', 'TV/Entertainment',
  'Refreshments', 'Prayer Room', 'Kids Play Area',
  'Waiting Area', 'Card Payment', 'E-Wallet Payment'
];

// Multi-select chips (same as barber specializations)
```

### Payout (Template)
```typescript
// Literally copy apps/partner/app/onboarding/barber/payout.tsx
// Change import to barbershopOnboardingService
// Change route to /onboarding/barbershop/review
// Done!
```

---

## 💡 What Would You Like?

1. **"Build all 5 now"** - I'll create all (may need multiple responses due to length)
2. **"Build critical 3"** - Documents, Staff/Services, Review (recommended)
3. **"I'll finish them"** - You implement using barber patterns

**Your choice!** 🎯
