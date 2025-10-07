# Mari Gunting Design System - Quick Reference

> **Print this or keep it handy while coding!**

---

## 🎨 Colors

```typescript
import { COLORS } from '@/shared/constants';

// Brand
COLORS.primary           // #00B14F (Green)
COLORS.secondary         // #1E293B (Dark gray)

// Status
COLORS.success           // #10B981
COLORS.error             // #EF4444
COLORS.warning           // #F59E0B

// Text
COLORS.text.primary      // #111827
COLORS.text.secondary    // #6B7280
COLORS.text.inverse      // #FFFFFF

// Background
COLORS.background.primary    // #FFFFFF
COLORS.background.secondary  // #F9FAFB

// Helpers
getStatusColor(status)
getStatusBackground(status)
```

---

## 📝 Typography

```typescript
import { TYPOGRAPHY } from '@/shared/constants';

// Headings
...TYPOGRAPHY.heading.h1  // 32px
...TYPOGRAPHY.heading.h2  // 24px
...TYPOGRAPHY.heading.h3  // 20px

// Body
...TYPOGRAPHY.body.large   // 16px
...TYPOGRAPHY.body.regular // 14px
...TYPOGRAPHY.body.small   // 12px
```

---

## 📏 Spacing

```typescript
import { SPACING } from '@/shared/constants';

SPACING.sm   // 8px
SPACING.md   // 12px
SPACING.lg   // 16px ← Most common
SPACING.xl   // 20px
SPACING.xxl  // 24px
```

---

## 🔘 Border Radius

```typescript
import { RADIUS } from '@/shared/constants';

RADIUS.md   // 12px (buttons)
RADIUS.lg   // 16px (cards)
RADIUS.full // 999px (avatars)
```

---

## 🧩 Components

### Button
```typescript
import { Button } from '@/components-shared';

<Button title="Submit" onPress={handlePress} />
<Button title="Cancel" variant="secondary" />
<Button title="More" variant="outline" />
<Button loading={isLoading} />
<Button disabled />
<Button fullWidth />
```

### Card
```typescript
import { Card } from '@/components-shared';

<Card>
  <Text>Content</Text>
</Card>

<Card padding="large">...</Card>
<Card elevated={false}>...</Card>
```

### StatusBadge
```typescript
import { StatusBadge } from '@/components-shared';

<StatusBadge status="completed" />
<StatusBadge status="pending" size="small" />
```

### EmptyState
```typescript
import { EmptyState } from '@/components-shared';

<EmptyState 
  title="No Data"
  description="Nothing here yet"
  actionLabel="Add Item"
  onAction={handleAdd}
/>
```

---

## ⚡ TouchableOpacity

```typescript
import { ACTIVE_OPACITY } from '@/shared/constants';

<TouchableOpacity 
  activeOpacity={ACTIVE_OPACITY.PRIMARY}
  onPress={handlePress}
>
```

---

## ⏱️ Animations

```typescript
import { ANIMATION_DURATION } from '@/shared/constants';

Animated.timing(fadeAnim, {
  duration: ANIMATION_DURATION.NORMAL, // 200ms
  useNativeDriver: true,
}).start();
```

---

## 📦 Import Pattern

```typescript
// Design tokens
import { 
  COLORS, 
  TYPOGRAPHY, 
  SPACING, 
  RADIUS 
} from '@/shared/constants';

// Components
import { 
  Button, 
  Card, 
  StatusBadge, 
  EmptyState 
} from '@/components-shared';

// Other shared items
import { api } from '@/services/api';
import { useStore } from '@/store/useStore';
import { Booking } from '@/types';
```

---

## ✅ Do's

```typescript
// ✅ Use constants
padding: SPACING.lg
fontSize: TYPOGRAPHY.heading.h2.fontSize
backgroundColor: COLORS.primary

// ✅ Use components
<Button title="Submit" />
<StatusBadge status="completed" />

// ✅ Use helpers
getStatusColor(booking.status)
```

---

## ❌ Don'ts

```typescript
// ❌ Magic numbers
padding: 16
fontSize: 24

// ❌ Hardcoded colors
color: '#00B14F'
backgroundColor: '#EF4444'

// ❌ Recreate components manually
// Don't write TouchableOpacity + styling
// Use <Button /> instead
```

---

## 📚 Full Documentation

- **Complete Guide:** `DESIGN_SYSTEM_GUIDE.md` (634 lines)
- **Consistency Report:** `DESIGN_CONSISTENCY_REPORT.md`
- **Summary:** `DESIGN_IMPROVEMENTS_COMPLETE.md`

---

**Last Updated:** 2025-10-07
