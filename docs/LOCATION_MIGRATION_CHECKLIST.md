# Location Architecture Migration Checklist

## ✅ Pre-Migration

- [ ] Backup database before migration
- [ ] Review `LOCATION_ARCHITECTURE.md` document
- [ ] Test migrations on development/staging environment first
- [ ] Coordinate deployment with team (requires app update)

## 📋 Database Migration

### Step 1: Run Migrations in Supabase

```bash
# Login to Supabase Dashboard > SQL Editor
# Run these migrations in order:
```

- [ ] Run `20250114_fix_customer_addresses_location.sql`
  - Converts `customer_addresses.location` to PostGIS GEOMETRY
  - Migrates existing lat/lng data
  - Creates spatial index
  
- [ ] Run `20250114_add_booking_locations.sql`
  - Adds location tracking columns to bookings
  - Creates distance calculation trigger
  - Creates spatial indexes

- [ ] Verify migrations:
```sql
-- Check customer_addresses schema
\d customer_addresses;
-- Should show: location GEOMETRY(Point,4326)

-- Check bookings schema
\d bookings;
-- Should show: customer_location, barber_location_at_accept, etc.
```

## 🔧 Code Changes

### Shared Package

- [x] WKB parsing already added to `supabaseApi.ts`
- [ ] Add `coordinatesToPostGIS()` helper to exports
- [ ] Add `parseLocation()` helper to exports

### Partner App

- [x] `locationTrackingService.ts` already uses correct format
- [ ] Verify location updates working after migration
- [ ] Test "Update My Location" button

### Customer App

- [ ] Update address creation to use PostGIS format:
```typescript
// In address save/update functions
location: `POINT(${longitude} ${latitude})`
```

- [ ] Update barber search queries to use new location format
- [ ] Test distance calculations
- [ ] Test address selection flow

### Booking Flow

- [ ] Update booking creation to capture customer location
- [ ] Update barber acceptance to capture barber location
- [ ] Update booking start/complete to capture barber locations
- [ ] Test full booking lifecycle

## 🧪 Testing

### Database Level
- [ ] Test PostGIS functions work:
```sql
SELECT ST_AsText(location) FROM profiles WHERE role = 'barber' LIMIT 1;
SELECT ST_AsText(location) FROM customer_addresses LIMIT 1;
```

- [ ] Test distance calculations:
```sql
SELECT 
  id,
  ST_Distance(
    location::geography,
    ST_SetSRID(ST_MakePoint(101.6869, 3.1390), 4326)::geography
  ) / 1000 as distance_km
FROM profiles
WHERE role = 'barber' AND location IS NOT NULL
LIMIT 5;
```

### App Level

#### Partner App
- [ ] Press "Update My Location" button
- [ ] Check logs show correct coordinates
- [ ] Verify location saved in database
- [ ] Verify no errors/warnings in console

#### Customer App
- [ ] Create new address
- [ ] Verify location saved in database
- [ ] Search for nearby barbers
- [ ] Verify barber locations parsed correctly
- [ ] No "Failed to parse location" warnings

#### Booking Flow
- [ ] Create booking as customer
- [ ] Accept booking as partner
- [ ] Verify both locations captured in bookings table
- [ ] Verify distance_km auto-calculated
- [ ] Complete booking
- [ ] Verify all location snapshots saved

## 🚀 Deployment

- [ ] Deploy database migrations to production
- [ ] Deploy updated partner app
- [ ] Deploy updated customer app
- [ ] Monitor error logs for 24 hours
- [ ] Monitor location update frequency

## 📊 Post-Deployment Validation

### Data Quality Check
```sql
-- Check how many partners have valid locations
SELECT 
  COUNT(*) as total_partners,
  COUNT(location) as with_location,
  ROUND(COUNT(location)::numeric / COUNT(*) * 100, 2) as percentage
FROM profiles 
WHERE role = 'barber';

-- Check customer addresses
SELECT 
  COUNT(*) as total_addresses,
  COUNT(location) as with_location,
  ROUND(COUNT(location)::numeric / COUNT(*) * 100, 2) as percentage
FROM customer_addresses;

-- Check recent bookings have locations
SELECT 
  COUNT(*) as total_bookings,
  COUNT(customer_location) as with_customer_loc,
  COUNT(barber_location_at_accept) as with_barber_loc
FROM bookings 
WHERE created_at > NOW() - INTERVAL '7 days';
```

### Performance Check
```sql
-- Check spatial index usage
EXPLAIN ANALYZE
SELECT COUNT(*)
FROM profiles
WHERE role = 'barber'
  AND ST_DWithin(
    location::geography,
    ST_SetSRID(ST_MakePoint(101.6869, 3.1390), 4326)::geography,
    10000 -- 10km
  );
-- Should use GIST index scan
```

## 🔍 Monitoring

### Key Metrics (First Week)
- [ ] Average location update frequency per partner
- [ ] % of bookings with all required locations
- [ ] Distance calculation accuracy
- [ ] Query performance (< 100ms for distance searches)
- [ ] Error rate in location parsing

### Alerts Setup
- [ ] Alert if any partner location hasn't updated in > 15 minutes (while online)
- [ ] Alert if > 5% of location parsing fails
- [ ] Alert if distance query performance > 200ms

## 📝 Documentation

- [x] Architecture documentation created
- [ ] Update API documentation with new location fields
- [ ] Update mobile app documentation
- [ ] Share migration notes with team

## 🔄 Rollback Plan

If issues occur:

1. **Database rollback:**
```sql
-- Revert customer_addresses (if needed)
ALTER TABLE customer_addresses 
  DROP COLUMN IF EXISTS location CASCADE;

ALTER TABLE customer_addresses
  ADD COLUMN latitude TEXT,
  ADD COLUMN longitude TEXT;

-- Revert bookings (if needed)
ALTER TABLE bookings
  DROP COLUMN IF EXISTS customer_location,
  DROP COLUMN IF EXISTS barber_location_at_accept,
  DROP COLUMN IF EXISTS barber_location_at_start,
  DROP COLUMN IF EXISTS barber_location_at_complete,
  DROP COLUMN IF EXISTS distance_km,
  DROP COLUMN IF EXISTS estimated_travel_time_minutes;
```

2. **App rollback:**
   - Revert to previous app version
   - Monitor for 1 hour
   - Investigate issues

## ✨ Success Criteria

Migration is successful when:
- ✅ All partners can update their location
- ✅ All customers can save addresses
- ✅ Distance calculations work correctly
- ✅ No location parsing errors
- ✅ Booking flow captures all required locations
- ✅ Performance meets targets (< 100ms queries)
- ✅ Zero data loss

## 📞 Support

- Engineering Lead: [Your Name]
- Database Admin: [Name]
- On-call Engineer: [Name]
- Slack Channel: #mari-gunting-engineering

---

**Last Updated:** 2025-01-14
**Migration Status:** ⏳ Ready for Implementation
