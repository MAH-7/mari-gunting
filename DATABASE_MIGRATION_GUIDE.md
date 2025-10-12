# 🗄️ Database Migration Guide - Verification Status

## Overview
This guide walks you through applying the verification status database migration to enable the partner approval flow.

## What This Migration Does

### 1. Adds New Columns
- **`barbers.verification_status`**: TEXT enum ('unverified', 'pending', 'verified', 'rejected')
- **`barbers.is_verified`**: BOOLEAN flag for quick checks
- **`barbershops.verification_status`**: TEXT enum ('unverified', 'pending', 'verified', 'rejected')

### 2. Creates Indexes
- `idx_barbers_verification_status` - For fast filtering by status
- `idx_barbers_is_verified` - For quick verified partner queries
- `idx_barbershops_verification_status` - For barbershop status filtering

### 3. Adds Automation
- **Trigger**: `trigger_sync_barber_verification`
  - Automatically sets `is_verified = true` when `verification_status = 'verified'`
  - Automatically sets `is_verified = false` for other statuses

### 4. Backwards Compatibility
- Updates existing barber/barbershop records to 'pending' status (if created > 1 hour ago)
- Safe to run multiple times (uses `IF NOT EXISTS` checks)

## 📋 Step-by-Step Instructions

### Option 1: Apply via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to your project at https://supabase.com
   - Navigate to: **SQL Editor** (in left sidebar)

2. **Copy the Migration SQL**
   ```bash
   # Copy the contents of the migration file
   cat supabase/migrations/008_add_verification_status_columns.sql
   ```

3. **Paste and Run**
   - Click "New Query" in Supabase SQL Editor
   - Paste the entire SQL content
   - Click **"Run"** or press `Cmd/Ctrl + Enter`

4. **Verify Success**
   - You should see: ✅ Success messages
   - Check for: "Verification status columns added successfully!"

### Option 2: Apply via Supabase CLI

```bash
# Make sure you're in the project root
cd /Users/bos/Desktop/ProjectSideIncome/mari-gunting

# Login to Supabase (if not already)
npx supabase login

# Link to your project (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# Apply the migration
npx supabase db push
```

### Option 3: Apply via Direct Database Connection

If you have direct database access:

```bash
# Using psql
psql "postgresql://[YOUR_DB_URL]" -f supabase/migrations/008_add_verification_status_columns.sql
```

## 🔍 Verification Steps

### 1. Check if Columns Exist

Run this query in Supabase SQL Editor:

```sql
-- Check barbers table
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_name = 'barbers'
AND column_name IN ('verification_status', 'is_verified');

-- Check barbershops table
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_name = 'barbershops'
AND column_name = 'verification_status';
```

Expected output:
```
column_name          | data_type | column_default
---------------------|-----------|----------------
verification_status  | text      | 'unverified'
is_verified          | boolean   | false
```

### 2. Check if Indexes Were Created

```sql
-- Check indexes
SELECT 
  indexname, 
  tablename
FROM pg_indexes
WHERE tablename IN ('barbers', 'barbershops')
AND indexname LIKE '%verification%';
```

Expected output:
```
indexname                           | tablename
------------------------------------|------------
idx_barbers_verification_status     | barbers
idx_barbers_is_verified             | barbers
idx_barbershops_verification_status | barbershops
```

### 3. Check if Trigger Exists

```sql
-- Check trigger
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_sync_barber_verification';
```

Expected output:
```
trigger_name                      | event_manipulation | event_object_table
----------------------------------|--------------------|-----------------
trigger_sync_barber_verification  | INSERT             | barbers
trigger_sync_barber_verification  | UPDATE             | barbers
```

### 4. Test the Trigger

```sql
-- Create a test barber record
INSERT INTO barbers (user_id, verification_status)
VALUES ('00000000-0000-0000-0000-000000000000', 'verified')
RETURNING id, verification_status, is_verified;

-- Expected: is_verified should be true automatically

-- Clean up test
DELETE FROM barbers WHERE user_id = '00000000-0000-0000-0000-000000000000';
```

## 📊 Post-Migration Queries

### View All Partner Statuses

```sql
-- View all barbers with their verification status
SELECT 
  u.name,
  u.phone,
  b.verification_status,
  b.is_verified,
  b.created_at
FROM barbers b
JOIN profiles u ON b.user_id = u.id
ORDER BY b.created_at DESC;

-- View all barbershops with their verification status
SELECT 
  bs.name,
  u.name as owner_name,
  bs.verification_status,
  bs.created_at
FROM barbershops bs
JOIN profiles u ON bs.owner_id = u.id
ORDER BY bs.created_at DESC;
```

### Count Partners by Status

```sql
-- Count barbers by verification status
SELECT 
  verification_status,
  COUNT(*) as count
FROM barbers
GROUP BY verification_status;

-- Count barbershops by verification status
SELECT 
  verification_status,
  COUNT(*) as count
FROM barbershops
GROUP BY verification_status;
```

