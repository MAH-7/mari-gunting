# Billplz Quick Start - Do This Now! ✅

## What You Need to Do (5 Steps)

### Step 1: Get Billplz Account (5 minutes)
1. Go to https://www.billplz-sandbox.com
2. Sign up for free
3. Go to **Settings → API Keys** → Copy your **API Secret Key**
4. Go to **Collections** → Create new → Copy the **Collection ID**

### Step 2: Run Setup Script (2 minutes)
```bash
./setup-billplz.sh
```
Enter your API key and Collection ID when prompted.

**OR do it manually:**
```bash
# Install WebView
npm install react-native-webview

# Create/update .env file
echo "EXPO_PUBLIC_BILLPLZ_API_KEY=your-key-here" >> .env
echo "EXPO_PUBLIC_BILLPLZ_COLLECTION_ID=your-collection-id" >> .env
```

### Step 3: Configure Deep Links (5 minutes)

#### For iOS:
Open `apps/customer/ios/marigunting/Info.plist` and add inside `<dict>`:

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

#### For Android:
Open `apps/customer/android/app/src/main/AndroidManifest.xml` and add inside `<activity>`:

```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="marigunting" />
</intent-filter>
```

### Step 4: Restart Dev Server
```bash
npm start
```

### Step 5: Test It! 🎉
1. Open your app
2. Navigate to booking flow
3. Select **Card** or **Online Banking**
4. You'll see Billplz payment page

## Test Cards (Sandbox)

✅ **Success:** `4111 1111 1111 1111`  
❌ **Fail:** `4000 0000 0000 0002`  
CVV: Any 3 digits | Expiry: Any future date

## What Works Now

✅ **iOS** - Full integration  
✅ **Android** - Full integration  
✅ **Card payments** - Via Billplz  
✅ **Online Banking (FPX)** - Via Billplz  
✅ **Vouchers** - Applied automatically  
✅ **Credits** - Deducted automatically  

## Common Issues

**"API key not configured"**
→ Make sure you added `EXPO_PUBLIC_` prefix in .env and restarted dev server

**WebView not showing**
→ Run `pod install` in `apps/customer/ios` folder

**Deep link not working**
→ Check Info.plist and AndroidManifest.xml are updated correctly

## Need More Help?

See `BILLPLZ_SETUP.md` for detailed documentation.
