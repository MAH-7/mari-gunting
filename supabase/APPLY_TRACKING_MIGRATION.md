# 📍 Apply Tracking Metadata Migration

## Overview
This migration adds real-time location tracking metadata columns to the `bookings` table, enabling features like:
- Track when barber starts traveling
- Calculate and store ETA
- Monitor current distance
- Record arrival times

## Migration File
**File:** `supabase/migrations/add_tracking_metadata.sql`

## How to Apply

### Method 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
   - Navigate to **SQL Editor** (left sidebar)

2. **Copy Migration SQL**
   - Open `supabase/migrations/add_tracking_metadata.sql`
   - Copy the entire file contents

3. **Run in SQL Editor**
   - Click "New query" in SQL Editor
   - Paste the migration SQL
   - Click "Run" (or press `Cmd/Ctrl + Enter`)
   - Wait for "Success" message

4. **Verify Applied**
   ```sql
   -- Check if new columns exist
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'bookings' 
   AND column_name IN (
     'tracking_started_at',
     'tracking_last_updated_at',
     'estimated_arrival_time',
     'current_distance_km',
     'current_eta_minutes',
     'barber_arrived_at'
   );
   ```
   
   Expected: Should return 6 rows

5. **Test Trigger**
   ```sql
   -- Check if trigger exists
   SELECT trigger_name, event_manipulation, event_object_table
   FROM information_schema.triggers
   WHERE trigger_name = 'trigger_set_tracking_started_at';
   ```
   
   Expected: Should return 1 row

6. **Test Function**
   ```sql
   -- Check if function exists
   SELECT routine_name, routine_type
   FROM information_schema.routines
   WHERE routine_name IN ('set_tracking_started_at', 'update_tracking_metrics');
   ```
   
   Expected: Should return 2 rows

### Method 2: Supabase CLI

```bash
# Make sure you're in project root
cd /Users/bos/Desktop/ProjectSideIncome/mari-gunting

# Apply the specific migration
supabase db push --file supabase/migrations/add_tracking_metadata.sql
```

## What This Migration Adds

### New Columns on `bookings` Table

| Column | Type | Description |
|--------|------|-------------|
| `tracking_started_at` | TIMESTAMP | When barber started traveling (status → 'on-the-way') |
| `tracking_last_updated_at` | TIMESTAMP | Last time tracking data was updated |
| `estimated_arrival_time` | TIMESTAMP | Calculated ETA based on current location |
| `current_distance_km` | NUMERIC(10,2) | Current distance between barber & customer |
| `current_eta_minutes` | INTEGER | Current estimated minutes until arrival |
| `barber_arrived_at` | TIMESTAMP | When barber arrived at customer location |

### Indexes Created

1. `idx_bookings_tracking_started` - For filtering active tracking sessions
2. `idx_bookings_status_tracking` - For status + tracking queries

### Database Functions

1. **`set_tracking_started_at()`** - Trigger function that:
   - Sets `tracking_started_at` when status changes to 'on-the-way'
   - Sets `barber_arrived_at` when status changes to 'in-progress'

2. **`update_tracking_metrics(booking_id, distance_km, eta_minutes)`** - Updates:
   - `tracking_last_updated_at` → NOW()
   - `current_distance_km` → provided value
   - `current_eta_minutes` → provided value
   - `estimated_arrival_time` → NOW() + eta_minutes

### View Created

**`active_tracking_sessions`** - Shows all currently active tracking sessions with:
- Booking details (id, customer, barber, status)
- Tracking timestamps
- Current distance/ETA
- Barber's current location
- Minutes since last update

## Usage in App

### When Barber Accepts Booking
```typescript
// Status automatically changes to 'accepted'
// Trigger sets tracking_started_at automatically
```

### When Updating Location (Every 1.5 minutes when on-the-way)
```typescript
// After calculating distance and ETA
await supabase.rpc('update_tracking_metrics', {
  p_booking_id: bookingId,
  p_distance_km: distanceInKm,
  p_eta_minutes: etaInMinutes
});
```

### When Barber Arrives
```typescript
// Status changes to 'in-progress'
// Trigger sets barber_arrived_at automatically
```

## Integration with Location Tracking Service

The migration works with the updated `locationTrackingService.ts`:

```typescript
// When barber starts traveling to customer
await locationTrackingService.switchMode(userId, 'on-the-way');
// Updates every 1.5 minutes

// When booking is just accepted (not yet traveling)
await locationTrackingService.startTracking(userId, 'idle');
// Updates every 5 minutes
```

## Testing the Migration

After applying, test with:

```sql
-- 1. Check active tracking sessions
SELECT * FROM active_tracking_sessions;

-- 2. Manually test update function
SELECT update_tracking_metrics(
  'booking-uuid-here'::uuid,
  2.5,  -- 2.5 km away
  8     -- 8 minutes ETA
);

-- 3. Verify the update
SELECT 
  id,
  tracking_last_updated_at,
  current_distance_km,
  current_eta_minutes,
  estimated_arrival_time
FROM bookings
WHERE id = 'booking-uuid-here';
```

## Rollback (If Needed)

To undo this migration:

```sql
-- Drop view
DROP VIEW IF EXISTS active_tracking_sessions;

-- Drop functions
DROP FUNCTION IF EXISTS update_tracking_metrics(UUID, NUMERIC, INTEGER);
DROP TRIGGER IF EXISTS trigger_set_tracking_started_at ON bookings;
DROP FUNCTION IF EXISTS set_tracking_started_at();

-- Drop indexes
DROP INDEX IF EXISTS idx_bookings_tracking_started;
DROP INDEX IF EXISTS idx_bookings_status_tracking;

-- Remove columns
ALTER TABLE bookings
DROP COLUMN IF EXISTS tracking_started_at,
DROP COLUMN IF EXISTS tracking_last_updated_at,
DROP COLUMN IF EXISTS estimated_arrival_time,
DROP COLUMN IF EXISTS current_distance_km,
DROP COLUMN IF EXISTS current_eta_minutes,
DROP COLUMN IF EXISTS barber_arrived_at;
```

## Related Files

- `packages/shared/services/locationTrackingService.ts` - Location tracking with dynamic intervals
- `apps/customer/hooks/useRealtimeLocation.ts` - Customer-side real-time tracking
- `docs/LOCATION_TRACKING.md` - Overall location tracking documentation

---

**Status:** Ready to apply ✅  
**Created:** 2025-01-09  
**Last updated:** 2025-10-15 05:30 UTC
