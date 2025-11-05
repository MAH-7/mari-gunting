# Partner App Job Progress Timeline - Grab Standard Fix

## Problem
When barber pressed "Start Service" button, the Job Progress timeline on Job Details screen did not update properly (not tally).

## Root Causes Found

### 1. Timeline Hidden for 'arrived' Status
**Line 1037 (before fix):**
```typescript
{!['completed', 'cancelled', 'rejected', 'expired', 'pending'].includes(selectedJob.status) && selectedJob.status !== 'arrived' && (
```
❌ Timeline disappeared completely when barber arrived at customer location

### 2. Wrong Status String in Timeline Logic
**Lines 1085, 1093 (before fix):**
```typescript
{selectedJob.status === 'in-progress' && (  // ❌ WRONG
{selectedJob.status === 'in-progress' ? 'Currently servicing' : 'Not started'}
```
❌ Database uses `'in_progress'` (underscore) but code checked `'in-progress'` (hyphen) → never matched

### 3. Missing "Arrived" Step in Timeline
❌ Timeline only showed 3 steps: Accepted → On the way → In Progress
✅ Grab shows 4 steps: Accepted → On the way → **Arrived** → In Progress

### 4. No Real-Time Status Updates
❌ Timeline only updated every 30s via polling (line 80: `refetchInterval: 30000`)
✅ Grab uses instant real-time updates via subscriptions

---

## Solutions Implemented (Grab Standard)

### ✅ Fix 1: Remove 'arrived' Status Filter
**File:** `apps/partner/app/(tabs)/jobs.tsx` line 1067
```typescript
// BEFORE:
{!['completed', 'cancelled', 'rejected', 'expired', 'pending'].includes(selectedJob.status) && selectedJob.status !== 'arrived' && (

// AFTER:
{!['completed', 'cancelled', 'rejected', 'expired', 'pending'].includes(selectedJob.status) && (
```
**Result:** Timeline now visible for ALL active statuses including 'arrived'

---

### ✅ Fix 2: Fix Status String Bug
**File:** `apps/partner/app/(tabs)/jobs.tsx` lines 1137, 1145
```typescript
// BEFORE:
{selectedJob.status === 'in-progress' && (
{selectedJob.status === 'in-progress' ? 'Currently servicing' : 'Not started'}

// AFTER:
{selectedJob.status === 'in_progress' && (
{selectedJob.status === 'in_progress' ? 'Currently servicing' : 'Not started'}
```
**Result:** "Service in Progress" step now shows active dot and pulse animation correctly

---

### ✅ Fix 3: Add "Arrived" Step to Timeline
**File:** `apps/partner/app/(tabs)/jobs.tsx` lines 1107-1127
```typescript
{/* Arrived */}
<View style={styles.timelineItem}>
  <View style={styles.timelineIndicator}>
    <View style={[
      styles.timelineDot,
      ['arrived', 'in_progress'].includes(selectedJob.status) && styles.timelineDotCompleted,
      ['accepted', 'on_the_way'].includes(selectedJob.status) && styles.timelineDotPending
    ]}>
      {['arrived', 'in_progress'].includes(selectedJob.status) && (
        <Ionicons name="checkmark" size={12} color={COLORS.background.primary} />
      )}
    </View>
    <View style={styles.timelineLine} />
  </View>
  <View style={styles.timelineContent}>
    <Text style={styles.timelineLabel}>Arrived</Text>
    <Text style={styles.timelineTime}>
      {['arrived', 'in_progress'].includes(selectedJob.status) ? 'At customer location' : 'Pending'}
    </Text>
  </View>
</View>
```
**Result:** Timeline now shows 4 steps matching Grab standard

---

### ✅ Fix 4: Add Timestamps to Timeline Steps (Grab Standard)
**Files:** 
- `apps/partner/app/(tabs)/jobs.tsx` lines 1082, 1104-1106, 1129-1131, 1153-1155
- `apps/partner/types/index.ts` lines 212-215

**Implementation:**
```typescript
// Accepted step
{selectedJob.accepted_at ? formatLocalTime(selectedJob.accepted_at) : 'Job accepted'}

// On the way step
{selectedJob.on_the_way_at 
  ? formatLocalTime(selectedJob.on_the_way_at)
  : ['on_the_way', 'arrived', 'in_progress'].includes(selectedJob.status) ? 'Heading to location' : 'Pending'
}

// Arrived step
{selectedJob.arrived_at
  ? formatLocalTime(selectedJob.arrived_at)
  : ['arrived', 'in_progress'].includes(selectedJob.status) ? 'At customer location' : 'Pending'
}

// In progress step
{selectedJob.started_at
  ? `${formatLocalTime(selectedJob.started_at)} - Now`
  : selectedJob.status === 'in_progress' ? 'Currently servicing' : 'Not started'
}
```

