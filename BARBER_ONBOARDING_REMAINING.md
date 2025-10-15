# Remaining Barber Onboarding Screens

## ✅ Completed So Far

1. **Onboarding Service** - `packages/shared/services/onboardingService.ts` ✅
2. **Basic Info Screen** - `apps/partner/app/onboarding/barber/basic-info.tsx` ✅  
3. **eKYC Screen** - `apps/partner/app/onboarding/barber/ekyc.tsx` ✅

## 🔨 Still To Build

### 3. Service Details Screen
**File:** `apps/partner/app/onboarding/barber/service-details.tsx`

**Fields:**
- Service Radius (slider: 5-50 km)
- Working Hours (7 days with start/end time)
- Portfolio Photos (3-10 images)
- Base Price (minimum haircut rate)

**Key Notes:**
- ❌ **NO travel fee field** (set by platform: RM 5 base + RM 1/km after 4 km)
- Portfolio upload similar to eKYC, using `uploadOnboardingImage`
- Working hours: JSON like `{ mon: { start: '09:00', end: '18:00', isAvailable: true } }`

**Template Structure:**
```typescript
// State
const [radius, setRadius] = useState(10); // Default 10km
const [workingHours, setWorkingHours] = useState({...});
const [portfolioUris, setPortfolioUris] = useState<string[]>([]);
const [portfolioUrls, setPortfolioUrls] = useState<string[]>([]);
const [basePrice, setBasePrice] = useState('');

// Validation
- Radius: 5-50 km
- At least 1 day with working hours
- At least 3 portfolio photos
- Base price: minimum RM 20

// Save and Continue
await barberOnboardingService.saveProgress('serviceDetails', {
  radius,
  hours: workingHours,
  portfolioUrls,
  basePrice: parseFloat(basePrice),
});
router.push('/onboarding/barber/payout');
```

---

### 4. Payout Screen
**File:** `apps/partner/app/onboarding/barber/payout.tsx`

**Fields:**
- Bank Name (dropdown: Maybank, CIMB, Public Bank, RHB, etc.)
- Account Number (12-16 digits)
- Account Holder Name (must match IC name)

**Validation:**
- All fields required
- Account number: digits only, 10-16 characters
- Account name: letters and spaces only

**Template Structure:**
```typescript
const BANKS = [
  'Maybank',
  'CIMB Bank',
  'Public Bank',
  'RHB Bank',
  'Hong Leong Bank',
  'AmBank',
  'Bank Islam',
  'Bank Rakyat',
  'OCBC Bank',
  'HSBC Bank',
];

// State
const [bankName, setBankName] = useState('');
const [accountNumber, setAccountNumber] = useState('');
const [accountName, setAccountName] = useState('');

// Save and Continue
await barberOnboardingService.saveProgress('payout', {
  bankName,
  accountNumber,
  accountName,
});
router.push('/onboarding/barber/review');
```

---

### 5. Review & Submit Screen
**File:** `apps/partner/app/onboarding/barber/review.tsx`

**Purpose:** Show summary of all data before final submission

**Sections:**
1. **Basic Info** (bio, experience, specializations)
2. **Identity** (IC number, documents uploaded ✓)
3. **Service Details** (radius, hours, portfolio count, base price)
4. **Payout** (bank, account number masked, account name)

**Actions:**
- Edit buttons for each section → go back to that step
- Terms & Conditions checkbox
- Submit button

**On Submit:**
```typescript
const { user } = useAuth();
const progress = await barberOnboardingService.getProgress();

const result = await barberOnboardingService.submitOnboarding(user.id, progress);

if (result.success) {
  // Clear progress
  // Navigate to pending approval screen
  router.replace('/pending-approval');
} else {
  Alert.alert('Submission Failed', result.error);
}
```

**Important:**
- Must accept terms before submitting
- Show loading spinner during submission
- On success: sets `verification_status = 'pending'` in database
- Then shows "Under Review" screen

---

## 📁 File Structure Summary

```
apps/partner/app/onboarding/barber/
├── basic-info.tsx        ✅ Done
├── ekyc.tsx              ✅ Done
├── service-details.tsx   ⏳ To build
├── payout.tsx            ⏳ To build
└── review.tsx            ⏳ To build
```

---

## 🎨 UI/UX Consistency

All screens should follow the same pattern:

### Header
```typescript
<View style={styles.header}>
  <TouchableOpacity onPress={() => router.back()}>
    <Ionicons name="arrow-back" size={24} />
  </TouchableOpacity>
  <View style={styles.progressContainer}>
    {/* 5 dots total, show progress */}
    <View style={styles.progressDotCompleted} /> {/* Completed */}
    <View style={styles.progressDotCompleted} />
    <View style={[styles.progressDot, styles.progressActive]} /> {/* Current */}
    <View style={styles.progressDot} /> {/* Upcoming */}
    <View style={styles.progressDot} />
  </View>
  <View style={{ width: 40 }} />
</View>
```

### Footer Button
```typescript
<View style={styles.footer}>
  <TouchableOpacity
    style={[styles.continueButton, loading && styles.continueButtonDisabled]}
    onPress={handleContinue}
    disabled={loading}
  >
    {loading ? (
      <ActivityIndicator color="#fff" />
    ) : (
      <>
        <Text style={styles.continueButtonText}>
          {isLastStep ? 'Submit' : 'Continue'}
        </Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </>
    )}
  </TouchableOpacity>
</View>
```

### Colors
- Primary: `#4CAF50` (green)
- Text: `#1a1a1a` (dark)
- Secondary Text: `#666` (gray)
- Border: `#e0e0e0` (light gray)
- Background: `#fff` (white)
- Input Background: `#fafafa` (off-white)
- Error: `#f44336` (red)

---

## 🧪 Testing Checklist

### For Each Screen:
- [ ] Form validation works
- [ ] Progress saves to AsyncStorage
- [ ] Can navigate back without losing data
- [ ] Required field indicators show
- [ ] Error messages are clear
- [ ] Loading states work
- [ ] Can resume after app close

### Full Flow:
- [ ] Complete all 5 steps
- [ ] Data persists between steps
- [ ] Review screen shows correct data
- [ ] Submit updates database
- [ ] verification_status becomes 'pending'
- [ ] Redirects to pending approval screen

---

## 🚀 Next Steps

**Option 1: Build individually**
Say "Create service-details screen" and I'll generate the full code.

**Option 2: Build all at once**
Say "Create all remaining barber screens" and I'll create all 3 files.

**Option 3: Start with one, test, then continue**
Build service-details → test → then payout → test → then review

---

## 💡 Pro Tips

1. **Image Uploads**: Use the same pattern as eKYC screen
2. **Time Pickers**: Use `@react-native-community/datetimepicker`
3. **Slider**: Use `@react-native-community/slider` for radius
4. **Dropdown**: Use `react-native-picker-select` for banks
5. **Validation**: Validate on blur + before Continue
6. **Error Handling**: Always show user-friendly messages

---

## 🔗 Related Files

- Onboarding Service: `packages/shared/services/onboardingService.ts`
- Storage Service: `packages/shared/services/storageService.ts` (for uploads)
- Database Types: `packages/shared/types/database.ts`
- Auth Hook: `packages/shared/hooks/useAuth.ts`

---

**Ready to continue? Just tell me which screen to build next!** 🎯
