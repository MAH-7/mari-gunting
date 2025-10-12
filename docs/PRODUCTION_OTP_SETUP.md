# 🚀 Production OTP Authentication Setup Guide

Complete guide for setting up Twilio SMS OTP authentication in Mari Gunting.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Development vs Production](#development-vs-production)
3. [Twilio Setup](#twilio-setup)
4. [Supabase Setup](#supabase-setup)
5. [Environment Configuration](#environment-configuration)
6. [Deployment](#deployment)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Mari Gunting uses a dual-mode authentication system:

- **Development Mode**: Uses test OTP `123456` for easy testing
- **Production Mode**: Sends real SMS via Twilio

### Architecture

```
Client App
  ↓
sendOTP() → Supabase Edge Function → Twilio API → User's Phone
  ↓
verifyOTP() → Supabase Auth → Profile Fetch
```

---

## Development vs Production

### Development Mode
- Environment: `EXPO_PUBLIC_APP_ENV=development`
- OTP: Always `123456`
- SMS: Not sent (logged to console)
- Cost: Free
- Use for: Local development, testing

### Production Mode
- Environment: `EXPO_PUBLIC_APP_ENV=production`
- OTP: Random 6-digit code
- SMS: Sent via Twilio
- Cost: ~$0.0075 per SMS
- Use for: Live app, production testing

---

## Twilio Setup

### Step 1: Create Twilio Account

1. Go to [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up for a free account
3. Verify your email and phone number
4. You'll get **$15 trial credit**

### Step 2: Get Phone Number

1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Select a number with SMS capability
3. Purchase the number (uses trial credit)

### Step 3: Get Credentials

Navigate to your [Twilio Console Dashboard](https://console.twilio.com/)

You'll need:
- **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Auth Token**: Click "Show" to reveal
- **Phone Number**: The number you purchased (format: `+1234567890`)

**⚠️ IMPORTANT**: Keep these credentials secret!

---

## Supabase Setup

### Step 1: Run Database Migration

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open `supabase/migrations/create_otp_requests_table.sql`
3. Copy and paste the entire SQL script
4. Click "Run"

This creates:
- `otp_requests` table for rate limiting
- Indexes for performance
- RLS policies for security
- Cleanup function for old records

### Step 2: Deploy Edge Function

#### Using Supabase CLI

```bash
# Login to Supabase
npx supabase login

# Link your project
npx supabase link --project-ref <YOUR_PROJECT_REF>

# Deploy the function
npx supabase functions deploy send-otp
```

#### Set Edge Function Secrets

```bash
# Set Twilio credentials in Supabase
npx supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
npx supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token_here
npx supabase secrets set TWILIO_PHONE_NUMBER=+1234567890
```

### Step 3: Test Edge Function

```bash
curl -i --location --request POST 'https://YOUR_PROJECT.supabase.co/functions/v1/send-otp' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"phoneNumber":"+601234567890","otp":"123456"}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "sent": true,
    "messageSid": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }
}
```

---

## Environment Configuration

### Development (.env)

```env
# App Configuration
EXPO_PUBLIC_APP_ENV=development

# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Twilio (for reference, not used in dev)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Production (.env.production)

```env
# App Configuration
EXPO_PUBLIC_APP_ENV=production

# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Twilio credentials are stored in Supabase Edge Function secrets
# DO NOT put them in client-side .env files
```

---

## Deployment

### For EAS Build (Expo)

#### Development Build
```bash
# iOS
eas build --profile development --platform ios

# Android  
eas build --profile development --platform android
```

#### Production Build
```bash
# Update eas.json to use production env
# iOS
eas build --profile production --platform ios

# Android
eas build --profile production --platform android
```

### EAS Update (OTA)

```bash
# Development
eas update --branch development

# Production
eas update --branch production
```

---

## Testing

### Test Development Mode

1. Set `EXPO_PUBLIC_APP_ENV=development`
2. Restart Expo server
3. Send OTP to any phone number
4. Console should show: `🔐 DEV MODE: OTP for +601234567890 is: 123456`
5. Enter `123456` as OTP
6. Should log in successfully

### Test Production Mode

1. Set `EXPO_PUBLIC_APP_ENV=production`
2. Restart Expo server
3. Send OTP to your **verified** phone number (if using Twilio trial)
4. Check your phone for SMS
5. Enter the received OTP
6. Should log in successfully

**Note**: Twilio trial accounts can only send SMS to verified numbers. Upgrade to send to any number.

---

## Security Best Practices

### ✅ DO

- Store Twilio credentials in Supabase secrets
- Use environment variables for app configuration
- Enable RLS on all database tables
- Implement rate limiting (already done in edge function)
- Monitor OTP requests for abuse
- Use HTTPS for all API calls

### ❌ DON'T

- Hardcode Twilio credentials in client code
- Expose Twilio credentials in .env files committed to Git
- Send OTP without rate limiting
- Store OTP in plain text in database
- Allow unlimited OTP requests

---

## Rate Limiting

The edge function implements rate limiting:

- **Limit**: 3 OTP requests per phone number
- **Window**: 5 minutes
- **Response**: HTTP 429 (Too Many Requests)

Users must wait 5 minutes before requesting another OTP if they hit the limit.

---

## Cost Estimation

### Twilio Pricing (as of 2025)

- **SMS to Malaysia**: ~$0.0368 per message
- **SMS to USA**: ~$0.0079 per message
- **Monthly phone number**: ~$1.15

### Example Monthly Costs

| Users | OTP Requests | Cost (Malaysia) | Cost (USA) |
|-------|-------------|----------------|------------|
| 100   | 200         | $7.36          | $1.58      |
| 1,000 | 2,000       | $73.60         | $15.80     |
| 10,000| 20,000      | $736.00        | $158.00    |

**Note**: Most users only need 1-2 OTP per month (login/registration).

---

## Troubleshooting

### Issue: "SMS service not configured"

**Solution**: Check that Twilio secrets are set in Supabase:
```bash
npx supabase secrets list
```

Should show:
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_PHONE_NUMBER

### Issue: "Failed to send SMS"

**Possible causes**:
1. Invalid phone number format (must be E.164: `+601234567890`)
2. Twilio trial account restrictions (can only send to verified numbers)
3. Insufficient Twilio credit
4. Invalid Twilio credentials

**Check Twilio logs**:
1. Go to Twilio Console → Monitor → Logs → Messaging
2. Find your recent message attempt
3. Check error details

### Issue: "Too many OTP requests"

**Solution**: Wait 5 minutes before requesting another OTP. This is intentional rate limiting.

### Issue: Dev mode not working

**Check**:
1. `EXPO_PUBLIC_APP_ENV=development` in `.env`
2. Restart Expo server after changing `.env`
3. Clear Metro bundler cache: `npx expo start -c`

### Issue: OTP not received in production

**Checklist**:
1. Phone number is in E.164 format
2. Twilio trial: phone number is verified in Twilio Console
3. Twilio account has credit
4. Check Twilio Messaging logs for errors
5. Check Supabase Edge Function logs

---

## Monitoring

### Supabase Edge Function Logs

```bash
# View real-time logs
npx supabase functions logs send-otp --follow
```

### Database Queries

Check recent OTP requests:
```sql
SELECT 
  phone_number,
  status,
  created_at
FROM otp_requests
ORDER BY created_at DESC
LIMIT 50;
```

Check rate limit hits:
```sql
SELECT 
  phone_number,
  COUNT(*) as request_count
FROM otp_requests
WHERE created_at > NOW() - INTERVAL '5 minutes'
GROUP BY phone_number
HAVING COUNT(*) >= 3;
```

---

## Upgrade from Trial

When you're ready for production:

1. **Upgrade Twilio Account**
   - Go to Twilio Console → Billing
   - Add payment method
   - Remove trial restrictions

2. **Test with Real Users**
   - Send OTP to non-verified numbers
   - Monitor costs in Twilio Console

3. **Set up Alerts**
   - Twilio: Set spending alerts
   - Supabase: Set usage alerts

---

## Support

- **Twilio Support**: [support.twilio.com](https://support.twilio.com)
- **Supabase Support**: [supabase.com/support](https://supabase.com/support)
- **Project Issues**: [GitHub Issues](https://github.com/yourusername/mari-gunting/issues)

---

## Summary Checklist

Before going to production:

- [ ] Twilio account created and verified
- [ ] Phone number purchased
- [ ] Supabase Edge Function deployed
- [ ] Twilio secrets set in Supabase
- [ ] Database migration applied
- [ ] Tested in development mode
- [ ] Tested in production mode with verified number
- [ ] Rate limiting confirmed working
- [ ] Monitoring set up
- [ ] Team knows how to check logs
- [ ] Backup plan if Twilio fails

---

**Questions? Contact your senior dev! 👨‍💻**
