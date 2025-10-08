# Component Usage Guide

> **Quick reference for using shared components consistently across both apps**

---

## 🚀 Quick Import

```typescript
// Import shared components
import { Button, Card, StatusBadge, EmptyState } from '@/shared/components';

// Import design tokens
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/shared/constants';
```

---

## 🔘 Button Component

### Basic Usage

```typescript
import { Button } from '@/shared/components';

// Primary button (main actions)
<Button 
  title="Book Now" 
  variant="primary" 
  onPress={handleBooking} 
/>

// Secondary button
<Button 
  title="Cancel" 
  variant="secondary" 
  onPress={handleCancel} 
/>

// Outline button (secondary actions)
<Button 
  title="View Details" 
  variant="outline" 
  onPress={handleViewDetails} 
/>

// Ghost button (tertiary actions)
<Button 
  title="Learn More" 
  variant="ghost" 
  onPress={handleLearnMore} 
/>
```

### Sizes

```typescript
<Button title="Small" size="small" onPress={handle} />
<Button title="Medium" size="medium" onPress={handle} />
<Button title="Large" size="large" onPress={handle} />  // Default
```

### States

```typescript
// Loading state (shows spinner)
<Button 
  title="Processing..." 
  loading={true}
  onPress={handleSubmit} 
/>

// Disabled state
<Button 
  title="Unavailable" 
  disabled={true}
  onPress={handleAction} 
/>

// Full width
<Button 
  title="Continue" 
  fullWidth={true}
  onPress={handleContinue} 
/>
```

### Real Examples

```typescript
// Customer App - Booking Confirmation
<Button 
  title="Confirm Booking"
  variant="primary"
  size="large"
  fullWidth
  loading={isSubmitting}
  disabled={!isValid}
  onPress={handleConfirmBooking}
/>

// Partner App - Accept Job
<Button 
  title="Accept Job"
  variant="primary"
  size="large"
  fullWidth
  loading={isAccepting}
  onPress={handleAcceptJob}
/>
```

---

## 📦 Card Component

### Basic Usage

```typescript
import { Card } from '@/shared/components';

// Standard card
<Card>
  <Text>Your content here</Text>
</Card>
```

### Padding Variants

```typescript
// No padding (for custom layouts)
<Card padding="none">
  <Image style={{ width: '100%', height: 200 }} />
  <View style={{ padding: 16 }}>
    <Text>Content with custom padding</Text>
  </View>
</Card>

// Small padding (compact cards)
<Card padding="small">
  <Text>Compact content</Text>
</Card>

// Medium padding (default, most common)
<Card padding="medium">
  <Text>Standard content</Text>
</Card>

// Large padding (spacious cards)
<Card padding="large">
  <Text>Spacious content</Text>
</Card>
```

### Elevation

```typescript
// With shadow (default)
<Card elevated={true}>
  <Text>Card with shadow</Text>
</Card>

// Without shadow (flat card)
<Card elevated={false}>
  <Text>Flat card</Text>
</Card>
```

### Real Examples

```typescript
// Booking Card
<Card padding="medium">
  <View style={{ gap: SPACING.md }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ ...TYPOGRAPHY.label.regular }}>Haircut</Text>
      <StatusBadge status="pending" />
    </View>
    
    <Text style={{ ...TYPOGRAPHY.body.small, color: COLORS.text.secondary }}>
      Tomorrow at 2:00 PM
    </Text>
    
    <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
      <Button title="Cancel" variant="outline" size="small" onPress={handleCancel} />
      <Button title="Reschedule" variant="ghost" size="small" onPress={handleReschedule} />
    </View>
  </View>
</Card>

// Stats Card
<Card>
  <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
    <View style={{ alignItems: 'center' }}>
      <Text style={{ ...TYPOGRAPHY.heading.h2, color: COLORS.primary }}>42</Text>
      <Text style={{ ...TYPOGRAPHY.body.small, color: COLORS.text.secondary }}>Jobs</Text>
    </View>
    <View style={{ alignItems: 'center' }}>
      <Text style={{ ...TYPOGRAPHY.heading.h2, color: COLORS.primary }}>Rp 2.1M</Text>
      <Text style={{ ...TYPOGRAPHY.body.small, color: COLORS.text.secondary }}>Earned</Text>
    </View>
  </View>
</Card>
```

---

## 🏷️ StatusBadge Component

### Basic Usage

```typescript
import { StatusBadge } from '@/shared/components';

// Auto-colored based on status
<StatusBadge status="pending" />
<StatusBadge status="accepted" />
<StatusBadge status="confirmed" />
<StatusBadge status="ready" />
<StatusBadge status="on-the-way" />
<StatusBadge status="in-progress" />
<StatusBadge status="completed" />
<StatusBadge status="cancelled" />
```

### Custom Labels

