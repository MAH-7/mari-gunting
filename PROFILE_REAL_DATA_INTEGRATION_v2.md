# Profile Screen Real Data Integration (Updated)

## Overview
Updated the partner profile screen to fetch and display real barber data from Supabase instead of using mock data. **The redundant online/offline toggle has been removed from the profile screen** - it remains only on the dashboard where it's more prominent and action-oriented.

## Changes Made

### 1. Created `barberService.ts`
**Location:** `/packages/shared/services/barberService.ts`

**Purpose:** Service to fetch and manage barber profile data from Supabase

**Key Functions:**
- `getBarberProfileByUserId(userId)`: Fetches combined profile and barber data
- `updateOnlineStatus(userId, isOnline)`: Updates barber's online status (used by dashboard)
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
   - Removed `Switch` component (no longer needed)

2. **State Management:**
   - Changed from static mock data to dynamic state
   - Added `profile` state to store fetched barber profile
   - Added `isLoading` state for loading indicator
   - Made `weekStats` dynamic state
   - **Removed `isOnline` state** (not needed without toggle)

3. **Data Fetching:**
   - Added `loadBarberProfile()` function to fetch data on mount
   - Fetches profile from `barberService.getBarberProfileByUserId()`
   - Fetches weekly stats from `barberService.getBarberStats()`
   - Proper error handling with alerts

4. **Removed Online Status Toggle:**
   - **Removed redundant online/offline toggle from profile screen**
   - Online status control remains on dashboard only
   - Simplified UI and reduced user confusion
   - Removed `handleToggleOnline()` function
   - Removed toggle-related styles

5. **UI States:**
   - **Loading State:** Shows spinner and "Loading profile..." message
   - **Error State:** Shows error icon, message, and retry button
   - **Success State:** Displays profile data without toggle

6. **Styling:**
   - Added `loadingContainer`, `loadingText`, `errorText`, `retryButton`, and `retryButtonText` styles
   - Removed `onlineToggleRow`, `onlineToggleLeft`, `onlineDot`, `onlineDotActive`, and `onlineLabel` styles

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
    ├─→ setWeekStats(stats)
    └─→ setIsLoading(false)
```

## Testing Checklist

- [ ] Profile loads correctly on app start
- [ ] Loading spinner shows while fetching data
- [ ] All profile fields display correctly (name, rating, reviews, etc.)
- [ ] Avatar displays correctly (or shows initial if no avatar)
- [ ] Weekly stats display correctly
- [ ] Error state shows when data fetch fails
- [ ] Retry button works in error state
- [ ] Portfolio badge shows correct count
- [ ] Navigation to other screens works (Edit Profile, Services, etc.)
- [ ] Logout functionality still works
- [ ] **No online/offline toggle visible** (moved to dashboard only)

## UI Simplification

### Before
- Profile screen had online/offline toggle
- Dashboard screen had online/offline toggle
- **Redundant controls causing confusion**

### After
- ✅ Profile screen shows only profile info and menu
- ✅ Dashboard screen has the online/offline toggle
- ✅ Single source of truth for online status
- ✅ Cleaner, less cluttered profile UI

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
- `/apps/partner/app/(tabs)/profile.tsx` - Updated profile screen (toggle removed)
- `/apps/partner/app/(tabs)/index.tsx` - Dashboard screen (toggle remains here)
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
- **Online status control is now exclusively on the dashboard screen**
- Profile screen focuses on viewing/editing profile information only

## Why Remove the Toggle from Profile?

1. **UX Principle: Single Source of Truth**
   - Having the same control in two places creates confusion
   - Users might wonder which one is "correct"

2. **Dashboard is the Primary Action Hub**
   - Dashboard is where barbers start their work day
   - "Going online" is a work mode action, fits better on dashboard
   - Profile is for viewing/editing personal information

3. **Cleaner UI**
   - Profile screen is cleaner without the toggle
   - More space for profile information and menu items
   - Less cognitive load for users

4. **Consistency with Other Apps**
   - Uber, Grab, etc. have online/offline on main screen
   - Profile screens are typically for account settings only
