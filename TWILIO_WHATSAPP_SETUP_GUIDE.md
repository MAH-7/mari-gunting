# Twilio WhatsApp OTP Setup Guide
## Complete Step-by-Step Tutorial for Mari Gunting

---

## 📋 Prerequisites
- A valid email address
- A phone number with WhatsApp installed (for testing)
- Credit card (for verification, won't be charged initially)
- Your Supabase project URL and anon key

---

## PART 1: CREATE TWILIO ACCOUNT (10 minutes)

### Step 1: Sign Up for Twilio

1. **Go to Twilio website**
   ```
   https://www.twilio.com/try-twilio
   ```

2. **Fill in the signup form:**
   - First Name: Your name
   - Last Name: Your last name
   - Email: Your email
   - Password: Create a strong password
   - Check "I'm not a robot"
   - Click **Start your free trial**

3. **Verify your email:**
   - Check your email inbox
   - Click the verification link from Twilio
   - You'll be redirected back to Twilio

4. **Verify your phone number:**
   - Enter your phone number (use your real number)
   - Choose "Text me" or "Call me"
   - Enter the verification code you receive
   - Click **Submit**

5. **Complete the questionnaire:**
   - Which Twilio product are you here to use? → **Messaging**
   - What do you plan to build? → **Authentication & user verification**
   - How do you want to build? → **With code**
   - What is your preferred language? → **JavaScript**
   - Click **Get Started with Twilio**

6. **Welcome screen:**
   - You'll see your trial balance: **$15.00 USD**
   - Your trial account can send messages to verified numbers only
   - Click **Get set up** or skip to dashboard

---

## PART 2: GET TWILIO CREDENTIALS (5 minutes)

### Step 2: Find Your Account SID and Auth Token

1. **Go to Twilio Console:**
   ```
   https://console.twilio.com/
   ```

2. **On the Dashboard, you'll see:**
   ```
   Account Info
   ├── Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ├── Auth Token: [hidden] → Click "Show" to reveal
   └── My Twilio phone number: +1234567890
   ```

3. **Copy and save these credentials:**
   ```bash
   # Save these securely - you'll need them later
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

   ⚠️ **IMPORTANT:** Keep these secret! Don't share or commit to Git.

---

## PART 3: SET UP WHATSAPP SANDBOX (15 minutes)

### Step 3: Enable WhatsApp Sandbox for Testing

1. **Navigate to WhatsApp Sandbox:**
   - In Twilio Console, click **Explore Products** (left sidebar)
   - Click **Messaging**
   - Click **Try it out** → **Try WhatsApp**
   - Or go directly to: `https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn`

2. **You'll see the Sandbox page with:**
   ```
   Sandbox: +1 415 523 8886 (Twilio's test WhatsApp number)
   Join Code: join <unique-code>
   ```

3. **Join the Sandbox (on your phone):**
   - Open WhatsApp on your phone
   - Create a new message to: **+1 415 523 8886**
   - Send this exact message: **join <your-unique-code>**
     Example: `join apple-tiger`
   - You'll receive a confirmation message from Twilio
   - ✅ Your number is now connected to the sandbox!

4. **Test sending a message (optional):**
   - In Twilio Console, click **Send a test message**
   - Your number should be pre-filled
   - Add a test message and click **Send**
   - Check your WhatsApp - you should receive it!

---

## PART 4: GET MESSAGING SERVICE SID (10 minutes)

### Step 4: Create a Messaging Service

1. **Go to Messaging Services:**
   - Twilio Console → **Messaging** → **Services**
   - Or go to: `https://console.twilio.com/us1/develop/sms/services`

2. **Create new Messaging Service:**
   - Click **Create Messaging Service**
   - Friendly name: `Mari Gunting WhatsApp OTP`
   - Use case: **Verify users**
   - Click **Create Messaging Service**

3. **Configure the Messaging Service:**
   
   **Step 1: Sender Pool**
   - Click **Add Senders**
   - Select **WhatsApp Sender**
   - Check the box for your sandbox number: `+1 415 523 8886`
   - Click **Add WhatsApp Senders**
   - Click **Step 2: Integration**

   **Step 2: Integration**
   - Just click **Step 3: Set up integration** (skip for now)

   **Step 3: Set up integration**
   - Skip this for now
   - Click **Complete Messaging Service Setup**

4. **Copy your Messaging Service SID:**
   ```
   You'll see at the top:
   Messaging Service SID: MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   
   Save this:
   ```bash
   TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

---

## PART 5: CONFIGURE SUPABASE (15 minutes)

### Step 5: Enable Phone Authentication in Supabase

1. **Go to your Supabase Dashboard:**
   ```
   https://app.supabase.com/project/<your-project-ref>
   ```

2. **Navigate to Authentication settings:**
   - Click **Authentication** (left sidebar)
   - Click **Providers**
   - Scroll down to **Phone**

3. **Enable Phone Authentication:**
   - Toggle **Enable Phone provider** to ON
   - You'll see configuration options

4. **Configure Twilio Settings:**
   ```
   Provider: Twilio (default)
   
   Twilio Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   (paste from Step 2)
   
   Twilio Auth Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   (paste from Step 2)
   
   Twilio Messaging Service SID: MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   (paste from Step 4)
   ```

5. **Configure WhatsApp Template:**
   - Scroll down to **Message Template**
   - Change the template to:
   ```
   Your Mari Gunting verification code is: {{ .Code }}
   ```

6. **Save configuration:**
   - Click **Save** at the bottom
   - ✅ Phone authentication is now enabled!

---

## PART 6: UPDATE YOUR APP ENVIRONMENT (5 minutes)

### Step 6: Configure Environment Variables

1. **Open your Customer app `.env` file:**
   ```bash
   # Navigate to Customer app
   cd /Users/bos/Desktop/ProjectSideIncome/mari-gunting/Customer
   ```

2. **Check if `.env` exists:**
   ```bash
   ls -la .env
   ```

3. **Edit or create `.env` file:**
   ```bash
   # If it doesn't exist, create it
   nano .env
   ```

4. **Add/update these variables:**
   ```bash
   # Supabase Configuration
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

   # Development Mode (set to false for production)
   EXPO_PUBLIC_DEV_MODE=true
   EXPO_PUBLIC_TEST_OTP=123456

   # Twilio Configuration (optional - only if you need them in app)
   # These are usually kept on server/Supabase side
   # TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   # TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

   Save: `Ctrl+O`, `Enter`, `Ctrl+X`

5. **Do the same for Partner app:**
   ```bash
   cd /Users/bos/Desktop/ProjectSideIncome/mari-gunting/Partner
   nano .env
   ```
   (Add the same configuration)

6. **Add `.env` to `.gitignore` (if not already):**
   ```bash
   # Check if it's already there
   grep ".env" .gitignore

   # If not, add it
   echo ".env" >> .gitignore
   ```

---

## PART 7: TEST THE SETUP (20 minutes)

### Step 7: Test WhatsApp OTP in Development Mode

1. **Start your Customer app:**
   ```bash
   cd /Users/bos/Desktop/ProjectSideIncome/mari-gunting/Customer
   npx expo start
   ```

2. **Test with Development Mode OTP (no Twilio needed):**
   
   **Scenario 1: Test OTP Flow without WhatsApp**
   - Open the app on your simulator/device
   - Go to Login screen
   - Enter any valid phone number: `+628123456789`
   - Click **Send OTP via WhatsApp**
   - You should see "OTP sent" (it's mocked in dev mode)
   - Enter test OTP: `123456`
   - Click **Verify**
   - ✅ Should login successfully!

3. **Test with Real WhatsApp (Sandbox):**
   
   **Scenario 2: Test Real OTP via WhatsApp**
   - In `authService.ts`, temporarily set: `const DEV_MODE = false;`
   - Restart your app
   - Use YOUR actual phone number (the one joined to sandbox)
   - Format: `+62812XXXXXXXX` (Indonesia) or `+1XXXXXXXXXX` (US)
   - Click **Send OTP via WhatsApp**
   - ⏳ Wait 10-30 seconds
   - Check WhatsApp on your phone
   - You should receive: "Your Mari Gunting verification code is: XXXXXX"
   - Enter the 6-digit code in the app
   - Click **Verify**
   - ✅ Should login successfully!

4. **Check Twilio Console Logs:**
   - Go to: `https://console.twilio.com/us1/monitor/logs/messages`
   - You should see your message delivery status
   - Status should be: **delivered** ✅

### Step 8: Test Registration Flow

1. **Test New User Registration:**
   - Go to Register screen
   - Enter a NEW phone number: `+6281234567XX` (not in database)
   - Fill in:
     - Full Name: `Test User`
     - Phone Number: `+628123456789`
     - Select Role: `Customer` or `Partner`
   - Click **Register**
   - Check WhatsApp for OTP
   - Enter OTP in verification screen
   - ✅ Should create account and login!

2. **Verify in Supabase:**
   - Go to Supabase Dashboard
   - Click **Authentication** → **Users**
   - You should see your new user with phone number!

---

## PART 8: TROUBLESHOOTING

### Common Issues and Solutions

#### ❌ Issue 1: "Failed to send OTP"
**Solutions:**
- Check Twilio credentials in Supabase dashboard
- Verify Messaging Service SID is correct
- Check Twilio account balance (should have trial credits)
- Make sure your phone number is verified in Twilio (for trial accounts)

#### ❌ Issue 2: "Invalid OTP"
**Solutions:**
- If `DEV_MODE = true`, use test OTP: `123456`
- If `DEV_MODE = false`, use the actual code from WhatsApp
- Check if OTP expired (valid for 10 minutes)
- Try sending OTP again

#### ❌ Issue 3: Not receiving WhatsApp messages
**Solutions:**
- Make sure you joined the Twilio sandbox: send `join <code>` to +1 415 523 8886
- Check your phone number format: must include country code (+62 for Indonesia)
- Verify phone number is added to "Verified Caller IDs" in Twilio (for trial)
- Check Twilio logs for delivery status
- Wait 30 seconds - sometimes there's a delay

#### ❌ Issue 4: "Phone number not verified" (Trial Account)
**Solutions:**
- Trial accounts can only send to verified numbers
- Add your test numbers in Twilio Console:
  1. Go to `Phone Numbers` → `Manage` → `Verified Caller IDs`
  2. Click **Add a new Caller ID**
  3. Verify the phone number
  4. Now you can send OTP to this number

#### ❌ Issue 5: Supabase errors
**Solutions:**
- Check Supabase URL and anon key in `.env`
- Make sure phone auth is enabled in Supabase
- Check Supabase logs: Dashboard → Logs → Auth
- Verify database has `profiles` table with correct schema

---

## PART 9: PRODUCTION SETUP (Important!)

### Step 9: Upgrade to Production WhatsApp

⚠️ **IMPORTANT:** Sandbox is for testing only! For production, you need:

1. **Request WhatsApp Business API Access:**
   - Go to: `https://console.twilio.com/us1/develop/sms/whatsapp/senders`
   - Click **Request Access**
   - Fill in business information:
     - Business Name: `Mari Gunting`
     - Business Website: Your website URL
     - Business Description: Salon/barbershop booking platform
     - Use case: Customer authentication and appointment notifications
   - Submit request
   - ⏳ Wait 1-3 business days for approval

2. **Create WhatsApp Template (Required):**
   - After approval, create message templates
   - Go to: WhatsApp → Senders → Your sender → Message Templates
   - Create OTP template:
   ```
   Template Name: otp_verification
   Category: Authentication
   Language: Indonesian (id)
   
   Template Body:
   Kode verifikasi Mari Gunting Anda: {{1}}
   Berlaku selama 10 menit.
   ```
   - Wait for WhatsApp approval (usually 1-24 hours)

3. **Update Messaging Service:**
   - Remove sandbox number
   - Add your approved WhatsApp Business number
   - Update sender pool

4. **Disable Development Mode:**
   ```bash
   # In .env files
   EXPO_PUBLIC_DEV_MODE=false
   ```
   
   ```typescript
   // In authService.ts
   const DEV_MODE = false; // Change to false
   ```

5. **Add Billing Information:**
   - Go to Twilio Console → Billing
   - Add credit card
   - Set up auto-recharge (recommended: $20 minimum)
   - Monitor usage regularly

---

## PART 10: COST ESTIMATION

### Pricing Breakdown

**WhatsApp Messages (Indonesia):**
- Authentication conversation: ~$0.0088 per conversation
- 1 conversation = 24-hour window (multiple messages count as 1)
- OTP flow = 1 conversation (send OTP + user replies)

**Monthly Cost Estimate for Mari Gunting:**

```
Scenario: 1000 users/month
├── New registrations: 300 users × $0.0088 = $2.64
├── Logins: 700 users × $0.0088 = $6.16
└── Total: ~$8.80/month

Scenario: 5000 users/month
├── New registrations: 1500 users × $0.0088 = $13.20
├── Logins: 3500 users × $0.0088 = $30.80
└── Total: ~$44/month

Scenario: 10,000 users/month
└── Total: ~$88/month
```

**Very affordable!** Much cheaper than traditional SMS.

---

## TESTING CHECKLIST

### ✅ Complete Testing Checklist

Before deploying to production, test all these scenarios:

#### Development Mode Tests (DEV_MODE = true)
- [ ] Register new customer with test OTP (123456)
- [ ] Register new partner with test OTP (123456)
- [ ] Login existing customer with test OTP
- [ ] Login existing partner with test OTP
- [ ] Invalid OTP shows error message
- [ ] OTP screen has "Resend" button working
- [ ] Session persists after app restart

#### Sandbox Mode Tests (DEV_MODE = false, using Twilio sandbox)
- [ ] Your phone number joined sandbox
- [ ] Send OTP to your number - receives WhatsApp message
- [ ] Verify with real OTP code - success
- [ ] Try invalid code - shows error
- [ ] Resend OTP - receives new code
- [ ] Check Twilio logs show "delivered"

#### Production Tests (After WhatsApp Business approval)
- [ ] Send OTP to multiple test numbers
- [ ] Verify delivery speed (<10 seconds)
- [ ] Check message template displays correctly
- [ ] Monitor Twilio costs
- [ ] Test on both Customer and Partner apps
- [ ] Test on iOS and Android
- [ ] Test with poor internet connection
- [ ] Test phone number formats (+62, +1, etc.)

---

## SECURITY BEST PRACTICES

### 🔒 Keep Your App Secure

1. **Never commit credentials to Git:**
   ```bash
   # Always add to .gitignore
   .env
   .env.local
   .env.production
   ```

2. **Use environment variables:**
   ```bash
   # Good ✅
   process.env.EXPO_PUBLIC_SUPABASE_URL
   
   # Bad ❌
   const SUPABASE_URL = "https://xyz.supabase.co"
   ```

3. **Implement rate limiting:**
   - Limit OTP requests per phone number
   - Add cooldown between requests (60 seconds)
   - Already implemented in your `authService.ts`!

4. **Validate phone numbers:**
   - Use proper formatting
   - Verify country codes
   - Already using `libphonenumber-js` ✅

5. **Monitor for abuse:**
   - Set up Twilio usage alerts
   - Check for unusual patterns
   - Review Twilio logs regularly

---

## QUICK REFERENCE

### Important URLs

```bash
# Twilio Console
https://console.twilio.com/

# WhatsApp Sandbox
https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn

# Messaging Services
https://console.twilio.com/us1/develop/sms/services

# Twilio Logs
https://console.twilio.com/us1/monitor/logs/messages

# Supabase Dashboard
https://app.supabase.com/

# Supabase Auth Settings
https://app.supabase.com/project/<your-ref>/auth/providers
```

### Important Commands

```bash
# Start Customer app
cd Customer && npx expo start

# Start Partner app
cd Partner && npx expo start

# Check environment variables
cat .env

# View Twilio logs (if using CLI)
twilio api:core:messages:list --limit 10

# Test phone number format
node -e "const phone = require('libphonenumber-js'); console.log(phone.parsePhoneNumber('+628123456789'));"
```

### Support Contacts

```bash
# Twilio Support
https://support.twilio.com/

# Supabase Discord
https://discord.supabase.com/

# Your Implementation Guide
file:///Users/bos/Desktop/ProjectSideIncome/mari-gunting/IMPLEMENTATION_COMPLETE.md
```

---

## NEXT STEPS

### What to do after completing this guide:

1. ✅ **Complete Steps 1-8** - Set up and test with sandbox
2. 📝 **Test thoroughly** - Use testing checklist above
3. 🚀 **Request Production Access** - Submit WhatsApp Business API request (Step 9)
4. ⏳ **Wait for approval** - Usually 1-3 business days
5. 🎨 **Create message templates** - Required for production
6. 💳 **Add billing** - Set up payment method
7. 🔄 **Switch to production** - Disable dev mode
8. 🎉 **Launch!** - Your app is ready for real users

---

## SUMMARY

You've now completed:
- ✅ Created Twilio account with $15 trial credit
- ✅ Set up WhatsApp sandbox for testing
- ✅ Configured Supabase phone authentication
- ✅ Integrated Twilio with your React Native app
- ✅ Tested OTP flow in development mode
- ✅ Tested real WhatsApp OTP delivery
- ✅ Ready for production deployment

**Your Mari Gunting app now has secure, production-ready WhatsApp OTP authentication!** 🎉

---

## QUESTIONS?

If you encounter any issues not covered in this guide:

1. Check the Troubleshooting section (Part 8)
2. Review Twilio console logs
3. Check Supabase auth logs
4. Review your `authService.ts` implementation
5. Ask me for help! I'm here to assist.

Good luck with your Mari Gunting project! 🚀💈✂️
