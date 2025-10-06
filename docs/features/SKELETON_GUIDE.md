# Skeleton Loading System - Complete Guide

## Overview

The Skeleton loading system provides professional loading states across all screens using animated placeholders that match the final content structure. This improves perceived performance and user experience during data fetching.

### Components (6 total)

Located in `components/Skeleton/`:
1. **SkeletonBase** - Foundation component with shimmer animation
2. **SkeletonText** - Text line placeholders
3. **SkeletonCircle** - Avatar/icon placeholders
4. **SkeletonImage** - Image placeholders
5. **SkeletonCard** - Complete card placeholders
6. **index.tsx** - Exports all components

---

## Core Component: SkeletonBase

### Features
- **Shimmer animation**: Smooth left-to-right shimmer effect
- **Customizable**: Width, height, border radius
- **60fps animation**: Uses native driver
- **Loop animation**: Continuous shimmer (1.2s cycle)
- **Opacity pulse**: 0.3 → 1 → 0.3

### Props
```typescript
interface SkeletonBaseProps {
  width?: number | string;   // Default: '100%'
  height?: number | string;  // Default: 20
  borderRadius?: number;     // Default: 8
  style?: ViewStyle;         // Additional styles
}
```

### Usage
```typescript
import { SkeletonBase } from '@/components/Skeleton';

<SkeletonBase width={200} height={20} borderRadius={4} />
<SkeletonBase width="80%" height={16} />
<SkeletonBase width={100} height={100} borderRadius={50} />
```

### Animation Implementation
```typescript
const shimmerAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  const shimmer = Animated.loop(
    Animated.sequence([
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(shimmerAnim, {
        toValue: 0,
        duration: 1200,
        useNativeDriver: true,
      }),
    ])
  );
  shimmer.start();
  return () => shimmer.stop();
}, []);
```

---

## Component: SkeletonText

Text line placeholders with common presets.

### Props
```typescript
interface SkeletonTextProps {
  width?: number | string;
  variant?: 'title' | 'subtitle' | 'body' | 'caption';
  lines?: number;  // Multiple lines
}
```

### Variants
- **title**: Height 24, bold look
- **subtitle**: Height 18
- **body**: Height 16 (default)
- **caption**: Height 12

### Usage
```typescript
import { SkeletonText } from '@/components/Skeleton';

<SkeletonText variant="title" width="60%" />
<SkeletonText variant="body" width="100%" lines={3} />
<SkeletonText variant="caption" width={120} />
```

---

## Component: SkeletonCircle

Circular placeholders for avatars and icons.

### Props
```typescript
interface SkeletonCircleProps {
  size: number;  // Diameter in pixels
}
```

### Common Sizes
- **32px**: Small avatar
- **48px**: Medium avatar
- **64px**: Large avatar
- **96px**: Profile picture

### Usage
```typescript
import { SkeletonCircle } from '@/components/Skeleton';

<SkeletonCircle size={48} />  // Avatar
<SkeletonCircle size={24} />  // Icon
```

---

## Component: SkeletonImage

Rectangle placeholders for images with aspect ratios.

### Props
```typescript
interface SkeletonImageProps {
  width: number | string;
  height: number;
  borderRadius?: number;
}
```

### Usage
```typescript
import { SkeletonImage } from '@/components/Skeleton';

<SkeletonImage width="100%" height={200} borderRadius={12} />
<SkeletonImage width={150} height={150} borderRadius={8} />
```

---

## Component: SkeletonCard

Complete card skeleton matching your card designs.

### Props
```typescript
interface SkeletonCardProps {
  variant: 'barber' | 'barbershop' | 'booking' | 'service';
  style?: ViewStyle;
}
```

### Variants

#### 1. Barber Card
```
┌─────────────────────────────────┐
│ ●●  ████████            ⭐ 4.8 │  Avatar + Name + Rating
│     ████ ████                   │  Location + Distance
│     📍 2.3 km                   │  
│ ─────────────────────────────── │
│ ████████  ████████  ████████   │  Services chips
└─────────────────────────────────┘
```

