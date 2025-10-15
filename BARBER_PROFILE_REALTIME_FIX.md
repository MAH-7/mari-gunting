# Barber Profile Real-Time Status Fix

## Problem
When viewing a barber's profile in the customer app, if the barber toggled offline in the partner app, the customer could still press the "Book Now" button.

## Root Causes

1. **Incomplete Subscription Setup**: The real-time subscription wasn't properly listening to both the `profiles` table (for `is_online`) and the `barbers` table (for `is_available`)

2. **Wrong User ID Detection**: The code was trying to guess which field contained the user_id instead of just using the barber ID directly for the barbers table subscription

3. **Incomplete Button Logic**: The "Book Now" button was only checking `isOnline` but not `isAvailable`. A barber is only available when BOTH conditions are true:
   - `profiles.is_online = true` 
   - `barbers.is_available = true`

## Solution

### 1. Fixed Real-Time Subscriptions (lines 23-96)

```typescript
// Subscribe to BOTH tables using a single channel
const channel = supabase.channel(`barber-status-${barberId}`);

// Listen to barbers table (is_available changes)
channel.on('postgres_changes', {
  event: 'UPDATE',
  schema: 'public',
  table: 'barbers',
  filter: `id=eq.${barberId}`,
}, (payload) => {
  console.log('🔔 Barber table UPDATE received:', payload);
  refetch(); // Refetch barber data to update UI
});

// Listen to profiles table (is_online changes)
channel.on('postgres_changes', {
  event: 'UPDATE',
  schema: 'public',
  table: 'profiles',
}, (payload) => {
  console.log('🔔 Profile table UPDATE received:', payload);
  refetch(); // Refetch barber data to update UI
});
```

### 2. Added State Tracking & Alert (lines 106-135)

Now tracks when a barber goes from available → unavailable and shows an alert:

```typescript
useEffect(() => {
  if (!barber) return;

  const currentState = {
    isOnline: barber.isOnline,
    isAvailable: barber.isAvailable,
  };

  // Check if barber went offline
  if (previousBarberState) {
    const wasAvailable = previousBarberState.isOnline && previousBarberState.isAvailable;
    const isNowAvailable = currentState.isOnline && currentState.isAvailable;

    if (wasAvailable && !isNowAvailable) {
      Alert.alert('Barber Went Offline', `${barber.name} is no longer available...`);
    }
  }

  setPreviousBarberState(currentState);
}, [barber?.isOnline, barber?.isAvailable, barber?.name]);
```

### 3. Fixed "Book Now" Button Logic (lines 475-492)

Now checks BOTH conditions:

```typescript
<TouchableOpacity 
  style={[
    styles.bookButton,
    (!barber.isOnline || !barber.isAvailable) && styles.bookButtonDisabled
  ]}
  onPress={() => {
    const isAvailable = barber.isOnline && barber.isAvailable;
    if (isAvailable) {
      router.push(`/booking/create?barberId=${barber.id}`);
    }
  }}
  disabled={!barber.isOnline || !barber.isAvailable}
>
  <Text style={styles.bookButtonText}>
    {!barber.isOnline || !barber.isAvailable ? 'Offline' : 'Book Now'}
  </Text>
</TouchableOpacity>
```

## How It Works Now

1. **Customer opens barber profile** → Subscribes to real-time updates for that barber
2. **Barber toggles offline in partner app** → `toggle_online_status()` function updates:
   - `profiles.is_online = false`
   - `barbers.is_available = false` (for freelance accounts)
3. **Real-time subscription receives the update** → Triggers `refetch()`
4. **Barber data is refetched** → UI updates with new status
5. **State tracking detects the change** → Shows alert to customer
6. **"Book Now" button automatically updates** → Shows "Offline" and becomes disabled

## Testing

To verify this works:

1. Open customer app and view a barber's profile
2. In partner app (on different device/simulator), toggle the barber offline
3. Customer app should:
   - ✅ Show an alert: "Barber Went Offline"
   - ✅ Update the "Book Now" button to show "Offline"
   - ✅ Disable the button (grayed out)
   - ✅ Log real-time updates in console

## Files Modified

- `/apps/customer/app/barber/[id].tsx` - Barber profile screen

## Related Files

- `/supabase/migrations/toggle_online_status_function.sql` - Server function that updates both tables
- `/packages/shared/services/supabaseApi.ts` - API that fetches barber data
- `/supabase/migrations/fix_rls_infinite_recursion.sql` - RLS policies fix (production-safe)
