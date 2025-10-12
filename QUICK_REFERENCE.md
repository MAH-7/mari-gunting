# 🚀 Partner Approval Flow - Quick Reference

## 📋 Apply Migration (Do This First!)

```bash
# 1. Copy the migration SQL
cat supabase/migrations/008_add_verification_status_columns.sql

# 2. Go to Supabase Dashboard → SQL Editor
# 3. Paste and click "Run"
```

---

## 🧪 Test Commands

### Check Verification Status
```sql
-- Check a partner's status
SELECT 
  u.name,
  b.verification_status,
  b.is_verified
FROM barbers b
JOIN profiles u ON b.user_id = u.id
WHERE u.phone = '+60123456789';
```

### Approve a Partner
```sql
UPDATE barbers 
SET verification_status = 'verified'
WHERE user_id = 'USER_ID_HERE';
-- is_verified automatically becomes true
```

### Reject a Partner
```sql
UPDATE barbers 
SET verification_status = 'rejected'
WHERE user_id = 'USER_ID_HERE';
```

### Set to Pending
```sql
UPDATE barbers 
SET verification_status = 'pending'
WHERE user_id = 'USER_ID_HERE';
```

### View All Partners by Status
```sql
SELECT 
  verification_status,
  COUNT(*) as count
FROM barbers
GROUP BY verification_status;
```

---

## 🎨 Status Flow

```
Registration → unverified → pending → verified ✅
                                    → rejected ❌
```

---

## 📱 UI Behavior

| Status | What Partner Sees |
|--------|-------------------|
| `unverified` | Pending Approval screen (blue banner on dashboard) |
| `pending` | Pending Approval screen (yellow banner on dashboard) |
| `rejected` | Pending Approval screen (red banner on dashboard) |
| `verified` | Dashboard (no banner) ✅ Can accept bookings |

---

## 🔧 Troubleshooting

### Partner Stuck on Pending?
```sql
-- Check their status
SELECT verification_status FROM barbers WHERE user_id = 'USER_ID';

-- Approve them
UPDATE barbers SET verification_status = 'verified' WHERE user_id = 'USER_ID';
```

### Banner Not Showing?
- Check if migration was applied
- Verify `verification_status` column exists
- Check if partner is actually verified

### Can't Accept Bookings?
```sql
-- Check if verified
SELECT is_verified FROM barbers WHERE user_id = 'USER_ID';

-- Should be true, if not:
UPDATE barbers SET verification_status = 'verified' WHERE user_id = 'USER_ID';
```

---

## 📁 Key Files

- **Migration:** `supabase/migrations/008_add_verification_status_columns.sql`
- **Service:** `packages/shared/services/verificationService.ts`
- **Pending UI:** `apps/partner/app/onboarding/pending-approval.tsx`
- **Routing:** `apps/partner/app/index.tsx`
- **Banner:** `apps/partner/app/(tabs)/dashboard.tsx`

---

## 📚 Documentation

- **Complete Guide:** `APPROVAL_FLOW_COMPLETE.md`
- **Migration Guide:** `DATABASE_MIGRATION_GUIDE.md`
- **Banner Details:** `VERIFICATION_BANNER_IMPLEMENTED.md`

---

## 🎯 Quick Test Procedure

1. Register new partner
2. Should see Pending Approval screen
3. Run SQL: `UPDATE barbers SET verification_status = 'verified' WHERE user_id = 'XXX'`
4. Pull-to-refresh in app
5. Should redirect to Dashboard ✅

---

**That's it!** 🎉 The approval flow is ready to use.
