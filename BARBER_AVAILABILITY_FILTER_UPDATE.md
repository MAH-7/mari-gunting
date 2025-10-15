# Barber Availability Filter Update

## Summary
Updated the customer app to filter barbers by **both** `is_online` and `is_available` fields, ensuring that only barbers who are online AND accepting bookings appear in search results.

## Context
In the partner app, when a barber toggles "online/offline", it controls both:
- `profiles.is_online` - Whether the barber is currently online
- `barbers.is_available` - Whether the barber is accepting bookings

Previously, the customer app only filtered by `is_online`, meaning barbers could appear in search results even if they had marked themselves as unavailable for bookings.

## Changes Made

### 1. Type Definitions
**File:** `packages/shared/types/index.ts`

Added `isAvailable` field to the `Barber` interface:
```typescript
export interface Barber extends User {
  // ... existing fields
  isOnline: boolean;
  isAvailable: boolean;       // Whether barber is available for bookings
  isVerified: boolean;
  // ... other fields
}
```

### 2. Mock Data
**File:** `packages/shared/services/mockData.ts`

Added `isAvailable: true` to all mock barbers (4 barbers total):
- Amir Hafiz (b1)
- Faiz Rahman (b2)
- Azman Ibrahim (b3)
- Danish Lee (b4)

### 3. API Service
**File:** `packages/shared/services/api.ts`

#### 3.1 Updated `getBarbers` function
Added `isAvailable` parameter to filters:
```typescript
getBarbers: async (filters?: {
  isOnline?: boolean;
  isAvailable?: boolean;  // NEW
  serviceId?: string;
  location?: { lat: number; lng: number; radius?: number };
})
```

Added filtering logic:
```typescript
if (filters?.isAvailable !== undefined) {
  filteredBarbers = filteredBarbers.filter(b => b.isAvailable === filters.isAvailable);
}
```

#### 3.2 Updated `quickBook` function
Changed barber search to check both fields:
```typescript
// Before
const availableBarber = mockBarbers.find(b => b.isOnline);

// After
const availableBarber = mockBarbers.find(b => b.isOnline && b.isAvailable);
```

### 4. Customer App - Barbers List Screen
**File:** `apps/customer/app/barbers.tsx`

#### 4.1 API Query
Updated to filter by both fields:
```typescript
queryFn: () => api.getBarbers({
  isOnline: true,
  isAvailable: true,  // NEW
}),
```

#### 4.2 Client-side Filter
Updated client-side filtering logic:
```typescript
// Before
return matchesSearch && withinRadius && barber.isOnline;

// After
return matchesSearch && withinRadius && barber.isOnline && barber.isAvailable;
```

### 5. Customer App - Home Screen
**File:** `apps/customer/app/(tabs)/index.tsx`

Updated the "online" filter to also check availability:
```typescript
queryFn: () => api.getBarbers({
  isOnline: selectedFilter === "online" ? true : undefined,
  isAvailable: selectedFilter === "online" ? true : undefined,  // NEW
}),
```

## Impact

### What Changed
- Barbers now only appear in search results if **both** `isOnline = true` AND `isAvailable = true`
- Quick Book feature now only finds barbers who are both online and available
- Home screen "online" filter now respects availability status

### What Stays the Same
- Barbershop staff filtering remains unchanged (they only have `isAvailable`, not `isOnline`)
- All other filtering logic (distance, price, specializations) remains intact
- UI components and styling unchanged

## Testing Recommendations

1. **Test Online + Available**: Barber with both flags true should appear in searches
2. **Test Online + Unavailable**: Barber online but unavailable should NOT appear
3. **Test Offline + Available**: Barber offline should NOT appear regardless of availability
4. **Test Quick Book**: Should only find barbers who are both online and available
5. **Test Home Screen Filters**: 
   - "All" tab should show all barbers
   - "Online" tab should only show online AND available barbers

## Database Schema Reference

For production implementation with Supabase:

```sql
-- profiles table
profiles.is_online BOOLEAN DEFAULT false

-- barbers table  
barbers.is_available BOOLEAN DEFAULT false
```

Query should filter:
```sql
WHERE profiles.is_online = true 
  AND barbers.is_available = true
```

## Notes

- This is currently implemented in mock data layer
- When migrating to Supabase, ensure both fields are checked in database queries
- Partner app toggle should continue to control both fields simultaneously
- Barbershop staff only use `isAvailable` (no `isOnline` field as per their type definition)

---

**Date:** October 13, 2025
**Status:** ✅ Completed