## 🧪 Testing the Approval Flow

### Test Case 1: New Registration

```sql
-- This should happen automatically via app
-- When partner completes registration, they get 'unverified' status
SELECT verification_status FROM barbers WHERE user_id = 'YOUR_TEST_USER_ID';
-- Expected: 'unverified' or 'pending'
```

### Test Case 2: Approve a Partner

```sql
-- Simulate admin approval
UPDATE barbers
SET verification_status = 'verified'
WHERE user_id = 'YOUR_TEST_USER_ID';

-- Check that is_verified was automatically set to true
SELECT verification_status, is_verified FROM barbers WHERE user_id = 'YOUR_TEST_USER_ID';
-- Expected: verification_status = 'verified', is_verified = true
```

### Test Case 3: Reject a Partner

```sql
-- Simulate admin rejection
UPDATE barbers
SET verification_status = 'rejected'
WHERE user_id = 'YOUR_TEST_USER_ID';

-- Check status
SELECT verification_status, is_verified FROM barbers WHERE user_id = 'YOUR_TEST_USER_ID';
-- Expected: verification_status = 'rejected', is_verified = false
```

### Test Case 4: Mark as Pending

```sql
-- Simulate documents submitted
UPDATE barbers
SET verification_status = 'pending'
WHERE user_id = 'YOUR_TEST_USER_ID';

-- Partner should see "Pending Approval" screen in app
```

## 🔧 Troubleshooting

### Problem: Column Already Exists Error

**Error Message:**
```
ERROR: column "verification_status" of relation "barbers" already exists
```

**Solution:**
This is fine! The migration uses `IF NOT EXISTS` checks, so if columns exist, it skips them. The migration is idempotent and safe to run multiple times.

### Problem: Permission Denied

**Error Message:**
```
ERROR: permission denied for table barbers
```

**Solution:**
Make sure you're running as a superuser or the table owner. In Supabase dashboard, you're automatically authenticated with correct permissions.

### Problem: Constraint Violation

**Error Message:**
```
ERROR: new row for relation "barbers" violates check constraint
```

**Solution:**
This means you're trying to insert an invalid status. Valid statuses are:
- 'unverified'
- 'pending'
- 'verified'
- 'rejected'

### Problem: Trigger Not Firing

**Test:**
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'trigger_sync_barber_verification';
```

**Solution:**
Re-run the trigger creation part of the migration.

## 🔄 Rollback (If Needed)

If you need to rollback this migration:

```sql
-- Remove trigger
DROP TRIGGER IF EXISTS trigger_sync_barber_verification ON barbers;
DROP FUNCTION IF EXISTS sync_barber_verification();

-- Remove indexes
DROP INDEX IF EXISTS idx_barbers_verification_status;
DROP INDEX IF EXISTS idx_barbers_is_verified;
DROP INDEX IF EXISTS idx_barbershops_verification_status;

-- Remove columns (CAUTION: This will delete data!)
ALTER TABLE barbers DROP COLUMN IF EXISTS verification_status;
ALTER TABLE barbers DROP COLUMN IF EXISTS is_verified;
ALTER TABLE barbershops DROP COLUMN IF EXISTS verification_status;
```

## 📝 Migration Checklist

Before applying:
- [ ] Backup your database (Supabase does this automatically)
- [ ] Read through the migration SQL
- [ ] Understand what changes will be made

After applying:
- [ ] Run verification queries (see "Verification Steps" above)
- [ ] Test trigger functionality
- [ ] Check that existing partner records were updated correctly
- [ ] Test the app's approval flow with test accounts
- [ ] Verify pull-to-refresh works in pending-approval screen
- [ ] Check that verification banner shows correctly on dashboard

## 🎯 Next Steps After Migration

1. ✅ Migration applied successfully
2. 🧪 Test with a new partner registration
3. 👨‍💼 Build admin panel to approve/reject partners (future task)
4. 📧 Add email notifications for status changes (future task)
5. 📱 Add push notifications for approvals (future task)

## 📚 Related Documentation

- `APPROVAL_FLOW_IMPLEMENTED.md` - Complete approval flow documentation
- `VERIFICATION_BANNER_IMPLEMENTED.md` - Dashboard banner documentation
- `supabase/migrations/007_partner_account_setup.sql` - Partner setup functions
- `packages/shared/services/verificationService.ts` - Verification service code

## 💡 Tips

- **Safe to Re-run**: This migration is idempotent and can be safely run multiple times
- **Backwards Compatible**: Existing partner records are automatically updated to 'pending' status
- **Performance**: Indexes are created for optimal query performance
- **Automation**: The trigger handles is_verified syncing automatically
- **Flexible**: You can manually update statuses via SQL for testing

---

**Questions?** Check the related documentation files or review the migration SQL file for detailed comments.
