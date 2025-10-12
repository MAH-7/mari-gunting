# OTP Not Working - Diagnostic Guide

## 🔍 Quick Diagnosis

### Step 1: Check Console Logs

When you click "Send OTP" in the app, what appears in your terminal?

**Option A: You see this**
```
LOG  🔐 DEV MODE: OTP for +60XXXXX is: 123456
LOG  📱 WhatsApp OTP would be sent in production
```
**Problem:** Still in dev mode, not sending real WhatsApp
**Solution:** See "Fix Dev Mode" below

**Option B: You see this**
```
LOG  ✅ OTP sent to: +60XXXXX
```
**Status:** Real mode working! Check other issues below

**Option C: You see error**
```
ERROR ❌ OTP send error: [some error]
```
**Problem:** Supabase/Twilio configuration issue
**Solution:** See "Fix Supabase Config" below

---

## 🔧 FIX 1: Dev Mode Still Active

If you see "DEV MODE" in logs:

### Solution:
```bash
# 1. Stop the app (Ctrl+C)

# 2. Verify .env has the right setting
cat apps/customer/.env | grep EXPO_PUBLIC_USE_REAL_OTP

# Should show: EXPO_PUBLIC_USE_REAL_OTP=true

# 3. Clear cache and restart
cd apps/customer
npx expo start -c

# 4. Test again - look for logs
```

### If still in dev mode, manually check:
```bash
# Check if authService is reading the env var correctly
cd /Users/bos/Desktop/ProjectSideIncome/mari-gunting
cat packages/shared/services/authService.ts | grep -A 2 "__DEV__"

# Should see:
# const __DEV__ = process.env.EXPO_PUBLIC_USE_REAL_OTP !== 'true';
```

---

## 🔧 FIX 2: Twilio Sandbox Not Joined

### Check if you joined sandbox:

1. **Open WhatsApp on your phone**
2. **Look for a chat with** `+1 415 523 8886`
3. **Do you see "Twilio Sandbox" chat?**

**If NO:**
```
You haven't joined! Do this:

1. Get your join code:
   https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
   
2. You'll see something like:
   Sandbox: +1 415 523 8886
   Join code: join apple-tiger
   
3. In WhatsApp, message +1 415 523 8886
   Send exactly: join apple-tiger (use YOUR code)
   
4. Wait for confirmation message
5. Try sending OTP again
```

**If YES but no OTP received:**
- Sandbox might have expired (valid 72 hours)
- Send the join code again: `join YOUR-CODE`

---

## 🔧 FIX 3: Supabase Phone Auth Not Configured

### Check Supabase Settings:

1. **Go to Supabase Dashboard:**
   ```
   https://app.supabase.com/project/uufiyurcsldecspakneg/auth/providers
   ```

2. **Scroll to "Phone" section**

3. **Verify these are filled:**
   ```
   ☑ Enable Phone provider: ON
   
   Provider: Twilio
   
   Twilio Account SID: ACxxxxxxxxxxxxxxxx (starts with AC)
   Twilio Auth Token: xxxxxxxxxxxxxxxx
   Twilio Messaging Service SID: MGxxxxxxxxxxxxxxxx (starts with MG)
   ```

4. **Check the Message Template:**
   ```
   Should contain: {{ .Code }}
   
   Example:
   Your Mari Gunting verification code is: {{ .Code }}
   ```

5. **Click SAVE at the bottom!**

**If any are missing:**
- Get them from: https://console.twilio.com/
- Account SID & Auth Token: On dashboard
- Messaging Service SID: Messaging → Services → Your service

---

## 🔧 FIX 4: Wrong Phone Number Format

### Phone Number Requirements:

**Must have country code:**
```
❌ Wrong: 0123456789
❌ Wrong: 123456789
✅ Correct: +60123456789 (Malaysia)
✅ Correct: +1234567890 (US)
```

**The phone number you use in the app MUST be:**
- ✅ The same number that joined Twilio sandbox
- ✅ The same number that has WhatsApp installed
- ✅ Include the country code (+60, +1, etc.)

---

## 🔧 FIX 5: Twilio Trial Account Limits

### Trial Account Restrictions:

Twilio trial accounts can only send to:
1. **Verified phone numbers**
2. **Numbers that joined the sandbox**

### Verify your phone number in Twilio:

1. **Go to Twilio Console:**
   ```
   https://console.twilio.com/us1/develop/phone-numbers/manage/verified
   ```

2. **Click "Add a new Caller ID"**

