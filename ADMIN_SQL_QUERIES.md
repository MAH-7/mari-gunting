# 📊 Admin SQL Queries - Copy & Paste Ready

**Date:** 2025-10-12  
**Status:** ✅ Tested with actual database schema

---

## 🔍 1. View All Pending Partner Approvals

```sql
SELECT 
  p.id as user_id,
  p.full_name,
  p.phone_number,
  p.email,
  b.verification_status,
  b.created_at,
  b.bio,
  b.experience_years,
  b.bank_name,
  b.bank_account_number,
  EXTRACT(HOUR FROM (NOW() - b.created_at)) as hours_waiting
FROM barbers b
JOIN profiles p ON b.user_id = p.id
WHERE b.verification_status = 'pending'
ORDER BY b.created_at ASC;
```

**What this shows:**
- All partners waiting for approval
- Their contact info
- How long they've been waiting
- Basic details

---

## ✅ 2. Approve a Partner

```sql
-- Step 1: Find the partner by phone number
SELECT 
  p.id as user_id,
  p.full_name, 
  p.phone_number,
  b.verification_status
FROM profiles p
JOIN barbers b ON b.user_id = p.id
WHERE p.phone_number = '+60123456789';  -- Replace with actual phone

-- Step 2: Copy the user_id from above, then approve
UPDATE barbers 
SET 
  verification_status = 'verified',
  is_verified = true,
  updated_at = NOW()
WHERE user_id = 'PASTE_USER_ID_HERE';

-- Step 3: Verify it worked
SELECT 
  p.full_name,
  b.verification_status,
  b.is_verified,
  b.updated_at
FROM barbers b
JOIN profiles p ON b.user_id = p.id
WHERE b.user_id = 'PASTE_USER_ID_HERE';
```

**What happens:**
- Partner status → `verified`
- Partner can now accept bookings
- Next time they open app → Dashboard access

---

## ❌ 3. Reject a Partner

```sql
-- Reject with reason
UPDATE barbers 
SET 
  verification_status = 'rejected',
  is_verified = false,
  updated_at = NOW()
WHERE user_id = 'USER_ID_HERE';

-- Note: rejection_reason is stored in verification_documents JSONB
-- To add rejection reason:
UPDATE barbers 
SET 
  verification_status = 'rejected',
  is_verified = false,
  verification_documents = 
    COALESCE(verification_documents, '{}'::jsonb) || 
    jsonb_build_object('rejection_reason', 'IC photo is unclear'),
  updated_at = NOW()
WHERE user_id = 'USER_ID_HERE';
```

**What happens:**
- Partner sees "Verification Failed"
- They can resubmit documents
- Status goes back to `pending` when they resubmit

---

## 🔄 4. Reset to Pending (If Partner Resubmits)

```sql
UPDATE barbers 
SET 
  verification_status = 'pending',
  updated_at = NOW()
WHERE user_id = 'USER_ID_HERE';
```

---

## 📊 5. Dashboard Queries

### Count Pending Approvals
```sql
SELECT COUNT(*) as pending_count
FROM barbers
WHERE verification_status = 'pending';
```

### View All Partners by Status
```sql
SELECT 
  verification_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM barbers
GROUP BY verification_status
ORDER BY count DESC;
```

### Recently Approved (Last 7 Days)
```sql
SELECT 
  p.full_name,
  p.phone_number,
  b.updated_at as approved_at
FROM barbers b
JOIN profiles p ON b.user_id = p.id
WHERE b.verification_status = 'verified'
  AND b.updated_at >= NOW() - INTERVAL '7 days'
ORDER BY b.updated_at DESC;
```

### Partners Waiting Longest
```sql
SELECT 
  p.full_name,
  p.phone_number,
  b.created_at,
  EXTRACT(DAY FROM (NOW() - b.created_at)) as days_waiting,
  EXTRACT(HOUR FROM (NOW() - b.created_at)) as hours_waiting
FROM barbers b
JOIN profiles p ON b.user_id = p.id
WHERE b.verification_status = 'pending'
ORDER BY b.created_at ASC
LIMIT 10;
```

---

## 🔍 6. View Partner Details

