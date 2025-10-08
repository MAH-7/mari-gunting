# Mari Gunting - UI Design System

> **Unified design system for Customer and Partner apps**
> 
> This document defines the complete visual language, components, and patterns used across both apps to ensure a consistent user experience.

---

## 🎨 Design Philosophy

Mari Gunting uses a **clean, modern, and accessible design system** inspired by leading marketplace apps (Grab, Foodpanda). Both Customer and Partner apps share the same design DNA to maintain brand consistency.

### Core Principles
1. **Consistency** - Same components, same behavior, same feel
2. **Accessibility** - High contrast, clear typography, proper touch targets
3. **Simplicity** - Clean layouts, minimal cognitive load
4. **Performance** - Optimized for smooth 60fps interactions

---

## 📦 Shared Design Tokens

All design tokens are defined in `packages/shared/constants/` and must be used consistently across both apps.

### Color Palette

#### Brand Colors
```typescript
import { COLORS } from '@/shared/constants';

Primary Green:    #00B14F  // Main brand color (buttons, links, active states)
Primary Dark:     #00A043  // Hover/pressed states
Primary Light:    #F0FDF4  // Backgrounds, subtle highlights
```

#### Status Colors
```typescript
Success:   #10B981  // Completed actions, positive states
Error:     #EF4444  // Errors, cancellations, destructive actions
Warning:   #F59E0B  // Pending, caution states
Info:      #3B82F6  // Informational messages
```

#### Text Colors
```typescript
text.primary:    #111827  // Headings, primary content
text.secondary:  #6B7280  // Supporting text, labels
text.tertiary:   #9CA3AF  // Captions, metadata
text.disabled:   #D1D5DB  // Disabled state text
text.inverse:    #FFFFFF  // Text on dark/colored backgrounds
```

#### Background Colors
```typescript
background.primary:    #FFFFFF  // Main content backgrounds
background.secondary:  #F9FAFB  // Page backgrounds
background.tertiary:   #F3F4F6  // Nested backgrounds, disabled states
```

#### Border Colors
```typescript
border.light:   #E5E7EB  // Subtle borders, dividers
border.medium:  #D1D5DB  // Standard borders
border.dark:    #9CA3AF  // Emphasized borders
```

#### Booking Status Colors
```typescript
pending:      #F59E0B  // Orange - Awaiting action
accepted:     #3B82F6  // Blue - Confirmed by provider
confirmed:    #3B82F6  // Blue - Customer confirmed
ready:        #8B5CF6  // Purple - Provider ready
on-the-way:   #8B5CF6  // Purple - Provider traveling
in-progress:  #00B14F  // Green - Service ongoing
completed:    #10B981  // Green - Service completed
cancelled:    #EF4444  // Red - Cancelled
```

---

### Typography

#### Font Sizes & Weights
```typescript
import { TYPOGRAPHY } from '@/shared/constants';

// Headings
h1: 32px / 700 weight / 40px line-height
h2: 24px / 700 weight / 32px line-height
h3: 20px / 600 weight / 28px line-height
h4: 18px / 600 weight / 24px line-height

// Body Text
large:   16px / 400 weight / 24px line-height
regular: 14px / 400 weight / 20px line-height
small:   12px / 400 weight / 16px line-height

// Labels
large:   16px / 600 weight
regular: 14px / 600 weight
small:   12px / 600 weight

// Buttons
button:  16px / 600 weight

// Captions
caption: 11px / 500 weight / UPPERCASE / 0.5px letter-spacing
```

---

### Spacing

```typescript
import { SPACING } from '@/shared/constants';

xs:   4px   // Tight spacing within components
sm:   8px   // Small gaps, icon spacing
md:   12px  // Standard spacing between related items
lg:   16px  // Section spacing, card padding
xl:   20px  // Large spacing between sections
xxl:  24px  // Extra large spacing
xxxl: 32px  // Screen margins, major sections
```

---

### Border Radius

