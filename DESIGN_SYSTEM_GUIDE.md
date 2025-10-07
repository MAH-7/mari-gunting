# Mari Gunting Design System Usage Guide

**Version:** 2.0  
**Last Updated:** 2025-10-07  
**Status:** Production-Ready ✅

---

## 🎨 Overview

Mari Gunting uses a **centralized design system** to ensure perfect consistency across Customer and Provider apps. All design tokens (colors, typography, spacing, etc.) and reusable components are shared via `packages/shared/`.

---

## 📦 Installation & Setup

Both apps already have symlinks to shared packages:

```bash
apps/customer/
  ├── shared -> ../../packages/shared
  ├── constants -> ../../packages/shared/constants
  ├── components-shared -> ../../packages/shared/components
  └── ... other symlinks

apps/partner/
  ├── shared -> ../../packages/shared
  ├── constants -> ../../packages/shared/constants
  ├── components-shared -> ../../packages/shared/components
  └── ... other symlinks
```

**No additional setup needed!** Just import and use.

---

## 🎯 Design Tokens

### Importing Design Tokens

```typescript
// ✅ Recommended: Import all from one place
import { 
  COLORS, 
  TYPOGRAPHY, 
  SPACING, 
  RADIUS,
  ACTIVE_OPACITY,
  ANIMATION_DURATION 
} from '@/shared/constants';

// ❌ Don't: Import from individual files
import { COLORS } from '@/shared/constants/colors';
import { TYPOGRAPHY } from '@/shared/constants/typography';
```

---

### Colors

#### Brand Colors
```typescript
COLORS.primary           // #00B14F (Green - main brand color)
COLORS.primaryDark       // #00A043 (Hover/pressed states)
COLORS.primaryLight      // #F0FDF4 (Light backgrounds)
COLORS.secondary         // #1E293B (Dark gray)
COLORS.secondaryLight    // #334155 (Medium gray)
```

#### Status Colors
```typescript
COLORS.success    // #10B981 (Green)
COLORS.error      // #EF4444 (Red)
COLORS.warning    // #F59E0B (Orange)
COLORS.info       // #3B82F6 (Blue)
```

#### Text Colors
```typescript
COLORS.text.primary    // #111827 (Main text)
COLORS.text.secondary  // #6B7280 (Secondary text)
COLORS.text.tertiary   // #9CA3AF (Disabled/hints)
COLORS.text.disabled   // #D1D5DB (Disabled)
COLORS.text.inverse    // #FFFFFF (On dark backgrounds)
```

#### Background Colors
```typescript
COLORS.background.primary    // #FFFFFF (Main background)
COLORS.background.secondary  // #F9FAFB (Light gray background)
COLORS.background.tertiary   // #F3F4F6 (Lighter gray)
```

#### Border Colors
```typescript
COLORS.border.light   // #E5E7EB
COLORS.border.medium  // #D1D5DB
COLORS.border.dark    // #9CA3AF
```

#### Booking Status Colors
```typescript
COLORS.status.pending       // #F59E0B (Orange)
COLORS.status.accepted      // #3B82F6 (Blue)
COLORS.status['on-the-way'] // #8B5CF6 (Purple)
COLORS.status['in-progress']// #00B14F (Green)
COLORS.status.completed     // #10B981 (Success green)
COLORS.status.cancelled     // #EF4444 (Red)

// Helper functions
getStatusColor(status)       // Returns text color for status
getStatusBackground(status)  // Returns background color for status
```

**Example Usage:**
```typescript
<View style={{ backgroundColor: COLORS.primary }}>
  <Text style={{ color: COLORS.text.inverse }}>Book Now</Text>
</View>

<View style={{ 
  backgroundColor: getStatusBackground(booking.status)
}}>
  <Text style={{ color: getStatusColor(booking.status) }}>
    {booking.status}
  </Text>
</View>
```

---

### Typography

