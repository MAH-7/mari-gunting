# Location Architecture - Production Ready

## Overview

This document describes the production-ready location architecture for Mari Gunting app, designed to handle real-time partner tracking and customer address management efficiently.

## Architecture Decision

### ✅ Approved Design

```
┌─────────────────────────────────────────────────────────────┐
│                     Location Data Flow                       │
└─────────────────────────────────────────────────────────────┘

PARTNERS (Barbers):
┌──────────────┐
│   profiles   │
│              │
│  location    │ ← Real-time GPS (PostGIS GEOMETRY)
│              │   Updated every 5 minutes while online
└──────────────┘

CUSTOMERS:
┌──────────────────────┐
│  customer_addresses  │
│                      │
│  location            │ ← Saved addresses (PostGIS GEOMETRY)
│  address_line1       │   Home, Work, Other
│  is_default          │
└──────────────────────┘

BOOKINGS:
┌────────────────────────────┐
│         bookings           │
│                            │
│  customer_location         │ ← Where service happens
│  customer_address_text     │
│                            │
│  barber_location_at_accept │ ← Barber's location snapshots
│  barber_location_at_start  │
│  barber_location_at_complete│
│                            │
│  distance_km               │ ← Auto-calculated
│  estimated_travel_time_min │
└────────────────────────────┘
```

## Database Schema

### 1. profiles.location

**Purpose:** Track real-time partner (barber) location

```sql
Column: location
Type: GEOMETRY(Point, 4326)
Index: GIST index for spatial queries
Updated: Every 5 minutes while partner is online
```

**Usage:**
- Partner app updates this on:
  - App startup (when going online)
  - Every 5 minutes while online
  - Manual "Update Location" button press
- Customer app queries this to find nearby partners

### 2. customer_addresses

**Purpose:** Store customer's saved addresses

```sql
CREATE TABLE customer_addresses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  label TEXT, -- 'Home', 'Work', 'Other'
  location GEOMETRY(Point, 4326), -- Main location column
  latitude TEXT GENERATED, -- Computed for backward compatibility
  longitude TEXT GENERATED, -- Computed for backward compatibility
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  is_default BOOLEAN,
  location_updated_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE INDEX idx_customer_addresses_location 
  ON customer_addresses USING GIST (location);
```

### 3. bookings locations

**Purpose:** Record exact locations during booking lifecycle

```sql
ALTER TABLE bookings ADD COLUMN (
  -- Customer location
  customer_location GEOMETRY(Point, 4326), -- Where service happens
  customer_address_text TEXT, -- Human-readable address
  customer_location_accuracy DECIMAL(10, 2), -- GPS accuracy in meters
  
  -- Barber location snapshots
  barber_location_at_accept GEOMETRY(Point, 4326), -- When accepted
  barber_location_at_start GEOMETRY(Point, 4326), -- When started traveling
  barber_location_at_complete GEOMETRY(Point, 4326), -- When completed
  
  -- Calculated fields
  distance_km DECIMAL(10, 2), -- Auto-calculated distance
  estimated_travel_time_minutes INTEGER -- Estimated travel time
);
```

## Migration Steps

### Step 1: Run Database Migrations

```bash
# In Supabase SQL Editor or via migration files

# 1. Fix customer_addresses table
\i supabase/migrations/20250114_fix_customer_addresses_location.sql

# 2. Add booking location columns
\i supabase/migrations/20250114_add_booking_locations.sql
```

### Step 2: Update Partner App Code

Update `locationTrackingService.ts` to use consistent PostGIS format:

```typescript
// Already implemented - uses POINT(lng lat) format
await supabase
  .from('profiles')
  .update({
    location: `POINT(${longitude} ${latitude})`,
    updated_at: new Date().toISOString(),
  })
  .eq('id', userId);
```

### Step 3: Update Customer App Code

Update address saving to use PostGIS:

```typescript
import { coordinatesToPostGIS } from '@mari-gunting/shared/services/locationService';

await supabase
  .from('customer_addresses')
  .insert({
    user_id: userId,
    label: 'Home',
    location: coordinatesToPostGIS({ latitude, longitude }),
    address_line1: '...',
    // ... other fields
  });
```

### Step 4: Update Booking Creation

```typescript
// When customer creates booking
const booking = await supabase
  .from('bookings')
  .insert({
    customer_id: customerId,
    barber_id: barberId,
    customer_location: coordinatesToPostGIS(customerLocation),
    customer_address_text: selectedAddress.fullAddress,
    // ... other fields
  });

// When barber accepts booking
await supabase
  .from('bookings')
  .update({
    barber_location_at_accept: partnerCurrentLocation,
    // distance_km is auto-calculated by trigger
  })
  .eq('id', bookingId);
```

## Query Examples

