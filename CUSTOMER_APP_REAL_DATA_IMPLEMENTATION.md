# Customer App - Real Supabase Data Implementation

## Summary
The customer app now fetches real barber data from Supabase instead of using mock data. This includes barber listings, search, barber details, and Quick Book functionality.

## What Changed

### 1. New File: `supabaseApi.ts`
**Location:** `packages/shared/services/supabaseApi.ts`

This new service layer handles all Supabase queries for barbers:

#### Functions Implemented:
- **`getBarbers(filters)`** - Fetch barbers with filtering by:
  - `isOnline` (from `profiles.is_online`)
  - `isAvailable` (from `barbers.is_available`)
  - `serviceId` (filters by services offered)
  - `location` (radius-based, to be implemented)

- **`getBarberById(id)`** - Fetch single barber details with services

- **`searchBarbers(query)`** - Search barbers by name or specializations

- **`quickBook(serviceId, time)`** - Find available barber for Quick Book

#### Data Transformation:
The service transforms Supabase database types to app types:
- Joins `barbers` table with `profiles` table
- Fetches associated `services` for each barber
- Transforms snake_case DB fields to camelCase app fields
- Parses PostGIS GeoJSON location data

### 2. Updated File: `api.ts`
**Location:** `packages/shared/services/api.ts`

Added a toggle switch to choose between mock and real data:

```typescript
const USE_REAL_DATA = true; // Set to false to use mock data
```

All barber-related API calls now check this flag and route to either:
- `supabaseApi` (real Supabase data) when `USE_REAL_DATA = true`
- Mock data when `USE_REAL_DATA = false`

**Affected Functions:**
- `getBarbers()`
- `getBarberById()`
- `searchBarbers()`
- `quickBook()`

### 3. Database Query Structure

#### Barbers Query:
```sql
SELECT 
  barbers.*,
  profiles.* 
FROM barbers
JOIN profiles ON barbers.user_id = profiles.id
WHERE barbers.is_available = true
  AND profiles.is_online = true
```

#### Services Query:
```sql
SELECT *
FROM services
WHERE barber_id IN (...)
  AND is_active = true
```

## Database Schema Used

### Tables:
1. **`profiles`** - User profile information
   - `id` (UUID)
   - `full_name`
   - `email`
   - `phone_number`
   - `avatar_url`
   - `is_online` ✅ **Online status**
   - `location` (PostGIS GeoJSON)
   - Other address fields

2. **`barbers`** - Barber-specific data
   - `id` (UUID)
   - `user_id` (FK to profiles)
   - `bio`
   - `rating`
   - `total_reviews`
   - `completed_bookings`
   - `is_available` ✅ **Availability status**
   - `is_verified`
   - `specializations` (array)
   - `portfolio_images` (array)
   - `working_hours` (JSON)

3. **`services`** - Services offered by barbers
   - `id` (UUID)
   - `barber_id` (FK to barbers)
   - `name`
   - `description`
   - `price`
   - `duration_minutes`
   - `category`
   - `is_active`

## Features Enabled

### ✅ Barber Listings
- Home screen barber list (with online/all filters)
- Full barbers list screen
- Filters by `is_online` AND `is_available`

### ✅ Barber Search
- Search by barber name
- Search by specializations

### ✅ Barber Details
- View individual barber profile
- Shows barber's services from database
- Displays ratings, reviews count, completed jobs

### ✅ Quick Book
- Finds available barbers who are both online and available
- Checks `profiles.is_online = true` AND `barbers.is_available = true`

## How to Switch Between Mock and Real Data

In `packages/shared/services/api.ts`:

```typescript
// Use real Supabase data
const USE_REAL_DATA = true;

// Use mock data for testing
const USE_REAL_DATA = false;
```

## Environment Setup

Make sure your `.env` file has Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Data Flow

```
Customer App Screen
       ↓
  api.getBarbers()
       ↓
  [USE_REAL_DATA check]
       ↓
supabaseApi.getBarbers()
       ↓
  Supabase Query:
  - barbers + profiles join
  - services query
       ↓
  Data Transformation:
  - DB types → App types
  - snake_case → camelCase
  - Parse GeoJSON location
       ↓
  Return transformed data
       ↓
  Display in UI
```

## Testing

### Test with Real Data:
1. Set `USE_REAL_DATA = true`
2. Ensure Supabase has barber data
3. Run customer app
4. Check console logs for "📡 Using REAL Supabase data"

### Test with Mock Data:
1. Set `USE_REAL_DATA = false`
2. Run customer app
3. Check console logs for "🎭 Using MOCK data"

## Console Logs

When using real data, you'll see:
```
📡 Using REAL Supabase data
🔍 Fetching barbers from Supabase with filters: {...}
✅ Found X barbers
```

## Known Limitations & Future Enhancements

### Current Implementation:
- ✅ Filters by `is_online` and `is_available`
- ✅ Joins barbers with profiles
- ✅ Fetches associated services
- ✅ Basic search by name/specializations

### To Be Implemented:
- ⏳ **Distance calculation** - Calculate distance from user location
- ⏳ **Location-based filtering** - Filter by radius
- ⏳ **Sorting by distance** - Sort results by proximity
- ⏳ **Performance optimization** - Implement pagination
- ⏳ **Caching** - Cache frequently accessed data
- ⏳ **Real-time updates** - Listen to barber online status changes

## Impact on Other Features

### Still Using Mock Data:
- ❌ Barbershops (not yet implemented)
- ❌ Bookings (not yet implemented)
- ❌ Reviews (not yet implemented)
- ❌ Services catalog (not yet implemented)

These will need separate implementations following the same pattern.

## Migration Checklist

When switching to real data permanently:

- [x] Create `supabaseApi.ts` service
- [x] Update `api.ts` with toggle
- [x] Test barber listings
- [x] Test barber search
- [x] Test barber details
- [x] Test Quick Book
- [ ] Add distance calculation
- [ ] Implement location-based filtering
- [ ] Add error handling UI
- [ ] Add loading states
- [ ] Test with empty database
- [ ] Test with large dataset
- [ ] Performance testing
- [ ] Remove mock data dependencies

## Troubleshooting

### No barbers showing up:
1. Check Supabase connection: Look for connection errors in console
2. Verify database has barbers: Check Supabase dashboard
3. Check filters: Ensure barbers have `is_available = true` and `is_online = true`
4. Verify foreign keys: Ensure barbers have valid `user_id` linking to profiles

### Services not showing:
1. Check `services` table has data
2. Verify `barber_id` foreign key is correct
3. Ensure services have `is_active = true`

### Location not showing:
1. Check if `profiles.location` has GeoJSON data
2. Verify PostGIS format: `{"type": "Point", "coordinates": [lng, lat]}`
3. Check transformation function logs

---

**Date:** October 13, 2025  
**Status:** ✅ Implemented  
**Toggle:** `USE_REAL_DATA = true` in `api.ts`