```typescript
import { RADIUS } from '@/shared/constants';

sm:   8px   // Small elements (badges, tags)
md:   12px  // Standard elements (buttons, inputs)
lg:   16px  // Cards, containers
xl:   20px  // Large cards
xxl:  24px  // Featured sections
full: 999px // Circular elements (avatars, pills)
```

---

## 🧩 Shared Components

All shared components are in `packages/shared/components/` and should be used instead of creating custom variants.

### 1. Button

**Location**: `packages/shared/components/Button.tsx`

```typescript
import { Button } from '@/shared/components';

// Variants
<Button title="Primary" variant="primary" onPress={handlePress} />
<Button title="Secondary" variant="secondary" onPress={handlePress} />
<Button title="Outline" variant="outline" onPress={handlePress} />
<Button title="Ghost" variant="ghost" onPress={handlePress} />

// Sizes
<Button title="Small" size="small" onPress={handlePress} />
<Button title="Medium" size="medium" onPress={handlePress} />
<Button title="Large" size="large" onPress={handlePress} />

// States
<Button title="Loading" loading onPress={handlePress} />
<Button title="Disabled" disabled onPress={handlePress} />
<Button title="Full Width" fullWidth onPress={handlePress} />
```

**Usage Guidelines**:
- Use `primary` for main CTAs (Book Now, Confirm, Submit)
- Use `outline` for secondary actions (Cancel, Back)
- Use `ghost` for tertiary actions (View Details, Learn More)
- Always provide meaningful `title` text
- Handle loading states for async operations

---

### 2. Card

**Location**: `packages/shared/components/Card.tsx`

```typescript
import { Card } from '@/shared/components';

// Standard card with elevation
<Card>
  <Text>Card content</Text>
</Card>

// Padding variants
<Card padding="small">...</Card>
<Card padding="medium">...</Card>
<Card padding="large">...</Card>
<Card padding="none">...</Card>

// Without elevation
<Card elevated={false}>...</Card>
```

**Usage Guidelines**:
- Use for grouped content (bookings, profiles, lists)
- Default `medium` padding is suitable for most cases
- Disable elevation for nested cards
- Maintain consistent spacing inside cards

---

### 3. StatusBadge

**Location**: `packages/shared/components/StatusBadge.tsx`

```typescript
import { StatusBadge } from '@/shared/components';

// Automatic color mapping
<StatusBadge status="pending" />
<StatusBadge status="in-progress" />
<StatusBadge status="completed" />
<StatusBadge status="cancelled" />

// Custom label
<StatusBadge status="on-the-way" label="Provider Coming" />

// Sizes
<StatusBadge status="pending" size="small" />
<StatusBadge status="pending" size="medium" />
<StatusBadge status="pending" size="large" />
```

**Usage Guidelines**:
- Automatically applies correct colors based on status
- Use for booking status, job status, availability
- Status string is auto-formatted (e.g., "on-the-way" → "On The Way")
- Colors match booking status palette

---

### 4. EmptyState

**Location**: `packages/shared/components/EmptyState.tsx`

```typescript
import { EmptyState } from '@/shared/components';

<EmptyState
  icon="📦"
  title="No Bookings Yet"
  message="Your booking history will appear here"
  actionLabel="Browse Barbers"
  onAction={handleBrowse}
/>
```

**Usage Guidelines**:
- Use for empty lists, no results, error states
- Always provide meaningful emoji icon
- Include actionable CTA when appropriate
- Keep messages friendly and helpful

---

## 🎯 Layout Patterns

### Screen Structure

Both apps should follow this consistent screen structure:

```typescript
<SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.secondary }}>
  {/* Header (if needed) */}
  <View style={{ padding: SPACING.lg }}>
    <Text style={{ ...TYPOGRAPHY.heading.h1 }}>Screen Title</Text>
  </View>

  {/* Main Content */}
  <ScrollView
    style={{ flex: 1 }}
    contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.lg }}
  >
    <Card>
      {/* Card content */}
    </Card>
  </ScrollView>

  {/* Fixed Bottom Actions (if needed) */}
  <View style={{ padding: SPACING.lg, backgroundColor: COLORS.background.primary }}>
    <Button title="Primary Action" onPress={handleAction} fullWidth />
  </View>
</SafeAreaView>
```

