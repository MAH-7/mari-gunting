# Service Radius Database Schema

**Date:** October 13, 2025  
**Feature:** Service Radius Management with 24-Hour Cooldown

---

## Database Schema

### Barbers Table

```sql
-- Add these columns to the barbers table
ALTER TABLE barbers 
ADD COLUMN service_radius_km INTEGER DEFAULT 20 
  CHECK (service_radius_km >= 1 AND service_radius_km <= 20),
ADD COLUMN last_radius_change_at TIMESTAMPTZ NULL;

-- Create index for efficient queries
CREATE INDEX idx_barbers_last_radius_change 
ON barbers(last_radius_change_at);

-- Add comment
COMMENT ON COLUMN barbers.service_radius_km IS 
  'How far the barber is willing to travel to serve customers (in kilometers). Range: 1-20km, Default: 20km';

COMMENT ON COLUMN barbers.last_radius_change_at IS 
  'Timestamp of the last time barber changed their service radius. Used for 24-hour cooldown enforcement.';
```

---

## Field Details

### `service_radius_km`
- **Type:** INTEGER
- **Default:** 20
- **Range:** 1-20 (enforced by CHECK constraint)
- **Nullable:** NO
- **Purpose:** Defines how far the barber will travel to serve customers

**Values:**
- `1-5km`: Nearby only (rare)
- `5-10km`: Short distance
- `10-15km`: Medium distance
- `15-20km`: Long distance (most common)

---

### `last_radius_change_at`
- **Type:** TIMESTAMPTZ (timestamp with timezone)
- **Default:** NULL
- **Nullable:** YES
- **Purpose:** Tracks when barber last changed their radius for cooldown enforcement

**Logic:**
- NULL = Never changed (can change anytime)
- Has timestamp = Check if 24 hours passed
- If < 24 hours = Show cooldown message
- If >= 24 hours = Allow change

---

## Cooldown Logic

### SQL Query to Check Cooldown:

```sql
-- Check if barber can change radius
SELECT 
  service_radius_km,
  last_radius_change_at,
  CASE 
    WHEN last_radius_change_at IS NULL THEN true
    WHEN NOW() - last_radius_change_at >= INTERVAL '24 hours' THEN true
    ELSE false
  END AS can_change,
  CASE 
    WHEN last_radius_change_at IS NULL THEN NULL
    WHEN NOW() - last_radius_change_at < INTERVAL '24 hours' THEN 
      EXTRACT(EPOCH FROM (last_radius_change_at + INTERVAL '24 hours' - NOW())) / 3600
    ELSE 0
  END AS hours_remaining
FROM barbers
WHERE id = $1;
```

---

## Update Logic

### Successful Update Flow:

```sql
-- Update service radius with cooldown check
UPDATE barbers
SET 
  service_radius_km = $2,
  last_radius_change_at = NOW(),
  updated_at = NOW()
WHERE id = $1
  AND (
    last_radius_change_at IS NULL 
    OR NOW() - last_radius_change_at >= INTERVAL '24 hours'
  )
RETURNING *;
```

**Returns:**
- If cooldown passed: Updated row
- If cooldown active: No rows (0 affected)

---

## Migration Script

### Full Migration SQL:

```sql
-- Migration: Add service radius management
-- Date: 2025-10-13

BEGIN;

-- Add service_radius_km column
ALTER TABLE barbers 
ADD COLUMN IF NOT EXISTS service_radius_km INTEGER DEFAULT 20 
  CHECK (service_radius_km >= 1 AND service_radius_km <= 20);

-- Add last_radius_change_at column
ALTER TABLE barbers 
ADD COLUMN IF NOT EXISTS last_radius_change_at TIMESTAMPTZ NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_barbers_last_radius_change 
ON barbers(last_radius_change_at);

-- Add comments
COMMENT ON COLUMN barbers.service_radius_km IS 
  'How far the barber is willing to travel to serve customers (in kilometers). Range: 1-20km, Default: 20km';

COMMENT ON COLUMN barbers.last_radius_change_at IS 
  'Timestamp of the last time barber changed their service radius. Used for 24-hour cooldown enforcement.';

-- Set default for existing barbers (if any)
UPDATE barbers 
SET service_radius_km = 20 
WHERE service_radius_km IS NULL;

COMMIT;
```

---

## Database Types (TypeScript)

### Type Definition:

```typescript
// packages/shared/types/database.ts

export interface Barber {
  id: string;
  user_id: string;
  
  // ... other fields
  
  // Service Radius
  service_radius_km: number;           // 1-20, default 20
  last_radius_change_at: string | null; // ISO timestamp or null
  
  // ... other fields
  
  updated_at: string;
}
```

---

## Example Data

### Sample Barber Records:

```sql
-- Barber who never changed radius
INSERT INTO barbers (id, user_id, service_radius_km, last_radius_change_at)
VALUES (
  'barber-1',
  'user-1',
  20,
  NULL  -- Never changed, can change anytime
);

-- Barber who changed 12 hours ago (still in cooldown)
INSERT INTO barbers (id, user_id, service_radius_km, last_radius_change_at)
VALUES (
  'barber-2',
  'user-2',
  15,
  NOW() - INTERVAL '12 hours'  -- Changed 12h ago, need to wait 12h more
);

-- Barber who changed 25 hours ago (can change again)
INSERT INTO barbers (id, user_id, service_radius_km, last_radius_change_at)
VALUES (
  'barber-3',
  'user-3',
  10,
  NOW() - INTERVAL '25 hours'  -- Changed 25h ago, can change now
);
```

---

## Query Examples

### 1. Get Barber's Current Settings:

