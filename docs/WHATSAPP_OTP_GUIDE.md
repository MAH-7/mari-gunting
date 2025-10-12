# 📱 WhatsApp OTP Implementation Guide

## Overview
How to implement WhatsApp OTP for Mari-Gunting authentication.

---

## 🎯 **Recommended Approach: Twilio WhatsApp**

### **Why Twilio?**
- ✅ Easiest to implement
- ✅ Works in Malaysia
- ✅ Cheaper than SMS ($0.005 vs $0.03)
- ✅ Can fallback to SMS if WhatsApp fails
- ✅ Higher delivery rates

---

## 📋 **Setup Steps**

### **1. Create Twilio Account**

1. Sign up: https://www.twilio.com/try-twilio
2. Get $15 free trial credit
3. Verify your email and phone

### **2. Enable WhatsApp**

1. Go to Twilio Console
2. Navigate to "Messaging" → "Try it out" → "Send a WhatsApp message"
3. Connect your test WhatsApp number
4. Get your WhatsApp-enabled Twilio number

### **3. Get Credentials**

You'll need:
- Account SID: `ACxxxxxxxxxxxx`
- Auth Token: `your_auth_token`
- WhatsApp Number: `whatsapp:+14155238886` (Twilio sandbox for testing)

---

## 💻 **Implementation**

### **Option A: Supabase Edge Functions (Recommended)**

Create a serverless function to handle WhatsApp OTP:

**File:** `supabase/functions/send-whatsapp-otp/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
const twilioWhatsAppNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER')

serve(async (req) => {
  try {
    const { phone } = await req.json()

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Store OTP in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    await supabase.from('otp_codes').insert({
      phone,
      code: otp,
      expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    })

    // Send via Twilio WhatsApp
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`
    
    const formData = new URLSearchParams({
      From: `whatsapp:${twilioWhatsAppNumber}`,
      To: `whatsapp:${phone}`,
      Body: `Your Mari-Gunting verification code is: ${otp}. Valid for 5 minutes.`,
    })

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    })

    if (!twilioResponse.ok) {
      throw new Error('Failed to send WhatsApp message')
    }

    return new Response(
      JSON.stringify({ success: true, message: 'OTP sent via WhatsApp' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

### **Option B: Your Own Backend Service**

If you prefer Node.js backend:

```typescript
// backend/services/whatsapp-otp.ts
import twilio from 'twilio';
import { supabase } from './supabase';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendWhatsAppOTP(phone: string) {
  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store in database
  await supabase.from('otp_codes').insert({
    phone,
    code: otp,
    expires_at: new Date(Date.now() + 5 * 60 * 1000),
  });

  // Send via WhatsApp
  await client.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    to: `whatsapp:${phone}`,
    body: `Your Mari-Gunting verification code is: ${otp}. Valid for 5 minutes.`,
  });

  return { success: true };
}

export async function verifyWhatsAppOTP(phone: string, code: string) {
  const { data, error } = await supabase
    .from('otp_codes')
    .select('*')
    .eq('phone', phone)
    .eq('code', code)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    return { success: false, error: 'Invalid or expired OTP' };
  }

  // Delete used OTP
  await supabase.from('otp_codes').delete().eq('id', data.id);

  // Create auth session
  // ... your session creation logic

  return { success: true };
}
```

---

## 🗄️ **Database Table for OTPs**

Add to your migrations:

```sql
-- Create OTP codes table
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX idx_otp_codes_phone ON otp_codes(phone);
CREATE INDEX idx_otp_codes_expires ON otp_codes(expires_at);

-- Auto-cleanup expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_codes WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

---

## 📱 **Client-Side Implementation**

Update your auth service:

```typescript
// packages/shared/services/auth.ts

export const sendWhatsAppOTP = async (phone: string) => {
  try {
    const formattedPhone = formatPhoneNumber(phone); // +60123456789
    
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/send-whatsapp-otp`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ phone: formattedPhone }),
      }
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('WhatsApp OTP error:', error);
    return { success: false, error: 'Failed to send OTP' };
  }
};

export const verifyWhatsAppOTP = async (phone: string, code: string) => {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/verify-whatsapp-otp`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ phone, code }),
      }
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('OTP verification error:', error);
    return { success: false, error: 'Verification failed' };
  }
};
```

---

## 🎨 **UI Flow**

```
┌─────────────────────────┐
│   Enter Phone Number    │
│   +60 123 456 789       │
│   [Send OTP]            │
└─────────────────────────┘
           ↓
┌─────────────────────────┐
│   OTP sent to WhatsApp! │
│   Enter 6-digit code:   │
│   [ ][ ][ ][ ][ ][ ]    │
│   [Verify]              │
└─────────────────────────┘
           ↓
┌─────────────────────────┐
│   ✅ Success!           │
│   Redirecting...        │
└─────────────────────────┘
```

---

## 💰 **Cost Comparison**

| Method | Cost per Message | Delivery Rate | User Preference (Malaysia) |
|--------|------------------|---------------|---------------------------|
| WhatsApp | $0.005 | ~99% | ⭐⭐⭐⭐⭐ |
| SMS | $0.03 | ~95% | ⭐⭐⭐ |
| Email | Free | ~80% | ⭐⭐ |

**WhatsApp is 6x cheaper than SMS!**

---

## 🚀 **Implementation Timeline**

### **Phase 1: MVP (Now)**
- Use email authentication
- Works immediately
- No SMS costs

### **Phase 2: Add SMS** 
- Integrate Twilio SMS
- For users who prefer SMS
- ~$0.03 per message

### **Phase 3: Add WhatsApp** (Recommended)
- Integrate Twilio WhatsApp
- Better user experience
- Cheaper costs
- ~$0.005 per message

---

## 📝 **Recommendation for Mari-Gunting**

**Best Approach:**

1. **Launch with Email auth** (working now) ✅
2. **Add Twilio account** with both:
   - SMS capability (fallback)
   - WhatsApp capability (primary)
3. **Smart routing:**
   - Try WhatsApp first
   - Fall back to SMS if WhatsApp fails
   - User can choose preference

**Code Example:**
```typescript
async function sendOTP(phone: string, method: 'whatsapp' | 'sms' = 'whatsapp') {
  if (method === 'whatsapp') {
    const result = await sendWhatsAppOTP(phone);
    if (result.success) return result;
    
    // Fallback to SMS
    console.log('WhatsApp failed, trying SMS...');
    return sendSMSOTP(phone);
  }
  
  return sendSMSOTP(phone);
}
```

---

## ✅ **Action Items**

For production launch:

1. ✅ Email auth is working (use this for now)
2. 🔜 Create Twilio account (~5 mins)
3. 🔜 Enable WhatsApp in Twilio (~10 mins)
4. 🔜 Implement Edge Function (~30 mins)
5. 🔜 Test with your number (~5 mins)
6. 🔜 Deploy to production

**Total setup time: ~1 hour**

---

## 🎯 **Current Status**

✅ Email authentication working  
⏳ WhatsApp OTP ready to implement  
💡 Recommended: Add after MVP launch to save time now  

**Would you like me to implement WhatsApp OTP now, or proceed with other infrastructure tasks and add this later?**
