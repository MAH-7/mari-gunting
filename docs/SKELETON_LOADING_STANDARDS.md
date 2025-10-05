# Skeleton Loading Standards - Mari Gunting
> Production-Grade Guidelines for Consistent Loading UX

## Overview
This document defines when and how to use skeleton loaders vs other loading indicators in the Mari Gunting app, following Grab's production standards for enterprise-grade mobile applications.

---

## Core Principles

### 1. **Skeleton Loaders = Content Placeholders**
Use skeletons when:
- Loading **structured data** that will replace the skeleton
- The UI has a **predictable layout** (cards, lists, grids)
- Loading takes **>500ms** and user expects to see content
- Improves **perceived performance** significantly

### 2. **Activity Indicators = Process Feedback**
Use spinners when:
- **Actions/operations** in progress (submitting forms, processing payments)
- **Short waits** (<500ms expected)
- **Modal/overlay** scenarios where layout doesn't exist yet
- **Unpredictable** content structure

### 3. **No Loading Indicator**
Don't show any loading when:
- **Instant** (<100ms) operations
- **Background** data refresh (use pull-to-refresh instead)
- **Optimistic updates** (show immediately, sync in background)

---

## Screen-by-Screen Standards

### ✅ MUST USE SKELETONS

#### **Home Screen** (`app/(tabs)/index.tsx`)
- **Current**: Uses `ActivityIndicator` for barbers list
- **Should use**: No skeleton needed - home screen is simple with banners only
- **Recommendation**: ✅ **CURRENT IS CORRECT** - Keep ActivityIndicator
- **Reason**: Home screen doesn't show barber list anymore (removed in latest design)

#### **Barbers List** (`app/barbers.tsx`)
- **Current**: Uses `ActivityIndicator` 
- **Should use**: **BarberCardSkeleton** (horizontal cards)
- **Status**: ❌ **NEEDS SKELETON**
- **Count**: 3-4 skeleton cards
- **Reason**: List of structured cards, predictable layout

#### **Barbershops List** (`app/barbershops.tsx`)
- **Current**: Uses `ActivityIndicator`
- **Should use**: **BarbershopCardSkeleton** (horizontal cards with logo)
- **Status**: ❌ **NEEDS SKELETON**
- **Count**: 3-4 skeleton cards
- **Reason**: List of structured cards, predictable layout

#### **Barber Profile** (`app/barber/[id].tsx`)
- **Current**: ✅ **HAS COMPREHENSIVE SKELETON**
- **Status**: ✅ **PRODUCTION READY**
- **Components**: Profile header, stats, sections, services, photos, reviews preview

#### **Barbershop Detail** (`app/barbershop/[id].tsx`)
- **Current**: ✅ **HAS COMPREHENSIVE SKELETON**
- **Status**: ✅ **PRODUCTION READY**
- **Components**: Hero image, shop info card, stats, address, services, reviews

#### **Booking Detail** (`app/booking/[id].tsx`)
- **Current**: ✅ **HAS COMPREHENSIVE SKELETON**
- **Status**: ✅ **PRODUCTION READY**
- **Components**: Status card, progress timeline, barber info, booking details, payment summary

#### **Bookings List** (`app/(tabs)/bookings.tsx`)
- **Current**: Uses `ActivityIndicator`
- **Should use**: **BookingCardSkeleton** (status bar + content cards)
- **Status**: ❌ **NEEDS SKELETON**
- **Count**: 2-3 skeleton cards
- **Reason**: List of booking cards with structured layout

#### **Barbershop Barbers Selection** (`app/barbershop/barbers/[shopId].tsx`)
- **Current**: ✅ **HAS COMPREHENSIVE SKELETON**
- **Status**: ✅ **PRODUCTION READY**
- **Components**: Barber cards with avatar, info, specializations, pricing

#### **Barber Reviews** (`app/barber/reviews/[id].tsx`)
- **Current**: Uses `ActivityIndicator`
- **Should use**: **ReviewCardSkeleton** (avatar + content)
- **Status**: ⚠️ **CONSIDER SKELETON** (optional - reviews load fast typically)
- **Count**: 3-4 skeleton cards

#### **Barbershop Reviews** (`app/barbershop/reviews/[id].tsx`)
- **Current**: Uses `ActivityIndicator`
- **Should use**: **ReviewCardSkeleton** (avatar + content)
- **Status**: ⚠️ **CONSIDER SKELETON** (optional - reviews load fast typically)
- **Count**: 3-4 skeleton cards

---

### ✅ CORRECT TO USE ACTIVITY INDICATOR

#### **Quick Book** (`app/quick-book.tsx`)
- **Current**: ✅ Uses modal with `ActivityIndicator` during search
- **Status**: ✅ **CORRECT**
- **Reason**: This is a **search/matching process**, not loading content structure

#### **Login** (`app/login.tsx`)
- **Current**: ✅ Uses `ActivityIndicator` on button during API call
- **Status**: ✅ **CORRECT**
- **Reason**: **Action feedback** - sending OTP is a process, not loading content

#### **OTP Verification** (`app/otp-verification.tsx`)
- **Current**: ✅ Uses `ActivityIndicator` on button during verification
- **Status**: ✅ **CORRECT**
- **Reason**: **Action feedback** - verifying OTP is a process

#### **Profile** (`app/(tabs)/profile.tsx`)
- **Current**: ✅ Uses simple loading text (could be better)
- **Status**: ⚠️ **COULD IMPROVE** - Use ActivityIndicator instead of text
- **Reason**: Profile data loads fast, skeleton is overkill

#### **Rewards** (`app/(tabs)/rewards.tsx`)
- **Current**: ✅ No loading state shown (immediate data from store)
- **Status**: ✅ **CORRECT**
- **Reason**: Using local state (Zustand), loads instantly

