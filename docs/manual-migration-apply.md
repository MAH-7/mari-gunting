# Manual Migration Apply Instructions

## Problem
After barber accepts booking, partner app immediately shows "I'm on the way" button even though customer hasn't authorized payment yet.

## Root Cause
The `update_booking_status` database function doesn't preserve `payment_status = 'pending_payment'` when status changes to 'accepted'.

## Solution
Apply migration: `20250123_preserve_pending_payment_on_accept.sql`

## How to Apply (Supabase Dashboard)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Navigate to your project

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Copy & Paste Migration SQL**
   ```sql
   -- Copy the entire content from:
   supabase/migrations/20250123_preserve_pending_payment_on_accept.sql
   ```

4. **Run the Migration**
   - Click "Run" or press `Cmd/Ctrl + Enter`
   - Wait for success message

5. **Verify**
   - Check that no errors appear
   - The function should be updated

## What This Fixes

### Before Migration:
```
1. Customer creates booking → payment_status: 'pending_payment'
2. Barber accepts → status: 'accepted', payment_status: 'pending_payment' (unchanged)
   ❌ But app doesn't check this properly
3. Customer pays → payment_status: 'authorized'
```

### After Migration:
```
1. Customer creates booking → payment_status: 'pending_payment'
2. Barber accepts → status: 'accepted', payment_status: 'pending_payment' (explicitly preserved)
   ✅ Function returns payment_status in response
3. App checks payment_status and shows waiting UI
4. Customer pays → payment_status: 'authorized'
5. App detects change via real-time subscription
6. "I'm on the way" button appears
```

## Test Flow After Migration

1. **Create new booking as customer** (card payment)
   - Booking created with `payment_status: 'pending_payment'`

2. **Accept booking as barber**
   - Should see: "Waiting for customer payment..." message
   - Should NOT see: "I'm on the way" button

3. **Authorize payment as customer**
   - Complete payment in webview
   - `payment_status` → 'authorized'

4. **Check partner app**
   - Waiting message should disappear
   - "I'm on the way" button should appear
   - Can now proceed with service

## Alternative: CLI Apply (if Docker is running)

```bash
cd /Users/bos/Desktop/ProjectSideIncome/mari-gunting
npx supabase db push
```

---

**Date**: January 2025  
**Migration File**: `20250123_preserve_pending_payment_on_accept.sql`  
**Related Docs**: `barber-payment-wait-implementation.md`
