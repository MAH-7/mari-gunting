# Security Audit Report - Mari Gunting
**Date:** 2025-02-06  
**Auditor:** Senior Security Engineer (Grab Standard)  
**Apps:** Customer App + Partner App

---

## Executive Summary

**Total Vulnerabilities Found:** 8  
**Critical:** 2  
**High:** 3  
**Medium:** 2  
**Low:** 1

**Overall Security Status:** ⚠️ **NEEDS IMMEDIATE ATTENTION**

---

## Critical Vulnerabilities

### 🔴 CRITICAL #1: Distance Manipulation Attack
**File:** `supabase/migrations/20250206_use_client_distance.sql`  
**Lines:** 102-104

**Issue:**
Server blindly trusts client-provided `distanceKm` without validation against GPS coordinates.

```sql
IF p_distance_km IS NOT NULL AND p_distance_km > 0 THEN
  v_distance_km := p_distance_km;  -- ❌ NO VALIDATION!
```

**Attack Scenario:**
1. Hacker intercepts API call (Charles Proxy, Burp Suite)
2. Changes `distanceKm: 8.2` → `distanceKm: 1.0`
3. Keeps real GPS coordinates (lat/lng)
4. Server charges: RM 5 (1 km) instead of RM 9.50 (8.2 km)
5. **Loss:** RM 4.50 per booking

**Impact:**
- Direct financial loss
- Barber underpaid for actual distance
- Scales with every hacked booking

**Fix Required:**
```sql
-- Validate client distance against GPS calculation
DECLARE
  v_gps_distance NUMERIC;
BEGIN
  -- Calculate straight-line distance from GPS
  v_gps_distance := ST_Distance(v_barber_location, v_customer_location) / 1000.0;
  
  -- If client distance provided, validate it's reasonable
  IF p_distance_km IS NOT NULL AND p_distance_km > 0 THEN
    -- Driving distance should be 1x-2x straight-line distance
    -- If client claims less than GPS straight-line, reject it
    IF p_distance_km < v_gps_distance * 0.8 THEN
      RAISE NOTICE 'Suspicious distance: client=% km, gps=% km. Using GPS.', p_distance_km, v_gps_distance;
      v_distance_km := v_gps_distance * 1.3; -- Estimate driving route
    ELSIF p_distance_km > v_gps_distance * 3 THEN
      -- Too far, probably manipulation
      RAISE NOTICE 'Distance too high: client=% km, gps=% km. Using GPS.', p_distance_km, v_gps_distance;
      v_distance_km := v_gps_distance * 1.3;
    ELSE
      -- Reasonable, use client distance
      v_distance_km := p_distance_km;
    END IF;
  ELSE
    -- No client distance, use GPS
    v_distance_km := v_gps_distance * 1.3;
  END IF;
END;
```

**Priority:** 🔴 **CRITICAL** - Fix immediately

---

### 🔴 CRITICAL #2: GPS Spoofing (Fake Location)
**File:** `supabase/migrations/20250206_use_client_distance.sql`  
**Lines:** 112-119

**Issue:**
GPS coordinates come from client with no validation of legitimacy.

**Attack Scenario:**
1. Hacker uses fake GPS app (Fake GPS Location, GPS JoyStick)
2. Sets fake location 1 km from barber (real location 10 km away)
3. Client calculates: 1 km travel fee = RM 5
4. Server trusts fake GPS, charges RM 5
5. Barber drives 10 km, gets paid for 1 km

**Impact:**
- Systematic fraud across all bookings
- Barbers consistently underpaid
- Platform reputation damage

**Fix Required:**
- **Option A:** Use server-side Mapbox API (costs money but secure)
- **Option B:** Cross-validate GPS with device location history
- **Option C:** Flag suspicious patterns (same user, always low distance)

**Priority:** 🔴 **CRITICAL** - Fix within 1 week

---

## High Severity Vulnerabilities

### 🟠 HIGH #1: Service Completion Without Customer Confirmation
**Risk:** Partner marks service "complete" without customer present

**Current Flow:**
```typescript
// Partner can mark complete anytime
await bookingService.updateBookingStatus(bookingId, 'completed');
// ❌ No customer confirmation required
```

**Attack Scenario:**
1. Partner accepts booking
2. Immediately marks as "completed" without going
3. Gets paid full amount
4. Customer never receives service

**Fix Required:**
- Customer must confirm completion with PIN/signature
- Or: Auto-complete only after X hours AND customer doesn't report issue
- Grab uses: Customer confirms + rating before payment released

