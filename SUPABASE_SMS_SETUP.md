# 📱 Supabase SMS Setup with Twilio

**Date:** 2025-10-12  
**Status:** ⚠️ Needs Configuration

---

## 🐛 Current Issue

OTP sending is failing with error: `undefined`

This means Supabase SMS/phone auth is not configured yet.

---

## ✅ Solution: Configure Twilio in Supabase Dashboard

### Step 1: Get Your Twilio Credentials

You already have these in `.env`:
```bash
TWILIO_ACCOUNT_SID=AC93abceea9412ca00be9c162f59c730a9
TWILIO_AUTH_TOKEN=c7bd3e155e3230eb6a162f274112b5b7
```

### Step 2: Get Twilio Phone Number

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Phone Numbers → Manage → Active Numbers**
3. Copy your Twilio phone number (format: `+1234567890`)

If you don't have one:
- Click "Buy a number"
- Choose a number with SMS capabilities
- Purchase it (usually $1-2/month)

### Step 3: Configure Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `mari-gunting`
3. Go to **Authentication** → **Providers**
4. Find **Phone** provider
5. Enable **Phone Sign-In**

6. Configure Twilio:
   ```
   Twilio Account SID: AC93abceea9412ca00be9c162f59c730a9
   Twilio Auth Token: c7bd3e155e3230eb6a162f274112b5b7
   Twilio Phone Number: +1... (your Twilio number)
   ```

7. **Message Template** (optional):
   ```
   Your {{ .SiteName }} verification code is: {{ .Code }}
   ```

8. Click **Save**

### Step 4: Enable Phone Confirmation

Still in **Authentication → Providers → Phone**:

- ✅ Enable **Confirm phone number**
- Set **OTP expiry**: `60` seconds (or 300 for 5 minutes)
- Set **OTP length**: `6` digits

### Step 5: Test Configuration

1. In Supabase Dashboard → Authentication → Users
2. Click "Invite user"
3. Try sending a test SMS to your phone
4. If you receive the SMS, configuration is correct!

---

## 📋 Alternative: Use Supabase's Twilio Integration

If you want Supabase to handle everything:

### Option A: Use Supabase's Built-in SMS (Recommended)

Supabase has partnered with Message bird for SMS. This is easier but costs more:

1. In Supabase Dashboard → **Authentication** → **Settings**
2. Enable **Phone Sign-ups**
3. Supabase automatically handles SMS (they charge you)

**Pros:**
- ✅ No Twilio setup needed
- ✅ Works out of the box
- ✅ Easier configuration

**Cons:**
- 💰 More expensive than Twilio
- 💰 Billed through Supabase

### Option B: Keep using Twilio (Cheaper)

Use the steps above to configure your own Twilio account.

**Pros:**
- 💰 Cheaper (Twilio prices)
- 🎛️ More control
- 📊 Better analytics in Twilio dashboard

**Cons:**
- 🔧 More setup required
- 🛠️ Need to manage Twilio account

---

## 🧪 Testing After Configuration

Once configured, test the authentication:

```bash
# Restart your app
killall -9 node
cd apps/customer && npm start -- --clear
```

Then:
1. Open app
2. Enter your real phone number
3. Tap "Continue"
4. Check your phone for SMS with 6-digit OTP
5. Enter the OTP
6. ✅ Should work!

---

## 🐛 Troubleshooting

### Issue: Still not receiving SMS

**Check:**
1. Twilio credentials are correct in Supabase
2. Twilio phone number is correct
3. Twilio account is active (not suspended)
4. Twilio account has credit/balance
5. Your phone number is in correct format: `+60123456789`

### Issue: "Invalid phone number"

**Solution:**
- Phone must be in E.164 format: `+[country code][number]`
- Malaysia: `+60123456789` (no spaces or dashes in backend)
- Frontend shows: `12-345 6789` but sends: `+60123456789`

### Issue: "Rate limit exceeded"

**Solution:**
- Supabase limits OTP requests (default: 1 per 60 seconds)
- Wait 60 seconds between attempts
- Or adjust in Supabase Dashboard → Authentication → Rate Limits

---

## 📊 Costs

### Twilio Pricing (As of 2024)
- **SMS to Malaysia**: ~$0.04 per message
- **Phone Number**: ~$1-2/month
- **Monthly minimum**: None

### Example:
- 100 OTP sends/month = $4
- Phone number = $1.50
- **Total**: ~$5.50/month

Compare to Supabase built-in: ~$0.10 per SMS = $10 for 100 messages

---

## ✅ Quick Setup Checklist

- [ ] Have Twilio Account SID
- [ ] Have Twilio Auth Token  
- [ ] Have Twilio Phone Number (with SMS capability)
- [ ] Configured in Supabase Dashboard → Authentication → Providers → Phone
- [ ] Enabled phone confirmations
- [ ] Set OTP expiry and length
- [ ] Tested with real phone number
- [ ] Received SMS successfully

---

## 🔗 Useful Links

- [Supabase Phone Auth Docs](https://supabase.com/docs/guides/auth/phone-login)
- [Twilio Console](https://console.twilio.com/)
- [Twilio Phone Numbers](https://console.twilio.com/us1/develop/phone-numbers/manage/active)
- [Supabase Dashboard](https://supabase.com/dashboard)

---

**Next Step:** Configure Twilio in Supabase Dashboard, then restart the app!

Last updated: 2025-10-12 06:05 UTC