### Grid System

Use consistent spacing for layouts:

```typescript
// Screen padding
paddingHorizontal: SPACING.lg (16px)
paddingVertical: SPACING.lg (16px)

// Card spacing
gap: SPACING.lg (16px)

// Section spacing
marginTop: SPACING.xl (20px)

// List item spacing
marginBottom: SPACING.md (12px)
```

---

## 📱 Component Patterns

### List Items

```typescript
<Card>
  <View style={{ flexDirection: 'row', gap: SPACING.md }}>
    {/* Avatar/Icon */}
    <View style={{
      width: 56,
      height: 56,
      borderRadius: RADIUS.md,
      backgroundColor: COLORS.background.tertiary
    }} />
    
    {/* Content */}
    <View style={{ flex: 1, gap: SPACING.xs }}>
      <Text style={{ ...TYPOGRAPHY.label.regular }}>Title</Text>
      <Text style={{ ...TYPOGRAPHY.body.small, color: COLORS.text.secondary }}>
        Subtitle
      </Text>
    </View>
    
    {/* Badge/Action */}
    <StatusBadge status="active" />
  </View>
</Card>
```

### Section Headers

```typescript
<View style={{ marginBottom: SPACING.md }}>
  <Text style={{
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary
  }}>
    Section Title
  </Text>
  <Text style={{
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs
  }}>
    Section description
  </Text>
</View>
```

### Stats Display

```typescript
<Card>
  <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
    <View style={{ alignItems: 'center' }}>
      <Text style={{ ...TYPOGRAPHY.heading.h2, color: COLORS.primary }}>
        42
      </Text>
      <Text style={{ ...TYPOGRAPHY.body.small, color: COLORS.text.secondary }}>
        Completed
      </Text>
    </View>
    {/* More stats */}
  </View>
</Card>
```

---

## 🎨 Tailwind Usage

Both apps use NativeWind for Tailwind CSS classes. Use these classes for consistency:

### Colors
```tsx
// Backgrounds
className="bg-white"           // COLORS.background.primary
className="bg-gray-50"         // COLORS.background.secondary
className="bg-gray-100"        // COLORS.background.tertiary
className="bg-green-600"       // COLORS.primary

// Text
className="text-gray-900"      // COLORS.text.primary
className="text-gray-600"      // COLORS.text.secondary
className="text-gray-400"      // COLORS.text.tertiary
className="text-white"         // COLORS.text.inverse

// Borders
className="border-gray-200"    // COLORS.border.light
className="border-gray-300"    // COLORS.border.medium
```

### Spacing
```tsx
className="p-4"    // SPACING.lg (16px)
className="px-6"   // SPACING.xxl (24px)
className="mt-4"   // SPACING.lg (16px)
className="gap-3"  // SPACING.md (12px)
```

### Border Radius
```tsx
className="rounded-lg"   // RADIUS.lg (16px)
className="rounded-xl"   // RADIUS.xl (20px)
className="rounded-full" // RADIUS.full (999px)
```

---

## ✅ Design Consistency Checklist

Use this checklist when adding new features to both apps:

### Before Coding
- [ ] Check if shared component exists before creating custom one
- [ ] Review similar screens in both apps for patterns
- [ ] Confirm color palette matches design system
- [ ] Plan layout using standard spacing values

### During Development
- [ ] Import constants from `@/shared/constants`
- [ ] Use shared components from `@/shared/components`
- [ ] Apply consistent spacing (SPACING values)
- [ ] Use proper typography (TYPOGRAPHY values)
- [ ] Test on both iOS and Android

### After Coding
- [ ] Verify colors match both apps
- [ ] Check spacing consistency
- [ ] Confirm touch targets (minimum 44x44)
- [ ] Test loading and error states
- [ ] Verify accessibility (contrast, labels)

