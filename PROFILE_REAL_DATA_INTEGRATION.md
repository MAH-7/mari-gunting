# Profile Screen Real Data Integration

## Overview
Updated the partner profile screen to fetch and display real barber data from Supabase instead of using mock data.

## Changes Made

### 1. Created `barberService.ts`
**Location:** `/packages/shared/services/barberService.ts`

**Purpose:** Service to fetch and manage barber profile data from Supabase

**Key Functions:**
- `getBarberProfileByUserId(userId)`: Fetches combined profile and barber data
- `updateOnlineStatus(userId, isOnline)`: Updates barber's online status
- `getBarberStats(userId, period)`: Fetches barber statistics (earnings, jobs, ratings)

**Data Structure:**
```typescript
interface BarberProfile {
  // User profile data
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  isOnline: boolean;
  
  // Barber-specific data
  barberId: string;
  bio: string;
  rating: number;
  totalReviews: number;
  completedJobs: number;
  experience: number;
  specializations: string[];
  photos: string[];
  isVerified: boolean;
  isAvailable: boolean;
  joinedDate: string;
  
  // Additional fields
  verificationStatus?: string;
  serviceRadius?: number;
  workingHours?: any;
}
```

### 2. Updated Profile Screen
**Location:** `/apps/partner/app/(tabs)/profile.tsx`

**Changes:**
1. **Imports:**
   - Added `ActivityIndicator` from React Native
   - Added `useEffect` hook
   - Imported `barberService` and `BarberProfile` type

2. **State Management:**
   - Changed from static mock data to dynamic state
   - Added `profile` state to store fetched barber profile
   - Added `isLoading` state for loading indicator
   - Made `isOnline` and `weekStats` dynamic states

3. **Data Fetching:**
   - Added `loadBarberProfile()` function to fetch data on mount
   - Fetches profile from `barberService.getBarberProfileByUserId()`
   - Fetches weekly stats from `barberService.getBarberStats()`
   - Proper error handling with alerts

4. **Online Status Toggle:**
   - Made `handleToggleOnline()` async
   - Calls `barberService.updateOnlineStatus()` to persist changes
   - Reverts UI state if update fails

5. **UI States:**
   - **Loading State:** Shows spinner and "Loading profile..." message
   - **Error State:** Shows error icon, message, and retry button
   - **Success State:** Displays profile data as before

6. **Styling:**
   - Added `loadingContainer`, `loadingText`, `errorText`, `retryButton`, and `retryButtonText` styles

### 3. Export Configuration
**Location:** `/packages/shared/index.ts`

**Changes:**
- Added export for `barberService` to make it available across apps

## Database Tables Used

### `profiles` Table
- Stores user authentication and basic profile data
- Fields: `id`, `full_name`, `phone_number`, `avatar_url`, `is_online`, `last_seen_at`

### `barbers` Table
- Stores barber-specific business data
- Fields: `id`, `user_id`, `bio`, `rating`, `total_reviews`, `completed_bookings`, 
  `experience_years`, `specializations`, `portfolio_images`, `is_verified`, 
  `is_available`, `verification_status`, `service_radius_km`, `working_hours`

## Data Flow

```
Profile Screen Mount
    ↓
useEffect triggered
    ↓
loadBarberProfile()
    ↓
├─→ barberService.getBarberProfileByUserId(userId)
│   ├─→ Fetch from 'profiles' table
│   ├─→ Fetch from 'barbers' table
│   └─→ Combine and return BarberProfile
│
├─→ barberService.getBarberStats(userId, 'week')
│   └─→ Return weekly stats (currently mock, to be implemented)
│
└─→ Update UI state
    ├─→ setProfile(barberProfile)
    ├─→ setIsOnline(barberProfile.isOnline)
    ├─→ setWeekStats(stats)
    └─→ setIsLoading(false)
```

## Online Status Update Flow

```
User toggles online switch
    ↓
handleToggleOnline(value)
    ↓
Optimistically update UI
    ↓
barberService.updateOnlineStatus(userId, isOnline)
    ↓
Update 'profiles' table
    ├─→ is_online = value
    └─→ last_seen_at = now()
    ↓
If success: Show confirmation alert
If failure: Revert UI and show error
```

## Testing Checklist

- [ ] Profile loads correctly on app start
- [ ] Loading spinner shows while fetching data
- [ ] All profile fields display correctly (name, rating, reviews, etc.)
- [ ] Avatar displays correctly (or shows initial if no avatar)
- [ ] Online/Offline toggle works and persists to database
- [ ] Weekly stats display correctly
- [ ] Error state shows when data fetch fails
- [ ] Retry button works in error state
- [ ] Portfolio badge shows correct count
- [ ] Navigation to other screens works (Edit Profile, Services, etc.)
- [ ] Logout functionality still works

## Known Limitations

1. **Stats are mock data:** The `getBarberStats()` function currently returns mock data. 
   It needs to be implemented to fetch real stats from bookings/payments tables.

2. **Email field:** The email is currently set to the user ID because email is stored 
   in Supabase Auth, not in the profiles table. If email display is needed, we should 
   fetch it from `supabase.auth.getUser()`.

3. **No real-time updates:** The profile doesn't automatically update when data changes 
   in the database. Consider adding Supabase real-time subscriptions for live updates.

## Future Enhancements

1. **Implement Real Stats:**
   ```typescript
   async getBarberStats(userId: string, period: 'week' | 'month' | 'all') {
     // Query bookings/payments tables
     // Aggregate earnings, job count, average rating
     // Return real data
   }
   ```

2. **Add Real-time Subscriptions:**
   ```typescript
   useEffect(() => {
     const subscription = supabase
       .channel('barber_updates')
       .on('postgres_changes', {
         event: '*',
         schema: 'public',
         table: 'barbers',
         filter: `user_id=eq.${userId}`
       }, handleProfileUpdate)
       .subscribe();
     
     return () => subscription.unsubscribe();
   }, [userId]);
   ```

3. **Pull-to-Refresh:**
   - Add `RefreshControl` to `ScrollView`
   - Allow users to manually refresh profile data

4. **Offline Support:**
   - Cache profile data locally
   - Show cached data immediately
   - Update in background

5. **Profile Completeness Indicator:**
   - Show progress bar for profile completion
   - Prompt users to complete missing fields

## Related Files

- `/packages/shared/services/barberService.ts` - New barber service
- `/apps/partner/app/(tabs)/profile.tsx` - Updated profile screen
- `/packages/shared/index.ts` - Export configuration
- `/packages/shared/types/database.ts` - Database type definitions
- `/packages/shared/types/index.ts` - App type definitions

## Dependencies

- `@supabase/supabase-js` - Database client
- `zustand` - State management (for currentUser)
- `@react-native-async-storage/async-storage` - Local storage

## Notes

- The profile screen now requires a logged-in user with a valid barber record
- If user is not logged in or barber record doesn't exist, error state is shown
- The service logs all operations for debugging
- All database operations are wrapped in try-catch for error handling
