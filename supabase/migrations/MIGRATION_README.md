# Location Geography Migration Guide

## 🎯 What This Fixes

Your location columns are currently stored as `text` but your application code expects `geography(Point, 4326)`. This causes:
- ❌ Broken GIST indexes (spatial queries are slow/broken)
- ❌ Inaccurate distance calculations
- ❌ Can't use PostGIS spatial functions properly

## 📋 Pre-Migration Checklist

### 1. Verify Current State
Run the verification script in Supabase SQL Editor:
```bash
cat supabase/migrations/verify_location_data.sql
```

This shows:
- Current column data types
- Existing indexes
- Sample location data format
- Record counts

### 2. Test on Staging First
**NEVER run on production without testing on staging!**

```bash
# If you have staging setup
supabase db push --db-url <staging-url>
```

### 3. Schedule Maintenance Window
- **Estimated time**: 1-5 minutes (depends on data volume)
- **Best time**: Low traffic hours (2-4 AM local time)
- **Risk level**: Medium (has rollback capability)

### 4. Notify Team
- Alert developers that location queries may be briefly affected
- Have someone monitor application logs during migration

## 🚀 Running the Migration

### Option A: Via Supabase Dashboard (Recommended)
1. Go to Supabase Dashboard → SQL Editor
2. Copy content from `20250121_fix_location_geography.sql`
3. Review the SQL carefully
4. Click "Run"
5. Watch for success messages

### Option B: Via Supabase CLI
```bash
cd /Users/bos/Desktop/ProjectSideIncome/mari-gunting

# Apply migration
supabase db push

# Or apply specific file
psql $DATABASE_URL -f supabase/migrations/20250121_fix_location_geography.sql
```

## ✅ Post-Migration Verification

### 1. Check Column Types
```sql
SELECT 
  table_name,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name IN ('profiles', 'barbershops', 'bookings')
  AND column_name LIKE '%location%';
```

Expected output:
```
table_name  | column_name | data_type | udt_name
------------|-------------|-----------|----------
profiles    | location    | USER-DEFINED | geography
barbershops | location    | USER-DEFINED | geography
bookings    | customer_location | USER-DEFINED | geography
```

### 2. Verify Indexes Work
```sql
-- This should use the GIST index (check with EXPLAIN ANALYZE)
EXPLAIN ANALYZE
SELECT * FROM profiles 
WHERE location IS NOT NULL
  AND ST_DWithin(
    location,
    ST_MakePoint(101.6869, 3.1390)::geography,
    5000  -- 5km radius
  )
LIMIT 10;
```

Look for: `Index Scan using idx_profiles_location`

### 3. Test Application
- **Customer App**: Open map, search for nearby barbers
- **Barber App**: Check location updates work
- **Booking Flow**: Verify distance calculations are correct

### 4. Monitor Errors
```bash
# Check Supabase logs
tail -f /var/log/supabase/postgres.log

# Or in Supabase Dashboard
# → Logs → Filter by "error"
```

## 🔙 Rollback (If Needed)

If something goes wrong, you can rollback:

```sql
BEGIN;

-- Method 1: Restore from backup (if you created one)
-- Uncomment if you ran the backup step in migration
-- UPDATE profiles p SET location = b.location::text 
-- FROM profiles_location_backup b WHERE p.id = b.id;

-- Method 2: Drop the geography columns and recreate as text
-- (ONLY IF ABSOLUTELY NECESSARY)
ALTER TABLE profiles DROP COLUMN location;
ALTER TABLE profiles ADD COLUMN location TEXT;

-- Restore from application backups or manual snapshots
-- Contact your team/DevOps immediately

COMMIT;
```

## 📊 Expected Results

### Before Migration
```sql
-- Column type: text
-- Index: GIST (but not working properly)
-- Query time: ~500-2000ms
```

### After Migration
```sql
-- Column type: geography(Point, 4326)
-- Index: GIST (working properly)
-- Query time: ~10-50ms ⚡️
```

## 🐛 Troubleshooting

### Error: "cannot cast type text to geography"
**Cause**: Your location data is not in WKT format
**Fix**: Check data format with verify script, update migration Step 4

### Error: "column location already exists"
**Cause**: Migration was partially run before
**Fix**: Check which step failed, manually complete remaining steps

### App shows no nearby barbers
**Cause**: Application code needs update to use geography type
**Fix**: Update TypeScript types and ensure proper casting:
```typescript
// In your API calls
location: `POINT(${longitude} ${latitude})`
```

## 📞 Support

If issues occur:
1. Check Supabase logs immediately
2. Take screenshots of errors
3. Don't panic - data is safe in transaction
4. Contact senior dev or DBA

## 📝 Notes

- Migration is wrapped in `BEGIN/COMMIT` transaction (atomic)
- All steps are reversible
- Zero data loss risk (columns are renamed, not deleted)
- Indexes are rebuilt automatically
- Your existing functions (`get_nearby_barbers`, etc.) will work better after this

---

**Created**: 2025-01-21  
**Last Updated**: 2025-01-21  
**Status**: Ready for staging test
