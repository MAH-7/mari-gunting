# Skeleton Loading Quick Reference
**Visual Guide for Production-Grade Loading States**

---

## 🎯 Decision Tree

```
Is it loading CONTENT (data to display)?
│
├─ YES → Is the layout PREDICTABLE (cards/lists)?
│  │
│  ├─ YES → Will it take >500ms?
│  │  │
│  │  ├─ YES → ✅ USE SKELETON
│  │  └─ NO → Use ActivityIndicator or nothing
│  │
│  └─ NO → Use ActivityIndicator
│
└─ NO → Is it an ACTION (submit/process)?
   │
   └─ YES → ✅ USE SPINNER (in button or modal)
```

---

## 📱 Screen Patterns

### Pattern A: List/Grid Screens
**Use Case**: Browsing barbers, shops, bookings  
**Loading State**: ✅ **SKELETON**

```
┌─────────────────────────────┐
│  Header (always visible)    │
├─────────────────────────────┤
│  ┌─────────────────────────┐│
│  │ [Avatar] [Text Lines]   ││ ← Skeleton Card
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ [Avatar] [Text Lines]   ││ ← Skeleton Card
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ [Avatar] [Text Lines]   ││ ← Skeleton Card
│  └─────────────────────────┘│
└─────────────────────────────┘
```

**Examples**:
- ✅ Barbers List (`app/barbers.tsx`) - **NEEDS THIS**
- ✅ Barbershops List (`app/barbershops.tsx`) - **NEEDS THIS**
- ✅ Bookings List (`app/(tabs)/bookings.tsx`) - **NEEDS THIS**

---

### Pattern B: Detail Screens  
**Use Case**: Profile, shop details, booking details  
**Loading State**: ✅ **SKELETON**

```
┌─────────────────────────────┐
│  [Hero Image Skeleton]      │
├─────────────────────────────┤
│  [Circle] [Text Lines]      │ ← Profile Header
├─────────────────────────────┤
│  [Stat] [Stat] [Stat]       │ ← Stats Row
├─────────────────────────────┤
│  Section Title              │
│  [Content Block Skeleton]   │
├─────────────────────────────┤
│  Section Title              │
│  [Content Block Skeleton]   │
└─────────────────────────────┘
```

**Examples**:
- ✅ Barber Profile (app/barber/[id].tsx) - **DONE PERFECTLY**
- ✅ Barbershop Detail (app/barbershop/[id].tsx) - **DONE PERFECTLY**
- ✅ Booking Detail (app/booking/[id].tsx) - **DONE PERFECTLY**

---

### Pattern C: Action Buttons
**Use Case**: Login, submit forms, confirm bookings  
**Loading State**: ✅ **SPINNER IN BUTTON**

```
┌─────────────────────────────┐
│                             │
│  [Input Field]              │
│  [Input Field]              │
│                             │
│  ┌─────────────────────┐   │
│  │      [spinner]       │   │ ← Button with spinner
│  └─────────────────────┘   │
│                             │
└─────────────────────────────┘
```

**Examples**:
- ✅ Login (`app/login.tsx`) - **CORRECT**
- ✅ OTP Verification (`app/otp-verification.tsx`) - **CORRECT**
- ✅ Quick Book (`app/quick-book.tsx`) - **CORRECT**

---

### Pattern D: Simple/Fast Screens
**Use Case**: Profile, rewards, settings  
**Loading State**: ✅ **SIMPLE SPINNER OR NOTHING**

```
┌─────────────────────────────┐
│                             │
│                             │
│          [spinner]          │ ← Center spinner
│        Loading...           │
│                             │
│                             │
└─────────────────────────────┘
```

**Examples**:
- ✅ Profile (`app/(tabs)/profile.tsx`) - **CORRECT**
- ✅ Rewards (`app/(tabs)/rewards.tsx`) - **CORRECT**
- ✅ Home (`app/(tabs)/index.tsx`) - **CORRECT**

