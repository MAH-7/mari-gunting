# 👨‍💼 Admin Guide: Partner Approval Process

**For:** Business Owners / Admins  
**Date:** 2025-10-12  
**Status:** Production Ready

---

## 🎯 What This Guide Is For

As the **business owner**, when a new partner registers, their account goes into **"Under Review"** status. This guide shows you how to **review and approve/reject** partner applications in real life.

---

## 📋 The Approval Process

### Overview
```
New Partner Registers
  ↓
Account Status: "Under Review" (pending)
  ↓
YOU (Admin) Review Documents
  ↓
Approve OR Reject
  ↓
Partner Gets Notified (via app)
```

---

## 🔍 Step 1: Check New Partner Submissions

### Option A: Via Supabase Dashboard (Manual - Current)

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Select project: `mari-gunting`

2. **Check New Partners:**
   - Go to **Table Editor** → **profiles**
   - Filter by: `role = 'barber'`
   - Look for recent `created_at` dates

3. **Check Verification Status:**
   - Go to **Table Editor** → **barbers**
   - Look for: `verification_status = 'pending'`
   - These are partners waiting for your approval

4. **View Partner Details:**
   ```sql
   SELECT 
     b.id,
     p.full_name,
     p.phone_number,
     p.email,
     b.verification_status,
     b.created_at,
     b.ic_front_url,
     b.ic_back_url,
     b.selfie_url,
     b.qualifications
   FROM barbers b
   JOIN profiles p ON b.user_id = p.id
   WHERE b.verification_status = 'pending'
   ORDER BY b.created_at DESC;
   ```

---

## 📝 Step 2: Review Partner Documents

### What to Check:

#### 1. **Identity Verification (eKYC)**
   - IC Front Photo - Clear, not blurry
   - IC Back Photo - Readable
   - Selfie - Matches IC photo
   - Name matches IC

#### 2. **Business Information**
   - Service area location
   - Operating hours
   - Services offered
   - Pricing reasonable

#### 3. **Qualifications** (if applicable)
   - Certifications uploaded
   - Experience mentioned
   - Portfolio/previous work

#### 4. **Payout Details**
   - Bank account info provided
   - Bank name correct
   - Account number format valid

---

## ✅ Step 3: Approve Partner

### Via Supabase SQL Editor

1. Go to **SQL Editor** in Supabase
2. Run this query:

```sql
-- Approve a partner
UPDATE barbers 
SET 
  verification_status = 'verified',
  is_verified = true,
  verified_at = NOW()
WHERE user_id = 'USER_ID_HERE';

-- Check it worked
SELECT 
  p.full_name,
  b.verification_status,
  b.is_verified,
  b.verified_at
FROM barbers b
JOIN profiles p ON b.user_id = p.id
WHERE b.user_id = 'USER_ID_HERE';
```

**Replace `USER_ID_HERE`** with the actual user ID from the profiles table.

### What Happens Next:
1. ✅ Partner's status changes to `verified`
2. ✅ Partner can now accept bookings
3. ✅ Next time they open the app, they see the dashboard
4. ✅ "Under Review" banner disappears

---

## ❌ Step 4: Reject Partner (If Issues Found)

### If documents are invalid:

```sql
-- Reject a partner
UPDATE barbers 
SET 
  verification_status = 'rejected',
  is_verified = false,
  rejection_reason = 'Please provide clearer IC photos'
WHERE user_id = 'USER_ID_HERE';
```

### Common Rejection Reasons:
- "IC photo is blurry or unclear"
- "Selfie doesn't match IC photo"
- "Missing required documents"
- "Invalid bank account details"
- "Service area outside coverage"

### What Happens Next:
1. ❌ Partner sees "Verification Failed" message
2. 📝 They can resubmit documents
3. 🔄 Status goes back to `pending`
4. 👀 You review again

---

## 🔄 Step 5: Notify Partner (Manual for Now)

**Current:** Partner sees status change when they open the app

**Future Enhancement:** Send push notification or SMS
- "🎉 Your account has been approved!"
- "❌ Please resubmit your documents"

---

## 📊 Admin Dashboard Views

### View All Pending Approvals
```sql
SELECT 
  p.full_name,
  p.phone_number,
  p.email,
  b.verification_status,
  b.created_at,
  EXTRACT(HOUR FROM (NOW() - b.created_at)) as hours_waiting
FROM barbers b
JOIN profiles p ON b.user_id = p.id
WHERE b.verification_status = 'pending'
ORDER BY b.created_at ASC;
```

### View Recently Approved
```sql
SELECT 
  p.full_name,
  b.verified_at,
  b.verification_status
FROM barbers b
JOIN profiles p ON b.user_id = p.id
WHERE b.verification_status = 'verified'
ORDER BY b.verified_at DESC
LIMIT 10;
```

### View Rejection Rate
```sql
SELECT 
  verification_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM barbers
GROUP BY verification_status;
```

---

## 🎯 Best Practices