```sql
SELECT 
  id,
  service_radius_km,
  last_radius_change_at,
  CASE 
    WHEN last_radius_change_at IS NULL THEN 'never'
    ELSE to_char(last_radius_change_at, 'YYYY-MM-DD HH24:MI:SS')
  END AS last_changed
FROM barbers
WHERE id = 'barber-1';
```

---

### 2. Check if Can Change:

```sql
SELECT 
  CASE 
    WHEN last_radius_change_at IS NULL THEN true
    WHEN NOW() - last_radius_change_at >= INTERVAL '24 hours' THEN true
    ELSE false
  END AS can_change
FROM barbers
WHERE id = 'barber-1';
```

---

### 3. Get Time Until Can Change:

```sql
SELECT 
  CASE 
    WHEN last_radius_change_at IS NULL THEN 'Can change now'
    WHEN NOW() - last_radius_change_at >= INTERVAL '24 hours' THEN 'Can change now'
    ELSE 
      CONCAT(
        FLOOR(EXTRACT(EPOCH FROM (last_radius_change_at + INTERVAL '24 hours' - NOW())) / 3600),
        ' hours ',
        FLOOR((EXTRACT(EPOCH FROM (last_radius_change_at + INTERVAL '24 hours' - NOW())) % 3600) / 60),
        ' minutes remaining'
      )
  END AS cooldown_status
FROM barbers
WHERE id = 'barber-1';
```

---

### 4. Find Barbers Who Can Change:

```sql
SELECT 
  id,
  service_radius_km,
  last_radius_change_at
FROM barbers
WHERE 
  last_radius_change_at IS NULL 
  OR NOW() - last_radius_change_at >= INTERVAL '24 hours';
```

---

### 5. Update Radius with Cooldown Check:

```sql
-- This will succeed if cooldown passed, fail if still active
UPDATE barbers
SET 
  service_radius_km = 15,
  last_radius_change_at = NOW(),
  updated_at = NOW()
WHERE id = 'barber-1'
  AND (
    last_radius_change_at IS NULL 
    OR NOW() - last_radius_change_at >= INTERVAL '24 hours'
  )
RETURNING 
  id,
  service_radius_km,
  last_radius_change_at;
```

---

## Analytics Queries

### 1. Radius Distribution:

```sql
SELECT 
  service_radius_km,
  COUNT(*) as barber_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM barbers
GROUP BY service_radius_km
ORDER BY service_radius_km;
```

---

### 2. Change Frequency:

```sql
SELECT 
  COUNT(*) as total_barbers,
  COUNT(CASE WHEN last_radius_change_at IS NOT NULL THEN 1 END) as changed_at_least_once,
  COUNT(CASE WHEN last_radius_change_at > NOW() - INTERVAL '7 days' THEN 1 END) as changed_last_week,
  COUNT(CASE WHEN last_radius_change_at > NOW() - INTERVAL '30 days' THEN 1 END) as changed_last_month
FROM barbers;
```

---

### 3. Most Active Changers:

```sql
-- Note: This would require a separate change_log table for full history
-- For now, we only track last change timestamp
SELECT 
  id,
  service_radius_km,
  last_radius_change_at
FROM barbers
WHERE last_radius_change_at IS NOT NULL
ORDER BY last_radius_change_at DESC
LIMIT 10;
```

---

## Optional: Change History Table

### If You Want Full History:

```sql
-- Optional: Track all changes
CREATE TABLE barber_radius_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
  old_radius_km INTEGER,
  new_radius_km INTEGER,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by UUID REFERENCES profiles(id),
  reason TEXT NULL,
  
  CONSTRAINT check_radius_range 
    CHECK (old_radius_km >= 1 AND old_radius_km <= 20 AND new_radius_km >= 1 AND new_radius_km <= 20)
);

CREATE INDEX idx_radius_changes_barber ON barber_radius_changes(barber_id);
CREATE INDEX idx_radius_changes_date ON barber_radius_changes(changed_at);
```

**Use Case:** Analytics, audit trail, detecting abuse

---

## Performance Considerations

### Indexes:
```sql
-- Essential
CREATE INDEX idx_barbers_last_radius_change ON barbers(last_radius_change_at);

-- For customer search queries
CREATE INDEX idx_barbers_service_radius ON barbers(service_radius_km);

-- Composite for advanced queries
CREATE INDEX idx_barbers_radius_online ON barbers(service_radius_km, is_available) 
WHERE is_available = true;
```

---

## Security & Validation

### Application-Level Checks:

```typescript
// Validate radius value
function isValidRadius(radius: number): boolean {
  return radius >= 1 && radius <= 20 && Number.isInteger(radius);
}

// Check cooldown
function canChangeRadius(lastChangeAt: string | null): boolean {
  if (!lastChangeAt) return true;
  
  const lastChange = new Date(lastChangeAt);
  const now = new Date();
  const hoursSinceChange = (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceChange >= 24;
}

// Calculate remaining cooldown
function getRemainingCooldown(lastChangeAt: string | null): number {
  if (!lastChangeAt) return 0;
  
  const lastChange = new Date(lastChangeAt);
  const now = new Date();
  const hoursSinceChange = (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60);
  
  return Math.max(0, 24 - hoursSinceChange);
}
```

---

## Summary

**Key Points:**
- ✅ `service_radius_km`: 1-20, default 20
- ✅ `last_radius_change_at`: Tracks last change for cooldown
- ✅ 24-hour cooldown enforced at database level
- ✅ NULL means never changed (can change anytime)
- ✅ Indexed for performance
- ✅ Check constraint ensures valid range

**Ready for implementation!** 🚀
