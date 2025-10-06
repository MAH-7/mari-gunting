# Filter System - Complete Guide

## Overview

The Filter system provides users with powerful search refinement options across barbershops and barbers listings through a modal interface with smooth animations and intuitive controls.

### Component: `FilterModal.tsx`

A reusable modal component that handles filtering for:
- **Distance** - Radius-based search (0-20 km)
- **Price Range** - Budget, Mid, Premium categories
- **Quick Filters** - Open Now, Verified Only toggles

---

## Features

### 1. Distance Filter
- **Slider control**: 0-20 km range
- **Real-time display**: Shows selected distance in large text
- **Step increment**: 1 km per step
- **Visual feedback**: Green slider with labels

### 2. Price Range Filter
- **4 Categories**:
  - **All**: No price restriction
  - **Budget**: RM 0-20
  - **Mid**: RM 20-40
  - **Premium**: RM 40+
- **Chip-based UI**: Icon + label + price range
- **Active state**: Green background when selected
- **Single selection**: Radio button behavior

### 3. Quick Filters
- **Open Now**: Shows only currently open shops
- **Verified Only**: Shows only verified/trusted shops
- **Toggle switches**: iOS/Android native switches
- **Icons**: Visual indicators for each option

---

## Usage

### Basic Implementation

```typescript
import FilterModal, { FilterOptions } from '@/components/FilterModal';

const [showFilters, setShowFilters] = useState(false);
const [filters, setFilters] = useState<FilterOptions>({
  distance: 20,
  priceRange: 'all',
  openNow: false,
  verifiedOnly: false,
});

const handleApplyFilters = (newFilters: FilterOptions) => {
  setFilters(newFilters);
  // Apply filtering logic here
};

<FilterModal
  visible={showFilters}
  onClose={() => setShowFilters(false)}
  onApply={handleApplyFilters}
  currentFilters={filters}
/>
```

### Props

```typescript
interface FilterModalProps {
  visible: boolean;              // Controls modal visibility
  onClose: () => void;           // Called when modal closes
  onApply: (filters: FilterOptions) => void;  // Called on Apply
  currentFilters: FilterOptions; // Current filter state
}

interface FilterOptions {
  distance: number;              // 0-20 km
  priceRange: 'all' | 'budget' | 'mid' | 'premium';
  openNow: boolean;
  verifiedOnly: boolean;
}
```

---

## Animation System

### Entry Animation (Modal opens)
1. **Backdrop fade-in**: 0 → 1 opacity (300ms)
2. **Slide-up**: From bottom with spring animation
   - Damping: 15
   - Stiffness: 150
   - Natural bounce effect

### Exit Animation (Modal closes)
1. **Backdrop fade-out**: 1 → 0 opacity (200ms)
2. **Slide-down**: To bottom (250ms)

### Animation Config
```typescript
MODAL_ANIMATION = {
  BACKDROP_FADE_IN: 300,
  BACKDROP_FADE_OUT: 200,
  SLIDE_DURATION: 250,
  SPRING: {
    damping: 15,
    stiffness: 150,
  },
}
```

---

## UI Components Breakdown

### Header
- **Title**: "Filters"
- **Close button**: X icon (tap to close)
- **Border**: Bottom separator line
- **Padding**: 24px horizontal, 20px vertical

### Distance Section
```
[Icon] Distance
  
  20 km
  Maximum distance from you
  
  [═════●═════] Slider
  
  0 km          20 km
```

### Price Range Section
```
[Icon] Price Range
Based on starting price

[All]  [Budget]  [Mid]  [Premium]
       RM 0-20   RM 20-40  RM 40+
```

### Quick Filters Section
```
[Icon] Quick Filters

[🕐 Icon] Open Now                    [Toggle]
          Show only open barbershops

[🛡️ Icon] Verified Only               [Toggle]
          Trusted & verified shops
```

### Footer
```
[Reset Button]         [Apply Filters Button]
   (1/3 width)              (2/3 width)
```

---

## Styling

### Colors
- **Primary**: `#00B14F` (Green - Mari Gunting brand)
- **Active chip**: `#00B14F` background
- **Inactive border**: `#E5E7EB`
- **Text**: `#111827` (dark), `#6B7280` (medium)
- **Background**: `#FFFFFF`
- **Backdrop**: `rgba(0, 0, 0, 0.5)`

### Dimensions
- **Max height**: 85% of screen
- **Border radius**: 24px (top corners)
- **Section spacing**: 32px bottom margin
- **Slider height**: 40px
- **Toggle icon size**: 40x40px circle

### Shadows
```typescript
shadowColor: '#000',
shadowOffset: { width: 0, height: -4 },
shadowOpacity: 0.1,
shadowRadius: 12,
elevation: 8,
```

---

## Filter Logic Implementation

