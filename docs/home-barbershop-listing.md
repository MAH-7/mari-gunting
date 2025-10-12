# Home Screen & Barbershop Listing Documentation

Complete guide to the home screen and barbershop listing features in Mari-Gunting Customer App.

## Table of Contents
- [Overview](#overview)
- [Components](#components)
- [Custom Hooks](#custom-hooks)
- [Home Screen Features](#home-screen-features)
- [Integration Guide](#integration-guide)
- [Usage Examples](#usage-examples)

---

## Overview

The Home Screen and Barbershop Listing system provides customers with an intuitive interface to discover and search for barbershops near them. It leverages PostGIS for geospatial queries and provides real-time filtering and search capabilities.

### Key Features
- **Location-based search** - Find barbershops within a specified radius
- **Real-time search** - Filter by name, address, or description
- **Quick filters** - Nearby, Top Rated, Open Now, New
- **Featured barbershops** - Highlight top-rated establishments
- **Infinite scroll** - Load more results as you scroll
- **Pull to refresh** - Update listings easily
- **Distance calculation** - Show distance from user location

---

## Components

### 1. BarbershopCard

Versatile card component with three variants for displaying barbershop information.

#### Location
`packages/shared/components/BarbershopCard.tsx`

#### Props
```typescript
interface BarbershopCardProps {
  id: string;
  name: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  address: string;
  distance?: number; // in km
  isOpen: boolean;
  services?: string[];
  onPress: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'compact' | 'featured';
}
```

#### Variants

**Default** - Full card with image, details, and services
```typescript
<BarbershopCard
  id="1"
  name="Classic Cuts"
  imageUrl="https://..."
  rating={4.8}
  reviewCount={127}
  address="123 Main St, Kuala Lumpur"
  distance={2.5}
  isOpen={true}
  services={['Haircut', 'Beard Trim', 'Shave']}
  onPress={() => handlePress('1')}
  variant="default"
/>
```

**Featured** - Horizontal card for featured sections
```typescript
<BarbershopCard
  {...props}
  variant="featured"
/>
```

**Compact** - Small horizontal card for list views
```typescript
<BarbershopCard
  {...props}
  variant="compact"
/>
```

#### Features
- Image with loading placeholder
- Open/Closed status badge
- Star rating with review count
- Distance display
- Services preview (up to 2 + count)
- Address with location icon
- Pressable with feedback

---

### 2. SearchBar

Search input component with filter and location buttons.

#### Location
`packages/shared/components/SearchBar.tsx`

#### Props
```typescript
interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  onLocationPress?: () => void;
  showFilterButton?: boolean;
  showLocationButton?: boolean;
  style?: ViewStyle;
}
```

#### Usage
```typescript
<SearchBar
  value={searchQuery}
  onChangeText={setSearchQuery}
  placeholder="Search barbershops..."
  onFilterPress={() => setShowFilters(true)}
  onLocationPress={() => openLocationPicker()}
/>
```

#### Features
- Search icon
- Clear button (when text entered)
- Filter button
- Location button
- Smooth animations
- Keyboard handling

---

## Custom Hooks

### useBarbershops

Main hook for fetching and managing barbershop data.

#### Location
`apps/customer/hooks/useBarbershops.ts`

#### Interface
```typescript
interface UseBarbershopsOptions {
  latitude?: number;
  longitude?: number;
  radius?: number; // in km, default: 10
  searchQuery?: string;
  minRating?: number;
  sortBy?: 'distance' | 'rating' | 'name';
  limit?: number; // default: 20
}

interface UseBarbershopsReturn {
  barbershops: Barbershop[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}
```

#### Usage
```typescript
const { location } = useUserLocation();

const { 
  barbershops, 
  isLoading, 
  error, 
  refetch, 
  hasMore, 
  loadMore 
} = useBarbershops({
  latitude: location?.latitude,
  longitude: location?.longitude,
  radius: 10,
  searchQuery,
  minRating: 4.0,
  sortBy: 'distance',
  limit: 20,
});
```

#### Features
- PostGIS integration for geo-search
- Fallback to standard query without location
- Pagination support
- Infinite scroll
- Search filtering
- Rating filtering
- Multiple sort options
- Automatic refetch on parameter changes

### PostGIS Integration

The hook uses the `search_nearby_barbershops` database function:

```sql
-- Database function call
SELECT * FROM search_nearby_barbershops(
  user_lat := 3.1390,
  user_lng := 101.6869,
  search_radius_km := 10,
  search_query := 'classic',
  min_rating := 4.0,
  result_limit := 20,
  result_offset := 0
);
```

Returns barbershops with:
- All barbershop fields
- Calculated distance in km
- Sorted by distance automatically

---

### useUserLocation

Hook for getting the user's current location.

#### Usage
```typescript
const { location, isLoading, error } = useUserLocation();

// location: { latitude: number; longitude: number } | null
```

#### Features
- Requests location permission
- Gets current position
- Error handling
- Loading state
- Uses balanced accuracy for battery efficiency

---

## Home Screen Features

### Layout Structure

```
HomeScreen
├── Header
│   ├── Profile Section (Avatar + Greeting + Points)
│   ├── Search Bar
│   └── Quick Filters (Nearby, Top Rated, Open Now, New)
├── Featured Section
│   └── Horizontal scrolling featured barbershops
└── Nearby Section
    └── Vertical list of nearby barbershops
```

### Profile Section

```typescript
<View style={styles.profileSection}>
  <Avatar imageUri={currentUser?.avatar} name={currentUser?.name} size="medium" />
  <View style={styles.greetingContainer}>
    <Text style={styles.greeting}>Good day,</Text>
    <Text style={styles.userName}>{currentUser?.name || 'Guest'}</Text>
  </View>
  <TouchableOpacity style={styles.pointsBadge}>
    <Ionicons name="star" size={16} color={Colors.warning} />
    <Text style={styles.pointsText}>{userPoints.toLocaleString()}</Text>
  </TouchableOpacity>
</View>
```

### Quick Filters

```typescript
const quickFilters: FilterOption[] = [
  { id: '1', label: 'Nearby', value: 'nearby' },
  { id: '2', label: 'Top Rated', value: 'rating' },
  { id: '3', label: 'Open Now', value: 'open' },
  { id: '4', label: 'New', value: 'new' },
];

<ScrollView horizontal showsHorizontalScrollIndicator={false}>
  {quickFilters.map((filter) => (
    <TouchableOpacity
      key={filter.id}
      style={[
        styles.filterChip,
        selectedFilter === filter.value && styles.filterChipActive,
      ]}
      onPress={() => setSelectedFilter(filter.value)}
    >
      <Text style={styles.filterChipText}>{filter.label}</Text>
    </TouchableOpacity>
  ))}
</ScrollView>
```

### Featured Section

Displays top-rated barbershops (rating >= 4.5) in a horizontal scrolling list:

```typescript
const featuredBarbershops = barbershops
  .filter(shop => shop.rating >= 4.5)
  .slice(0, 5);

<FlatList
  horizontal
  data={featuredBarbershops}
  renderItem={({ item }) => (
    <BarbershopCard
      {...item}
      variant="featured"
      onPress={() => handleBarbershopPress(item.id)}
    />
  )}
/>
```

### Nearby Section

Displays all barbershops in a vertical list with infinite scroll:

```typescript
<FlatList
  data={barbershops}
  renderItem={({ item }) => (
    <BarbershopCard {...item} />
  )}
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
  ListFooterComponent={hasMore ? <LoadingSpinner size="small" /> : null}
/>
```

### States

**Loading State**
```typescript
{isLoading && barbershops.length === 0 && (
  <LoadingSpinner message="Finding barbershops near you..." />
)}
```

**Error State**
```typescript
{error && (
  <View style={styles.errorContainer}>
    <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
    <Text style={styles.errorText}>Failed to load barbershops</Text>
    <TouchableOpacity onPress={refetch}>
      <Text style={styles.retryText}>Tap to retry</Text>
    </TouchableOpacity>
  </View>
)}
```

**Empty State**
```typescript
{barbershops.length === 0 && (
  <View style={styles.emptyContainer}>
    <Ionicons name="search-outline" size={48} color={Colors.text.tertiary} />
    <Text style={styles.emptyText}>No barbershops found</Text>
    <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
  </View>
)}
```

---

## Integration Guide

### Step 1: Set Up Database Function

Ensure the PostGIS search function exists in your Supabase database:

```sql
-- Already created in previous migration
-- See: supabase/migrations/XXXXXX_add_database_functions.sql
```

### Step 2: Install Location Permissions

Update `app.json` for location permissions:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to access your location to find nearby barbershops."
        }
      ]
    ]
  }
}
```

### Step 3: Replace Home Screen

Replace the existing home screen with the new implementation:

```bash
# Backup old file
mv apps/customer/app/(tabs)/index.tsx apps/customer/app/(tabs)/index.old.tsx

# Use new file
mv apps/customer/app/(tabs)/index.new.tsx apps/customer/app/(tabs)/index.tsx
```

### Step 4: Test the Integration

```typescript
// 1. Test location permission
const { location, isLoading, error } = useUserLocation();
console.log('User location:', location);

// 2. Test barbershop fetching
const { barbershops } = useBarbershops({
  latitude: 3.1390,
  longitude: 101.6869,
  radius: 5,
});
console.log('Nearby barbershops:', barbershops);

// 3. Test search
const { barbershops: searchResults } = useBarbershops({
  searchQuery: 'classic',
});
console.log('Search results:', searchResults);
```

---

## Usage Examples

### Basic Implementation

```typescript
import { useBarbershops, useUserLocation } from '@/hooks/useBarbershops';
import { BarbershopCard, SearchBar } from '@mari-gunting/shared';

function BarbershopList() {
  const [searchQuery, setSearchQuery] = useState('');
  const { location } = useUserLocation();
  
  const { barbershops, isLoading, refetch } = useBarbershops({
    latitude: location?.latitude,
    longitude: location?.longitude,
    searchQuery,
  });

  return (
    <View>
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
      
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={barbershops}
          renderItem={({ item }) => (
            <BarbershopCard
              {...item}
              onPress={() => navigateTo(item.id)}
            />
          )}
        />
      )}
    </View>
  );
}
```

### With Filters

```typescript
function FilteredBarbershopList() {
  const [filters, setFilters] = useState({
    minRating: 4.0,
    radius: 5,
    sortBy: 'distance' as const,
  });

  const { barbershops } = useBarbershops({
    latitude: location?.latitude,
    longitude: location?.longitude,
    ...filters,
  });

  return (
    <View>
      <FilterControls filters={filters} onChange={setFilters} />
      <BarbershopList barbershops={barbershops} />
    </View>
  );
}
```

### Infinite Scroll

```typescript
function InfiniteScrollList() {
  const { barbershops, hasMore, loadMore } = useBarbershops({
    latitude,
    longitude,
    limit: 10,
  });

  return (
    <FlatList
      data={barbershops}
      renderItem={({ item }) => <BarbershopCard {...item} />}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        hasMore ? <LoadingSpinner size="small" /> : null
      }
    />
  );
}
```

---

## Performance Optimization

### 1. Memoization

```typescript
const featuredBarbershops = useMemo(
  () => barbershops.filter(shop => shop.rating >= 4.5).slice(0, 5),
  [barbershops]
);
```

### 2. Debounced Search

```typescript
import { useDebouncedValue } from '@/hooks/useDebounce';