#### 2. Barbershop Card
```
┌─────────────────────────────────┐
│ ████████████████████████████   │  Image
│                                  │
│ ████████                        │  Shop name
│ ████ ████ 🕐 Open  📍 2.5 km  │  Info row
│ ─────────────────────────────── │
│ 4 Barbers • 12 Services         │  Stats
└─────────────────────────────────┘
```

#### 3. Booking Card
```
┌─────────────────────────────────┐
│ [●] Pending                     │  Status badge
│                                  │
│ ●●  ████████                    │  Barber info
│     ████████                    │
│ ─────────────────────────────── │
│ Service: ████████               │  Details
│ Date: ████████                  │
│ Total: RM ████                  │
└─────────────────────────────────┘
```

#### 4. Service Card
```
┌─────────────────────────────────┐
│ ████████              RM ████  │  Service + Price
│ ████ min                        │  Duration
└─────────────────────────────────┘
```

### Usage
```typescript
import { SkeletonCard } from '@/components/Skeleton';

<SkeletonCard variant="barber" />
<SkeletonCard variant="barbershop" />
<SkeletonCard variant="booking" />
```

---

## Implementation Patterns

### Pattern 1: List Loading
```typescript
const { data, isLoading } = useQuery(['barbers'], api.getBarbers);

{isLoading ? (
  <View>
    <SkeletonCard variant="barber" />
    <SkeletonCard variant="barber" />
    <SkeletonCard variant="barber" />
  </View>
) : (
  data.map(barber => <BarberCard key={barber.id} barber={barber} />)
)}
```

### Pattern 2: Detail Page Loading
```typescript
{isLoading ? (
  <View>
    <SkeletonImage width="100%" height={200} />
    <SkeletonCircle size={64} style={styles.avatar} />
    <SkeletonText variant="title" width="60%" />
    <SkeletonText variant="body" width="100%" lines={3} />
  </View>
) : (
  <DetailContent data={data} />
)}
```

### Pattern 3: Inline Loading
```typescript
{isLoading ? (
  <SkeletonText width={80} variant="caption" />
) : (
  <Text>{data.count} items</Text>
)}
```

---

## Usage in Screens

### Home Screen (`app/(tabs)/index.tsx`)
```typescript
{barbersQuery.isLoading ? (
  <>
    <SkeletonCard variant="barber" />
    <SkeletonCard variant="barber" />
    <SkeletonCard variant="barber" />
  </>
) : (
  barbers.map(barber => <BarberCard {...barber} />)
)}
```

### Barbershops Screen (`app/barbershops.tsx`)
```typescript
{shopsQuery.isLoading ? (
  <>
    <SkeletonCard variant="barbershop" />
    <SkeletonCard variant="barbershop" />
  </>
) : (
  shops.map(shop => <ShopCard {...shop} />)
)}
```

### Barber Detail (`app/barber/[id].tsx`)
```typescript
{barberQuery.isLoading ? (
  <View>
    <SkeletonImage width="100%" height={250} borderRadius={0} />
    <View style={styles.infoSection}>
      <SkeletonCircle size={80} />
      <SkeletonText variant="title" width="50%" />
      <SkeletonText variant="body" width="80%" />
    </View>
    <View style={styles.servicesSection}>
      <SkeletonCard variant="service" />
      <SkeletonCard variant="service" />
    </View>
  </View>
) : (
  <BarberDetailContent data={barber} />
)}
```

### Bookings Dashboard (`app/(tabs)/bookings.tsx`)
```typescript
{bookingsQuery.isLoading ? (
  <>
    <SkeletonCard variant="booking" />
    <SkeletonCard variant="booking" />
  </>
) : (
  bookings.map(booking => <BookingCard {...booking} />)
)}
```

---

## Styling System

### Colors
- **Base**: `#E5E7EB` (light gray)
- **Shimmer**: `rgba(255, 255, 255, 0.4)` (white overlay)
- **Background**: Transparent or match parent

### Timing
- **Animation duration**: 1200ms (1.2s per cycle)
- **Loop**: Infinite
- **Easing**: Linear (smooth shimmer)

