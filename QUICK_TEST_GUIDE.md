# 🚀 Quick Test Guide - Onboarding Fix

## Test Now (5 minutes)

### 1. Start Fresh Test
```bash
# Clear all data and start fresh
npx expo start --clear

# Or if using iOS simulator
xcrun simctl erase all
```

### 2. Complete Flow Test
1. ✅ Create new account
2. ✅ Go through onboarding (eKYC → Business → Payout)
3. ✅ Submit payout form
4. ✅ **CRITICAL:** Check console for this log:
   ```
   ✅ Barber verification status updated: [{ verification_status: 'pending' }]
   ```
5. ✅ Should navigate to `/pending-approval` screen
6. ✅ **CLOSE APP COMPLETELY** (swipe up on iOS, not just background)
7. ✅ **REOPEN APP**
8. ✅ Should go DIRECTLY to `/pending-approval` (NOT back to onboarding)

### 3. Check Database
```bash
# Connect to Supabase and run:
SELECT user_id, verification_status, updated_at 
FROM barbers 
WHERE verification_status = 'pending' 
ORDER BY updated_at DESC 
LIMIT 5;

# Should see your user with status = 'pending'
```

## Expected Console Output (When Working)

```
🔐 Submitting onboarding for user: abc-123 Account type: freelance
✅ Barber verification status updated: [{ verification_status: 'pending', ... }]

--- APP RESTART ---

🔍 [ROUTING] Checking verification status for user: abc-123
📊 [ROUTING] Verification status retrieved: {
  status: 'pending',
  hasSubmittedOnboarding: true,
  canAcceptBookings: false
}
⌛ [ROUTING] Documents submitted, under review -> /pending-approval
```

## If Still Broken

### Check 1: Database Status
```sql
-- Is status actually 'pending'?
SELECT verification_status FROM barbers WHERE user_id = '<your-user-id>';
```

### Check 2: RLS Policies
```sql
-- Can user update their own record?
SELECT * FROM pg_policies WHERE tablename = 'barbers' AND policyname LIKE '%update%';
```

### Check 3: Network Issues
Look for this error in console:
```
❌ CRITICAL: Error updating verification status
```

If you see this, it means database update is failing. Check:
- Internet connection
- Supabase API keys
- RLS policies

## Emergency Rollback

If broken, revert these files:
```bash
git checkout HEAD -- apps/partner/app/onboarding/payout.tsx
git checkout HEAD -- apps/partner/app/index.tsx
```

## Need Help?

1. Check console logs (filter by "[ROUTING]")
2. Check database directly (Supabase dashboard)
3. Review `ONBOARDING_PERSISTENCE_FIX.md` for detailed docs
4. Check if SQL migration was run: `supabase-fix-verification.sql`

---

**Last Updated:** 2025-10-12