### Find Nearby Partners

```sql
-- Using PostGIS distance calculation
SELECT 
  p.id,
  p.full_name,
  b.rating,
  ST_Distance(
    p.location::geography,
    ST_SetSRID(ST_MakePoint($customer_lng, $customer_lat), 4326)::geography
  ) / 1000 AS distance_km
FROM profiles p
JOIN barbers b ON b.user_id = p.id
WHERE 
  p.role = 'barber'
  AND p.is_online = true
  AND b.is_available = true
  AND ST_DWithin(
    p.location::geography,
    ST_SetSRID(ST_MakePoint($customer_lng, $customer_lat), 4326)::geography,
    $radius_meters
  )
ORDER BY distance_km ASC
LIMIT 20;
```

### Get Customer's Default Address

```sql
SELECT 
  id,
  label,
  ST_X(location) as longitude,
  ST_Y(location) as latitude,
  address_line1,
  city,
  state
FROM customer_addresses
WHERE user_id = $user_id
  AND is_default = true
LIMIT 1;
```

## Data Format Guidelines

### When Storing Location

**Always use PostGIS GEOMETRY:**
```sql
location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
-- OR
location = 'POINT(longitude latitude)'::geometry
```

### When Reading Location

**Parse using locationService:**
```typescript
import { parseLocation } from '@mari-gunting/shared/services/locationService';

const coords = parseLocation(profile.location);
// Returns: { latitude: number, longitude: number }
```

## Best Practices

### ✅ DO:
1. **Use PostGIS GEOMETRY for all location columns**
2. **Create GIST indexes on geometry columns**
3. **Use `::geography` for distance calculations** (accounts for Earth's curvature)
4. **Store location snapshots in bookings** (for audit trail)
5. **Calculate distances on the server** (more accurate, less client load)

### ❌ DON'T:
1. Don't store latitude/longitude as separate columns (except as computed columns)
2. Don't use text/varchar for location data
3. Don't calculate long distances with Haversine on client (use PostGIS)
4. Don't mix coordinate systems (always use SRID 4326 = WGS84)

## Performance Considerations

### Indexes
```sql
-- Essential indexes
CREATE INDEX idx_profiles_location ON profiles USING GIST (location);
CREATE INDEX idx_customer_addresses_location ON customer_addresses USING GIST (location);
CREATE INDEX idx_bookings_customer_location ON bookings USING GIST (customer_location);

-- Composite indexes for common queries
CREATE INDEX idx_profiles_online_location 
  ON profiles (is_online) 
  WHERE role = 'barber';
```

### Query Optimization
- Use `ST_DWithin` instead of `ST_Distance` for filtering (faster)
- Limit results with `LIMIT` clause
- Cache partner locations on client for 5 minutes

## Testing

### Test Data Setup

```sql
-- Insert test barber with location in KL
INSERT INTO profiles (id, full_name, role, location, is_online)
VALUES (
  gen_random_uuid(),
  'Test Barber KL',
  'barber',
  ST_SetSRID(ST_MakePoint(101.6869, 3.1390), 4326), -- KL coords
  true
);

-- Insert test customer address in KL
INSERT INTO customer_addresses (
  id, user_id, label, location, address_line1, city, is_default
)
VALUES (
  gen_random_uuid(),
  $customer_id,
  'Home',
  ST_SetSRID(ST_MakePoint(101.6900, 3.1400), 4326), -- Near KL
  'Jalan Test',
  'Kuala Lumpur',
  true
);
```

### Distance Validation

```sql
-- Verify distance calculation
SELECT 
  ST_Distance(
    ST_SetSRID(ST_MakePoint(101.6869, 3.1390), 4326)::geography,
    ST_SetSRID(ST_MakePoint(101.6900, 3.1400), 4326)::geography
  ) / 1000 AS distance_km;
-- Should return ~0.4 km
```

## Monitoring

### Key Metrics to Track
1. **Location update frequency:** Partners should update every 5 minutes
2. **Location accuracy:** GPS accuracy < 50m is good
3. **Query performance:** Distance queries < 100ms
4. **Data quality:** % of profiles with valid location data

### Alerts
- Alert if partner location hasn't updated in > 10 minutes while online
- Alert if distance calculation returns NULL
- Alert if GPS accuracy > 500m (poor signal)

## Future Enhancements

1. **Real-time tracking:** WebSocket updates for partner location during active booking
2. **Geofencing:** Auto-mark "arrived" when partner enters customer location radius
3. **Route optimization:** Suggest optimal route for partner to customer
4. **Historical tracking:** Store location history for analytics

## Support

For questions or issues, contact the engineering team or refer to:
- PostGIS Documentation: https://postgis.net/documentation/
- Expo Location API: https://docs.expo.dev/versions/latest/sdk/location/