### Best Practices

#### ✅ Do
- Match skeleton to final content structure
- Use same spacing and padding
- Animate continuously while loading
- Clean up animations on unmount
- Use semantic variants (title, body, etc.)

#### ❌ Don't
- Show skeletons for < 300ms (jarring)
- Use different layouts for skeleton vs content
- Animate too fast (< 800ms) or slow (> 1500ms)
- Mix skeleton styles across the app
- Forget to stop animations

---

## Performance

### Optimization Techniques
1. **Native driver**: All animations use native driver (60fps)
2. **Reusable components**: Single SkeletonBase for all
3. **No re-renders**: Animations don't cause parent re-renders
4. **Cleanup**: Animations stopped on unmount
5. **Memoization**: SkeletonCard components memoized

### Memory Management
```typescript
useEffect(() => {
  const shimmer = Animated.loop(...);
  shimmer.start();
  
  return () => {
    shimmer.stop();  // ✅ Always cleanup
  };
}, []);
```

---

## Accessibility

### Considerations
- **Screen readers**: Announce "Loading content"
- **Reduced motion**: Respect system preferences
- **Color contrast**: Sufficient contrast for visibility
- **Semantic meaning**: Clear loading state indication

### Implementation
```typescript
<View accessible accessibilityLabel="Loading content">
  <SkeletonCard variant="barber" />
</View>
```

---

## Testing Scenarios

### Happy Path
1. ✅ Query starts loading
2. ✅ Skeletons appear immediately
3. ✅ Shimmer animation plays smoothly
4. ✅ Data loads successfully
5. ✅ Content replaces skeletons
6. ✅ No flicker or layout shift

### Edge Cases
1. ✅ Very fast loading (< 300ms) - show skeletons briefly
2. ✅ Very slow loading (> 10s) - continue animating
3. ✅ Error state - replace skeletons with error message
4. ✅ Empty results - replace with empty state
5. ✅ Navigation away - cleanup animations

---

## Customization

### Custom Skeleton Card
```typescript
export const SkeletonCustomCard = () => (
  <View style={styles.card}>
    <View style={styles.header}>
      <SkeletonCircle size={40} />
      <View style={styles.headerInfo}>
        <SkeletonText width="60%" variant="subtitle" />
        <SkeletonText width="40%" variant="caption" />
      </View>
    </View>
    <SkeletonImage width="100%" height={150} borderRadius={8} />
    <View style={styles.footer}>
      <SkeletonText width="100%" variant="body" lines={2} />
    </View>
  </View>
);
```

### Custom Animation
```typescript
// Faster shimmer
const shimmer = Animated.loop(
  Animated.timing(shimmerAnim, {
    toValue: 1,
    duration: 800,  // Faster
    useNativeDriver: true,
  })
);

// Different opacity range
const shimmerOpacity = shimmerAnim.interpolate({
  inputRange: [0, 1],
  outputRange: [0.5, 1],  // Higher minimum
});
```

---

## Future Enhancements

### Possible Additions
- **Skeleton themes**: Dark mode skeletons
- **Custom shimmer colors**: Brand-specific shimmer
- **Pulse animation**: Alternative to shimmer
- **Staggered loading**: Cards appear one by one
- **Progress indicator**: Show loading percentage
- **Skeleton presets**: More card variants

---

## Files Structure

```
components/Skeleton/
├── index.tsx              # Exports all skeletons
├── SkeletonBase.tsx       # Foundation component ⭐
├── SkeletonText.tsx       # Text placeholders
├── SkeletonCircle.tsx     # Avatar placeholders
├── SkeletonImage.tsx      # Image placeholders
└── SkeletonCard.tsx       # Complete card skeletons

Used in:
├── app/(tabs)/index.tsx
├── app/(tabs)/bookings.tsx
├── app/barbershops.tsx
├── app/barbers.tsx
├── app/barber/[id].tsx
└── app/barbershop/[id].tsx
```

---

**Last updated**: 2025-10-06 02:57 UTC

**Status**: Phase 2 Complete - Production-ready system