```typescript
// Override default label
<StatusBadge status="on-the-way" label="Provider Coming" />
<StatusBadge status="in-progress" label="Service Started" />
<StatusBadge status="completed" label="Done ✓" />
```

### Sizes

```typescript
<StatusBadge status="pending" size="small" />
<StatusBadge status="pending" size="medium" />  // Default
<StatusBadge status="pending" size="large" />
```

### Status Colors Reference

| Status | Color | Background | Use Case |
|--------|-------|------------|----------|
| pending | Orange (#F59E0B) | Light Orange | Awaiting action |
| accepted | Blue (#3B82F6) | Light Blue | Confirmed |
| confirmed | Blue (#3B82F6) | Light Blue | Confirmed by customer |
| ready | Purple (#8B5CF6) | Light Purple | Provider ready |
| on-the-way | Purple (#8B5CF6) | Light Purple | Provider traveling |
| in-progress | Green (#00B14F) | Light Green | Service ongoing |
| completed | Green (#10B981) | Light Green | Service done |
| cancelled | Red (#EF4444) | Light Red | Cancelled |

### Real Examples

```typescript
// Booking List Item
<Card>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
    <View>
      <Text style={{ ...TYPOGRAPHY.label.regular }}>John's Barbershop</Text>
      <Text style={{ ...TYPOGRAPHY.body.small, color: COLORS.text.secondary }}>
        Haircut + Beard Trim
      </Text>
    </View>
    <StatusBadge status={booking.status} />
  </View>
</Card>

// Job Card (Partner App)
<Card>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
    <View>
      <Text style={{ ...TYPOGRAPHY.label.regular }}>
        {customerName}
      </Text>
      <Text style={{ ...TYPOGRAPHY.body.small, color: COLORS.text.secondary }}>
        {formatCurrency(totalAmount)}
      </Text>
    </View>
    <StatusBadge 
      status={job.status} 
      label={getJobStatusLabel(job.status)}
      size="medium"
    />
  </View>
</Card>
```

---

## 📭 EmptyState Component

### Basic Usage

```typescript
import { EmptyState } from '@/shared/components';

<EmptyState
  icon="📦"
  title="No Items Found"
  message="There are no items to display"
/>
```

### With Action

```typescript
<EmptyState
  icon="📅"
  title="No Bookings Yet"
  message="You haven't made any bookings. Start by browsing our barbers!"
  actionLabel="Browse Barbers"
  onAction={handleBrowse}
/>
```

### Real Examples

```typescript
// Customer App - Empty Bookings
<EmptyState
  icon="📋"
  title="No Bookings Yet"
  message="Your booking history will appear here once you book a service"
  actionLabel="Find a Barber"
  onAction={() => router.push('/')}
/>

// Partner App - No Jobs
<EmptyState
  icon="💼"
  title="No Jobs Available"
  message="There are no jobs available right now. Check back later!"
/>

// Customer App - No Search Results
<EmptyState
  icon="🔍"
  title="No Results Found"
  message={`No barbers found matching "${searchQuery}". Try a different search.`}
  actionLabel="Clear Search"
  onAction={handleClearSearch}
/>

// Partner App - No Earnings
<EmptyState
  icon="💰"
  title="No Earnings Yet"
  message="Complete your first job to start earning money"
  actionLabel="View Available Jobs"
  onAction={() => router.push('/jobs')}
/>
```

---

## 🎨 Design Tokens Usage

### Colors

```typescript
import { COLORS } from '@/shared/constants';

// Text colors
<Text style={{ color: COLORS.text.primary }}>Primary text</Text>
<Text style={{ color: COLORS.text.secondary }}>Secondary text</Text>
<Text style={{ color: COLORS.text.tertiary }}>Tertiary text</Text>

// Background colors
<View style={{ backgroundColor: COLORS.background.primary }}>...</View>
<View style={{ backgroundColor: COLORS.background.secondary }}>...</View>

// Brand colors
<View style={{ backgroundColor: COLORS.primary }}>...</View>
<View style={{ backgroundColor: COLORS.primaryDark }}>...</View>

// Status colors
<View style={{ backgroundColor: COLORS.success }}>...</View>
<View style={{ backgroundColor: COLORS.error }}>...</View>
<View style={{ backgroundColor: COLORS.warning }}>...</View>
```

### Typography

```typescript
import { TYPOGRAPHY } from '@/shared/constants';

// Headings
<Text style={{ ...TYPOGRAPHY.heading.h1 }}>Page Title</Text>
<Text style={{ ...TYPOGRAPHY.heading.h2 }}>Section Title</Text>
<Text style={{ ...TYPOGRAPHY.heading.h3 }}>Subsection</Text>

// Body text
<Text style={{ ...TYPOGRAPHY.body.large }}>Large body text</Text>
<Text style={{ ...TYPOGRAPHY.body.regular }}>Regular body text</Text>
<Text style={{ ...TYPOGRAPHY.body.small }}>Small body text</Text>

// Labels
<Text style={{ ...TYPOGRAPHY.label.regular }}>Field Label</Text>
<Text style={{ ...TYPOGRAPHY.label.small }}>Badge Label</Text>

// Combining with colors
<Text style={{ 
  ...TYPOGRAPHY.heading.h2, 
  color: COLORS.text.primary 
}}>
  Styled Heading
</Text>
```

### Spacing

```typescript
import { SPACING } from '@/shared/constants';

// Padding
<View style={{ padding: SPACING.lg }}>...</View>
<View style={{ 
  paddingHorizontal: SPACING.xl,
  paddingVertical: SPACING.md 
}}>...</View>

// Margin
<View style={{ marginTop: SPACING.xxl }}>...</View>
<View style={{ marginBottom: SPACING.md }}>...</View>

// Gap (for flex layouts)
<View style={{ 
  flexDirection: 'row', 
  gap: SPACING.md 
}}>...</View>
```

### Border Radius

```typescript
import { RADIUS } from '@/shared/constants';

// Components
<View style={{ borderRadius: RADIUS.lg }}>...</View>
<View style={{ borderRadius: RADIUS.md }}>...</View>
<View style={{ borderRadius: RADIUS.full }}>...</View>  // Circular

// Images
<Image 
  source={{ uri: imageUrl }}
  style={{ 
    width: 56, 
    height: 56, 
    borderRadius: RADIUS.md 
  }}
/>
```

---

## 📱 Common Patterns

### List Item with Card

```typescript
<Card padding="medium">
  <View style={{ flexDirection: 'row', gap: SPACING.md }}>
    {/* Avatar */}
    <Image 
      source={{ uri: avatar }}
      style={{ 
        width: 56, 
        height: 56, 
        borderRadius: RADIUS.md 
      }}
    />
    
    {/* Content */}
    <View style={{ flex: 1, gap: SPACING.xs }}>
      <Text style={{ ...TYPOGRAPHY.label.regular, color: COLORS.text.primary }}>
        John Doe
      </Text>
      <Text style={{ ...TYPOGRAPHY.body.small, color: COLORS.text.secondary }}>
        Professional Barber • 4.8 ⭐
      </Text>
    </View>
    
    {/* Badge */}
    <StatusBadge status="available" size="small" />
  </View>
</Card>
```

### Section with Header and Cards

```typescript
<View style={{ gap: SPACING.lg }}>
  {/* Section Header */}
  <View>
    <Text style={{ ...TYPOGRAPHY.heading.h3, color: COLORS.text.primary }}>
      Recent Bookings
    </Text>
    <Text style={{ ...TYPOGRAPHY.body.small, color: COLORS.text.secondary }}>
      Your booking history
    </Text>
  </View>
  
  {/* Cards */}
  {bookings.length > 0 ? (
    bookings.map((booking) => (
      <Card key={booking.id}>
        {/* Card content */}
      </Card>
    ))
  ) : (
    <EmptyState
      icon="📋"
      title="No Bookings"
      message="Your bookings will appear here"
    />
  )}
</View>
```

### Action Sheet Footer

```typescript
<View style={{ 
  padding: SPACING.lg, 
  backgroundColor: COLORS.background.primary,
  borderTopWidth: 1,
  borderTopColor: COLORS.border.light 
}}>
  <Button 
    title="Confirm Action"
    variant="primary"
    size="large"
    fullWidth
    loading={isLoading}
    disabled={!isValid}
    onPress={handleConfirm}
  />
</View>
```

---

## ✅ Best Practices

### DO ✅
- **Always use shared components** instead of creating custom ones
- **Import constants** instead of hard-coding values
- **Use consistent spacing** from SPACING constant
- **Apply proper typography** from TYPOGRAPHY constant
- **Test on both apps** when making changes

### DON'T ❌
- Hard-code colors like `color: '#00B14F'`
- Hard-code spacing like `padding: 16`
- Create duplicate components
- Mix StyleSheet and Tailwind inconsistently
- Skip empty states for lists

---

## 🔍 Quick Checklist

Before committing code, verify:

- [ ] Using shared components from `@/shared/components`
- [ ] Imported constants from `@/shared/constants`
- [ ] No hard-coded colors or spacing
- [ ] Consistent typography applied
- [ ] Empty states included for lists
- [ ] Loading states handled
- [ ] Touch targets minimum 44x44
- [ ] Tested on both iOS and Android

---

## 📚 See Also

- **Full Design System**: `UI_DESIGN_SYSTEM.md`
- **Project Context**: `PROJECT_CONTEXT.md`
- **Common Tasks**: `COMMON_TASKS.md`

---

**Last Updated**: 2025-10-07
**Quick Tip**: When in doubt, check how similar features are implemented in the other app! 🎨
