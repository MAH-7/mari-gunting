# Mari-Gunting UI Components

Comprehensive documentation for all reusable UI components in the Mari-Gunting shared package.

## Table of Contents
- [Design System](#design-system)
- [Form Components](#form-components)
  - [Button](#button)
  - [Input](#input)
- [Layout Components](#layout-components)
  - [Card](#card)
- [Display Components](#display-components)
  - [Badge](#badge)
  - [Avatar](#avatar)
  - [Rating](#rating)
  - [LoadingSpinner](#loadingspinner)

---

## Design System

The Mari-Gunting design system provides a centralized theme with consistent colors, typography, spacing, and styling across the application.

### Import
```typescript
import { Colors, Typography, Spacing, BorderRadius, Shadow, Layout } from '@mari-gunting/shared';
```

### Colors
- **Primary**: `Colors.primary` - Main brand color (#8B4513)
- **Secondary**: `Colors.secondary` - Secondary brand color
- **Status Colors**: `Colors.success`, `Colors.error`, `Colors.warning`, `Colors.info`
- **Text**: `Colors.text.primary`, `Colors.text.secondary`, `Colors.text.tertiary`
- **Gray Scale**: `Colors.gray[50]` through `Colors.gray[900]`
- **Borders**: `Colors.border.default`, `Colors.border.light`, `Colors.border.dark`

### Typography
```typescript
// Font Sizes
Typography.fontSize.xs      // 12px
Typography.fontSize.sm      // 14px
Typography.fontSize.base    // 16px
Typography.fontSize.lg      // 18px
Typography.fontSize.xl      // 20px
Typography.fontSize['2xl']  // 24px
Typography.fontSize['3xl']  // 30px

// Font Weights
Typography.fontWeight.normal    // '400'
Typography.fontWeight.medium    // '500'
Typography.fontWeight.semibold  // '600'
Typography.fontWeight.bold      // '700'
```

### Spacing
```typescript
Spacing.xs   // 4px
Spacing.sm   // 8px
Spacing.md   // 16px
Spacing.lg   // 24px
Spacing.xl   // 32px
Spacing['2xl'] // 48px
```

### Border Radius
```typescript
BorderRadius.sm    // 4px
BorderRadius.md    // 8px
BorderRadius.lg    // 12px
BorderRadius.xl    // 16px
BorderRadius.full  // 9999px
```

### Shadows
```typescript
Shadow.sm  // Small shadow
Shadow.md  // Medium shadow
Shadow.lg  // Large shadow
```

---

## Form Components

### Button

A versatile button component with multiple variants and states.

#### Import
```typescript
import { Button } from '@mari-gunting/shared';
```

#### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | required | Button text |
| `onPress` | `() => void` | required | Press handler |
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'` | `'primary'` | Button style variant |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Button size |
| `loading` | `boolean` | `false` | Show loading spinner |
| `disabled` | `boolean` | `false` | Disable button |
| `leftIcon` | `React.ReactNode` | - | Icon on the left |
| `rightIcon` | `React.ReactNode` | - | Icon on the right |
| `fullWidth` | `boolean` | `false` | Full width button |
| `style` | `ViewStyle` | - | Custom styles |

#### Usage Examples

```typescript
// Primary button
<Button 
  title="Book Now" 
  onPress={handleBooking} 
/>

// Outline variant
<Button 
  title="Cancel" 
  variant="outline"
  onPress={handleCancel} 
/>

// With loading state
<Button 
  title="Saving..." 
  loading={isLoading}
  disabled={isLoading}
  onPress={handleSave} 
/>

// With icon
<Button 
  title="Add to Cart" 
  leftIcon={<PlusIcon />}
  onPress={handleAddToCart} 
/>

// Full width
<Button 
  title="Continue" 
  fullWidth
  onPress={handleContinue} 
/>
```

---

### Input

A text input component with label, validation, and icon support.

#### Import
```typescript
import { Input } from '@mari-gunting/shared';
```

#### Props
Extends `TextInputProps` from React Native.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Input label |
| `error` | `string` | - | Error message |
| `helperText` | `string` | - | Helper text below input |
| `leftIcon` | `React.ReactNode` | - | Icon on the left |
| `rightIcon` | `React.ReactNode` | - | Icon on the right |
| `required` | `boolean` | `false` | Show required asterisk |
| `disabled` | `boolean` | `false` | Disable input |

#### Usage Examples

```typescript
// Basic input
<Input
  label="Full Name"
  placeholder="Enter your name"
  value={name}
  onChangeText={setName}
/>

// With validation
<Input
  label="Email"
  placeholder="email@example.com"
  value={email}
  onChangeText={setEmail}
  error={emailError}
  required
/>

// Password input with icon
<Input
  label="Password"
  placeholder="Enter password"
  secureTextEntry={!showPassword}
  rightIcon={
    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
      <Icon name={showPassword ? "eye-off" : "eye"} />
    </TouchableOpacity>
  }
/>

// With helper text
<Input
  label="Phone Number"
  placeholder="+62 812 3456 7890"
  helperText="We'll send you a verification code"
  keyboardType="phone-pad"
/>
```

---

## Layout Components

### Card

A container component with elevation, borders, and variants.

#### Import
```typescript
import { Card } from '@mari-gunting/shared';
```

#### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | required | Card content |
| `variant` | `'elevated' \| 'outlined' \| 'flat'` | `'elevated'` | Card style variant |
| `padding` | `'none' \| 'small' \| 'medium' \| 'large'` | `'medium'` | Card padding |
| `onPress` | `() => void` | - | Make card pressable |
| `disabled` | `boolean` | `false` | Disable card press |
| `style` | `ViewStyle` | - | Custom styles |

#### Usage Examples

```typescript
// Basic card with content
<Card>
  <Text>Card Content</Text>
</Card>

// Outlined variant
<Card variant="outlined">
  <Text>Outlined Card</Text>
</Card>

// Pressable card (for list items)
<Card 
  onPress={() => navigation.navigate('Details')}
  padding="large"
>
  <Text>Tap to view details</Text>
</Card>

// No padding (for images)
<Card padding="none">
  <Image source={{ uri: imageUrl }} style={styles.image} />
  <View style={styles.content}>
    <Text>Image with content</Text>
  </View>
</Card>
```

---

## Display Components

### Badge

A badge component for status indicators and labels.

#### Import
```typescript
import { Badge } from '@mari-gunting/shared';
```

#### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | required | Badge text |
| `variant` | `'success' \| 'error' \| 'warning' \| 'info' \| 'neutral'` | `'neutral'` | Badge color variant |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Badge size |
| `style` | `ViewStyle` | - | Custom styles |

#### Usage Examples

```typescript
// Status badges
<Badge label="Open" variant="success" />
<Badge label="Closed" variant="error" />
<Badge label="Pending" variant="warning" />

// Booking status
<Badge 
  label={booking.status} 
  variant={
    booking.status === 'confirmed' ? 'success' :
    booking.status === 'cancelled' ? 'error' : 'warning'
  }
/>

// Small size for compact layouts
<Badge label="New" variant="info" size="small" />
```

---

### Avatar

An avatar component with image support and fallback initials.

#### Import
```typescript
import { Avatar } from '@mari-gunting/shared';
```

#### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `imageUri` | `string` | - | Profile image URL |
| `name` | `string` | - | User name (for initials) |
| `size` | `'small' \| 'medium' \| 'large' \| 'xlarge'` | `'medium'` | Avatar size |
| `style` | `ViewStyle` | - | Custom styles |

#### Usage Examples

```typescript
// With image
<Avatar 
  imageUri={user.profileImage}
  name={user.name}
  size="large"
/>

// Fallback to initials
<Avatar 
  name="John Doe"
  size="medium"
/>

// In a list
<View style={styles.listItem}>
  <Avatar 
    imageUri={barber.profileImage}
    name={barber.name}
    size="small"
  />
  <Text>{barber.name}</Text>
</View>
```

---

### Rating

A star rating display component with review count.

#### Import
```typescript
import { Rating } from '@mari-gunting/shared';
```

#### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rating` | `number` | required | Rating value (0-5) |
| `reviewCount` | `number` | - | Number of reviews |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Rating size |
| `showNumber` | `boolean` | `true` | Show numeric rating |
| `style` | `ViewStyle` | - | Custom styles |

#### Usage Examples

```typescript
// Basic rating
<Rating rating={4.5} />

// With review count
<Rating 
  rating={4.8} 
  reviewCount={127}
/>

// Compact for list items
<Rating 
  rating={barbershop.averageRating}
  reviewCount={barbershop.totalReviews}
  size="small"
/>

// Without numeric rating
<Rating 
  rating={service.rating}
  showNumber={false}
  size="small"
/>
```

---

### LoadingSpinner

A loading spinner component with optional message.

#### Import
```typescript
import { LoadingSpinner } from '@mari-gunting/shared';
```

#### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Spinner size |
| `message` | `string` | - | Loading message |
| `fullScreen` | `boolean` | `false` | Full screen overlay |
| `style` | `ViewStyle` | - | Custom styles |

#### Usage Examples

```typescript
// Basic loading spinner
{isLoading && <LoadingSpinner />}

// With message
<LoadingSpinner 
  message="Loading barbershops..."
  size="large"
/>

// Full screen loading
{isInitialLoading && (
  <LoadingSpinner 
    fullScreen
    message="Initializing app..."
  />
)}

// Inline in content
<View style={styles.container}>
  {isLoading ? (
    <LoadingSpinner size="small" />
  ) : (
    <ContentComponent />
  )}
</View>
```

---

## Best Practices

### 1. Consistent Styling
Always use the design system values instead of hardcoded values:

```typescript
// ✅ Good
<View style={{ padding: Spacing.md, borderRadius: BorderRadius.lg }}>

// ❌ Bad
<View style={{ padding: 16, borderRadius: 12 }}>
```

### 2. Component Composition
Compose components to build complex UIs:

```typescript
<Card onPress={() => navigate('BarbershopDetails', { id })}>
  <View style={styles.header}>
    <Avatar imageUri={barbershop.logo} name={barbershop.name} />
    <View style={styles.info}>
      <Text style={styles.name}>{barbershop.name}</Text>
      <Rating rating={barbershop.rating} reviewCount={barbershop.reviews} size="small" />
    </View>
    <Badge label="Open" variant="success" />
  </View>
  <Text style={styles.address}>{barbershop.address}</Text>
</Card>
```

### 3. Accessibility
Always provide appropriate accessibility props:

```typescript
<Button 
  title="Submit"
  onPress={handleSubmit}
  accessibilityLabel="Submit form"
  accessibilityHint="Submits the current form"
/>
```

### 4. Validation States
Handle all input states properly:

```typescript
<Input
  label="Email"
  value={email}
  onChangeText={setEmail}
  error={errors.email}
  disabled={isSubmitting}
  required
/>
```

### 5. Loading States
Always show loading feedback to users:

```typescript
<Button 
  title={isLoading ? "Processing..." : "Submit"}
  onPress={handleSubmit}
  loading={isLoading}
  disabled={isLoading || !isValid}
/>
```

---

## TypeScript Types

All components are fully typed. Import types when needed:

```typescript
import type { ButtonVariant, InputProps, CardProps } from '@mari-gunting/shared';
```

---

## Testing

Example test for custom usage:

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@mari-gunting/shared';

test('Button handles press', () => {
  const onPress = jest.fn();
  const { getByText } = render(
    <Button title="Click Me" onPress={onPress} />
  );
  
  fireEvent.press(getByText('Click Me'));
  expect(onPress).toHaveBeenCalled();
});
```

---

## Migration from Old Components

If you're using older component versions, here's how to migrate:

### Button Migration
```typescript
// Old
<Button 
  title="Submit"
  onPress={handleSubmit}
  variant="primary"
/>

// New (same API, enhanced features)
<Button 
  title="Submit"
  onPress={handleSubmit}
  variant="primary"
  loading={isLoading}  // New feature
/>
```

### Card Migration
```typescript
// Old
<Card elevated={true} padding="medium">
  {children}
</Card>

// New
<Card variant="elevated" padding="medium">
  {children}
</Card>
```

---

## Support

For issues or questions:
1. Check this documentation
2. Review component source code in `packages/shared/components/`
3. Consult the design system at `packages/shared/theme/`