---

## 🔄 Cross-App Consistency Rules

### DO ✅
- Use shared components from `packages/shared/components`
- Import colors from `COLORS` constant
- Import spacing from `SPACING` constant
- Import typography from `TYPOGRAPHY` constant
- Keep similar screens looking identical
- Use same icons/emojis for same concepts
- Maintain consistent navigation patterns

### DON'T ❌
- Hard-code colors in components
- Create duplicate components in each app
- Use inconsistent spacing values
- Mix StyleSheet and Tailwind randomly
- Create custom variants without updating shared
- Use different button styles for same actions
- Deviate from established patterns

---

## 📐 Tailwind Configuration

Both apps must have identical Tailwind configurations. Update both:
- `apps/customer/tailwind.config.js`
- `apps/partner/tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Match COLORS constant from shared
        primary: {
          DEFAULT: '#00B14F',
          dark: '#00A043',
          light: '#F0FDF4',
        },
        secondary: {
          DEFAULT: '#1E293B',
          light: '#334155',
        },
      },
      spacing: {
        // Match SPACING constant
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        'xxl': '24px',
        'xxxl': '32px',
      },
      borderRadius: {
        // Match RADIUS constant
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        'xxl': '24px',
      },
    },
  },
  plugins: [],
}
```

---

## 🎭 App-Specific Customizations

While both apps share the same design system, some app-specific customizations are allowed:

### Customer App Specifics
- Focus on browsing and discovery
- Emphasis on visual appeal (photos, reviews)
- More detailed product information
- Customer-centric language ("Book Now", "My Bookings")

### Partner App Specifics
- Focus on efficiency and task management
- Emphasis on actionable items (jobs, earnings)
- More data-dense layouts acceptable
- Provider-centric language ("Accept Job", "Complete Service")

### Shared Across Both
- Same color palette
- Same typography scale
- Same component library
- Same spacing system
- Same interaction patterns
- Same loading/error states

---

## 🚀 Quick Start

### For New Components

1. **Check shared components first**:
   ```typescript
   import { Button, Card, StatusBadge, EmptyState } from '@/shared/components';
   ```

2. **Import design tokens**:
   ```typescript
   import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/shared/constants';
   ```

3. **Use consistent patterns**:
   ```typescript
   <Card>
     <Text style={{ ...TYPOGRAPHY.heading.h3 }}>Title</Text>
     <Text style={{ ...TYPOGRAPHY.body.regular, color: COLORS.text.secondary }}>
       Description
     </Text>
     <Button title="Action" variant="primary" onPress={handlePress} />
   </Card>
   ```

### For New Screens

1. Follow standard screen structure (SafeAreaView → ScrollView → Cards)
2. Use consistent padding (SPACING.lg for screen edges)
3. Maintain consistent gap between elements
4. Include empty states for lists
5. Handle loading states with skeletons
6. Show meaningful error messages

---

## 📚 Resources

### Documentation Files
- `DESIGN_SYSTEM_GUIDE.md` - This file
- `packages/shared/components/README.md` - Component documentation
- `COMMON_TASKS.md` - Quick reference for common UI tasks

### Code Locations
- **Shared Components**: `packages/shared/components/`
- **Design Tokens**: `packages/shared/constants/`
- **Tailwind Configs**: `apps/*/tailwind.config.js`

### Testing
- **Customer App**: `cd apps/customer && npm start`
- **Partner App**: `cd apps/partner && npm start`
- **Visual Comparison**: Run both apps simultaneously to compare UI

---

## 🎯 Summary

**Key Takeaways**:
1. Both apps share the same design system
2. Use shared components instead of custom ones
3. Import constants instead of hard-coding values
4. Follow established patterns for consistency
5. Test changes in both apps when modifying shared code

**Remember**: Consistency creates trust. Users should feel at home in both apps! 🎨✨

---

**Last Updated**: 2025-10-07
**Maintained By**: Mari Gunting Development Team