#### Headings
```typescript
TYPOGRAPHY.heading.h1  // 32px, bold, line-height: 40
TYPOGRAPHY.heading.h2  // 24px, bold, line-height: 32
TYPOGRAPHY.heading.h3  // 20px, semibold, line-height: 28
TYPOGRAPHY.heading.h4  // 18px, semibold, line-height: 24
```

#### Body Text
```typescript
TYPOGRAPHY.body.large   // 16px, regular, line-height: 24
TYPOGRAPHY.body.regular // 14px, regular, line-height: 20
TYPOGRAPHY.body.small   // 12px, regular, line-height: 16
```

#### Labels
```typescript
TYPOGRAPHY.label.large   // 16px, semibold
TYPOGRAPHY.label.regular // 14px, semibold
TYPOGRAPHY.label.small   // 12px, semibold
```

#### Special
```typescript
TYPOGRAPHY.button  // 16px, semibold (for buttons)
TYPOGRAPHY.caption // 11px, medium, uppercase (for small labels)
```

**Example Usage:**
```typescript
const styles = StyleSheet.create({
  title: {
    ...TYPOGRAPHY.heading.h2,
    color: COLORS.text.primary,
  },
  description: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
  },
});
```

---

### Spacing

```typescript
SPACING.xs   // 4px  (tiny gaps)
SPACING.sm   // 8px  (small gaps)
SPACING.md   // 12px (medium gaps)
SPACING.lg   // 16px (large gaps - most common)
SPACING.xl   // 20px (extra large)
SPACING.xxl  // 24px (double extra large)
SPACING.xxxl // 32px (triple extra large)
```

**Example Usage:**
```typescript
const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,      // 16px padding
    gap: SPACING.md,          // 12px gap between children
  },
  card: {
    marginBottom: SPACING.xl, // 20px margin
  },
});
```

---

### Border Radius

```typescript
RADIUS.sm   // 8px  (small - inputs, small buttons)
RADIUS.md   // 12px (medium - buttons)
RADIUS.lg   // 16px (large - cards)
RADIUS.xl   // 20px (extra large)
RADIUS.xxl  // 24px (double extra large)
RADIUS.full // 999px (fully rounded - avatars, pills)
```

**Example Usage:**
```typescript
const styles = StyleSheet.create({
  button: {
    borderRadius: RADIUS.md,  // 12px
  },
  card: {
    borderRadius: RADIUS.lg,  // 16px
  },
  avatar: {
    borderRadius: RADIUS.full, // Fully rounded
  },
});
```

---

### Animations

#### Durations
```typescript
ANIMATION_DURATION.FAST   // 150ms (micro-interactions)
ANIMATION_DURATION.NORMAL // 200ms (default)
ANIMATION_DURATION.MEDIUM // 300ms (screen transitions)
ANIMATION_DURATION.SLOW   // 400ms (attention-grabbing)
```

#### Active Opacity
```typescript
ACTIVE_OPACITY.PRIMARY   // 0.8 (primary buttons)
ACTIVE_OPACITY.SECONDARY // 0.9 (secondary buttons, cards)
ACTIVE_OPACITY.TERTIARY  // 0.95 (subtle interactions)
```

**Example Usage:**
```typescript
<TouchableOpacity 
  activeOpacity={ACTIVE_OPACITY.PRIMARY}
  onPress={handlePress}
>
  <Text>Press Me</Text>
</TouchableOpacity>

// Animated timing
Animated.timing(fadeAnim, {
  duration: ANIMATION_DURATION.NORMAL,
  useNativeDriver: true,
}).start();
```

---

## 🧩 Shared Components

All components are available in `packages/shared/components/`.

### Button Component

**Standard button with multiple variants and states.**

