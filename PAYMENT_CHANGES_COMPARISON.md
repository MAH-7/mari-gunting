# Payment Logic Changes - What I Broke

## Original (Your Working Version) - Line 99-103

```sql
payment_status,
(CASE 
  WHEN (p_payment_method LIKE 'curlec%') AND p_curlec_payment_id IS NOT NULL THEN 'completed'
  WHEN p_payment_method = 'credits' THEN 'completed'
  ELSE 'pending'
END)::payment_status,
```

### Logic:
- ✅ Has payment ID → `completed`
- ✅ Credits payment → `completed`
- ✅ Everything else → `pending`

**Result**: Only 2 statuses: `pending` or `completed`

---

## My Changes (Broken Version) - Line 79-86

```sql
-- Determine payment status
IF p_payment_method = 'cash' THEN
  v_payment_status := 'pending';
ELSIF p_curlec_payment_id IS NOT NULL THEN
  v_payment_status := 'authorized';  -- ❌ CHANGED from 'completed'
ELSE
  v_payment_status := 'pending_payment';  -- ❌ NEW status you never used
END IF;
```

### Logic:
- Cash → `pending`
- Has payment ID → `authorized` ❌ (you used `completed`)
- Everything else → `pending_payment` ❌ (you used `pending`)

**Result**: 3 statuses: `pending`, `authorized`, `pending_payment`

---

## What I Broke:

### 1. **Added `pending_payment` status** ❌
- Your code never used this
- Causes UI confusion ("PENDING_PAYMENT" looks ugly)

### 2. **Changed `completed` → `authorized`** ❌
- When payment ID exists, you marked as `completed`
- I changed it to `authorized`
- This might break payment display logic

### 3. **Removed `credits` payment handling** ❌
- Your original handled `credits` → `completed`
- I didn't include this logic

---

## What Should Be Fixed:

### Option 1: Revert to Your Original Logic (Recommended)
```sql
-- Determine payment status (YOUR ORIGINAL)
IF (p_payment_method LIKE 'curlec%') AND p_curlec_payment_id IS NOT NULL THEN
  v_payment_status := 'completed';
ELSIF p_payment_method = 'credits' THEN
  v_payment_status := 'completed';
ELSE
  v_payment_status := 'pending';
END IF;
```

### Option 2: Keep My Changes But Fix Issues
```sql
-- Determine payment status (FIXED VERSION)
IF p_payment_method = 'cash' THEN
  v_payment_status := 'pending';
ELSIF p_payment_method = 'credits' THEN
  v_payment_status := 'completed';  -- ← Add credits handling
ELSIF p_curlec_payment_id IS NOT NULL THEN
  v_payment_status := 'completed';  -- ← Change back to completed
ELSE
  v_payment_status := 'pending';  -- ← Remove pending_payment
END IF;
```

---

## Impact Analysis:

| Scenario | Your Original | My Broken Version | Impact |
|----------|---------------|-------------------|--------|
| Cash booking | `pending` | `pending` | ✅ Same |
| Card booking (no payment yet) | `pending` | `pending_payment` | ❌ Different UI display |
| Card booking (paid) | `completed` | `authorized` | ❌ Might show wrong status |
| Credits payment | `completed` | `pending_payment` | ❌ BROKEN - credits ignored |
| Rejected booking | `pending` | `pending_payment` | ❌ Shows ugly "PENDING_PAYMENT" |

---

## Recommended Fix:

**Revert to your exact original logic** - it was simpler and worked perfectly:
- Only 2 statuses: `pending` or `completed`
- No confusing `pending_payment` or `authorized`
- Handles all payment methods correctly

Apply this SQL in Supabase Dashboard to fix it immediately.