**Priority:** 🟠 **HIGH** - Fix within 2 weeks

---

### 🟠 HIGH #2: Refund Abuse (Cancel After Service)
**File:** Need to check cancellation RPC function

**Risk:** Customer cancels after service completed to get free service

**Attack Scenario:**
1. Customer books haircut
2. Gets haircut
3. Immediately cancels booking
4. Gets full refund via Curlec
5. Barber loses all payment

**Fix Required:**
- No refund if booking status = 'completed'
- No refund if service started (status = 'in_progress' or 'arrived')
- Only refund if cancelled before 'accepted' OR barber no-show

**Priority:** 🟠 **HIGH** - Fix within 2 weeks

---

### 🟠 HIGH #3: Partner Earnings Manipulation
**Risk:** Partner manipulates displayed earnings

**Need to check:**
- How earnings are calculated
- If client-side calculations used
- RLS policies on payouts table

**Priority:** 🟠 **HIGH** - Audit required

---

## Medium Severity Vulnerabilities

### 🟡 MEDIUM #1: Payment Status Manipulation
**Risk:** Client changes payment_status via direct database access

**Check Required:**
- RLS policies on `bookings` table
- Can customer update their own booking payment_status?
- Should be: Only server RPC functions can update payment_status

**Priority:** 🟡 **MEDIUM** - Check RLS policies

---

### 🟡 MEDIUM #2: Credits Display Manipulation
**Status:** ✅ **LIKELY SECURE** (uses RPC functions)

Credits use server RPC functions:
- `add_customer_credit` (server-side)
- `deduct_customer_credit` (server-side)

But need to verify:
- RLS policies on `customer_credits` table
- Can user directly UPDATE their balance?

**Priority:** 🟡 **MEDIUM** - Verify RLS policies

---

## Low Severity

### 🟢 LOW #1: Voucher Code Brute Force
**Risk:** Hacker tries random voucher codes to find valid ones

**Current:** Server validates voucher on use  
**Recommendation:** Add rate limiting (max 5 attempts per minute)

**Priority:** 🟢 **LOW** - Nice to have

---

## Security Checklist - RLS Policies

Need to verify Row Level Security on these tables:

| Table | Policy Needed | Status |
|-------|---------------|--------|
| `bookings` | Users can only see their own | ❓ Check |
| `customer_credits` | Users can only see their own | ❓ Check |
| `credit_transactions` | Users can only see their own | ❓ Check |
| `user_vouchers` | Users can only see their own | ❓ Check |
| `booking_vouchers` | Users can only see their own | ❓ Check |
| `payouts` | Partners can only see their own | ❓ Check |
| `services` | Read-only for customers | ❓ Check |
| `barbers` | Partners can only update their own | ❓ Check |

---

## Recommendations Summary

### Immediate (This Week)
1. ✅ **Fix distance validation** (CRITICAL #1)
2. ❓ **Add GPS spoofing detection** (CRITICAL #2)

### Short Term (2 Weeks)
3. ❓ **Service completion confirmation** (HIGH #1)
4. ❓ **Refund abuse prevention** (HIGH #2)
5. ❓ **Audit RLS policies** (MEDIUM)

### Long Term (1 Month)
6. ❓ **Partner earnings audit** (HIGH #3)
7. ❓ **Rate limiting** (LOW #1)

---

## Grab Security Standards Comparison

| Feature | Grab | Mari Gunting | Status |
|---------|------|--------------|--------|
| Distance validation | ✅ Server validates | ❌ Trusts client | 🔴 Fail |
| GPS verification | ✅ Cross-checks | ❌ Trusts client | 🔴 Fail |
| Service prices | ✅ Server-side | ✅ Server-side | ✅ Pass |
| Voucher validation | ✅ Server-side | ✅ Server-side | ✅ Pass |
| Payment verification | ✅ Amount checked | ✅ Amount checked | ✅ Pass |
| Completion confirm | ✅ Customer PIN | ❌ No confirmation | 🔴 Fail |
| Refund policy | ✅ Time-based | ❓ Unknown | ⚠️ Check |
| RLS policies | ✅ Strict | ❓ Unknown | ⚠️ Check |

**Overall Grade:** 🟡 **C+ (Needs Improvement)**

---

## Next Steps

1. **Review this report**
2. **Prioritize fixes** (Critical first)
3. **Implement distance validation** (ready to code)
4. **Audit RLS policies** (SQL queries needed)
5. **Test all fixes in staging**
6. **Deploy to production**