```typescript
import { Button } from '@/components-shared';

// Primary button (default)
<Button 
  title="Book Now"
  onPress={handlePress}
/>

// Secondary button
<Button 
  title="Cancel"
  onPress={handleCancel}
  variant="secondary"
/>

// Outline button
<Button 
  title="Learn More"
  onPress={handleLearnMore}
  variant="outline"
/>

// Ghost button (transparent)
<Button 
  title="Skip"
  onPress={handleSkip}
  variant="ghost"
/>

// With loading state
<Button 
  title="Submitting..."
  onPress={handleSubmit}
  loading={isLoading}
/>

// Disabled
<Button 
  title="Unavailable"
  onPress={handlePress}
  disabled
/>

// Full width
<Button 
  title="Continue"
  onPress={handleContinue}
  fullWidth
/>

// Sizes
<Button title="Small" size="small" onPress={handlePress} />
<Button title="Medium" size="medium" onPress={handlePress} />
<Button title="Large" size="large" onPress={handlePress} />

// With icon
<Button 
  title="Add to Cart"
  icon={<Ionicons name="cart" size={20} color="#fff" />}
  onPress={handleAdd}
/>
```

**Props:**
- `title` (string) - Button text
- `onPress` (function) - Click handler
- `variant` ('primary' | 'secondary' | 'outline' | 'ghost') - Visual style
- `size` ('small' | 'medium' | 'large') - Button size
- `loading` (boolean) - Show loading spinner
- `disabled` (boolean) - Disable button
- `fullWidth` (boolean) - Stretch to full width
- `icon` (ReactNode) - Optional icon
- `style` (ViewStyle) - Custom container styles
- `textStyle` (TextStyle) - Custom text styles

---

### Card Component

**Standard card wrapper with elevation and padding.**

```typescript
import { Card } from '@/components-shared';

// Default card (medium padding, elevated)
<Card>
  <Text>Card Content</Text>
</Card>

// No padding
<Card padding="none">
  <Image source={...} />
</Card>

// Different padding sizes
<Card padding="small">...</Card>
<Card padding="medium">...</Card>  // Default
<Card padding="large">...</Card>

// Flat card (no elevation)
<Card elevated={false}>
  <Text>Flat Card</Text>
</Card>

// Custom styles
<Card style={{ marginBottom: 16, backgroundColor: '#f0f0f0' }}>
  <Text>Custom Card</Text>
</Card>
```

**Props:**
- `children` (ReactNode) - Card content
- `padding` ('none' | 'small' | 'medium' | 'large') - Padding size
- `elevated` (boolean) - Show shadow/elevation (default: true)
- `style` (ViewStyle) - Custom styles

---

### StatusBadge Component

**Booking status badge with automatic colors.**

```typescript
import { StatusBadge } from '@/components-shared';

// Auto-colored based on status
<StatusBadge status="pending" />
<StatusBadge status="accepted" />
<StatusBadge status="on-the-way" />
<StatusBadge status="in-progress" />
<StatusBadge status="completed" />
<StatusBadge status="cancelled" />

// Custom label
<StatusBadge status="pending" label="Waiting for Barber" />

// Sizes
<StatusBadge status="completed" size="small" />
<StatusBadge status="completed" size="medium" />  // Default
<StatusBadge status="completed" size="large" />

// Custom styles
<StatusBadge 
  status="completed"
  style={{ marginTop: 8 }}
  textStyle={{ fontWeight: 'bold' }}
/>
```

**Props:**
- `status` (BookingStatus | string) - Booking status
- `label` (string) - Custom label (auto-formatted if not provided)
- `size` ('small' | 'medium' | 'large') - Badge size
- `style` (ViewStyle) - Custom container styles
- `textStyle` (TextStyle) - Custom text styles

**Supported Statuses:**
- `pending`, `accepted`, `confirmed`, `ready`, `on-the-way`, `in-progress`, `completed`, `cancelled`

---

### EmptyState Component

**Empty state for lists with optional action button.**

```typescript
import { EmptyState } from '@/components-shared';

// Simple empty state
<EmptyState 
  title="No Bookings Yet"
  description="Your booking history will appear here"
/>

// With custom icon
<EmptyState 
  icon="calendar-outline"
  title="No Appointments Today"
  description="You have no scheduled appointments"
/>

// With action button
<EmptyState 
  icon="add-circle-outline"
  title="No Services Added"
  description="Add your first service to get started"
  actionLabel="Add Service"
  onAction={() => router.push('/add-service')}
/>

// Custom styling
<EmptyState 
  title="No Results"
  style={{ paddingVertical: 100 }}
/>
```