---

## 🎨 Visual Comparison

### ❌ WRONG: Generic Spinner on List Screen
```
┌─────────────────────────────┐
│  Find Barbers               │
├─────────────────────────────┤
│                             │
│                             │
│          🔄                 │ ← Bad UX
│     Loading barbers...      │
│                             │
│                             │
└─────────────────────────────┘
```
**Problem**: User has NO idea what content is coming

---

### ✅ CORRECT: Skeleton on List Screen
```
┌─────────────────────────────┐
│  Find Barbers               │
├─────────────────────────────┤
│  ┌─────────────────────────┐│
│  │ ⚪ ▬▬▬▬▬▬▬            ││ ← Good UX
│  │   ▬▬▬▬ ▬▬▬            ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ ⚪ ▬▬▬▬▬▬▬            ││
│  │   ▬▬▬▬ ▬▬▬            ││
│  └─────────────────────────┘│
└─────────────────────────────┘
```
**Benefit**: User sees content structure, perceives faster load

---

## 📊 Skeleton Count Guide

| Screen Size | Skeleton Count |
|-------------|----------------|
| iPhone SE (small) | 3 cards |
| iPhone 13/14 (medium) | 3-4 cards |
| iPhone 14 Pro Max (large) | 4 cards |
| iPad (tablet) | 6-8 cards (grid) |

**Rule**: Fill viewport without over-rendering

---

## ⚡ Performance Rules

### DO:
```tsx
// ✅ Good: 3-4 skeletons
{[1, 2, 3, 4].map(item => <SkeletonCard key={item} />)}

// ✅ Good: Native driver
<Animated.View style={{ useNativeDriver: true }} />
```

### DON'T:
```tsx
// ❌ Bad: Too many skeletons
{[...Array(20)].map(item => <SkeletonCard />)}

// ❌ Bad: No native driver
<Animated.View style={{ useNativeDriver: false }} />
```

---

## 🔍 Real Examples from Your App

### ✅ PERFECT Example (Use as Template)

**File**: `app/barber/[id].tsx` (lines 31-117)