3. **Enter your phone number** (the one with WhatsApp)

4. **Verify it** (you'll get SMS/call)

5. **Try sending OTP again**

---

## 🔧 FIX 6: Check Twilio Logs

This will tell us EXACTLY what's happening:

1. **Go to Twilio Message Logs:**
   ```
   https://console.twilio.com/us1/monitor/logs/messages
   ```

2. **Look for recent messages:**
   - **Status: "delivered"** ✅ → WhatsApp should have it
   - **Status: "failed"** ❌ → Click for error details
   - **Status: "undelivered"** ❌ → Check phone number
   - **No messages at all** → Supabase not calling Twilio

3. **If NO messages appear:**
   - Supabase isn't calling Twilio
   - Check Supabase phone auth config (FIX 3)
   - Check if still in dev mode (FIX 1)

---

## 🧪 STEP-BY-STEP TEST PROCEDURE

Let's test methodically:

### Test 1: Verify Dev Mode is OFF

```bash
cd /Users/bos/Desktop/ProjectSideIncome/mari-gunting/apps/customer

# Stop app (Ctrl+C)

# Start with cache cleared
npx expo start -c

# Wait for it to load
# Click "Send OTP" in the app
# CHECK THE LOGS - what do you see?
```

**Expected log (Real mode):**
```
LOG  ✅ OTP sent to: +60XXXXX
```

**If you see "DEV MODE":**
```
Problem: Still in dev mode
Action: Check .env file has EXPO_PUBLIC_USE_REAL_OTP=true
```

### Test 2: Check Supabase Logs

1. **Go to:**
   ```
   https://app.supabase.com/project/uufiyurcsldecspakneg/logs/auth-logs
   ```

2. **Look for recent entries when you clicked "Send OTP"**

3. **Do you see:**
   - ✅ "signInWithOtp" events → Good, Supabase is trying
   - ❌ No events → App isn't calling Supabase
   - ❌ Error events → Click to see error details

### Test 3: Check Twilio Logs

1. **Go to:**
   ```
   https://console.twilio.com/us1/monitor/logs/messages
   ```

2. **After clicking "Send OTP" in app:**
   - Refresh the page
   - Do you see new messages?

3. **If YES:**
   - Check status (delivered/failed)
   - Check destination number matches
   - Check message content

4. **If NO:**
   - Supabase phone auth not configured
   - Go back to FIX 3

---

## 📋 COMPLETE CHECKLIST

Before asking for more help, verify ALL of these:

- [ ] `.env` has `EXPO_PUBLIC_USE_REAL_OTP=true`
- [ ] App restarted with `-c` flag (cache cleared)
- [ ] Console logs show "✅ OTP sent" (not "DEV MODE")
- [ ] Joined Twilio sandbox on WhatsApp (+1 415 523 8886)
- [ ] Received confirmation message in WhatsApp
- [ ] Phone number in app has country code (+60...)
- [ ] Same phone number used for sandbox and in app
- [ ] Supabase phone auth enabled
- [ ] Twilio credentials added to Supabase
- [ ] Twilio Messaging Service SID added to Supabase
- [ ] Message template has `{{ .Code }}` in Supabase
- [ ] Clicked "Save" in Supabase after adding credentials
- [ ] Phone number verified in Twilio Console

---

## 🎯 WHAT TO TELL ME

If still not working, tell me:

1. **What you see in console logs** (copy exact message)
2. **Did you join sandbox?** (Yes/No)
3. **What's in Twilio message logs?** (Status, errors)
4. **What's in Supabase auth logs?** (Any errors)
5. **Your phone number format** (e.g., +60123456789)

---

## 💡 QUICK WINS

### Try Test Mode First

If real WhatsApp still not working, test with dev mode to verify app flow:

```bash
# In apps/customer/.env - change to:
EXPO_PUBLIC_USE_REAL_OTP=false

# Restart app
npx expo start -c

# Use test OTP: 123456
# This verifies the app logic works
```

Once test mode works, switch back to real mode and focus on Twilio/Supabase config.

---

## 🆘 COMMON SOLUTIONS

### 90% of issues are:

1. **Didn't restart app after changing .env** → Restart with `-c`
2. **Didn't join sandbox** → Message +1 415 523 8886
3. **Twilio creds not in Supabase** → Add in Auth → Providers
4. **Phone number wrong format** → Must have +60...
5. **Sandbox expired** → Rejoin every 72 hours

Try these first! 🎯