### Distance Filtering
```typescript
const filteredByDistance = items.filter(item => {
  const distance = calculateDistance(
    userLocation.lat,
    userLocation.lng,
    item.location.lat,
    item.location.lng
  );
  return distance <= filters.distance;
});
```

### Price Range Filtering
```typescript
const filteredByPrice = items.filter(item => {
  const startingPrice = Math.min(...item.services.map(s => s.price));
  
  switch (filters.priceRange) {
    case 'budget':
      return startingPrice <= 20;
    case 'mid':
      return startingPrice > 20 && startingPrice <= 40;
    case 'premium':
      return startingPrice > 40;
    case 'all':
    default:
      return true;
  }
});
```

### Quick Filters
```typescript
let filtered = items;

if (filters.openNow) {
  filtered = filtered.filter(item => item.isOpen);
}

if (filters.verifiedOnly) {
  filtered = filtered.filter(item => item.isVerified);
}
```

---

## Usage in Screens

### Barbershops Screen (`app/barbershops.tsx`)
```typescript
// State
const [showFilters, setShowFilters] = useState(false);
const [filters, setFilters] = useState<FilterOptions>({...});

// Apply filters to barbershops list
const filteredShops = useMemo(() => {
  return applyFilters(barbershops, filters);
}, [barbershops, filters]);

// Render
<FilterModal
  visible={showFilters}
  onClose={() => setShowFilters(false)}
  onApply={setFilters}
  currentFilters={filters}
/>
```

### Barbers Screen (`app/barbers.tsx`)
- Same implementation pattern
- Applies to freelance barbers list
- Distance calculated from user's location

---

## Reset Functionality

The **Reset** button restores default filter values:

```typescript
const handleReset = () => {
  setDistance(20);        // Max distance
  setPriceRange('all');   // All prices
  setOpenNow(false);      // Don't filter by open status
  setVerifiedOnly(false); // Don't filter by verification
};
```

**Note**: Reset does NOT auto-apply - user must tap "Apply Filters"

---

## State Management

### Local State (Within Modal)
- Distance slider value
- Selected price range
- Toggle states
- Animation values

### Parent State (Screen)
- Current applied filters
- Visibility boolean
- Filtered results

### State Flow
```
Parent Screen
    ↓ (pass currentFilters)
FilterModal (local state for UI)
    ↓ (on Apply button)
onApply callback with new filters
    ↓
Parent updates filters state
    ↓
Re-renders with filtered results
```

---

## Accessibility

### Touch Targets
- **Minimum size**: 44x44px
- **Hit slop**: 10px padding on close button
- **Switch**: Native accessible controls

### Visual Feedback
- **Active states**: Clear color changes
- **Disabled state**: Grayed out when not selectable
- **Loading states**: N/A (instant filter apply)

---

## Performance Optimization

### Memoization
```typescript
const filteredItems = useMemo(() => {
  return applyAllFilters(items, filters);
}, [items, filters]);
```

### Animation
- Uses `useNativeDriver: true` for 60fps
- Parallel animations for smooth effect
- Cleanup on unmount prevents memory leaks

### Debouncing
- Slider changes update immediately (good UX)
- Apply happens only on button press
- No unnecessary re-renders during adjustment

---

## Testing Scenarios

### Happy Path
1. ✅ Open filter modal
2. ✅ Adjust distance slider
3. ✅ Select price range
4. ✅ Toggle quick filters
5. ✅ Tap "Apply Filters"
6. ✅ See filtered results
7. ✅ Modal closes

### Edge Cases
1. ✅ Distance = 0 (should show nothing or very close)
2. ✅ All filters active (very restrictive)
3. ✅ Reset button (back to defaults)
4. ✅ Close without applying (no changes)
5. ✅ Reopen modal (shows current filters)

---

## Future Enhancements

### Possible Additions
- **Rating filter**: Minimum star rating
- **Availability filter**: Available today/this week
- **Services filter**: Specific services offered
- **Sort options**: Distance, price, rating
- **Save filters**: Remember user preferences
- **Filter badges**: Show active filter count in button

### Backend Integration
```typescript
// Current (Client-side filtering)
const filtered = applyFilters(localData, filters);

// Future (Server-side filtering)
const { data } = await api.searchBarbershops({
  lat: userLat,
  lng: userLng,
  maxDistance: filters.distance,
  priceRange: filters.priceRange,
  openNow: filters.openNow,
  verified: filters.verifiedOnly,
});
```

---

## Files Structure

```
├── components/
│   └── FilterModal.tsx           # Main filter component
├── constants/
│   └── animations.ts             # Animation constants
├── app/
│   ├── barbershops.tsx          # Uses FilterModal
│   └── barbers.tsx              # Uses FilterModal
└── docs/features/
    └── FILTER_GUIDE.md          # This file
```

---

**Last updated**: 2025-10-06 02:57 UTC

**Status**: Phase 2 Complete - Production-ready component