const debouncedSearch = useDebouncedValue(searchQuery, 500);

const { barbershops } = useBarbershops({
  searchQuery: debouncedSearch,
});
```

### 3. Image Optimization

```typescript
<Image
  source={{ uri: imageUrl }}
  style={styles.image}
  resizeMode="cover"
  defaultSource={require('@/assets/placeholder.png')}
/>
```

### 4. List Optimization

```typescript
<FlatList
  data={barbershops}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
  initialNumToRender={10}
/>
```

---

## Testing

### Unit Tests

```typescript
describe('useBarbershops', () => {
  it('fetches barbershops with location', async () => {
    const { result } = renderHook(() => useBarbershops({
      latitude: 3.1390,
      longitude: 101.6869,
      radius: 5,
    }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.barbershops).toHaveLength(5);
    expect(result.current.barbershops[0]).toHaveProperty('distance');
  });

  it('filters by search query', async () => {
    const { result } = renderHook(() => useBarbershops({
      searchQuery: 'classic',
    }));

    await waitFor(() => {
      expect(result.current.barbershops.every(
        shop => shop.name.toLowerCase().includes('classic')
      )).toBe(true);
    });
  });
});
```

### Integration Tests

```typescript
describe('HomeScreen', () => {
  it('displays nearby barbershops', async () => {
    const { getByText, findByText } = render(<HomeScreen />);
    
    await findByText('Nearby Barbershops');
    expect(getByText(/Within 10 km/)).toBeTruthy();
  });

  it('handles search', async () => {
    const { getByPlaceholderText, findByText } = render(<HomeScreen />);
    
    const searchInput = getByPlaceholderText('Search barbershops...');
    fireEvent.changeText(searchInput, 'classic');
    
    await findByText('Search Results');
  });
});
```

---

## Troubleshooting

### Issue: Location not loading
**Solution**: 
- Check location permissions in device settings
- Verify `expo-location` is installed
- Check console for permission errors

### Issue: No barbershops showing
**Solution**:
- Verify database has barbershop data
- Check PostGIS function exists
- Ensure location coordinates are valid
- Check network connectivity

### Issue: Search not working
**Solution**:
- Verify search query is being passed to hook
- Check database has searchable fields indexed
- Test with simpler search terms

### Issue: Distance not calculated
**Solution**:
- Ensure PostGIS extension is enabled
- Verify lat/lng columns exist and have data
- Check RPC function returns distance field

---

## Future Enhancements

1. **Advanced Filters**
   - Price range
   - Service type
   - Availability today
   - Accepts walk-ins

2. **Map View**
   - Switch between list and map view
   - Show barbershops on map
   - Interactive markers

3. **Favorites**
   - Save favorite barbershops
   - Quick access to favorites

4. **Recent Searches**
   - Save search history
   - Quick re-search

5. **Recommendations**
   - AI-based recommendations
   - Based on booking history
   - Popular in your area

---

## Support

For issues or questions:
1. Check this documentation
2. Review component source code
3. Test with sample data
4. Check database connectivity
5. Review Supabase logs