---

### ❌ SHOULD NOT USE SKELETONS

#### **Payment Method Selection** (if exists)
- **Should use**: Activity Indicator on "Confirm" button
- **Reason**: This is a selection screen, not data loading

#### **Booking Creation/Confirmation**
- **Should use**: Activity Indicator on action buttons
- **Reason**: Creating booking is an action, not loading content

---

## Implementation Guidelines

### Skeleton Component Usage

```tsx
// ✅ CORRECT: Comprehensive skeleton matching real layout
if (isLoading) {
  return (
    <ScrollView>
      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.card}>
          <SkeletonCircle size={64} />
          <View style={styles.content}>
            <SkeletonText width="70%" height={18} style={{ marginBottom: 8 }} />
            <SkeletonText width="50%" height={14} style={{ marginBottom: 8 }} />
            <SkeletonBase width={100} height={32} borderRadius={16} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// ❌ WRONG: Generic skeleton not matching layout
if (isLoading) {
  return <ActivityIndicator />;
}
```

### Activity Indicator Usage

```tsx
// ✅ CORRECT: Action feedback
<TouchableOpacity 
  style={styles.button}
  onPress={handleSubmit}
  disabled={isLoading}
>
  {isLoading ? (
    <ActivityIndicator color="#FFFFFF" size="small" />
  ) : (
    <Text style={styles.buttonText}>Submit</Text>
  )}
</TouchableOpacity>

// ❌ WRONG: List loading with spinner only
{isLoading ? (
  <ActivityIndicator />
) : (
  <FlatList data={items} ... />
)}
```

---

## Skeleton Count Guidelines

| Screen Type | Skeleton Count | Reason |
|-------------|----------------|--------|
| **List Screens** (Barbers, Shops) | 3-4 cards | Fills viewport without excessive rendering |
| **Detail Screens** (Profile, Shop Detail) | Full layout | Match complete page structure |
| **Reviews** | 3-4 cards | Enough to show pattern |
| **Bookings** | 2-3 cards | Bookings are typically fewer |

---

## Performance Considerations

### DO:
- ✅ Render 3-4 skeleton items max for lists
- ✅ Use `useNativeDriver: true` for skeleton animations
- ✅ Match skeleton exactly to real component styles
- ✅ Keep skeleton components simple (avoid nested ScrollViews)

### DON'T:
- ❌ Render 10+ skeleton items (kills performance)
- ❌ Use skeletons for < 500ms load times
- ❌ Add skeletons to screens that load < 100ms
- ❌ Over-animate skeletons (stick to subtle shimmer)

---

## Visual Consistency

### Colors (Match Current Implementation)
```tsx
// Base skeleton background
backgroundColor: '#E5E7EB'

// Shimmer overlay
backgroundColor: 'rgba(255, 255, 255, 0.4)'

// Border radius consistency
borderRadius: 8  // Text, small elements
borderRadius: 12 // Cards, images
borderRadius: 16 // Large cards
```

### Animation Timing
```tsx
// Current standard (DO NOT CHANGE)
duration: 1200ms
useNativeDriver: true
loop: true
```

---

## Migration Priority

### Phase 1: Critical UX Issues (High Priority)
1. ❗ **Barbers List** - Most frequently accessed, needs skeleton
2. ❗ **Barbershops List** - High traffic, needs skeleton
3. ❗ **Bookings List** - Core user flow, needs skeleton

### Phase 2: Nice to Have (Medium Priority)
4. ⚠️ **Profile Screen** - Improve loading state (ActivityIndicator)
5. ⚠️ **Reviews Screens** - Optional skeleton enhancement

### Phase 3: Already Complete ✅
- Barber Profile Detail
- Barbershop Detail
- Booking Detail
- Barbershop Barbers Selection

---

## Testing Checklist

Before marking skeleton implementation as complete:

### Visual Testing
- [ ] Skeleton matches real component layout exactly
- [ ] Skeleton count fills viewport (not too few, not too many)
- [ ] Shimmer animation is smooth (60fps)
- [ ] No layout shift when transitioning from skeleton to real content
- [ ] Works on various screen sizes (iPhone SE to iPad)

### Performance Testing
- [ ] Skeleton renders in < 16ms (60fps)
- [ ] No janky animations during scroll
- [ ] Memory usage stays under 100MB
- [ ] Transitions are smooth without flicker

### Edge Cases
- [ ] Empty states show correctly (no skeleton)
- [ ] Error states don't show skeleton
- [ ] Fast network doesn't cause skeleton "flash"
- [ ] Slow network shows skeleton immediately

---

## Code Review Requirements

When reviewing skeleton implementations:

1. **Layout Match**: Does skeleton match final content layout?
2. **Count**: Are we showing 3-4 items max for lists?
3. **Performance**: Is `useNativeDriver: true`?
4. **Consistency**: Using standard components from `/components/Skeleton`?
5. **Necessity**: Could ActivityIndicator work better here?

---

## Related Files

- Skeleton Components: `/components/Skeleton/`
- Examples: 
  - `/app/barber/[id].tsx` (BEST PRACTICE)
  - `/app/barbershop/[id].tsx` (BEST PRACTICE)
  - `/app/booking/[id].tsx` (BEST PRACTICE)

---

## Questions?

For skeleton-related decisions:
1. Is this **content loading** (skeleton) or **action processing** (spinner)?
2. Will users see this for **>500ms**?
3. Is the layout **predictable**?

If all answers are YES → Use skeleton
If any answer is NO → Use ActivityIndicator

---

**Last Updated**: 2025-01-05
**Maintained by**: Senior Development Team
**Status**: Production Standard v1.0