```tsx
if (isLoading) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Barber Profile</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Profile Header Skeleton */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <SkeletonCircle size={100} />
          </View>
          <View style={styles.profileInfo}>
            <SkeletonText width="60%" height={24} />
            <SkeletonText width="40%" height={16} />
            <SkeletonText width="35%" height={14} />
          </View>
        </View>

        {/* Stats Skeleton */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <SkeletonText width={60} height={28} />
            <SkeletonText width={70} height={14} />
          </View>
          {/* ... more stats */}
        </View>

        {/* Services Skeleton */}
        <View style={styles.section}>
          <SkeletonText width="30%" height={20} />
          <SkeletonBase width="100%" height={80} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

**Why This is Perfect**:
1. ✅ Keeps header visible (navigation)
2. ✅ Matches exact layout of real content
3. ✅ Uses modular skeleton components
4. ✅ No layout shift when data loads
5. ✅ Performance optimized

---

## 🎯 Your 3 Missing Implementations

### 1. Barbers List (`app/barbers.tsx`)

**Replace this** (lines 111-115):
```tsx
{isLoading ? (
  <View style={styles.loadingState}>
    <ActivityIndicator size="large" color="#00B14F" />
    <Text style={styles.loadingText}>Finding barbers...</Text>
  </View>
)
```

**With this**:
```tsx
{isLoading ? (
  <>
    {[1, 2, 3, 4].map((item) => (
      <View key={item} style={styles.card}>
        <View style={styles.cardInner}>
          <SkeletonCircle size={72} />
          <View style={styles.info}>
            <SkeletonText width="60%" height={15} />
            <SkeletonText width="40%" height={13} style={{ marginTop: 6 }} />
            <View style={{ flexDirection: 'row', marginTop: 8, gap: 6 }}>
              <SkeletonBase width={50} height={14} borderRadius={6} />
              <SkeletonBase width={60} height={14} borderRadius={6} />
            </View>
          </View>
        </View>
      </View>
    ))}
  </>
)
```

---

### 2. Barbershops List (`app/barbershops.tsx`)

**Replace this** (lines 184-188):
```tsx
{isLoading ? (
  <View style={styles.loadingState}>
    <ActivityIndicator size="large" color="#00B14F" />
    <Text style={styles.loadingText}>Finding barbershops...</Text>
  </View>
)
```

**With this**:
```tsx
{isLoading ? (
  <>
    {[1, 2, 3, 4].map((item) => (
      <View key={item} style={styles.shopCard}>
        <View style={styles.cardHeader}>
          <SkeletonCircle size={64} />
          <View style={styles.headerInfo}>
            <SkeletonText width="70%" height={16} />
            <SkeletonText width="50%" height={14} style={{ marginTop: 6 }} />
          </View>
        </View>
        <View style={styles.quickInfo}>
          <SkeletonBase width={100} height={32} borderRadius={8} />
          <SkeletonBase width={80} height={32} borderRadius={8} />
        </View>
      </View>
    ))}
  </>
)
```

---

### 3. Bookings List (`app/(tabs)/bookings.tsx`)

**Replace this** (lines 144-148):
```tsx
{isLoading ? (
  <View style={styles.loadingState}>
    <ActivityIndicator size="large" color="#00B14F" />
    <Text style={styles.loadingText}>Loading bookings...</Text>
  </View>
)
```

**With this**:
```tsx
{isLoading ? (
  <>
    {[1, 2, 3].map((item) => (
      <View key={item} style={styles.bookingCard}>
        <View style={styles.statusBar}>
          <SkeletonBase width={100} height={20} borderRadius={10} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.barberRow}>
            <SkeletonCircle size={56} />
            <View style={styles.barberInfo}>
              <SkeletonText width="50%" height={18} />
              <SkeletonText width="40%" height={14} style={{ marginTop: 6 }} />
            </View>
          </View>
        </View>
      </View>
    ))}
  </>
)
```

---

## 📝 Implementation Checklist

When adding skeletons to a screen:

- [ ] Import skeleton components at top of file
- [ ] Keep header/navigation visible (don't skeleton the header)
- [ ] Show 3-4 skeleton cards for lists
- [ ] Match skeleton layout to real content exactly
- [ ] Test on different screen sizes
- [ ] Verify no layout shift when data loads
- [ ] Check smooth 60fps animation

---

## 🚀 Quick Reference Table

| Screen Type | Use | Don't Use | Example |
|-------------|-----|-----------|---------|
| **List/Grid** | ✅ Skeleton | ❌ Spinner | Barbers, Shops, Bookings |
| **Detail Page** | ✅ Skeleton | ❌ Spinner | Profile, Shop Detail |
| **Action Button** | ✅ Spinner | ❌ Skeleton | Login, Submit, Confirm |
| **Simple/Fast** | ✅ Spinner or Nothing | ❌ Skeleton | Profile, Settings |
| **Modal Process** | ✅ Spinner | ❌ Skeleton | Quick Book Search |

---

## 💡 Pro Tips

1. **Copy existing patterns** - Your barber profile skeleton is perfect, reuse that pattern
2. **Test on slow 3G** - Skeletons should show immediately
3. **Count carefully** - 3-4 items is the sweet spot
4. **Match exactly** - Skeleton should look like "empty version" of real content
5. **Keep it simple** - Don't over-engineer, follow the existing pattern

---

**Need Help?** Check these perfect examples in your codebase:
- `/app/barber/[id].tsx` ⭐⭐⭐
- `/app/barbershop/[id].tsx` ⭐⭐⭐
- `/app/booking/[id].tsx` ⭐⭐⭐
