#!/bin/bash

echo "🔧 Fixing NativeWind Styling..."
echo ""

echo "📦 Step 1: Clearing caches..."
rm -rf node_modules/.cache
rm -rf .expo
echo "✅ Caches cleared!"
echo ""

echo "🚀 Step 2: Starting app with clear cache..."
echo "⏳ This may take a minute..."
echo ""

npm start -- --clear