### Approval Timeline
- ⏰ **Target:** Review within 24 hours
- ⚡ **Ideal:** Review within 4-8 hours
- 💪 **Competitive:** Grab/Gojek take 1-2 days

### Quality Standards
✅ **Approve if:**
- All documents clear and readable
- IC matches selfie
- Valid qualifications
- Service area within coverage
- Pricing is reasonable

❌ **Reject if:**
- Blurry/unclear documents
- Missing required info
- Suspicious activity
- Duplicate account
- Outside service area

### Communication
- 📧 Keep rejection reasons clear and specific
- 🔄 Give partners a chance to fix issues
- 📞 For edge cases, call partner directly

---

## 🚀 Future: Admin Web Dashboard (Recommended)

### What You Should Build Next:

1. **Admin Web Portal** (React/Next.js)
   - View all pending partners in a table
   - Click to view documents
   - Approve/Reject with one button
   - Add notes/comments
   - Send notifications

2. **Features to Add:**
   ```
   - 📧 Email notifications to partners
   - 📱 Push notifications
   - 📊 Analytics dashboard
   - 📋 Approval history log
   - 👥 Multiple admin accounts
   - 🔍 Search and filter
   - 📸 Document viewer (zoom, rotate)
   - ⏰ SLA tracking (time to approve)
   ```

3. **Admin API Endpoints:**
   ```typescript
   GET  /admin/partners/pending
   POST /admin/partners/:id/approve
   POST /admin/partners/:id/reject
   GET  /admin/partners/:id/documents
   ```

---

## 📱 Current User Experience

### Partner Side (What They See):

#### 1. After Registration:
```
┌──────────────────────────┐
│  Account Under Review    │
│                          │
│  Your application is     │
│  being reviewed by our   │
│  team. This usually      │
│  takes 1-2 business days.│
│                          │
│  [Pull to refresh]       │
└──────────────────────────┘
```

#### 2. After Approval:
```
┌──────────────────────────┐
│  Dashboard               │
│                          │
│  ✅ Account Verified     │
│                          │
│  Start accepting         │
│  bookings!               │
└──────────────────────────┘
```

#### 3. If Rejected:
```
┌──────────────────────────┐
│  Verification Failed     │
│                          │
│  Reason: IC photo is     │
│  unclear. Please         │
│  resubmit.               │
│                          │
│  [Resubmit Documents]    │
└──────────────────────────┘
```

---

## 🛠️ Quick Admin Commands

### Approve Partner (Copy & Paste)
```sql
-- 1. Find partner by phone
SELECT id, full_name, phone_number 
FROM profiles 
WHERE phone_number = '+60123456789';

-- 2. Get their barber record
SELECT * FROM barbers WHERE user_id = 'COPY_ID_FROM_ABOVE';

-- 3. Approve them
UPDATE barbers 
SET verification_status = 'verified', is_verified = true
WHERE user_id = 'PASTE_ID_HERE';
```

### Reject Partner
```sql
UPDATE barbers 
SET 
  verification_status = 'rejected',
  rejection_reason = 'YOUR_REASON_HERE'
WHERE user_id = 'USER_ID_HERE';
```

### Reset to Pending (If They Resubmit)
```sql
UPDATE barbers 
SET verification_status = 'pending'
WHERE user_id = 'USER_ID_HERE';
```

---

## 📊 Monitoring

### Daily Check:
```sql
-- How many pending approvals?
SELECT COUNT(*) as pending_count
FROM barbers
WHERE verification_status = 'pending';
```

### Weekly Report:
```sql
SELECT 
  DATE_TRUNC('week', created_at) as week,
  verification_status,
  COUNT(*) as count
FROM barbers
GROUP BY week, verification_status
ORDER BY week DESC;
```

---

## ✅ Checklist for Each Partner Review

- [ ] IC front photo clear and readable
- [ ] IC back photo clear and readable
- [ ] Selfie matches IC
- [ ] Name matches IC
- [ ] Phone number verified (already done via OTP)
- [ ] Email valid
- [ ] Service area within coverage
- [ ] Bank account details provided
- [ ] Pricing reasonable
- [ ] No duplicate accounts
- [ ] Background check (if required)

**Action:**
- [ ] Approve OR
- [ ] Reject with clear reason

---

## 🎯 Summary

**As Admin/Owner, you need to:**

1. **Log into Supabase** daily
2. **Check** for partners with `verification_status = 'pending'`
3. **Review** their documents and info
4. **Approve** or **Reject** via SQL update
5. **Monitor** approval rates and times

**Partner sees:**
- "Under Review" while waiting
- "Approved" or "Rejected" after your decision
- Can immediately start working once approved

---

## 🚨 Need Help?

**Current Manual Process:**
- Check Supabase Table Editor
- Run SQL commands to approve/reject

**Recommended Next Step:**
- Build admin web dashboard
- Automate notifications
- Track approval metrics

---

**Last Updated:** 2025-10-12  
**Version:** 1.0 (Manual Admin Process)

For technical help, see: `APPROVAL_FLOW_COMPLETE.md`
