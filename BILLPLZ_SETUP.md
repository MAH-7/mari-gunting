# Billplz Integration Setup Guide

This guide will help you set up Billplz payment gateway for Mari Gunting.

## Overview

Billplz is now integrated to handle:
- **Card payments** (Visa, Mastercard)
- **Online Banking (FPX)** payments

## Prerequisites

1. A Billplz account (Sandbox or Production)
2. API Key from Billplz
3. Collection ID (you can create this from Billplz dashboard)

## Step 1: Get Your Billplz Credentials

### Sandbox (for testing)
1. Go to https://www.billplz-sandbox.com
2. Sign up for an account
3. Navigate to Settings > API Keys
4. Copy your API Secret Key
5. Go to Collections and create a new collection (or use an existing one)
6. Copy the Collection ID

### Production
1. Go to https://www.billplz.com
2. Follow the same steps as sandbox

## Step 2: Configure Your App

Add the following to your app.config.ts (customer and partner apps):

```typescript
// In extra section
extra: {
  // ... existing config
  
  // Billplz Configuration
  billplzApiKey: process.env.BILLPLZ_API_KEY,
  billplzCollectionId: process.env.BILLPLZ_COLLECTION_ID,
}
```

## Step 3: Set Environment Variables

Create or update your `.env` file in the root directory:

```bash
# Billplz Configuration (Sandbox)
BILLPLZ_API_KEY=your-sandbox-api-key-here
BILLPLZ_COLLECTION_ID=your-collection-id-here

# For production, use your production keys
```

**Important:** Never commit your `.env` file to version control!

## Step 4: Install Required Dependencies

The integration requires `react-native-webview`:

```bash
npm install react-native-webview
# or
yarn add react-native-webview
```

For iOS, install pods:
```bash
cd apps/customer/ios && pod install
```

## Step 5: Configure Deep Linking (Important!)

The payment flow uses deep links to return to the app after payment.

### iOS (apps/customer/ios/marigunting/Info.plist)

Add this inside the `<dict>` tag:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>marigunting</string>
    </array>
  </dict>
</array>
```

### Android (apps/customer/android/app/src/main/AndroidManifest.xml)

Add this inside your main activity:

```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="marigunting" />
</intent-filter>
```

## Step 6: Test the Integration

### Testing in Sandbox Mode

1. Make sure you're using sandbox credentials
2. Run your app: `npm start`
3. Navigate to booking flow and select payment
4. Choose "Card" or "Online Banking"
5. You'll be redirected to Billplz payment page

### Test Cards (Sandbox)

Billplz provides test cards for sandbox:

**Successful Payment:**
- Card Number: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date

**Failed Payment:**
- Card Number: `4000 0000 0000 0002`
- CVV: Any 3 digits
- Expiry: Any future date

### Test Banks (Sandbox - FPX)

Select any bank and use:
- Username: Any value
- Password: Any value

For successful payment, complete the flow.
For failed payment, click "Cancel" or "Back".

## Payment Flow

1. User selects payment method (Card or FPX)
2. App creates a booking in the database
3. App calls Billplz API to create a bill
4. User is redirected to Billplz payment page (WebView)
5. User completes payment
6. Billplz redirects back to app via deep link
7. App confirms payment and shows success

## Backend Callback Setup (Important!)

You need to set up a backend endpoint to receive payment callbacks from Billplz:

### Example callback endpoint (Node.js/Express):

```javascript
app.post('/api/billplz/callback', async (req, res) => {
  const {
    id,              // Bill ID
    collection_id,   // Collection ID
    paid,            // true/false
    state,           // 'paid' or 'due'
    amount,          // Amount in cents
    paid_amount,     // Amount paid in cents
    paid_at,         // ISO timestamp
    x_signature      // Signature for verification
  } = req.body;

  try {
    // Verify signature (important for security)
    // const isValid = verifyBillplzSignature(req.body, x_signature);
    // if (!isValid) {
    //   return res.status(400).json({ error: 'Invalid signature' });
    // }

    if (paid && state === 'paid') {
      // Update booking payment status in your database
      await supabase
        .from('payments')
        .update({
          payment_status: 'paid',
          paid_at: new Date(paid_at).toISOString(),
        })
        .eq('billplz_bill_id', id);

      // Update booking status
      const { data: payment } = await supabase
        .from('payments')
        .select('booking_id')
        .eq('billplz_bill_id', id)
        .single();

      if (payment) {
        await supabase
          .from('bookings')
          .update({
            payment_status: 'paid',
            paid_at: new Date(paid_at).toISOString(),
          })
          .eq('id', payment.booking_id);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Billplz callback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

Update the callback URL in `billplzService.ts` to point to your backend:

```typescript
callbackUrl: `https://your-api-domain.com/api/billplz/callback`,
```

## Troubleshooting

### "API key not configured" error
- Make sure you've added the Billplz keys to your `.env` file
- Restart your dev server after adding environment variables
- Check that `app.config.ts` is reading the env variables correctly

### WebView not loading
- Check that `react-native-webview` is properly installed
- For iOS, make sure you've run `pod install`
- Check console logs for any errors

### Deep link not working
- Verify that URL schemes are properly configured in Info.plist (iOS) and AndroidManifest.xml (Android)
- Test the deep link manually: `xcrun simctl openurl booted "marigunting://payment-success?bookingId=123"`

### Payment stuck on "Initializing payment"
- Check network connectivity
- Verify your API key and collection ID are correct
- Check console logs for API errors
- Make sure you're using the correct endpoint (sandbox vs production)

## Production Checklist

Before going to production:

- [ ] Replace sandbox API key with production API key
- [ ] Replace sandbox collection ID with production collection ID
- [ ] Update `ENV.APP_ENV` to 'production'
- [ ] Test thoroughly with real payment methods
- [ ] Set up backend callback endpoint with proper security
- [ ] Implement proper signature verification
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Test refund flow if applicable
- [ ] Update privacy policy to mention Billplz

## Support

- Billplz API Documentation: https://www.billplz.com/api
- Billplz Sandbox: https://www.billplz-sandbox.com
- Billplz Support: support@billplz.com

## Security Notes

1. **Never expose your API key** in client-side code or version control
2. **Always verify callback signatures** from Billplz to prevent fraud
3. **Use HTTPS** for all API calls and callbacks
4. **Implement rate limiting** on your callback endpoint
5. **Log all payment transactions** for audit purposes
