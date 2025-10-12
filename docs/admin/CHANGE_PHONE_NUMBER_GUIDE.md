# 📱 Admin Guide: How to Change Customer Phone Number

## ⚠️ SECURITY WARNING

**Only change phone numbers after:**
1. ✅ Verifying customer identity (government ID, previous bookings)
2. ✅ Confirming they own the new phone number (send test OTP)
3. ✅ Understanding the reason (lost phone, number change, etc.)

**This is a sensitive operation!** Changing phone numbers affects authentication.

---

## 🎯 Quick Steps

### Step 1: Verify Customer Identity

**Ask customer for:**
- Full name
- Email address
- Old phone number
- At least 2 recent bookings or transactions
- Government ID (if available)

**Red flags to watch for:**
- ❌ Can't remember recent bookings
- ❌ Email doesn't match
- ❌ Suspicious urgency
- ❌ Vague reason for change

---

### Step 2: Access Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `mari-gunting`
3. Navigate to **SQL Editor**

---

### Step 3: Run SQL Script

1. Open file: `supabase/admin/change_phone_number.sql`
2. Replace placeholders:
   - `[OLD_PHONE]` → Customer's current phone (e.g., `+601234567890`)
   - `[NEW_PHONE]` → Customer's new phone (e.g., `+609876543210`)
   - `[YOUR_ADMIN_EMAIL]` → Your email
   - `[REASON]` → Reason for change (e.g., "Lost phone")