**Database Fields Used:**
- `accepted_at` - Set when status changes to 'accepted'
- `on_the_way_at` - Set when status changes to 'on_the_way'
- `arrived_at` - Set when status changes to 'arrived'
- `started_at` - Set when status changes to 'in_progress'

These timestamps are automatically set by `update_booking_status` function in database (lines 52-55 in migration `20250123_update_booking_status_with_refund.sql`)

**Result:** Each completed step shows actual time (e.g., "9:30 AM"), active step shows "9:45 AM - Now"

---

### ✅ Fix 5: Add Real-Time Status Updates
**File:** `apps/partner/app/(tabs)/jobs.tsx` lines 172-200
```typescript
// Real-time subscription for booking status updates (Grab pattern: instant timeline updates)
useEffect(() => {
  if (!selectedJob?.id) return;

  console.log('🔊 Setting up real-time status updates for job:', selectedJob.id);

  const channel = supabase
    .channel(`booking-status-${selectedJob.id}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings',
        filter: `id=eq.${selectedJob.id}`,
      },
      (payload) => {
        console.log('🔄 Job status updated in real-time:', payload.new);
        setSelectedJob(payload.new as Booking);
        // Also refresh full list
        queryClient.invalidateQueries({ queryKey: ['barber-bookings'] });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [selectedJob?.id, queryClient]);
```
**Result:** Timeline updates **instantly** when barber presses action buttons

---

## Timeline Flow (After Fix)

### Status: `accepted` → `on_the_way`
✅ Step 1: Accepted (green checkmark)
   📅 9:30 AM
⚪ Step 2: On the way (pending gray)
   Pending
⚪ Step 3: Arrived (pending gray)
   Pending
⚪ Step 4: Service in Progress (pending gray)
   Not started

### Status: `on_the_way` → `arrived`
✅ Step 1: Accepted (green checkmark)
   📅 9:30 AM
✅ Step 2: On the way (green checkmark)
   📅 9:45 AM
⚪ Step 3: Arrived (pending gray)
   Pending
⚪ Step 4: Service in Progress (pending gray)
   Not started

### Status: `arrived` → `in_progress`
✅ Step 1: Accepted (green checkmark)
   📅 9:30 AM
✅ Step 2: On the way (green checkmark)
   📅 9:45 AM
✅ Step 3: Arrived (green checkmark)
   📅 10:05 AM
🔵 Step 4: Service in Progress (active blue with pulse animation)
   📅 10:10 AM - Now

---

## Testing

### Test 1: Accept Job → On the Way
1. Accept job
2. Press "I'm on the way" button
3. ✅ Timeline updates instantly showing step 2 completed

### Test 2: Arrive at Location
1. Press "I've Arrived" button
2. ✅ Timeline now shows "Arrived" step (was hidden before)
3. ✅ Step 3 shows green checkmark

### Test 3: Start Service
1. Press "Start Service" button
2. ✅ Step 4 shows active blue dot with pulse animation
3. ✅ Text changes to "Currently servicing" (was stuck on "Not started" before)

### Test 4: Real-Time Update
1. Update job status via Supabase dashboard or another device
2. ✅ Partner app timeline updates instantly without refresh

---

## Comparison: Before vs After

| Feature | Before | After (Grab Standard) |
|---------|--------|----------------------|
| Timeline visibility | Hidden when 'arrived' | ✅ Visible for all active statuses |
| Number of steps | 3 steps | ✅ 4 steps (added "Arrived") |
| "In Progress" status | Never showed (bug) | ✅ Shows correctly with pulse animation |
| Timestamps | No timestamps | ✅ Shows actual time for each step |
| Update method | Polling every 30s | ✅ Real-time instant updates |
| User experience | Confusing, timeline disappears | ✅ Smooth, always visible, clear progress |

---

## Files Modified
- `apps/partner/app/(tabs)/jobs.tsx` (8 changes)
  - Line 172-200: Added real-time subscription
  - Line 1067: Removed 'arrived' status filter
  - Line 1107-1127: Added "Arrived" timeline step
  - Lines 1137, 1145: Fixed status string 'in-progress' → 'in_progress'
  - Line 1082: Added timestamp to "Accepted" step
  - Lines 1104-1106: Added timestamp to "On the way" step
  - Lines 1129-1131: Added timestamp to "Arrived" step
  - Lines 1153-1155: Added timestamp to "In Progress" step (shows "- Now")
- `apps/partner/types/index.ts` (1 change)
  - Lines 212-215: Added timestamp fields (accepted_at, on_the_way_at, arrived_at, started_at)

---

## Production Ready ✅
- Matches Grab/Foodpanda driver app behavior
- Real-time updates like ride-hailing apps
- All 4 job stages clearly visible
- No more confusing timeline disappearance
- Instant feedback on status changes
