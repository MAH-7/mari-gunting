# 📱 Quick Reference: Change Phone Number

## 🚨 When Customer Contacts You

**Customer says:** "I need to change my phone number"

---

## ✅ Quick Checklist

1. **Verify Identity:**
   - [ ] Full name matches profile
   - [ ] Email matches profile  
   - [ ] Can tell you 2+ recent bookings
   - [ ] Reason makes sense (lost phone, new number, etc.)

2. **Check New Number:**
   - [ ] Customer owns the new number (can receive SMS)
   - [ ] Number not already in system

3. **Make the Change:**
   - [ ] Run SQL script (step by step)
   - [ ] Update in Supabase Dashboard
   - [ ] Test new number works

4. **Confirm:**
   - [ ] Customer can log in with new number
   - [ ] Send confirmation message
   - [ ] Close support ticket

---

## 🎯 5-Minute Process

### 1. Collect Info (2 minutes)

Ask customer:
```
- Full name: _______________
- Email: _______________
- Old phone: +60_______________
- New phone: +60_______________
- Reason: _______________
- Recent booking (any 1): _______________
```

### 2. Run SQL (2 minutes)

**In Supabase SQL Editor:**

```sql
-- Step 1: Find user
SELECT id, full_name, phone_number, email
FROM profiles WHERE phone_number = '+60_OLD_NUMBER_';

-- Step 2: Check new number available  
SELECT * FROM profiles WHERE phone_number = '+60_NEW_NUMBER_';
-- Should return 0 rows

-- Step 3: Update
UPDATE profiles
SET phone_number = '+60_NEW_NUMBER_', updated_at = NOW()
WHERE phone_number = '+60_OLD_NUMBER_';
```

### 3. Update Auth (1 minute)

**In Supabase Dashboard:**
1. Authentication → Users
2. Search customer email
3. Change phone to new number
4. Save

### 4. Test (<1 minute)

Ask customer:
- "Please log out and log in with your new number"
- Confirm they receive OTP
- Confirm they can log in

---

## 📋 Example Conversation

**Customer:** "Hi, I lost my phone and need to change my number"

**You:** 
```
Hi! I can help with that. For security, I need to verify:
1. Your full name: 
2. Your email:
3. Old phone number:
4. New phone number:
5. One recent booking or service you used:
```

**Customer provides info**

**You verify in database, make change**

**You:** 
```
✅ Done! Your new number is +60123456789

Please try logging in with your new number now.
Let me know if you have any issues.
```

---

## 🚨 Red Flags - DON'T Change

**STOP if:**
- ❌ Can't remember ANY bookings
- ❌ Email doesn't match
- ❌ Very urgent/pushy
- ❌ Asking to change to someone else's number
- ❌ Just registered recently (< 1 week)
- ❌ Already changed number multiple times

**Action:** Escalate to supervisor

---

## 💻 Files You Need

1. **SQL Script:** `supabase/admin/change_phone_number.sql`
2. **Full Guide:** `docs/admin/CHANGE_PHONE_NUMBER_GUIDE.md`
3. **Supabase Dashboard:** https://supabase.com/dashboard

---

## 📞 Need Help?

**Can't find user?**
- Check phone format (+60 prefix)
- Try searching by email

**New number in use?**
- Customer needs different number
- Or they have duplicate account (escalate)

**Auth update fails?**
- Refresh Dashboard
- Try again
- Check permissions

**Unsure about anything?**
- Ask supervisor
- Better safe than sorry!

---

## 🔐 Security Reminder

**Why we verify:**
- Phone = authentication
- Wrong change = customer locked out
- Potential fraud/account takeover

**Always verify identity first!**

---

## ⏱️ Typical Times

- **Verification:** 2-3 minutes
- **SQL Update:** 1-2 minutes  
- **Dashboard Update:** 1 minute
- **Testing:** 1 minute
- **Total:** ~5-7 minutes

---

## 📊 After You're Done

Log the change:
```sql
INSERT INTO admin_audit_log (action, admin_user, affected_user_id, old_value, new_value, reason)
SELECT 'PHONE_CHANGE', 'your.email@example.com', id, '+60OLD', '+60NEW', 'Lost phone'
FROM profiles WHERE phone_number = '+60NEW';
```

---

## ✅ Success Message Template

```
Hi [Name],

Your phone number has been updated:
- Old: +60XXXXXXX
- New: +60YYYYYYY

You can now log in with your new number.

If you didn't request this, contact us immediately at support@marigunting.com

Best regards,
Mari Gunting Support
```

---

**That's it! Simple and secure.** 🔐