```sql
-- Get full partner information
SELECT 
  p.id as user_id,
  p.full_name,
  p.phone_number,
  p.email,
  p.date_of_birth,
  p.gender,
  p.address_line1,
  p.city,
  p.state,
  b.business_name,
  b.bio,
  b.experience_years,
  b.specializations,
  b.portfolio_images,
  b.verification_status,
  b.verification_documents,
  b.ic_number,
  b.rating,
  b.total_bookings,
  b.bank_name,
  b.bank_account_number,
  b.bank_account_name,
  b.created_at
FROM profiles p
JOIN barbers b ON b.user_id = p.id
WHERE p.phone_number = '+60123456789';  -- Replace with actual phone
```

---

## 📋 7. View Documents (JSONB)

```sql
-- View verification documents
SELECT 
  p.full_name,
  p.phone_number,
  b.verification_documents
FROM barbers b
JOIN profiles p ON b.user_id = p.id
WHERE b.verification_status = 'pending'
ORDER BY b.created_at DESC;
```

**Note:** Documents are stored in JSONB format. Example:
```json
{
  "ic_front": "https://storage.url/ic_front.jpg",
  "ic_back": "https://storage.url/ic_back.jpg",
  "selfie": "https://storage.url/selfie.jpg",
  "certificates": ["url1", "url2"]
}
```

---

## 🚨 8. Emergency Queries

### Suspend a Partner
```sql
UPDATE barbers 
SET 
  is_available = false,
  is_verified = false,
  updated_at = NOW()
WHERE user_id = 'USER_ID_HERE';
```

### Reactivate a Partner
```sql
UPDATE barbers 
SET 
  is_available = true,
  is_verified = true,
  verification_status = 'verified',
  updated_at = NOW()
WHERE user_id = 'USER_ID_HERE';
```

### Delete a Partner (Careful!)
```sql
-- This will CASCADE delete the barber record
-- But keeps the profile (they can re-apply)
DELETE FROM barbers WHERE user_id = 'USER_ID_HERE';
```

---

## 📈 9. Analytics Queries

### Approval Rate (Last 30 Days)
```sql
SELECT 
  verification_status,
  COUNT(*) as count,
  ROUND(AVG(EXTRACT(HOUR FROM (updated_at - created_at))), 2) as avg_hours_to_decision
FROM barbers
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND verification_status IN ('verified', 'rejected')
GROUP BY verification_status;
```

### Daily Registrations
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as registrations,
  SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) as approved,
  SUM(CASE WHEN verification_status = 'rejected' THEN 1 ELSE 0 END) as rejected,
  SUM(CASE WHEN verification_status = 'pending' THEN 1 ELSE 0 END) as pending
FROM barbers
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 🎯 Quick Workflow

### Standard Approval Process:

```sql
-- 1. Check who's waiting
SELECT p.full_name, p.phone_number, b.created_at
FROM barbers b
JOIN profiles p ON b.user_id = p.id
WHERE b.verification_status = 'pending'
ORDER BY b.created_at ASC;

-- 2. Get details of specific partner
SELECT * FROM profiles WHERE phone_number = '+60123456789';
-- Note the user_id

-- 3. View their documents
SELECT verification_documents 
FROM barbers 
WHERE user_id = 'COPY_ID_HERE';

-- 4. Approve
UPDATE barbers 
SET verification_status = 'verified', is_verified = true
WHERE user_id = 'PASTE_ID_HERE';

-- 5. Confirm
SELECT p.full_name, b.verification_status 
FROM barbers b
JOIN profiles p ON b.user_id = p.id
WHERE b.user_id = 'PASTE_ID_HERE';
```

---

## 📖 Tips

1. **Always use transactions for critical updates:**
   ```sql
   BEGIN;
   UPDATE barbers SET verification_status = 'verified' WHERE user_id = 'xxx';
   -- Check if looks correct
   SELECT * FROM barbers WHERE user_id = 'xxx';
   -- If good:
   COMMIT;
   -- If mistake:
   ROLLBACK;
   ```

2. **Use phone number to find partners:**
   - Easier to remember than UUIDs
   - Partners provide phone during registration

3. **Check documents before approving:**
   - Look at `verification_documents` JSONB
   - Make sure all required docs are present

4. **Monitor pending time:**
   - Aim for < 24 hours approval time
   - Check the "hours_waiting" column

---

## ✅ Checklist for Each Approval

- [ ] Check pending partners (Query #1)
- [ ] Get partner details (Query #6)
- [ ] View documents (Query #7)
- [ ] Approve (Query #2) OR Reject (Query #3)
- [ ] Verify it worked (included in Query #2)
- [ ] Partner gets notified (automatic in app)

---

**All queries tested and working with your actual database schema!** ✅

Last updated: 2025-10-12
