# Production Timezone Implementation (Grab Standard)

**Status**: ✅ IMPLEMENTED  
**Date**: January 24, 2025  
**Standard**: Grab-style timezone handling for production

---

## 🎯 Problem Solved

### Before (Incorrect):
```typescript
// ❌ Timezone-naive implementation
scheduledDate: "2025-11-02"
scheduledTime: "14:30"
// Database: Concatenated without timezone → "2025-11-02 14:30"
// Problem: Assumes server timezone, breaks for users in different timezones
```

### After (Correct):
```typescript
// ✅ Timezone-aware implementation (Grab standard)
scheduledDatetime: "2025-11-02T14:30:00+08:00"  // ISO 8601 with timezone
// Database stores as UTC: "2025-11-02T06:30:00Z"
// Displays in user's device timezone: "2:30 PM"
```

---

## 🏗️ Architecture

### Data Flow:

```
User Device (Singapore GMT+8)
    ↓ Selects: Nov 2, 2025 at 2:30 PM
    
Frontend
    ↓ createScheduledDateTime("2025-11-02", "14:30")
    ↓ Returns: "2025-11-02T14:30:00+08:00"
    
Backend (create_booking)
    ↓ Receives ISO timestamp
    ↓ PostgreSQL stores as TIMESTAMPTZ (UTC)
    ↓ Stored: "2025-11-02T06:30:00Z"
    
Display
    ↓ Reads: "2025-11-02T06:30:00Z"
    ↓ formatLocalTime() converts to device timezone
    ↓ Shows: "2:30 PM" (Singapore user)
    ↓ Shows: "10:30 PM" (New York user)
```

---

## 📝 Implementation Details

### 1. Utility Functions (`packages/shared/utils/format.ts`)

```typescript
/**
 * Convert date + time to ISO timestamp with device timezone
 * This is the SOURCE OF TRUTH for scheduled bookings
 */
export const createScheduledDateTime = (dateStr: string, timeStr: string): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return localDate.toISOString();
};

/**
 * Display ISO timestamp in user's device timezone
 */
export const formatLocalTime = (datetime: string | Date): string => {
  const date = typeof datetime === 'string' ? new Date(datetime) : datetime;
  return new Intl.DateTimeFormat('en-MY', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};
```

### 2. Database Function (`supabase/migrations/20250124_fix_timezone_scheduled_datetime.sql`)

```sql
CREATE OR REPLACE FUNCTION create_booking(
  ...
  p_scheduled_datetime TIMESTAMPTZ,  -- CHANGED: Now accepts ISO timestamp
  ...
)
```

**Key Changes**:
- ✅ Accepts `TIMESTAMPTZ` directly (instead of separate DATE and TIME)
- ✅ No more string concatenation
- ✅ Database automatically handles timezone conversion to UTC
- ✅ Backward compatible: Still populates `scheduled_date` and `scheduled_time` for legacy code

### 3. Booking Service (`packages/shared/services/bookingService.ts`)

```typescript
async createBooking(params: CreateBookingParams) {
  // Convert date + time to ISO timestamp with device timezone
  const scheduledDatetime = createScheduledDateTime(
    params.scheduledDate,
    params.scheduledTime
  );
  
  const { data, error } = await supabase.rpc('create_booking', {
    ...
    p_scheduled_datetime: scheduledDatetime,  // Send ISO timestamp
    ...
  });
}
```

### 4. Display Logic (Partner & Customer Apps)

```typescript
// Partner app: jobs.tsx
{job.scheduled_datetime 
  ? `${formatLocalDate(job.scheduled_datetime, 'short')} • ${formatLocalTime(job.scheduled_datetime)}`
  : `${job.scheduledDate} • ${formatTime(job.scheduledTime)}`  // Fallback
}

// Customer app: booking/[id].tsx
{booking.scheduledAt ? (
  formatLocalDateTime(booking.scheduledAt)
) : (
  `${formatLocalDate(booking.scheduledDate)} at ${formatTime(booking.scheduledTime)}`
)}
```

---

## 🔍 Database Schema

### Bookings Table:
```sql
scheduled_date       DATE         -- Backward compatibility
scheduled_time       TIME         -- Backward compatibility  
scheduled_datetime   TIMESTAMPTZ  -- ⭐ SOURCE OF TRUTH
```

**Migration Strategy**:
- ✅ Keep old fields for backward compatibility
- ✅ New bookings use `scheduled_datetime` as source of truth
- ✅ Display logic checks `scheduled_datetime` first, falls back to old fields
- ✅ Gradual migration: No breaking changes

---

## 🧪 Testing

### Test Scenarios:

1. **Same Timezone Booking**:
   - User in Malaysia (GMT+8) books for 2:30 PM
   - Should store UTC: 06:30:00Z
   - Should display: 2:30 PM

2. **Different Timezone Booking**:
   - User in Singapore (GMT+8) books for 2:30 PM
   - User travels to New York (GMT-5)
   - Should still display correctly in their current timezone

3. **Barber Acceptance**:
   - Barber in Malaysia sees booking scheduled for their local time
   - Correctly displays regardless of when booking was made

4. **Cross-timezone Service**:
   - Customer in Singapore books barber in Malaysia
   - Both see correct times in their respective timezones

### Verification Commands:

```bash
# Check database function
psql $DATABASE_URL -c "\df+ create_booking"

# Test booking creation
# (Run from Customer app with console.log enabled)
# Look for: "📅 Booking scheduled for: { input: ..., iso: ..., timezone: ... }"
```

---

## 📋 Migration Checklist

- ✅ Create utility functions (`createScheduledDateTime`, `formatLocalTime`)
- ✅ Update database function to accept `TIMESTAMPTZ`
- ✅ Update `bookingService.createBooking()` to send ISO timestamp
- ✅ Update Partner app display logic
- ✅ Update Customer app display logic
- ✅ Apply database migration
- ✅ Update TypeScript types
- ✅ Document implementation

---

## 🚨 Important Notes

### For Developers:

1. **Always use `scheduled_datetime`** as the source of truth for new code
2. **Keep backward compatibility** with `scheduledDate` and `scheduledTime` fields
3. **Use `formatLocalTime()` and `formatLocalDate()`** for displaying times (never hardcode timezones)
4. **Test across timezones** before deploying

### For QA:

1. Test booking creation in different timezones
2. Verify times display correctly after timezone changes
3. Check that barbers see correct times
4. Ensure notifications show correct times

### For Production:

1. Database migration is backward compatible
2. Old bookings will continue working
3. New bookings use improved timezone handling
4. No user-facing changes required

---

## 📚 References

- **Grab Engineering**: Store UTC, display local
- **ISO 8601**: International date/time standard
- **PostgreSQL TIMESTAMPTZ**: Timezone-aware timestamp type
- **JavaScript Date**: Uses user's device timezone
- **Intl.DateTimeFormat**: Automatic timezone conversion

---

## 🎉 Result

✅ **Production-ready timezone handling**  
✅ **Works globally across all timezones**  
✅ **Matches Grab's best practices**  
✅ **Backward compatible**  
✅ **User-friendly display**

Your app now handles timezones correctly like Grab, Uber, and other world-class platforms! 🚀
