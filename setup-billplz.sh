#!/bin/bash

echo "🚀 Billplz Integration Setup"
echo "=============================="
echo ""

# Step 1: Install dependencies
echo "📦 Step 1/4: Installing react-native-webview..."
npm install react-native-webview

# Step 2: Setup environment variables
echo ""
echo "🔐 Step 2/4: Setting up environment variables..."
echo ""
echo "Please enter your Billplz API Key (from https://www.billplz-sandbox.com):"
read BILLPLZ_API_KEY

echo "Please enter your Billplz Collection ID:"
read BILLPLZ_COLLECTION_ID

# Check if .env exists, create or update
if [ -f .env ]; then
  echo ""
  echo "📝 Updating existing .env file..."
  # Remove old entries if they exist
  sed -i.bak '/EXPO_PUBLIC_BILLPLZ/d' .env
  rm .env.bak 2>/dev/null
else
  echo ""
  echo "📝 Creating new .env file..."
fi

# Append new values
cat >> .env << EOF

# Billplz Configuration
EXPO_PUBLIC_BILLPLZ_API_KEY=$BILLPLZ_API_KEY
EXPO_PUBLIC_BILLPLZ_COLLECTION_ID=$BILLPLZ_COLLECTION_ID
EOF

echo "✅ Environment variables configured!"

# Step 3: iOS Setup
echo ""
echo "📱 Step 3/4: iOS Setup..."
if [ -d "apps/customer/ios" ]; then
  echo "Installing iOS pods..."
  cd apps/customer/ios
  pod install
  cd ../../..
  echo "✅ iOS setup complete!"
else
  echo "⚠️  iOS folder not found. Run 'npx expo prebuild' if needed."
fi

# Step 4: Instructions
echo ""
echo "📋 Step 4/4: Manual Steps Required"
echo "===================================="
echo ""
echo "For iOS (apps/customer/ios/marigunting/Info.plist):"
echo "Add this inside the <dict> tag if not already present:"
echo ""
echo "<key>CFBundleURLTypes</key>"
echo "<array>"
echo "  <dict>"
echo "    <key>CFBundleURLSchemes</key>"
echo "    <array>"
echo "      <string>marigunting</string>"
echo "    </array>"
echo "  </dict>"
echo "</array>"
echo ""
echo "For Android (apps/customer/android/app/src/main/AndroidManifest.xml):"
echo "Add this inside your MainActivity:"
echo ""
echo "<intent-filter>"
echo "  <action android:name=\"android.intent.action.VIEW\" />"
echo "  <category android:name=\"android.intent.category.DEFAULT\" />"
echo "  <category android:name=\"android.intent.category.BROWSABLE\" />"
echo "  <data android:scheme=\"marigunting\" />"
echo "</intent-filter>"
echo ""
echo "✅ Setup Complete!"
echo ""
echo "🎉 Next Steps:"
echo "1. Configure deep linking (see above)"
echo "2. Restart your dev server: npm start"
echo "3. Test payment flow in your app"
echo ""
echo "📖 See BILLPLZ_SETUP.md for detailed documentation"