3. **Run each step one by one** (don't run entire file at once!)
4. Check results after each step

---

### Step 4: Update Auth System

**Go to Supabase Dashboard:**

1. Click **Authentication** → **Users**
2. Search for user by email or phone
3. Click on the user
4. Update **Phone** field to new number
5. Click **Save**

---

### Step 5: Test New Phone Number

**Ask customer to:**
1. Log out from app
2. Try to log in with **new phone number**
3. Enter OTP sent to new phone
4. Confirm they can access their profile

---

### Step 6: Confirm to Customer

Send confirmation message:

```
Hi [Customer Name],

Your phone number has been successfully updated:
- Old: [OLD_PHONE]
- New: [NEW_PHONE]

You can now log in using your new number.

If you didn't request this change, contact us immediately at [SUPPORT_EMAIL].

Best regards,
Mari Gunting Support Team
```

---

## 📋 Example: Real Change

### Scenario
Customer "Ahmad" lost his phone and got a new number.

**Customer Info:**
- Name: Ahmad bin Ali
- Old Phone: +60123456789
- New Phone: +60198765432
- Email: ahmad@example.com
- Reason: Lost phone

### SQL Commands:

```sql
-- 1. Find user
SELECT id, full_name, phone_number, email
FROM profiles
WHERE phone_number = '+60123456789';

-- Result: Found Ahmad, ID = abc-123-def

-- 2. Check new number available
SELECT * FROM profiles WHERE phone_number = '+60198765432';

-- Result: 0 rows (number available) ✅

-- 3. Create backup
CREATE TEMP TABLE phone_change_backup AS
SELECT * FROM profiles WHERE phone_number = '+60123456789';

-- 4. Update phone
UPDATE profiles
SET phone_number = '+60198765432', updated_at = NOW()
WHERE phone_number = '+60123456789';

-- 5. Verify
SELECT id, full_name, phone_number FROM profiles
WHERE phone_number = '+60198765432';

-- Result: Ahmad's profile with new number ✅
```

### Dashboard:
1. Go to Authentication → Users
2. Search: ahmad@example.com
3. Update phone: +60198765432
4. Save ✅

---

## 🚨 Common Issues

### Issue 1: New number already in use

**Error:**
```
SELECT returns rows for new phone number
```

**Solution:**
- Customer must choose different number
- Or resolve duplicate account issue

---

### Issue 2: User not found

**Error:**
```
SELECT returns 0 rows for old phone number
```

**Solution:**
- Check phone number format (+60 prefix?)
- Verify customer is in system
- Check if they used different number to register

---

### Issue 3: Auth update fails

**Error:**
```
Cannot update auth.users
```

**Solution:**
- Try again in Dashboard
- Clear browser cache
- Check service role permissions

---

## 🔄 Rollback Process

If something goes wrong:

```sql
-- 1. Restore from backup
UPDATE profiles
SET 
  phone_number = (SELECT phone_number FROM phone_change_backup),
  updated_at = NOW()
WHERE id = (SELECT id FROM phone_change_backup);

-- 2. Verify rollback
SELECT * FROM profiles WHERE id = '[USER_ID]';
```

Then revert in Dashboard:
1. Authentication → Users
2. Find user
3. Change phone back to old number
4. Save

---

## 📊 Audit Log

All changes are logged in `admin_audit_log` table:

```sql
-- View recent phone changes
SELECT 
  action,
  admin_user,
  old_value as old_phone,
  new_value as new_phone,
  reason,
  created_at
FROM admin_audit_log
WHERE action = 'PHONE_CHANGE'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🔒 Security Best Practices

### DO ✅

- ✅ Verify customer identity thoroughly
- ✅ Create backup before changes
- ✅ Log all changes with reason
- ✅ Test new number works
- ✅ Inform customer of change

### DON'T ❌

- ❌ Change numbers without verification
- ❌ Skip backup step
- ❌ Forget to update auth system
- ❌ Give phone change access to junior staff
- ❌ Change multiple numbers at once

---

## 📞 Support Escalation

**When to escalate:**
- Multiple phone change requests from same user
- Suspicious activity (fraud attempt)
- Technical issues with update
- Customer claims unauthorized change

**Contact:**
- Tech Lead: [YOUR_EMAIL]
- Security Team: [SECURITY_EMAIL]

---

## 📈 Frequency Guidelines

**Normal:**
- 1-2 changes per user per year

**Suspicious:**
- 3+ changes in 6 months
- Changes immediately after registration
- Multiple users with same old/new numbers

**Action:**
- Flag for review
- Request additional verification
- Consider fraud investigation

---

## 🔧 First Time Setup

### Create Audit Log Table

Run this **once** in SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  admin_user TEXT NOT NULL,
  affected_user_id UUID NOT NULL,
  old_value TEXT,
  new_value TEXT,
  reason TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_audit_log_action ON admin_audit_log(action);
CREATE INDEX idx_audit_log_user ON admin_audit_log(affected_user_id);
CREATE INDEX idx_audit_log_created ON admin_audit_log(created_at);

-- Enable RLS (only service role can access)
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role can access audit log"
ON admin_audit_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMENT ON TABLE admin_audit_log IS 'Audit trail for all admin actions';
```

---

## ✅ Checklist

Before changing phone number:

- [ ] Customer identity verified (ID, email, bookings)
- [ ] Reason for change is legitimate
- [ ] New phone number tested (can receive SMS)
- [ ] Backup created in SQL
- [ ] Phone updated in profiles table
- [ ] Phone updated in auth.users (Dashboard)
- [ ] Change logged in audit_log
- [ ] New number tested (customer can log in)
- [ ] Customer notified of change
- [ ] Support ticket closed

---

## 💰 Charging for Service

**Recommended:**
- **Free**: First change (legitimate reasons)
- **RM 10-20**: Additional changes
- **Free**: Lost/stolen phone (with police report)

This discourages abuse while helping genuine customers.

---

## 📱 Alternative: Self-Service (Future)

For future consideration, implement self-service:

1. Customer requests change in app
2. Verify old number (OTP to old phone)
3. Verify new number (OTP to new phone)
4. Auto-update if both verified
5. Notify customer via email

**Pros:**
- Less support burden
- Instant resolution
- Better UX

**Cons:**
- More complex to implement
- Security considerations
- Fraud risk

---

## 📚 Related Documents

- `supabase/admin/change_phone_number.sql` - SQL script
- `docs/features/AUTH_SYSTEM.md` - How auth works
- `PRODUCTION_READINESS.md` - Production security

---

## 🆘 Emergency Contact

If you encounter issues:
1. Don't panic
2. Don't continue if unsure
3. Contact tech support immediately
4. Preserve backup table
5. Document what happened

**Tech Support:** [YOUR_EMAIL]

---

**Remember: Phone numbers are tied to authentication. Handle with care!** 🔐