**Props:**
- `icon` (Ionicons name) - Icon to display (default: 'file-tray-outline')
- `title` (string) - Main title
- `description` (string) - Optional description
- `actionLabel` (string) - Action button text
- `onAction` (function) - Action button handler
- `style` (ViewStyle) - Custom container styles

---

## 📝 Best Practices

### ✅ DO

```typescript
// ✅ Use design tokens
const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    backgroundColor: COLORS.background.primary,
    borderRadius: RADIUS.lg,
  },
  title: {
    ...TYPOGRAPHY.heading.h2,
    color: COLORS.text.primary,
  },
});

// ✅ Use shared components
<Button title="Submit" onPress={handleSubmit} />
<StatusBadge status={booking.status} />

// ✅ Use helper functions
<View style={{ backgroundColor: getStatusBackground(status) }}>
  <Text style={{ color: getStatusColor(status) }}>{status}</Text>
</View>

// ✅ Use active opacity constants
<TouchableOpacity activeOpacity={ACTIVE_OPACITY.PRIMARY}>
```

### ❌ DON'T

```typescript
// ❌ Don't use magic numbers
padding: 16,  // Use SPACING.lg instead
fontSize: 24, // Use TYPOGRAPHY.heading.h2.fontSize instead

// ❌ Don't use hardcoded colors
color: '#00B14F',  // Use COLORS.primary instead
backgroundColor: '#EF4444',  // Use COLORS.error instead

// ❌ Don't duplicate component logic
// Create a button manually with TouchableOpacity + styling
// Use <Button /> component instead!

// ❌ Don't use random opacity values
activeOpacity: 0.7  // Use ACTIVE_OPACITY constants
```

---

## 🔄 Migration Guide

### Migrating Existing Code

**Before:**
```typescript
<TouchableOpacity 
  style={{
    backgroundColor: '#00B14F',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 24,
  }}
  activeOpacity={0.8}
  onPress={handlePress}
>
  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
    Book Now
  </Text>
</TouchableOpacity>
```

**After:**
```typescript
<Button 
  title="Book Now"
  onPress={handlePress}
/>
```

---

## 🎨 Design System File Structure

```
packages/shared/
├── constants/
│   ├── colors.ts         # Color palette
│   ├── typography.ts     # Font styles, spacing, radius
│   ├── animations.ts     # Animation timing & configs
│   └── index.ts          # Export all constants
├── components/
│   ├── Button.tsx        # Standardized button
│   ├── Card.tsx          # Card wrapper
│   ├── StatusBadge.tsx   # Status badge
│   ├── EmptyState.tsx    # Empty state component
│   └── index.ts          # Export all components
├── services/
│   ├── api.ts            # API service layer
│   └── mockData.ts       # Mock data
├── store/
│   └── useStore.ts       # Zustand store
├── types/
│   └── index.ts          # TypeScript types
└── utils/
    └── format.ts         # Formatting utilities
```

---

## 🧪 Testing Components

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components-shared';

test('Button calls onPress when clicked', () => {
  const handlePress = jest.fn();
  const { getByText } = render(
    <Button title="Click Me" onPress={handlePress} />
  );
  
  fireEvent.press(getByText('Click Me'));
  expect(handlePress).toHaveBeenCalled();
});
```

---

## 📚 Additional Resources

- **Design Consistency Report:** `DESIGN_CONSISTENCY_REPORT.md`
- **Component Examples:** `apps/customer/` and `apps/partner/` screens
- **TypeScript Types:** `packages/shared/types/index.ts`

---

## 🙋 Questions?

If you're unsure about design decisions:
1. Check this guide first
2. Look at `packages/shared/constants/` for values
3. Check existing screens in Customer/Provider apps
4. Refer to `DESIGN_CONSISTENCY_REPORT.md`

---

**Last Updated:** 2025-10-07 02:18 UTC  
**Maintained by:** Mari Gunting Dev Team
